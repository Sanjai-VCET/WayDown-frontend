import { useState, useEffect, useCallback } from "react";
import { Card, Button, Spinner, Alert, Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // Format date
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Fetch user's posts from backend
  const fetchPosts = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `https://waydown-backend-0w9y.onrender.com/api/users/${user.uid}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setPosts(response.data || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to load your posts. Please try again.");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchPosts();
    } else if (!user) {
      setLoading(false);
      setError("You must be logged in to view your posts.");
    }
  }, [user, userLoading, fetchPosts]);

  // Handle delete post
  const handleDelete = useCallback(
    async (postId) => {
      if (!user) return;

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        await axios.delete(
          `https://waydown-backend-0w9y.onrender.com/api/spots/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }
        );
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      } catch (err) {
        setError("Failed to delete post. Please try again.");
      }
    },
    [user]
  );

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading your posts...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="link" onClick={fetchPosts} className="p-0 ms-2">
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">You haven't shared any hidden spots yet.</p>
        <Link to="/community" className="btn btn-primary mt-2">
          Share a Hidden Spot
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Your Posts</h5>
        <Link to="/community" className="btn btn-sm btn-primary">
          Create New Post
        </Link>
      </div>

      {posts.map((post) => (
        <Card key={post._id} className="mb-4">
          <Card.Body>
            <div className="d-flex">
              <div className="post-image me-3" style={{ width: "120px" }}>
                <img
                  src={post.photos?.[0] || "/fallback-image.jpg"} // Updated to use photos array
                  alt={post.name}
                  className="img-fluid rounded"
                  onError={(e) => (e.target.src = "/fallback-image.jpg")}
                />
              </div>

              <div className="post-content flex-grow-1">
                <h5 className="mb-1">{post.name}</h5>{" "}
                {/* Updated to use name */}
                <p className="text-muted small mb-2">
                  {formatDate(post.createdAt)} •{" "}
                  {post.location?.coordinates?.join(", ") || "Unknown location"}{" "}
                  {/* Updated to use createdAt and location */}
                </p>
                <p className="mb-2">{post.content}</p>
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-heart-fill text-danger me-1" />
                    {post.likedBy?.length || 0} {/* Updated to use likedBy */}
                  </div>
                  <div>
                    <i className="bi bi-chat-fill text-primary me-1" />
                    {post.comments?.length || 0}
                  </div>
                </div>
              </div>

              <div className="post-actions">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="link"
                    className="text-muted p-0"
                    id={`dropdown-${post._id}`}
                  >
                    <i className="bi bi-three-dots-vertical" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item as={Link} to={`/edit-post/${post._id}`}>
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleDelete(post._id)}>
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

MyPosts.propTypes = {};

export default MyPosts;
