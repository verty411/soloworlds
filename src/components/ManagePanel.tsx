import { useState } from 'react'
import type { JournalMember } from '../types'

interface ManagePanelProps {
  pendingRequests: JournalMember[]
  waitlistedRequests: JournalMember[]
  members: JournalMember[]
  currentUserId: string
  partnerSlotFull: boolean
  lastPostedByUser: Record<string, string>
  onApprove: (membershipId: string) => Promise<void>
  onReject: (membershipId: string) => Promise<void>
  onRemoveMember: (member: JournalMember, deleteEntries: boolean) => Promise<void>
  onSwapIn: (waitlistedMemberId: string, currentPartnerId: string, deleteEntries: boolean) => Promise<void>
  onDeleteJournal: () => Promise<void>
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function ManagePanel({
  pendingRequests,
  waitlistedRequests,
  members,
  currentUserId,
  partnerSlotFull,
  lastPostedByUser,
  onApprove,
  onReject,
  onRemoveMember,
  onSwapIn,
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

  const runSwapIn = async (waitlisted: JournalMember) => {
    const currentPartner = members.find((m) => m.role === 'member' && m.user_id !== currentUserId)
    if (!currentPartner) return
    const waitlistedName = waitlisted.profile?.display_name ?? waitlisted.profile?.username ?? 'this user'
    const partnerName = currentPartner.profile?.display_name ?? currentPartner.profile?.username ?? 'the current partner'
    const deleteEntries = window.confirm(
      `Swap in ${waitlistedName} to replace ${partnerName}?\n\nClick OK to also delete all of ${partnerName}'s entries.\nClick Cancel to swap them out but keep their entries.`
    )
    // User closed the dialog entirely (Escape) — treat as cancel of the whole action.
    // window.confirm only returns true/false so we can't distinguish; we'll treat
    // false as "keep entries but proceed". Add a second confirm to cancel entirely.
    const proceed = window.confirm(
      deleteEntries
        ? `Confirm: remove ${partnerName} and DELETE their entries, then add ${waitlistedName} as partner.`
        : `Confirm: remove ${partnerName} (entries kept), then add ${waitlistedName} as partner.`
    )
    if (!proceed) return
    setBusyId(waitlisted.id)
    await onSwapIn(waitlisted.id, currentPartner.id, deleteEntries)
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
        <h3 className="text-sm font-semibold text-ink mb-1">
          Join requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
        </h3>
        {partnerSlotFull && (
          <p className="text-xs text-muted mb-2">Partner slot is taken — accepting will add them to the waitlist.</p>
        )}
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
                    {partnerSlotFull ? 'Waitlist' : 'Make partner'}
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

      {waitlistedRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-1">
            Waitlist ({waitlistedRequests.length})
          </h3>
          <p className="text-xs text-muted mb-2">
            Journal is full. Swap in a waitlisted person to replace the current partner (their entries stay).
          </p>
          <ul className="space-y-2">
            {waitlistedRequests.map((req) => (
              <li key={req.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{req.profile?.display_name ?? req.profile?.username}</span>
                <div className="flex gap-1.5">
                  <button
                    className="btn-primary text-xs px-2 py-1"
                    disabled={busyId === req.id}
                    onClick={() => runSwapIn(req)}
                  >
                    Swap in
                  </button>
                  <button
                    className="btn-secondary text-xs px-2 py-1"
                    disabled={busyId === req.id}
                    onClick={() => runReject(req.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Contributors</h3>
        <ul className="space-y-2">
          {members.map((m) => {
            const lastPosted = lastPostedByUser[m.user_id]
            return (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex flex-col">
                  <span>
                    {m.profile?.display_name ?? m.profile?.username}
                    {m.role === 'owner' && <span className="chip ml-2">Owner</span>}
                  </span>
                  {m.role !== 'owner' && (
                    <span className="text-xs text-muted">
                      {lastPosted ? `Last posted ${relativeDate(lastPosted)}` : 'No entries yet'}
                    </span>
                  )}
                </span>
                {m.user_id !== currentUserId && (
                  <button
                    className="btn-danger text-xs px-2 py-1 shrink-0"
                    disabled={busyId === m.id}
                    onClick={() => runRemove(m)}
                  >
                    Remove
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {removableMembers.length === 0 && (
          <p className="text-sm text-muted mt-1">No other contributors yet.</p>
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
