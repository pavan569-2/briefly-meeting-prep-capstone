import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { LoadingScreen } from '../components/LoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Renders children only when authenticated.
 * - While session restoration is pending → loading screen.
 * - Unauthenticated → redirects to /login.
 * - Authenticated → renders children.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
