// __tests__/components/score-badge.test.tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ScoreBadge } from "@/components/jobs/score-badge"

describe("ScoreBadge", () => {
    it("shows Strong match for score >= 70", () => {
        render(<ScoreBadge score={ 75} />)
        expect(screen.getByText(/strong match/i)).toBeInTheDocument()
    })

    it("shows Moderate match for score 50-69", () => {
        render(<ScoreBadge score={ 55} />)
        expect(screen.getByText(/moderate match/i)).toBeInTheDocument()
    })

    it("shows Low match for score < 50", () => {
        render(<ScoreBadge score={ 30} />)
        expect(screen.getByText(/low match/i)).toBeInTheDocument()
    })

    it("displays the score percentage", () => {
        render(<ScoreBadge score={ 82} />)
        expect(screen.getByText(/82%/)).toBeInTheDocument()
    })

    it("applies green styling for strong match", () => {
        const { container } = render(<ScoreBadge score={ 80} />)
        expect(container.firstChild).toHaveClass("bg-green-100")
    })

    it("applies yellow styling for moderate match", () => {
        const { container } = render(<ScoreBadge score={ 60} />)
        expect(container.firstChild).toHaveClass("bg-yellow-100")
    })

    it("applies red styling for low match", () => {
        const { container } = render(<ScoreBadge score={ 40} />)
        expect(container.firstChild).toHaveClass("bg-red-100")
    })

    it("handles boundary value 70 as strong match", () => {
        render(<ScoreBadge score={ 70} />)
        expect(screen.getByText(/strong match/i)).toBeInTheDocument()
    })

    it("handles boundary value 50 as moderate match", () => {
        render(<ScoreBadge score={ 50} />)
        expect(screen.getByText(/moderate match/i)).toBeInTheDocument()
    })
})