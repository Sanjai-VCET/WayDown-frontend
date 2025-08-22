import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

// Context
import { AuthProvider } from './context/AuthContext'
import { SpotProvider } from './context/SpotContext'

// Pages
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import SpotDetails from './pages/SpotDetails'
import AIAssistant from './pages/AIAssistant'
import Community from './pages/Community'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import NotFound from './pages/NotFound'

// Components
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const location = useLocation()
  const [showNavbar, setShowNavbar] = useState(true)

  useEffect(() => {
    // Hide navbar on onboarding page
    if (location.pathname === '/' || location.pathname === '/onboarding') {
      setShowNavbar(false)
    } else {
      setShowNavbar(true)
    }
  }, [location])

  return (
    <AuthProvider>
      <SpotProvider>
        <div className="app-container">
          {showNavbar && <Navbar />}
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Onboarding />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/home" element={<Home />} />
              <Route path="/spots/:id" element={<SpotDetails />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/community" element={<Community />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {showNavbar && <Footer />}
        </div>
      </SpotProvider>
    </AuthProvider>
  )
}

export default App