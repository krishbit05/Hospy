"use client"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { handleSuccess } from "../../utils"
import "./Sidebar.css"

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const userRole = localStorage.getItem("userRole") || "admin"
  const loggedInUser = localStorage.getItem("loggedInUser")

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("loggedInUser")
    localStorage.removeItem("userRole") 
    handleSuccess("User Logged Out")
    setTimeout(() => {
      navigate("/login")
    }, 1000)
  }

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊", roles: ["admin", "doctor", "receptionist", "lab_staff", "patient"] },
    { path: "/patients", label: "Patient Management", icon: "👤", roles: ["admin", "doctor", "receptionist"] },
    { path: "/doctors", label: "Doctor Management", icon: "🩺", roles: ["admin"] },
    { path: "/appointments", label: "Appointments", icon: "📆", roles: ["admin", "doctor", "receptionist"] },
    { path: "/billing", label: "Billing & Payments", icon: "💵", roles: ["admin", "receptionist"] },
    { path: "/lab-tests", label: "Lab Tests", icon: "🧪", roles: ["admin", "doctor", "lab_staff"] },
    { path: "/wards", label: "Ward Management", icon: "🛏️", roles: ["admin", "doctor"] },
    { path: "/pharmacy", label: "Pharmacy", icon: "💊", roles: ["admin", "doctor"] },
    { path: `/medical-history`, label: "Medical History", icon: "📚", roles: ["doctor", "patient"] },

  ]

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole))

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">🏥</div>
          <div className="logo-text">
            <h2>MediCare Plus</h2>
            <span>Hospital Management</span>
          </div>
        </div>
      </div>

      <div className="user-profile">
        <div className="user-avatar">{loggedInUser?.charAt(0).toUpperCase()}</div>
        <div className="user-details">
          <h4 className="user-name">{loggedInUser}</h4>
          <span className="user-role">{userRole.replace("_", " ")}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Main Menu</span>
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {location.pathname === item.path && <div className="active-indicator"></div>}
            </Link>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
