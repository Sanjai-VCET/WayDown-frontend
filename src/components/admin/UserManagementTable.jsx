import { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';

const UserManagementTable = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from backend on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users'); // Replace with your API endpoint
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle ban action with API call
  const handleConfirmBan = async () => {
    if (!userToBan) return;

    try {
      await axios.put(`/api/users/${userToBan.id}/ban`); // Replace with your ban endpoint
      setUsers(users.filter((user) => user.id !== userToBan.id)); // Update UI optimistically
      setShowBanModal(false);
      setUserToBan(null);
    } catch (err) {
      setError('Failed to ban user. Please try again.');
      setShowBanModal(false);
    }
  };

  // Handle ban click (open modal)
  const handleBanClick = (user) => {
    setUserToBan(user);
    setShowBanModal(true);
  };

  // Loading state
  if (loading) {
    return <div className="text-center my-5">Loading users...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-center my-5 text-danger">{error}</div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Manage Users</h5>
      </div>

      <InputGroup className="mb-3">
        <InputGroup.Text>
          <i className="bi bi-search"></i>
        </InputGroup.Text>
        <Form.Control
          placeholder="Search users by name or email..."
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
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <Badge bg={user.isBanned ? 'danger' : 'success'}>
                    {user.isBanned ? 'Banned' : 'Active'}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleBanClick(user)}
                  >
                    <i className="bi bi-person-x"></i>
                  </Button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-3">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Ban Confirmation Modal */}
      <Modal show={showBanModal} onHide={() => setShowBanModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Ban</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to ban the user "{userToBan?.name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBanModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmBan}>
            Ban
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserManagementTable; 