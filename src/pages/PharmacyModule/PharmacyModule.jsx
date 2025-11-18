"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./PharmacyModule.css"

const API_BASE = "https://hospyback.onrender.com";

const PharmacyModule = () => {
  const [loading, setLoading] = useState(false)
  const [medicines, setMedicines] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [showMedicineModal, setShowMedicineModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [editingPrescription, setEditingPrescription] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("medicines")
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    genericName: "",
    manufacturer: "",
    category: "",
    dosageForm: "",
    strength: "",
    unitPrice: 0,
    stockQuantity: 0,
    minStockLevel: 0,
    expiryDate: "",
    batchNumber: "",
    description: "",
  })
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient: "",
    medicines: [{ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    prescribedBy: "",
    notes: "",
  })

  const categories = [
    "Antibiotics",
    "Analgesics",
    "Antacids",
    "Antihistamines",
    "Cardiovascular",
    "Diabetes",
    "Respiratory",
    "Neurological",
    "Vitamins",
    "Supplements",
  ]

  const dosageForms = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Ointment", "Drops", "Inhaler"]

  useEffect(() => {
    fetchMedicines()
    fetchPrescriptions()
    fetchPatients()
  }, [])

  const fetchMedicines = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/medicines`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMedicines(data)
      } else {
        handleError("Failed to fetch medicines")
      }
    } catch (error) {
      console.error("Fetch medicines error:", error)
      handleError("Error loading medicines")
    } finally {
      setLoading(false)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/prescriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPrescriptions(data)
      }
    } catch (error) {
      console.error("Fetch prescriptions error:", error)
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

  const handleMedicineInputChange = (e) => {
    const { name, value } = e.target
    setMedicineForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePrescriptionInputChange = (e) => {
    const { name, value } = e.target
    setPrescriptionForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMedicineChange = (index, field, value) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addMedicine = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    }))
  }

  const removeMedicine = (index) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }))
  }

  const handleMedicineSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = editingMedicine
        ? `${API_BASE}/api/medicines/${editingMedicine._id}`
        : `${API_BASE}/api/medicines`

      const method = editingMedicine ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(medicineForm),
      })

      if (response.ok) {
        handleSuccess(editingMedicine ? "Medicine updated successfully" : "Medicine added successfully")
        setShowMedicineModal(false)
        setEditingMedicine(null)
        resetMedicineForm()
        fetchMedicines()
      } else {
        const error = await response.json()
        handleError(error.message || "Operation failed")
      }
    } catch (error) {
      console.error("Submit error:", error)
      handleError("Error saving medicine")
    } finally {
      setLoading(false)
    }
  }

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = editingPrescription
        ? `${API_BASE}/api/prescriptions/${editingPrescription._id}`
        : `${API_BASE}/api/prescriptions`

      const method = editingPrescription ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prescriptionForm),
      })

      if (response.ok) {
        handleSuccess(editingPrescription ? "Prescription updated successfully" : "Prescription created successfully")
        setShowPrescriptionModal(false)
        setEditingPrescription(null)
        resetPrescriptionForm()
        fetchPrescriptions()
      } else {
        const error = await response.json()
        handleError(error.message || "Operation failed")
      }
    } catch (error) {
      console.error("Submit error:", error)
      handleError("Error saving prescription")
    } finally {
      setLoading(false)
    }
  }

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine)
    setMedicineForm({
      name: medicine.name || "",
      genericName: medicine.genericName || "",
      manufacturer: medicine.manufacturer || "",
      category: medicine.category || "",
      dosageForm: medicine.dosageForm || "",
      strength: medicine.strength || "",
      unitPrice: medicine.unitPrice || 0,
      stockQuantity: medicine.stockQuantity || 0,
      minStockLevel: medicine.minStockLevel || 0,
      expiryDate: medicine.expiryDate ? medicine.expiryDate.split("T")[0] : "",
      batchNumber: medicine.batchNumber || "",
      description: medicine.description || "",
    })
    setShowMedicineModal(true)
  }

  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription)
    setPrescriptionForm({
      patient: prescription.patient._id,
      medicines: prescription.medicines || [{ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
      prescribedBy: prescription.prescribedBy || "",
      notes: prescription.notes || "",
    })
    setShowPrescriptionModal(true)
  }

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/medicines/${medicineId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        handleSuccess("Medicine deleted successfully")
        fetchMedicines()
      } else {
        handleError("Failed to delete medicine")
      }
    } catch (error) {
      console.error("Delete error:", error)
      handleError("Error deleting medicine")
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/prescriptions/${prescriptionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        handleSuccess("Prescription deleted successfully")
        fetchPrescriptions()
      } else {
        handleError("Failed to delete prescription")
      }
    } catch (error) {
      console.error("Delete error:", error)
      handleError("Error deleting prescription")
    } finally {
      setLoading(false)
    }
  }

  const resetMedicineForm = () => {
    setMedicineForm({
      name: "",
      genericName: "",
      manufacturer: "",
      category: "",
      dosageForm: "",
      strength: "",
      unitPrice: 0,
      stockQuantity: 0,
      minStockLevel: 0,
      expiryDate: "",
      batchNumber: "",
      description: "",
    })
  }

  const resetPrescriptionForm = () => {
    setPrescriptionForm({
      patient: "",
      medicines: [{ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
      prescribedBy: "",
      notes: "",
    })
  }

  const getStockStatus = (medicine) => {
    if (medicine.stockQuantity === 0) return "out-of-stock"
    if (medicine.stockQuantity <= medicine.minStockLevel) return "low-stock"
    return "in-stock"
  }

  const getStockStatusText = (medicine) => {
    if (medicine.stockQuantity === 0) return "Out of Stock"
    if (medicine.stockQuantity <= medicine.minStockLevel) return "Low Stock"
    return "In Stock"
  }

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    const today = new Date()
    const expiry = new Date(expiryDate)
    return expiry < today
  }

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescribedBy?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading && !showMedicineModal && !showPrescriptionModal) {
    return <LoadingSpinner message="Loading pharmacy data..." />
  }

  return (
    <div className="pharmacy-module-container">
      <Sidebar />
      <div className="pharmacy-module-content">
        <div className="page-header">
          <h1>💊 Pharmacy Module</h1>
          <div className="header-actions">
            {activeTab === "medicines" ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingMedicine(null)
                  resetMedicineForm()
                  setShowMedicineModal(true)
                }}
              >
                Add Medicine
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingPrescription(null)
                  resetPrescriptionForm()
                  setShowPrescriptionModal(true)
                }}
              >
                Create Prescription
              </button>
            )}
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "medicines" ? "active" : ""}`}
              onClick={() => setActiveTab("medicines")}
            >
              Medicine Inventory
            </button>
            <button
              className={`tab ${activeTab === "prescriptions" ? "active" : ""}`}
              onClick={() => setActiveTab("prescriptions")}
            >
              Prescriptions
            </button>
          </div>

          <div className="search-section">
            <input
              type="text"
              placeholder={
                activeTab === "medicines"
                  ? "Search medicines by name, generic name, or category..."
                  : "Search prescriptions by patient or doctor..."
              }
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="tab-content">
            {activeTab === "medicines" && (
              <div className="medicines-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Generic Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedicines.map((medicine) => (
                      <tr key={medicine._id}>
                        <td>
                          <div className="medicine-info">
                            <strong>{medicine.name}</strong>
                            <br />
                            <small>{medicine.strength} - {medicine.dosageForm}</small>
                          </div>
                        </td>
                        <td>{medicine.genericName}</td>
                        <td>{medicine.category}</td>
                        <td>
                          <div className="stock-info">
                            <span className={`stock-quantity ${getStockStatus(medicine)}`}>
                              {medicine.stockQuantity}
                            </span>
                            <small>Min: {medicine.minStockLevel}</small>
                          </div>
                        </td>
                        <td>₹{medicine.unitPrice}</td>
                        <td>
                          <div className="expiry-info">
                            {medicine.expiryDate ? (
                              <span
                                className={`expiry-date ${
                                  isExpired(medicine.expiryDate)
                                    ? "expired"
                                    : isExpiringSoon(medicine.expiryDate)
                                    ? "expiring-soon"
                                    : "valid"
                                }`}
                              >
                                {new Date(medicine.expiryDate).toLocaleDateString()}
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${getStockStatus(medicine)}`}>
                            {getStockStatusText(medicine)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditMedicine(medicine)}>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMedicine(medicine._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredMedicines.length === 0 && (
                  <div className="no-data">
                    <p>No medicines found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "prescriptions" && (
              <div className="prescriptions-table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Prescribed By</th>
                      <th>Date</th>
                      <th>Medicines</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((prescription) => (
                      <tr key={prescription._id}>
                        <td>
                          <div className="patient-info">
                            <strong>{prescription.patient?.name}</strong>
                            <br />
                            <small>{prescription.patient?.patientId}</small>
                          </div>
                        </td>
                        <td>Dr. {prescription.prescribedBy}</td>
                        <td>{new Date(prescription.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="medicines-list">
                            {prescription.medicines?.slice(0, 2).map((med, index) => (
                              <div key={index} className="medicine-item">
                                {med.medicine} - {med.dosage}
                              </div>
                            ))}
                            {prescription.medicines?.length > 2 && (
                              <small>+{prescription.medicines.length - 2} more</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="status-badge active">Active</span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEditPrescription(prescription)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeletePrescription(prescription._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPrescriptions.length === 0 && (
                  <div className="no-data">
                    <p>No prescriptions found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Medicine Modal */}
        {showMedicineModal && (
          <div className="modal-overlay">
            <div className="modal medicine-modal">
              <div className="modal-header">
                <h2>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowMedicineModal(false)
                    setEditingMedicine(null)
                    resetMedicineForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleMedicineSubmit} className="medicine-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Medicine Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={medicineForm.name}
                      onChange={handleMedicineInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Generic Name</label>
                    <input
                      type="text"
                      name="genericName"
                      className="form-input"
                      value={medicineForm.genericName}
                      onChange={handleMedicineInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Manufacturer</label>
                    <input
                      type="text"
                      name="manufacturer"
                      className="form-input"
                      value={medicineForm.manufacturer}
                      onChange={handleMedicineInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      name="category"
                      className="form-select"
                      value={medicineForm.category}
                      onChange={handleMedicineInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dosage Form *</label>
                    <select
                      name="dosageForm"
                      className="form-select"
                      value={medicineForm.dosageForm}
                      onChange={handleMedicineInputChange}
                      required
                    >
                      <option value="">Select Dosage Form</option>
                      {dosageForms.map((form) => (
                        <option key={form} value={form}>
                          {form}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Strength</label>
                    <input
                      type="text"
                      name="strength"
                      className="form-input"
                      value={medicineForm.strength}
                      onChange={handleMedicineInputChange}
                      placeholder="e.g., 500mg, 10ml"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit Price (₹) *</label>
                    <input
                      type="number"
                      name="unitPrice"
                      className="form-input"
                      value={medicineForm.unitPrice}
                      onChange={handleMedicineInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Quantity *</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      className="form-input"
                      value={medicineForm.stockQuantity}
                      onChange={handleMedicineInputChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Stock Level</label>
                    <input
                      type="number"
                      name="minStockLevel"
                      className="form-input"
                      value={medicineForm.minStockLevel}
                      onChange={handleMedicineInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      className="form-input"
                      value={medicineForm.expiryDate}
                      onChange={handleMedicineInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Batch Number</label>
                    <input
                      type="text"
                      name="batchNumber"
                      className="form-input"
                      value={medicineForm.batchNumber}
                      onChange={handleMedicineInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-input"
                    rows="3"
                    value={medicineForm.description}
                    onChange={handleMedicineInputChange}
                    placeholder="Medicine description..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowMedicineModal(false)
                      setEditingMedicine(null)
                      resetMedicineForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingMedicine ? "Update Medicine" : "Add Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Prescription Modal */}
        {showPrescriptionModal && (
          <div className="modal-overlay">
            <div className="modal prescription-modal">
              <div className="modal-header">
                <h2>{editingPrescription ? "Edit Prescription" : "Create New Prescription"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowPrescriptionModal(false)
                    setEditingPrescription(null)
                    resetPrescriptionForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handlePrescriptionSubmit} className="prescription-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select
                      name="patient"
                      className="form-select"
                      value={prescriptionForm.patient}
                      onChange={handlePrescriptionInputChange}
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
                    <label className="form-label">Prescribed By *</label>
                    <input
                      type="text"
                      name="prescribedBy"
                      className="form-input"
                      value={prescriptionForm.prescribedBy}
                      onChange={handlePrescriptionInputChange}
                      placeholder="Doctor name"
                      required
                    />
                  </div>
                </div>

                <div className="medicines-section">
                  <div className="section-header">
                    <h3>Prescribed Medicines</h3>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addMedicine}>
                      Add Medicine
                    </button>
                  </div>

                  {prescriptionForm.medicines.map((medicine, index) => (
                    <div key={index} className="medicine-row">
                      <div className="medicine-grid">
                        <div className="form-group">
                          <label className="form-label">Medicine *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={medicine.medicine}
                            onChange={(e) => handleMedicineChange(index, "medicine", e.target.value)}
                            placeholder="Medicine name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Dosage *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={medicine.dosage}
                            onChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                            placeholder="e.g., 500mg"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Frequency *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={medicine.frequency}
                            onChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                            placeholder="e.g., Twice daily"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Duration</label>
                          <input
                            type="text"
                            className="form-input"
                            value={medicine.duration}
                            onChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                            placeholder="e.g., 7 days"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Instructions</label>
                        <input
                          type="text"
                          className="form-input"
                          value={medicine.instructions}
                          onChange={(e) => handleMedicineChange(index, "instructions", e.target.value)}
                          placeholder="Special instructions..."
                        />
                      </div>
                      {prescriptionForm.medicines.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm remove-medicine-btn"
                          onClick={() => removeMedicine(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    name="notes"
                    className="form-input"
                    rows="3"
                    value={prescriptionForm.notes}
                    onChange={handlePrescriptionInputChange}
                    placeholder="Additional notes or instructions..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPrescriptionModal(false)
                      setEditingPrescription(null)
                      resetPrescriptionForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingPrescription ? "Update Prescription" : "Create Prescription"}
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

export default PharmacyModule
