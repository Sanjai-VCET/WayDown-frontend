import { useState, useEffect, useCallback } from "react";
import { Carousel, Spinner, Alert, Button } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { auth } from "../../../firebase";
import { getIdToken } from "firebase/auth";

const ImageCarousel = ({ spotId }) => {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImages = useCallback(async () => {
    try {
      const token = auth.currentUser
        ? await getIdToken(auth.currentUser)
        : null;
      const response = await axios.get(
        `http://localhost:5000/api/spots/${spotId}/images`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 5000,
        }
      );
      console.log("ImageCarousel Data:", response.data); // Debug log
      // Backend returns array of objects or URLs
      const imageArray = Array.isArray(response.data)
        ? response.data.map((item) =>
            typeof item === "string" ? { url: item } : item
          )
        : [];
      setImages(imageArray);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load images, bro!");
      setLoading(false);
      console.error("Image Fetch Error:", err);
    }
  }, [spotId]);

  useEffect(() => {
    if (spotId) {
      fetchImages();
    } else {
      setError("No spot ID provided, mate!");
      setLoading(false);
    }
  }, [spotId, fetchImages]);

  const handleSelect = useCallback((selectedIndex) => {
    setIndex(selectedIndex);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading images...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="link" onClick={fetchImages} className="p-0 ms-2">
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No images available for this spot.</p>
      </div>
    );
  }

  return (
    <Carousel
      activeIndex={index}
      onSelect={handleSelect}
      className="spot-carousel rounded overflow-hidden shadow-sm"
      interval={5000}
      pause="hover"
      aria-label="Image carousel for spot"
    >
      {images.map((image, idx) => (
        <Carousel.Item key={image.id || idx}>
          <img
            className="d-block w-100"
            src={image.url || image}
            alt={`Slide ${idx + 1} - ${image.caption || "Spot image"}`}
            style={{ height: "400px", objectFit: "cover" }}
            onError={(e) => (e.target.src = "/fallback-image.jpg")}
          />
          {image.caption && (
            <Carousel.Caption>
              <p className="mb-0 bg-dark bg-opacity-50 p-2 rounded">
                {image.caption}
              </p>
            </Carousel.Caption>
          )}
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

ImageCarousel.propTypes = {
  spotId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default ImageCarousel;
