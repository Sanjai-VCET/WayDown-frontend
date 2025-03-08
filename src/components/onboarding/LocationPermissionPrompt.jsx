import { useState, useCallback, useEffect } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import PropTypes from 'prop-types'; // For type checking

const LocationPermissionPrompt = ({ onAllow, onSkip }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null); // 'granted', 'denied', 'prompt'

  // Check initial permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/location/permission', { timeout: 5000 }); // Replace with your endpoint
      setPermissionStatus(response.data.status);
    } catch (err) {
      setError('Failed to check location permission status.');
    }
  }, []);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
      });
    } else {
      checkPermissionStatus(); // Fallback to backend if Permissions API unavailable
    }
  }, [checkPermissionStatus]);

  // Handle allowing location access
  const handleAllow = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;

      // Send location to backend (optional)
      await axios.post('/api/location/save', { lat: latitude, lng: longitude }, { timeout: 5000 });
      setPermissionStatus('granted');
      onAllow({ lat: latitude, lng: longitude }); // Pass coordinates to parent
    } catch (err) {
      setError('Failed to get location. Please enable location services and try again.');
      setPermissionStatus('denied');
    } finally {
      setLoading(false);
    }
  }, [onAllow]);

  // Handle skipping
  const handleSkip = useCallback(() => {
    setPermissionStatus('denied');
    onSkip();
  }, [onSkip]);

  // If permission is already granted or denied, skip rendering
  if (permissionStatus === 'granted' || permissionStatus === 'denied') {
    return null;
  }

  return (
    <div className="text-center py-3">
      <div className="mb-4">
        <div className="location-icon mb-3">
          <img
            src="/location-icon.png" // Replace with your actual icon in public folder
            alt="Location"
            className="img-fluid"
            style={{ maxWidth: '80px' }}
            onError={(e) => (e.target.src = 'https://via.placeholder.com/80')} // Fallback image
          />
        </div>
        <h3 className="mb-3">Enable Location Services</h3>
        <p className="text-muted mb-4">
          To discover hidden spots near you and get accurate directions, we need access to your location.
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="d-grid gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAllow}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Requesting...
            </>
          ) : (
            'Allow Location Access'
          )}
        </Button>

        <Button
          variant="outline-secondary"
          onClick={handleSkip}
          disabled={loading}
        >
          Not Now
        </Button>
      </div>
    </div>
  );
};

// PropTypes for type checking
LocationPermissionPrompt.propTypes = {
  onAllow: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
};

export default LocationPermissionPrompt;