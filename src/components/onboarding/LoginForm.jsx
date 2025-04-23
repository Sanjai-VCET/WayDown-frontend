import { useState, useCallback } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types"; // For type checking
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase Auth
import { auth } from "../../../firebase"; // Your Firebase config file

const LoginForm = ({ onFormTypeChange }) => {
  const [userData, setUserData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input change
  }, []);

  // Handle form submission with Firebase Auth
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const { email, password } = userData;
        if (!email.trim() || !password.trim()) {
          throw new Error("Please fill in all fields.");
        }

        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Get Firebase JWT token
        const token = await user.getIdToken(); // Get Firebase JWT token

        console.log("User Info:", user);
        console.log("Firebase Token:", token);

        // Send token to backend to ensure user data is synced
        const response = await fetch(
          "https://waydown-backend.onrender.com/api/auth/ensure-user",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to sync user data with backend.");
        }

        setLoading(false);
        navigate("/home"); // Redirect to home page on success
      } catch (err) {
        let errorMessage = "Failed to sign in. Please try again.";
        if (
          err.code === "auth/user-not-found" ||
          err.code === "auth/wrong-password"
        ) {
          errorMessage = "Invalid email or password.";
        } else if (err.code === "auth/invalid-email") {
          errorMessage = "Invalid email format.";
        } else if (err.code === "auth/too-many-requests") {
          errorMessage = "Too many attempts. Please try again later.";
        } else if (err.message === "Failed to sync user data with backend.") {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setLoading(false);
      }
    },
    [userData, navigate]
  );

  // Handle forgot password (placeholder for now)
  const handleForgotPassword = useCallback(() => {
    // Optionally add Firebase reset password logic here
    console.log("Forgot password clicked");
  }, []);

  return (
    <div>
      <h3 className="text-center mb-4">Welcome Back</h3>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} noValidate>
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
            placeholder="Enter your password"
            required
            disabled={loading}
          />
          <div className="d-flex justify-content-end mt-1">
            <a
              href="#"
              className="small text-decoration-none"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </a>
          </div>
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100 mb-3"
          disabled={
            loading || !userData.email.trim() || !userData.password.trim()
          }
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <div className="text-center">
          <p className="mb-0">
            Don’t have an account?{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={onFormTypeChange}
              disabled={loading}
            >
              Sign Up
            </Button>
          </p>
        </div>
      </Form>
    </div>
  );
};

// PropTypes for type checking
LoginForm.propTypes = {
  onFormTypeChange: PropTypes.func.isRequired,
};

export default LoginForm;
