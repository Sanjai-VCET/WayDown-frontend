import { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';
import axios from 'axios'; // For API calls

const SpotManagementTable = () => {
  const [spots, setSpots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [spotToDelete, setSpotToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch spots from backend on mount
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await axios.get('/api/spots'); // Replace with your API endpoint
        setSpots(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load spots. Please try again later.');
        setLoading(false);
      }
    };

    fetchSpots();
  }, []);

  // Filter spots based on search term
  const filteredSpots = spots.filter(
    (spot) =>
      spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete action with API call
  const handleConfirmDelete = async () => {
    if (!spotToDelete) return;

    try {
      await axios.delete(`/api/spots/${spotToDelete.id}`); // Replace with your delete endpoint
      setSpots(spots.filter((spot) => spot.id !== spotToDelete.id)); // Update UI optimistically
      setShowDeleteModal(false);
      setSpotToDelete(null);
    } catch (err) {
      setError('Failed to delete spot. Please try again.');
      setShowDeleteModal(false);
    }
  };

  // Handle delete click (open modal)
  const handleDeleteClick = (spot) => {
    setSpotToDelete(spot);
    setShowDeleteModal(true);
  };

  // Handle adding a new spot (placeholder for now)
  const handleAddSpot = () => {
    // In a real app, this could open a modal form and POST to the backend
    console.log('Add new spot clicked');
  };

  // Loading state
  if (loading) {
    return <div className="text-center my-5">Loading spots...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-center my-5 text-danger">{error}</div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Manage Hidden Spots</h5>
        <Button variant="success" size="sm" onClick={handleAddSpot}>
          <i className="bi bi-plus-lg me-1"></i>
          Add New Spot
        </Button>
      </div>

      <InputGroup className="mb-3">
        <InputGroup.Text>
          <i className="bi bi-search"></i>
        </InputGroup.Text>
        <Form.Control
          placeholder="Search spots by name, location, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Category</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpots.map((spot) => (
              <tr key={spot.id}>
                <td>{spot.id}</td>
                <td>{spot.name}</td>
                <td>{spot.location}</td>
                <td>
                  <Badge bg="primary">{spot.category}</Badge>
                </td>
                <td>{spot.rating}</td>
                <td>{spot.reviews?.length || 0}</td>
                <td>
                  <Button variant="outline-primary" size="sm" className="me-2">
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteClick(spot)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
            {filteredSpots.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-3">
                  No spots found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the spot "{spotToDelete?.name}"? This action cannot be
          undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SpotManagementTable;