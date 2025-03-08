import { useState, useRef, useEffect } from 'react'
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'

// Components
import ChatbotContainer from '../components/aiAssistant/ChatbotContainer'
import AITravelPlanner from '../components/aiAssistant/AITravelPlanner'
import NearbySuggestions from '../components/aiAssistant/NearbySuggestions'
import SafetyAlerts from '../components/aiAssistant/SafetyAlerts'
import TransportationRecommender from '../components/aiAssistant/TransportationRecommender'

const AIAssistant = () => {
  const { currentUser, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hi${currentUser ? ' ' + currentUser.name : ''}! I'm your AI Travel Assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    
    // Simulate AI thinking
    setIsTyping(true)
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage)
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }
  
  // Simple mock response generator
  const generateBotResponse = (userInput) => {
    const userInputLower = userInput.toLowerCase()
    let responseText = ''
    
    if (userInputLower.includes('hello') || userInputLower.includes('hi')) {
      responseText = `Hello! How can I assist with your travel plans today?`
    } else if (userInputLower.includes('waterfall') || userInputLower.includes('water')) {
      responseText = `I found several hidden waterfalls near you! The closest is "Crystal Falls" which is about 5km away. Would you like directions or more information about it?`
    } else if (userInputLower.includes('beach') || userInputLower.includes('swim')) {
      responseText = `There's a secluded beach cove called "Mermaid's Bay" that's perfect for swimming and only known to locals. It's about 8km from your location. Would you like to see photos?`
    } else if (userInputLower.includes('food') || userInputLower.includes('eat') || userInputLower.includes('restaurant')) {
      responseText = `For authentic local cuisine, I recommend "The Hidden Kitchen" - it's a small family-owned restaurant with amazing food and a view of the mountains. Would you like me to check if they're open now?`
    } else if (userInputLower.includes('weather')) {
      responseText = `The weather forecast for today shows sunny conditions with a high of 24°C. Perfect for outdoor exploration! The next three days will remain clear with similar temperatures.`
    } else if (userInputLower.includes('transport') || userInputLower.includes('bus') || userInputLower.includes('taxi')) {
      responseText = `The best way to reach most hidden spots in this area is by car. However, there's a local shuttle service that runs to popular trailheads. Would you like the shuttle schedule?`
    } else if (userInputLower.includes('danger') || userInputLower.includes('safe')) {
      responseText = `This area is generally very safe for travelers. Just be aware of the usual outdoor precautions - bring water, wear appropriate footwear, and let someone know where you're going if hiking to remote spots.`
    } else if (userInputLower.includes('itinerary') || userInputLower.includes('plan')) {
      responseText = `I can create a personalized 3-day itinerary for you based on your interests. Would you prefer adventure activities, cultural experiences, or a mix of both?`
    } else {
      responseText = `That's an interesting question about ${userInput.split(' ').slice(0, 3).join(' ')}... Let me find some information for you. Is there anything specific you'd like to know about this area?`
    }
    
    return {
      id: Date.now(),
      sender: 'bot',
      text: responseText,
      timestamp: new Date()
    }
  }
  
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
              
              <ChatbotContainer 
                messages={messages}
                isTyping={isTyping}
                messagesEndRef={messagesEndRef}
              />
              
              <Form onSubmit={handleSendMessage} className="mt-3">
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Ask me anything about hidden spots, travel tips, or recommendations..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={!isAuthenticated}
                  />
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="ms-2"
                    disabled={!isAuthenticated || !inputMessage.trim()}
                  >
                    <i className="bi bi-send"></i>
                  </Button>
                </div>
                {!isAuthenticated && (
                  <p className="text-muted small mt-2">
                    Please sign in to chat with the AI Assistant
                  </p>
                )}
              </Form>
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
  )
}

export default AIAssistant