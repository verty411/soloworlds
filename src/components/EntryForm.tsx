import { FormEvent, useState } from 'react'

interface EntryFormProps {
  initialTitle?: string
  initialBody?: string
  initialTags?: string[]
  submitLabel: string
  onSubmit: (data: { title: string; body: string; tags: string[] }) => Promise<void>
  onCancel?: () => void
}

export default function EntryForm({
  initialTitle = '',
  initialBody = '',
  initialTags = [],
  submitLabel,
  onSubmit,
  onCancel,
}: EntryFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [tagsInput, setTagsInput] = useState(initialTags.join(', '))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      await onSubmit({ title, body, tags })
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="entry-title">Title</label>
        <input
          id="entry-title"
          className="input"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title"
        />
      </div>
      <div>
        <label className="label" htmlFor="entry-body">Entry</label>
        <textarea
          id="entry-body"
          className="input min-h-[140px]"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your part of the story..."
        />
      </div>
      <div>
        <label className="label" htmlFor="entry-tags">Tags</label>
        <input
          id="entry-tags"
          className="input"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="comma, separated, tags"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
