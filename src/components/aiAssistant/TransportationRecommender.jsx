import { useState, useEffect, useCallback } from "react";
import { Card, ListGroup, Badge, Spinner, Button } from "react-bootstrap"; // Added Button for retry
import PropTypes from "prop-types"; // For type checking
import {
  CarFront,
  ExclamationTriangle,
  ArrowRepeat,
  InfoCircle,
  TrainFront,
  Airplane,
  BusFront,
  Bicycle,
  PersonWalking,
} from "react-bootstrap-icons"; // Import icons

// Static predefined data
const staticOptions = [
  {
    id: 1,
    name: "High-Speed Train",
    description: "Comfortable and scenic rail travel with frequent departures.",
    recommended: true,
    destination: "Paris",
    icon: "TrainFront",
  },
  {
    id: 2,
    name: "Flight",
    description: "Fastest option for long distances, multiple daily flights.",
    recommended: false,
    destination: "New York",
    icon: "Airplane",
  },
  {
    id: 3,
    name: "Bus",
    description: "Affordable option with extensive routes, ideal for short trips.",
    recommended: true,
    destination: "global",
    icon: "BusFront",
  },
  {
    id: 4,
    name: "Bicycle Rental",
    description: "Eco-friendly way to explore the city at your own pace.",
    recommended: false,
    destination: "Amsterdam",
    icon: "Bicycle",
  },
  {
    id: 5,
    name: "Walking Tour",
    description: "Discover hidden gems on foot with guided or self-guided tours.",
    recommended: true,
    destination: "Rome",
    icon: "PersonWalking",
  },
];

// Map icon names to components
const iconMap = {
  TrainFront: TrainFront,
  Airplane: Airplane,
  BusFront: BusFront,
  Bicycle: Bicycle,
  PersonWalking: PersonWalking,
};

const TransportationRecommender = ({ destination }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch options from static data
  const fetchOptions = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay with setTimeout
      setTimeout(() => {
        const filteredOptions = staticOptions.filter(
          (option) => option.destination === (destination || "global") || option.destination === "global"
        );
        setOptions(filteredOptions);
        setLoading(false);
      }, 1000); // 1-second delay to mimic network request
    } catch (err) {
      setError("Failed to load transportation options. Please try again.");
      setLoading(false);
    }
  }, [destination]);

  // Fetch options on mount or when destination changes
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Loading state
  if (loading) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" /> {/* Use Bootstrap Spinner */}
          Loading transportation options...
        </Card.Body>
      </Card>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="mb-3 shadow-sm">
        <Card.Body className="text-center text-danger">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <ExclamationTriangle size={20} /> {/* Add error icon */}
            {error}
          </div>
          <Button
            variant="link"
            className="p-0 mt-2"
            onClick={fetchOptions}
            style={{ display: "flex", alignItems: "center", gap: "5px", margin: "0 auto" }}
          >
            <ArrowRepeat size={16} /> {/* Add retry icon */}
            Retry
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title className="d-flex align-items-center gap-2">
          <CarFront size={20} className="text-primary" /> {/* Replace bi-car-front */}
          Transportation Options
          {destination && <small className="text-muted ms-2">for {destination}</small>}
        </Card.Title>

        <ListGroup variant="flush">
          {options.length > 0 ? (
            options.map((option, index) => {
              const IconComponent = iconMap[option.icon] || CarFront; // Fallback to CarFront
              return (
                <ListGroup.Item key={option.id || index} className="px-0 py-2 border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <IconComponent size={16} /> {/* Dynamic icon */}
                      {option.name}
                    </div>
                    {option.recommended && <Badge bg="success">Recommended</Badge>}
                  </div>
                  <small className="text-muted d-block mt-1">
                    {option.description || "No details available."}
                  </small>
                </ListGroup.Item>
              );
            })
          ) : (
            <ListGroup.Item className="px-0 py-2 text-muted d-flex align-items-center gap-2">
              <InfoCircle size={16} /> {/* Add empty state icon */}
              No transportation options available for {destination || "this location"}.
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

// PropTypes for type checking
TransportationRecommender.propTypes = {
  destination: PropTypes.string, // Optional destination prop
};

export default TransportationRecommender;