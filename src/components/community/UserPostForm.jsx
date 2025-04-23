import { useState, useCallback } from "react";
import { Card, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import {
  ExclamationTriangle,
  PencilSquare,
  ChatText,
  GeoAlt,
  Hash,
  Image,
  Send,
  XCircle,
} from "react-bootstrap-icons"; // Import icons

const UserPostForm = ({ onAddPost, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    location: "",
    tags: "",
    images: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setFormData((prev) => ({ ...prev, images: files }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.content.trim()) newErrors.content = "Description is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate() || !user) return;

      setLoading(true);
      setError(null);

      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag !== "");

      const postData = new FormData();
      postData.append("title", formData.title);
      postData.append("content", formData.content);
      postData.append("location", formData.location);
      postData.append("tags", JSON.stringify(tagsArray)); // Send tags as JSON string
      formData.images.forEach((image) => {
        postData.append("images", image);
      });

      try {
        const token = await user.getIdToken();
        const response = await axios.post(
          "https://waydown-backend.onrender.com/api/community/posts",
          postData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            timeout: 10000,
          }
        );
        onAddPost(response.data.post); // Pass only the post object
        setFormData({
          title: "",
          content: "",
          location: "",
          tags: "",
          images: [],
        });
        setLoading(false);
      } catch (err) {
        setError(
          "Failed to share post: " +
            (err.response?.data?.message || err.message)
        );
        setLoading(false);
      }
    },
    [formData, user, validate, onAddPost]
  );

  if (userLoading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />{" "}
          {/* Use Bootstrap Spinner */}
          Loading...
        </Card.Body>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center">
          <Alert
            variant="danger"
            className="d-flex align-items-center justify-content-center gap-2"
          >
            <ExclamationTriangle size={20} /> {/* Add no-user icon */}
            Please log in to create a post.
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="mb-3">Share a Hidden Spot</h5>

        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError(null)}
            className="d-flex align-items-center gap-2"
          >
            <ExclamationTriangle size={20} /> {/* Add error icon */}
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="postTitle">
            <Form.Label className="d-flex align-items-center gap-2">
              <PencilSquare size={16} /> {/* Add title icon */}
              Title
            </Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Give your hidden spot a catchy title"
              isInvalid={!!errors.title}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="postContent">
            <Form.Label className="d-flex align-items-center gap-2">
              <ChatText size={16} /> {/* Add description icon */}
              Description
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Describe this hidden spot. What makes it special? How did you find it?"
              isInvalid={!!errors.content}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.content}
            </Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="postLocation">
                <Form.Label className="d-flex align-items-center gap-2">
                  <GeoAlt size={16} /> {/* Add location icon */}
                  Location
                </Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Where is this hidden spot located?"
                  isInvalid={!!errors.location}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.location}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3" controlId="postTags">
                <Form.Label className="d-flex align-items-center gap-2">
                  <Hash size={16} /> {/* Add tags icon */}
                  Tags (comma separated)
                </Form.Label>
                <Form.Control
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g., waterfall, hiking, scenic"
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4" controlId="postImages">
            <Form.Label className="d-flex align-items-center gap-2">
              <Image size={16} /> {/* Add image upload icon */}
              Upload Images
            </Form.Label>
            <Form.Control
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              multiple
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Share photos of this hidden spot (max 5 images)
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-secondary"
              onClick={onCancel}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              <XCircle size={16} /> {/* Add cancel icon */}
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send size={16} /> {/* Add submit icon */}
                  Share Post
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

UserPostForm.propTypes = {
  onAddPost: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default UserPostForm;
