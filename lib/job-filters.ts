import { PublicJobListing } from "./company"

export type JobFilters = {
  location_type: "remote" | "hybrid" | "onsite" | ""
  seniority: "junior" | "mid" | "senior" | "lead" | ""
  search: string
  similarity_score_min: "" | "80" | "65" | "50" | "30"
}

export const DEFAULT_FILTERS: JobFilters = {
  location_type: "",
  seniority: "",
  search: "",
  similarity_score_min: "",
}

export function parseFiltersFromParams(params: URLSearchParams): JobFilters {
  return {
    location_type: (params.get("location_type") ?? "") as JobFilters["location_type"],
    seniority: (params.get("seniority") ?? "") as JobFilters["seniority"],
    search: params.get("search") ?? "",
    similarity_score_min: (params.get("similarity_score_min") ?? "") as JobFilters["similarity_score_min"],
  }
}

export function parseFiltersFromSearchParams(
  params: Record<string, string | string[] | undefined>
): JobFilters {
  const get = (key: string) => {
    const v = params[key]
    return Array.isArray(v) ? v[0] ?? "" : (v ?? "")
  }
  return {
    location_type: (get("location_type") ?? "") as JobFilters["location_type"],
    seniority: (get("seniority") ?? "") as JobFilters["seniority"],
    search: get("search") ?? "",
    similarity_score_min: (get("similarity_score_min") ?? "") as JobFilters["similarity_score_min"],
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
    if (filters.similarity_score_min) {
      const minScore = Number(filters.similarity_score_min)
      if (job.similarity_score == null || job.similarity_score < minScore) return false
    }
    return true
  })
}