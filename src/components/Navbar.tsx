import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-border bg-paper/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="font-serif text-xl font-semibold text-ink">
          Shared Worlds
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-ink hover:text-accent">
                Dashboard
              </Link>
              <span className="text-sm text-muted hidden sm:inline">
                {profile?.display_name ?? profile?.username}
              </span>
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
  )
}
