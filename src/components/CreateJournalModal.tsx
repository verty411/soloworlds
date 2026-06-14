import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface CreateJournalModalProps {
  onClose: () => void
  onCreated: () => void
}

export default function CreateJournalModal({ onClose, onCreated }: CreateJournalModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)

    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({ title, description, owner_id: user.id, is_open: isOpen })
      .select()
      .single()

    if (journalError || !journal) {
      setError(journalError?.message ?? 'Could not create journal')
      setSubmitting(false)
      return
    }

    const { error: memberError } = await supabase.from('journal_members').insert({
      journal_id: journal.id,
      user_id: user.id,
      status: 'accepted',
      role: 'owner',
    })

    setSubmitting(false)

    if (memberError) {
      setError(memberError.message)
      return
    }

    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-4 z-20">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-xl font-serif font-semibold mb-4">New journal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Lighthouse"
            />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="input min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this world about? What kind of contributors are you looking for?"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
            />
            <span>
              <span className="font-medium">Open for join requests</span>
              <br />
              <span className="text-muted">
                List this journal in the directory so other users can discover it and request to join.
                You'll need to approve each request.
              </span>
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create journal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
