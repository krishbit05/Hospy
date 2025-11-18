"use client"

import { useState, useEffect } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner"
import { handleError, handleSuccess } from "../../utils"
import { ToastContainer } from "react-toastify"
import "./BillingPayments.css"

const API_BASE = "https://hospyback.onrender.com";

const BillingPayments = () => {
  const [loading, setLoading] = useState(false)
  const [bills, setBills] = useState([])
  const [patients, setPatients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [billForm, setBillForm] = useState({
    patient: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
    discountAmount: 0,
    paymentMethod: "",
    insuranceDetails: {
      provider: "",
      policyNumber: "",
      claimAmount: 0,
    },
  })

  const paymentMethods = ["Cash", "Card", "UPI", "Insurance"]
  const GST_RATE = 0.18 // 18% GST

  useEffect(() => {
    fetchBills()
    fetchPatients()
  }, [])

  const fetchBills = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
const API_BASE = process.env.REACT_APP_API_BASE;
      const response = await fetch(`${API_BASE}/api/bills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBills(data)
      } else {
        handleError("Failed to fetch bills")
      }
    } catch (error) {
      console.error("Fetch bills error:", error)
      handleError("Error loading bills")
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
    setBillForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleInsuranceChange = (e) => {
    const { name, value } = e.target
    setBillForm((prev) => ({
      ...prev,
      insuranceDetails: {
        ...prev.insuranceDetails,
        [name]: value,
      },
    }))
  }

  const handleItemChange = (index, field, value) => {
    setBillForm((prev) => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }

      // Calculate total for this item
      if (field === "quantity" || field === "unitPrice") {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
      }

      return { ...prev, items: newItems }
    })
  }

  const addItem = () => {
    setBillForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unitPrice: 0, total: 0 }],
    }))
  }

  const removeItem = (index) => {
    setBillForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const calculateTotals = () => {
    const subtotal = billForm.items.reduce((sum, item) => sum + item.total, 0)
    const gstAmount = subtotal * GST_RATE
    const totalAmount = subtotal + gstAmount - billForm.discountAmount

    return { subtotal, gstAmount, totalAmount }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form data
      if (!billForm.patient) {
        throw new Error("Please select a patient")
      }

      if (!billForm.items || billForm.items.length === 0) {
        throw new Error("Please add at least one item")
      }

      // Validate items
      billForm.items.forEach((item, index) => {
        if (!item.description) {
          throw new Error(`Item ${index + 1}: Description is required`)
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Item ${index + 1}: Invalid quantity`)
        }
        if (!item.unitPrice || item.unitPrice < 0) {
          throw new Error(`Item ${index + 1}: Invalid unit price`)
        }
      })

      const { subtotal, gstAmount, totalAmount } = calculateTotals()

      const billData = {
        ...billForm,
        subtotal,
        gstAmount,
        totalAmount,
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const url = editingBill 
        ? `${API_BASE}/api/bills/${editingBill._id}` 
        : `${API_BASE}/api/bills`

      const response = await fetch(url, {
        method: editingBill ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(billData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Operation failed")
      }

      handleSuccess(editingBill ? "Bill updated successfully" : "Bill created successfully")
      setShowModal(false)
      setEditingBill(null)
      resetForm()
      fetchBills()
    } catch (error) {
      console.error("Submit error:", error)
      handleError(error.message || "Error saving bill. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatusChange = async (billId, newStatus) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/bills/${billId}/payment-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      })

      if (response.ok) {
        handleSuccess("Payment status updated successfully")
        fetchBills()
      } else {
        handleError("Failed to update payment status")
      }
    } catch (error) {
      console.error("Payment status update error:", error)
      handleError("Error updating payment status")
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async (billId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE}/api/bills/${billId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `bill-${billId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        handleSuccess("PDF generated successfully")
      } else {
        handleError("Failed to generate PDF")
      }
    } catch (error) {
      console.error("PDF generation error:", error)
      handleError("Error generating PDF")
    }
  }

  const handleEdit = (bill) => {
    setEditingBill(bill)
    setBillForm({
      patient: bill.patient._id,
      items: bill.items,
      discountAmount: bill.discountAmount,
      paymentMethod: bill.paymentMethod || "",
      insuranceDetails: bill.insuranceDetails || {
        provider: "",
        policyNumber: "",
        claimAmount: 0,
      },
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setBillForm({
      patient: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
      discountAmount: 0,
      paymentMethod: "",
      insuranceDetails: {
        provider: "",
        policyNumber: "",
        claimAmount: 0,
      },
    })
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "status-paid"
      case "Pending":
        return "status-pending"
      case "Partially Paid":
        return "status-partial"
      case "Cancelled":
        return "status-cancelled"
      default:
        return "status-pending"
    }
  }

  const filteredBills = bills.filter(
    (bill) =>
      bill.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billId?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const { subtotal, gstAmount, totalAmount } = calculateTotals()

  if (loading && !showModal) {
    return <LoadingSpinner message="Loading bills..." />
  }

  return (
    <div className="billing-payments-container">
      <Sidebar />
      <div className="billing-payments-content">
        <div className="page-header">
          <h1>💵 Billing & Payments</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingBill(null)
              resetForm()
              setShowModal(true)
            }}
          >
            Create New Bill
          </button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search bills by patient name or bill ID..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bills-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Patient</th>
                <th>Bill Date</th>
                <th>Subtotal</th>
                <th>GST (18%)</th>
                <th>Discount</th>
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill._id}>
                  <td>{bill.billId}</td>
                  <td>
                    <div className="patient-info">
                      <strong>{bill.patient?.name}</strong>
                      <br />
                      <small>{bill.patient?.patientId}</small>
                    </div>
                  </td>
                  <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                  <td>₹{bill.subtotal?.toLocaleString()}</td>
                  <td>₹{bill.gstAmount?.toLocaleString()}</td>
                  <td>₹{bill.discountAmount?.toLocaleString()}</td>
                  <td>
                    <strong>₹{bill.totalAmount?.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${getPaymentStatusColor(bill.paymentStatus)}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(bill)}>
                        Edit
                      </button>
                      <button className="btn btn-info btn-sm" onClick={() => generatePDF(bill._id)}>
                        PDF
                      </button>
                      {bill.paymentStatus === "Pending" && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePaymentStatusChange(bill._id, "Paid")}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBills.length === 0 && (
            <div className="no-data">
              <p>No bills found</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal bill-modal">
              <div className="modal-header">
                <h2>{editingBill ? "Edit Bill" : "Create New Bill"}</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false)
                    setEditingBill(null)
                    resetForm()
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="bill-form">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select
                    name="patient"
                    className="form-select"
                    value={billForm.patient}
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

                <div className="items-section">
                  <div className="section-header">
                    <h3>Bill Items</h3>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                      Add Item
                    </button>
                  </div>

                  {billForm.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-grid">
                        <div className="form-group">
                          <label className="form-label">Description *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            placeholder="e.g., Consultation Fee, Lab Test"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Quantity *</label>
                          <input
                            type="number"
                            className="form-input"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                            min="1"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Unit Price (₹) *</label>
                          <input
                            type="number"
                            className="form-input"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, "unitPrice", Number(e.target.value))}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Total (₹)</label>
                          <input type="number" className="form-input" value={item.total} readOnly />
                        </div>
                      </div>
                      {billForm.items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm remove-item-btn"
                          onClick={() => removeItem(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Discount Amount (₹)</label>
                    <input
                      type="number"
                      name="discountAmount"
                      className="form-input"
                      value={billForm.discountAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      name="paymentMethod"
                      className="form-select"
                      value={billForm.paymentMethod}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {billForm.paymentMethod === "Insurance" && (
                  <div className="insurance-section">
                    <h3>Insurance Details</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Insurance Provider</label>
                        <input
                          type="text"
                          name="provider"
                          className="form-input"
                          value={billForm.insuranceDetails.provider}
                          onChange={handleInsuranceChange}
                          placeholder="e.g., Star Health, HDFC ERGO"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Policy Number</label>
                        <input
                          type="text"
                          name="policyNumber"
                          className="form-input"
                          value={billForm.insuranceDetails.policyNumber}
                          onChange={handleInsuranceChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Claim Amount (₹)</label>
                        <input
                          type="number"
                          name="claimAmount"
                          className="form-input"
                          value={billForm.insuranceDetails.claimAmount}
                          onChange={handleInsuranceChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bill-summary">
                  <h3>Bill Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>GST (18%):</span>
                    <span>₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Discount:</span>
                    <span>-₹{billForm.discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false)
                      setEditingBill(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : editingBill ? "Update Bill" : "Create Bill"}
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

export default BillingPayments
