import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase"; // Adjust path to your Firebase config

// Components (assumed optimized)
import WelcomeScreen from "../components/onboarding/WelcomeScreen";
import LoginForm from "../components/onboarding/LoginForm";
import SignupForm from "../components/onboarding/SignupForm";
import UserInterestSelection from "../components/onboarding/UserInterestSelection";
import LocationPermissionPrompt from "../components/onboarding/LocationPermissionPrompt";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [formType, setFormType] = useState("login"); // 'login' or 'signup'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    interests: [],
  });
  const [user, authLoading] = useAuthState(auth); // Firebase auth state
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Handle navigation between steps
  const handleNext = useCallback(() => setStep((prev) => prev + 1), []);
  const handleBack = useCallback(() => setStep((prev) => prev - 1), []);
  const handleSkip = useCallback(() => navigate("/home"), [navigate]);

  // Handle form type switch
  const handleFormTypeChange = useCallback((type) => {
    setFormType(type);
    setError("");
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  // Handle interest selection
  const handleInterestChange = useCallback(
    (interests) => setUserData((prev) => ({ ...prev, interests })),
    []
  );

  // Handle location permission (simulate for now)
  const handleLocationPermission = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => handleNext(), // Success: move to next step
        () => {
          setError("Location permission denied. Continuing without location.");
          setTimeout(handleNext, 2000); // Proceed after showing error
        }
      );
    } else {
      setError("Geolocation not supported. Skipping to next step.");
      setTimeout(handleNext, 2000);
    }
  }, [handleNext]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        if (formType === "login") {
          await auth.signInWithEmailAndPassword(
            userData.email,
            userData.password
          );
          navigate("/home", { replace: true });
        } else {
          await auth.createUserWithEmailAndPassword(
            userData.email,
            userData.password
          );
          await auth.currentUser.updateProfile({ displayName: userData.name });
          handleNext(); // Proceed to location step
        }
      } catch (err) {
        setError(err.message || "Authentication failed.");
      } finally {
        setLoading(false);
      }
    },
    [formType, userData, navigate, handleNext]
  );

  // Memoized step rendering
  const renderStep = useMemo(() => {
    switch (step) {
      case 1:
        return <WelcomeScreen onNext={handleNext} />;
      case 2:
        return formType === "login" ? (
          <LoginForm
            userData={userData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onFormTypeChange={() => handleFormTypeChange("signup")}
            error={error}
          />
        ) : (
          <SignupForm
            userData={userData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onFormTypeChange={() => handleFormTypeChange("login")}
            error={error}
          />
        );
      case 3:
        return (
          <LocationPermissionPrompt
            onAllow={handleLocationPermission}
            onSkip={handleNext}
          />
        );
      case 4:
        return (
          <UserInterestSelection
            selectedInterests={userData.interests}
            onChange={handleInterestChange}
            onNext={handleSkip}
            onSkip={handleSkip}
          />
        );
      default:
        return null;
    }
  }, [
    step,
    formType,
    userData,
    error,
    handleNext,
    handleSubmit,
    handleInputChange,
    handleFormTypeChange,
    handleLocationPermission,
    handleInterestChange,
    handleSkip,
  ]);

  // Loading state during auth check
  if (authLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner
          animation="border"
          size="sm"
          aria-label="Loading authentication status"
        />
      </Container>
    );
  }

  return (
    <Container
      fluid
      className="onboarding-container vh-100 d-flex align-items-center justify-content-center p-3"
      aria-label="Onboarding Process"
    >
      <Row className="justify-content-center w-100">
        <Col xs={12} md={8} lg={6} xl={5}>
          <Card className="border-0 shadow-lg">
            <Card.Body className="p-4 p-md-5">
              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}
              {loading && (
                <div className="text-center mb-3">
                  <Spinner
                    animation="border"
                    size="sm"
                    aria-label="Processing"
                  />
                </div>
              )}
              {renderStep} {/* Changed from {renderStep()} */}
              {step > 1 && step < 4 && (
                <div className="d-flex justify-content-between mt-4">
                  <Button
                    variant="outline-secondary"
                    onClick={handleBack}
                    disabled={loading}
                    aria-label="Go back to previous step"
                  >
                    Back
                  </Button>
                  <Button
                    variant="link"
                    onClick={handleSkip}
                    disabled={loading}
                    aria-label="Skip this step"
                  >
                    Skip for now
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

Onboarding.propTypes = {};

export default Onboarding;
