import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const { error } = await signUp(email, password, username, displayName || username)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    // If email confirmation is disabled in Supabase, the user is signed in immediately.
    // If it's enabled, they'll need to confirm via email first.
    setInfo('Account created. If email confirmation is enabled for your Supabase project, check your inbox before logging in.')
    setTimeout(() => navigate('/login'), 1500)
  }

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-2xl font-serif font-semibold mb-6 text-center">Create an account</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            required
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="displayName">Display name (optional)</label>
          <input
            id="displayName"
            type="text"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={username || 'Shown to other contributors'}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-accent">{info}</p>}
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-muted text-center mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-accent font-medium">
          Log in
        </Link>
      </p>
    </div>
  )
}
