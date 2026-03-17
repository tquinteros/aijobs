// __tests__/unit/jobs-filters.test.ts
import { describe, it, expect } from "vitest"
import { applyFilters, parseFiltersFromParams } from "@/lib/job-filters"    
import type { PublicJobListing } from "@/lib/company"

// Factory para crear jobs de prueba sin repetir código
function makeJob(overrides: Partial<PublicJobListing> = {}): PublicJobListing {
  return {
    id: "test-id",
    company_id: "company-id",
    title: "Frontend Developer",
    description: "Test description",
    location_type: "remote",
    location: null,
    salary_min: null,
    salary_max: null,
    currency: "USD",
    seniority_required: "mid",
    years_required: 3,
    required_skills: ["React", "TypeScript"],
    nice_to_have_skills: [],
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    company_profiles: { company_name: "Acme Corp", industry: null, location: null },
    similarity_score: undefined,
    ...overrides,
  }
}

describe("applyFilters", () => {
  it("returns all jobs when no filters are active", () => {
    const jobs = [makeJob(), makeJob({ id: "2" })]
    const result = applyFilters(jobs, { location_type: "", seniority: "", search: "", similarity_score_min: "" })
    expect(result).toHaveLength(2)
  })

  it("filters by location_type", () => {
    const jobs = [
      makeJob({ id: "1", location_type: "remote" }),
      makeJob({ id: "2", location_type: "onsite" }),
      makeJob({ id: "3", location_type: "hybrid" }),
    ]
    const result = applyFilters(jobs, { location_type: "remote", seniority: "", search: "", similarity_score_min: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("filters by seniority", () => {
    const jobs = [
      makeJob({ id: "1", seniority_required: "junior" }),
      makeJob({ id: "2", seniority_required: "senior" }),
    ]
    const result = applyFilters(jobs, { location_type: "", seniority: "junior", search: "", similarity_score_min: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("filters by search in title", () => {
    const jobs = [
      makeJob({ id: "1", title: "Frontend Developer" }),
      makeJob({ id: "2", title: "Backend Engineer" }),
    ]
    const result = applyFilters(jobs, { location_type: "", seniority: "", search: "frontend", similarity_score_min: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("filters by search in skills", () => {
    const jobs = [
      makeJob({ id: "1", required_skills: ["React", "TypeScript"] }),
      makeJob({ id: "2", required_skills: ["Python", "Django"] }),
    ]
    const result = applyFilters(jobs, { location_type: "", seniority: "", search: "python", similarity_score_min: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })

  it("filters by search in company name", () => {
    const jobs = [
      makeJob({ id: "1", company_profiles: { company_name: "Acme Corp", industry: null, location: null } }),
      makeJob({ id: "2", company_profiles: { company_name: "Globex", industry: null, location: null } }),
    ]
    const result = applyFilters(jobs, { location_type: "", seniority: "", search: "acme", similarity_score_min: "" })
    expect(result).toHaveLength(1)
  })

  it("combines multiple filters with AND logic", () => {
    const jobs = [
      makeJob({ id: "1", location_type: "remote", seniority_required: "mid" }),
      makeJob({ id: "2", location_type: "remote", seniority_required: "senior" }),
      makeJob({ id: "3", location_type: "onsite", seniority_required: "mid" }),
    ]
    const result = applyFilters(jobs, { location_type: "remote", seniority: "mid", search: "", similarity_score_min: "" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("returns empty array when nothing matches", () => {
    const jobs = [makeJob({ title: "Backend Developer" })]
    const result = applyFilters(jobs, { location_type: "", seniority: "", search: "designer", similarity_score_min: "" })
    expect(result).toHaveLength(0)
  })
})

describe("parseFiltersFromParams", () => {
  it("parses all filter params correctly", () => {
    const params = new URLSearchParams("location_type=remote&seniority=mid&search=react&similarity_score_min=80")
    const filters = parseFiltersFromParams(params)
    expect(filters.location_type).toBe("remote")
    expect(filters.seniority).toBe("mid")
    expect(filters.search).toBe("react")
    expect(filters.similarity_score_min).toBe("80")
  })

  it("returns empty strings for missing params", () => {
    const params = new URLSearchParams("")
    const filters = parseFiltersFromParams(params)
    expect(filters.location_type).toBe("")
    expect(filters.seniority).toBe("")
    expect(filters.search).toBe("")
    expect(filters.similarity_score_min).toBe("")
  })
})