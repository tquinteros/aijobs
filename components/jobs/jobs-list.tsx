"use client"

import { useQuery } from "@tanstack/react-query"
import { getPublicJobs } from "@/lib/actions/job"
import { PUBLIC_JOBS_QUERY_KEY, type PublicJobListing } from "@/lib/company"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Clock, DollarSign, Building2, AlertCircle } from "lucide-react"

const locationTypeLabel: Record<string, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
}

const seniorityLabel: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
}

function JobCard({ job }: { job: PublicJobListing }) {
  const companyName = job.company_profiles?.company_name ?? "Empresa"
  const salaryText =
    job.salary_min != null && job.salary_max != null
      ? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : job.salary_min != null
        ? `Desde ${job.currency} ${job.salary_min.toLocaleString()}`
        : null

  return (
    <Card className="transition-colors hover:bg-muted/50">
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
        </div>
      </CardHeader>
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
              {job.years_required}+ años
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
                +{job.required_skills.length - 5} más
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-1">
          Publicado{" "}
          {new Date(job.created_at).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </CardContent>
    </Card>
  )
}

function JobsListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-44 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function JobsList() {
  const { data: jobs, isLoading, isError } = useQuery({
    queryKey: PUBLIC_JOBS_QUERY_KEY,
    queryFn: getPublicJobs,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Búsquedas laborales</h1>
        <p className="text-muted-foreground mt-1">
          {!isLoading && jobs != null
            ? `${jobs.length} búsqueda${jobs.length !== 1 ? "s" : ""} activa${jobs.length !== 1 ? "s" : ""}`
            : "Cargando..."}
        </p>
      </div>

      {isLoading && <JobsListSkeleton />}

      {isError && (
        <div className="flex items-center gap-2 text-destructive p-4 rounded-lg border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">No se pudieron cargar las búsquedas. Intentá de nuevo más tarde.</p>
        </div>
      )}

      {!isLoading && !isError && jobs?.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No hay búsquedas publicadas por el momento.</p>
        </div>
      )}

      {!isLoading && jobs != null && jobs.length > 0 && (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
