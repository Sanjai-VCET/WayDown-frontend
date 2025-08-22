import React, { useState, useEffect ,useCallback} from "react";
// Removed useEffect since we’re using props
import { Card, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import axios from "axios";
const DescriptionSection = ({ spot, onRetry ,setSpot }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Retry fetch if needed (triggered by parent)
  const fetchSpotDetails = useCallback(async () => {
    if (!spot?.id) return; // Safety check
    setLoading(true);
    try {
      const response = await axios.get(`/api/spots/${spot.id}`, {
        timeout: 5000,
      });
      setSpot(response.data || {});
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load spot details. Please try again.");
      setLoading(false);
    }
  }, [spot?.id]);

  useEffect(() => {
    if (onRetry) {
      fetchSpotDetails();
    }
  }, [onRetry, fetchSpotDetails]);

  // Loading state (from retry)
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading spot details...
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
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

  // Ensure spot data exists
  if (!spot) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No spot details available.</p>
      </div>
    );
  }

  return (
    <div className="description-section py-3">
      <p className="lead mb-4">
        {spot.content || "No description available."}
      </p>

      <div className="info-cards mb-4">
        <Row xs={1} md={3} className="g-3">
          <Col>
            <Card className="h-100">
              <Card.Body>
                <h5 className="card-title">
                  <i className="bi bi-calendar-check text-primary me-2" />
                  Best Time to Visit
                </h5>
                <p className="card-text">
                  {spot.bestTimeToVisit || "Information not provided."}
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col>
            <Card className="h-100">
              <Card.Body>
                <h5 className="card-title">
                  <i className="bi bi-signpost-split text-primary me-2" />
                  Difficulty
                </h5>
                <p className="card-text">
                  {spot.difficulty || "Not specified."}
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col>
            <Card className="h-100">
              <Card.Body>
                <h5 className="card-title">
                  <i className="bi bi-people text-primary me-2" />
                  Crowd Level
                </h5>
                <p className="card-text">
                  {spot.crowdLevel || "Usually quiet"}
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      <h4 className="mb-3">About This Hidden Spot</h4>
      {spot.uniqueFacts ? (
        spot.uniqueFacts.split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)
      ) : (
        <p>No additional information available.</p>
      )}

      <h4 className="mt-4 mb-3">How to Get There</h4>
      {spot.directions ? (
        spot.directions.split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)
      ) : (
        <p>Directions not provided.</p>
      )}
    </div>
  );
};

// PropTypes for type checking
DescriptionSection.propTypes = {
  spot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    content: PropTypes.string,
    bestTimeToVisit: PropTypes.string,
    difficulty: PropTypes.string,
    crowdLevel: PropTypes.string,
    uniqueFacts: PropTypes.string,
    directions: PropTypes.string,
  }),
  onRetry: PropTypes.func, // For retry functionality
};

export default DescriptionSection;