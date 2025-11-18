"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./WardManagement.css"

const API_BASE = "https://hospyback.onrender.com";

const WardManagement = () => {
  const [loading, setLoading] = useState(false)
  const [wards, setWards] = useState([])
  const [patients, setPatients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingWard, setEditingWard] = useState(null)
  const [selectedBed, setSelectedBed] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [wardForm, setWardForm] = useState({
    wardNumber: "",
    wardName: "",
    wardType: "",
    totalBeds: 0,
    floor: 1,
    department: "",
    nurseInCharge: "",
    facilities: "",
  })
  const [assignForm, setAssignForm] = useState({
    patient: "",
    admissionDate: "",
    expectedDischargeDate: "",
    notes: "",
  })

  const wardTypes = ["General", "Private", "ICU", "NICU", "CCU", "Emergency", "Maternity", "Pediatric"]
  const departments = [
    "General Medicine",
    "Surgery",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Gynecology",
    "Emergency",
  ]

  useEffect(() => {
    fetchWards()
    fetchPatients()
  }, [])

  const fetchWards = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/wards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWards(data)
      } else {
        handleError("Failed to fetch wards")
      }
    } catch (error) {
      console.error("Fetch wards error:", error)
      handleError("Error loading wards")
    } finally {
      setLoading(false)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setWardForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAssignInputChange = (e) => {
    const { name, value } = e.target
    setAssignForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = editingWard ? `${API_BASE}/api/wards/${editingWard._id}` : `${API_BASE}/api/wards`

      const method = editingWard ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(wardForm),
      })

      if (response.ok) {
        handleSuccess(editingWard ? "Ward updated successfully" : "Ward created successfully")
        setShowModal(false)
        setEditingWard(null)
        resetForm()
        fetchWards()
      } else {
        const error = await response.json()
        handleError(error.message || "Operation failed")
      }
    } catch (error) {
      console.error("Submit error:", error)
      handleError("Error saving ward")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignBed = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/wards/${selectedBed.wardId}/assign-bed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bedNumber: selectedBed.bedNumber,
          ...assignForm,
        }),
      })

      if (response.ok) {
        handleSuccess("Bed assigned successfully")
        setShowAssignModal(false)
        setSelectedBed(null)
        resetAssignForm()
        fetchWards()
      } else {
        const error = await response.json()
        handleError(error.message || "Failed to assign bed")
      }
    } catch (error) {
      console.error("Assign bed error:", error)
      handleError("Error assigning bed")
    } finally {
      setLoading(false)
    }
  }

  const handleDischargeBed = async (wardId, bedNumber) => {
    if (!window.confirm("Are you sure you want to discharge this patient?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/wards/${wardId}/discharge-bed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bedNumber }),
      })

      if (response.ok) {
        handleSuccess("Patient discharged successfully")
        fetchWards()
      } else {
        handleError("Failed to discharge patient")
      }
    } catch (error) {
      console.error("Discharge error:", error)
      handleError("Error discharging patient")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (ward) => {
    setEditingWard(ward)
    setWardForm({
      wardNumber: ward.wardNumber || "",
      wardName: ward.wardName || "",
      wardType: ward.wardType || "",
      totalBeds: ward.totalBeds || 0,
      floor: ward.floor || 1,
      department: ward.department || "",
      nurseInCharge: ward.nurseInCharge || "",
      facilities: ward.facilities || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (wardId) => {
    if (!window.confirm("Are you sure you want to delete this ward?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/wards/${wardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        handleSuccess("Ward deleted successfully")
        fetchWards()
      } else {
        handleError("Failed to delete ward")
      }
    } catch (error) {
      console.error("Delete error:", error)
      handleError("Error deleting ward")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setWardForm({
      wardNumber: "",
      wardName: "",
      wardType: "",
      totalBeds: 0,
      floor: 1,
      department: "",
      nurseInCharge: "",
      facilities: "",
    })
  }

  const resetAssignForm = () => {
    setAssignForm({
      patient: "",
      admissionDate: "",
      expectedDischargeDate: "",
      notes: "",
    })
  }

  const getOccupancyRate = (ward) => {
    return ward.totalBeds > 0 ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) : 0
  }

  const getOccupancyColor = (rate) => {
    if (rate >= 90) return "occupancy-critical"
    if (rate >= 70) return "occupancy-high"
    if (rate >= 50) return "occupancy-medium"
    return "occupancy-low"
  }

  const filteredWards = wards.filter(
    (ward) =>
      ward.wardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ward.wardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ward.wardType?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading && !showModal && !showAssignModal) {
    return <LoadingSpinner message="Loading wards..." />
  }

  return (
    <div className="ward-management-container">
      <Sidebar />
      <div className="ward-management-content">
        <div className="page-header">
          <h1>🛏️ Ward Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingWard(null)
              resetForm()
              setShowModal(true)
            }}
          >
            Add New Ward
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search wards by name, number, or type..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="wards-grid">
          {filteredWards.map((ward) => (
            <div key={ward._id} className="ward-card">
              <div className="ward-header">
                <div className="ward-info">
                  <h3>{ward.wardName}</h3>
                  <p className="ward-number">Ward #{ward.wardNumber}</p>
                  <p className="ward-type">{ward.wardType}</p>
                </div>
                <div className="ward-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(ward)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ward._id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div className="ward-stats">
                <div className="stat-item">
                  <span className="label">Floor:</span>
                  <span className="value">{ward.floor}</span>
                </div>
                <div className="stat-item">
                  <span className="label">Department:</span>
                  <span className="value">{ward.department}</span>
                </div>
                <div className="stat-item">
                  <span className="label">Nurse in Charge:</span>
                  <span className="value">{ward.nurseInCharge}</span>
                </div>
              </div>

              <div className="occupancy-info">
                <div className="occupancy-header">
                  <span>Bed Occupancy</span>
                  <span className={`occupancy-rate ${getOccupancyColor(getOccupancyRate(ward))}`}>
                    {getOccupancyRate(ward)}%
                  </span>
                </div>
                <div className="occupancy-bar">
                  <div
                    className={`occupancy-fill ${getOccupancyColor(getOccupancyRate(ward))}`}
                    style={{ width: `${getOccupancyRate(ward)}%` }}
                  ></div>
                </div>
                <div className="bed-count">
                  {ward.occupiedBeds} / {ward.totalBeds} beds occupied
                </div>
              </div>

              <div className="beds-grid">
                {Array.from({ length: ward.totalBeds }, (_, index) => {
                  const bedNumber = index + 1
                  const bed = ward.beds?.find((b) => b.bedNumber === bedNumber)
                  const isOccupied = bed && bed.isOccupied

                  return (
                    <div
                      key={bedNumber}
                      className={`bed-item ${isOccupied ? "occupied" : "available"}`}
                      onClick={() => {
                        if (!isOccupied) {
                          setSelectedBed({ wardId: ward._id, bedNumber })
                          setShowAssignModal(true)
                        }
                      }}
                    >
                      <div className="bed-number">{bedNumber}</div>
                      {isOccupied ? (
                        <div className="bed-patient">
                          <div className="patient-name">{bed.patient?.name}</div>
                          <button
                            className="discharge-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDischargeBed(ward._id, bedNumber)
                            }}
                          >
                            Discharge
                          </button>
                        </div>
                      ) : (
                        <div className="bed-available">Available</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredWards.length === 0 && (
          <div className="no-data">
            <p>No wards found</p>
          </div>
        )}

        {/* Ward Form Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingWard ? "Edit Ward" : "Add New Ward"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingWard(null)
                    resetForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="ward-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Ward Number *</label>
                    <input
                      type="text"
                      name="wardNumber"
                      className="form-input"
                      value={wardForm.wardNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ward Name *</label>
                    <input
                      type="text"
                      name="wardName"
                      className="form-input"
                      value={wardForm.wardName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ward Type *</label>
                    <select
                      name="wardType"
                      className="form-select"
                      value={wardForm.wardType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Ward Type</option>
                      {wardTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Beds *</label>
                    <input
                      type="number"
                      name="totalBeds"
                      className="form-input"
                      value={wardForm.totalBeds}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Floor *</label>
                    <input
                      type="number"
                      name="floor"
                      className="form-input"
                      value={wardForm.floor}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      name="department"
                      className="form-select"
                      value={wardForm.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nurse in Charge</label>
                    <input
                      type="text"
                      name="nurseInCharge"
                      className="form-input"
                      value={wardForm.nurseInCharge}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Facilities</label>
                  <textarea
                    name="facilities"
                    className="form-input"
                    rows="3"
                    value={wardForm.facilities}
                    onChange={handleInputChange}
                    placeholder="List available facilities..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false)
                      setEditingWard(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingWard ? "Update Ward" : "Add Ward"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bed Assignment Modal */}
        {showAssignModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Assign Bed #{selectedBed?.bedNumber}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedBed(null)
                    resetAssignForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAssignBed} className="assign-form">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select
                    name="patient"
                    className="form-select"
                    value={assignForm.patient}
                    onChange={handleAssignInputChange}
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

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Admission Date *</label>
                    <input
                      type="date"
                      name="admissionDate"
                      className="form-input"
                      value={assignForm.admissionDate}
                      onChange={handleAssignInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expected Discharge Date</label>
                    <input
                      type="date"
                      name="expectedDischargeDate"
                      className="form-input"
                      value={assignForm.expectedDischargeDate}
                      onChange={handleAssignInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    className="form-input"
                    rows="3"
                    value={assignForm.notes}
                    onChange={handleAssignInputChange}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedBed(null)
                      resetAssignForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Assigning..." : "Assign Bed"}
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

export default WardManagement
