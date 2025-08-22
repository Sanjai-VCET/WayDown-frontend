import { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../api/api"; // Import configured Axios instance

const Footer = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState(null);
  const currentYear = new Date().getFullYear();



  // Handle newsletter subscription
  const handleSubscribe = useCallback(
    async (e) => {
      e.preventDefault();
      if (!email.trim()) return;

      setSubscribeLoading(true);
      setSubscribeMessage(null);

      try {
        await api.post("/api/newsletter/subscribe", { email }, { timeout: 5000 });
        setSubscribeMessage("Successfully subscribed! Check your email for confirmation.");
        setEmail("");
      } catch {
        setSubscribeMessage("Failed to subscribe. Please try again.");
      } finally {
        setSubscribeLoading(false);
      }
    },
    [email]
  );

  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row className="mb-4">
          <Col md={4} className="mb-3 mb-md-0">
            <h5 className="mb-3">Hidden Spots</h5>
            <p className="text-muted">
              Discover the world's hidden gems and secret locations with our
              community-driven platform.
            </p>
          </Col>

          <Col md={2} className="mb-3 mb-md-0">
            <h6 className="mb-3">Explore</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/home" className="text-muted text-decoration-none hover-light">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/community" className="text-muted text-decoration-none hover-light">
                  Community
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/assistant" className="text-muted text-decoration-none hover-light">
                  AI Assistant
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={2} className="mb-3 mb-md-0">
            <h6 className="mb-3">Account</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/profile" className="text-muted text-decoration-none hover-light">
                  Profile
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/onboarding" className="text-muted text-decoration-none hover-light">
                  Sign In
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/onboarding" className="text-muted text-decoration-none hover-light">
                  Register
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={4}>
            <h6 className="mb-3">Connect With Us</h6>
            {loading ? (
              <Spinner animation="border" size="sm" className="text-muted" />
            ) : error ? (
              <p className="text-danger small">{error}</p>
            ) : (
              <div className="d-flex gap-3 mb-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    className="text-muted hover-light"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className={`bi bi-${link.platform}`} />
                  </a>
                ))}
              </div>
            )}
            <p className="text-muted small">
              Subscribe to our newsletter for the latest hidden spots and travel tips.
            </p>
            <Form onSubmit={handleSubscribe} className="d-flex gap-2">
              <Form.Control
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribeLoading}
                size="sm"
                className="bg-dark text-light border-secondary"
              />
              <Button
                variant="outline-light"
                size="sm"
                type="submit"
                disabled={subscribeLoading || !email.trim()}
              >
                {subscribeLoading ? <Spinner animation="border" size="sm" /> : "Subscribe"}
              </Button>
            </Form>
            {subscribeMessage && (
              <p
                className={`small mt-2 ${
                  subscribeMessage.includes("Success") ? "text-success" : "text-danger"
                }`}
              >
                {subscribeMessage}
              </p>
            )}
          </Col>
        </Row>

        <hr className="my-3 border-secondary" />

        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-2 mb-md-0">
            <p className="text-muted small mb-0">
              © {currentYear} Hidden Spots Locator. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <a href="#" className="text-muted small hover-light">
                  Privacy Policy
                </a>
              </li>
              <li className="list-inline-item mx-3">
                <a href="#" className="text-muted small hover-light">
                  Terms of Service
                </a>
              </li>
              <li className="list-inline-item">
                <a href="#" className="text-muted small hover-light">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

Footer.propTypes = {};

export default Footer;