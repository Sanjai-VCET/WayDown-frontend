import { useState, useCallback, useEffect } from "react";
import { Card, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

const UserPostForm = ({ onAddPost, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    location: '',
    tags: '',
    images: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);

  // Fetch current user data from backend
  const fetchCurrentUser = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication token not found.");

      const response = await axios.get("http://localhost:3000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      setUserData(response.data);
    } catch (err) {
      setError("Failed to load user data.");
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchCurrentUser();
    }
  }, [userLoading, user, fetchCurrentUser]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle image file uploads
  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setFormData((prev) => ({ ...prev, images: files }));
  }, []);

  // Validate form data
  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.content.trim()) newErrors.content = "Description is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate() || !user || !userData) return;

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
        postData.append("tags", tagsArray);
        formData.images.forEach((image) => {
          postData.append("images", image);
        });
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Authentication token not found.");

        const response = await axios.post(
          "http://localhost:3000/api/community/posts",
          postData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            timeout: 10000,
          }
        );
        onAddPost(response.data);
        setFormData({ title: "", content: "", location: "", tags: "", images: [] });
        setLoading(false);
      } catch (err) {
        setError("Failed to share post. Please try again.");
        setLoading(false);
      }
    },
    [formData, user, userData, validate, onAddPost]
  );

  // Loading state for user fetch
  if (userLoading || (!userData && !error && user)) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading user data...
        </Card.Body>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center">
          <Alert variant="danger">Please log in to create a post.</Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="mb-3">Share a Hidden Spot</h5>

        {error && (
          <Alert variant="danger" role="alert">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="postTitle">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Give your hidden spot a catchy title"
              isInvalid={!!errors.title}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="postContent">
            <Form.Label>Description</Form.Label>
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
            <Form.Control.Feedback type="invalid">{errors.content}</Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="postLocation">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Where is this hidden spot located?"
                  isInvalid={!!errors.location}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">{errors.location}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3" controlId="postTags">
                <Form.Label>Tags (comma separated)</Form.Label>
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
            <Form.Label>Upload Images</Form.Label>
            <Form.Control
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              multiple
              disabled={loading}
            />
            <Form.Text className="text-muted">Share photos of this hidden spot (max 5 images)</Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sharing...
                </>
              ) : (
                "Share Post"
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