import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { getIdToken } from "firebase/auth";

// Throttle function
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

const SpotContext = createContext();

export const useSpots = () => {
  const context = useContext(SpotContext);
  if (!context) throw new Error("useSpots must be used within a SpotProvider");
  return context;
};

export const SpotProvider = ({ children }) => {
  const [spots, setSpots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);

  const fetchSpots = useCallback(
    throttle(async () => {
      try {
        const { data } = await retryWithBackoff(() =>
          axios.get("https://waydown-backend.onrender.com/api/spots", { timeout: 5000 })
        );
        const spotsData = Array.isArray(data) ? data : [];
        setSpots(spotsData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load spots.");
        setLoading(false);
      }
    }, 2000),
    []
  );

  const getFavorites = useCallback(
    async (uid) => {
      if (!uid) return [];
      try {
        const token = await getIdToken(auth.currentUser);
        const response = await retryWithBackoff(() =>
          axios.get(`https://waydown-backend.onrender.com/api/users/${uid}/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        return response.data || [];
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        return [];
      }
    },
    []
  );

  const syncFavorites = useCallback(
    throttle(async () => {
      if (!user) {
        setFavorites([]);
        return;
      }
      try {
        const token = await getIdToken(user);
        const { data } = await retryWithBackoff(() =>
          axios.get(`https://waydown-backend.onrender.com/api/users/${user.uid}/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          })
        );
        const favoriteIds = data.favoriteIds || [];
        setSpots((prev) =>
          Array.isArray(prev)
            ? prev.map((spot) => ({
                ...spot,
                isFavorite: favoriteIds.includes(spot.id),
              }))
            : []
        );
        setFavorites((prev) =>
          Array.isArray(prev)
            ? prev.filter((spot) => favoriteIds.includes(spot.id))
            : []
        );
        setError(null);
      } catch (err) {
        console.error("Sync favorites error:", err);
        setError("Failed to sync favorites.");
      }
    }, 2000),
    [user]
  );

  const calculateDistance = useCallback((spotCoords, userCoords) => {
    if (!userCoords) return null;
    const R = 6371;
    const dLat = (userCoords.lat - spotCoords.lat) * (Math.PI / 180);
    const dLon = (userCoords.lon - spotCoords.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(spotCoords.lat * (Math.PI / 180)) *
      Math.cos(userCoords.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }, []);

  const calculateAverageRating = useCallback((reviews) => {
    if (!reviews || reviews.length === 0) return "0.0";
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, []);

  useEffect(() => {
    fetchSpots();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setSpots((prev) =>
            Array.isArray(prev)
              ? prev.map((spot) => ({
                  ...spot,
                  distance: calculateDistance(spot.coordinates, userCoords),
                }))
              : []
          );
        },
        () => setError("Geolocation unavailable. Distances may be inaccurate.")
      );
    }
  }, [fetchSpots, calculateDistance]);

  useEffect(() => {
    if (user) syncFavorites();
  }, [user, syncFavorites]);

  const getAllSpots = useCallback(() => spots, [spots]);

  const getSpotById = useCallback(
    (id) => {
      const spotId = Number(id);
      return spots.find((spot) => spot.id === spotId) || null;
    },
    [spots]
  );

  const toggleFavorite = useCallback(
    async (spotId) => {
      if (!user) {
        setError("Please log in to manage favorites.");
        return;
      }
      const spot = spots.find((s) => s.id === spotId);
      if (!spot) {
        setError("Spot not found.");
        return;
      }

      const newFavoriteStatus = !spot.isFavorite;
      try {
        const token = await getIdToken(user);
        await retryWithBackoff(() =>
          axios.post(
            `https://waydown-backend.onrender.com/api/users/${user.uid}/favorites`,
            { spotId, isFavorite: newFavoriteStatus },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          )
        );
        setSpots((prev) =>
          Array.isArray(prev)
            ? prev.map((s) =>
                s.id === spotId ? { ...s, isFavorite: newFavoriteStatus } : s
              )
            : []
        );
        setFavorites((prev) =>
          Array.isArray(prev)
            ? newFavoriteStatus
              ? [...prev, { ...spot, isFavorite: true }]
              : prev.filter((s) => s.id !== spotId)
            : []
        );
      } catch (err) {
        console.error("Toggle favorite error:", err);
        setError("Failed to toggle favorite.");
      }
    },
    [spots, user]
  );

  const addReview = useCallback(
    async (spotId, review) => {
      if (!user) {
        setError("Please log in to add a review.");
        return;
      }
      if (!review.rating || !review.comment) {
        setError("Review must include rating and comment.");
        return;
      }

      try {
        const token = await getIdToken(user);
        const { data } = await retryWithBackoff(() =>
          axios.post(
            `https://waydown-backend.onrender.com/api/spots/${spotId}/reviews`,
            {
              ...review,
              userId: user.uid,
              username: user.displayName || "Anonymous",
            },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
          )
        );
        setSpots((prev) =>
          Array.isArray(prev)
            ? prev.map((spot) =>
                spot.id === spotId
                  ? {
                      ...spot,
                      reviews: data.reviews,
                      rating: calculateAverageRating(data.reviews),
                    }
                  : spot
              )
            : []
        );
      } catch (err) {
        console.error("Add review error:", err);
        setError("Failed to add review.");
      }
    },
    [user, calculateAverageRating]
  );

  const searchSpots = useCallback(
    (query) => {
      if (!query) return spots;
      const q = query.toLowerCase();
      return spots.filter(
        (spot) =>
          spot.name.toLowerCase().includes(q) ||
          spot.location.toLowerCase().includes(q) ||
          spot.category.toLowerCase().includes(q) ||
          spot.description.toLowerCase().includes(q)
      );
    },
    [spots]
  );

  const filterByCategory = useCallback(
    (category) => {
      return category && category !== "All"
        ? spots.filter((spot) => spot.category === category)
        : spots;
    },
    [spots]
  );

  const sortSpots = useCallback((spotsToSort, sortBy) => {
    const sorted = [...spotsToSort];
    switch (sortBy) {
      case "distance":
        return sorted.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  }, []);

  const value = useMemo(
    () => ({
      spots,
      loading,
      error,
      favorites,
      getAllSpots,
      getSpotById,
      toggleFavorite,
      getFavorites,
      addReview,
      searchSpots,
      filterByCategory,
      sortSpots,
    }),
    [
      spots,
      loading,
      error,
      favorites,
      getAllSpots,
      getSpotById,
      toggleFavorite,
      getFavorites,
      addReview,
      searchSpots,
      filterByCategory,
      sortSpots,
    ]
  );

  return (
    <SpotContext.Provider value={value}>
      {loading ? (
        <div className="text-center py-5" aria-live="polite">
          Loading spots...
        </div>
      ) : error ? (
        <div className="text-center py-5 text-danger" aria-live="polite">
          {error}
        </div>
      ) : (
        children
      )}
    </SpotContext.Provider>
  );
};

SpotProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SpotProvider;