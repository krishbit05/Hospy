"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./DoctorManagement.css"


const API_BASE = "https://hospyback.onrender.com";

const DoctorManagement = () => {
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    contact: "",
    specialization: "",
    qualification: "",
    experience: "",
    consultationFee: "",
    schedule: [
      { day: "Monday", startTime: "", endTime: "", isAvailable: false },
      { day: "Tuesday", startTime: "", endTime: "", isAvailable: false },
      { day: "Wednesday", startTime: "", endTime: "", isAvailable: false },
      { day: "Thursday", startTime: "", endTime: "", isAvailable: false },
      { day: "Friday", startTime: "", endTime: "", isAvailable: false },
      { day: "Saturday", startTime: "", endTime: "", isAvailable: false },
      { day: "Sunday", startTime: "", endTime: "", isAvailable: false },
    ],
  })

  const specializations = [
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "General Medicine",
    "Neurology",
    "Oncology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Surgery",
    "Urology",
  ]

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      } else {
        handleError("Failed to fetch doctors")
      }
    } catch (error) {
      console.error("Fetch doctors error:", error)
      handleError("Error loading doctors")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setDoctorForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleScheduleChange = (index, field, value) => {
    setDoctorForm((prev) => ({
      ...prev,
      schedule: prev.schedule.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = editingDoctor
        ? `${API_BASE}/api/doctors/${editingDoctor._id}`
        : `${API_BASE}/api/doctors`

      const method = editingDoctor ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(doctorForm),
      })

      if (response.ok) {
        handleSuccess(editingDoctor ? "Doctor updated successfully" : "Doctor added successfully")
        setShowModal(false)
        setEditingDoctor(null)
        resetForm()
        fetchDoctors()
      } else {
        const error = await response.json()
        handleError(error.message || "Operation failed")
      }
    } catch (error) {
      console.error("Submit error:", error)
      handleError("Error saving doctor")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor)
    setDoctorForm({
      name: doctor.name || "",
      email: doctor.email || "",
      contact: doctor.contact || "",
      specialization: doctor.specialization || "",
      qualification: doctor.qualification || "",
      experience: doctor.experience || "",
      consultationFee: doctor.consultationFee || "",
      schedule: doctor.schedule || [
        { day: "Monday", startTime: "", endTime: "", isAvailable: false },
        { day: "Tuesday", startTime: "", endTime: "", isAvailable: false },
        { day: "Wednesday", startTime: "", endTime: "", isAvailable: false },
        { day: "Thursday", startTime: "", endTime: "", isAvailable: false },
        { day: "Friday", startTime: "", endTime: "", isAvailable: false },
        { day: "Saturday", startTime: "", endTime: "", isAvailable: false },
        { day: "Sunday", startTime: "", endTime: "", isAvailable: false },
      ],
    })
    setShowModal(true)
  }

  const handleDelete = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/doctors/${doctorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        handleSuccess("Doctor deleted successfully")
        fetchDoctors()
      } else {
        handleError("Failed to delete doctor")
      }
    } catch (error) {
      console.error("Delete error:", error)
      handleError("Error deleting doctor")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setDoctorForm({
      name: "",
      email: "",
      contact: "",
      specialization: "",
      qualification: "",
      experience: "",
      consultationFee: "",
      schedule: [
        { day: "Monday", startTime: "", endTime: "", isAvailable: false },
        { day: "Tuesday", startTime: "", endTime: "", isAvailable: false },
        { day: "Wednesday", startTime: "", endTime: "", isAvailable: false },
        { day: "Thursday", startTime: "", endTime: "", isAvailable: false },
        { day: "Friday", startTime: "", endTime: "", isAvailable: false },
        { day: "Saturday", startTime: "", endTime: "", isAvailable: false },
        { day: "Sunday", startTime: "", endTime: "", isAvailable: false },
      ],
    })
  }

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.doctorId?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading && !showModal) {
    return <LoadingSpinner message="Loading doctors..." />
  }

  return (
    <div className="doctor-management-container">
      <Sidebar />
      <div className="doctor-management-content">
        <div className="page-header">
          <h1>🩺 Doctor Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingDoctor(null)
              resetForm()
              setShowModal(true)
            }}
          >
            Add New Doctor
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search doctors by name, specialization, or ID..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="doctors-grid">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="doctor-card">
              <div className="doctor-header">
                <div className="doctor-avatar">{doctor.name?.charAt(0).toUpperCase()}</div>
                <div className="doctor-info">
                  <h3>{doctor.name}</h3>
                  <p className="doctor-id">ID: {doctor.doctorId}</p>
                  <p className="specialization">{doctor.specialization}</p>
                </div>
              </div>

              <div className="doctor-details">
                <div className="detail-item">
                  <span className="label">Experience:</span>
                  <span className="value">{doctor.experience} years</span>
                </div>
                <div className="detail-item">
                  <span className="label">Consultation Fee:</span>
                  <span className="value">₹{doctor.consultationFee}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Contact:</span>
                  <span className="value">{doctor.contact}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{doctor.email}</span>
                </div>
              </div>

              <div className="doctor-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(doctor)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doctor._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="no-data">
            <p>No doctors found</p>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal doctor-modal">
              <div className="modal-header">
                <h2>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingDoctor(null)
                    resetForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="doctor-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={doctorForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={doctorForm.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact *</label>
                    <input
                      type="tel"
                      name="contact"
                      className="form-input"
                      value={doctorForm.contact}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Specialization *</label>
                    <select
                      name="specialization"
                      className="form-select"
                      value={doctorForm.specialization}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Specialization</option>
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Qualification *</label>
                    <input
                      type="text"
                      name="qualification"
                      className="form-input"
                      value={doctorForm.qualification}
                      onChange={handleInputChange}
                      placeholder="e.g., MBBS, MD"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience (years) *</label>
                    <input
                      type="number"
                      name="experience"
                      className="form-input"
                      value={doctorForm.experience}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹) *</label>
                    <input
                      type="number"
                      name="consultationFee"
                      className="form-input"
                      value={doctorForm.consultationFee}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="schedule-section">
                  <h3>Weekly Schedule</h3>
                  <div className="schedule-grid">
                    {doctorForm.schedule.map((daySchedule, index) => (
                      <div key={daySchedule.day} className="schedule-item">
                        <div className="day-header">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={daySchedule.isAvailable}
                              onChange={(e) => handleScheduleChange(index, "isAvailable", e.target.checked)}
                            />
                            {daySchedule.day}
                          </label>
                        </div>
                        {daySchedule.isAvailable && (
                          <div className="time-inputs">
                            <input
                              type="time"
                              value={daySchedule.startTime}
                              onChange={(e) => handleScheduleChange(index, "startTime", e.target.value)}
                              className="form-input time-input"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={daySchedule.endTime}
                              onChange={(e) => handleScheduleChange(index, "endTime", e.target.value)}
                              className="form-input time-input"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false)
                      setEditingDoctor(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingDoctor ? "Update Doctor" : "Add Doctor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  )
}

export default DoctorManagement
