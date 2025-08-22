// src/components/spotDetails/SpotDetails.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react"; // Added useMemo import
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Tabs,
  Tab,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase"; // Adjust path
import { getIdToken } from "firebase/auth";
import axios from "axios";
import PropTypes from "prop-types";
import SpotHeader from "../components/spotDetails/SpotHeader";
import ImageCarousel from "../components/spotDetails/ImageCarousel";
import DescriptionSection from "../components/spotDetails/DescriptionSection";
import UserReviews from "../components/spotDetails/UserReviews";
import View360Component from "../components/spotDetails/View360Component";
import { useSpots } from "../context/SpotContext";
axios.defaults.baseURL = "http://localhost:5000"; // Adjust if your backend runs on a different port

const SpotDetails = () => {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const reviewsRef = useRef(null); // Ref for the reviews section
  const { toggleFavorite } = useSpots();
  const fetchCountRef = useRef(0); // Track fetch calls

  // --- FIX: Moved coordinate transformation outside fetchSpotDetails ---
  // Use useMemo to derive coordinates from spot data
  // This prevents the "useMemo is not defined" error and ensures coordinates
  // are only recalculated when spot.location.coordinates changes.
  const coordinates = useMemo(() => {
    const coords = spot?.location?.coordinates;
    // Ensure coords is an array with exactly 2 elements [lng, lat]
    if (coords && Array.isArray(coords) && coords.length === 2) {
      return { lat: coords[1], lng: coords[0] };
    }
    return null; // Return null if coordinates are invalid or missing
  }, [spot?.location?.coordinates]); // Dependency: recompute only if this specific value changes
  // --- END FIX ---

  const fetchSpotDetails = useCallback(async () => {
    fetchCountRef.current += 1;
    console.log(`fetchSpotDetails called (${fetchCountRef.current})`);
    try {
      const token = user ? await getIdToken(user) : null;
      const response = await axios.get(`/api/spots/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5000,
      });
      const data = response.data;
      console.log("GET Spot Data:", data);
      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid API response: Expected JSON object");
      }

      // --- FIX: Removed coordinate transformation from here ---
      // The coordinates are now calculated by the useMemo hook above.
      // --- END FIX ---

      const reviews = data.reviews || data.comments || [];
      console.log("Extracted reviews:", reviews);

      setSpot((prev) => {
        const newSpot = {
          ...data,
          id: data._id || id,
          isFavorite: user && data.likedBy?.includes(user.uid),
          reviews,
          rating: data.rating || "N/A",
          // --- FIX: Removed coordinates calculation ---
          // coordinates: ... (was here)
          // --- END FIX ---
          name: data.name || "Unnamed Spot",
          content: data.content || "No description available.",
          bestTimeToVisit: data.bestTimeToVisit || "Information not provided.",
          difficulty: data.difficulty || "Not specified.",
          crowdLevel: data.crowdLevel || "Usually quiet",
        };
        console.log("Updated spot state:", newSpot);
        return newSpot;
      });
      setLoading(false);
    } catch (err) {
      // --- FIX: Removed useMemo reference from error log ---
      console.error("GET Error:", err.response?.data || err.message);
      // --- END FIX ---
      setError(err.response?.data?.error || "Failed to load spot details.");
      setLoading(false);
    }
  }, [id, user]); // Removed useMemo from dependency array (it's not a dependency here)

  useEffect(() => {
    fetchSpotDetails();
  }, [fetchSpotDetails]);

  // --- FIX: Updated map effect to use the memoized coordinates ---
  useEffect(() => {
    // Check if coordinates are available before initializing the map
    if (!coordinates) return;

    const map = L.map(mapRef.current).setView(
      [coordinates.lat, coordinates.lng], // Use memoized coordinates
      14
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.marker([coordinates.lat, coordinates.lng]) // Use memoized coordinates
      .addTo(map)
      .bindPopup(spot?.name || "Location") // Use spot name if available
      .openPopup();
    return () => map.remove();
  }, [coordinates, spot?.name]); // Depend on memoized coordinates and spot name
  // --- END FIX ---

  const refetchSpot = useCallback(() => {
    console.log("refetchSpot called");
    fetchSpotDetails();
  }, [fetchSpotDetails]);

  const handleFavoriteToggle = useCallback(async () => {
    if (!user) {
      setError("Please log in to save spots.");
      return;
    }
    try {
      await toggleFavorite(spot.id);
      setSpot((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    } catch (err) {
      setError("Failed to toggle favorite.");
    }
  }, [user, spot, toggleFavorite]);

  // Scroll to reviews when the tab changes or after adding a review
  const handleTabSelect = (key) => {
    if (key === "reviews" && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Callback to scroll after a review is added
  const handleReviewAdded = useCallback(() => {
    refetchSpot();
    if (reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [refetchSpot]);

  if (loading)
    return (
      <Container className="py-5 text-center">
        <Spinner
          animation="border"
          size="sm"
          className="me-2"
          aria-label="Loading spot details"
        />
        Loading Spot Details...
      </Container>
    );

  if (error || !spot)
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mb-4">
          {error || "Spot not found."}
          <Button
            variant="link"
            onClick={fetchSpotDetails}
            className="p-0 ms-2"
          >
            Retry
          </Button>
        </Alert>
        <Link
          to="/home"
          className="btn btn-primary"
          aria-label="Return to Home"
        >
          Back to Home
        </Link>
      </Container>
    );

  if (typeof spot !== "object" || spot === null) {
    console.error("Spot is not an object:", spot);
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mb-4">
          Invalid spot data. Please try again.
          <Button
            variant="link"
            onClick={fetchSpotDetails}
            className="p-0 ms-2"
          >
            Retry
          </Button>
        </Alert>
        <Link
          to="/home"
          className="btn btn-primary"
          aria-label="Return to Home"
        >
          Back to Home
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4" aria-label={`Details for ${spot.name}`}>
      <Row className="mb-4">
        <Col>
          <Link
            to="/home"
            className="text-decoration-none mb-3 d-inline-block"
            aria-label="Back to Explore"
          >
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />
            Back to Explore
          </Link>
          <SpotHeader
            spot={spot}
            onRetry={fetchSpotDetails}
            setSpot={setSpot}
          />
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Badge bg="primary">{spot.tags?.[0] || "Unknown"}</Badge>
            <Badge bg="secondary">
              <i className="bi bi-star-fill me-1" aria-hidden="true" />
              {spot.rating || "N/A"}
            </Badge>
            <Badge bg="info">
              <i className="bi bi-geo-alt me-1" aria-hidden="true" />
              {spot.distance ? `${spot.distance} km away` : "Distance unknown"}
            </Badge>
            <Badge bg="success">{spot.bestTimeToVisit}</Badge>
          </div>
          <div className="d-flex flex-wrap gap-2 mb-4">
            <Button
              variant={spot.isFavorite ? "danger" : "outline-danger"}
              onClick={handleFavoriteToggle}
              aria-label={
                spot.isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <i
                className={`bi ${
                  spot.isFavorite ? "bi-heart-fill" : "bi-heart"
                } me-2`}
                aria-hidden="true"
              />
              {spot.isFavorite ? "Saved" : "Save"}
            </Button>
            <Button
              variant="primary"
              as="a"
              // --- FIX: Use memoized coordinates for directions link ---
              href={`https://maps.google.com/?q=${coordinates?.lat},${coordinates?.lng}`}
              // --- END FIX ---
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get Directions"
              disabled={!coordinates} // Disable if coordinates are missing
            >
              <i className="bi bi-compass me-2" aria-hidden="true" />
              Get Directions
            </Button>
            <Button
              variant="outline-primary"
              onClick={() =>
                navigator.clipboard.writeText(window.location.href)
              }
              aria-label="Share this spot"
            >
              <i className="bi bi-share me-2" aria-hidden="true" />
              Share
            </Button>
          </div>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={8}>
          <ImageCarousel spotId={id} />
        </Col>
        <Col md={4}>

          <div className="mt-3">
            <View360Component spotId={id} />
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <Tabs
            defaultActiveKey="description"
            className="mb-4"
            aria-label="Spot Details Tabs"
            onSelect={handleTabSelect}
          >
            <Tab
              eventKey="description"
              title="Description"
              id="description-tab"
            >
              <DescriptionSection
                spot={spot}
                onRetry={fetchSpotDetails}
                setSpot={setSpot}
              />
            </Tab>
            <Tab
              eventKey="reviews"
              title={`Reviews (${spot.reviews?.length || 0})`}
              id="reviews-tab"
            >
              <div ref={reviewsRef}>
                <UserReviews spotId={id} reviews={spot.reviews || []} />
              </div>
            </Tab>
            <Tab eventKey="nearby" title="Nearby Spots" id="nearby-tab">
              <div className="py-3">
                {/* --- FIX: Use memoized coordinates for the map display check --- */}
                {coordinates ? (
                  <div
                    ref={mapRef}
                    style={{
                      height: "400px",
                      width: "100%",
                      borderRadius: "8px",
                    }}
                    aria-label={`Map showing location of ${spot.name}`}
                  />
                ) : (
                  <p>Location data unavailable.</p>
                )}
                {/* --- END FIX --- */}
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

SpotDetails.propTypes = {};
export default SpotDetails;