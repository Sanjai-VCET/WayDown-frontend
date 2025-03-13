import { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import axios from 'axios'; // Using axios for API calls
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AnalyticsDashboard = () => {
  // State to manage data, loading, and errors
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend when component mounts
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axios.get('/api/analytics'); // Replace with your actual API endpoint
        setAnalyticsData(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load analytics data. Please try again later.');
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []); // Empty dependency array means it runs once on mount

  // Loading state
  if (loading) {
    return <div className="text-center my-5">Loading analytics data...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-center my-5 text-danger">{error}</div>;
  }

  // Ensure data exists before rendering
  if (!analyticsData) {
    return null; // Or a fallback UI
  }

  // Example data for charts
  const userGrowthData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'User Growth',
        data: [50, 100, 150, 200, 250, 300], // Replace with actual data
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const categoryDistributionData = {
    labels: analyticsData.popularCategories.map((category) => category.name),
    datasets: [
      {
        label: 'Category Distribution',
        data: analyticsData.popularCategories.map((category) => category.count),
        backgroundColor: [
          '#3498db',
          '#2ecc71',
          '#f39c12',
          '#9b59b6',
          '#e74c3c',
        ],
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
              <h3 className="text-primary mb-2">{analyticsData.totalUsers}</h3>
              <Card.Title className="text-muted">Total Users</Card.Title>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-success mb-2">{analyticsData.activeUsers}</h3>
              <Card.Title className="text-muted">Active Users</Card.Title>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-info mb-2">{analyticsData.totalSpots}</h3>
              <Card.Title className="text-muted">Total Spots</Card.Title>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-warning mb-2">{analyticsData.totalPosts}</h3>
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
              {analyticsData.popularCategories.map((category, index) => (
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
                          (category.count / analyticsData.popularCategories[0].count) * 100
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
                      aria-valuemax={analyticsData.popularCategories[0].count}
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
                    {analyticsData.popularSpots.map((spot) => (
                      <tr key={spot.id}>
                        <td>{spot.name}</td>
                        <td>{spot.views}</td>
                        <td>{spot.saves}</td>
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