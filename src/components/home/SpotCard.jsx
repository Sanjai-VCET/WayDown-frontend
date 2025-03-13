import { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { auth } from "../../../firebase"; 

const SpotCard = ({ spot }) => {
  const [isFavorite, setIsFavorite] = useState(false); // Default to false
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [error, setError] = useState(null);

  // Sync isFavorite with server data on mount
  useEffect(() => {
    const syncFavoriteStatus = async () => {
      const user = auth.currentUser;
      if (user && spot.likedBy) {
        const firebaseUid = user.uid;
        setIsFavorite(spot.likedBy.includes(firebaseUid));
      }
    };
    syncFavoriteStatus();
  }, [spot.likedBy]);

  // Handle favorite toggle with backend API
  const handleFavoriteToggle = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      setLoadingFavorite(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to like a spot.");
        setLoadingFavorite(false);
        return;
      }
      const token = await user.getIdToken();

      if (!token) {
        setError('You must be logged in to like a spot.');
        setLoadingFavorite(false);
        return;
      }

      try {
        const url = isFavorite
          ? `/api/spots/${spot.id}/unlike`
          : `/api/spots/${spot.id}/like`;

        console.log('Making request to:', url);

        await axios.post(url, {}, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });

        setIsFavorite((prev) => !prev); // Toggle the favorite state
        setLoadingFavorite(false);
      } catch (err) {
        console.error('Error updating like status:', err.response?.data || err.message);
        const errorMessage = err.response?.data?.error || 'Failed to update like status.';
        setError(errorMessage);
        setLoadingFavorite(false);
      }
    },
    [spot.id, isFavorite]
  );

  // Convert location to string if it's an object
  const locationString = typeof spot.location === 'object' ? spot.location.coordinates.join(', ') : spot.location;

  return (
    <Card className="h-100 spot-card">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={spot.images?.[0] || './fallback-image.jpeg'} // Fallback image
          alt={spot.name}
          style={{ height: '180px', objectFit: 'cover' }}
          onError={(e) => (e.target.src = './fallback-image.jpeg')} // Handle broken image
        />
        <Badge bg="primary" className="position-absolute top-0 start-0 m-2">
          {spot.category}
        </Badge>
        <Button
          variant={isFavorite ? 'danger' : 'light'}
          size="sm"
          className="position-absolute top-0 end-0 m-2 rounded-circle"
          style={{ width: '32px', height: '32px', padding: '0' }}
          onClick={handleFavoriteToggle}
          disabled={loadingFavorite}
        >
          {loadingFavorite ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <i className={`bi ${isFavorite ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`} />
          )}
        </Button>
      </div>

      <Card.Body>
        <Card.Title>{spot.name}</Card.Title>
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-geo-alt text-primary me-1" />
          <small className="text-muted">{locationString || 'Unknown location'}</small>
        </div>
        <div className="d-flex align-items-center mb-2">
          <i className="bi bi-star-fill text-warning me-1" />
          <span>{spot.rating?.toFixed(1) || 'N/A'}</span>
          <small className="text-muted ms-1">
            ({spot.reviews?.length || 0} reviews)
          </small>
        </div>
        <Card.Text className="text-truncate">
          {spot.description || 'No description available.'}
        </Card.Text>
        {error && <small className="text-danger d-block mt-2">{error}</small>}
      </Card.Body>

      <Card.Footer className="bg-white border-top-0">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            <i className="bi bi-arrow-right-circle me-1" />
            {spot.distance ? `${spot.distance} km away` : 'Distance unknown'}
          </small>
          <Link to={`/spots/${spot.id}`} className="btn btn-sm btn-outline-primary">
            View Details
          </Link>
        </div>
      </Card.Footer>
    </Card>
  );
};

// PropTypes for type checking
SpotCard.propTypes = {
  spot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    location: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    rating: PropTypes.number,
    reviews: PropTypes.array,
    description: PropTypes.string,
    distance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    likedBy: PropTypes.arrayOf(PropTypes.string), // Added likedBy
  }).isRequired,
};

export default SpotCard;