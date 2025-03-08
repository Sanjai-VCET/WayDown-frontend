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
import { auth } from "../../firebase"; // Adjust path to your Firebase config

// Components (assumed to be optimized separately)
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
  const [user] = useAuthState(auth); // Firebase user state

  // Fetch posts from backend
  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/community/posts", {
        timeout: 5000,
      });
      setPosts(data || []);
      setLoading(false);
    } catch {
      setError("Failed to load posts. Please try again.");
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle adding a new post
  const handleAddPost = useCallback(
    async (newPost) => {
      if (!user) {
        setError("Please log in to share a post.");
        return;
      }

      try {
        const postData = {
          ...newPost,
          userId: user.uid,
          username: user.displayName || "Anonymous",
          userAvatar:
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${
              user.displayName || "User"
            }&background=random`,
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
        };
        const { data } = await axios.post("/api/community/posts", postData, {
          timeout: 5000,
        });
        setPosts((prev) => [data, ...prev]);
        setShowPostForm(false);
      } catch {
        setError("Failed to add post.");
      }
    },
    [user]
  );

  // Handle liking a post
  const handleLike = useCallback(
    async (postId) => {
      if (!user) {
        setError("Please log in to like posts.");
        return;
      }

      try {
        const { data } = await axios.post(
          `/api/community/posts/${postId}/like`,
          { userId: user.uid },
          { timeout: 5000 }
        );
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likes: data.likes } : post
          )
        );
      } catch {
        setError("Failed to like post.");
      }
    },
    [user]
  );

  // Handle adding a comment
  const handleAddComment = useCallback(
    async (postId, comment) => {
      if (!user) {
        setError("Please log in to comment.");
        return;
      }
      if (!comment.content) {
        setError("Comment cannot be empty.");
        return;
      }

      try {
        const commentData = {
          userId: user.uid,
          username: user.displayName || "Anonymous",
          content: comment.content,
          timestamp: new Date().toISOString(),
        };
        const { data } = await axios.post(
          `/api/community/posts/${postId}/comments`,
          commentData,
          { timeout: 5000 }
        );
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, comments: data.comments } : post
          )
        );
      } catch {
        setError("Failed to add comment.");
      }
    },
    [user]
  );

  // Handle tab selection
  const handleTabSelect = useCallback((key) => setActiveTab(key), []);

  // Memoized sorted posts
  const sortedPosts = useMemo(() => {
    switch (activeTab) {
      case "popular":
        return [...posts].sort((a, b) => b.likes - a.likes);
      case "following":
        return user
          ? posts.filter((post) => user.following?.includes(post.userId))
          : [];
      case "recent":
      default:
        return posts;
    }
  }, [activeTab, posts, user]);

  // Loading state
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading Community...
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-4">
        <Alert
          variant="danger"
          className="text-center"
          dismissible
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4" aria-label="Community Page">
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
              onAddPost={handleAddPost}
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

Community.propTypes = {};

export default Community;
