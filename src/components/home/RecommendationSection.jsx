import { useState, useEffect, useCallback } from "react";
import { Alert, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import SpotCard from "./SpotCard";

const RecommendationSection = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, token, loading: authLoading } = useAuth();

  // Fetch recommended spots
  const fetchRecommendations = useCallback(async () => {
    try {
      if (!isAuthenticated || !token) {
        setError("Please log in to see personalized recommendations.");
        setLoading(false);
        return;
      }

      console.log("Fetching recommendations with token:", token); // Debug token
      const response = await axios.get("https://waydown-backend.onrender.com/api/spots/recommend", {
        params: { page: 1, limit: 3 },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      const mappedRecommendations = (response.data.spots || []).map((spot) => ({
        id: spot._id,
        name: spot.name || "Unnamed Spot",
        photos: spot.photos?.map((photo) => photo.url) || [],
        tags: spot.tags || [],
        location: spot.location || { coordinates: [] },
        averageRating: spot.averageRating || 0,
        comments: spot.comments || [],
        content: spot.content || "No description available",
        distance: null,
        likedBy: spot.likedBy || [],
      }));

      setRecommendations(mappedRecommendations);
      setLoading(false);
    } catch (err) {
      console.error("Recommendation error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = "Failed to load recommendations. Please try again.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.response?.status === 404) {
        errorMessage = "Recommendation service unavailable or user not found.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      setError(errorMessage);
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchRecommendations();
    } else if (!authLoading) {
      setError("Please log in to see personalized recommendations.");
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchRecommendations]);

  return (
    <div className="mb-4">
      {/* Loading state */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Recommendations content */}
      {!isAuthenticated ? (
        <div className="text-center mt-4">
          <p>Please log in to see personalized recommendations.</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center mt-4">
          <p>No recommendations available.</p>
        </div>
      ) : (
        <>
          <h4 className="mb-3">Recommended for You</h4>
          <Row xs={1} md={3} className="g-4">
            {recommendations.map((spot) => (
              <Col key={spot.id}>
                <SpotCard spot={spot} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

export default RecommendationSection;