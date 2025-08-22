import { useState, useEffect, useCallback } from "react";
import { Card, Button, Form, Badge, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import {
  Heart,
  HeartFill,
  Chat,
  Share,
  ExclamationTriangle,
  ArrowRepeat,
  InfoCircle,
} from "react-bootstrap-icons"; // Import icons

const PostFeed = ({ onLike, onAddComment }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // ✅ Improved fetchPosts with better error logging
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const page = 1;
      const limit = 10;

      console.log("🚀 Fetching posts from API:", { page, limit });

      const response = await axios.get(
        "http://localhost:5000/api//apicommunity/posts",
        {
          params: { page, limit },
          timeout: 5000,
        }
      );

      if (!response.data || !response.data.posts) {
        throw new Error("Invalid response format: Missing posts field");
      }

      console.log("✅ Posts fetched successfully:", response.data);

      const postsData = response.data.posts;

      // ✅ Ensure failure in fetching comments does not break post retrieval
      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          try {
            const commentsResponse = await axios.get(
              `http://localhost:5000/api//apicommunity/posts/${post._id}/comments`,
              { timeout: 5000 }
            );
            return { ...post, comments: commentsResponse.data || [] };
          } catch (err) {
            console.error(
              `❌ Failed to fetch comments for post ${post._id}:`,
              err.message
            );
            return { ...post, comments: [] };
          }
        })
      );

      setPosts(postsWithComments);
    } catch (err) {
      console.error(
        "❌ API Error:",
        err.response?.status,
        err.response?.data || err.message
      );
      setError("Failed to load posts. Please check the API and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch posts on mount
  useEffect(() => {
    if (!userLoading) {
      fetchPosts();
    }
  }, [userLoading, fetchPosts]);

  // ✅ Handle like button click
  const handleLike = (postId) => {
    if (!user) return; // Prevent action if not logged in
    onLike(postId); // Call the prop function
  };

  // ✅ Handle comment submission
  const handleCommentSubmit = (postId) => {
    if (!user || !commentText.trim()) return; // Prevent action if not logged in or empty comment
    onAddComment(postId, commentText); // Call the prop function
    setCommentText(""); // Clear input
    setActiveCommentPost(null); // Close comment section
  };

  // ✅ Loading state
  if (loading || userLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />{" "}
        {/* Use Bootstrap Spinner */}
        Loading posts...
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="text-center py-5">
        <Alert
          variant="danger"
          className="d-flex align-items-center justify-content-center gap-2"
        >
          <ExclamationTriangle size={20} /> {/* Add error icon */}
          {error}
          <Button
            variant="link"
            onClick={fetchPosts}
            className="p-0 ms-2"
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <ArrowRepeat size={16} /> {/* Add retry icon */}
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="post-feed">
      {posts.length > 0 ? (
        posts.map((post) => (
          <Card key={post._id} className="mb-4">
            <Card.Body>
              {/* Post Header */}
              <div className="d-flex align-items-center mb-3">
                <img
                  src={post.user?.profilePic || "/fallback-avatar.jpg"}
                  alt={post.user?.username}
                  className="rounded-circle me-2"
                  width="40"
                  height="40"
                  onError={(e) => (e.target.src = "/fallback-avatar.jpg")}
                />
                <div>
                  <h6 className="mb-0">
                    {post.user?.username || "Unknown User"}
                  </h6>
                  <small className="text-muted">
                    {new Date(post.createdAt).toLocaleDateString()} •{" "}
                    {post.location}
                  </small>
                </div>
              </div>

              {/* Post Title & Content */}
              <h5 className="mb-2">{post.title}</h5>
              <p>{post.content}</p>

              {/* Post Tags */}
              <div className="mb-3">
                {post.tags.map((tag, index) => (
                  <Badge
                    bg="light"
                    text="dark"
                    className="me-2 mb-2"
                    key={index}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Post Actions */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <Button
                    variant={
                      post.likes.includes(user?.uid)
                        ? "danger"
                        : "outline-primary"
                    }
                    size="sm"
                    className="me-2"
                    onClick={() => handleLike(post._id)}
                    disabled={!user}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    {post.likes.includes(user?.uid) ? (
                      <HeartFill size={16} /> // Use filled heart for liked
                    ) : (
                      <Heart size={16} /> // Use outline heart for unliked
                    )}
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Chat size={16} /> {/* Replace bi-chat */}
                    {post.comments.length}
                  </Button>
                </div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Share size={16} /> {/* Replace bi-share */}
                  Share
                </Button>
              </div>

              {/* Comments Section */}
              {(post.comments.length > 0 || activeCommentPost === post._id) && (
                <div className="comments-section p-3 bg-light rounded">
                  {post.comments.length > 0 && (
                    <div className="existing-comments mb-3">
                      <h6 className="mb-3 text-muted">Comments</h6>
                      {post.comments.map((comment, index) => (
                        <div
                          key={index}
                          className="comment mb-2 pb-2 border-bottom"
                        >
                          <div className="d-flex">
                            <div className="fw-bold me-2">
                              {comment.username}
                            </div>
                            <div>{comment.text}</div>
                          </div>
                          <small className="text-muted">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeCommentPost === post._id && (
                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCommentSubmit(post._id);
                      }}
                    >
                      <Form.Group className="d-flex">
                        <Form.Control
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          className="me-2"
                        />
                        <Button type="submit" variant="primary" size="sm">
                          Post
                        </Button>
                      </Form.Group>
                    </Form>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        ))
      ) : (
        <div className="text-center py-5">
          <p className="text-muted d-flex align-items-center justify-content-center gap-2">
            <InfoCircle size={20} /> {/* Add empty state icon */}
            No posts yet. Be the first to share a hidden spot!
          </p>
        </div>
      )}
    </div>
  );
};

PostFeed.propTypes = {
  onLike: PropTypes.func.isRequired,
  onAddComment: PropTypes.func.isRequired,
};

export default PostFeed;
