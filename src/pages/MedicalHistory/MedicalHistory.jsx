"use client"

import { useState, useEffect, useCallback } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./MedicalHistory.css"


const API_BASE = "https://hospyback.onrender.com";

// Helper: decode JWT token
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch (err) {
    return null
  }
}

const MedicalHistory = () => {
  const [loading, setLoading] = useState(false)
  const [patientId, setPatientId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [patientsList, setPatientsList] = useState([])

  const [patient, setPatient] = useState(null)
  const [medicalHistory, setMedicalHistory] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [activeTab, setActiveTab] = useState("history")

  const [historyForm, setHistoryForm] = useState({
    date: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    prescription: "",
    doctorName: "",
    notes: "",
    followUpDate: "",
    attachments: [],
  })

  // Initialize: Detect role and fetch initial data
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      handleError("No token found. Please log in.")
      return
    }

    const decoded = decodeToken(token)
    if (!decoded?.role) {
      handleError("Invalid token")
      return
    }

    setUserRole(decoded.role)

    // Fetch data based on role
    if (decoded.role === "patient") {
      fetchPatientIdFromEmail(token)
    } else if (decoded.role === "doctor") {
      fetchAllPatients(token)
    }
  }, [])

  // Fetch patient ID for logged-in patient
  const fetchPatientIdFromEmail = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/patients/email/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        handleError(data.message || "Failed to fetch patient ID");
        return;
      }

      console.log("Patient ID response:", data);

      // some APIs return { data: {...} } while some return directly {...}
      setPatientId(data.data?._id || data._id);
    } catch (error) {
      handleError("Error fetching patient ID");
      console.error(error);
    }
  };


  // Fetch all patients for doctor
  const fetchAllPatients = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/patients`, {
        headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` },
      })

      const data = await response.json()

      if (!response.ok) {
        handleError("Failed to fetch patients list")
        return
      }

      // Handle different response structures
      const patients = data.patients || data.data || data || []
      setPatientsList(Array.isArray(patients) ? patients : [])
    } catch (error) {
      handleError("Error fetching patients list")
      console.error(error)
    }
  }

  // Fetch patient details when patientId changes
  const fetchPatient = useCallback(async () => {
    if (!patientId) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        handleError("Failed to load patient details")
        setPatient(null)
        return
      }

      // Handle different response structures
      const patientData = data.data || data
      setPatient(patientData)
    } catch (error) {
      handleError("Error loading patient details")
      console.error(error)
      setPatient(null)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  // Fetch medical history when patientId changes
  const fetchMedicalHistory = useCallback(async () => {
    if (!patientId) {
      setMedicalHistory([])
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/medical-history/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        handleError("Failed to load medical history")
        setMedicalHistory([])
        return
      }

      // backend returns array (see your controller) — use directly
      const data = await response.json()
      setMedicalHistory(Array.isArray(data) ? data : data.medicalHistory || [])
    } catch (error) {
      handleError("Error loading medical history")
      console.error(error)
      setMedicalHistory([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  // Automatically fetch patient and history when patientId changes
  useEffect(() => {
    if (patientId) {
      fetchPatient()
      fetchMedicalHistory()
    }
  }, [patientId, fetchPatient, fetchMedicalHistory])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setHistoryForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setHistoryForm((prev) => ({
      ...prev,
      attachments: Array.from(e.target.files),
    }))
  }

  const resetForm = () => {
    setHistoryForm({
      date: "",
      diagnosis: "",
      symptoms: "",
      treatment: "",
      prescription: "",
      doctorName: "",
      notes: "",
      followUpDate: "",
      attachments: [],
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!patientId) {
      handleError("No patient selected")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()

      // IMPORTANT: backend expects `patient` ObjectId (schema field name).
      // send `patient` not `patientId`
      formData.append("patient", patientId)

      // append other fields
      Object.keys(historyForm).forEach((key) => {
        if (key === "attachments") {
          // append files if any
          (historyForm.attachments || []).forEach((file) => {
            if (file) formData.append("attachments", file)
          })
        } else {
          // append string values (ensure not undefined)
          const value = historyForm[key] ?? ""
          formData.append(key, value)
        }
      })

      const token = localStorage.getItem("token")
      const url = editingRecord
        ? `${API_BASE}/api/medical-history/${editingRecord._id}`
        : `${API_BASE}/api/medical-history`
      const method = editingRecord ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set 'Content-Type' here — the browser will set the multipart boundary for FormData
        },
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        handleSuccess(editingRecord ? "Record updated successfully" : "Record added successfully")
        setShowModal(false)
        setEditingRecord(null)
        resetForm()
        fetchMedicalHistory()
      } else {
        // if validation errors array exists, show first message
        if (result && result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          handleError(result.errors[0].msg || result.message || "Operation failed")
        } else {
          handleError(result.message || "Operation failed")
        }
      }
    } catch (error) {
      handleError("Error saving record")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setHistoryForm({
      date: record.date?.split("T")[0] || "",
      diagnosis: record.diagnosis || "",
      symptoms: record.symptoms || "",
      treatment: record.treatment || "",
      prescription: record.prescription || "",
      doctorName: record.doctorName || "",
      notes: record.notes || "",
      followUpDate: record.followUpDate?.split("T")[0] || "",
      attachments: [], // user can add new attachments if needed
    })
    // ensure patientId is the record's patient id if available
    if (record.patient && typeof record.patient === "object" && record.patient._id) {
      setPatientId(record.patient._id)
    }
    setShowModal(true)
  }

  const handleDelete = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/medical-history/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        handleSuccess("Record deleted successfully")
        fetchMedicalHistory()
      } else {
        handleError("Failed to delete record")
      }
    } catch (error) {
      handleError("Error deleting record")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A"
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
    if (!height || !weight) return "N/A"
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  // Loading state - waiting for role detection
  if (!userRole) {
    return (
      <div className="medical-history-container">
        <Sidebar />
        <div className="medical-history-content">
          <LoadingSpinner message="Loading..." />
        </div>
      </div>
    )
  }

  // Waiting for doctor to select a patient
  if (userRole === "doctor" && !patientId) {
    return (
      <div className="medical-history-container">
        <Sidebar />
        <div className="medical-history-content">
          <div className="page-header">
            <h1>📋 Medical History</h1>
            {patientsList.length > 0 && (
              <div className="patient-select-box">
                <label className="patient-select-label">Select Patient:</label>
                <select
                  className="patient-select-dropdown"
                  value={patientId || ""}
                  onChange={(e) => setPatientId(e.target.value)}
                >
                  <option value="">--Patient --</option>
                  {patientsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — {p.email}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingRecord(null)
                    resetForm()
                    setShowModal(true)
                  }}
                >
                  Add Medical Record
                </button>
              </div>
            )}
          </div>
          <div className="no-data">
            <p>
              {patientsList.length === 0
                ? "Loading patients..."
                : "Please select a patient to view their medical history"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render main content until we have patient data
  if (!patient) {
    return (
      <div className="medical-history-container">
        <Sidebar />
        <div className="medical-history-content">
          <LoadingSpinner message="Loading patient data..." />
        </div>
      </div>
    )
  }

  return (
    <div className="medical-history-container">
      <Sidebar />
      <div className="medical-history-content">
        <h1>📋 Medical History</h1>
        <div className="page-header">
          {userRole === "doctor" && patientsList.length > 0 && (
            <div className="patient-select-box">
              <label className="patient-select-label">Select Patient:</label>
              <select
                className="patient-select-dropdown"
                value={patientId || ""}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="">-- Select a Patient --</option>
                {patientsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {p.email}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingRecord(null)
                  resetForm()
                  setShowModal(true)
                }}
              >
                Add Medical Record
              </button>
            </div>
          )}
        </div>

        <div className="patient-summary-card">
          <div className="patient-header">
            <div className="patient-avatar">{patient.name?.charAt(0).toUpperCase() || "?"}</div>
            <div className="patient-details">
              <h2>{patient.name || "Unknown Patient"}</h2>
              <p className="patient-id">Patient ID: {patient.patientId || "N/A"}</p>
              <div className="patient-info-grid">
                <div className="info-item">
                  <span className="label">Age:</span>
                  <span className="value">{calculateAge(patient.dateOfBirth)} years</span>
                </div>
                <div className="info-item">
                  <span className="label">Gender:</span>
                  <span className="value">{patient.gender || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="label">Blood Group:</span>
                  <span className="value">{patient.bloodGroup || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="label">BMI:</span>
                  <span className="value">{calculateBMI(patient.height, patient.weight)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Contact:</span>
                  <span className="value">{patient.contact || "N/A"}</span>
                </div>
                <div className="info-item">
                  <span className="label">Emergency Contact:</span>
                  <span className="value">{patient.emergencyContact || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {(patient.allergies || patient.chronicDiseases) && (
            <div className="medical-alerts">
              {patient.allergies && (
                <div className="alert-item allergies">
                  <strong>⚠️ Allergies:</strong> {patient.allergies}
                </div>
              )}
              {patient.chronicDiseases && (
                <div className="alert-item chronic">
                  <strong>🩺 Chronic Conditions:</strong> {patient.chronicDiseases}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Medical History
            </button>
            <button
              className={`tab ${activeTab === "timeline" ? "active" : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              Timeline View
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "history" && (
              <div className="history-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Diagnosis</th>
                      <th>Symptoms</th>
                      <th>Treatment</th>
                      <th>Doctor</th>
                      <th>Follow-up</th>
                      {userRole === "doctor" && <th>Actions</th>}
                      <th>Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalHistory.map((record) => (
                      <tr key={record._id}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          <div className="diagnosis">{record.diagnosis}</div>
                        </td>
                        <td>
                          <div className="symptoms">{record.symptoms}</div>
                        </td>
                        <td>
                          <div className="treatment">{record.treatment}</div>
                        </td>
                        <td>{record.doctorName}</td>
                        <td>{record.followUpDate ? new Date(record.followUpDate).toLocaleDateString() : "N/A"}</td>
                        {userRole === "doctor" && (
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(record)}>
                                Edit
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(record._id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                        <td>
                          {record.attachments && record.attachments.length > 0 ? (
                            <a
                              href={`${API_BASE}/${record.attachments[0].path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                            >
                              Your Report
                            </a>
                          ) : (
                            "No Report"
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>

                {medicalHistory.length === 0 && (
                  <div className="no-data">
                    <p>No medical history found for this patient</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="timeline-container">
                {medicalHistory
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record) => (
                    <div key={record._id} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <h3>{record.diagnosis}</h3>
                          <span className="timeline-date">{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                        <div className="timeline-body">
                          <div className="timeline-section">
                            <strong>Symptoms:</strong>
                            <p>{record.symptoms}</p>
                          </div>
                          <div className="timeline-section">
                            <strong>Treatment:</strong>
                            <p>{record.treatment}</p>
                          </div>
                          {record.prescription && (
                            <div className="timeline-section">
                              <strong>Prescription:</strong>
                              <p>{record.prescription}</p>
                            </div>
                          )}
                          <div className="timeline-footer">
                            <span className="doctor-name">Dr. {record.doctorName}</span>
                            {record.followUpDate && (
                              <span className="follow-up">
                                Follow-up: {new Date(record.followUpDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {medicalHistory.length === 0 && (
                  <div className="no-data">
                    <p>No medical history found for this patient</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal medical-record-modal">
              <div className="modal-header">
                <h2>{editingRecord ? "Edit Medical Record" : "Add Medical Record"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingRecord(null)
                    resetForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="medical-record-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      name="date"
                      className="form-input"
                      value={historyForm.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Doctor Name *</label>
                    <input
                      type="text"
                      name="doctorName"
                      className="form-input"
                      value={historyForm.doctorName}
                      onChange={handleInputChange}
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input
                      type="date"
                      name="followUpDate"
                      className="form-input"
                      value={historyForm.followUpDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Diagnosis *</label>
                  <input
                    type="text"
                    name="diagnosis"
                    className="form-input"
                    value={historyForm.diagnosis}
                    onChange={handleInputChange}
                    placeholder="Primary diagnosis"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Symptoms *</label>
                  <textarea
                    name="symptoms"
                    className="form-input"
                    rows="3"
                    value={historyForm.symptoms}
                    onChange={handleInputChange}
                    placeholder="Describe the symptoms..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Treatment *</label>
                  <textarea
                    name="treatment"
                    className="form-input"
                    rows="3"
                    value={historyForm.treatment}
                    onChange={handleInputChange}
                    placeholder="Treatment provided..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Prescription</label>
                  <textarea
                    name="prescription"
                    className="form-input"
                    rows="3"
                    value={historyForm.prescription}
                    onChange={handleInputChange}
                    placeholder="Medications prescribed..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    name="notes"
                    className="form-input"
                    rows="2"
                    value={historyForm.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attachments</label>
                  <input
                    type="file"
                    name="attachments"
                    className="form-input"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <small className="file-help">You can upload multiple files (PDF, Images, Word documents)</small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false)
                      setEditingRecord(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingRecord ? "Update Record" : "Add Record"}
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

export default MedicalHistory
