import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'
import { LoadingScreen } from '../components/LoadingScreen'

type AuthView = 'login' | 'signup'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<AuthView>('login')

  // Redirect authenticated users to the dashboard.
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  // Show loading screen while session restoration is in progress.
  if (loading) return <LoadingScreen />

  // Render a loading screen while the effect-triggered navigation is pending.
  if (user) return <LoadingScreen />

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Briefly</h1>
          <p className="text-gray-500 text-sm mt-1">AI Meeting Prep Assistant</p>
        </div>

        {/* Auth card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            {view === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h2>

          {view === 'login' ? (
            <LoginForm onSwitchToSignup={() => setView('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setView('login')} />
          )}
        </div>
      </div>
    </main>
  )
}
