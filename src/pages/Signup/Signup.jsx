"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { handleError, handleSuccess } from "../../utils"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import "./Signup.css"

const API_BASE = "https://hospyback.onrender.com";

function Signup() {
  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setSignupInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    const { name, email, password } = signupInfo

    if (!name || !email || !password) {
      return handleError("Name, email and password are required")
    }

    if (!agreeTerms) {
      return handleError("You must agree to the Terms of Service")
    }

    setLoading(true)

    try {
      const url = `${API_BASE}/auth/signup`
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupInfo),
      })
      
      const result = await response.json()
      const { success, message, error } = result

      if (success) {
        handleSuccess(message || "Signup successful")
        setTimeout(() => navigate("/login"), 1500)
      } else if (error?.details) {
        handleError(error.details[0].message)
      } else {
        handleError(message || "Signup failed")
      }
    } catch (err) {
      console.error("Error in signup request:", err)
      handleError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Creating account..." />
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-right">
          <div className="signup-form-wrapper">
            <div className="signup-header">
              <h2>Create Account</h2>
              <p>Join our hospital management system</p>
            </div>
            
            <form onSubmit={handleSignup} className="signup-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={signupInfo.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={signupInfo.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={signupInfo.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={signupInfo.role}
                  onChange={handleChange}
                  required
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="lab_staff">Lab Staff</option>
                  {/* <option value="admin">Admin</option> */}
                  <option value="patient">patient</option>
                </select>
              </div>
              
              <div className="terms-agreement">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={agreeTerms}
                    onChange={() => setAgreeTerms(!agreeTerms)}
                    required
                  />
                  <span className="checkmark"></span>
                  I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>
              
              <button type="submit" className="create-account-btn">
                Create Account
              </button>
              
              <div className="signup-footer">
                <p>Already have an account? <Link to="/login">Sign In</Link></p>
              </div>
            </form>
          </div>
        </div>
        
        <div className="signup-left">
          <div className="signup-left-content">
            <h1>MediCare Plus</h1>
            <p>Advanced Hospital Management System</p>
            
            <div className="features">
              <div className="feature">
                <div className="feature-icon">✓</div>
                <div className="feature-text">Patient Management</div>
              </div>
              <div className="feature">
                <div className="feature-icon">✓</div>
                <div className="feature-text">Appointment Scheduling</div>
              </div>
              <div className="feature">
                <div className="feature-icon">✓</div>
                <div className="feature-text">Billing & Payments</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

export default Signup;
  