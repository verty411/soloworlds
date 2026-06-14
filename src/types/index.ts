export interface Profile {
  id: string
  username: string
  display_name: string
  created_at: string
}

export interface Journal {
  id: string
  title: string
  description: string | null
  owner_id: string
  is_open: boolean
  created_at: string
  // Joined / computed fields (populated client-side)
  owner?: Profile
  member_count?: number
  entry_count?: number
  my_status?: 'owner' | 'accepted' | 'pending' | null
}

export type MembershipStatus = 'pending' | 'accepted'
export type MembershipRole = 'owner' | 'member'

export interface JournalMember {
  id: string
  journal_id: string
  user_id: string
  status: MembershipStatus
  role: MembershipRole
  created_at: string
  profile?: Profile
}

export interface JournalEntry {
  id: string
  journal_id: string
  author_id: string
  title: string
  body: string
  tags: string[]
  created_at: string
  updated_at: string
  author?: Profile
}
