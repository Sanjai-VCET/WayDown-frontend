import { useState, useEffect } from 'react';
import { Card, Button, Form, Modal, ListGroup, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import {
  CalendarCheck,
  ExclamationTriangle,
  GeoAlt,
  Calendar,
  CurrencyRupee,
  ListUl,
  Send,
  XCircle,
  ArrowRepeat,
} from 'react-bootstrap-icons';

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

  useEffect(() => {
    console.log('Itinerary Updated:', itinerary);
  }, [itinerary]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const N8N_IT_WEBHOOK_URL = import.meta.env.N8N_ITERNARY_WEBHOOK_URL;

  const cleanDescription = (text) => {
    text = text.replace(/\n/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = text.trim();
    const words = text.split(' ');
    if (words.length > 1 && words[0] === words[1]) {
      text = words.slice(1).join(' ');
    }
    const sections = ['Accommodation:', 'Travel:', 'Activities:', 'Morning:', 'Afternoon:', 'Evening:', 'Full Day:', 'Option 1:', 'Option 2:'];
    const regex = new RegExp('(\\b' + sections.join('\\b|\\b') + '\\b)', 'g');
    text = text.replace(regex, '<br /><br />$1');
    return text;
  };

  const handlePlanTrip = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const response = await axios.post(
        'https://waydownnn.app.n8n.cloud/webhook/01c85105-266d-41ca-ab70-dd12c1bf7c63',
        preferences
      );
      console.log('Webhook Response:', response.data);

      // Transform the response into the expected structure
      let rawItinerary = response.data;
      if (typeof rawItinerary === 'string') {
        // Clean extra \ and replace \\n with actual \n
        rawItinerary = rawItinerary.replace(/\\n/g, '\n').replace(/\\/g, '');
        
        // Split on \n\nDay to handle sections properly
        const parts = rawItinerary.split(/\n\nDay /);
        
        // The first part is the summary/intro
        let summary = parts[0].trim();
        
        // The remaining parts are the day texts starting with "1: content" etc.
        const dayTexts = parts.slice(1);
        
        let note = null;
        
        // Create days array with descriptions
        const daysArray = dayTexts.map((dayText, index) => {
          // Remove the leading number and colon, e.g., "1: "
          let cleanedText = dayText.replace(/^\d+:\s*/, '').trim();
          
          // For the last day, check for Note:
          if (index === dayTexts.length - 1) {
            const noteIndex = cleanedText.indexOf('\n\nNote:');
            if (noteIndex !== -1) {
              note = cleanedText.substring(noteIndex + 2).trim(); // +2 for \n\n
              cleanedText = cleanedText.substring(0, noteIndex).trim();
            } else {
              const singleNoteIndex = cleanedText.indexOf('Note:');
              if (singleNoteIndex !== -1) {
                note = cleanedText.substring(singleNoteIndex).trim();
                cleanedText = cleanedText.substring(0, singleNoteIndex).trim();
              }
            }
          }
          
          cleanedText = cleanDescription(cleanedText);
          
          return {
            description: cleanedText
          };
        });

        setItinerary({
          summary: cleanDescription(summary),
          days: daysArray,
          note: note ? cleanDescription(note) : null,
        });
      } else if (rawItinerary && rawItinerary.days) {
        // If the response already has a days array, use it directly
        setItinerary(rawItinerary);
      } else {
        // Fallback for unexpected structure
        setItinerary({ days: [{ description: rawItinerary || 'No details available' }] });
      }
    } catch (err) {
      console.error('Webhook Error:', err);
      setError('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Card.Title className="d-flex align-items-center gap-2">
            <CalendarCheck size={20} className="text-primary" />
            AI Travel Planner
          </Card.Title>
          <Card.Text>
            Let me create a personalized itinerary based on your preferences and available time.
          </Card.Text>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Send size={16} />
            Plan My Trip
          </Button>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Plan Your Trip</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!itinerary ? (
            <Form onSubmit={handlePlanTrip}>
              <Form.Group className="mb-3" controlId="destination">
                <Form.Label className="d-flex align-items-center gap-2">
                  <GeoAlt size={16} />
                  Destination
                </Form.Label>
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
                <Form.Label className="d-flex align-items-center gap-2">
                  <GeoAlt size={16} />
                  Starting Point
                </Form.Label>
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
                <Form.Label className="d-flex align-items-center gap-2">
                  <Calendar size={16} />
                  Number of Days
                </Form.Label>
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
                <Form.Label className="d-flex align-items-center gap-2">
                  <CurrencyRupee size={16} />
                  Budget (in INR)
                </Form.Label>
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
                <Form.Label className="d-flex align-items-center gap-2">
                  <ListUl size={16} />
                  Interests
                </Form.Label>
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

              {error && (
                <Alert variant="danger" className="d-flex align-items-center gap-2">
                  <ExclamationTriangle size={16} />
                  {error}
                </Alert>
              )}

              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Generate Itinerary
                  </>
                )}
              </Button>
            </Form>
          ) : (
            <div>
              <h5>Your Itinerary</h5>
              {itinerary.summary && (
                <p dangerouslySetInnerHTML={{ __html: itinerary.summary }} />
              )}
              <ListGroup>
                {itinerary.days.map((day, index) => (
                  <ListGroup.Item key={index}>
                    <strong>Day {index + 1}:</strong>{' '}
                    <span dangerouslySetInnerHTML={{ __html: day.description }} />
                  </ListGroup.Item>
                ))}
              </ListGroup>
              {itinerary.note && (
                <>
                  <h5>Note</h5>
                  <p dangerouslySetInnerHTML={{ __html: itinerary.note }} />
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <XCircle size={16} />
            Close
          </Button>
          {itinerary && (
            <Button
              variant="primary"
              onClick={() => setItinerary(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <ArrowRepeat size={16} />
              Plan Another Trip
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AITravelPlanner;