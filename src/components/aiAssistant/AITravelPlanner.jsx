import { useState } from 'react';
import { Card, Button, Form, Modal, ListGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';

const AITravelPlanner = () => {
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({
    destination: '',
    days: '',
    interests: '',
    budget: '',
    startingpoint: '',
  });
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  // Send form data to n8n Webhook
  const handlePlanTrip = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const response = await axios.post(
        'https://shreesh.app.n8n.cloud/webhook-test/01c85105-266d-41ca-ab70-dd12c1bf7c63', // n8n Webhook URL
        preferences
      );
      setItinerary(response.data);
    } catch (err) {
      setError('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form and close modal
  const handleClose = () => {
    setShowModal(false);
    setPreferences({
      destination: '',
      days: '',
      interests: '',
      budget: '',
      startingpoint: '',
    });
    setItinerary(null);
    setError(null);
  };

  return (
    <>
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Card.Title>
            <i className="bi bi-calendar-check text-primary me-2"></i>
            AI Travel Planner
          </Card.Title>
          <Card.Text>
            Let me create a personalized itinerary based on your preferences and available time.
          </Card.Text>
          <Button variant="outline-primary" size="sm" onClick={() => setShowModal(true)}>
            Plan My Trip
          </Button>
        </Card.Body>
      </Card>

      {/* Modal for preferences and itinerary */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Plan Your Trip</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!itinerary ? (
            <Form onSubmit={handlePlanTrip}>
              <Form.Group className="mb-3" controlId="destination">
                <Form.Label>Destination</Form.Label>
                <Form.Control
                  type="text"
                  name="destination"
                  value={preferences.destination}
                  onChange={handleInputChange}
                  placeholder="e.g., Paris"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="startingpoint">
                <Form.Label>Starting Point</Form.Label>
                <Form.Control
                  type="text"
                  name="startingpoint"
                  value={preferences.startingpoint}
                  onChange={handleInputChange}
                  placeholder="e.g., New York"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="days">
                <Form.Label>Number of Days</Form.Label>
                <Form.Control
                  type="number"
                  name="days"
                  value={preferences.days}
                  onChange={handleInputChange}
                  placeholder="e.g., 3"
                  min="1"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="budget">
                <Form.Label>Budget (in INR)</Form.Label>
                <Form.Control
                  type="number"
                  name="budget"
                  value={preferences.budget}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  min="1"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="interests">
                <Form.Label>Interests</Form.Label>
                <Form.Control
                  as="textarea"
                  name="interests"
                  value={preferences.interests}
                  onChange={handleInputChange}
                  placeholder="e.g., museums, food, hiking"
                  rows={2}
                  required
                />
              </Form.Group>

              {error && <p className="text-danger">{error}</p>}

              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Itinerary'
                )}
              </Button>
            </Form>
          ) : (
            <div>
              <h5>Your Itinerary</h5>
              <ListGroup variant="flush">
                {itinerary.days.map((day, index) => (
                  <ListGroup.Item key={index}>
                    <strong>Day {index + 1}:</strong> {day.description}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          {itinerary && (
            <Button variant="primary" onClick={() => setItinerary(null)}>
              Plan Another Trip
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AITravelPlanner;
