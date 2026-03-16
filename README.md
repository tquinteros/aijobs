# AIJobs — AI-Powered Job Board

---

## The Problem

Traditional job boards show the same listings to every candidate. A junior designer and a senior backend engineer see identical results — relevance is entirely manual.

HireMatch analyzes each candidate's technical profile and ranks job listings by actual compatibility, using AI-generated embeddings and cosine similarity via pgvector.

---

## How the Matching Works

```
Candidate uploads CV
  → pdfparse extracts raw text from PDF
  → gpt-4o-mini parses structure (skills, seniority, experience, languages, job titles)
  → text-embedding-3-small generates a 1536-dimension vector

Company creates a job posting
  → Same process generates an embedding for the position
  → Skills are weighted 3x in the embedding text for stronger semantic signal

Candidate visits /jobs
  → pgvector calculates cosine similarity between candidate vector and all active job embeddings
  → Results ranked 0–100 by compatibility score
  → Cached in Redis per user (TTL 1h), invalidated on CV update or new job posting
```

---

## Features

### Candidate
- Registration and onboarding with CV upload (PDF)
- AI-powered CV parsing — skills, seniority, experience, education, languages, job titles
- Personal dashboard with AI-generated profile summary
- Editable profile — updates automatically regenerate embedding and invalidate cached matches
- Job listings ranked by AI compatibility score with color-coded match badges
- Apply to jobs with optional cover letter
- Track application status (applied → reviewed → contacted → hired)
- Real-time chat with companies (Supabase Realtime)

### Company
- Company registration and onboarding
- Create and manage job postings — embeddings generated on publish
- View applications per job with candidate profiles and CV access
- Generate compatibility score per candidate on demand (cosine similarity)
- Run full AI analysis per candidate — score breakdown, strengths, gaps, summary, recommendation
- Initiate real-time chat directly from an application
- Redis cache invalidation when new jobs are published

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth + Row Level Security |
| Storage | Supabase Storage (PDF CVs) |
| Realtime | Supabase Realtime (chat) |
| AI — Parsing | OpenAI gpt-4o-mini |
| AI — Embeddings | OpenAI text-embedding-3-small (1536d) |
| AI — Match Analysis | OpenAI gpt-4o-mini (breakdown + strengths + gaps) |
| Cache | Redis via Upstash |
| Data Fetching | TanStack Query v5 |
| UI | Tailwind CSS + shadcn/ui |

---

## Architecture Decisions

### SSR + TanStack Query with `initialData`
Pages are Server Components that fetch data on the server and pass it as `initialData` to TanStack Query client components. This eliminates skeleton loading states on initial render while preserving all TanStack benefits — cache invalidation, mutations, background refetching, and optimistic updates.

```typescript
export default async function JobsPage() {
  const initialJobs = await getPublicJobs()
  return <JobsList initialJobs={initialJobs} />
}

// Client Component — no loading state, data is immediately available
export function JobsList({ initialJobs }) {
  const { data: jobs } = useQuery({
    queryKey: PUBLIC_JOBS_QUERY_KEY,
    queryFn: getPublicJobs,
    initialData: initialJobs,
  })
}
```

### Vector Search with pgvector
Embeddings are generated with `text-embedding-3-small` (1536 dimensions). Skills are repeated 3× in the embedding text to increase their semantic weight relative to generic words. Cosine similarity is calculated server-side via a PostgreSQL function `match_jobs_for_candidate()`.

### Layered Redis Cache Strategy
Vector search results are cached per user (`jobs:vector:{userId}`, TTL 1h). Cache is invalidated in two scenarios:
- Candidate updates their CV or profile → `redis.del(userKey)`
- Company publishes a new job → `redis.keys("jobs:vector:*")` → delete all

### Optimistic Updates in Chat
Messages appear instantly while saving to the database. On success, the optimistic message is replaced with the real DB record (including the actual UUID). On failure, the message is removed and the text is restored to the input. Supabase Realtime deduplicates incoming events against pending optimistic messages by content matching.

### Cursor-based Pagination
The chat loads the last 20 messages on mount. Scrolling up triggers `fetchNextPage()` using `created_at` as the cursor. Scroll position is restored with `useLayoutEffect` after new pages load to prevent visual jumps.

### Security
- Row Level Security (RLS) enabled on all sensitive tables
- Ownership verification in every Server Action before mutations
- `supabaseAdmin` (service role) used only for justified RLS bypasses (e.g. company reading candidate embeddings for score calculation)
- CV update rate limited to once every 24 hours per user

---

## Project Structure

```
app/
  (auth)/              → login, register
  (public)/
    jobs/              → public job listings with vector search
    jobs/[id]/         → job detail + apply
  onboarding/
    candidate/         → profile form + CV upload
    company/           → company profile form
  dashboard/
    candidate/         → profile summary, CV, jobs, applications, messages
    company/           → job postings, applications per job, messages

lib/
  actions/             → Server Actions (candidate, company, job, message)
  ai/
    embeddings.ts      → generateEmbedding, buildCandidateText, buildJobText
  supabase/            → client.ts, server.ts, admin.ts
  hooks/               → useUnreadCount
  jobs-filters.ts      → filter types, parseFiltersFromParams, applyFilters

components/
  dashboard/
    candidate/         → ProfileSummary, EditProfileSheet, ConversationChat
    company/           → JobDetails, ApplicationCard, ConversationChatCompany
  jobs/                → JobsList, JobCard, JobsFilters, JobDetails
  ui/                  → TagInput, ScoreBadge, UnreadBadge
```

---

## Database Schema (key tables)

```sql
candidate_profiles    -- profile, skills[], seniority, embedding vector(1536)
company_profiles      -- company info
job_postings          -- title, required_skills[], embedding vector(1536), status
applications          -- candidate_id, job_id, status, match_id
matches               -- candidate_id, job_id, score, breakdown, strengths, gaps, explanation, recommendation
conversations         -- candidate_id, company_id, job_id, unread counters
messages              -- conversation_id, sender_role, content, read_at
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_APP_URL=
```

---

## Getting Started

```bash
git clone https://github.com/tquinteros/aijobs
cd aijobs
pnpm install
cp .env.example .env.local
# Fill in environment variables
npm run dev
```

Or try the live demo — use the **Demo Candidate** or **Demo Recruiter** buttons on the login page to explore without registering.

---

## Roadmap

- [ ] Edit job posting (regenerates embedding)
- [ ] Edit company profile
- [ ] Unread message notifications in nav
- [ ] Email notifications via Resend
- [ ] Landing page
- [ ] Semantic free-text search in /jobs
- [ ] Company analytics dashboard (views, conversion rate per job)