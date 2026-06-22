import { FormEvent, useRef, useState } from 'react'
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
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Banner must be under 2 MB')
      return
    }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!bannerFile) {
      setError('Please upload a banner image.')
      return
    }
    setSubmitting(true)
    setError(null)

    let banner_url: string | null = null

    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('journal-banners')
        .upload(path, bannerFile, { upsert: true })
      if (uploadError) {
        setError(`Banner upload failed: ${uploadError.message}`)
        setSubmitting(false)
        return
      }
      const { data: urlData } = supabase.storage.from('journal-banners').getPublicUrl(path)
      banner_url = urlData.publicUrl
    }

    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({ title, description, owner_id: user.id, is_open: isOpen, banner_url })
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

          <div>
            <label className="label">Banner image <span className="text-muted font-normal">(max 2 MB — recommended 1200×400px)</span></label>
            {bannerPreview ? (
              <div className="relative">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => { setBannerFile(null); setBannerPreview(null) }}
                  className="absolute top-2 right-2 bg-ink/60 text-paper text-xs px-2 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border rounded-lg text-sm text-muted hover:border-accent transition-colors"
              >
                Click to upload banner
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
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
