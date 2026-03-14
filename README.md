# HireMatch — AI-Powered Job Board

## Problem it solves

Traditional job boards show the same jobs to every candidate.  
HireMatch analyzes each candidate’s technical profile and ranks jobs by **real compatibility** using semantic vector search.

---

# How matching works

```
Candidate uploads CV
  → pdfparse extracts text from the PDF
  → gpt-4o-mini parses the structure (skills, seniority, experience, languages)
  → text-embedding-3-small generates a 1536-dimension vector

Company creates a job
  → the same process generates the job embedding

Candidate visits /jobs
  → pgvector computes cosine similarity between the candidate vector and all active jobs
  → Score 0–100 appears on each card, list ranked by compatibility
  → Result cached in Redis for 1h
```

---

# Features

## Candidate

- Registration and onboarding with CV upload (PDF)
- Automatic CV parsing with gpt-4o-mini (skills, seniority, experience, languages, education)
- Dashboard with an AI-generated profile summary
- Profile editing (automatically recalculates embedding)
- Job list ranked by compatibility with a visual score
- Apply to jobs with a cover letter
- View application status
- Real-time chat with companies (Supabase Realtime)

## Company

- Company registration and onboarding
- Create and manage job postings (embedding generated on publish)
- View applications per job with candidate data
- Generate compatibility score per candidate on demand
- Change application status (received → reviewing → contacted → hired)
- Real-time chat with candidates
- Start a conversation directly from an application

---

# Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16 App Router + TypeScript          |
| Database      | Supabase (PostgreSQL + pgvector)            |
| Auth          | Supabase Auth with RLS                      |
| Storage       | Supabase Storage (PDF CVs)                  |
| Realtime      | Supabase Realtime                           |
| AI            | OpenAI gpt-4o-mini + text-embedding-3-small |
| Cache         | Redis (Upstash)                             |
| UI            | Tailwind CSS + Shadcn/ui                    |
| Data fetching | TanStack Query                              |

---

# Architecture and technical decisions

## SSR + TanStack Query with `initialData`

Pages are Server Components that fetch data on the server and pass it  
as `initialData` to TanStack.

Result:

- No initial loading skeleton
- Data available on the first render
- TanStack handles caching and client mutations

---

## Vector search with pgvector

Embeddings are generated using `text-embedding-3-small` (1536 dimensions).

Skills are repeated **3x** in the embedding text to give them more semantic weight  
compared to generic words in the CV.

Search uses cosine similarity via `match_jobs_for_candidate()`.

---

## Strategic caching with Redis

Vector search results are cached per user (**TTL: 1 hour**).

Cache is invalidated when:

- A candidate updates their CV
- A company publishes a new job

```
redis.keys("jobs:vector:*") → delete all
```

---

## Optimistic updates in chat

Messages appear immediately while being saved in the database.

If the request fails:

- The message is removed
- The text returns to the input

Supabase Realtime then replaces the optimistic message with the real database message.

---

## Cursor-based pagination

The chat initially loads the **latest 20 messages**.

When scrolling upward:

- Previous pages are fetched using `created_at` as the cursor
- Scroll position is restored using `useLayoutEffect`
- This prevents visual jumps

---

## Security

- RLS on all tables (`conversations`, `messages`, `applications`, `matches`, `job_postings`)
- Ownership verification in every Server Action
- `supabaseAdmin` (service role) used only for justified RLS bypass operations
- Rate limiting for CV updates (**once every 24 hours**)

---

# Project structure

```
app/
  (auth)/          → login, registration
  onboarding/      → candidate (profile + CV) / company
  jobs/            → public list with vector search
  dashboard/
    candidate/     → summary, CV, jobs, applications, messages
    company/       → jobs, applications per job, messages

lib/
  actions/         → Server Actions (candidate, company, job, message)
  ai/              → embeddings (generateEmbedding, buildCandidateText, buildJobText)
  supabase/        → client, server, admin
  hooks/           → useUnreadCount

components/
  dashboard/
    candidate/     → ProfileSummary, EditProfileSheet, ConversationChat
    company/       → JobDetails, ApplicationCard, ConversationChatCompany
  ui/              → TagInput, UnreadBadge, ScoreBadge
```

---

# Roadmap

## Pending MVP

- [ ] Edit job posting (regenerates embedding)
- [ ] Landing page
- [ ] Demo user for testing without registration

---

## Post-MVP

- [ ] AI Match Detail — score breakdown with gpt-4o-mini  
       (strengths, gaps, explanation, recommendation)
- [ ] Email notifications with Resend
- [ ] Filters on `/jobs` (remote, seniority, skills)
- [ ] Company analytics (views, conversion rate per job)
- [ ] Free semantic search on `/jobs`

---

# Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_APP_URL=
```
