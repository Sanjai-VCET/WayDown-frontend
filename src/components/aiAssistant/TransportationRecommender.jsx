import { useState, useEffect, useCallback } from "react";
import { Card, ListGroup, Badge, Spinner } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types"; // For type checking

const TransportationRecommender = ({ destination }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch transportation options from backend
  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/transportation-options", {
        params: { destination: destination || "global" }, // Default to "global" if destination is undefined
        timeout: 5000,
      });

      // Ensure response is an array
      setOptions(response.data || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to load transportation options. Please try again.");
      setLoading(false);
    }
  }, [destination]);

  // Fetch options on mount or when destination changes
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Loading state
  if (loading) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading transportation options...
        </Card.Body>
      </Card>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center text-danger">
          {error}
          <div>
            <button className="btn btn-link p-0 mt-2" onClick={fetchOptions}>
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
          <i className="bi bi-car-front text-primary me-2"></i>
          Transportation Options
          {destination && <small className="text-muted ms-2">for {destination}</small>}
        </Card.Title>

        <ListGroup variant="flush">
          {options.length > 0 ? (
            options.map((option, index) => (
              <ListGroup.Item key={option.id || index} className="px-0 py-2 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className={`bi bi-${option.icon || "car-front"} me-2`} />
                    {option.name}
                  </div>
                  {option.recommended && <Badge bg="success">Recommended</Badge>}
                </div>
                <small className="text-muted d-block mt-1">{option.description || "No details available."}</small>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="px-0 py-2 text-muted">
              No transportation options available for {destination || "this location"}.
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

// PropTypes for type checking
TransportationRecommender.propTypes = {
  destination: PropTypes.string, // Optional destination prop
};

export default TransportationRecommender;
