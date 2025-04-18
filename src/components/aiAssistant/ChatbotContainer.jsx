import { useState, useEffect, useRef } from "react";
import { Card, Spinner, Form, Button, Alert } from "react-bootstrap";
import axios from "axios";
import {
  ChatDots,
  Send,
  ExclamationTriangle,
  Person,
  Robot,
} from "react-bootstrap-icons"; // Import icons

const ChatbotContainer = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Hi! How can I help you today?", timestamp: new Date() },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(N8N_WEBHOOK_URL, { chatInput: inputMessage });
      console.log("n8n response:", response.data); // Debugging log

      // Extract response from JSON format
      const botText = response.data?.response ?? "I'm sorry, I didn't understand that.";

      const botResponse = {
        id: Date.now() + 1,
        sender: "bot",
        text: botText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      console.error("Error:", err); // Debugging log
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: "AI service is unavailable.", timestamp: new Date() },
      ]);
      setError("Oops! Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="mb-3 d-flex align-items-center gap-2">
          <ChatDots size={20} className="text-primary" /> {/* Replace bi-chat-dots */}
          AI Chatbot
        </h5>
        <div
          className="chat-container p-3 border rounded"
          style={{ height: "400px", overflowY: "auto", backgroundColor: "#f8f9fa" }}
          role="log"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble mb-3 ${message.sender === "user" ? "text-end" : ""}`}
            >
              <div
                className={`d-inline-flex align-items-center p-3 rounded ${
                  message.sender === "user" ? "bg-primary text-white" : "bg-light text-dark"
                }`}
                style={{ gap: "10px" }}
              >
                {message.sender === "user" ? (
                  <Person size={16} /> // Add user icon
                ) : (
                  <Robot size={16} /> // Add bot icon
                )}
                <div>
                  <p className="mb-1">{message.text}</p>
                  <small className="text-muted">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-muted d-flex align-items-center gap-2">
              <Robot size={16} /> {/* Add bot icon for loading */}
              <span>AI is thinking...</span>
              <Spinner animation="border" size="sm" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {error && (
          <Alert variant="danger" className="mt-2 text-center d-flex align-items-center justify-content-center gap-2">
            <ExclamationTriangle size={16} /> {/* Add error icon */}
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSendMessage} className="mt-3">
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="primary"
              className="ms-2"
              disabled={loading || !inputMessage.trim()}
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              <Send size={16} /> {/* Replace bi-send */}
              Send
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ChatbotContainer;