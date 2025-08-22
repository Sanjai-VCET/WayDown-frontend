import { Spinner, Alert, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import axios from "axios"; // Ensure axios is imported

const SpotHeader = ({ spot, onRetry, setSpot }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSpotDetails = async () => {
    if (!spot?.id) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/spots/${spot.id}`,
        {
          timeout: 5000,
        }
      );
      setSpot(response.data || {}); // Now setSpot is defined via props
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("Failed to load spot details. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (onRetry) {
      fetchSpotDetails();
    }
  }, [onRetry]);

  if (loading) {
    return (
      <div className="mb-3 text-center">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading spot details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-3 text-center">
        <Alert variant="danger" className="mb-0">
          {error}
          <Button
            variant="link"
            onClick={fetchSpotDetails}
            className="p-0 ms-2"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="mb-3 text-center">
        <p className="text-muted">No spot details available.</p>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <h1 className="mb-2">{spot.name || "Unnamed Spot"}</h1>
      <div
        className="d-flex align-items-center"
        aria-label={`Location: ${spot.city || "Unknown"}`}
      >
        <i className="bi bi-geo-alt text-primary me-2" aria-hidden="true" />
        <span>{spot.city || "Unknown location"}</span>
      </div>
    </div>
  );
};

SpotHeader.propTypes = {
  spot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    city: PropTypes.string,
  }),
  onRetry: PropTypes.func,
  setSpot: PropTypes.func.isRequired, // Add setSpot to propTypes
};

export default SpotHeader;
