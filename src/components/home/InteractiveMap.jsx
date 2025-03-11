import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import PropTypes from "prop-types";
import axios from "axios";
import { Button } from "react-bootstrap";

// Fix for Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Default center (used if user location is unavailable)
const defaultCenter = [40.7128, -74.0060]; // New York City [lat, lng]

// Custom icons for different categories
const categoryIcons = {
  Adventure: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Temples: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Waterfalls: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Beaches: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Mountains: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Historical: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Nature: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Urban: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Foodie: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-brown.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  Wildlife: L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
  default: L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  }),
};

// Custom icon for user location (blue dot)
const userIcon = L.divIcon({
  className: "custom-user-icon",
  html: '<div style="background-color: blue; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// Component to handle map recentering
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13); // Zoom in when recentering
    }
  }, [center, map]);
  return null;
};

// Component to handle the "Locate Me" button
const LocateControl = ({ onLocate }) => {
  return (
    <Button
      variant="primary"
      onClick={onLocate}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
      }}
      aria-label="Locate my current position"
    >
      Locate Me
    </Button>
  );
};

const InteractiveMap = ({ spots: initialSpots }) => {
  const [center, setCenter] = useState(defaultCenter);
  const [userPosition, setUserPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [spots, setSpots] = useState([]);
  const mapRef = useRef();

  // Get user location on component mount
  useEffect(() => {
    const getInitialLocation = () => {
      if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newPosition = [latitude, longitude];
            console.log("Initial user location:", newPosition);
            setCenter(newPosition);
            setUserPosition(newPosition);
            setIsLocating(false);
          },
          (err) => {
            console.error("Initial geolocation error:", err);
            setCenter(defaultCenter);
            setUserPosition(null);
            setIsLocating(false);
            alert(
              "Unable to retrieve your initial location. Please enable location services or use the 'Locate Me' button."
            );
          },
          { timeout: 10000, maximumAge: 0 } // Add timeout and freshness settings
        );
      } else {
        console.error("Geolocation not supported by this browser.");
        setCenter(defaultCenter);
        setUserPosition(null);
        alert("Geolocation is not supported by this browser.");
      }
    };
    getInitialLocation();
  }, []);

  // Geocode spots with missing or invalid coordinates using Nominatim
  useEffect(() => {
    const geocodeSpots = async () => {
      const updatedSpots = await Promise.all(
        initialSpots.map(async (spot) => {
          if (
            !spot.location ||
            !spot.location.coordinates ||
            spot.location.coordinates.length !== 2 ||
            spot.location.coordinates.some((coord) => isNaN(coord))
          ) {
            try {
              const address = spot.city || spot.location || "World";
              const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
              );
              const result = response.data[0];
              if (result) {
                return {
                  ...spot,
                  location: {
                    coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
                  },
                };
              }
            } catch (error) {
              console.error(`Geocoding failed for ${spot.name}:`, error);
            }
          }
          return spot;
        })
      );
      setSpots(updatedSpots);
    };
    geocodeSpots();
  }, [initialSpots]);

  // Function to locate the user's current position
  const locateUser = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = [latitude, longitude];
          console.log("Located user at:", newPosition);
          setCenter(newPosition);
          setUserPosition(newPosition);
          setIsLocating(false);
        },
        (err) => {
          console.error("Locate error:", err);
          setIsLocating(false);
          alert(
            "Unable to locate you. Please ensure location services are enabled and permissions are granted."
          );
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true } // Enhanced options
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Map spots to marker-compatible format with category-based icons
  const markers = spots
    .filter(
      (spot) =>
        spot.location &&
        spot.location.coordinates &&
        spot.location.coordinates.length === 2
    )
    .map((spot) => ({
      id: spot.id,
      position: [spot.location.coordinates[0], spot.location.coordinates[1]], // [lat, lng]
      name: spot.name,
      description: spot.description || "No description available",
      category: spot.tags && spot.tags.length > 0 ? spot.tags[0] : "default",
    }));

  return (
    <div style={{ position: "relative", height: "400px", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        {/* OpenStreetMap tile layer (no API key required) */}
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recenter the map when the center changes */}
        <RecenterMap center={center} />

        {/* Marker for user location */}
        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Individual markers for spots */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={categoryIcons[marker.category] || categoryIcons.default}
          >
            <Popup>
              <div>
                <h6>{marker.name}</h6>
                <p>{marker.description}</p>
                <a
                  href={`/spots/${marker.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Locate Me Button */}
      <LocateControl
        onLocate={locateUser}
        disabled={isLocating}
      />
    </div>
  );
};

// PropTypes for type checking
InteractiveMap.propTypes = {
  spots: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      location: PropTypes.shape({
        coordinates: PropTypes.arrayOf(PropTypes.number),
      }),
      city: PropTypes.string,
    })
  ).isRequired,
};

export default InteractiveMap;