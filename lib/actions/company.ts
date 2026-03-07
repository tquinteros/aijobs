"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { CompanyProfile, JobPosting } from "@/lib/company"

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

  const { error: insertError } = await supabase.from("job_postings").insert({
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
  })

  if (insertError) throw new Error(insertError.message)
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
