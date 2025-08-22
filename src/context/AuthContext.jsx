import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../api/api";

// Throttle function to limit API calls
const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return func(...args);
  };
};

// Retry with exponential backoff
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status === 429 && i < retries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`Retrying in ${waitTime}ms due to 429...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw err;
    }
  }
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const syncUserWithBackend = useCallback(
    throttle(async (token) => {
      if (!token) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        return null;
      }

      try {
        const response = await retryWithBackoff(() =>
          api.get("/api/auth/status", {
            timeout: 5000,
            headers: { Authorization: `Bearer ${token}` },
          })
        );

        const userData = response.data.user || {};
        if (!userData) {
          throw new Error("User data not found");
        }

        const user = {
          id: userData.userId,
          name: userData.username || "",
          email: userData.email || "",
          avatar: userData.profilePic || "",
          interests: userData.interests || [],
          isAdmin: userData.isAdmin || false,
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(user));
        setToken(token);
        localStorage.setItem("token", token);
        return user;
      } catch (err) {
        console.error("Failed to sync user with backend:", err.message);
        if (err.response?.status === 403) {
          await logout();
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        }
        return null;
      }
    }, 2000),
    []
  );

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await api.post("/api/auth/refresh", { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      setToken(accessToken);
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      await syncUserWithBackend(accessToken);
      return accessToken;
    } catch (err) {
      console.error("Token refresh failed:", err);
      await logout();
      throw new Error("Session expired. Please log in again.");
    }
  }, [syncUserWithBackend]);

  // Axios interceptor for handling 403 errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 403 &&
          error.response?.data?.error.includes("expired") &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => api.interceptors.response.eject(interceptor);
  }, [refreshAccessToken]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setLoading(true);
    syncUserWithBackend(storedToken).then(() => setLoading(false));
  }, [syncUserWithBackend]);

  const login = useCallback(
    async (email, password) => {
      try {
        const response = await api.post("/api/auth/login", { email, password });
        const { accessToken, refreshToken, userId, email: userEmail, username } = response.data;
        localStorage.setItem("refreshToken", refreshToken); // Store refresh token
        const user = await syncUserWithBackend(accessToken);
        return { ...user, refreshToken };
      } catch (err) {
        console.error("Login error:", err);
        throw new Error(err.response?.data?.error || "Login failed");
      }
    },
    [syncUserWithBackend]
  );

  const signup = useCallback(
    async (name, email, password, interests = []) => {
      try {
        const response = await api.post("/api/auth/register", {
          email,
          password,
          displayName: name,
        });
        const { accessToken, refreshToken, userId, email: userEmail, username } = response.data;
        localStorage.setItem("refreshToken", refreshToken); // Store refresh token
        const user = await syncUserWithBackend(accessToken);
        if (interests.length > 0) {
          await api.post(`/api/users/${userId}/interests`, { interests }, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
        return { ...user, refreshToken };
      } catch (err) {
        console.error("Signup error:", err);
        throw new Error(err.response?.data?.error || "Signup failed");
      }
    },
    [syncUserWithBackend]
  );

  const logout = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        await api.post("/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
      }
      setCurrentUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    } catch (err) {
      console.error("Logout error:", err);
      throw new Error("Logout failed");
    }
  }, []);

  const updateProfile = useCallback(
    async (userData) => {
      if (!currentUser) throw new Error("No user logged in");

      try {
        const updates = {};
        if (userData.name && userData.name !== currentUser.name) updates.username = userData.name;
        if (userData.avatar && userData.avatar !== currentUser.avatar) updates.profilePic = userData.avatar;
        if (userData.interests) updates.interests = userData.interests;

        const token = localStorage.getItem("token");
        await api.put(`/api/users/${currentUser.id}`, updates, {
          timeout: 5000,
          headers: { Authorization: `Bearer ${token}` },
        });

        const updatedUser = { ...currentUser, ...userData };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      } catch (err) {
        console.error("Update profile error:", err);
        throw new Error("Failed to update profile");
      }
    },
    [currentUser]
  );

  const value = {
    currentUser,
    token,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    syncUserWithBackend,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;