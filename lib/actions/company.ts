"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type {
  CompanyProfile,
  JobPosting,
  JobApplicationForCompany,
  ApplicationStatus,
} from "@/lib/company"
import { buildJobText, generateEmbedding } from "../ai/embeddings"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function createCompanyProfile(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { error: insertError } = await supabase.from("company_profiles").insert({
    id: data.claims.sub,
    company_name: formData.get("company_name") as string,
    industry: formData.get("industry") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    website: (formData.get("website") as string) || null,
  })

  if (insertError) throw new Error(insertError.message)

  redirect("/dashboard/company")
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: profile, error: profileError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", data.claims.sub)
    .single()

  if (profileError) throw new Error(profileError.message)
  if (!profile) redirect("/onboarding/company")

  return profile as CompanyProfile
}

export async function getJobPostings(): Promise<JobPosting[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: jobs, error: jobsError } = await supabase
    .from("job_postings")
    .select("*")
    .eq("company_id", data.claims.sub)
    .order("created_at", { ascending: false })

  if (jobsError) throw new Error(jobsError.message)

  return (jobs ?? []) as JobPosting[]
}

export async function createJobPosting(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const toSkillsArray = (val: string | null): string[] =>
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : []

  const salaryMin = formData.get("salary_min") as string
  const salaryMax = formData.get("salary_max") as string
  const yearsRequired = formData.get("years_required") as string

  const jobData = {
    company_id: data.claims.sub,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    location_type: (formData.get("location_type") as string) || null,
    location: (formData.get("location") as string) || null,
    salary_min: salaryMin ? parseInt(salaryMin) : null,
    salary_max: salaryMax ? parseInt(salaryMax) : null,
    currency: (formData.get("currency") as string) || "USD",
    seniority_required: (formData.get("seniority_required") as string) || null,
    years_required: yearsRequired ? parseInt(yearsRequired) : null,
    required_skills: toSkillsArray(formData.get("required_skills") as string),
    nice_to_have_skills: toSkillsArray(formData.get("nice_to_have_skills") as string),
    status: "active",
  }

  // 1. Insertar la oferta
  const { data: insertedJob, error: insertError } = await supabase
    .from("job_postings")
    .insert(jobData)
    .select()
    .single()

  if (insertError) throw new Error(insertError.message)

  // 2. Generar y guardar embedding de la oferta
  const jobText = buildJobText({
    title: jobData.title,
    description: jobData.description,
    required_skills: jobData.required_skills,
    nice_to_have_skills: jobData.nice_to_have_skills,
    seniority_required: jobData.seniority_required as string,
    years_required: jobData.years_required as number,
  })
  const embedding = await generateEmbedding(jobText)

  const { error: embeddingError } = await supabase
    .from("job_postings")
    .update({ embedding })
    .eq("id", insertedJob.id)

  if (embeddingError) throw new Error(`Error guardando embedding: ${embeddingError.message}`)
}

export async function updateJobStatus(
  jobId: string,
  status: JobPosting["status"]
): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { error: updateError } = await supabase
    .from("job_postings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("company_id", data.claims.sub)

  if (updateError) throw new Error(updateError.message)
}

export async function getJobWithApplications(jobId: string): Promise<{
  job: JobPosting
  applications: JobApplicationForCompany[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: job, error: jobError } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", data.claims.sub)
    .single()

  if (jobError || !job) throw new Error("Job not found or unauthorized")

  const { data: rawApplications, error: appError } = await supabase
    .from("applications")
    .select("id, candidate_id, status, cover_letter, applied_at, updated_at")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false })

  if (appError) throw new Error(appError.message)

  const apps = rawApplications ?? []

  // Fetch candidate profiles via admin client to bypass RLS
  const candidateIds = apps.map((a) => a.candidate_id)
  const profileMap: Record<string, JobApplicationForCompany["candidate_profiles"]> = {}

  if (candidateIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("candidate_profiles")
      .select(
        "id, full_name, title, location, seniority, years_of_experience, skills, languages, cv_url"
      )
      .in("id", candidateIds)

    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  const applications: JobApplicationForCompany[] = apps.map((app) => ({
    ...app,
    candidate_profiles: profileMap[app.candidate_id] ?? null,
  }))

  return {
    job: job as JobPosting,
    applications,
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  jobId: string,
  status: ApplicationStatus
): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: job } = await supabase
    .from("job_postings")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", data.claims.sub)
    .single()

  if (!job) throw new Error("Unauthorized")

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("job_id", jobId)

  if (updateError) throw new Error(updateError.message)
}
