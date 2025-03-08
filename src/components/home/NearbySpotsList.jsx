import { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Spinner, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
import PropTypes from 'prop-types';
import SpotCard from './SpotCard';

const NearbySpotsList = ({ userLocation }) => {
  const [spots, setSpots] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // 9 spots per page (3 per row in a 3-column layout)
  const [totalPages, setTotalPages] = useState(1);
  const [radius] = useState(10); // Default radius of 10 km
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Fetch nearby spots from backend
  const fetchSpots = useCallback(
    async (currentPage = 1, append = false) => {
      console.log("Fetching spots with params:", { lat: userLocation?.lat, lon: userLocation?.lng, radius, page: currentPage, limit });
      if (!userLocation?.lat || !userLocation?.lng || (userLocation.lat === 0 && userLocation.lng === 0)) {
        setError("Unable to load nearby spots. Location unavailable.");
        setLoading(false);
        return;
      }
      try {
        if (currentPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params = {
          lat: userLocation?.lat || 0, // Default to 0 if no location
          lon: userLocation?.lng || 0, // Updated to use lon
          radius: 50000, // Use default radius
          page: currentPage,
          limit,
        };

        const response = await axios.get('http://localhost:3000/api/spots/nearby', {
          params,
          timeout: 5000,
        });

        const { spots: newSpots, totalPages: newTotalPages } = response.data;

        // Map location to a string if it's an object and ensure id is correctly mapped
        const mappedSpots = newSpots.map((spot) => ({
          ...spot,
          id: spot._id, // Ensure id is correctly mapped
          location: typeof spot.location === 'object' ? spot.location.coordinates.join(', ') : spot.location,
          images: spot.photos.map(photo => photo.url),
        }));

        setSpots((prev) => (append ? [...prev, ...mappedSpots] : mappedSpots));
        setTotalPages(newTotalPages || 1);
        setPage(currentPage);
        setLoading(false);
        setLoadingMore(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load nearby spots. Please try again.');
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userLocation, radius, limit]
  );

  // Fetch spots on mount or when userLocation changes
  useEffect(() => {
    if (userLocation) {
      fetchSpots(1);
    }
  }, [fetchSpots, userLocation]);

  // Sort spots by distance with memoization
  const nearbySpots = useMemo(() => {
    return [...spots].sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [spots]);

  // Load more spots
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchSpots(page + 1, true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading nearby spots...
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="link" onClick={() => fetchSpots(1)} className="p-0 ms-2">
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (nearbySpots.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No nearby spots found.</p>
      </div>
    );
  }

  return (
    <div>
      <Row xs={1} md={2} lg={3} className="g-4">
        {nearbySpots.map((spot) => (
          <Col key={spot.id}>
            <SpotCard spot={spot} />
          </Col>
        ))}
      </Row>
      {page < totalPages && (
        <div className="text-center mt-4">
          <Button
            variant="primary"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

NearbySpotsList.propTypes = {
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};

export default NearbySpotsList;