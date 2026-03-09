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


export type VectorJobResult = Omit<JobPosting, "updated_at"> & {
  similarity: number
}

export type JobWithCompany = {
  id: string
  company_profiles: {
    company_name: string
    industry: string | null
    location: string | null
  } | null
}

export const COMPANY_PROFILE_QUERY_KEY = ["companyProfile"] as const
export const JOB_POSTINGS_QUERY_KEY = ["jobPostings"] as const

export type PublicJobListing = JobPosting & {
  company_profiles: {
    company_name: string
    industry: string | null
    location: string | null
  } | null
  similarity_score?: number
}

export const PUBLIC_JOBS_QUERY_KEY = ["publicJobs"] as const

export const JOB_DETAILS_QUERY_KEY = (id: string) => ["jobDetails", id] as const
export const USER_APPLICATION_QUERY_KEY = (jobId: string) => ["userApplication", jobId] as const

export type ApplicationStatus = "applied" | "reviewed" | "contacted" | "rejected" | "hired"

export type Application = {
  id: string
  status: ApplicationStatus
  cover_letter: string | null
  applied_at: string
}

export const COMPANY_JOB_WITH_APPLICATIONS_QUERY_KEY = (jobId: string) =>
  ["companyJobDetails", jobId] as const

export type JobApplicationForCompany = {
  id: string
  candidate_id: string
  status: ApplicationStatus
  cover_letter: string | null
  applied_at: string
  updated_at: string
  candidate_profiles: {
    full_name: string
    title: string
    location: string
    seniority: string | null
    years_of_experience: number | null
    skills: string[]
    languages: string[]
    cv_url: string | null
  } | null
}
