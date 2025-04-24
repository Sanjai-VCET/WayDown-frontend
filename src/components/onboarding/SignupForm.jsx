import { useState, useCallback } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { auth } from "../../../firebase"; // Ensure correct Firebase initialization
import { signInWithEmailAndPassword } from "firebase/auth";

const SignupForm = ({ onFormTypeChange }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        // Register user via backend
        const registerResponse = await fetch(
          "https://waydown-backend-0w9y.onrender.com/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              username: name,
              password,
              displayName: name,
            }),
          }
        );

        if (!registerResponse.ok) {
          let errorData;
          try {
            errorData = await registerResponse.json();
          } catch {
            throw new Error("Failed to register user.");
          }
          throw new Error(
            errorData.error || errorData.message || "Registration failed."
          );
        }

        const registerData = await registerResponse.json();
        const { uid } = registerData;

        // Sign in to get the token
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        const token = await user.getIdToken();

        console.log("User Info:", user);
        console.log("Firebase Token:", token);

        // Store token in localStorage
        localStorage.setItem("authToken", token);

        // Fetch welcome message
        const welcomeResponse = await fetch(
          "https://waydown-backend-0w9y.onrender.com/api/welcome",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!welcomeResponse.ok) {
          throw new Error("Failed to fetch welcome message.");
        }

        const welcomeData = await welcomeResponse.json();

        setLoading(false);
        navigate("/home", { state: { welcomeMessage: welcomeData.message } });
      } catch (err) {
        let errorMessage = "Failed to sign up. Please try again.";
        if (err.message.includes("email already in use")) {
          errorMessage = "This email is already in use.";
        } else if (err.message.includes("Invalid email address")) {
          errorMessage = "Invalid email format.";
        } else if (err.message.includes("Password must be at least")) {
          errorMessage = "Password must be at least 8 characters long.";
        } else if (err.message === "Failed to fetch welcome message.") {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setLoading(false);
      }
    },
    [userData, navigate]
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
            Password must be at least 8 characters long
          </Form.Text>
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100 mb-3"
          disabled={loading}
        >
          {loading ? (
            <Spinner animation="border" size="sm" className="me-2" />
          ) : (
            "Sign Up"
          )}
        </Button>
      </Form>
    </div>
  );
};

SignupForm.propTypes = {
  onFormTypeChange: PropTypes.func.isRequired,
};

export default SignupForm;
