import { useState } from 'react'
import type { JournalMember } from '../types'

interface ManagePanelProps {
  pendingRequests: JournalMember[]
  members: JournalMember[]
  currentUserId: string
  onApprove: (membershipId: string) => Promise<void>
  onReject: (membershipId: string) => Promise<void>
  onRemoveMember: (member: JournalMember, deleteEntries: boolean) => Promise<void>
  onDeleteJournal: () => Promise<void>
}

export default function ManagePanel({
  pendingRequests,
  members,
  currentUserId,
  onApprove,
  onReject,
  onRemoveMember,
  onDeleteJournal,
}: ManagePanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null)

  const runApprove = async (id: string) => {
    setBusyId(id)
    await onApprove(id)
    setBusyId(null)
  }

  const runReject = async (id: string) => {
    setBusyId(id)
    await onReject(id)
    setBusyId(null)
  }

  const runRemove = async (member: JournalMember) => {
    const name = member.profile?.display_name ?? member.profile?.username ?? 'this user'
    const deleteEntries = window.confirm(
      `Remove ${name} from this journal?\n\nClick OK to also delete all of their entries, or Cancel to remove them but keep their existing entries.`
    )
    setBusyId(member.id)
    await onRemoveMember(member, deleteEntries)
    setBusyId(null)
  }

  const handleDeleteJournal = async () => {
    if (!window.confirm('Delete this journal permanently? All entries and memberships will be removed. This cannot be undone.')) {
      return
    }
    await onDeleteJournal()
  }

  const removableMembers = members.filter((m) => m.user_id !== currentUserId)

  return (
    <div className="card p-5 space-y-6">
      <h2 className="font-serif text-lg font-semibold">Manage journal</h2>

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">
          Pending requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
        </h3>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted">No pending join requests.</p>
        ) : (
          <ul className="space-y-2">
            {pendingRequests.map((req) => (
              <li key={req.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{req.profile?.display_name ?? req.profile?.username}</span>
                <div className="flex gap-1.5">
                  <button
                    className="btn-primary text-xs px-2 py-1"
                    disabled={busyId === req.id}
                    onClick={() => runApprove(req.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-secondary text-xs px-2 py-1"
                    disabled={busyId === req.id}
                    onClick={() => runReject(req.id)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Members</h3>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {m.profile?.display_name ?? m.profile?.username}
                {m.role === 'owner' && <span className="chip ml-2">Owner</span>}
              </span>
              {m.user_id !== currentUserId && (
                <button
                  className="btn-danger text-xs px-2 py-1"
                  disabled={busyId === m.id}
                  onClick={() => runRemove(m)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {removableMembers.length === 0 && (
          <p className="text-sm text-muted mt-1">No other members yet.</p>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <button className="btn-danger w-full" onClick={handleDeleteJournal}>
          Delete journal
        </button>
      </div>
    </div>
  )
}
