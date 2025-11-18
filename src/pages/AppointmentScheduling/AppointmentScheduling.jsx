"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./AppointmentScheduling.css"

const API_BASE = "https://hospyback.onrender.com";
const AppointmentScheduling = () => {
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [appointmentForm, setAppointmentForm] = useState({
    patient: "",
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    notes: "",
  })

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
  ]

  useEffect(() => {
    fetchAppointments()
    fetchPatients()
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAppointmentsByDate(selectedDate)
    }
  }, [selectedDate])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      } else {
        handleError("Failed to fetch appointments")
      }
    } catch (error) {
      console.error("Fetch appointments error:", error)
      handleError("Error loading appointments")
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointmentsByDate = async (date) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/appointments/date/${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error("Fetch appointments by date error:", error)
    }
  }

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Fetch patients error:", error)
    }
  }

  const fetchDoctors = async () => {
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
      }
    } catch (error) {
      console.error("Fetch doctors error:", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAppointmentForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const getAvailableTimeSlots = (doctorId, date) => {
    if (!doctorId || !date) return timeSlots

    const bookedSlots = appointments
      .filter(
        (apt) =>
          apt.doctor._id === doctorId && apt.appointmentDate.split("T")[0] === date && apt.status !== "Cancelled",
      )
      .map((apt) => apt.appointmentTime)

    return timeSlots.filter((slot) => !bookedSlots.includes(slot))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = editingAppointment
        ? `${API_BASE}/api/appointments/${editingAppointment._id}`
        : `${API_BASE}/api/appointments`

      const method = editingAppointment ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentForm),
      })

      if (response.ok) {
        handleSuccess(editingAppointment ? "Appointment updated successfully" : "Appointment scheduled successfully")
        setShowModal(false)
        setEditingAppointment(null)
        resetForm()
        fetchAppointments()
      } else {
        const error = await response.json()
        handleError(error.message || "Operation failed")
      }
    } catch (error) {
      console.error("Submit error:", error)
      handleError("Error saving appointment")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        handleSuccess("Appointment status updated successfully")
        fetchAppointments()
      } else {
        handleError("Failed to update appointment status")
      }
    } catch (error) {
      console.error("Status update error:", error)
      handleError("Error updating appointment status")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment)
    setAppointmentForm({
      patient: appointment.patient._id,
      doctor: appointment.doctor._id,
      appointmentDate: appointment.appointmentDate.split("T")[0],
      appointmentTime: appointment.appointmentTime,
      reason: appointment.reason || "",
      notes: appointment.notes || "",
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setAppointmentForm({
      patient: "",
      doctor: "",
      appointmentDate: "",
      appointmentTime: "",
      reason: "",
      notes: "",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Scheduled":
        return "status-scheduled"
      case "Completed":
        return "status-completed"
      case "Cancelled":
        return "status-cancelled"
      case "No Show":
        return "status-no-show"
      default:
        return "status-scheduled"
    }
  }

  if (loading && !showModal) {
    return <LoadingSpinner message="Loading appointments..." />
  }

  return (
    <div className="appointment-scheduling-container">
      <Sidebar />
      <div className="appointment-scheduling-content">
        <div className="page-header">
          <h1>📆 Appointment Scheduling</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingAppointment(null)
              resetForm()
              setShowModal(true)
            }}
          >
            Schedule New Appointment
          </button>
        </div>

        <div className="date-filter">
          <label className="form-label">Filter by Date:</label>
          <input
            type="date"
            className="form-input date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="appointments-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{appointment.appointmentId}</td>
                  <td>
                    <div className="patient-info">
                      <strong>{appointment.patient?.name}</strong>
                      <br />
                      <small>{appointment.patient?.patientId}</small>
                    </div>
                  </td>
                  <td>
                    <div className="doctor-info">
                      <strong>Dr. {appointment.doctor?.name}</strong>
                      <br />
                      <small>{appointment.doctor?.specialization}</small>
                    </div>
                  </td>
                  <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                  <td>{appointment.appointmentTime}</td>
                  <td>{appointment.reason}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(appointment.status)}`}>{appointment.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(appointment)}>
                        Edit
                      </button>
                      {appointment.status === "Scheduled" && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleStatusChange(appointment._id, "Completed")}
                          >
                            Complete
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatusChange(appointment._id, "Cancelled")}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {appointments.length === 0 && (
            <div className="no-data">
              <p>No appointments found for the selected date</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingAppointment ? "Edit Appointment" : "Schedule New Appointment"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAppointment(null)
                    resetForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="appointment-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select
                      name="patient"
                      className="form-select"
                      value={appointmentForm.patient}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Patient</option>
                      {patients.map((patient) => (
                        <option key={patient._id} value={patient._id}>
                          {patient.name} - {patient.patientId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Doctor *</label>
                    <select
                      name="doctor"
                      className="form-select"
                      value={appointmentForm.doctor}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Appointment Date *</label>
                    <input
                      type="date"
                      name="appointmentDate"
                      className="form-input"
                      value={appointmentForm.appointmentDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Appointment Time *</label>
                    <select
                      name="appointmentTime"
                      className="form-select"
                      value={appointmentForm.appointmentTime}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Time</option>
                      {getAvailableTimeSlots(appointmentForm.doctor, appointmentForm.appointmentDate).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Visit *</label>
                  <textarea
                    name="reason"
                    className="form-input"
                    rows="3"
                    value={appointmentForm.reason}
                    onChange={handleInputChange}
                    placeholder="Describe the reason for the appointment..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    name="notes"
                    className="form-input"
                    rows="2"
                    value={appointmentForm.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes or instructions..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false)
                      setEditingAppointment(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingAppointment ? "Update Appointment" : "Schedule Appointment"}
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

export default AppointmentScheduling
