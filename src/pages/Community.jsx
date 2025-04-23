import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Nav,
  Spinner,
  Alert,
} from "react-bootstrap";
import axios from "axios";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";

import UserPostForm from "../components/community/UserPostForm";
import PostFeed from "../components/community/PostFeed";
import PopularUsers from "../components/community/PopularUsers";
import TrendingTags from "../components/community/TrendingTags";

const Community = () => {
  const [activeTab, setActiveTab] = useState("recent");
  const [showPostForm, setShowPostForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useAuthState(auth);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const page = 1;
      const limit = 10;

      console.log("🚀 Fetching posts with:", { page, limit });

      const { data } = await axios.get(
        "https://waydown-backend.onrender.com/api/community/posts",
        {
          params: { page: Number(page), limit: Number(limit) },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 5000,
        }
      );

      console.log("✅ Posts fetched:", data);
      setPosts(data.posts || []);
    } catch (err) {
      console.error(
        "❌ Error fetching posts:",
        err.response?.data || err.message
      );
      setError(
        "Failed to load posts: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = useCallback(
    async (postId) => {
      if (!user) {
        setError("You must be logged in to like a post.");
        return;
      }

      try {
        const token = await user.getIdToken();
        const post = posts.find((p) => p._id === postId);
        if (!post) throw new Error("Post not found in local state.");
        const isLiked = post.likes.includes(user.uid);

        // Backend handles both like and unlike with a single endpoint
        const response = await axios.post(
          `https://waydown-backend.onrender.com/api/community/posts/${postId}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );

        setPosts(
          posts.map((p) =>
            p._id === postId ? { ...p, likes: response.data.likes } : p
          )
        );
      } catch (error) {
        console.error(
          "Error liking post:",
          error.response?.data || error.message
        );
        setError(
          `Failed to ${
            post && post.likes.includes(user.uid) ? "unlike" : "like"
          } post: ${error.response?.data?.error || error.message}`
        );
      }
    },
    [user, posts]
  );

  const handleAddComment = useCallback(
    async (postId, commentText) => {
      if (!user) {
        setError("You must be logged in to comment.");
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await axios.post(
          `https://waydown-backend.onrender.com/api/community/posts/${postId}/comments`, // Changed to match backend
          { text: commentText },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
        );

        setPosts(
          posts.map((p) =>
            p._id === postId
              ? { ...p, comments: [...p.comments, response.data] }
              : p
          )
        );
      } catch (error) {
        console.error(
          "Error adding comment:",
          error.response?.data || error.message
        );
        setError(
          `Failed to add comment: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    },
    [user, posts]
  );

  const handleTabSelect = useCallback((key) => setActiveTab(key), []);

  const sortedPosts = useMemo(() => {
    switch (activeTab) {
      case "popular":
        return [...posts].sort((a, b) => b.likes.length - a.likes.length);
      case "following":
        return user
          ? posts.filter((post) => user.following?.includes(post.user))
          : [];
      case "recent":
      default:
        return posts;
    }
  }, [activeTab, posts, user]);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading Community...
      </Container>
    );
  }

  return (
    <Container className="py-4" aria-label="Community Page">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h2 className="mb-0">Community</h2>
            {user && (
              <Button
                variant="primary"
                onClick={() => setShowPostForm((prev) => !prev)}
                aria-label={showPostForm ? "Hide post form" : "Show post form"}
              >
                <i className="bi bi-plus-lg me-2" aria-hidden="true" />
                Share a Hidden Spot
              </Button>
            )}
          </div>
        </Col>
      </Row>
      {showPostForm && (
        <Row className="mb-4">
          <Col>
            <UserPostForm
              onAddPost={fetchPosts}
              onCancel={() => setShowPostForm(false)}
            />
          </Col>
        </Row>
      )}
      <Row>
        <Col lg={8}>
          <Card className="mb-4 shadow-sm border-0">
            <Card.Body>
              <Nav
                variant="tabs"
                className="mb-3"
                activeKey={activeTab}
                onSelect={handleTabSelect}
                aria-label="Community Post Filters"
              >
                <Nav.Item>
                  <Nav.Link eventKey="recent" aria-controls="recent-tab">
                    Recent
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="popular" aria-controls="popular-tab">
                    Popular
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="following" aria-controls="following-tab">
                    Following
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              <PostFeed
                posts={sortedPosts}
                onLike={handleLike}
                onAddComment={handleAddComment}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <PopularUsers />
          <TrendingTags />
        </Col>
      </Row>
    </Container>
  );
};

export default Community;
