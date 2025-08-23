import { useState, useEffect, useCallback } from "react";
import { Card, ListGroup, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import {
  ExclamationTriangle,
  ArrowRepeat,
  Person,
  PersonPlus,
  PersonCheck,
  ArrowRight,
} from "react-bootstrap-icons"; // Import icons

const PopularUsers = ({ limit = 4 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(new Set());
  const [user, userLoading, userError] = useAuthState(auth); // Added userError for debugging

  const fetchPopularUsers = useCallback(async () => {
    if (!user) {
      setError("Please bode in to view popular explorers.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const token = await user.getIdToken();
      console.log("🚀 Fetching popular users with token:", token); // Log full token for debugging (remove in production)

      const response = await axios.get(
        "https://waydown-backend.onrender.com/api//apiusers/popular",
        {
          params: { limit },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        }
      );

      console.log("✅ Popular users fetched:", response.data);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(
        "❌ Error fetching popular users:",
        err.response?.data || err.message
      );
      setError(
        "Failed to load popular users: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [limit, user]);

  useEffect(() => {
    if (userLoading) {
      console.log("⏳ Auth state still loading...");
      return;
    }
    if (userError) {
      console.error("❌ Auth state error:", userError);
      setError("Authentication error: " + userError.message);
      setLoading(false);
      return;
    }
    fetchPopularUsers();
  }, [fetchPopularUsers, userLoading, userError]);

  if (userLoading || loading) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />{" "}
          {/* Use Bootstrap Spinner */}
          Loading popular explorers...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Body className="text-center text-danger">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <ExclamationTriangle size={20} /> {/* Add error icon */}
            {error}
          </div>
          <Button
            variant="link"
            className="p-0 mt-2"
            onClick={fetchPopularUsers}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              margin: "0 auto",
            }}
          >
            <ArrowRepeat size={16} /> {/* Add retry icon */}
            Retry
          </Button>
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
              <ListGroup.Item
                key={user._id}
                className="px-0 py-2 border-bottom"
              >
                <div className="d-flex align-items-center">
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.username}
                      className="rounded-circle me-2"
                      width="40"
                      height="40"
                      onError={(e) => (e.target.src = "/fallback-avatar.jpg")}
                    />
                  ) : (
                    <Person size={40} className="me-2 text-muted" /> // Add Person icon as fallback
                  )}
                  <div className="me-auto">
                    <div className="fw-bold">{user.username}</div>
                    <small className="text-muted">
                      {user.posts || 0} posts • {user.followers || 0} followers
                    </small>
                  </div>
                  <Button
                    variant={
                      following.has(user._id) ? "primary" : "outline-primary"
                    }
                    size="sm"
                    disabled={!auth.currentUser}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    {following.has(user._id) ? (
                      <>
                        <PersonCheck size={16} /> {/* Add Following icon */}
                        Following
                      </>
                    ) : (
                      <>
                        <PersonPlus size={16} /> {/* Add Follow icon */}
                        Follow
                      </>
                    )}
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
          <Button
            variant="link"
            className="text-decoration-none"
            onClick={fetchPopularUsers}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              margin: "0 auto",
            }}
          >
            <ArrowRight size={16} /> {/* Add See More icon */}
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
