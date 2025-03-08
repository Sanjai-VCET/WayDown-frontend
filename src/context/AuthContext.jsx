import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
} from "firebase/auth";
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
    throttle(async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("user");
        return null;
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await retryWithBackoff(() =>
          api.get(`/api/users/${firebaseUser.uid}`, {
            timeout: 5000,
            headers: { Authorization: `Bearer ${idToken}` },
          })
        ).catch(err => {
          console.error("Error fetching user data:", err);
          throw err; // Rethrow the error for further handling
        });

        const userData = response.data || {};
        if (!userData) {
          throw new Error("User data not found");
        }

        const user = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || userData.name || "",
          email: firebaseUser.email || userData.email || "",
          avatar: firebaseUser.photoURL || userData.avatar || "",
          interests: userData.interests || [],
          isAdmin: userData.isAdmin || false,
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(user));
        setToken(idToken);
        localStorage.setItem("token", idToken);
        return user;
      } catch (err) {
        console.error("Failed to sync user with backend:", err.message);
        if (err.response?.status === 403) {
          await logout();
        } else {
          const fallbackUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            avatar: firebaseUser.photoURL || "",
            interests: [],
            isAdmin: false,
          };
          setCurrentUser(fallbackUser);
          setIsAuthenticated(true);
          localStorage.setItem("user", JSON.stringify(fallbackUser));
          return fallbackUser;
        }
      }
    }, 2000), // Throttle to 1 call every 2 seconds
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      await syncUserWithBackend(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserWithBackend]);

  const login = useCallback(
    async (email, password) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return await syncUserWithBackend(userCredential.user);
      } catch (err) {
        console.error("Login error:", err);
        throw new Error(err.message || "Login failed");
      }
    },
    [syncUserWithBackend]
  );

  const signup = useCallback(
    async (name, email, password, interests = []) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        await updateFirebaseProfile(firebaseUser, { displayName: name });

        const userData = {
          id: firebaseUser.uid,
          name,
          email,
          avatar: firebaseUser.photoURL || "",
          interests,
          isAdmin: false,
        };
        const idToken = await firebaseUser.getIdToken().catch(err => {
          console.error("Error getting ID token:", err);
          throw err; // Rethrow the error for further handling
        });

        await api.post(`/api/users/${firebaseUser.uid}`, userData, {
          timeout: 5000,
          headers: { Authorization: `Bearer ${idToken}` },
        });

        return await syncUserWithBackend(firebaseUser);
      } catch (err) {
        console.error("Signup error:", err);
        throw new Error(err.message || "Signup failed");
      }
    },
    [syncUserWithBackend]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
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
        if (userData.name && userData.name !== currentUser.name) updates.displayName = userData.name;
        if (userData.avatar && userData.avatar !== currentUser.avatar) updates.photoURL = userData.avatar;
        if (Object.keys(updates).length > 0) {
          await updateFirebaseProfile(auth.currentUser, updates);
        }

        const updatedUser = { ...currentUser, ...userData };
        const idToken = await auth.currentUser.getIdToken();
        await api.put(`/api/users/${currentUser.id}`, updatedUser, {
          timeout: 5000,
          headers: { Authorization: `Bearer ${idToken}` },
        });

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
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
