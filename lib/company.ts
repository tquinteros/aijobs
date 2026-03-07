/**
 * Company-related types and TanStack Query keys.
 * Kept in a separate file so "use server" actions file only exports async functions.
 */

export type CompanyProfile = {
  id: string
  company_name: string
  logo_url: string | null
  website: string | null
  description: string | null
  location: string | null
  industry: string | null
  size: string | null
  updated_at: string
}

export type JobPosting = {
  id: string
  company_id: string
  title: string
  description: string
  location_type: "remote" | "hybrid" | "onsite" | null
  location: string | null
  salary_min: number | null
  salary_max: number | null
  currency: string
  seniority_required: "junior" | "mid" | "senior" | "lead" | null
  years_required: number | null
  required_skills: string[]
  nice_to_have_skills: string[]
  status: "active" | "paused" | "closed"
  created_at: string
  updated_at: string
}

export const COMPANY_PROFILE_QUERY_KEY = ["companyProfile"] as const
export const JOB_POSTINGS_QUERY_KEY = ["jobPostings"] as const

/** Public job listing (active jobs with company info for /jobs page) */
export type PublicJobListing = JobPosting & {
  company_profiles: {
    company_name: string
    industry: string | null
    location: string | null
  } | null
}

export const PUBLIC_JOBS_QUERY_KEY = ["publicJobs"] as const
