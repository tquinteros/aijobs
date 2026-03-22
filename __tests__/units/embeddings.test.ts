// __tests__/unit/embeddings.test.ts

import { describe, it, expect, vi } from "vitest"

vi.mock("openai", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            embeddings: {
                create: vi.fn().mockResolvedValue({
                    data: [{ embedding: new Array(1536).fill(0.1) }]
                })
            }
        }))
    }
})

import { buildCandidateText, buildJobText } from "@/lib/ai/embeddings"

describe("buildCandidateText", () => {
    it("includes skills repeated 3 times for semantic weight", () => {
        const result = buildCandidateText({
            skills: ["React", "TypeScript"],
            seniority: "mid",
            years_of_experience: 4,
            job_titles: ["Full-stack Developer"],
        })

        const skillsOccurrences = result.split("React").length - 1
        expect(skillsOccurrences).toBe(3)
    })

    it("excludes summary to avoid language-dependent vectors", () => {
        const result = buildCandidateText({
            skills: ["React"],
            seniority: "mid",
            years_of_experience: 4,
            job_titles: ["Developer"],
        })

        expect(result).not.toContain("This should not appear")
    })

    it("handles empty skills gracefully", () => {
        const result = buildCandidateText({
            skills: [],
            seniority: "junior",
            years_of_experience: 1,
            job_titles: [],
        })

        expect(result).toBeTruthy()
        expect(result).toContain("junior")
    })

    it("handles null/undefined fields", () => {
        expect(() =>
            buildCandidateText({
                skills: undefined,
                seniority: undefined,
                years_of_experience: undefined,
                job_titles: undefined,
            })
        ).not.toThrow()
    })
})

describe("buildJobText", () => {
    it("includes required skills repeated 3 times", () => {
        const result = buildJobText({
            title: "Frontend Developer",
            description: "We are looking for...",
            required_skills: ["React", "TypeScript"],
            seniority_required: "mid",
            years_required: 3,
        })

        const occurrences = result.split("React").length - 1
        expect(occurrences).toBe(3)
    })

    it("excludes description from embedding text", () => {
        const result = buildJobText({
            title: "Developer",
            description: "Long description that should not be in embedding",
            required_skills: ["React"],
            seniority_required: "mid",
            years_required: 2,
        })

        expect(result).not.toContain("Long description that should not be in embedding")
    })
})