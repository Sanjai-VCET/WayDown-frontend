import { useState, useCallback } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types'; // For type checking

const SpotCard = ({ spot }) => {
  const [isFavorite, setIsFavorite] = useState(spot.isFavorite || false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [error, setError] = useState(null);

  // Handle favorite toggle with backend API
  const handleFavoriteToggle = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      setLoadingFavorite(true);
      setError(null);

      try {
        if (isFavorite) {
          await axios.post(`/api/spots/${spot.id}/unfavorite`, {}, { timeout: 5000 });
          setIsFavorite(false);
        } else {
          await axios.post(`/api/spots/${spot.id}/favorite`, {}, { timeout: 5000 });
          setIsFavorite(true);
        }
        setLoadingFavorite(false);
      } catch (err) {
        setError('Failed to update favorite status.');
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
            <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`} />
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
    isFavorite: PropTypes.bool,
  }).isRequired,
};

export default SpotCard;