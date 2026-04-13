import { useState, useEffect, createContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/Landing'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import axios from './api'
import './App.css'

export const AuthContext = createContext()

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (!token) return
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUser(response.data)
      } catch (error) {
        console.log('Unable to fetch current user:', error)
        setToken(null)
        setUser(null)
      }
    }

    fetchCurrentUser()
  }, [token])

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, logout }}>
      <Router>
        <Routes>
          <Route path="/" element={token ? <Dashboard /> : <Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  )
}

export default App

