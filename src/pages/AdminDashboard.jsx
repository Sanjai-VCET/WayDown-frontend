import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SpotManagementTable from '../components/admin/SpotManagementTable';
import UserReportsSection from '../components/admin/UserReportsSection';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import UserManagementTable from '../components/admin/UserManagementTable';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('spots');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Handle tab selection
  const handleTabSelect = useCallback((key) => {
    setActiveTab(key);
  }, []);

  // Check auth and admin status on mount
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setError('Please log in to access the admin dashboard.');
      navigate('/onboarding');
    } else if (!isAdmin) {
      setError('You do not have permission to access the admin dashboard.');
      navigate('/home');
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, isAdmin, navigate]);

  // Loading state
  if (loading || authLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading Admin Dashboard...
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4" aria-label="Admin Dashboard">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-1">Admin Dashboard</h2>
          <p className="text-muted">Manage spots, user reports, analytics, and users</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <Nav
                variant="tabs"
                activeKey={activeTab}
                onSelect={handleTabSelect}
                aria-label="Admin Dashboard Navigation"
              >
                <Nav.Item>
                  <Nav.Link eventKey="spots" aria-controls="spots-tab">
                    Spot Management
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="reports" aria-controls="reports-tab">
                    User Reports
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="analytics" aria-controls="analytics-tab">
                    Analytics
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="users" aria-controls="users-tab">
                    User Management
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body>
              <Tab.Content>
                <Tab.Pane eventKey="spots" id="spots-tab" active={activeTab === 'spots'} aria-labelledby="spots-tab">
                  <SpotManagementTable />
                </Tab.Pane>
                <Tab.Pane eventKey="reports" id="reports-tab" active={activeTab === 'reports'} aria-labelledby="reports-tab">
                  <UserReportsSection />
                </Tab.Pane>
                <Tab.Pane eventKey="analytics" id="analytics-tab" active={activeTab === 'analytics'} aria-labelledby="analytics-tab">
                  <AnalyticsDashboard />
                </Tab.Pane>
                <Tab.Pane eventKey="users" id="users-tab" active={activeTab === 'users'} aria-labelledby="users-tab">
                  <UserManagementTable />
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;