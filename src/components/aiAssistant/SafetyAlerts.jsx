import { useState, useEffect, useCallback } from "react";
import { Card, Alert, Spinner, Button } from "react-bootstrap"; // Added Button for retry
import PropTypes from "prop-types"; // For type checking
import {
  ShieldCheck,
  ExclamationTriangle,
  InfoCircle,
  CheckCircle,
  ArrowRepeat,
} from "react-bootstrap-icons"; // Import icons

// Static predefined data
const staticAlerts = [
  {
    id: 1,
    type: "warning",
    message: "Severe weather warning: Heavy rainfall expected in coastal areas.",
    region: "USA",
  },
  {
    id: 2,
    type: "info",
    message: "Travel advisory: Expect delays at major airports due to security checks.",
    region: "global",
  },
  {
    id: 3,
    type: "warning",
    message: "Wildfire alert: Avoid forested areas in southern regions.",
    region: "Europe",
  },
  {
    id: 4,
    type: "info",
    message: "Public transport strike planned for next week.",
    region: "Europe",
  },
  {
    id: 5,
    type: "warning",
    message: "Tropical storm approaching eastern coastlines.",
    region: "Asia",
  },
];

const SafetyAlerts = ({ region }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alerts from static data
  const fetchAlerts = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay with setTimeout
      setTimeout(() => {
        const filteredAlerts = staticAlerts.filter(
          (alert) => alert.region === (region || "global") || alert.region === "global"
        );
        setAlerts(filteredAlerts);
        setLoading(false);
      }, 1000); // 1-second delay to mimic network request
    } catch (err) {
      setError("Failed to load safety alerts. Please try again.");
      setLoading(false);
    }
  }, [region]);

  // Fetch alerts on mount or when region changes
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Loading state
  if (loading) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" /> {/* Use Bootstrap Spinner */}
          Loading safety alerts...
        </Card.Body>
      </Card>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center text-danger">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <ExclamationTriangle size={20} /> {/* Add error icon */}
            {error}
          </div>
          <Button
            variant="link"
            className="p-0 mt-2"
            onClick={fetchAlerts}
            style={{ display: "flex", alignItems: "center", gap: "5px", margin: "0 auto" }}
          >
            <ArrowRepeat size={16} /> {/* Add retry icon */}
            Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title className="d-flex align-items-center gap-2">
          <ShieldCheck size={20} className="text-primary" /> {/* Replace bi-shield-check */}
          Safety Alerts
        </Card.Title>

        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <Alert
              key={alert.id || index} // Use index as a fallback key
              variant={alert.type === "warning" ? "warning" : "info"}
              className="mb-2 py-2"
            >
              <small className="d-flex align-items-center gap-2">
                {alert.type === "warning" ? (
                  <ExclamationTriangle size={16} /> // Replace bi-exclamation-triangle
                ) : (
                  <InfoCircle size={16} /> // Replace bi-info-circle
                )}
                {alert.message}
              </small>
            </Alert>
          ))
        ) : (
          <Alert variant="success" className="py-2">
            <small className="d-flex align-items-center gap-2">
              <CheckCircle size={16} /> {/* Replace bi-check-circle */}
              No active safety alerts at this time.
            </small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

// PropTypes for type checking
SafetyAlerts.propTypes = {
  region: PropTypes.string, // Optional region prop
};

export default SafetyAlerts;