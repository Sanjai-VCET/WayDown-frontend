import { useState, useEffect, useCallback } from "react";
import { Card, Spinner, Alert, Button } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";

const WeatherInfo = ({ spotId, coordinates, location = "Current Location", stable = false }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get API key from environment variables
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required parameters
      if (!API_KEY) {
        throw new Error("Weather API key not configured");
      }
      
      if (!coordinates?.lat || !coordinates?.lng) {
        throw new Error("Invalid location coordinates");
      }

      const [weatherResponse, forecastResponse] = await Promise.all([
        axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&units=metric&appid=${API_KEY}`,
       
        ),
        axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lng}&units=metric&appid=${API_KEY}`,
       
        )
      ]);

      const current = weatherResponse.data;
      const forecastList = forecastResponse.data.list.slice(0, 3);

      setWeatherData({
        temperature: Math.round(current.main.temp),
        condition: current.weather[0]?.main || "N/A",
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed * 3.6),
        forecast: forecastList.map((item) => ({
          day: new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" }),
          temp: Math.round(item.main.temp),
          condition: item.weather[0]?.main || "N/A",
        })),
      });
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load weather data");
    } finally {
      setLoading(false);
    }
  }, [coordinates, API_KEY]);

  useEffect(() => {
    if (!spotId || !coordinates) {
      setError("Missing location data");
      setLoading(false);
      return;
    }

    // Fetch immediately if data is stable, otherwise wait for coordinates
    if ((stable && coordinates) || (!stable && coordinates)) {
      fetchWeatherData();
    }
  }, [spotId, coordinates, stable, fetchWeatherData]);

  const getWeatherIcon = useCallback((condition) => {
    const iconMap = {
      clear: "bi-sun",
      clouds: "bi-cloud",
      rain: "bi-cloud-rain",
      snow: "bi-snow",
      thunderstorm: "bi-cloud-lightning",
      drizzle: "bi-cloud-drizzle",
      atmosphere: "bi-cloud-haze",
    };
    return iconMap[condition?.toLowerCase()] || "bi-cloud";
  }, []);

  if (!coordinates) {
    return (
      <Card className="weather-card">
        <Card.Body className="text-center py-3">
          <Alert variant="warning" className="mb-0">
            Location data unavailable for weather information
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="weather-card">
        <Card.Body className="text-center py-3">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading weather data...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="weather-card">
        <Card.Body className="text-center py-3">
          <Alert variant="danger" className="mb-0">
            {error}
            <Button 
              variant="link" 
              onClick={fetchWeatherData} 
              className="p-0 ms-2"
              aria-label="Retry weather data"
            >
              Retry
            </Button>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="weather-card">
      <Card.Body>
        <Card.Title>
          <i className="bi bi-cloud-sun text-primary me-2" aria-hidden="true" />
          Weather at {location}
        </Card.Title>
        
        <div className="current-weather d-flex align-items-center my-3">
          <div className="temperature me-3">
            <h2 aria-label={`Current temperature: ${weatherData.temperature}°C`}>
              {weatherData.temperature}°C
            </h2>
          </div>
          <div className="condition">
            <div className="condition-icon mb-1">
              <i
                className={`bi ${getWeatherIcon(weatherData.condition)} fs-3 text-warning`}
                aria-hidden="true"
              />
            </div>
            <div>{weatherData.condition}</div>
          </div>
        </div>

        <div className="weather-details mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span>Humidity</span>
            <span>{weatherData.humidity}%</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Wind</span>
            <span>{weatherData.windSpeed} km/h</span>
          </div>
        </div>

        <div className="forecast">
          <h6 className="mb-2">3-Day Forecast</h6>
          <div className="d-flex justify-content-between">
            {weatherData.forecast.map((day, index) => (
              <div
                key={index}
                className="text-center"
                aria-label={`${day.day}: ${day.temp}°C, ${day.condition}`}
              >
                <div className="small">{day.day}</div>
                <div>
                  <i
                    className={`bi ${getWeatherIcon(day.condition)} text-warning`}
                    aria-hidden="true"
                  />
                </div>
                <div className="small">{day.temp}°C</div>
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

WeatherInfo.propTypes = {
  spotId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  coordinates: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
  location: PropTypes.string,
  stable: PropTypes.bool,
};

export default WeatherInfo;
