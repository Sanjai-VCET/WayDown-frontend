import { useState, useCallback } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ onFormTypeChange }) => {
  const [userData, setUserData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }, []);

  // Handle form submission
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

        // Use AuthContext's login function
        const user = await login(email, password);
        localStorage.setItem("refreshToken", user.refreshToken); // Store refresh token
        navigate("/home");
      } catch (err) {
        let errorMessage = "Failed to sign in. Please try again.";
        if (err.message.includes("Invalid credentials")) {
          errorMessage = "Invalid email or password.";
        } else if (err.message.includes("Invalid email")) {
          errorMessage = "Invalid email format.";
        } else if (err.message.includes("Too many requests")) {
          errorMessage = "Too many attempts. Please try again later.";
        }
        setError(errorMessage);
        setLoading(false);
      }
    },
    [userData, login, navigate]
  );

  // Handle forgot password (placeholder for now)
  const handleForgotPassword = useCallback(() => {
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

LoginForm.propTypes = {
  onFormTypeChange: PropTypes.func.isRequired,
};

export default LoginForm;