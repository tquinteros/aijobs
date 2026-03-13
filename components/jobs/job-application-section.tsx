"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getUserApplication, applyToJob } from "@/lib/actions/job"
import { USER_APPLICATION_QUERY_KEY } from "@/lib/company"
import { JobDetailsMessageLink } from "@/components/jobs/job-details-message-link"

const applicationStatusConfig: Record<string, { label: string; className: string }> = {
  applied: {
    label: "Application sent",
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  reviewed: {
    label: "In review",
    className:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  },
  contacted: {
    label: "Contacted",
    className:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  hired: {
    label: "Hired",
    className:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
}

type JobApplicationSectionProps = {
  jobId: string
}

function ApplicationCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-[120px] w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
      </CardContent>
    </Card>
  )
}

export function JobApplicationSection({ jobId }: JobApplicationSectionProps) {
  const { data: application, isLoading, isError } = useQuery({
    queryKey: USER_APPLICATION_QUERY_KEY(jobId),
    queryFn: () => getUserApplication(jobId),
  })
  const queryClient = useQueryClient()
  const [coverLetter, setCoverLetter] = useState("")

  const { mutate: apply, isPending } = useMutation({
    mutationFn: () => applyToJob({ jobId, coverLetter }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Application sent", {
          description: "Your application has been received correctly.",
        })
        queryClient.invalidateQueries({ queryKey: USER_APPLICATION_QUERY_KEY(jobId) })
      } else {
        toast.error("Could not send the application", {
          description: result.error,
        })
      }
    },
    onError: () => {
      toast.error("Unexpected error", {
        description: "Please try again later.",
      })
    },
  })

  if (isLoading) return <ApplicationCardSkeleton />

  if (isError)
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <div>
          <p className="font-semibold">Could not load the application</p>
          <p className="text-sm text-muted-foreground mt-1">
            It is possible that the application has been closed or does not exist.
          </p>
        </div>
      </div>
    )

  const alreadyApplied = application != null
  const statusConfig = application?.status ? applicationStatusConfig[application.status] : null

  if (alreadyApplied) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">You have already applied to this job</span>
          </div>
          {statusConfig && (
            <span
              className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          )}
          {application.cover_letter && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cover letter
              </p>
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed border">
                {application.cover_letter}
              </p>
            </div>
          )}
          {application.applied_at && (
            <p className="text-xs text-muted-foreground">
              Sent on{" "}
              {new Date(application.applied_at).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          {statusConfig?.label?.toLowerCase() === "contacted" && (
            <JobDetailsMessageLink jobId={jobId} />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Apply</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cover-letter" className="text-sm font-medium">
            Cover letter{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="cover-letter"
            placeholder="Tell the team why you are the ideal candidate for this position..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            disabled={isPending}
            className="min-h-[120px] resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground">
            A good cover letter increases your chances of being contacted by the company.
          </p>
        </div>
        <Button className="w-full gap-2" onClick={() => apply()} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Apply
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default JobApplicationSection