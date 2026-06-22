import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onClose: () => void
}

export default function EditProfileModal({ onClose }: Props) {
  const { user, profile, refreshProfile } = useAuth()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setUsername(profile?.username ?? '')
    setDisplayName(profile?.display_name ?? '')
  }, [profile])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    const { error: err } = await supabase
      .from('profiles')
      .update({ username, display_name: displayName || username })
      .eq('id', user.id)

    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    await refreshProfile()
    setSuccess(true)
    setTimeout(onClose, 800)
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-4 z-20">
      <div className="card w-full max-w-sm p-6">
        <h2 className="text-xl font-serif font-semibold mb-4">Edit profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              title="Letters, numbers, and underscores only"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={username || 'Shown to other contributors'}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Saved!</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
