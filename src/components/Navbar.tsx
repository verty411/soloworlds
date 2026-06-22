import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import EditProfileModal from './EditProfileModal'
import { useTheme } from '../hooks/useTheme'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const { theme, toggle } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <header className="border-b border-border bg-paper/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={user ? '/dashboard' : '/'} className="font-serif text-xl font-semibold text-ink">
            Shared Worlds
          </Link>
          <nav className="flex items-center gap-3">
              <button
                onClick={toggle}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="btn-ghost px-2 py-1 text-base"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-ink hover:text-accent">
                  Dashboard
                </Link>
                <button
                  onClick={() => setShowEdit(true)}
                  className="text-sm text-muted hover:text-accent hidden sm:inline"
                >
                  {profile?.display_name ?? profile?.username ?? 'Edit profile'}
                </button>
                <button onClick={handleSignOut} className="btn-secondary">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </>
  )
}
