import { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Form, Button, Nav, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import SearchBar from "../components/home/SearchBar";
import RecommendationSection from "../components/home/RecommendationSection";
import TrendingSpotsCarousel from "../components/home/TrendingSpotsCarousel";
import InteractiveMap from "../components/home/InteractiveMap";
import NearbySpotsList from "../components/home/NearbySpotsList";

const Home = () => {
  const [spots, setSpots] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("distance");
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const categories = [
    "All",
    "Adventure",
    "Temples",
    "Waterfalls",
    "Beaches",
    "Mountains",
    "Historical",
    "Nature",
    "Urban",
    "Foodie",
    "Wildlife",
  ];

  // Fetch spots from backend
  const fetchSpots = useCallback(async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/api/spots", {
        params: { page: 1, limit: 12 }, // Fetch 12 spots for display
        timeout: 5000,
      });
      const mappedSpots = (data.spots || []).map((spot) => ({
        ...spot,
        id: spot._id, // For compatibility
        images: spot.photos || [],
        rating: spot.averageRating || 0,
        reviews: spot.comments || [],
        category: spot.tags[0] || "Unknown", // Use first tag as category
        description: spot.content,
        location: spot.city || "Madurai",
        coordinates: spot.location?.coordinates || [0, 0],
        distance: spot.distance || null, // Distance might need to be calculated client-side
      }));
      setSpots(mappedSpots);
      setFilteredSpots(mappedSpots);
      setLoading(false);
    } catch (err) {
      setError("Failed to load spots. Please try again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Fetch user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          console.log("User Location:", { lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Unable to get your location. Using default location.");
          setUserLocation({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
          console.log("Default Location:", { lat: 40.7128, lng: -74.0060 });
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setUserLocation({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
      console.log("Default Location:", { lat: 40.7128, lng: -74.0060 });
    }
  }, []);

  // Filter and sort spots
  const applyFiltersAndSort = useCallback(() => {
    let results = spots;

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (spot) =>
          spot.name.toLowerCase().includes(q) ||
          spot.location.toLowerCase().includes(q) ||
          spot.category.toLowerCase().includes(q) ||
          spot.description.toLowerCase().includes(q)
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "All") {
      results = results.filter((spot) => spot.category === selectedCategory);
    }

    // Apply sorting
    switch (sortBy) {
      case "distance":
        results = [...results].sort(
          (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
        );
        break;
      case "rating":
        results = [...results].sort(
          (a, b) => (b.rating || 0) - (a.rating || 0)
        );
        break;
      case "name":
        results = [...results].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    setFilteredSpots(results);
  }, [spots, searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    if (!loading) {
      applyFiltersAndSort();
    }
  }, [loading, applyFiltersAndSort]);

  // Handle search input
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Handle category selection
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  // Handle sort selection
  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  // Toggle between map and list view
  const toggleView = useCallback(() => {
    setShowMap((prev) => !prev);
  }, []);

  // Loading state
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner
          animation="border"
          size="sm"
          className="me-2"
          aria-label="Loading spots"
        />
        Loading Spots...
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-4">
        <Alert
          variant="danger"
          className="text-center"
          dismissible
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Search and Filters */}
      <Row className="mb-4">
        <Col>
          <SearchBar onSearch={handleSearch} />

          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
            <Nav className="category-nav mb-2 mb-md-0">
              {categories.map((category) => (
                <Nav.Item key={category}>
                  <Button
                    variant={
                      selectedCategory === category
                        ? "primary"
                        : "outline-secondary"
                    }
                    className="me-2 mb-2"
                    onClick={() => handleCategoryChange(category)}
                    aria-label={`Filter by ${category}`}
                  >
                    {category}
                  </Button>
                </Nav.Item>
              ))}
            </Nav>

            <div className="d-flex align-items-center">
              <Form.Select
                className="me-2"
                style={{ width: "auto" }}
                value={sortBy}
                onChange={handleSortChange}
                aria-label="Sort spots by"
              >
                <option value="distance">Nearest</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Alphabetical</option>
              </Form.Select>

              <Button
                variant="outline-primary"
                onClick={toggleView}
                aria-label={
                  showMap ? "Switch to list view" : "Switch to map view"
                }
              >
                {showMap ? "Show List" : "Show Map"}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Recommendations Section */}
      <RecommendationSection />

      {/* Main Content - Map or List View */}
      <Row className="mb-4">
        {showMap ? (
          <Col>
            <InteractiveMap spots={filteredSpots} />
          </Col>
        ) : (
          <>
            {/* Trending Spots */}
            <Col xs={12} className="mb-4">
              <h4 className="mb-3">Trending This Week</h4>
              <TrendingSpotsCarousel />
            </Col>

            {/* Nearby Spots with NearbySpotsList */}
            <Col xs={12}>
              <h4 className="mb-3">
                {searchQuery ? "Search Results" : "Spots Near You"}
              </h4>
              <NearbySpotsList userLocation={userLocation} />
            </Col>
          </>
        )}
      </Row>
    </Container>
  );
};

export default Home;