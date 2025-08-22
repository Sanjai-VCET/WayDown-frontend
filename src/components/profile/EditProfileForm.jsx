import { useState, useCallback, useEffect } from "react";
import { Form, Button, Spinner, Alert, Image } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

const EditProfileForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    interests: [],
    avatar: null,
  });
  const [avatarFile, setAvatarFile] = useState(null); // For avatar upload
  const [avatarPreview, setAvatarPreview] = useState(null); // For avatar preview
  const [interestOptions, setInterestOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // Fetch user data and interest options from backend
  const fetchUserData = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `http://localhost:5000/api/users/${user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setFormData({
        name: response.data.username || "",
        email: response.data.email || "",
        interests: response.data.interests || [],
        avatar: response.data.profilePic || null,
      });
      setAvatarPreview(response.data.profilePic || null);
    } catch (err) {
      setError("Failed to load your profile data.");
    }
  }, [user]);

  const fetchInterestOptions = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/interests/options",
        {
          timeout: 5000,
        }
      );
      setInterestOptions(response.data || []);
    } catch (err) {
      setError("Failed to load interest options.");
      setInterestOptions([
        "Adventure",
        "Temples",
        "Waterfalls",
        "Beaches",
        "Mountains",
        "Historical",
        "Nature",
        "Urban",
        "Foodie",
        "Wildlife",
      ]);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUserData(), fetchInterestOptions()]);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading && user) {
      loadData();
    }
  }, [user, userLoading, fetchUserData, fetchInterestOptions]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }, []);

  // Handle avatar file change
  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  // Handle interest toggle
  const handleInterestToggle = useCallback((interest) => {
    setFormData((prev) => {
      const updatedInterests = prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: updatedInterests };
    });
    setError(null);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user) {
        setError("You must be logged in to save profile changes.");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        // Upload avatar if a new file is selected
        let updatedAvatar = formData.avatar;
        if (avatarFile) {
          const formDataUpload = new FormData();
          formDataUpload.append("avatar", avatarFile);

          const avatarResponse = await axios.post(
            `http://localhost:5000/api/users/${user.uid}/avatar`,
            formDataUpload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
              timeout: 5000,
            }
          );
          updatedAvatar = avatarResponse.data.profilePic; // Assuming backend returns the new avatar URL
        }

        // Update profile
        const updatedProfile = {
          username: formData.name,
          email: formData.email,
          interests: formData.interests,
          profilePic: updatedAvatar,
        };

        await axios.put(
          `http://localhost:5000/api/users/${user.uid}`,
          updatedProfile,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }
        );

        setSubmitting(false);
        onSave(updatedProfile);
      } catch (err) {
        setError("Failed to save profile changes. Please try again.");
        setSubmitting(false);
      }
    },
    [user, formData, avatarFile, onSave]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading profile...
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <h4 className="mb-3">Edit Profile</h4>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3" controlId="profileAvatar">
        <Form.Label>Profile Picture</Form.Label>
        <div className="mb-2">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Avatar Preview"
              roundedCircle
              width={80}
              height={80}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              className="bg-light rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 80, height: 80 }}
            >
              <span className="text-muted">No Image</span>
            </div>
          )}
        </div>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          disabled={submitting}
          aria-label="Upload Profile Picture"
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="profileName">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={submitting}
          aria-label="Full Name"
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="profileEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={submitting}
          aria-label="Email Address"
        />
      </Form.Group>

      <Form.Group className="mb-4" controlId="profileInterests">
        <Form.Label>Interests</Form.Label>
        <div className="d-flex flex-wrap gap-2">
          {interestOptions.map((interest) => (
            <div
              key={interest}
              className={`interest-badge p-2 rounded ${
                formData.interests.includes(interest)
                  ? "bg-primary text-white"
                  : "bg-light text-dark"
              }`}
              style={{ cursor: submitting ? "not-allowed" : "pointer" }}
              onClick={() => !submitting && handleInterestToggle(interest)}
              role="button"
              aria-pressed={formData.interests.includes(interest)}
              tabIndex={0}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                !submitting &&
                handleInterestToggle(interest)
              }
            >
              {interest}
            </div>
          ))}
        </div>
      </Form.Group>

      <div className="d-flex gap-2">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
};

EditProfileForm.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default EditProfileForm;
