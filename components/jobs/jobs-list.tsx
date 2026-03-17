"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicJobs, type GetPublicJobsResult } from "@/lib/actions/job"
import { PUBLIC_JOBS_QUERY_KEY, type PublicJobListing } from "@/lib/company"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Clock, DollarSign, Building2, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { parseFiltersFromParams } from "@/lib/job-filters"
import { useMemo } from "react"
import { JobsFilters } from "./job-filters"

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

function ScoreBadge({ score }: { score: number }) {
  const config =
    score >= 70
      ? { label: "Strong match", className: "bg-green-100 text-green-700 border-green-200" }
      : score >= 50
        ? { label: "Moderate match", className: "bg-yellow-100 text-yellow-700 border-yellow-200" }
        : { label: "Low match", className: "bg-red-100 text-red-700 border-red-200" }

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.className}`}>
      {score}% · {config.label}
    </span>
  )
}

function JobCard({ job }: { job: PublicJobListing }) {
  const companyName = job.company_profiles?.company_name ?? "Company"
  const router = useRouter()
  const salaryText =
    job.salary_min != null && job.salary_max != null
      ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
      : job.salary_min != null
        ? `From ${job.currency} ${job.salary_min.toLocaleString()}`
        : null

  return (
    <Card className="transition-colors hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </p>
            <h3 className="font-semibold text-lg leading-tight mt-1">{job.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {job.seniority_required && (
                <Badge variant="secondary" className="text-xs">
                  {seniorityLabel[job.seniority_required]}
                </Badge>
              )}
              {job.location_type && (
                <span className="text-xs text-muted-foreground">
                  {locationTypeLabel[job.location_type]}
                  {job.location && job.location_type !== "remote"
                    ? ` · ${job.location}`
                    : ""}
                </span>
              )}
            </div>
          </div>

          {/* Score badge — solo si hay búsqueda vectorial */}
          {job.similarity_score != null && (
            <div className="shrink-0">
              <ScoreBadge score={job.similarity_score} />
            </div>
          )}
        </div>
      </CardHeader>

      {/* CardContent queda exactamente igual */}
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {salaryText && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {salaryText}
            </span>
          )}
          {job.years_required != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {job.years_required}+ years
            </span>
          )}
          {job.location && job.location_type !== "remote" && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
          )}
        </div>
        {job.required_skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.required_skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
            {job.required_skills.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{job.required_skills.length - 5} more
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-1">
          Published on{" "}
          {new Date(job.created_at).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </CardContent>
    </Card>
  )
}

export function JobsListSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 flex-1 min-w-[200px] rounded-md" />
          <Skeleton className="h-10 w-[140px] rounded-md" />
          <Skeleton className="h-10 w-[130px] rounded-md" />
        </div>
        <Skeleton className="h-4 w-40 mt-3 rounded-md" />
        <Skeleton className="h-4 w-40 mt-3 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function JobsList({ initialData }: { initialData?: GetPublicJobsResult | null }) {
  const searchParams = useSearchParams()
  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  )
  const { data, isLoading, isError } = useQuery({
    queryKey: [...PUBLIC_JOBS_QUERY_KEY, filters],
    queryFn: () => getPublicJobs(filters),
    initialData: initialData ?? undefined,
  })

  const jobs = data?.jobs ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Job searches</h1>
        <JobsFilters
          filters={filters}
          totalJobs={total}
          filteredCount={jobs.length}
        />

        <p className="text-muted-foreground mt-1">
          {!isLoading && data != null
            ? `${total} job search${total !== 1 ? "s" : ""} active${total !== 1 ? "s" : ""}`
            : "Loading..."}
        </p>
      </div>

      {isLoading && <JobsListSkeleton />}

      {isError && (
        <div className="flex items-center gap-2 text-destructive p-4 rounded-lg border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">Could not load the job searches. Please try again later.</p>
        </div>
      )}

      {!isLoading && !isError && total === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No job searches published yet.</p>
        </div>
      )}

      {!isLoading && !isError && total > 0 && jobs.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No jobs match your filters. Try adjusting or clearing them.</p>
        </div>
      )}

      {!isLoading && !isError && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
