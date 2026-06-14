import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Check {
  label: string
  status: 'pending' | 'ok' | 'error'
  detail: string
}

export default function DebugBanner() {
  const [checks, setChecks] = useState<Check[]>([
    { label: 'VITE_SUPABASE_URL', status: 'pending', detail: '' },
    { label: 'VITE_SUPABASE_ANON_KEY', status: 'pending', detail: '' },
    { label: 'Supabase reachable', status: 'pending', detail: '' },
    { label: 'Auth session', status: 'pending', detail: '' },
  ])

  const set = (index: number, status: Check['status'], detail: string) =>
    setChecks(prev => prev.map((c, i) => (i === index ? { ...c, status, detail } : c)))

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY

    set(0, url ? 'ok' : 'error', url ? url : 'missing')
    set(1, key ? 'ok' : 'error', key ? `${key.slice(0, 12)}…` : 'missing')

    if (!url || !key) {
      set(2, 'error', 'skipped — env vars missing')
      set(3, 'error', 'skipped — env vars missing')
      return
    }

    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) set(2, 'error', error.message)
        else set(2, 'ok', 'connected')
      })

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) set(3, 'error', error.message)
      else if (data.session) set(3, 'ok', `signed in as ${data.session.user.email}`)
      else set(3, 'ok', 'no active session (unauthenticated)')
    })
  }, [])

  const color = (s: Check['status']) =>
    s === 'ok' ? '#16a34a' : s === 'error' ? '#dc2626' : '#d97706'

  return (
    <div style={{
      background: '#1e1e1e',
      color: '#e5e7eb',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '8px 16px',
      borderBottom: '1px solid #374151',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
    }}>
      <span style={{ color: '#9ca3af', fontWeight: 600 }}>DEBUG</span>
      {checks.map(c => (
        <span key={c.label}>
          <span style={{ color: color(c.status) }}>
            {c.status === 'pending' ? '⏳' : c.status === 'ok' ? '✓' : '✗'}
          </span>{' '}
          <span style={{ color: '#d1d5db' }}>{c.label}:</span>{' '}
          <span style={{ color: '#9ca3af' }}>{c.detail || '…'}</span>
        </span>
      ))}
    </div>
  )
}
