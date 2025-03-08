import { useState, useEffect, useCallback } from "react";
import { Card, ListGroup, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";

const PopularUsers = ({ limit = 4 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(new Set());

  const fetchPopularUsers = useCallback(async () => {
    try {
      const response = await axios.get("/api/users/popular", {
        params: { limit },
        timeout: 5000,
      });
      // Ensure users is always an array
      const usersData = Array.isArray(response.data) ? response.data : [];
      setUsers(usersData);
      setLoading(false);
    } catch {
      setError("Failed to load popular users. Please try again.");
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPopularUsers();
  }, [fetchPopularUsers]);

  const handleFollowToggle = useCallback(
    async (userId) => {
      const isFollowing = following.has(userId);
      try {
        if (isFollowing) {
          await axios.post(`/api/users/${userId}/unfollow`);
          setFollowing((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId
                ? { ...user, followers: user.followers - 1 }
                : user
            )
          );
        } else {
          await axios.post(`/api/users/${userId}/follow`);
          setFollowing((prev) => new Set(prev).add(userId));
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId
                ? { ...user, followers: user.followers + 1 }
                : user
            )
          );
        }
      } catch {
        setError(`Failed to ${isFollowing ? "unfollow" : "follow"} user.`);
      }
    },
    [following]
  );

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
            <button
              className="btn btn-link p-0 mt-2"
              onClick={fetchPopularUsers}
            >
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
              <ListGroup.Item key={user.id} className="px-0 py-2 border-bottom">
                <div className="d-flex align-items-center">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="rounded-circle me-2"
                    width="40"
                    height="40"
                    onError={(e) => (e.target.src = "/fallback-avatar.jpg")}
                  />
                  <div className="me-auto">
                    <div className="fw-bold">{user.name}</div>
                    <small className="text-muted">
                      {user.posts} posts • {user.followers} followers
                    </small>
                  </div>
                  <Button
                    variant={
                      following.has(user.id) ? "primary" : "outline-primary"
                    }
                    size="sm"
                    onClick={() => handleFollowToggle(user.id)}
                  >
                    {following.has(user.id) ? "Following" : "Follow"}
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
          >
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
