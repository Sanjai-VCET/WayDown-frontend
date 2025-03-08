import { useState, useEffect, useCallback } from 'react';
import { Card, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import PropTypes from 'prop-types'; // For type checking

const SafetyAlerts = ({ region }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await axios.get('/api/safety-alerts', {
        params: region ? { region } : {}, // Optional region filter
        timeout: 5000, // Prevent hanging requests
      });
      setAlerts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load safety alerts. Please try again.');
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
          <Spinner animation="border" size="sm" className="me-2" />
          Loading safety alerts...
        </Card.Body>
      </Card>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center text-danger">
          {error}
          <div>
            <button className="btn btn-link p-0 mt-2" onClick={fetchAlerts}>
              Retry
            </button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title>
          <i className="bi bi-shield-check text-primary me-2"></i>
          Safety Alerts
        </Card.Title>

        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.type === 'warning' ? 'warning' : 'info'}
              className="mb-2 py-2"
            >
              <small>
                <i
                  className={`bi bi-${
                    alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'
                  } me-2`}
                />
                {alert.message}
              </small>
            </Alert>
          ))
        ) : (
          <Alert variant="success" className="py-2">
            <small>
              <i className="bi bi-check-circle me-2" />
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