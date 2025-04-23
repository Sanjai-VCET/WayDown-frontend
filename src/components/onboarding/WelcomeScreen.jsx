import { useState, useEffect, useCallback } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = ({ onNext }) => {
  const [content, setContent] = useState({
    title: "Welcome to Hidden Spots",
    description:
      "Discover secret locations, hidden gems, and off-the-beaten-path destinations curated by travelers like you.",
    features: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);
  const navigate = useNavigate();

  // Redirect to Home if user is authenticated
  useEffect(() => {
    if (!userLoading && user) {
      navigate("/home");
    }
  }, [user, userLoading, navigate]);

  // Fetch welcome content from backend
  const fetchWelcomeContent = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://waydown-backend.onrender.com/api/welcome",
        {
          timeout: 5000,
        }
      );
      setContent({
        title: response.data.title || "Welcome to Hidden Spots",
        description:
          response.data.description ||
          "Discover secret locations, hidden gems, and off-the-beaten-path destinations curated by travelers like you.",
        features: response.data.features || [
          {
            icon: "🗺️",
            title: "Explore Hidden Gems",
            description:
              "Find secret spots that aren't on typical tourist maps",
          },
          {
            icon: "🤖",
            title: "AI Travel Assistant",
            description:
              "Get personalized recommendations based on your preferences",
          },
          {
            icon: "👥",
            title: "Community Driven",
            description:
              "Share your own discoveries and connect with fellow explorers",
          },
        ],
      });
      setLoading(false);
    } catch (err) {
      setError(
        "Failed to load welcome content. Please check your connection and try again."
      );
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!userLoading && !user) {
      fetchWelcomeContent();
    }
  }, [userLoading, user, fetchWelcomeContent]);

  // Handle next button click
  const handleNext = useCallback(() => {
    if (onNext) {
      onNext();
    } else {
      navigate("/signup");
    }
  }, [onNext, navigate]);

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="text-center py-5" aria-live="polite">
        <Spinner
          animation="border"
          size="sm"
          className="me-2"
          aria-hidden="true"
        />
        <span>Loading welcome screen...</span>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="text-center py-5" aria-live="polite">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button
            variant="link"
            onClick={fetchWelcomeContent}
            className="p-0 ms-2"
            aria-label="Retry loading welcome content"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div
      className="text-center py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-live="polite"
    >
      <div className="mb-4">
        <img
          src="/logo.png"
          alt="Hidden Spots Logo"
          className="img-fluid mb-3"
          style={{ maxWidth: "150px" }}
          onError={(e) =>
            (e.target.src =
              "https://th.bing.com/th/id/OIP.dfyEzm-iv7XLwz4Qfd5_jgHaIx?w=147&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7")
          }
        />
        <h2 className="fw-bold mb-3">{content.title}</h2>
        <p className="text-muted mb-4">{content.description}</p>
      </div>

      <div className="features-grid mb-4">
        {content.features.map((feature, index) => (
          <motion.div
            key={feature.title || index}
            className="feature-item mb-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="feature-icon mb-2" aria-hidden="true">
              {feature.icon}
            </div>
            <h5>{feature.title}</h5>
            <p className="small text-muted">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-100"
        onClick={handleNext}
        aria-label="Get started with Hidden Spots"
      >
        Get Started
      </Button>
    </motion.div>
  );
};

WelcomeScreen.propTypes = {
  onNext: PropTypes.func,
};

export default WelcomeScreen;
