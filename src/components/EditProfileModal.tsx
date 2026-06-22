import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onClose: () => void
}

export default function EditProfileModal({ onClose }: Props) {
  const { user, profile, refreshProfile } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    await refreshProfile()
    setSuccess('Display name updated.')
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSaving(true)
    // Re-authenticate first, then update
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    })
    if (signInErr) {
      setSaving(false)
      setError('Current password is incorrect.')
      return
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (updateErr) { setError(updateErr.message); return }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSuccess('Password changed successfully.')
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-4 z-20">
      <div className="card w-full max-w-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold">Account settings</h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none">✕</button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        {/* Email (read-only) */}
        <div>
          <label className="label">Email</label>
          <p className="input bg-gray-50 text-muted cursor-default select-all">{user?.email}</p>
        </div>

        {/* Display name */}
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="label" htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your public name"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save display name'}
          </button>
        </form>

        <hr className="border-border" />

        {/* Change password */}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Change password</h3>
          <div>
            <label className="label" htmlFor="currentPw">Current password</label>
            <input
              id="currentPw"
              type="password"
              className="input"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="newPw">New password</label>
            <input
              id="newPw"
              type="password"
              className="input"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPw">Confirm new password</label>
            <input
              id="confirmPw"
              type="password"
              className="input"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  )
}
