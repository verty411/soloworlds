import { FormEvent, useRef, useState } from 'react'

interface EntryFormProps {
  initialTitle?: string
  initialBody?: string
  initialTags?: string[]
  submitLabel: string
  onSubmit: (data: { title: string; body: string; tags: string[] }) => Promise<void>
  onCancel?: () => void
}

// Wraps selected text (or inserts a placeholder) with before/after markers.
function wrapInline(
  ta: HTMLTextAreaElement,
  setter: (v: string) => void,
  before: string,
  after: string,
  placeholder: string
) {
  const { selectionStart: s, selectionEnd: e, value } = ta
  const sel = value.slice(s, e) || placeholder
  const next = value.slice(0, s) + before + sel + after + value.slice(e)
  setter(next)
  requestAnimationFrame(() => {
    ta.focus()
    ta.selectionStart = s + before.length
    ta.selectionEnd = s + before.length + sel.length
  })
}

// Prefixes every selected line (or a blank line) with a given string.
function prefixLines(
  ta: HTMLTextAreaElement,
  setter: (v: string) => void,
  prefix: string,
  placeholder: string
) {
  const { selectionStart: s, selectionEnd: e, value } = ta
  const sel = value.slice(s, e) || placeholder
  const prefixed = sel.split('\n').map(l => prefix + l).join('\n')
  const next = value.slice(0, s) + prefixed + value.slice(e)
  setter(next)
  requestAnimationFrame(() => {
    ta.focus()
    ta.selectionStart = s
    ta.selectionEnd = s + prefixed.length
  })
}

function insertDice(ta: HTMLTextAreaElement, setter: (v: string) => void) {
  const { selectionStart: s, value } = ta
  const block = ':::dice\n\n:::'
  const next = value.slice(0, s) + block + value.slice(s)
  setter(next)
  requestAnimationFrame(() => {
    ta.focus()
    // place cursor on the blank line inside the block
    ta.selectionStart = s + ':::dice\n'.length
    ta.selectionEnd = s + ':::dice\n'.length
  })
}

interface ToolbarButtonProps {
  label: string
  title: string
  mono?: boolean
  onClick: () => void
}

function ToolBtn({ label, title, mono, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-0.5 text-sm rounded hover:bg-gray-200 text-ink border border-transparent hover:border-border transition-colors ${mono ? 'font-mono' : ''}`}
    >
      {label}
    </button>
  )
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
  const taRef = useRef<HTMLTextAreaElement>(null)

  const ta = () => taRef.current!

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
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
          onChange={e => setTitle(e.target.value)}
          placeholder="Entry title"
        />
      </div>
      <div>
        <label className="label" htmlFor="entry-body">Entry</label>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border border-b-0 border-border rounded-t-md bg-gray-50">
          <ToolBtn label="B" title="Bold" onClick={() => wrapInline(ta(), setBody, '**', '**', 'bold text')} />
          <ToolBtn label="I" title="Italic" onClick={() => wrapInline(ta(), setBody, '*', '*', 'italic text')} />
          <ToolBtn label="S" title="Strikethrough" onClick={() => wrapInline(ta(), setBody, '~~', '~~', 'strikethrough')} />
          <span className="w-px h-4 bg-border mx-1" />
          <ToolBtn label="• —" title="Bullet list" onClick={() => prefixLines(ta(), setBody, '- ', 'list item')} />
          <ToolBtn label="1." title="Numbered list" onClick={() => prefixLines(ta(), setBody, '1. ', 'list item')} />
          <ToolBtn label="❝" title="Blockquote" onClick={() => prefixLines(ta(), setBody, '> ', 'quoted text')} />
          <ToolBtn label="`" title="Inline code" mono onClick={() => wrapInline(ta(), setBody, '`', '`', 'code')} />
          <span className="w-px h-4 bg-border mx-1" />
          <ToolBtn label="🎲 Roll the dice…" title="Insert dice/oracle block" onClick={() => insertDice(ta(), setBody)} />
        </div>

        <textarea
          ref={taRef}
          id="entry-body"
          className="input min-h-[160px] rounded-t-none border-t-0 font-mono text-sm"
          required
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your part of the story..."
        />
      </div>
      <div>
        <label className="label" htmlFor="entry-tags">Tags</label>
        <input
          id="entry-tags"
          className="input"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          placeholder="comma, separated, tags"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
