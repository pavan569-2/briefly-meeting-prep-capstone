import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { useAuth } from './auth/useAuth'
import { LoadingScreen } from './components/LoadingScreen'
import LoginPage from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

/**
 * Catch-all handler for unknown routes.
 * Redirects to /dashboard when authenticated, /login otherwise.
 * Shows a loading screen while session restoration is pending.
 */
function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Unknown routes redirect based on authentication state */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
