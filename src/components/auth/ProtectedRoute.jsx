import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { auth } from '../../../firebase';
import AdminDashboard from '../../pages/AdminDashboard';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  const fetchAuthStatus = useCallback(async () => {
    try {
      if (!auth.currentUser) {
        console.log('No current user found');
        setIsAuthenticated(false);
        return;
      }

      const token = await auth.currentUser.getIdToken(true);
      console.log('Retrieved token (truncated):', token.slice(0, 20) + '...');
      console.log('Token length:', token.length);
      console.log('Token parts:', token.split('.').length);

      console.log('Making auth status request...');
      const response = await axios.get('/api/auth/status', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      console.log('Full auth status response:', response.data);

      const authenticated = response.data.authenticated;
      const adminStatus = response.data.user?.isAdmin || false;

      console.log('Setting isAuthenticated:', authenticated);
      console.log('Setting isAdmin:', adminStatus);

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
  if(isAdmin){
    console.log('Rendering: Admin (access granted)');
    return <AdminDashboard token={auth.currentUser.getIdToken(true)} to="/admin" />
  }

  console.log('Rendering: Children (access granted)');
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
};

export default ProtectedRoute;