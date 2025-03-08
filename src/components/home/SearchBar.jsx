import { useState, useCallback, useEffect } from 'react';
import { InputGroup, Form, Button, Spinner, ListGroup, Alert } from 'react-bootstrap';
import axios from 'axios';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Debounced search handler for suggestions
  const handleSearchSuggestions = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get('http://localhost:3000/api/spots/search/suggestions', {
          params: { q: searchQuery },
          timeout: 5000,
        });
        setSuggestions(response.data || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch suggestions. Please try again.');
        setLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);
      handleSearchSuggestions(value);
    },
    [handleSearchSuggestions]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      setSuggestions([]);

      try {
        const response = await axios.get('http://localhost:3000/api/spots/search', {
          params: { query },
          timeout: 5000,
        });
        onSearch(response.data); // Pass { spots, totalPages } to parent
        setLoading(false);
      } catch (err) {
        setError('Search failed. Please try again.');
        setLoading(false);
      }
    },
    [query, onSearch]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion) => {
      setQuery(suggestion);
      setSuggestions([]);
      handleSubmit({ preventDefault: () => {} });
    },
    [handleSubmit]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => handleSearchSuggestions.cancel();
  }, [handleSearchSuggestions]);

  return (
    <Form onSubmit={handleSubmit} className="position-relative">
      <InputGroup className="mb-3">
        <InputGroup.Text>
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <i className="bi bi-search"></i>
          )}
        </InputGroup.Text>
        <Form.Control
          placeholder="Search for hidden spots, locations, or categories..."
          value={query}
          onChange={handleChange}
          disabled={loading}
          aria-label="Search"
        />
        <Button variant="primary" type="submit" disabled={loading || !query.trim()}>
          Search
        </Button>
      </InputGroup>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <ListGroup
          className="position-absolute w-100"
          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
        >
          {suggestions.map((suggestion, index) => (
            <ListGroup.Item
              key={index}
              action
              onClick={() => handleSuggestionClick(suggestion)}
              style={{ cursor: 'pointer' }}
            >
              {suggestion}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="danger" className="small mt-1">
          {error}
          <Button variant="link" onClick={handleSubmit} className="p-0 ms-2">
            Retry
          </Button>
        </Alert>
      )}
    </Form>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default SearchBar;