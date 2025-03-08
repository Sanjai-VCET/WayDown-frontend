import { useState, useEffect, useCallback } from "react";
import { Card, Badge, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";

const TrendingTags = ({ limit = 10 }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const response = await axios.get("/api/tags/trending", {
        params: { limit },
        timeout: 5000,
      });
      // Ensure tags is always an array
      const tagsData = Array.isArray(response.data) ? response.data : [];
      setTags(tagsData);
      setLoading(false);
    } catch {
      setError("Failed to load trending tags. Please try again.");
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTrendingTags();
  }, [fetchTrendingTags]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading trending tags...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center text-danger">
          {error}
          <div>
            <button
              className="btn btn-link p-0 mt-2"
              onClick={fetchTrendingTags}
            >
              Retry
            </button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="mb-3">Trending Tags</Card.Title>
        <div className="d-flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Link
                to={`/tags/${tag.name}`}
                key={tag.name}
                className="text-decoration-none"
              >
                <Badge
                  bg="light"
                  text="dark"
                  className="p-2 mb-2"
                  style={{ cursor: "pointer" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e9ecef")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                >
                  #{tag.name} <span className="text-muted">({tag.count})</span>
                </Badge>
              </Link>
            ))
          ) : (
            <p className="text-muted m-0">No trending tags available.</p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

TrendingTags.propTypes = {
  limit: PropTypes.number,
};

export default TrendingTags;
