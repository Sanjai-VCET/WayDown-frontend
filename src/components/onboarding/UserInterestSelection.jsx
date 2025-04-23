import { useState, useCallback, useEffect } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

const UserInterestSelection = ({ onNext, onSkip }) => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestCategories, setInterestCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // Static mapping for icons (since backend doesn't provide them)
  const iconMapping = {
    Adventure: "🏞️",
    Temples: "🛕",
    Waterfalls: "💧",
    Beaches: "🏖️",
    Mountains: "⛰️",
    Historical: "🏛️",
    Nature: "🌳",
    Urban: "🏙️",
    Foodie: "🍴",
    Wildlife: "🦒",
  };

  // Fetch interest categories from backend
  const fetchInterestCategories = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://waydown-backend.onrender.com/api/interests/categories",
        {
          timeout: 5000,
        }
      );
      // Transform flat array into objects with id, name, and icon
      const categories = (response.data || []).map((name, index) => ({
        id: index.toString(),
        name,
        icon: iconMapping[name] || "🌐", // Fallback icon
      }));
      setInterestCategories(categories);
    } catch (err) {
      setError("Failed to load interest categories.");
    }
  }, []);

  // Fetch existing user interests from backend
  const fetchInterests = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `https://waydown-backend.onrender.com/api/users/${user.uid}/interests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setSelectedInterests(response.data || []); // Backend returns a flat array
    } catch (err) {
      setError("Failed to load your interests.");
    }
  }, [user]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchInterestCategories(),
          user && fetchInterests(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      loadData();
    }
  }, [user, userLoading, fetchInterestCategories, fetchInterests]);

  // Handle interest toggle
  const handleInterestToggle = useCallback((interest) => {
    setSelectedInterests((prev) => {
      const updatedInterests = prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest];
      return updatedInterests;
    });
    setError(null);
  }, []);

  // Handle next step with backend save
  const handleNext = useCallback(async () => {
    if (!user) {
      setError("You must be logged in to save interests.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      await axios.post(
        `https://waydown-backend.onrender.com/api/users/${user.uid}/interests`,
        { interests: selectedInterests },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setLoading(false);
      onNext(selectedInterests);
    } catch (err) {
      setError("Failed to save your interests. Please try again.");
      setLoading(false);
    }
  }, [user, selectedInterests, onNext]);

  // Handle skip
  const handleSkip = useCallback(() => {
    setLoading(false);
    setError(null);
    onSkip();
  }, [onSkip]);

  // Loading state while fetching user or data
  if (userLoading || loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading...
      </div>
    );
  }

  // Error state if no categories loaded
  if (error && interestCategories.length === 0) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button
            variant="link"
            onClick={() => fetchInterestCategories()}
            className="p-0 ms-2"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="text-center mb-4">
        <h3 className="mb-3">What are you interested in?</h3>
        <p className="text-muted">
          Select your interests to help us personalize your experience.
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="interests-grid mb-4">
        <div className="row g-2">
          {interestCategories.map((category) => (
            <div className="col-6 col-md-4" key={category.id}>
              <div
                className={`interest-item p-3 rounded text-center ${
                  selectedInterests.includes(category.name)
                    ? "selected bg-light border border-primary"
                    : "border"
                }`}
                onClick={() => handleInterestToggle(category.name)}
                style={{ cursor: loading ? "not-allowed" : "pointer" }}
                role="button"
                aria-pressed={selectedInterests.includes(category.name)}
              >
                <div className="interest-icon mb-2">{category.icon}</div>
                <div className="interest-name">{category.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-grid gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleNext}
          disabled={loading || selectedInterests.length === 0}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>

        <Button
          variant="link"
          className="text-muted"
          onClick={handleSkip}
          disabled={loading}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};

UserInterestSelection.propTypes = {
  onNext: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
};

export default UserInterestSelection;
