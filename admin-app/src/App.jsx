import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './api/client'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SessionAudit from './pages/SessionAudit'
import Appointments from './pages/Appointments'
import Providers from './pages/Providers'
import Patients from './pages/Patients'
import Financials from './pages/Financials'
import Promotions from './pages/Promotions'
import Regions from './pages/Regions'

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="audit" element={<SessionAudit />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="providers" element={<Providers />} />
          <Route path="patients" element={<Patients />} />
          <Route path="financials" element={<Financials />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="regions" element={<Regions />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
