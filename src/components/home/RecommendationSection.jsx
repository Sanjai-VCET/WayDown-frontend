import { useState, useEffect, useCallback } from "react";
import { Alert, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import SpotCard from "./SpotCard"; // Ensure correct import path

const RecommendationSection = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // Fetch recommended spots
  const fetchRecommendations = useCallback(async () => {
    try {
      if (!user) return; // Skip if not logged in
      const token = await user.getIdToken();
      const response = await axios.get(
        "http://localhost:3000/api/spots/recommend",
        {
          params: { page: 1, limit: 3 },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );

      // Map data to SpotCard's expected props
      const mappedRecommendations = (response.data.spots || []).map((spot) => ({
        id: spot._id,
        name: spot.name,
        images: spot.photos.map((photo) => photo.url), // Ensure photos are URLs
        category: "Recommended", // Set a default category
        rating: spot.averageRating || 0,
        reviews: spot.comments || [],
        description: spot.content || "No description available",
        location: spot.city || "N/A",
        distance: null, // Recommendations don't need distance
        isFavorite: false, // Default value
      }));

      setRecommendations(mappedRecommendations);
      setLoading(false);
    } catch (err) {
      console.error("Recommendation error:", err);
      setError("Failed to load recommendations. Please try again.");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchRecommendations();
    } else if (!userLoading) {
      setLoading(false); // Stop loading if no user
    }
  }, [user, userLoading, fetchRecommendations]);

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
      {!user ? (
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