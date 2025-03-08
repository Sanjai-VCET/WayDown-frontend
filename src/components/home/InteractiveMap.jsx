import { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';
import axios from 'axios';
import PropTypes from 'prop-types'; // For type checking
import L from 'leaflet'; // Leaflet library
import 'leaflet/dist/leaflet.css'; // Leaflet styles

const InteractiveMap = ({ initialSpots = [] }) => {
  const [spots, setSpots] = useState(initialSpots);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null); // Ref for Leaflet map instance
  const mapContainerRef = useRef(null); // Ref for map container DOM element

  // Fetch spots from backend
  const fetchSpots = useCallback(async () => {
    try {
      const response = await axios.get('/api/spots', { timeout: 5000 }); // Replace with your endpoint
      setSpots(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load spots. Please try again.');
      setLoading(false);
    }
  }, []);

  // Initialize and update map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current || spots.length === 0) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13); // Default center (London)
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add markers for spots
    spots.forEach((spot) => {
      if (spot.latitude && spot.longitude) {
        L.marker([spot.latitude, spot.longitude])
          .addTo(map)
          .bindPopup(`<b>${spot.name}</b><br>${spot.location}`);
      }
    });

    // Fit map to bounds of all markers
    const bounds = spots
      .filter((spot) => spot.latitude && spot.longitude)
      .map((spot) => [spot.latitude, spot.longitude]);
    if (bounds.length > 0) map.fitBounds(bounds);
  }, [spots]);

  // Fetch spots and initialize map on mount
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Update map when spots change
  useEffect(() => {
    if (!loading && !error) {
      initializeMap();
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove(); // Cleanup map on unmount
        mapRef.current = null;
      }
    };
  }, [loading, error, initializeMap]);

  // Loading state
  if (loading) {
    return (
      <div
        className="interactive-map rounded shadow-sm d-flex align-items-center justify-content-center"
        style={{ height: '500px', backgroundColor: '#e9ecef' }}
      >
        <Spinner animation="border" size="sm" className="me-2" />
        Loading map...
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div
        className="interactive-map rounded shadow-sm d-flex flex-column align-items-center justify-content-center"
        style={{ height: '500px', backgroundColor: '#e9ecef' }}
      >
        <p className="text-danger mb-2">{error}</p>
        <button className="btn btn-link p-0" onClick={fetchSpots}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="interactive-map rounded shadow-sm"
      style={{ height: '500px', backgroundColor: '#e9ecef' }}
    />
  );
};

// PropTypes for type checking
InteractiveMap.propTypes = {
  initialSpots: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      latitude: PropTypes.number,
      longitude: PropTypes.number,
    })
  ),
};

export default InteractiveMap;