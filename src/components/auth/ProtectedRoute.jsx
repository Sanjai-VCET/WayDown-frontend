import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types'; // For type checking

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true/false = resolved
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  // Fetch auth status from backend
  const fetchAuthStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/status', { timeout: 5000 }); // Replace with your API endpoint
      setIsAuthenticated(response.data.isAuthenticated);
      setIsAdmin(response.data.user?.isAdmin || false);
    } catch (err) {
      setError('Failed to verify authentication.');
      setIsAuthenticated(false); // Default to unauthenticated on error
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  // Loading state
  if (isAuthenticated === null && !error) {
    return <div>Loading...</div>; // Could use a spinner or skeleton UI
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/onboarding" />;
  }

  // Redirect if adminOnly and not an admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" />;
  }

  // Render children if all checks pass
  return children;
};

// PropTypes for type checking
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
};

export default ProtectedRoute;