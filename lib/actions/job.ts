"use server"

import { createClient } from "@/lib/supabase/server"
import { redis } from "@/lib/redis"
import type { PublicJobListing, VectorJobResult, JobWithCompany } from "@/lib/company"

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