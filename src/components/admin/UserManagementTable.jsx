import { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const UserManagementTable = () => {
  const { isAuthenticated, token, authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!isAuthenticated || !token) {
          throw new Error('User is not authenticated');
        }
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        let errorMessage = 'Failed to load users. Please try again later.';
        if (err.response?.status === 401 || err.response?.status === 403) {
          errorMessage = 'Unauthorized: Please log in again.';
        } else if (err.response?.status === 404) {
          errorMessage = 'User service unavailable.';
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchUsers();
    } else if (!authLoading) {
      setError('Please log in to view users.');
      setLoading(false);
    }
  }, [isAuthenticated, token, authLoading]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle ban action with API call
  const handleConfirmBan = async () => {
    if (!userToBan) return;

    try {
      if (!isAuthenticated || !token) {
        throw new Error('User is not authenticated');
      }
      await axios.put(`http://localhost:5000/api/users/${userToBan.id}/ban`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.map((user) =>
        user.id === userToBan.id ? { ...user, isBanned: true } : user
      ));
      setShowBanModal(false);
      setUserToBan(null);
    } catch (err) {
      console.error('Failed to ban user:', err);
      let errorMessage = 'Failed to ban user. Please try again.';
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'Unauthorized: Please log in again.';
      }
      setError(errorMessage);
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
          placeholder="Search users by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username || 'N/A'}</td>
                <td>{user.email || 'N/A'}</td>
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
                    disabled={user.isBanned}
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
          Are you sure you want to ban the user "{userToBan?.username || 'N/A'}"? This action cannot be undone.
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