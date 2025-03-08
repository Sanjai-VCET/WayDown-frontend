import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Spinner, Alert, Button, Form } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import { getIdToken } from "firebase/auth";

const UserReviews = ({ spotId, reviews }) => {
  const [newReview, setNewReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);
  const [localReviews, setLocalReviews] = useState(reviews || []);

  // Update local reviews when prop changes
  useEffect(() => {
    setLocalReviews(reviews || []);
  }, [reviews]);

  // Handle review submission
  const handleReviewSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user) {
        setError("You must be logged in to submit a review.");
        return;
      }

      if (!newReview.trim()) {
        setError("Review cannot be empty.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getIdToken(user);
        await axios.post(
          `http://localhost:3000/api/spots/${spotId}/comments`,
          { text: newReview },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        );
        setLocalReviews((prev) => [
          ...prev,
          {
            user: { username: user.displayName || "Anonymous" },
            createdAt: new Date().toISOString(),
            content: newReview,
          },
        ]);
        setNewReview("");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to submit review. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [user, newReview, spotId]
  );

  // Memoized date formatting
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString || Date.now()).toLocaleDateString(undefined, options);
  }, []);

  if (userLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="link" onClick={() => setError(null)} className="p-0 ms-2">
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="user-reviews">
      <h4 className="mb-3">Reviews</h4>
      <div className="review-list">
        {localReviews.length === 0 ? (
          <p className="text-center py-4 text-muted">
            No reviews yet. Be the first to leave a review!
          </p>
        ) : (
          localReviews.map((review, index) => (
            <Card key={index} className="mb-3" aria-label={`Review by ${review.user?.username}`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center">
                    <div className="avatar me-2">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          review.user?.username || "Anonymous"
                        )}&background=random`}
                        alt={`${review.user?.username || "Anonymous"}'s avatar`}
                        className="rounded-circle"
                        width="40"
                        height="40"
                        onError={(e) => (e.target.src = "/fallback-avatar.jpg")}
                      />
                    </div>
                    <div>
                      <h6 className="mb-0">{review.user?.username || "Anonymous"}</h6>
                      <small className="text-muted">{formatDate(review.createdAt)}</small>
                    </div>
                  </div>
                </div>
                <p className="mb-0">{review.content || "No comment provided."}</p>
              </Card.Body>
            </Card>
          ))
        )}
      </div>

      {user ? (
        <Form onSubmit={handleReviewSubmit} className="mt-4">
          <Form.Group controlId="newReview" className="mb-3">
            <Form.Label>Add Your Review</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Write your review..."
              disabled={loading}
            />
          </Form.Group>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </Form>
      ) : (
        <Alert variant="info" className="mt-4">
          Please log in to leave a review.
        </Alert>
      )}
    </div>
  );
};

UserReviews.propTypes = {
  spotId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      user: PropTypes.shape({
        username: PropTypes.string,
      }),
      createdAt: PropTypes.string,
      content: PropTypes.string,
    })
  ),
};

export default UserReviews;