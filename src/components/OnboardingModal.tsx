import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Shown once to users who arrived without choosing a public handle — i.e. OAuth
// (Google) sign-ins. Collects a display name + username before they can continue.
export default function OnboardingModal() {
  const { user, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)

    const cleanUsername = username.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters (letters, numbers, underscores).')
      return
    }

    setSubmitting(true)
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), username: cleanUsername, onboarded: true })
      .eq('id', user.id)
    setSubmitting(false)

    if (updateErr) {
      // 23505 = unique violation on the username column.
      if (updateErr.code === '23505') {
        setError('That username is already taken. Try another.')
      } else {
        setError(updateErr.message)
      }
      return
    }

    await refreshProfile()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-sm p-6">
        <h2 className="text-xl font-serif font-semibold mb-1">Welcome to Shared Worlds</h2>
        <p className="text-sm text-muted mb-5">
          Choose how you'll appear to other contributors before you get started.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="onboard-display">Display name</label>
            <input
              id="onboard-display"
              className="input"
              required
              placeholder="Shown to other contributors"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="onboard-username">Username</label>
            <input
              id="onboard-username"
              className="input"
              required
              placeholder="lowercase_handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-xs text-muted mt-1">Letters, numbers and underscores only.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
