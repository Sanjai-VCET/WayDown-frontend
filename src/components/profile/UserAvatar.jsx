import { useState, useEffect, useCallback } from "react";
import { Image, Spinner, Tooltip, OverlayTrigger } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase";

const UserAvatar = ({ size = 40 }) => {
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState(""); // Updated to use username
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, userLoading] = useAuthState(auth);

  // Fetch user avatar from backend
  const fetchUserAvatar = useCallback(async () => {
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
      setAvatar(response.data.profilePic || null); // Updated to use profilePic
      setUsername(response.data.username || user.displayName || "");
      setLoading(false);
    } catch (err) {
      setError("Failed to load avatar.");
      setUsername(user.displayName || "User");
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount or user change
  useEffect(() => {
    if (!userLoading && user) {
      fetchUserAvatar();
    } else if (!user) {
      setLoading(false);
      setError("You must be logged in to view your avatar.");
    }
  }, [user, userLoading, fetchUserAvatar]);

  // Fallback avatar URL
  const getFallbackAvatar = useCallback(() => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username
    )}&background=random`;
  }, [username]);

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="user-avatar text-center">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="user-avatar">
        <OverlayTrigger placement="top" overlay={<Tooltip>{error}</Tooltip>}>
          <Image
            src={getFallbackAvatar()}
            alt={username}
            roundedCircle
            width={size}
            height={size}
            className="mb-2"
            style={{ opacity: 0.7 }}
          />
        </OverlayTrigger>
      </div>
    );
  }

  return (
    <div className="user-avatar">
      <OverlayTrigger placement="top" overlay={<Tooltip>{username}</Tooltip>}>
        <Image
          src={avatar || getFallbackAvatar()}
          alt={username}
          roundedCircle
          width={size}
          height={size}
          className="mb-2"
          onError={(e) => (e.target.src = getFallbackAvatar())}
          style={{ objectFit: "cover" }}
        />
      </OverlayTrigger>
    </div>
  );
};

UserAvatar.propTypes = {
  size: PropTypes.number,
};

export default UserAvatar;
