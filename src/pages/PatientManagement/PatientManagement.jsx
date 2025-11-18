"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./PatientManagement.css"

const API_BASE = "https://hospyback.onrender.com";

const PatientManagement = () => {
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [patientForm, setPatientForm] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    contact: "",
    email: "",
    address: "",
    bloodGroup: "",
    emergencyContact: "",
    allergies: "",
    chronicDiseases: "",
    height: "",
    weight: "",
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    setLoading(true)
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
      } else {
        handleError("Failed to fetch patients")
      }
    } catch (error) {
      console.error("Fetch patients error:", error)
      handleError("Error loading patients")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPatientForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = editingPatient
        ? `${API_BASE}/api/patients/${editingPatient._id}`
        : `${API_BASE}/api/patients`

      const method = editingPatient ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patientForm),
      })

      if (response.ok) {
        handleSuccess(editingPatient ? "Patient updated successfully" : "Patient added successfully")
        setShowModal(false)
        setEditingPatient(null)
        resetForm()
        fetchPatients()
      } else {
        const error = await response.json()
        handleError(error.message || "Operation failed")
      }
    } catch (error) {
      console.error("Submit error:", error)
      handleError("Error saving patient")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (patient) => {
    setEditingPatient(patient)
    setPatientForm({
      name: patient.name || "",
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
      gender: patient.gender || "",
      contact: patient.contact || "",
      email: patient.email || "",
      address: patient.address || "",
      bloodGroup: patient.bloodGroup || "",
      emergencyContact: patient.emergencyContact || "",
      allergies: patient.allergies || "",
      chronicDiseases: patient.chronicDiseases || "",
      height: patient.height || "",
      weight: patient.weight || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (patientId) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        handleSuccess("Patient deleted successfully")
        fetchPatients()
      } else {
        handleError("Failed to delete patient")
      }
    } catch (error) {
      console.error("Delete error:", error)
      handleError("Error deleting patient")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPatientForm({
      name: "",
      dateOfBirth: "",
      gender: "",
      contact: "",
      email: "",
      address: "",
      bloodGroup: "",
      emergencyContact: "",
      allergies: "",
      chronicDiseases: "",
      height: "",
      weight: "",
    })
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contact?.includes(searchTerm),
  )

  if (loading && !showModal) {
    return <LoadingSpinner message="Loading patients..." />
  }

  return (
    <div className="patient-management-container">
      <Sidebar />
      <div className="patient-management-content">
        <div className="page-header">
          <h1>👤 Patient Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingPatient(null)
              resetForm()
              setShowModal(true)
            }}
          >
            Add New Patient
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search patients by name, ID, or contact..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="patients-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Blood Group</th>
                <th>BMI</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient._id}>
                  <td>{patient.patientId}</td>
                  <td>{patient.name}</td>
                  <td>{patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : "N/A"}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.contact}</td>
                  <td>{patient.bloodGroup}</td>
                  <td>{calculateBMI(patient.height, patient.weight) || "N/A"}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(patient)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(patient._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPatients.length === 0 && (
            <div className="no-data">
              <p>No patients found</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingPatient ? "Edit Patient" : "Add New Patient"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingPatient(null)
                    resetForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="patient-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={patientForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="form-input"
                      value={patientForm.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={patientForm.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact *</label>
                    <input
                      type="tel"
                      name="contact"
                      className="form-input"
                      value={patientForm.contact}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={patientForm.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      name="bloodGroup"
                      className="form-select"
                      value={patientForm.bloodGroup}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Emergency Contact</label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      className="form-input"
                      value={patientForm.emergencyContact}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      className="form-input"
                      value={patientForm.height}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      className="form-input"
                      value={patientForm.weight}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    className="form-input"
                    rows="3"
                    value={patientForm.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Allergies</label>
                  <textarea
                    name="allergies"
                    className="form-input"
                    rows="2"
                    value={patientForm.allergies}
                    onChange={handleInputChange}
                    placeholder="List any known allergies..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chronic Diseases</label>
                  <textarea
                    name="chronicDiseases"
                    className="form-input"
                    rows="2"
                    value={patientForm.chronicDiseases}
                    onChange={handleInputChange}
                    placeholder="List any chronic conditions..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false)
                      setEditingPatient(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingPatient ? "Update Patient" : "Add Patient"}
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

export default PatientManagement
