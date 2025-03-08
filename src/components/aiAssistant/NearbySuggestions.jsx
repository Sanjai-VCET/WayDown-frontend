import { useState, useEffect, useCallback, useContext } from "react";
import { Card, ListGroup, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../api/api"; // Import configured Axios instance
import { AuthProvider } from "../../context/AuthContext";
import PropTypes from "prop-types";

const NearbySuggestions = ({ userLocation }) => {
  const { token } = useContext(AuthProvider); // Use token if needed
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const params = userLocation
        ? { lat: userLocation.lat, lon: userLocation.lng, radius: 500000, page: 1, limit: 9 }
        : { lat: 40.7128, lon: -74.0060, radius: 50000, page: 1, limit: 9 }; // Default to NYC
      const response = await api.get("/api/spots/nearby", {
        params,
        timeout: 5000,
        headers: token ? { Authorization: `Bearer ${token}` } : {}, // Optional auth
      });
      setSuggestions(response.data.spots || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to load nearby spots. Please try again.");
      setLoading(false);
    }
  }, [userLocation, token]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (loading) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading nearby spots...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center text-danger">
          {error}
          <div>
            <button className="btn btn-link p-0 mt-2" onClick={fetchSuggestions}>
              Retry
            </button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title>
          <i className="bi bi-geo-alt text-primary me-2"></i>
          Nearby Hidden Spots
        </Card.Title>
        <ListGroup variant="flush">
          {suggestions.length > 0 ? (
            suggestions.map((spot) => (
              <ListGroup.Item key={spot._id} className="px-0 py-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <Link to={`/spots/${spot._id}`} className="text-decoration-none text-dark">
                    {spot.name}
                  </Link>
                  <span className="text-muted small">
                    {/* Calculate distance if available in response */}
                    {spot.distance ? `${spot.distance} km` : "Nearby"}
                  </span>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="px-0 py-2 text-muted">
              No nearby spots found.
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

NearbySuggestions.propTypes = {
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};

export default NearbySuggestions;