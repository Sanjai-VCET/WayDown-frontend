import React, { useState, useEffect, useCallback } from "react";
import { Card, Spinner, Alert, Button, Form } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase"; // Adjust path
import { getIdToken } from "firebase/auth";

const UserReviews = ({ spotId, reviews, onReviewAdded }) => {
  const [newReview, setNewReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState("");
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);
  const [localReviews, setLocalReviews] = useState(reviews || []);
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => {
    console.log("Reviews prop from SpotDetails:", reviews);
    setLocalReviews((prev) => {
      const serverReviews = reviews || [];
      const merged = [
        ...serverReviews,
        ...pendingReviews.filter(
          (pr) => !serverReviews.some((sr) => sr.id === pr.id)
        ),
      ];
      console.log("Merged localReviews:", merged);
      return merged.length > 0 ? merged : prev; // Fallback to previous state if server returns empty
    });
  }, [reviews]);

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
      if (selectedRating === "") {
        setError("Rating is required (1-5).");
        return;
      }

      setLoading(true);
      setError(null);
      console.log("Current user at submit:", user); // Debug: Log user object

      try {
        const token = await getIdToken(user);
        const response = await axios.post(
          `https://waydown-backend.onrender.com/api/${spotId}/reviews`,
          {
            content: newReview,
            rating: parseInt(selectedRating, 10),
            username: user.displayName || user.email || "Anonymous", // Explicitly send username
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("POST Review Response:", response.data);

        const newReviewData = {
          user: { username: user.displayName || user.email || "Anonymous" }, // Use consistent username
          createdAt: new Date().toISOString(),
          content: newReview,
          rating: parseInt(selectedRating, 10),
          id: response.data.id || Date.now().toString(),
        };

        setPendingReviews((prev) => [...prev, newReviewData]);
        setLocalReviews((prev) => {
          const updated = [...prev, newReviewData];
          console.log("After POST, localReviews:", updated);
          return updated;
        });

        setNewReview("");
        setSelectedRating("");

        if (onReviewAdded) {
          setTimeout(() => {
            onReviewAdded();
            console.log("Triggered refetchSpot after 2s");
          }, 2000);
        }
      } catch (err) {
        console.error("POST Error:", err.response?.data || err.message);
        setError(err.response?.data?.error || "Failed to submit review.");
      } finally {
        setLoading(false);
      }
    },
    [user, newReview, spotId, selectedRating, onReviewAdded]
  );

  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString || Date.now()).toLocaleDateString(
      undefined,
      options
    );
  }, []);

  if (userLoading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading reviews...
      </div>
    );
  if (error)
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button
            variant="link"
            onClick={() => setError(null)}
            className="p-0 ms-2"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );

  return (
    <div className="user-reviews">
      <h4 className="mb-3">Reviews</h4>
      <div className="review-list">
        {localReviews.length === 0 ? (
          <p className="text-center py-4 text-muted">
            No reviews yet. Be the first to leave a review!
          </p>
        ) : (
          localReviews.map((review) => (
            <Card
              key={review.id || review.createdAt}
              className="mb-3"
              aria-label={`Review by ${review.user?.username}`}
            >
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
                      <h6 className="mb-0">
                        {review.user?.username || "Anonymous"}
                      </h6>
                      <small className="text-muted">
                        {formatDate(review.createdAt)}
                      </small>
                    </div>
                  </div>
                </div>
                <p className="mb-0">
                  {review.content || "No comment provided."}
                </p>
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
          <Form.Group controlId="reviewRating" className="mb-3">
            <Form.Label>Rating (1-5 stars)</Form.Label>
            <Form.Select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              required
            >
              <option value="">Select a rating</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num.toString()}>
                  {num} stars
                </option>
              ))}
            </Form.Select>
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
      user: PropTypes.shape({ username: PropTypes.string }),
      createdAt: PropTypes.string,
      content: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
    })
  ),
  onReviewAdded: PropTypes.func,
};

export default UserReviews;
