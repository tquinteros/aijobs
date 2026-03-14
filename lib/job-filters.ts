import { PublicJobListing } from "./company"

// lib/jobs-filters.ts
export type JobFilters = {
    location_type: "remote" | "hybrid" | "onsite" | ""
    seniority: "junior" | "mid" | "senior" | "lead" | ""
    search: string
  }
  
  export const DEFAULT_FILTERS: JobFilters = {
    location_type: "",
    seniority: "",
    search: "",
  }
  
  export function parseFiltersFromParams(params: URLSearchParams): JobFilters {
    return {
      location_type: (params.get("location_type") ?? "") as JobFilters["location_type"],
      seniority: (params.get("seniority") ?? "") as JobFilters["seniority"],
      search: params.get("search") ?? "",
    }
  }
  
  export function applyFilters(jobs: PublicJobListing[], filters: JobFilters): PublicJobListing[] {
    return jobs.filter((job) => {
      if (filters.location_type && job.location_type !== filters.location_type) return false
      if (filters.seniority && job.seniority_required !== filters.seniority) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const inTitle = job.title.toLowerCase().includes(q)
        const inSkills = job.required_skills?.some((s) => s.toLowerCase().includes(q))
        const inCompany = (job.company_profiles?.company_name ?? "").toLowerCase().includes(q)
        if (!inTitle && !inSkills && !inCompany) return false
      }
      return true
    })
  }