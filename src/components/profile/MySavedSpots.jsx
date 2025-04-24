import { useState, useEffect, useCallback } from "react";
import { Row, Col, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import SpotCard from "../home/SpotCard";

const MySavedSpots = () => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // Fetch user's saved spots from backend
  const fetchSavedSpots = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `https://waydown-backend-0w9y.onrender.com/api/users/${user.uid}/favorites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setSpots(response.data || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to load your saved spots. Please try again.");
      setLoading(false);
    }
  }, [user]);

  // Fetch spots on mount or when user changes
  useEffect(() => {
    if (!userLoading && user) {
      fetchSavedSpots();
    } else if (!user) {
      setLoading(false);
      setError("You must be logged in to view your saved spots.");
    }
  }, [user, userLoading, fetchSavedSpots]);

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading your saved spots...
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="link" onClick={fetchSavedSpots} className="p-0 ms-2">
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (spots.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">You haven't saved any spots yet.</p>
        <p>Explore hidden spots and save your favorites!</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="mb-4">Your Saved Spots</h5>
      <Row xs={1} md={2} lg={3} className="g-4">
        {spots.map((spot) => (
          <Col key={spot._id}>
            <SpotCard spot={spot} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

MySavedSpots.propTypes = {};

export default MySavedSpots;
