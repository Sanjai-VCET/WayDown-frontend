import { useState, useEffect, useCallback, useRef } from "react";
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
import { auth } from "../../firebase";
import { getIdToken } from "firebase/auth";
import axios from "axios";
import PropTypes from "prop-types";
import SpotHeader from "../components/spotDetails/SpotHeader";
import ImageCarousel from "../components/spotDetails/ImageCarousel";
import DescriptionSection from "../components/spotDetails/DescriptionSection";
import UserReviews from "../components/spotDetails/UserReviews";
import WeatherInfo from "../components/spotDetails/WeatherInfo";
import View360Component from "../components/spotDetails/View360Component";
import { useSpots } from "../context/SpotContext";

axios.defaults.baseURL = "http://localhost:3000";

const SpotDetails = () => {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const scriptLoaded = useRef(false);
  const { toggleFavorite } = useSpots();

  const fetchSpotDetails = useCallback(async () => {
    try {
      const token = user ? await getIdToken(user) : null;
      const response = await axios.get(`/api/spots/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5000,
      });
      const data = response.data;
      console.log("Spot Data:", data);

      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid API response: Expected JSON object");
      }

      // Debug coordinates
      const coords = data.location?.coordinates;
      console.log("Raw Coordinates:", coords);

      setSpot({
        ...data,
        id: data._id || id,
        isFavorite: user && data.likedBy?.includes(user.uid),
        reviews: data.comments || [],
        rating: data.rating || "N/A",
        coordinates: coords && Array.isArray(coords) && coords.length === 2
          ? { lat: coords[1], lng: coords[0] }
          : null,
        name: data.name || "Unnamed Spot",
        content: data.content || "No description available.",
        bestTimeToVisit: data.bestTimeToVisit || "Information not provided.",
        difficulty: data.difficulty || "Not specified.",
        crowdLevel: data.crowdLevel || "Usually quiet",
      });
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || "Failed to load spot details, bro!");
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchSpotDetails();
  }, [fetchSpotDetails]);

  useEffect(() => {
    if (!spot || !spot.coordinates) return;

    const map = L.map(mapRef.current).setView(
      [spot.coordinates.lat, spot.coordinates.lng],
      14
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([spot.coordinates.lat, spot.coordinates.lng])
      .addTo(map)
      .bindPopup(spot.name)
      .openPopup();

    return () => {
      map.remove();
    };
  }, [spot]);
  

  const handleFavoriteToggle = useCallback(async () => {
    if (!user) {
      setError("Log in to save spots, dude!");
      return;
    }
    try {
      await toggleFavorite(spot.id);
      setSpot((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    } catch (err) {
      setError("Failed to toggle favorite, bro!");
    }
  }, [user, spot, toggleFavorite]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" size="sm" className="me-2" aria-label="Loading spot details" />
        Loading Spot Details...
      </Container>
    );
  } 
  if (error || !spot) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mb-4">
          {error || "Spot not found, mate!"}
        </Alert>
        <Link to="/home" className="btn btn-primary" aria-label="Return to Home">
          Back to Home
        </Link>
      </Container>
    );
  }

  if (typeof spot !== "object" || spot === null) {
    console.error("Spot is not an object:", spot);
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger" className="mb-4">
          Invalid spot data. Please try again.
        </Alert>
        <Link to="/home" className="btn btn-primary" aria-label="Return to Home">
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
          <SpotHeader spot={spot} onRetry={fetchSpotDetails} setSpot={setSpot} />
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
              aria-label={spot.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <i
                className={`bi ${spot.isFavorite ? "bi-heart-fill" : "bi-heart"} me-2`}
                aria-hidden="true"
              />
              {spot.isFavorite ? "Saved" : "Save"}
            </Button>
            <Button
              variant="primary"
              as="a"
              href={`https://maps.google.com/?q=${spot.coordinates?.lat},${spot.coordinates?.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get Directions"
            >
              <i className="bi bi-compass me-2" aria-hidden="true" />
              Get Directions
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
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
          <WeatherInfo   spotId={id}
  coordinates={spot.coordinates} // Ensure this is not null or undefined
  location={spot.city || "unknown location"} stable ={true} />

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
          >
            <Tab eventKey="description" title="Description" id="description-tab">
              <DescriptionSection spot={spot} onRetry={fetchSpotDetails} setSpot={setSpot} />
            </Tab>
            <Tab eventKey="reviews" title={`Reviews (${spot.reviews?.length || 0})`} id="reviews-tab">
              <UserReviews spotId={id} reviews={spot.reviews || []} />
            </Tab>
            <Tab eventKey="nearby" title="Nearby Spots" id="nearby-tab">
              <div className="py-3">
                {spot.coordinates ? (
                  <div
                    ref={mapRef}
                    style={{ height: "400px", width: "100%", borderRadius: "8px" }}
                    aria-label={`Map showing location of ${spot.name}`}
                  />
                ) : (
                  <p>Location data unavailable.</p>
                )}
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