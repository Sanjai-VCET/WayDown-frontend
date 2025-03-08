import { useState, useEffect } from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import axios from 'axios';

const UserReportsSection = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reports from backend on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/reports'); // Replace with your API endpoint
        setReports(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load reports. Please try again later.');
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle review action (placeholder)
  const handleReview = (report) => {
    console.log('Reviewing report:', report);
    // In a real app, this could open a modal with details or redirect to a review page
  };

  // Handle resolve action with API call
  const handleResolve = async (reportId) => {
    try {
      await axios.put(`/api/reports/${reportId}`, { status: 'resolved' }); // Replace with your endpoint
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId ? { ...report, status: 'resolved' } : report
        )
      );
    } catch (err) {
      setError('Failed to resolve report. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return <div className="text-center my-5">Loading reports...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-center my-5 text-danger">{error}</div>;
  }

  return (
    <>
      <h5 className="mb-4">User Reports</h5>

      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Title</th>
              <th>Reported By</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>
                  <Badge
                    bg={
                      report.contentType === 'post'
                        ? 'info'
                        : report.contentType === 'comment'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {report.contentType}
                  </Badge>
                </td>
                <td>{report.title}</td>
                <td>{report.reportedBy}</td>
                <td className="text-truncate" style={{ maxWidth: '200px' }}>
                  {report.reason}
                </td>
                <td>{formatDate(report.timestamp)}</td>
                <td>
                  <Badge bg={report.status === 'pending' ? 'warning' : 'success'}>
                    {report.status}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleReview(report)}
                  >
                    Review
                  </Button>
                  {report.status === 'pending' && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleResolve(report.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-3">
                  No reports available.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
};

export default UserReportsSection;