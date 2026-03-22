// __tests__/components/job-card.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JobCard } from "@/components/jobs/jobs-list"
import type { PublicJobListing } from "@/lib/company"

// Mock useRouter — JobCard lo usa para navegar
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

function makeJob(overrides: Partial<PublicJobListing> = {}): PublicJobListing {
  return {
    id: "job-123",
    company_id: "company-id",
    title: "Frontend Developer",
    description: "We are looking for a skilled developer",
    location_type: "remote",
    location: null,
    salary_min: 2000,
    salary_max: 4000,
    currency: "USD",
    seniority_required: "mid",
    years_required: 3,
    required_skills: ["React", "TypeScript", "Node.js"],
    nice_to_have_skills: [],
    status: "active",
    created_at: "2024-01-15T00:00:00.000Z",
    updated_at: "2024-01-15T00:00:00.000Z",
    company_profiles: {
      company_name: "Acme Corp",
      industry: "Technology",
      location: "Buenos Aires",
    },
    similarity_score: undefined,
    ...overrides,
  }
}

describe("JobCard", () => {
  it("renders job title and company name", () => {
    render(<JobCard job={makeJob()} />)
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument()
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
  })

  it("renders required skills", () => {
    render(<JobCard job={makeJob()} />)
    expect(screen.getByText("React")).toBeInTheDocument()
    expect(screen.getByText("TypeScript")).toBeInTheDocument()
    expect(screen.getByText("Node.js")).toBeInTheDocument()
  })

  it("shows max 5 skills and a +N more label", () => {
    const job = makeJob({
      required_skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "Redis"],
    })
    render(<JobCard job={job} />)
    expect(screen.getByText("+1 more")).toBeInTheDocument()
    expect(screen.queryByText("Redis")).not.toBeInTheDocument()
  })

  it("shows salary range when both min and max are provided", () => {
    render(<JobCard job={makeJob({ salary_min: 2000, salary_max: 4000, currency: "USD" })} />)
    expect(screen.getByText(/2,000/)).toBeInTheDocument()
    expect(screen.getByText(/4,000/)).toBeInTheDocument()
  })

  it("shows From salary when only min is provided", () => {
    render(<JobCard job={makeJob({ salary_min: 2000, salary_max: null })} />)
    expect(screen.getByText(/From/)).toBeInTheDocument()
  })

  it("does not show salary when neither min nor max are provided", () => {
    render(<JobCard job={makeJob({ salary_min: null, salary_max: null })} />)
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument()
  })

  it("shows ScoreBadge when similarity_score is present", () => {
    render(<JobCard job={makeJob({ similarity_score: 85 })} />)
    expect(screen.getByText(/85%/)).toBeInTheDocument()
    expect(screen.getByText(/strong match/i)).toBeInTheDocument()
  })

  it("does not show ScoreBadge when similarity_score is absent", () => {
    render(<JobCard job={makeJob({ similarity_score: undefined })} />)
    expect(screen.queryByText(/match/i)).not.toBeInTheDocument()
  })

  it("shows fallback company name when company_profiles is null", () => {
    render(<JobCard job={makeJob({ company_profiles: null })} />)
    expect(screen.getByText("Company")).toBeInTheDocument()
  })

  it("shows location for non-remote jobs", () => {
    render(<JobCard job={makeJob({ location_type: "onsite", location: "Buenos Aires" })} />)
    expect(screen.getByText(/Buenos Aires/)).toBeInTheDocument()
  })

  it("does not show location for remote jobs", () => {
    render(<JobCard job={makeJob({ location_type: "remote", location: "Buenos Aires" })} />)
    // En remote no muestra la location en el footer
    const locationBadge = screen.queryByText("Onsite · Buenos Aires")
    expect(locationBadge).not.toBeInTheDocument()
  })

  it("navigates to job detail on click", async () => {
    render(<JobCard job={makeJob({ id: "job-123" })} />)
    await userEvent.click(screen.getByText("Frontend Developer"))
    expect(mockPush).toHaveBeenCalledWith("/jobs/job-123")
  })

  it("shows years of experience requirement", () => {
    render(<JobCard job={makeJob({ years_required: 3 })} />)
    expect(screen.getByText(/3\+ years/)).toBeInTheDocument()
  })
})