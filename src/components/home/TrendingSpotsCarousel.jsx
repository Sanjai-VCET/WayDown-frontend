import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import PropTypes from "prop-types";
import {
  StarFill,
  ChevronLeft,
  ChevronRight,
  ExclamationTriangle,
  ArrowRepeat,
} from "react-bootstrap-icons";

const TrendingSpotsCarousel = ({ limit = 5 }) => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const { isAuthenticated, token, authLoading } = useAuth();

  // Fetch trending spots from backend
  const fetchTrendingSpots = useCallback(async () => {
    try {
      const headers = isAuthenticated && token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get("http://localhost:5000/api/spots/trending", {
        params: { limit },
        headers,
        timeout: 5000,
      });
      const mappedSpots = (response.data?.spots || []).map((spot) => ({
        _id: spot._id,
        id: spot._id,
        name: spot.name || "Unnamed Spot",
        images: spot.photos?.map((photo) => photo.url) || [],
        rating: spot.averageRating || 0,
        reviews: spot.comments || [],
        content: spot.content || "No description available",
      }));
      setSpots(mappedSpots);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching trending spots:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = "Failed to load trending spots. Please try again.";
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.response?.status === 404) {
        errorMessage = "Trending spots service unavailable.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      setError(errorMessage);
      setSpots([
        {
          _id: "placeholder",
          name: "Placeholder Spot",
          images: [{ url: "./fallback-image.jpeg" }],
          rating: 0,
          reviews: [],
          content: "This is a placeholder spot due to data loading failure.",
        },
      ]);
      setLoading(false);
    }
  }, [limit, isAuthenticated, token]);

  // Fetch spots when authenticated
  useEffect(() => {
    if (!authLoading) {
      fetchTrendingSpots();
    }
  }, [authLoading, fetchTrendingSpots]);

  // Sort spots by rating with memoization
  const trendingSpots = useMemo(() => {
    return [...spots]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }, [spots, limit]);

  // Scroll handler
  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading trending spots...
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="text-center py-5 text-danger">
        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
          <ExclamationTriangle size={20} />
          {error}
        </div>
        <Button
          variant="link"
          className="p-0 mt-2"
          onClick={fetchTrendingSpots}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <ArrowRepeat size={16} />
          Retry
        </Button>
      </div>
    );
  }

  // Ensure at least one card is displayed
  const displaySpots = trendingSpots.length > 0 ? trendingSpots : [
    {
      _id: "placeholder",
      name: "Placeholder Spot",
      images: [{ url: "./fallback-image.jpeg" }],
      rating: 0,
      reviews: [],
      content: "This is a placeholder spot due to no available data.",
    },
  ];

  return (
    <div className="position-relative">
      <div
        className="d-flex overflow-auto pb-3 hide-scrollbar"
        ref={scrollRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displaySpots.map((spot) => (
          <div
            key={spot._id}
            className="me-3"
            style={{ minWidth: "280px", maxWidth: "280px" }}
          >
            <Card className="h-100">
              <Card.Img
                variant="top"
                src={spot.images?.[0]?.url || "./fallback-image.jpeg"}
                style={{ height: "160px", objectFit: "cover" }}
                onError={(e) => (e.target.src = "./fallback-image.jpeg")}
              />
              <Card.Body>
                <Card.Title className="mb-1">{spot.name}</Card.Title>
                <div className="d-flex align-items-center mb-2">
                  <StarFill size={16} className="text-warning me-1" />
                  <span>{spot.rating.toFixed(1)}</span>
                  <small className="text-muted ms-1">
                    ({spot.reviews.length} reviews)
                  </small>
                </div>
                <Link to={`/spots/${spot._id}`} className="btn btn-sm btn-outline-primary">
                  View Details
                </Link>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <Button
        variant="light"
        className="position-absolute top-50 start-0 translate-middle-y rounded-circle shadow-sm"
        style={{ width: "40px", height: "40px", padding: "0" }}
        onClick={() => scroll("left")}
        disabled={loading}
      >
        <ChevronLeft size={16} />
      </Button>
      <Button
        variant="light"
        className="position-absolute top-50 end-0 translate-middle-y rounded-circle shadow-sm"
        style={{ width: "40px", height: "40px", padding: "0" }}
        onClick={() => scroll("right")}
        disabled={loading}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

TrendingSpotsCarousel.propTypes = {
  limit: PropTypes.number,
};

export default TrendingSpotsCarousel;