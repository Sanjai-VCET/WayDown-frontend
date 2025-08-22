import { useState, useCallback, useEffect } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import {
  HandThumbsUp,
  HandThumbsUpFill,
  GeoAlt,
  StarFill,
  ArrowRightCircle,
} from 'react-bootstrap-icons';

const SpotCard = ({ spot }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, token, userId } = useAuth();

  useEffect(() => {
    if (isAuthenticated && userId && spot.likedBy) {
      setIsFavorite(spot.likedBy.includes(userId));
    }
  }, [spot.likedBy, isAuthenticated, userId]);

  const handleFavoriteToggle = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated || !token) {
        setError('You must be logged in to like a spot.');
        return;
      }

      setLoadingFavorite(true);
      setError(null);

      try {
        const url = isFavorite
          ? `http://localhost:5000/api/spots/${spot.id}/unlike`
          : `http://localhost:5000/api/spots/${spot.id}/like`;

        console.log('Making request to:', url);

        await axios.post(url, {}, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });

        setIsFavorite((prev) => !prev);
        setLoadingFavorite(false);
      } catch (err) {
        console.error('Error updating like status:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        let errorMessage = 'Failed to update like status.';
        if (err.response?.status === 400 && err.response?.data?.error === 'Spot already liked') {
          errorMessage = 'You have already liked this spot.';
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response?.status === 404) {
          errorMessage = 'Spot not found.';
        }
        setError(errorMessage);
        setLoadingFavorite(false);
      }
    },
    [spot.id, isFavorite, isAuthenticated, token]
  );

  const locationString =
    typeof spot.location === 'object' && spot.location.coordinates
      ? spot.location.coordinates.join(', ')
      : spot.location || 'Unknown location';

  return (
    <Card className="h-100 spot-card">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={spot.photos?.[0]?.url || './fallback-image.jpeg'}
          alt={spot.name}
          style={{ height: '180px', objectFit: 'cover' }}
          onError={(e) => (e.target.src = './fallback-image.jpeg')}
        />
        <Badge bg="primary" className="position-absolute top-0 start-0 m-2">
          {spot.tags?.[0] || 'N/A'}
        </Badge>
        <Button
          variant={isFavorite ? 'danger' : 'light'}
          size="sm"
          className="position-absolute top-0 end-0 m-2 rounded-circle"
          style={{ width: '32px', height: '32px', padding: '0' }}
          onClick={handleFavoriteToggle}
          disabled={loadingFavorite || !isAuthenticated}
          title={isAuthenticated ? '' : 'Log in to like this spot'}
        >
          {loadingFavorite ? (
            <Spinner animation="border" size="sm" />
          ) : isFavorite ? (
            <HandThumbsUpFill size={16} />
          ) : (
            <HandThumbsUp size={16} />
          )}
        </Button>
      </div>

      <Card.Body>
        <Card.Title>{spot.name || 'Unnamed Spot'}</Card.Title>
        <div className="d-flex align-items-center mb-2">
          <GeoAlt size={16} className="text-primary me-1" />
          <small className="text-muted">{locationString}</small>
        </div>
        <div className="d-flex align-items-center mb-2">
          <StarFill size={16} className="text-warning me-1" />
          <span>{spot.averageRating?.toFixed(1) || 'N/A'}</span>
          <small className="text-muted ms-1">
            ({spot.comments?.length || 0} reviews)
          </small>
        </div>
        <Card.Text className="text-truncate">
          {spot.content || 'No description available.'}
        </Card.Text>
        {error && <small className="text-danger d-block mt-2">{error}</small>}
      </Card.Body>

      <Card.Footer className="bg-white border-top-0">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            <ArrowRightCircle size={16} className="me-1" />
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

SpotCard.propTypes = {
  spot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    photos: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
    tags: PropTypes.arrayOf(PropTypes.string),
    location: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        coordinates: PropTypes.arrayOf(PropTypes.number),
      }),
    ]),
    averageRating: PropTypes.number,
    comments: PropTypes.array,
    content: PropTypes.string,
    distance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    likedBy: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

export default SpotCard;