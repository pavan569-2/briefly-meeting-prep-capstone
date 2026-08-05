import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'

/** Map raw Supabase auth errors to friendly UI messages. Never shows SDK internals. */
function mapSignInError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('invalid login credentials')) return 'Incorrect email or password.'
    if (msg.includes('email not confirmed'))
      return 'Please confirm your email address before signing in.'
    if (msg.includes('too many requests')) return 'Too many attempts. Please wait and try again.'
  }
  return 'Sign in failed. Please try again.'
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginFormProps {
  onSwitchToSignup: () => void
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validate = (): string | null => {
    if (!email.trim()) return 'Email is required.'
    if (!EMAIL_REGEX.test(email)) return 'Enter a valid email address.'
    if (!password) return 'Password is required.'
    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      // On success, onAuthStateChange updates the user state.
      // LoginPage's useEffect detects the authenticated user and navigates to /dashboard.
    } catch (err) {
      setError(mapSignInError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={submitting}
          className="block w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-60"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={submitting}
          className="block w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-60"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-red-400 text-sm bg-red-950/40 border border-red-900/60 rounded-lg px-4 py-3"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm"
      >
        {submitting ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          Create account
        </button>
      </p>
    </form>
  )
}
