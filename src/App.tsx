import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import JournalDetail from './pages/JournalDetail'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()
  if (loading) return <CenteredLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function CenteredLoader() {
  return (
    <div className="flex items-center justify-center py-24 text-muted text-sm">
      Loading...
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <Routes>
          <Route
            path="/"
            element={loading ? <CenteredLoader /> : user ? <Navigate to="/dashboard" replace /> : <Landing />}
          />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal/:id"
            element={
              <ProtectedRoute>
                <JournalDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        Shared Worlds — a collaborative journaling prototype
      </footer>
    </div>
  )
}
