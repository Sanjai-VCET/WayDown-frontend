import { useState } from 'react';
import { Table, Button, Form, InputGroup, Badge, Modal, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { useSpots } from '../../context/SpotContext';
import { auth } from '../../../firebase';

// Function to get token from Firebase Auth

const SpotManagementTable = () => {
  const { spots, loading, error } = useSpots();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [spotToDelete, setSpotToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [spotToEdit, setSpotToEdit] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpot, setNewSpot] = useState({
    name: '',
    content: '',
    city: '',
    location: {
      type: 'Point',
      coordinates: [0, 0], // Longitude, Latitude (Default valid values)
    },// [longitude, latitude]
    photos: [],
    tags: ['Nature'], // Single tag array
    difficulty: 'Unknown',
    bestTimeToVisit: '',
    uniqueFacts: '',
    view360: { imageUrl: '', description: '' },
    status: 'approved',
    averageRating: 0,
  });

  const categories = [...new Set(spots.map((spot) => spot.tags[0]))];
  const ratings = [...new Set(spots.map((spot) => spot.averageRating))];

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
    return null;
  };
  const filteredSpots = spots.filter(
    (spot) =>
      (spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (selectedCategory ? spot.tags.includes(selectedCategory) : true) &&
      (selectedRating ? spot.averageRating === selectedRating : true)
  );

  const handleConfirmDelete = async () => {
    if (!spotToDelete) return;
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No authentication token found');

      await axios.delete(`/api/spots/${spot.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      spots.filter((spot) => spot.id !== spotToDelete.id); // Note: Update context if needed
      setShowDeleteModal(false);
      setSpotToDelete(null);
    } catch (err) {
      console.error('Failed to delete spot:', err);
      setShowDeleteModal(false);
      if (err.response?.status === 401) alert('Unauthorized: Please log in.');
    }
  };

  const handleDeleteClick = (spot) => {
    setSpotToDelete(spot);
    setShowDeleteModal(true);
  };

  const handleAddSpot = () => {
    setShowAddModal(true);
  };

  const handleEditClick = (spot) => {
    setSpotToEdit(spot);
    setShowDetailsModal(true);
  };

  const handleSaveChanges = async () => {
    if (!spotToEdit) return;
    const updatedSpot = {
      name: document.getElementById('formSpotName').value,
      content: document.getElementById('formSpotContent').value,
      city: document.getElementById('formSpotCity').value,
      location: {
        coordinates: [
          parseFloat(document.getElementById('formSpotLocationLon').value),
          parseFloat(document.getElementById('formSpotLocationLat').value),
        ],
      },
      tags: [document.getElementById('formSpotTags').value],
      difficulty: document.getElementById('formSpotDifficulty').value,
      bestTimeToVisit: document.getElementById('formSpotBestTime').value,
      uniqueFacts: document.getElementById('formSpotUniqueFacts').value,
      view360: {
        imageUrl: document.getElementById('formSpotView360').value,
      },
    };

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No authentication token found');

      await axios.put(`/api/spots/${spotToEdit.id}`, updatedSpot, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      spots.map((spot) => (spot.id === spotToEdit.id ? updatedSpot : spot)); // Note: Update context if needed
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Failed to update spot:', err);
      if (err.response?.status === 401) alert('Unauthorized: Please log in.');
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setNewSpot({ ...newSpot, photos: files });
  };

  const handleAddNewSpot = async () => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No authentication token found');

      if (!newSpot.name || !newSpot.content) {
        throw new Error('Name and content are required');
      }
      const lon = parseFloat(newSpot.location.coordinates[0]);
      const lat = parseFloat(newSpot.location.coordinates[1]);
      if (isNaN(lon) || isNaN(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw new Error('Valid longitude (-180 to 180) and latitude (-90 to 90) are required');
      }

      const formData = new FormData();
      formData.append('name', newSpot.name);
      formData.append('content', newSpot.content);
      formData.append('city', newSpot.city || '');
formData.append('location.coordinates[0]', lon); // Longitude
formData.append('location.coordinates[1]', lat); // Latitude
newSpot.photos.forEach((photo) => formData.append('photos', photo));
newSpot.tags.forEach((tag) => formData.append('tags[]', tag));
formData.append('difficulty', newSpot.difficulty || 'Unknown');
formData.append('bestTimeToVisit', newSpot.bestTimeToVisit || '');
formData.append('uniqueFacts', newSpot.uniqueFacts || '');
formData.append('view360.imageUrl', newSpot.view360.imageUrl ||' https://res.cloudinary.com/dxircygwn/image/upload/v1741681739/travel-app/spots/vonbw2de57dykg64pnma.jpg');
formData.append('view360.description', newSpot.view360.description || '');
      // Debug payload
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await axios.post('/api/spots', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      spots.push(response.data.spot); // Adjust based on backend response structure
      setShowAddModal(false);
      setNewSpot({
        name: '',
        content: '',
        city: '',
        location: { coordinates: ['', ''] },
        photos: [],
        tags: ['Nature'],
        difficulty: 'Unknown',
        bestTimeToVisit: '',
        uniqueFacts: '',
        view360: { imageUrl: "no url", description: "no url " },
        status: 'approved',
        averageRating: 0,
      });
    } catch (err) {
      console.error('Failed to add new spot:', err);
      if (err.response?.status === 400) {
        console.log('Validation errors:', err.response.data.errors);
        alert('Failed to add spot: ' + err.response.data.errors.map(e => e.msg).join(', '));
      } else if (err.response?.status === 401) {
        alert('Unauthorized: Please log in.');
      } else {
        alert(err.message || 'An error occurred while adding the spot.');
      }
    }
  };

  if (loading) return <div className="text-center my-5">Loading spots...</div>;
  if (error) return <div className="text-center my-5 text-danger">{error}</div>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Manage Hidden Spots</h5>
        <Button variant="success" size="sm" onClick={handleAddSpot}>
          <i className="bi bi-plus-lg me-1"></i>
          Add New Spot
        </Button>
      </div>

      <div className="d-flex mb-3">
        <InputGroup className="me-3">
          <InputGroup.Text>
            <i className="bi bi-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Search spots by name, city, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Dropdown className="me-3">
          <Dropdown.Toggle variant="outline-secondary" id="dropdown-category">
            {selectedCategory || 'Filter by Tag'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setSelectedCategory('')}>All Tags</Dropdown.Item>
            {categories.map((category) => (
              <Dropdown.Item key={category} onClick={() => setSelectedCategory(category)}>
                {category}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" id="dropdown-rating">
            {selectedRating || 'Filter by Rating'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setSelectedRating('')}>All Ratings</Dropdown.Item>
            {ratings.map((rating) => (
              <Dropdown.Item key={rating} onClick={() => setSelectedRating(rating)}>
                {rating}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>City</th>
              <th>Tags</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpots.map((spot) => (
              <tr key={spot.id}>
                <td>{spot.id}</td>
                <td>{spot.name}</td>
                <td>{spot.city}</td>
                <td>
                  <Badge bg="primary">{spot.tags[0]}</Badge>
                </td>
                <td>{spot.averageRating}</td>
                <td>
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(spot)}>
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(spot)}>
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))}
            {filteredSpots.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-3">
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
          Are you sure you want to delete the spot "{spotToDelete?.name}"? This action cannot be undone.
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

      {/* Spot Details/Edit Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Spot Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {spotToEdit && (
            <Form>
              <Form.Group className="mb-3" controlId="formSpotName">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" defaultValue={spotToEdit.name} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formSpotContent">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" defaultValue={spotToEdit.content} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formSpotCity">
                <Form.Label>City</Form.Label>
                <Form.Control type="text" defaultValue={spotToEdit.city} />
              </Form.Group>
              <Form.Group className="mb-3">
  <Form.Label>Longitude</Form.Label>
  <Form.Control
    type="number"
    step="0.0001"   // Optional: Adjust based on required precision
    placeholder="Enter Longitude"
    value={newSpot.location.coordinates[0]}
    onChange={(e) => {
      const updatedCoords = [...newSpot.location.coordinates];
      updatedCoords[0] = parseFloat(e.target.value) || 80.2707; // Default valid longitude
      setNewSpot({ ...newSpot, location: { ...newSpot.location, coordinates: updatedCoords } });
    }}
  />
</Form.Group>

<Form.Group className="mb-3">
  <Form.Label>Latitude</Form.Label>
  <Form.Control
    type="number"
    step="0.0001"
    placeholder="Enter Latitude"
    value={newSpot.location.coordinates[1]}
    onChange={(e) => {
      const updatedCoords = [...newSpot.location.coordinates];
      updatedCoords[1] = parseFloat(e.target.value) || 13.0843; // Default valid latitude
      setNewSpot({ ...newSpot, location: { ...newSpot.location, coordinates: updatedCoords } });
    }}
  />
</Form.Group>

              <Form.Group className="mb-3" controlId="formSpotTags">
                <Form.Label>Tags</Form.Label>
                <Form.Control as="select" defaultValue={spotToEdit.tags[0]}>
                  <option value="Nature">Nature</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Temples">Temples</option>
                  <option value="Waterfalls">Waterfalls</option>
                  <option value="Beaches">Beaches</option>
                  <option value="Mountains">Mountains</option>
                  <option value="Historical">Historical</option>
                  <option value="Urban">Urban</option>
                  <option value="Foodie">Foodie</option>
                  <option value="Wildlife">Wildlife</option>
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3" controlId="formSpotDifficulty">
                <Form.Label>Difficulty</Form.Label>
                <Form.Control as="select" defaultValue={spotToEdit.difficulty}>
                  <option value="Unknown">Unknown</option>
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Hard">Hard</option>
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3" controlId="formSpotBestTime">
                <Form.Label>Best Time to Visit</Form.Label>
                <Form.Control type="text" defaultValue={spotToEdit.bestTimeToVisit} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formSpotUniqueFacts">
                <Form.Label>Unique Facts</Form.Label>
                <Form.Control as="textarea" defaultValue={spotToEdit.uniqueFacts} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formSpotView360">
                <Form.Label>360 View URL</Form.Label>
                <Form.Control type="text" defaultValue={spotToEdit.view360.imageUrl} />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add New Spot Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Spot</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formNewSpotName">
              <Form.Label>Name (Required)</Form.Label>
              <Form.Control
                type="text"
                value={newSpot.name}
                onChange={(e) => setNewSpot({ ...newSpot, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotContent">
              <Form.Label>Description (Required)</Form.Label>
              <Form.Control
                as="textarea"
                value={newSpot.content}
                onChange={(e) => setNewSpot({ ...newSpot, content: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotCity">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                value={newSpot.city}
                onChange={(e) => setNewSpot({ ...newSpot, city: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotLocationLon">
              <Form.Label>Longitude (Required)</Form.Label>
              <Form.Control
                type="number"
                value={newSpot.location.coordinates[0]}
                onChange={(e) =>
                  setNewSpot({
                    ...newSpot,
                    location: { ...newSpot.location, coordinates: [e.target.value, newSpot.location.coordinates[1]] },
                  })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotLocationLat">
              <Form.Label>Latitude (Required)</Form.Label>
              <Form.Control
                type="number"
                value={newSpot.location.coordinates[1]}
                onChange={(e) =>
                  setNewSpot({
                    ...newSpot,
                    location: { ...newSpot.location, coordinates: [newSpot.location.coordinates[0], e.target.value] },
                  })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotPhotos">
              <Form.Label>Photos</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {newSpot.photos.length > 0 && (
                <div className="mt-2">
                  {newSpot.photos.map((photo, index) => (
                    <Badge key={index} bg="info" className="me-1">{photo.name}</Badge>
                  ))}
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotTags">
              <Form.Label>Tags</Form.Label>
              <Form.Control
                as="select"
                value={newSpot.tags[0]}
                onChange={(e) => setNewSpot({ ...newSpot, tags: [e.target.value] })} // Single tag
              >
                <option value="Nature">Nature</option>
                <option value="Adventure">Adventure</option>
                <option value="Temples">Temples</option>
                <option value="Waterfalls">Waterfalls</option>
                <option value="Beaches">Beaches</option>
                <option value="Mountains">Mountains</option>
                <option value="Historical">Historical</option>
                <option value="Urban">Urban</option>
                <option value="Foodie">Foodie</option>
                <option value="Wildlife">Wildlife</option>
              </Form.Control>
              {newSpot.tags.length > 0 && (
                <div className="mt-2">
                  {newSpot.tags.map((tag, index) => (
                    <Badge key={index} bg="info" className="me-1">{tag}</Badge>
                  ))}
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotDifficulty">
              <Form.Label>Difficulty</Form.Label>
              <Form.Control
                as="select"
                value={newSpot.difficulty}
                onChange={(e) => setNewSpot({ ...newSpot, difficulty: e.target.value })}
              >
                <option value="Unknown">Unknown</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotBestTime">
              <Form.Label>Best Time to Visit</Form.Label>
              <Form.Control
                type="text"
                value={newSpot.bestTimeToVisit}
                onChange={(e) => setNewSpot({ ...newSpot, bestTimeToVisit: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotUniqueFacts">
              <Form.Label>Unique Facts</Form.Label>
              <Form.Control
                as="textarea"
                value={newSpot.uniqueFacts}
                onChange={(e) => setNewSpot({ ...newSpot, uniqueFacts: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formNewSpotView360">
              <Form.Label>360 View URL</Form.Label>
              <Form.Control
                type="text"
                value={newSpot.view360.imageUrl}
                onChange={(e) =>
                  setNewSpot({
                    ...newSpot,
                    view360: { ...newSpot.view360, imageUrl: e.target.value },
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddNewSpot}>
            Add Spot
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SpotManagementTable;