import { useState, useCallback } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SignupForm = ({ onFormTypeChange }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      const { name, email, password } = userData;

      try {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error("Please fill in all fields.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        // Register user using AuthContext's signup function
        const user = await signup(name, email, password);
        localStorage.setItem("refreshToken", user.refreshToken); // Store refresh token
        navigate("/home");
      } catch (err) {
        let errorMessage = "Failed to sign up. Please try again.";
        if (err.message.includes("Email already in use")) {
          errorMessage = "This email is already in use.";
        } else if (err.message.includes("Invalid email")) {
          errorMessage = "Invalid email format.";
        } else if (err.message.includes("Password must be at least")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (err.message.includes("Display name")) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setLoading(false);
      }
    },
    [userData, signup, navigate]
  );

  return (
    <div>
      <h3 className="text-center mb-4">Create an Account</h3>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={userData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            disabled={loading}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            disabled={loading}
          />
          <Form.Text className="text-muted">
            Password must be at least 6 characters long
          </Form.Text>
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100 mb-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Signing Up...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>

        <div className="text-center">
          <p className="mb-0">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={onFormTypeChange}
              disabled={loading}
            >
              Sign In
            </Button>
          </p>
        </div>
      </Form>
    </div>
  );
};

SignupForm.propTypes = {
  onFormTypeChange: PropTypes.func.isRequired,
};

export default SignupForm;