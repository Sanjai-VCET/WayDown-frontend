import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button, Dropdown, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import PropTypes from 'prop-types';

const Navbar = () => {
  const { currentUser, isAuthenticated, loading, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/onboarding');
    } catch (err) {
      console.error('Failed to logout:', err);
    } finally {
      setExpanded(false);
    }
  }, [navigate, logout]);

  return (
    <BootstrapNavbar
      bg="white"
      expand="lg"
      fixed="top"
      className="shadow-sm"
      expanded={expanded}
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/home" className="d-flex align-items-center">
          <img
            src="/logo.png" // Replace with your actual logo path
            alt="Hidden Spots Logo"
            className="me-2"
            width="30"
            height="30"
            onError={(e) => (e.target.src = 'https://th.bing.com/th?id=OIP.d37R-wbSq8auPhcwo9RzFQHaEJ&w=334&h=187&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2')}
          />
          <span className="fw-bold text-primary">Hidden Spots</span>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(!expanded)}
        />

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/home" onClick={() => setExpanded(false)}>Explore</Nav.Link>
            <Nav.Link as={Link} to="/community" onClick={() => setExpanded(false)}>Community</Nav.Link>
            <Nav.Link as={Link} to="/assistant" onClick={() => setExpanded(false)}>AI Assistant</Nav.Link>
          </Nav>
          <Nav>
            {loading ? (
              <Spinner animation="border" size="sm" className="mt-2" />
            ) : isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" id="dropdown-basic" className="d-flex align-items-center border-0">
                  <img
                    src={currentUser?.avatar || '/default-avatar.png'}
                    alt="Profile"
                    className="rounded-circle me-2"
                    width="30"
                    height="30"
                    onError={(e) => (e.target.src = '/default-avatar.png')}
                  />
                  <span className="d-none d-md-inline">{currentUser?.name || 'User'}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)}>
                    My Profile
                  </Dropdown.Item>
                  {currentUser?.isAdmin && (
                    <Dropdown.Item as={Link} to="/admin" onClick={() => setExpanded(false)}>
                      Admin Dashboard
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button
                variant="primary"
                as={Link}
                to="/onboarding"
                onClick={() => setExpanded(false)}
              >
                Sign In
              </Button>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

// PropTypes (none needed here, but included for consistency)
Navbar.propTypes = {};

export default Navbar;