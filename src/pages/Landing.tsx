import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface OpenJournal {
  id: string
  title: string
  description: string | null
  created_at: string
  owner: { username: string; display_name: string } | null
}

export default function Landing() {
  const [journals, setJournals] = useState<OpenJournal[]>([])

  useEffect(() => {
    supabase
      .from('journals')
      .select('id, title, description, created_at, owner:profiles(username, display_name)')
      .eq('is_open', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setJournals((data as any) ?? []))
  }, [])

  return (
    <div className="max-w-3xl mx-auto py-12 sm:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-serif font-semibold text-ink mb-4">
          Shared Worlds
        </h1>
        <p className="text-lg text-muted mb-8 leading-relaxed">
          A collaborative journaling platform for building shared stories and worlds.
          Create a journal, invite collaborators, and write your part of an evolving narrative —
          each contributor owns their own entries, journal owners keep the world in order.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/signup" className="btn-primary px-6 py-3">
            Get started
          </Link>
          <Link to="/login" className="btn-secondary px-6 py-3">
            Log in
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-left mb-12">
        <Feature
          title="Create a journal"
          description="Start a new shared world. Decide whether it's open for others to discover and join."
        />
        <Feature
          title="Browse open games"
          description="Find journals other people have opened up, and request to join their story."
        />
        <Feature
          title="Write your part"
          description="Add entries with tags. You can always edit or delete your own — no one else's."
        />
      </div>

      {journals.length > 0 && (
        <section>
          <h2 className="text-2xl font-serif font-semibold text-ink mb-4">Open games</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {journals.map((j) => (
              <div key={j.id} className="card p-5 text-left">
                <h3 className="text-base font-semibold text-ink mb-1">{j.title}</h3>
                {j.description && (
                  <p className="text-sm text-muted leading-relaxed mb-2">{j.description}</p>
                )}
                <p className="text-xs text-muted">
                  by {j.owner?.display_name ?? j.owner?.username ?? 'unknown'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  )
}
