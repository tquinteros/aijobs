"use server"

import { createClient } from "@/lib/supabase/server"
import { redis } from "@/lib/redis"
import type {
  PublicJobListing,
  VectorJobResult,
  JobWithCompany,
  Application,
  CandidateApplicationWithJob,
} from "@/lib/company"

const JOBS_CACHE_TTL = 60 * 60

const PUBLIC_JOBS_SELECT =
  "id, company_id, title, description, location_type, location, salary_min, salary_max, currency, seniority_required, years_required, required_skills, nice_to_have_skills, status, created_at, updated_at, company_profiles(company_name, industry, location)"

function buildCacheKey(userId?: string) {
  return userId ? `jobs:vector:${userId}` : "jobs:public"
}

function withoutEmbedding<T extends Record<string, unknown>>(job: T): T {
  const { embedding: _, ...rest } = job
  return rest as T
}

async function fetchPublicJobs(): Promise<PublicJobListing[]> {
  const supabase = await createClient()

  const publicCacheKey = buildCacheKey()
  const cachedPublic = await redis.get<PublicJobListing[]>(publicCacheKey)

  if (cachedPublic) {
    console.log("[jobs] Redis HIT (public):", publicCacheKey, "items:", cachedPublic.length)
    return cachedPublic
  }
  console.log("[jobs] Redis MISS (public):", publicCacheKey, "→ fetching from DB")

  const { data, error } = await supabase
    .from("job_postings")
    .select(PUBLIC_JOBS_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  const result = (data ?? []) as unknown as PublicJobListing[]

  await redis.set(publicCacheKey, result, { ex: JOBS_CACHE_TTL })
  console.log("[jobs] Redis SET (public):", publicCacheKey, "items:", result.length, "TTL:", JOBS_CACHE_TTL, "s")

  return result
}

export async function getPublicJobs(): Promise<PublicJobListing[]> {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getClaims()
  const userId = authData?.claims?.sub

  if (userId) {
    const { data: candidateProfile } = await supabase
      .from("candidate_profiles")
      .select("embedding")
      .eq("id", userId)
      .single()

    if (candidateProfile?.embedding) {
      const cacheKey = buildCacheKey(userId)
      const cached = await redis.get<PublicJobListing[]>(cacheKey)

      if (cached) {
        console.log("[jobs] Redis HIT (vector):", cacheKey, "items:", cached.length)
        return cached
      }
      console.log("[jobs] Redis MISS (vector):", cacheKey, "→ fetching from DB")

      const { data: vectorJobs, error } = await supabase.rpc(
        "match_jobs_for_candidate",
        {
          candidate_embedding: candidateProfile.embedding,
          match_count: 20,
        }
      )

      if (!error && vectorJobs?.length) {
        const jobIds = (vectorJobs as VectorJobResult[]).map((j) => j.id)

        const { data: jobsWithCompany } = await supabase
          .from("job_postings")
          .select("id, company_profiles(company_name, industry, location)")
          .in("id", jobIds)

        const companyMap = Object.fromEntries(
          (jobsWithCompany as unknown as JobWithCompany[] ?? []).map((c) => [
            c.id,
            c.company_profiles,
          ])
        )

        const result = (vectorJobs as VectorJobResult[]).map((job) => {
          const withCompany = {
            ...job,
            company_profiles: companyMap[job.id] ?? null,
            similarity_score: Math.round(job.similarity * 100),
          }
          return withoutEmbedding(withCompany as Record<string, unknown>) as PublicJobListing
        })

        await redis.set(cacheKey, result, { ex: JOBS_CACHE_TTL })
        console.log("[jobs] Redis SET (vector):", cacheKey, "items:", result.length, "TTL:", JOBS_CACHE_TTL, "s")

        return result
      }
    }
  }

  // Fallback to non-personalized public jobs
  return fetchPublicJobs()
}

// Used for server-side prefetching in the jobs page without blocking navigation
export async function getPublicJobsForSSR(): Promise<PublicJobListing[]> {
  return fetchPublicJobs()
}

export async function getJobById(jobId: string): Promise<PublicJobListing | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("job_postings")
    .select(PUBLIC_JOBS_SELECT)
    .eq("id", jobId)
    .eq("status", "active")
    .single()

  if (error) return null

  return data as unknown as PublicJobListing
}

export async function getUserApplication(jobId: string): Promise<Application | null> {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getClaims()
  const userId = authData?.claims?.sub

  if (!userId) return null

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, cover_letter, applied_at")
    .eq("candidate_id", userId)
    .eq("job_id", jobId)
    .single()

  if (error) return null

  return data as Application
}

export async function applyToJob({
  jobId,
  coverLetter,
}: {
  jobId: string
  coverLetter: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getClaims()
  const userId = authData?.claims?.sub

  if (!userId) {
    return { success: false, error: "Debés iniciar sesión para postularte." }
  }

  const { error } = await supabase.from("applications").insert({
    candidate_id: userId,
    job_id: jobId,
    cover_letter: coverLetter.trim() || null,
    status: "applied",
  })

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Ya te postulaste a este trabajo." }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getCandidateApplications(): Promise<CandidateApplicationWithJob[]> {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getClaims()
  if (authError || !authData?.claims?.sub) {
    throw new Error("Debés iniciar sesión para ver tus postulaciones.")
  }
  const userId = authData.claims.sub as string

  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      cover_letter,
      applied_at,
      updated_at,
      job_postings (
        id,
        company_id,
        title,
        description,
        location_type,
        location,
        salary_min,
        salary_max,
        currency,
        seniority_required,
        years_required,
        required_skills,
        nice_to_have_skills,
        status,
        created_at,
        updated_at,
        company_profiles (
          company_name,
          logo_url,
          website,
          description,
          location,
          industry,
          size,
          updated_at
        )
      )
    `)
    .eq("candidate_id", userId)
    .order("applied_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as unknown as CandidateApplicationWithJob[]
}