import { useState, useEffect, useCallback } from "react";
import { Card, ListGroup, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

const PopularUsers = ({ limit = 4 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(new Set());
  const [user] = useAuthState(auth); // Get current user for auth token

  const fetchPopularUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();

      console.log("🚀 Fetching popular users with token:", token ? "✅ Token Present" : "❌ No Token");

      const response = await axios.get("http://localhost:3000/api/users/popular", {
        params: { limit },
        headers: token ? { Authorization: `Bearer ${token}` } : {}, // ✅ Ensure token is included only if available
        timeout: 5000,
      });

      console.log("✅ Popular users fetched:", response.data);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("❌ Error fetching popular users:", err.response?.data || err.message);
      setError("Failed to load popular users: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPopularUsers();
  }, [fetchPopularUsers]);

  if (loading) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading popular explorers...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body className="text-center text-danger">
          {error}
          <div>
            <button className="btn btn-link p-0 mt-2" onClick={fetchPopularUsers}>
              Retry
            </button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-3">Popular Explorers</Card.Title>
        <ListGroup variant="flush">
          {users.length > 0 ? (
            users.map((user) => (
              <ListGroup.Item key={user._id} className="px-0 py-2 border-bottom">
                <div className="d-flex align-items-center">
                  <img
                    src={user.profilePic || "/fallback-avatar.jpg"} // Match User model field
                    alt={user.username} // Match User model field
                    className="rounded-circle me-2"
                    width="40"
                    height="40"
                    onError={(e) => (e.target.src = "/fallback-avatar.jpg")}
                  />
                  <div className="me-auto">
                    <div className="fw-bold">{user.username}</div>
                    <small className="text-muted">
                      {user.posts || 0} posts • {user.followers || 0} followers
                    </small>
                  </div>
                  <Button
                    variant={following.has(user._id) ? "primary" : "outline-primary"}
                    size="sm"
                    disabled={!auth.currentUser} // Disable if not logged in
                  >
                    {following.has(user._id) ? "Following" : "Follow"}
                  </Button>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="px-0 py-2 text-muted">
              No popular explorers found.
            </ListGroup.Item>
          )}
        </ListGroup>
        <div className="text-center mt-3">
          <Button variant="link" className="text-decoration-none" onClick={fetchPopularUsers}>
            See More
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

PopularUsers.propTypes = {
  limit: PropTypes.number,
};

export default PopularUsers;
