"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./LabTestManagement.css"


const API_BASE = "https://hospyback.onrender.com";

const LabTestManagement = () => {
  const [loading, setLoading] = useState(false)
  const [labTests, setLabTests] = useState([])
  const [patients, setPatients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTest, setEditingTest] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [testForm, setTestForm] = useState({
    patient: "",
    testName: "",
    testType: "",
    description: "",
    results: "",
    normalRange: "",
    status: "Pending",
    reportFile: null,
    notes: "",
  })

  const testTypes = [
    "Blood Test",
    "Urine Test",
    "X-Ray",
    "CT Scan",
    "MRI",
    "Ultrasound",
    "ECG",
    "Echo",
    "Endoscopy",
    "Biopsy",
    "Pathology",
    "Microbiology",
  ]

  const testStatuses = ["Pending", "In Progress", "Completed", "Cancelled"]

  useEffect(() => {
    fetchLabTests()
    fetchPatients()
  }, [])

  const fetchLabTests = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/lab-tests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLabTests(data)
      } else {
        handleError("Failed to fetch lab tests")
      }
    } catch (error) {
      console.error("Fetch lab tests error:", error)
      handleError("Error loading lab tests")
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
    setTestForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    setTestForm((prev) => ({
      ...prev,
      reportFile: e.target.files[0],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const testData = {
        patient: testForm.patient,
        testName: testForm.testName,
        testType: testForm.testType,
        description: testForm.description,
        results: testForm.results,
        normalRange: testForm.normalRange,
        status: testForm.status,
        notes: testForm.notes,
      }

      const token = localStorage.getItem("token")
      const url = editingTest
        ? `${API_BASE}/api/lab-tests/${editingTest._id}`
        : "${API_BASE}/api/lab-tests"

      const response = await fetch(url, {
        method: editingTest ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Operation failed")
      }

      // Remove the unused data assignment
      await response.json()
      handleSuccess(editingTest ? "Lab test updated successfully" : "Lab test created successfully")
      setShowModal(false)
      setEditingTest(null)
      resetForm()
      fetchLabTests()
    } catch (error) {
      console.error("Submit error:", error)
      handleError(error.message || "Error saving lab test")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (testId, newStatus) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/lab-tests/${testId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        handleSuccess("Test status updated successfully")
        fetchLabTests()
      } else {
        handleError("Failed to update test status")
      }
    } catch (error) {
      console.error("Status update error:", error)
      handleError("Error updating test status")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (test) => {
    setEditingTest(test)
    setTestForm({
      patient: test.patient._id,
      testName: test.testName || "",
      testType: test.testType || "",
      description: test.description || "",
      results: test.results || "",
      normalRange: test.normalRange || "",
      status: test.status || "Pending",
      reportFile: null,
      notes: test.notes || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this lab test?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/lab-tests/${testId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        handleSuccess("Lab test deleted successfully")
        fetchLabTests()
      } else {
        handleError("Failed to delete lab test")
      }
    } catch (error) {
      console.error("Delete error:", error)
      handleError("Error deleting lab test")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTestForm({
      patient: "",
      testName: "",
      testType: "",
      description: "",
      results: "",
      normalRange: "",
      status: "Pending",
      reportFile: null,
      notes: "",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "status-pending"
      case "In Progress":
        return "status-progress"
      case "Completed":
        return "status-completed"
      case "Cancelled":
        return "status-cancelled"
      default:
        return "status-pending"
    }
  }

  const isAbnormal = (results, normalRange) => {
    if (!results || !normalRange) return false
    // Simple check - in real implementation, you'd have more sophisticated logic
    return results.toLowerCase().includes("high") || results.toLowerCase().includes("low")
  }

  const filteredTests = labTests.filter(
    (test) =>
      test.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testId?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading && !showModal) {
    return <LoadingSpinner message="Loading lab tests..." />
  }

  return (
    <div className="lab-test-management-container">
      <Sidebar />
      <div className="lab-test-management-content">
        <div className="page-header">
          <h1>🧪 Lab Test Management</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTest(null)
              resetForm()
              setShowModal(true)
            }}
          >
            Add New Test
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search tests by patient name, test name, or ID..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tests-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Test ID</th>
                <th>Patient</th>
                <th>Test Name</th>
                <th>Test Type</th>
                <th>Status</th>
                <th>Results</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.map((test) => (
                <tr key={test._id}>
                  <td>{test.testId}</td>
                  <td>
                    <div className="patient-info">
                      <strong>{test.patient?.name}</strong>
                      <br />
                      <small>{test.patient?.patientId}</small>
                    </div>
                  </td>
                  <td>{test.testName}</td>
                  <td>{test.testType}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(test.status)}`}>{test.status}</span>
                  </td>
                  <td>
                    {test.results ? (
                      <div className={`results ${isAbnormal(test.results, test.normalRange) ? "abnormal" : "normal"}`}>
                        {test.results}
                        {isAbnormal(test.results, test.normalRange) && <span className="flag">⚠️</span>}
                      </div>
                    ) : (
                      <span className="no-results">Pending</span>
                    )}
                  </td>
                  <td>{new Date(test.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(test)}>
                        Edit
                      </button>
                      {test.status === "Pending" && (
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => handleStatusChange(test._id, "In Progress")}
                        >
                          Start
                        </button>
                      )}
                      {test.status === "In Progress" && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusChange(test._id, "Completed")}
                        >
                          Complete
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(test._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTests.length === 0 && (
            <div className="no-data">
              <p>No lab tests found</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingTest ? "Edit Lab Test" : "Add New Lab Test"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTest(null)
                    resetForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="test-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select
                      name="patient"
                      className="form-select"
                      value={testForm.patient}
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
                    <label className="form-label">Test Name *</label>
                    <input
                      type="text"
                      name="testName"
                      className="form-input"
                      value={testForm.testName}
                      onChange={handleInputChange}
                      placeholder="e.g., Complete Blood Count"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Test Type *</label>
                    <select
                      name="testType"
                      className="form-select"
                      value={testForm.testType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Test Type</option>
                      {testTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select name="status" className="form-select" value={testForm.status} onChange={handleInputChange}>
                      {testStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-input"
                    rows="3"
                    value={testForm.description}
                    onChange={handleInputChange}
                    placeholder="Test description or instructions..."
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Results</label>
                    <textarea
                      name="results"
                      className="form-input"
                      rows="3"
                      value={testForm.results}
                      onChange={handleInputChange}
                      placeholder="Test results..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Normal Range</label>
                    <textarea
                      name="normalRange"
                      className="form-input"
                      rows="3"
                      value={testForm.normalRange}
                      onChange={handleInputChange}
                      placeholder="Normal range values..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Report File</label>
                  <input
                    type="file"
                    name="reportFile"
                    className="form-input"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <small className="file-help">Accepted formats: PDF, Images, Word documents</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    className="form-input"
                    rows="2"
                    value={testForm.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTest(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingTest ? "Update Test" : "Add Test"}
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

export default LabTestManagement
