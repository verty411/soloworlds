# Shared Worlds

A prototype multi-user journaling platform for collaborative shared-world stories.

- Users sign up / log in (Supabase Auth)
- Anyone can **create a journal** (a shared story/world), open or invite-only
- Other users can browse a **directory of open journals** and **request to join**
- Journal owners **approve or reject** join requests
- Each contributor can post entries (title, body, tags) and can only **edit or delete their own entries**
- Journal owners can **remove members**, optionally deleting that member's entries, and can **delete any entry or the whole journal**

All permissions are enforced at the database level via Postgres Row Level Security (RLS) — not just hidden in the UI.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Once it's ready, open **SQL Editor** → **New query**, paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates all tables, the `profiles` auto-creation trigger, and the RLS policies described above.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. (Optional, for easier testing) Go to **Authentication → Providers → Email** and turn **off** "Confirm email" so new accounts can log in immediately without checking an inbox.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the two values from step 1:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL, sign up for an account, and start creating journals.

## 4. Deploy (Vercel)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo.
3. Vercel auto-detects the Vite framework. Before deploying, add the two environment variables from step 2 under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Every future `git push` to the main branch will redeploy automatically.

`vercel.json` is included so client-side routing (`/journal/:id`, `/login`, etc.) works correctly on refresh.

## Project structure

```
src/
  contexts/AuthContext.tsx   – auth session + profile state
  lib/supabase.ts            – Supabase client
  components/                – shared UI pieces (cards, forms, manage panel)
  pages/
    Landing.tsx               – logged-out marketing/intro page
    Login.tsx / Signup.tsx    – auth forms
    Dashboard.tsx             – "My journals" + directory of open games
    JournalDetail.tsx         – entries, members, join flow, owner controls
supabase/schema.sql          – tables + RLS policies (run once in Supabase)
```

## Notes / things to extend later

- No rich text editor — entries are plain text (line breaks preserved).
- "Open" vs "invite-only" only affects directory visibility; invite-only journals currently have no invite mechanism beyond the owner sharing the journal URL with someone who then can't join unless `is_open` is true. Extend `journal_members` insert policy or add an invite-code flow if needed.
- Member/entry counts on the dashboard are fetched with a few extra queries per journal — fine for a prototype, but consider a Postgres view or RPC if this needs to scale.
