"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { getJobById } from "@/lib/actions/job"
import { JOB_DETAILS_QUERY_KEY, type Application, PublicJobListing } from "@/lib/company"
import { JobApplicationSection } from "@/components/jobs/job-application-section"

const locationTypeLabel: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
}

const seniorityLabel: Record<string, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
}

function JobDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-9 w-44" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Separator />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

type Props = {
  id: string
  initialJob: PublicJobListing | null
  canApply?: boolean
}

export const JobDetails = ({ id, initialJob, canApply = true }: Props) => {

  const router = useRouter()

  const { data: job, isError } = useQuery({
    queryKey: JOB_DETAILS_QUERY_KEY(id),
    queryFn: () => getJobById(id),
    initialData: initialJob ?? undefined,
  })

  // if (isLoading) return <JobDetailsSkeleton />

  if (isError || !job) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <div>
          <p className="font-semibold">Could not load the job</p>
          <p className="text-sm text-muted-foreground mt-1">
            It is possible that the job search has been closed or does not exist.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      </div>
    )
  }

  const salaryText =
    job.salary_min != null && job.salary_max != null
      ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
      : job.salary_min != null
        ? `From ${job.currency} ${job.salary_min.toLocaleString()}`
        : null

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to job searches
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">
            {job.company_profiles?.company_name ?? "Company"}
          </span>
          {job.company_profiles?.industry && (
            <span className="text-muted-foreground">· {job.company_profiles.industry}</span>
          )}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {job.seniority_required && (
            <Badge variant="secondary" className="text-xs">
              {seniorityLabel[job.seniority_required]}
            </Badge>
          )}
          {job.location_type && (
            <Badge variant="outline" className="text-xs">
              {locationTypeLabel[job.location_type]}
              {job.location && job.location_type !== "remote" ? ` · ${job.location}` : ""}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {job.required_skills?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Required skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {job.nice_to_have_skills?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nice to have skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.nice_to_have_skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Job meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {salaryText && (
                <div className="flex items-start gap-2.5 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{salaryText}</span>
                </div>
              )}
              {job.location_type && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    {locationTypeLabel[job.location_type]}
                    {job.location && job.location_type !== "remote"
                      ? ` · ${job.location}`
                      : ""}
                  </span>
                </div>
              )}
              {job.years_required != null && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{job.years_required}+ years of experience</span>
                </div>
              )}
              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Published on{" "}
                  {new Date(job.created_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {canApply && <JobApplicationSection jobId={id} />}
        </div>
      </div>
    </div>
  )
}

export default JobDetails
