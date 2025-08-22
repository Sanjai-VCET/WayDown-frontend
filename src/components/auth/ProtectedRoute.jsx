import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import AdminDashboard from '../../pages/AdminDashboard';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log('No token found in localStorage');
        setIsAuthenticated(false);
        return;
      }

      console.log('Making auth status request with token:', token.slice(0, 20) + '...');
      const response = await axios.get('/api/auth/status', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      console.log('Auth status response:', response.data);

      const authenticated = response.data.authenticated;
      const adminStatus = response.data.user?.isAdmin || false;

      setIsAuthenticated(authenticated);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error('Failed to verify authentication:', err.message);
      setError('Failed to verify authentication.');
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    console.log('Fetching auth status on mount');
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  if (isAuthenticated === null && !error) {
    console.log('Rendering: Loading state');
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('Rendering: Redirect to /onboarding (not authenticated)');
    return <Navigate to="/onboarding" />;
  }

  if (adminOnly && !isAdmin) {
    console.log('Rendering: Redirect to /home (adminOnly true, isAdmin false)');
    return <Navigate to="/home" />;
  }

  if (isAdmin) {
    console.log('Rendering: Admin (access granted)');
    return <AdminDashboard token={localStorage.getItem("token")} to="/admin" />;
  }

  console.log('Rendering: Children (access granted)');
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
};

export default ProtectedRoute;