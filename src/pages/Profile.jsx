import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Nav,
  Tab,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { useSpots } from "../context/SpotContext";
import axios from "axios";

// Components
import UserAvatar from "../components/profile/UserAvatar";
import MySavedSpots from "../components/profile/MySavedSpots";
import MyPosts from "../components/profile/MyPosts";
import EditProfileForm from "../components/profile/EditProfileForm";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("saved");
  const [editMode, setEditMode] = useState(false);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    interests: [],
    profilePic: null,
  });
  const [favoriteSpots, setFavoriteSpots] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [settings, setSettings] = useState({
    notifications: {
      comments: true,
      likes: true,
      follows: true,
      recommendations: true,
    },
    privacy: {
      profilePublic: true,
      shareLocation: true,
    },
    notificationsEnabled: true, // Added to match backend schema
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, authLoading] = useAuthState(auth);
  const { getFavorites } = useSpots();

  // Fetch user details from backend
  const fetchUserDetails = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `https://waydown-backend.onrender.com/api/users/${user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setUserData({
        username: response.data.username || "",
        email: response.data.email || "",
        interests: response.data.interests || [],
        profilePic: response.data.profilePic || null,
      });
    } catch (err) {
      setError("Failed to load user details.");
    }
  }, [user]);

  // Fetch user posts from backend
  const fetchUserPosts = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `https://waydown-backend.onrender.com/api/users/${user.uid}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setUserPosts(response.data || []);
    } catch (err) {
      setError("Failed to load your posts.");
    }
  }, [user]);

  // Fetch user settings from backend
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await axios.get(
        `https://waydown-backend.onrender.com/api/users/${user.uid}/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setSettings({
        notifications: {
          comments: response.data.notifications?.comments ?? true,
          likes: response.data.notifications?.likes ?? true,
          follows: response.data.notifications?.follows ?? true,
          recommendations: response.data.notifications?.recommendations ?? true,
        },
        privacy: {
          profilePublic: response.data.privacy?.profilePublic ?? true,
          shareLocation: response.data.privacy?.shareLocation ?? true,
        },
        notificationsEnabled: response.data.notificationsEnabled ?? true,
      });
    } catch (err) {
      setError("Failed to load settings. Using defaults.");
    }
  }, [user]);

  // Fetch followers and following
  const fetchSocialStats = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const [followersResponse, followingResponse] = await Promise.all([
        axios.get(
          `https://waydown-backend.onrender.com/api/users/${user.uid}/followers`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        ),
        axios.get(
          `https://waydown-backend.onrender.com/api/users/${user.uid}/following`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        ),
      ]);

      setFollowers(followersResponse.data.followers || []);
      setFollowing(followingResponse.data.following || []);
    } catch (err) {
      setError("Failed to load social stats.");
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (!authLoading && user) {
      Promise.all([
        fetchUserDetails(),
        fetchUserPosts(),
        fetchSettings(),
        fetchSocialStats(),
        setFavoriteSpots(getFavorites()),
      ])
        .then(() => setLoading(false))
        .catch(() => setError("Failed to load profile data."));
    } else if (!user && !authLoading) {
      setError("Please log in to view your profile.");
      setLoading(false);
    }
  }, [
    user,
    authLoading,
    fetchUserDetails,
    fetchUserPosts,
    fetchSettings,
    fetchSocialStats,
    getFavorites,
  ]);

  // Handle profile update
  const handleProfileUpdate = useCallback(
    async (userData) => {
      if (!user) return;

      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        await axios.put(
          `https://waydown-backend.onrender.com/api/users/${user.uid}`,
          userData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }
        );
        setUserData(userData); // Update local state
        setEditMode(false);
      } catch (err) {
        setError("Failed to update profile.");
      }
    },
    [user]
  );

  // Handle settings update
  const handleSettingsUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        await axios.put(
          `https://waydown-backend.onrender.com/api/users/${user.uid}/settings`,
          settings,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }
        );
        setLoading(false);
      } catch (err) {
        setError("Failed to save settings.");
        setLoading(false);
      }
    },
    [user, settings]
  );

  // Handle tab selection
  const handleTabSelect = useCallback((key) => setActiveTab(key), []);

  // Handle settings change
  const handleSettingsChange = useCallback((category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  }, []);

  // Loading state
  if (loading || authLoading) {
    return (
      <Container className="py-4 text-center">
        <Spinner
          animation="border"
          size="sm"
          className="me-2"
          aria-label="Loading profile"
        />
        Loading Profile...
      </Container>
    );
  }

  // Error state or no user
  if (error || !user) {
    return (
      <Container className="py-4">
        <Alert
          variant="danger"
          className="text-center"
          dismissible
          onClose={() => setError(null)}
        >
          {error || "Please log in to view your profile."}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4" aria-label="User Profile">
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Row>
                <Col md={3} className="text-center text-md-start mb-3 mb-md-0">
                  <UserAvatar size={120} />
                </Col>

                <Col md={9}>
                  {editMode ? (
                    <EditProfileForm
                      onSave={(updatedData) =>
                        handleProfileUpdate({
                          username: updatedData.username,
                          email: updatedData.email,
                          interests: updatedData.interests,
                          profilePic: updatedData.profilePic,
                        })
                      }
                      onCancel={() => setEditMode(false)}
                    />
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
                        <h2 className="mb-0">
                          {userData.username || "Unnamed User"}
                        </h2>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setEditMode(true)}
                          aria-label="Edit Profile"
                        >
                          Edit Profile
                        </Button>
                      </div>

                      <p className="text-muted mb-3">
                        <i className="bi bi-envelope me-2" aria-hidden="true" />
                        {userData.email}
                      </p>

                      <div className="user-stats d-flex mb-3 flex-wrap gap-4">
                        <div>
                          <div className="fw-bold">{favoriteSpots.length}</div>
                          <div className="text-muted">Saved Spots</div>
                        </div>
                        <div>
                          <div className="fw-bold">{userPosts.length}</div>
                          <div className="text-muted">Posts</div>
                        </div>
                        <div>
                          <div className="fw-bold">{following.length}</div>
                          <div className="text-muted">Following</div>
                        </div>
                        <div>
                          <div className="fw-bold">{followers.length}</div>
                          <div className="text-muted">Followers</div>
                        </div>
                      </div>

                      <div className="user-interests mb-3">
                        <h6>Interests</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {(userData.interests || []).map((interest, index) => (
                            <span
                              key={index}
                              className="badge bg-light text-dark p-2"
                              style={{ border: "1px solid #dee2e6" }}
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
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
                aria-label="Profile Sections"
              >
                <Nav.Item>
                  <Nav.Link eventKey="saved" aria-controls="saved-tab">
                    Saved Spots
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="posts" aria-controls="posts-tab">
                    My Posts
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="settings" aria-controls="settings-tab">
                    Settings
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body>
              <Tab.Content>
                <Tab.Pane
                  eventKey="saved"
                  id="saved-tab"
                  active={activeTab === "saved"}
                  aria-labelledby="saved-tab"
                >
                  <MySavedSpots />
                </Tab.Pane>

                <Tab.Pane
                  eventKey="posts"
                  id="posts-tab"
                  active={activeTab === "posts"}
                  aria-labelledby="posts-tab"
                >
                  <MyPosts />
                </Tab.Pane>

                <Tab.Pane
                  eventKey="settings"
                  id="settings-tab"
                  active={activeTab === "settings"}
                  aria-labelledby="settings-tab"
                >
                  <h5 className="mb-4">Account Settings</h5>
                  <Form onSubmit={handleSettingsUpdate}>
                    <Form.Group
                      className="mb-3"
                      controlId="notificationSettings"
                    >
                      <Form.Label className="fw-bold">Notifications</Form.Label>
                      <div>
                        <Form.Check
                          type="switch"
                          id="notification-comments"
                          label="Comments on your posts"
                          checked={settings.notifications.comments}
                          onChange={(e) =>
                            handleSettingsChange(
                              "notifications",
                              "comments",
                              e.target.checked
                            )
                          }
                          className="mb-2"
                        />
                        <Form.Check
                          type="switch"
                          id="notification-likes"
                          label="Likes on your posts"
                          checked={settings.notifications.likes}
                          onChange={(e) =>
                            handleSettingsChange(
                              "notifications",
                              "likes",
                              e.target.checked
                            )
                          }
                          className="mb-2"
                        />
                        <Form.Check
                          type="switch"
                          id="notification-follows"
                          label="New followers"
                          checked={settings.notifications.follows}
                          onChange={(e) =>
                            handleSettingsChange(
                              "notifications",
                              "follows",
                              e.target.checked
                            )
                          }
                          className="mb-2"
                        />
                        <Form.Check
                          type="switch"
                          id="notification-recommendations"
                          label="Spot recommendations"
                          checked={settings.notifications.recommendations}
                          onChange={(e) =>
                            handleSettingsChange(
                              "notifications",
                              "recommendations",
                              e.target.checked
                            )
                          }
                          className="mb-2"
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="privacySettings">
                      <Form.Label className="fw-bold">Privacy</Form.Label>
                      <div>
                        <Form.Check
                          type="switch"
                          id="privacy-profile"
                          label="Public profile"
                          checked={settings.privacy.profilePublic}
                          onChange={(e) =>
                            handleSettingsChange(
                              "privacy",
                              "profilePublic",
                              e.target.checked
                            )
                          }
                          className="mb-2"
                        />
                        <Form.Check
                          type="switch"
                          id="privacy-location"
                          label="Share my location"
                          checked={settings.privacy.shareLocation}
                          onChange={(e) =>
                            handleSettingsChange(
                              "privacy",
                              "shareLocation",
                              e.target.checked
                            )
                          }
                          className="mb-2"
                        />
                      </div>
                    </Form.Group>

                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Saving...
                        </>
                      ) : (
                        "Save Settings"
                      )}
                    </Button>
                  </Form>
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

Profile.propTypes = {};

export default Profile;
