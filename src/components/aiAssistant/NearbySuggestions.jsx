import { useState, useEffect, useCallback } from "react";
import { Card, ListGroup, Spinner, Button } from "react-bootstrap"; // Added Button for retry
import { Link } from "react-router-dom";
import api from "../../api/api"; // Import configured Axios instance
import { useAuth } from "../../context/AuthContext"; // Use `useAuth` instead of `useContext(AuthProvider)`
import PropTypes from "prop-types";
import {
  GeoAlt,
  ExclamationTriangle,
  ArrowRepeat,
  InfoCircle,
  Map,
} from "react-bootstrap-icons"; // Import icons

const NearbySuggestions = ({ userLocation }) => {
  const { token } = useAuth(); // Correct way to access auth context
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
          <Spinner animation="border" size="sm" className="me-2" /> {/* Use Bootstrap Spinner */}
          Loading nearby spots...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center text-danger">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <ExclamationTriangle size={20} /> {/* Add error icon */}
            {error}
          </div>
          <Button
            variant="link"
            className="p-0 mt-2"
            onClick={fetchSuggestions}
            style={{ display: "flex", alignItems: "center", gap: "5px", margin: "0 auto" }}
          >
            <ArrowRepeat size={16} /> {/* Add retry icon */}
            Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title className="d-flex align-items-center gap-2">
          <GeoAlt size={20} className="text-primary" /> {/* Replace bi-geo-alt */}
          Nearby Hidden Spots
        </Card.Title>
        <ListGroup variant="flush">
          {suggestions.length > 0 ? (
            suggestions.map((spot) => (
              <ListGroup.Item key={spot._id} className="px-0 py-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <Link
                    to={`/spots/${spot._id}`}
                    className="text-decoration-none text-dark d-flex align-items-center gap-2"
                  >
                    <Map size={16} /> {/* Add map icon for suggestions */}
                    {spot.name}
                  </Link>
                  <span className="text-muted small">
                    {spot.distance ? `${spot.distance} km` : "Nearby"}
                  </span>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="px-0 py-2 text-muted d-flex align-items-center gap-2">
              <InfoCircle size={16} /> {/* Add empty state icon */}
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