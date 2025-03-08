import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from 'react-bootstrap';
import axios from 'axios';
import PropTypes from 'prop-types'; // For type checking

const ChatbotContainer = ({ isTyping, onNewMessage }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const webSocketRef = useRef(null);

  // Memoized timestamp formatter
  const formatTime = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get('/api/chat/messages', {
        timeout: 5000, // Add timeout to prevent hanging
      });
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load messages. Please try again.');
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket for real-time updates
  const initializeWebSocket = useCallback(() => {
    if (webSocketRef.current) return; // Prevent multiple connections

    webSocketRef.current = new WebSocket('ws://your-backend-url/chat'); // Replace with your WebSocket URL

    webSocketRef.current.onopen = () => console.log('WebSocket connected');
    webSocketRef.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
      if (onNewMessage) onNewMessage(newMessage); // Notify parent if provided
    };
    webSocketRef.current.onerror = () => setError('WebSocket error occurred.');
    webSocketRef.current.onclose = () => console.log('WebSocket disconnected');
  }, [onNewMessage]);

  // Setup on mount
  useEffect(() => {
    fetchMessages();
    initializeWebSocket();

    return () => {
      if (webSocketRef.current) webSocketRef.current.close(); // Cleanup WebSocket
    };
  }, [fetchMessages, initializeWebSocket]);

  // Auto-scroll with debouncing
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    const timeout = setTimeout(scrollToBottom, 100); // Debounce scrolling
    return () => clearTimeout(timeout);
  }, [messages, isTyping]);

  // Retry handler
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchMessages();
    initializeWebSocket();
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="chat-container p-3 border rounded d-flex align-items-center justify-content-center"
        style={{ height: '400px', backgroundColor: '#f8f9fa' }}
      >
        <span>Loading messages...</span>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div
        className="chat-container p-3 border rounded d-flex flex-column align-items-center justify-content-center"
        style={{ height: '400px', backgroundColor: '#f8f9fa' }}
      >
        <span className="text-danger mb-2">{error}</span>
        <button className="btn btn-primary" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="chat-container p-3 border rounded"
      style={{
        height: '400px',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa',
      }}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message-bubble mb-3 ${message.sender === 'user' ? 'text-end' : ''}`}
        >
          <div
            className={`d-inline-block p-3 rounded ${
              message.sender === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'
            }`}
          >
            <p className="mb-1">{message.text}</p>
            <small className="text-muted">{formatTime(message.timestamp)}</small>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="text-muted d-flex align-items-center">
          <span className="me-2">Typing...</span>
          <div className="spinner-grow spinner-grow-sm" role="status" />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

// PropTypes for type checking
ChatbotContainer.propTypes = {
  isTyping: PropTypes.bool.isRequired,
  onNewMessage: PropTypes.func,
};

export default ChatbotContainer;