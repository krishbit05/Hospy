"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError } from "../../utils"
import "./Dashboard.css"
import Chatbot from "../../Chatbot/Chatbot"

const API_BASE = "https://hospyback.onrender.com";

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    availableBeds: 0,
    totalRevenue: 0,
    recentPatients: [],
    upcomingAppointments: [],
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        handleError("Failed to fetch dashboard data")
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error)
      handleError("Error loading dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <Chatbot/>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Dashboard</h1>
            <p>Welcome back! Here's what's happening at your hospital today.</p>
          </div>
          <div className="header-actions">
            <button className="refresh-btn">
              <span>🔄</span>
              Refresh
            </button>
          </div>
        </div>

        <div className="stats-overview">
          <div className="stat-card primary">
            <div className="stat-content">
              <div className="stat-icon">
                <span>👥</span>
              </div>
              <div className="stat-details">
                <h3>{dashboardData.totalPatients}</h3>
                <p>Total Patients</p>
                <span className="stat-change positive">+12% from last month</span>
              </div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-content">
              <div className="stat-icon">
                <span>🩺</span>
              </div>
              <div className="stat-details">
                <h3>{dashboardData.totalDoctors}</h3>
                <p>Total Doctors</p>
                <span className="stat-change positive">+3 new this month</span>
              </div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-content">
              <div className="stat-icon">
                <span>📅</span>
              </div>
              <div className="stat-details">
                <h3>{dashboardData.todayAppointments}</h3>
                <p>Today's Appointments</p>
                <span className="stat-change neutral">5 pending</span>
              </div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-content">
              <div className="stat-icon">
                <span>🛏️</span>
              </div>
              <div className="stat-details">
                <h3>{dashboardData.availableBeds}</h3>
                <p>Available Beds</p>
                <span className="stat-change negative">-2 from yesterday</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Patients</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="card-content">
              <div className="data-table">
                <div className="table-header">
                  <div className="table-row">
                    <div className="table-cell">Patient</div>
                    <div className="table-cell">ID</div>
                    <div className="table-cell">Status</div>
                    <div className="table-cell">Last Visit</div>
                  </div>
                </div>
                <div className="table-body">
                  {dashboardData.recentPatients.length > 0 ? (
                    dashboardData.recentPatients.map((patient, index) => (
                      <div key={index} className="table-row">
                        <div className="table-cell">
                          <div className="patient-info">
                            <div className="patient-avatar">{patient.name?.charAt(0).toUpperCase()}</div>
                            <span className="patient-name">{patient.name}</span>
                          </div>
                        </div>
                        <div className="table-cell">
                          <span className="patient-id">#{patient.patientId}</span>
                        </div>
                        <div className="table-cell">
                          <span className="status-badge active">Active</span>
                        </div>
                        <div className="table-cell">
                          <span className="visit-date">Today</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-data">
                      <span>📋</span>
                      <p>No recent patients</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Upcoming Appointments</h3>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="card-content">
              <div className="appointments-list">
                {dashboardData.upcomingAppointments.length > 0 ? (
                  dashboardData.upcomingAppointments.map((appointment, index) => (
                    <div key={index} className="appointment-item">
                      <div className="appointment-time">
                        <span className="time">{appointment.time}</span>
                        <span className="date">{appointment.date}</span>
                      </div>
                      <div className="appointment-details">
                        <h4>{appointment.patientName}</h4>
                        <p>Dr. {appointment.doctorName}</p>
                      </div>
                      <div className="appointment-status">
                        <span className="status-badge pending">Pending</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <span>📅</span>
                    <p>No upcoming appointments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="revenue-card">
          <div className="card-header">
            <h3>Revenue Overview</h3>
            <div className="revenue-amount">₹{dashboardData.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="card-content">
            <div className="revenue-stats">
              <div className="revenue-item">
                <span className="revenue-label">This Month</span>
                <span className="revenue-value">₹{(dashboardData.totalRevenue * 0.3).toLocaleString()}</span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Last Month</span>
                <span className="revenue-value">₹{(dashboardData.totalRevenue * 0.25).toLocaleString()}</span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Growth</span>
                <span className="revenue-value positive">+20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
