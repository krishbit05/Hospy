import { Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login/Login"
import Signup from "./pages/Signup/Signup"
import Dashboard from "./pages/Dashboard/Dashboard"
import PatientManagement from "./pages/PatientManagement/PatientManagement"
import DoctorManagement from "./pages/DoctorManagement/DoctorManagement"
import AppointmentScheduling from "./pages/AppointmentScheduling/AppointmentScheduling"
import BillingPayments from "./pages/BillingPayments/BillingPayments"
import LabTestManagement from "./pages/LabTestManagement/LabTestManagement"
import WardManagement from "./pages/WardManagement/WardManagement"
import PharmacyModule from "./pages/PharmacyModule/PharmacyModule"
import MedicalHistory from "./pages/MedicalHistory/MedicalHistory"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"
import "./App.css"

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <PatientManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <DoctorManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentScheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab-tests"
          element={
            <ProtectedRoute>
              <LabTestManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wards"
          element={
            <ProtectedRoute>
              <WardManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute>
              <PharmacyModule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-history"
          element={
            <ProtectedRoute>
              <MedicalHistory />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
