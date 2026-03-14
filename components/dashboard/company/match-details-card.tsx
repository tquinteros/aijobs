// components/dashboard/company/match-detail-card.tsx
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { generateMatchDetail } from "@/lib/actions/company"
import { COMPANY_JOB_WITH_APPLICATIONS_QUERY_KEY, JobApplicationForCompany } from "@/lib/company"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const recommendationConfig = {
    strong_yes: { label: "Strong Yes", className: "bg-green-100 text-green-700 border-green-200" },
    yes: { label: "Yes", className: "bg-blue-100 text-blue-700 border-blue-200" },
    maybe: { label: "Maybe", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    no: { label: "No", className: "bg-red-100 text-red-700 border-red-200" },
}

type Props = {
    candidateId: string
    jobId: string
    applicationId: string
    match: JobApplicationForCompany["match"]
}

export function MatchDetailCard({ candidateId, jobId, applicationId, match }: Props) {
    const queryClient = useQueryClient()
    const [expanded, setExpanded] = useState(false)

    const hasDetail = !!match?.explanation

    const { mutate: analyze, isPending } = useMutation({
        mutationFn: () => generateMatchDetail(candidateId, jobId, applicationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: COMPANY_JOB_WITH_APPLICATIONS_QUERY_KEY(jobId),
            })
            setExpanded(true)
            toast.success("AI analysis complete")
        },
        onError: () => toast.error("Could not generate AI analysis"),
    })

    // Sin score todavía — mostrar solo botón de score básico
    if (!match?.score) return null

    const rec = match.recommendation ? recommendationConfig[match.recommendation] : null

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Header — siempre visible */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">AI Analysis</span>
                    {rec && (
                        <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            rec.className
                        )}>
                            {rec.label}
                        </span>
                    )}
                </div>

                {hasDetail ? (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {expanded ? "Hide" : "Show"}
                    </button>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs gap-1.5"
                        disabled={isPending}
                        onClick={() => analyze()}
                    >
                        {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Sparkles className="h-3 w-3" />
                        )}
                        {isPending ? "Analyzing..." : "Run analysis"}
                    </Button>
                )}
            </div>

            {/* Detail — expandible */}
            {hasDetail && expanded && (
                <div className="px-3 py-3 space-y-3 border-t">
                    {/* Breakdown */}
                    {match.breakdown && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Score breakdown
                            </p>
                            {[
                                { label: "Technical skills", value: match.breakdown.technical_skills },
                                { label: "Experience level", value: match.breakdown.experience_level },
                                { label: "Education", value: match.breakdown.education },
                            ].map(({ label, value }) => (
                                <div key={label} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-medium">{value}%</span>
                                    </div>
                                    <Progress value={value} className="h-1.5" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Strengths */}
                    {match.strengths && match.strengths.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Strengths
                            </p>
                            {match.strengths.map((s, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400">
                                    <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Gaps */}
                    {match.gaps && match.gaps.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Gaps
                            </p>
                            {match.gaps.map((g, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                                    <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    {g}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Explanation */}
                    {match.explanation && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Summary
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {match.explanation}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}