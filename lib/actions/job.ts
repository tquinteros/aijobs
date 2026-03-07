"use server"

import { createClient } from "@/lib/supabase/server"
import type { PublicJobListing, VectorJobResult, JobWithCompany } from "@/lib/company"

export async function getPublicJobs(): Promise<PublicJobListing[]> {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getClaims()
  const userId = authData?.claims?.sub
  console.log("Usuario logueado:", userId)
  console.log("Tiene claims:", !!authData?.claims)
  if (userId) {
    const { data: candidateProfile, error: profileError } = await supabase
      .from("candidate_profiles")
      .select("embedding")
      .eq("id", userId)
      .single()

    console.log("Profile error:", profileError)
    console.log("Tiene embedding:", !!candidateProfile?.embedding)

    if (candidateProfile?.embedding) {
      const { data: vectorJobs, error } = await supabase.rpc(
        "match_jobs_for_candidate",
        {
          candidate_embedding: candidateProfile.embedding,
          match_count: 20,
        }
      )

      console.log("Vector error:", error)
      console.log("Vector jobs count:", vectorJobs?.length)
      console.log("Vector jobs:", vectorJobs)

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

        return (vectorJobs as VectorJobResult[]).map((job) => ({
          ...job,
          company_profiles: companyMap[job.id] ?? null,
          similarity_score: Math.round(job.similarity * 100),
        })) as unknown as PublicJobListing[]
      }
    }
  }

  const { data, error } = await supabase
    .from("job_postings")
    .select(`*, company_profiles(company_name, industry, location)`)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []) as PublicJobListing[]
}