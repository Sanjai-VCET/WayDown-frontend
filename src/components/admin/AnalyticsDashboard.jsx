import { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Bar, Pie } from 'react-chartjs-2';

const AnalyticsDashboard = () => {
  const { isAuthenticated, token, authLoading } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        if (!isAuthenticated || !token) {
          throw new Error('User is not authenticated');
        }
        const response = await axios.get('https://waydown-backend.onrender.com/api/analytics', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });
        setAnalyticsData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        let errorMessage = 'Failed to load analytics data. Please try again later.';
        if (err.response?.status === 401 || err.response?.status === 403) {
          errorMessage = 'Unauthorized: Please log in again.';
        } else if (err.response?.status === 404) {
          errorMessage = 'Analytics service unavailable.';
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchAnalyticsData();
    } else if (!authLoading) {
      setError('Please log in to view analytics.');
      setLoading(false);
    }
  }, [isAuthenticated, token, authLoading]);

  if (loading) {
    return <div className="text-center my-5">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="text-center my-5 text-danger">{error}</div>;
  }

  if (!analyticsData) {
    return <div className="text-center my-5">No analytics data available.</div>;
  }

  const userGrowthData = {
    labels: analyticsData.userGrowth?.map((entry) => entry.month) || ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'User Growth',
        data: analyticsData.userGrowth?.map((entry) => entry.count) || [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const categoryDistributionData = {
    labels: analyticsData.popularCategories?.map((category) => category.name) || [],
    datasets: [
      {
        label: 'Category Distribution',
        data: analyticsData.popularCategories?.map((category) => category.count) || [],
        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e74c3c'],
      },
    ],
  };

  return (
    <>
      <h5 className="mb-4">Analytics Dashboard</h5>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-primary mb-2">{analyticsData.totalUsers || 0}</h3>
              <Card.Title className="text-muted">Total Users</Card.Title>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-success mb-2">{analyticsData.activeUsers || 0}</h3>
              <Card.Title className="text-muted">Active Users</Card.Title>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-info mb-2">{analyticsData.totalSpots || 0}</h3>
              <Card.Title className="text-muted">Total Spots</Card.Title>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-warning mb-2">{analyticsData.totalPosts || 0}</h3>
              <Card.Title className="text-muted">Total Posts</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-3">User Growth Over Time</Card.Title>
              <Bar data={userGrowthData} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title className="mb-3">Category Distribution</Card.Title>
              <Pie data={categoryDistributionData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4 mb-md-0">
            <Card.Body>
              <Card.Title className="mb-3">Popular Categories</Card.Title>
              {(analyticsData.popularCategories || []).map((category, index) => (
                <div key={category.name} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>{category.name}</span>
                    <span>{category.count} spots</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: `${
                          analyticsData.popularCategories[0]?.count
                            ? (category.count / analyticsData.popularCategories[0].count) * 100
                            : 0
                        }%`,
                        backgroundColor:
                          index === 0
                            ? '#3498db'
                            : index === 1
                            ? '#2ecc71'
                            : index === 2
                            ? '#f39c12'
                            : index === 3
                            ? '#9b59b6'
                            : '#e74c3c',
                      }}
                      aria-valuenow={category.count}
                      aria-valuemin="0"
                      aria-valuemax={analyticsData.popularCategories[0]?.count || 1}
                    ></div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Most Popular Spots</Card.Title>
              <div className="table-responsive">
                <table className="table table-borderless">
                  <thead>
                    <tr>
                      <th>Spot Name</th>
                      <th>Views</th>
                      <th>Saves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData.popularSpots || []).map((spot) => (
                      <tr key={spot.id}>
                        <td>{spot.name}</td>
                        <td>{spot.views || 0}</td>
                        <td>{spot.saves || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AnalyticsDashboard;