import { useState, useEffect, useCallback } from "react";
import { Card, Button, Form, Badge, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

const PostFeed = ({ onLike, onAddComment }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // Fetch posts and comments from backend
  const fetchPosts = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/community/posts", {
        timeout: 5000,
      });
      const postsData = Array.isArray(response.data) ? response.data : [];
      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          const commentsResponse = await axios.get(
            `http://localhost:3000/api/community/posts/${post._id}/comments`,
            { timeout: 5000 }
          );
          return { ...post, comments: commentsResponse.data || [] };
        })
      );
      setPosts(postsWithComments);
      setLoading(false);
    } catch (err) {
      setError("Failed to load posts. Please try again.");
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!userLoading) {
      fetchPosts();
    }
  }, [userLoading, fetchPosts]);

  // Format date
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Handle comment submission
  const handleCommentSubmit = useCallback(
    async (e, postId) => {
      e.preventDefault();
      if (!commentText.trim() || !user) return;

      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication token not found.");

        const response = await axios.post(
          `http://localhost:3000/api/community/posts/${postId}/comments`,
          { text: commentText },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        );
        onAddComment(postId, response.data);
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? { ...post, comments: [...post.comments, response.data] }
              : post
          )
        );
        setCommentText("");
        setActiveCommentPost(null);
      } catch (err) {
        setError("Failed to add comment.");
      }
    },
    [commentText, user, onAddComment]
  );

  // Handle like
  const handleLike = useCallback(
    async (postId) => {
      if (!user) return;
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication token not found.");

        const post = posts.find((p) => p._id === postId);
        const isLiked = post.likes.includes(user.uid);

        const method = isLiked ? "DELETE" : "POST";
        await axios({
          method,
          url: `http://localhost:3000/api/community/posts/${postId}/like`,
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });
        onLike(postId);
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: isLiked
                    ? post.likes.filter((uid) => uid !== user.uid)
                    : [...post.likes, user.uid],
                }
              : post
          )
        );
      } catch (err) {
        setError("Failed to like post.");
      }
    },
    [user, posts, onLike]
  );

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading posts...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger">
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
      <div className="text-center py-5">
        <p className="text-muted">
          No posts yet. Be the first to share a hidden spot!
        </p>
      </div>
    );
  }

  return (
    <div className="post-feed">
      {posts.map((post) => (
        <Card key={post._id} className="mb-4">
          <Card.Body>
            {/* Post Header */}
            <div className="d-flex align-items-center mb-3">
              <img
                src={post.user.profilePic || "/fallback-avatar.jpg"}
                alt={post.user.username}
                className="rounded-circle me-2"
                width="40"
                height="40"
                onError={(e) => (e.target.src = "/fallback-avatar.jpg")}
              />
              <div>
                <h6 className="mb-0">{post.user.username}</h6>
                <small className="text-muted">
                  {formatDate(post.createdAt)} • {post.location}
                </small>
              </div>
            </div>

            {/* Post Title & Content */}
            <h5 className="mb-2">{post.title}</h5>
            <p>{post.content}</p>

            {/* Post Tags */}
            <div className="mb-3">
              {post.tags.map((tag, index) => (
                <Badge bg="light" text="dark" className="me-2 mb-2" key={index}>
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Post Image */}
            {post.images?.length > 0 && (
              <div className="post-images mb-3">
                <img
                  src={post.images[0].url}
                  alt={post.title}
                  className="img-fluid rounded"
                  onError={(e) => (e.target.src = "/fallback-image.jpg")}
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <Button
                  variant={post.likes.includes(user?.uid) ? "danger" : "outline-primary"}
                  size="sm"
                  className="me-2"
                  onClick={() => handleLike(post._id)}
                  disabled={!user}
                >
                  <i className="bi bi-heart me-1" />
                  {post.likes.length}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() =>
                    setActiveCommentPost(
                      activeCommentPost === post._id ? null : post._id
                    )
                  }
                  disabled={!user}
                >
                  <i className="bi bi-chat me-1" />
                  {post.comments.length}
                </Button>
              </div>
              <Button variant="outline-secondary" size="sm">
                <i className="bi bi-share" />
              </Button>
            </div>

            {/* Comments Section */}
            {(post.comments.length > 0 || activeCommentPost === post._id) && (
              <div className="comments-section p-3 bg-light rounded">
                {post.comments.length > 0 && (
                  <div className="existing-comments mb-3">
                    <h6 className="mb-3 text-muted">Comments</h6>
                    {post.comments.map((comment) => (
                      <div
                        key={comment.createdAt}
                        className="comment mb-2 pb-2 border-bottom"
                      >
                        <div className="d-flex">
                          <div className="fw-bold me-2">{comment.username}</div>
                          <div>{comment.text}</div>
                        </div>
                        <small className="text-muted">
                          {formatDate(comment.createdAt)}
                        </small>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Form */}
                {activeCommentPost === post._id && user && (
                  <Form onSubmit={(e) => handleCommentSubmit(e, post._id)}>
                    <Form.Group className="mb-2">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={!commentText.trim()}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </Form>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

PostFeed.propTypes = {
  onLike: PropTypes.func.isRequired,
  onAddComment: PropTypes.func.isRequired,
};

export default PostFeed;