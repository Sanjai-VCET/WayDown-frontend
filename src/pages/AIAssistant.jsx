import { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

// Components
import ChatbotContainer from "../components/aiAssistant/ChatbotContainer";
import AITravelPlanner from "../components/aiAssistant/AITravelPlanner";
import NearbySuggestions from "../components/aiAssistant/NearbySuggestions";
import SafetyAlerts from "../components/aiAssistant/SafetyAlerts";
import TransportationRecommender from "../components/aiAssistant/TransportationRecommender";

const AIAssistant = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: `Hi${currentUser ? " " + currentUser.name : ""}! I'm your AI Travel Assistant. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Send user message to backend for AI response
      const response = await axios.post("/api/ai/chat", { message });

      // Add AI response to messages
      const botResponse = {
        id: Date.now(),
        sender: "bot",
        text: response.data.response, // AI-generated response
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "bot",
          text: "I'm having trouble responding. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h3 className="mb-4">
                <i className="bi bi-robot text-primary me-2"></i>
                AI Travel Assistant
              </h3>

              {/* Pass handleSendMessage to ChatbotContainer */}
              <ChatbotContainer
                messages={messages}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef}
                onSendMessage={handleSendMessage} // ✅ New Prop
                isAuthenticated={isAuthenticated} // ✅ Auth Check
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <AITravelPlanner />
          <NearbySuggestions />
          <SafetyAlerts />
          <TransportationRecommender />
        </Col>
      </Row>
    </Container>
  );
};

export default AIAssistant;
