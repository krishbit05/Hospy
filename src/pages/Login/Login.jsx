"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { handleError, handleSuccess } from "../../utils"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import "./Login.css"


const API_BASE = "https://hospyback.onrender.com";

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setLoginInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const { email, password } = loginInfo

    if (!email || !password) {
      return handleError("Email and password are required")
    }

    setLoading(true)

    try {
      const url = `${API_BASE}/auth/login`
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginInfo),
      })

      const result = await response.json()
      const { success, message, jwtToken, name, role, error } = result

      if (success) {
        handleSuccess(message)
        localStorage.setItem("token", jwtToken)
        localStorage.setItem("loggedInUser", name)
        localStorage.setItem("userRole", role)
        setTimeout(() => navigate("/dashboard"), 1500)
      } else if (error?.details) {
        handleError(error.details[0].message)
      } else {
        handleError(message)
      }
    } catch (err) {
      console.error("Error in login request:", err)
      handleError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Logging in..." />
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-left">
          <div className="login-left-content">
            <h1>MediCare Plus</h1>
            <p>Advanced Hospital Management System</p>
          </div>
        </div>
        <div className="login-right">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Please sign in to your account to continue</p>
            </div>
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={loginInfo.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="form-group">
                <div className="password-header">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginInfo.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="remember-me">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
              </div>
              
              <button type="submit" className="sign-in-btn">
                Sign In
              </button>
              
              <div className="login-footer">
                <p>Don't have an account? <Link to="/signup">Create Account</Link></p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default Login