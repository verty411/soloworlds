import { useState } from 'react'
import type { JournalEntry } from '../types'
import EntryForm from './EntryForm'
import BodyRenderer from './BodyRenderer'

interface EntryCardProps {
  entry: JournalEntry
  isAuthor: boolean
  isOwner: boolean
  onUpdate: (id: string, data: { title: string; body: string; tags: string[] }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onTagClick: (tag: string) => void
}

export default function EntryCard({ entry, isAuthor, isOwner, onUpdate, onDelete, onTagClick }: EntryCardProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmMsg = isAuthor
      ? 'Delete this entry? This cannot be undone.'
      : 'Remove this entry as journal owner? This cannot be undone.'
    if (!window.confirm(confirmMsg)) return
    setDeleting(true)
    await onDelete(entry.id)
    setDeleting(false)
  }

  const authorName = entry.author?.display_name ?? entry.author?.username ?? 'Unknown'
  const timestamp = new Date(entry.created_at).toLocaleString()
  const edited = entry.updated_at && entry.updated_at !== entry.created_at

  if (editing) {
    return (
      <div className="card p-5">
        <EntryForm
          initialTitle={entry.title}
          initialBody={entry.body}
          initialTags={entry.tags}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (data) => {
            await onUpdate(entry.id, data)
            setEditing(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-serif text-lg font-semibold text-ink">{entry.title}</h3>
        <div className="flex gap-1.5 shrink-0">
          {isAuthor && (
            <button className="btn-ghost text-xs px-2 py-1" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          {(isAuthor || isOwner) && (
            <button
              className="btn-ghost text-xs px-2 py-1 text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
            >
              {isAuthor ? 'Delete' : 'Remove'}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted mb-3">
        {authorName} · {timestamp}
        {edited ? ' · edited' : ''}
      </p>
      <BodyRenderer body={entry.body} />
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {entry.tags.map((tag) => (
            <button key={tag} className="chip hover:bg-accent hover:text-white" onClick={() => onTagClick(tag)}>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
