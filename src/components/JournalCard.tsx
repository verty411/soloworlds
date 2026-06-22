import { Link } from 'react-router-dom'
import type { Journal } from '../types'

interface JournalCardProps {
  journal: Journal
  variant: 'mine' | 'directory'
  onRequestJoin?: (journalId: string) => void
  joinSubmitting?: boolean
}

export default function JournalCard({ journal, variant, onRequestJoin, joinSubmitting }: JournalCardProps) {
  const ownerName = journal.owner?.display_name ?? journal.owner?.username ?? 'Unknown'

  return (
    <div className="card flex flex-col overflow-hidden">
      {journal.banner_url && (
        <img
          src={journal.banner_url}
          alt=""
          className="w-full h-36 object-cover"
        />
      )}
      <div className="p-5 flex flex-col gap-3 flex-1">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold text-ink">{journal.title}</h3>
          {variant === 'mine' && journal.my_status === 'owner' && (
            <span className="chip">Owner</span>
          )}
          {variant === 'mine' && journal.my_status === 'accepted' && (
            <span className="chip">Contributor</span>
          )}
        </div>
        {journal.description && (
          <p className="text-sm text-muted mt-1 line-clamp-3">{journal.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span>By {ownerName}</span>
        <span>·</span>
        <span>{journal.member_count ?? 0} contributor{(journal.member_count ?? 0) === 1 ? '' : 's'}</span>
        <span>·</span>
        <span>{journal.entry_count ?? 0} entr{(journal.entry_count ?? 0) === 1 ? 'y' : 'ies'}</span>
      </div>

      <div className="mt-auto pt-2">
        {variant === 'mine' ? (
          <Link to={`/journal/${journal.id}`} className="btn-secondary w-full">
            Open journal
          </Link>
        ) : journal.my_status === 'pending' ? (
          <button className="btn-secondary w-full" disabled>
            Request pending
          </button>
        ) : (
          <button
            className="btn-primary w-full"
            disabled={joinSubmitting}
            onClick={() => onRequestJoin?.(journal.id)}
          >
            {joinSubmitting ? 'Requesting...' : 'Request to join'}
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
