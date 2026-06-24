import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Journal, JournalEntry, JournalMember } from '../types'
import EntryCard from '../components/EntryCard'
import EntryForm from '../components/EntryForm'
import ManagePanel from '../components/ManagePanel'

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [journal, setJournal] = useState<Journal | null>(null)
  const [members, setMembers] = useState<JournalMember[]>([])
  const [pendingRequests, setPendingRequests] = useState<JournalMember[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [myMembership, setMyMembership] = useState<JournalMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [joinSubmitting, setJoinSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    setError(null)

    const { data: journalData, error: journalError } = await supabase
      .from('journals')
      .select('*, owner:profiles(*)')
      .eq('id', id)
      .maybeSingle()

    if (journalError) {
      setError(journalError.message)
      setLoading(false)
      return
    }
    if (!journalData) {
      setError('Journal not found, or you do not have access to it.')
      setLoading(false)
      return
    }
    setJournal(journalData as Journal)

    const { data: myRow } = await supabase
      .from('journal_members')
      .select('*')
      .eq('journal_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    setMyMembership((myRow as JournalMember) ?? null)

    const isOwner = journalData.owner_id === user.id
    const isAccepted = isOwner || myRow?.status === 'accepted'

    if (isAccepted) {
      const [{ data: membersData }, { data: entriesData }] = await Promise.all([
        supabase
          .from('journal_members')
          .select('*, profile:profiles(*)')
          .eq('journal_id', id)
          .eq('status', 'accepted')
          .order('created_at'),
        supabase
          .from('journal_entries')
          .select('*, author:profiles(*)')
          .eq('journal_id', id)
          .order('created_at', { ascending: false }),
      ])
      setMembers((membersData as JournalMember[]) ?? [])
      setEntries((entriesData as JournalEntry[]) ?? [])

      if (isOwner) {
        const { data: pendingData } = await supabase
          .from('journal_members')
          .select('*, profile:profiles(*)')
          .eq('journal_id', id)
          .eq('status', 'pending')
          .order('created_at')
        setPendingRequests((pendingData as JournalMember[]) ?? [])
      } else {
        setPendingRequests([])
      }
    } else {
      setMembers([])
      setEntries([])
      setPendingRequests([])
    }

    setLoading(false)
  }, [id, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isOwner = journal?.owner_id === user?.id
  const isAccepted = isOwner || myMembership?.status === 'accepted'

  const allTags = useMemo(() => {
    const set = new Set<string>()
    entries.forEach((e) => e.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (!tagFilter) return entries
    return entries.filter((e) => e.tags.includes(tagFilter))
  }, [entries, tagFilter])

  // Map of user_id → ISO date string of their most recent entry (for the owner's manage panel).
  const lastPostedByUser = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of entries) {
      if (!map[e.author_id] || e.created_at > map[e.author_id]) {
        map[e.author_id] = e.created_at
      }
    }
    return map
  }, [entries])

  const handleRequestJoin = async () => {
    if (!user || !id) return
    setJoinSubmitting(true)
    // Always start as pending — the owner decides whether to accept or waitlist.
    const { error } = await supabase.from('journal_members').insert({
      journal_id: id,
      user_id: user.id,
      status: 'pending',
      role: 'member',
    })
    setJoinSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    await loadData()
  }

  const handleCreateEntry = async (data: { title: string; body: string; tags: string[] }) => {
    if (!user || !id) return
    const { error } = await supabase.from('journal_entries').insert({
      journal_id: id,
      author_id: user.id,
      ...data,
    })
    if (error) throw new Error(error.message)
    setShowNewEntry(false)
    await loadData()
  }

  const handleUpdateEntry = async (entryId: string, data: { title: string; body: string; tags: string[] }) => {
    const { error } = await supabase.from('journal_entries').update(data).eq('id', entryId)
    if (error) throw new Error(error.message)
    await loadData()
  }

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', entryId)
    if (error) {
      setError(error.message)
      return
    }
    await loadData()
  }

  const handleApprove = async (membershipId: string) => {
    const { error } = await supabase
      .from('journal_members')
      .update({ status: 'accepted' })
      .eq('id', membershipId)
    if (error) setError(error.message)
    await loadData()
  }

  const handleReject = async (membershipId: string) => {
    const { error } = await supabase.from('journal_members').delete().eq('id', membershipId)
    if (error) setError(error.message)
    await loadData()
  }

  const handleRemoveMember = async (member: JournalMember, deleteEntries: boolean) => {
    if (deleteEntries && id) {
      await supabase.from('journal_entries').delete().eq('journal_id', id).eq('author_id', member.user_id)
    }
    const { error } = await supabase.from('journal_members').delete().eq('id', member.id)
    if (error) setError(error.message)
    await loadData()
  }

  const handleDeleteJournal = async () => {
    if (!id) return
    const { error } = await supabase.from('journals').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/dashboard')
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading...</p>
  }

  if (!journal) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error ?? 'Journal not found.'}</p>
        <Link to="/dashboard" className="btn-secondary">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="text-sm text-muted hover:text-accent">← Back to dashboard</Link>

      <div>
        <h1 className="text-2xl font-serif font-semibold">{journal.title}</h1>
        {journal.description && <p className="text-muted mt-1">{journal.description}</p>}
        <p className="text-xs text-muted mt-2">
          Owned by {journal.owner?.display_name ?? journal.owner?.username}
          {!journal.is_open && ' · Invite-only'}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isAccepted ? (
        <div className="card p-6 max-w-md">
          {myMembership?.status === 'pending' ? (
            <p className="text-sm text-muted">
              Your request to join this journal is pending approval from the owner.
            </p>
          ) : journal.is_open ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                This journal is open for new contributors. Request to join to read entries and add your own.
              </p>
              <button className="btn-primary" onClick={handleRequestJoin} disabled={joinSubmitting}>
                {joinSubmitting ? 'Requesting...' : 'Request to join'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">
              This journal is invite-only. Ask the owner for access.
            </p>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-serif text-lg font-semibold">Entries</h2>
              <button className="btn-primary" onClick={() => setShowNewEntry((v) => !v)}>
                {showNewEntry ? 'Cancel' : '+ New entry'}
              </button>
            </div>

            {showNewEntry && (
              <div className="card p-5">
                <EntryForm submitLabel="Post entry" onSubmit={handleCreateEntry} onCancel={() => setShowNewEntry(false)} />
              </div>
            )}

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted mr-1">Filter by tag:</span>
                {tagFilter && (
                  <button className="chip bg-ink text-white" onClick={() => setTagFilter(null)}>
                    {tagFilter} ✕
                  </button>
                )}
                {allTags
                  .filter((t) => t !== tagFilter)
                  .map((t) => (
                    <button key={t} className="chip hover:bg-accent hover:text-white" onClick={() => setTagFilter(t)}>
                      {t}
                    </button>
                  ))}
              </div>
            )}

            {filteredEntries.length === 0 ? (
              <div className="card p-6 text-sm text-muted">
                No entries yet{tagFilter ? ' with this tag' : ''}. Be the first to write something.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    isAuthor={entry.author_id === user?.id}
                    isOwner={!!isOwner}
                    onUpdate={handleUpdateEntry}
                    onDelete={handleDeleteEntry}
                    onTagClick={(tag) => setTagFilter(tag)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="font-serif text-lg font-semibold mb-3">Contributors</h2>
              <ul className="space-y-1.5 text-sm">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    <span>{m.profile?.display_name ?? m.profile?.username}</span>
                    {m.role === 'owner' && <span className="chip">Owner</span>}
                  </li>
                ))}
              </ul>
            </div>

            {isOwner && (
              <ManagePanel
                pendingRequests={pendingRequests}
                members={members}
                currentUserId={user!.id}
                partnerSlotFull={members.filter((m) => m.role === 'member').length >= 1}
                lastPostedByUser={lastPostedByUser}
                onApprove={handleApprove}
                onReject={handleReject}
                onRemoveMember={handleRemoveMember}
                onDeleteJournal={handleDeleteJournal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
