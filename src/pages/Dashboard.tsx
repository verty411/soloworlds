import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Journal } from '../types'
import JournalCard from '../components/JournalCard'
import CreateJournalModal from '../components/CreateJournalModal'

export default function Dashboard() {
  const { user } = useAuth()
  const [myJournals, setMyJournals] = useState<Journal[]>([])
  const [openJournals, setOpenJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const withCounts = async (journals: Journal[]): Promise<Journal[]> => {
    if (!journals.length) return journals
    const ids = journals.map(j => j.id)

    // Counts come from a SECURITY DEFINER RPC so they're accurate even for
    // journals the user hasn't joined (RLS would otherwise hide the rows).
    const { data: stats, error: statsErr } = await supabase.rpc('journal_stats', { ids })
    if (statsErr) setError(`Count error: ${statsErr.message}`)

    const memberCounts: Record<string, number> = {}
    const entryCounts: Record<string, number> = {}
    for (const s of stats ?? []) {
      memberCounts[s.journal_id] = Number(s.contributor_count)
      entryCounts[s.journal_id] = Number(s.entry_count)
    }

    return journals.map(j => ({
      ...j,
      member_count: memberCounts[j.id] ?? 0,
      entry_count: entryCounts[j.id] ?? 0,
    }))
  }

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    // 1. Journals I own or am an accepted member of.
    const { data: memberships, error: memErr } = await supabase
      .from('journal_members')
      .select('role, journal:journals(*, owner:profiles(id, username, display_name, created_at))')
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    if (memErr) {
      setError(memErr.message)
      setLoading(false)
      return
    }

    const mine: Journal[] = (memberships ?? [])
      .filter((m: any) => m.journal)
      .map((m: any) => ({
        ...(m.journal as Journal),
        my_status: m.role === 'owner' ? 'owner' : 'accepted',
      }))

    const myIds = new Set(mine.map((j) => j.id))

    // 2. Open journals I'm not already part of.
    const { data: open, error: openErr } = await supabase
      .from('journals')
      .select('*, owner:profiles(id, username, display_name, created_at)')
      .eq('is_open', true)

    if (openErr) {
      setError(openErr.message)
      setLoading(false)
      return
    }

    const { data: pending } = await supabase
      .from('journal_members')
      .select('journal_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')

    const pendingIds = new Set((pending ?? []).map((p) => p.journal_id))

    const directory: Journal[] = (open ?? [])
      .filter((j: Journal) => !myIds.has(j.id))
      .map((j: Journal) => ({
        ...j,
        my_status: pendingIds.has(j.id) ? 'pending' : null,
      }))

    const [mineWithCounts, directoryWithCounts] = await Promise.all([
      withCounts(mine),
      withCounts(directory),
    ])

    // Sort: owned first, then most recently created.
    mineWithCounts.sort((a, b) => {
      if (a.my_status !== b.my_status) return a.my_status === 'owner' ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setMyJournals(mineWithCounts)
    setOpenJournals(directoryWithCounts)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRequestJoin = async (journalId: string) => {
    if (!user) return
    setJoiningId(journalId)

    // Check whether the journal already has an accepted non-owner member.
    const { count } = await supabase
      .from('journal_members')
      .select('id', { count: 'exact', head: true })
      .eq('journal_id', journalId)
      .eq('status', 'accepted')
      .eq('role', 'member')

    const isFull = (count ?? 0) >= 1
    const { error } = await supabase.from('journal_members').insert({
      journal_id: journalId,
      user_id: user.id,
      status: isFull ? 'waitlisted' : 'pending',
      role: 'member',
    })
    setJoiningId(null)
    if (error) {
      setError(error.message)
      return
    }
    // Either way, the user is now in some queued state — mark pending locally
    // so the button disables and shows the right label.
    setOpenJournals((prev) =>
      prev.map((j) => (j.id === journalId ? { ...j, my_status: 'pending' } : j))
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-semibold">Your dashboard</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + New journal
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="text-lg font-serif font-semibold mb-3">My journals</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : myJournals.length === 0 ? (
          <div className="card p-6 text-sm text-muted">
            You haven't created or joined any journals yet. Create one, or request to join an
            open game below.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myJournals.map((j) => (
              <JournalCard key={j.id} journal={j} variant="mine" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-serif font-semibold mb-3">Directory of open games</h2>
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : openJournals.length === 0 ? (
          <div className="card p-6 text-sm text-muted">
            No open journals to join right now. Check back later, or create your own.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openJournals.map((j) => (
              <JournalCard
                key={j.id}
                journal={j}
                variant="directory"
                onRequestJoin={handleRequestJoin}
                joinSubmitting={joiningId === j.id}
              />
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <CreateJournalModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
