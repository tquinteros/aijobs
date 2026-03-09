"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getJobPostings, updateJobStatus } from "@/lib/actions/company"
import { JOB_POSTINGS_QUERY_KEY, type JobPosting } from "@/lib/company"
import { CreateJobDialog } from "@/components/dashboard/company/create-job-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MapPin,
  Clock,
  DollarSign,
  MoreVertical,
  Briefcase,
  AlertCircle,
  Inbox,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"

const statusConfig: Record<JobPosting["status"], { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Activo", variant: "default" },
  paused: { label: "Pausado", variant: "secondary" },
  closed: { label: "Cerrado", variant: "destructive" },
}

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

function JobCard({ job }: { job: JobPosting }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobPosting["status"] }) =>
      updateJobStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: JOB_POSTINGS_QUERY_KEY }),
  })

  const status = statusConfig[job.status]

  const salaryText =
    job.salary_min && job.salary_max
      ? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : job.salary_min
      ? `desde ${job.currency} ${job.salary_min.toLocaleString()}`
      : null

  return (
    <Card className="cursor-pointer" onClick={() => router.push(`/dashboard/company/jobs/${job.id}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-tight">{job.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
              {job.seniority_required && (
                <Badge variant="outline" className="text-xs">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                disabled={isPending}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {job.status !== "active" && (
                <DropdownMenuItem onClick={() => changeStatus({ id: job.id, status: "active" })}>
                  Activar
                </DropdownMenuItem>
              )}
              {job.status !== "paused" && (
                <DropdownMenuItem onClick={() => changeStatus({ id: job.id, status: "paused" })}>
                  Pausar
                </DropdownMenuItem>
              )}
              {job.status !== "closed" && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => changeStatus({ id: job.id, status: "closed" })}
                >
                  Cerrar búsqueda
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {salaryText && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> {salaryText}
            </span>
          )}
          {job.years_required != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {job.years_required}+ años
            </span>
          )}
          {job.location && job.location_type !== "remote" && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
            </span>
          )}
        </div>

        {job.required_skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.required_skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Publicado el{" "}
            {new Date(job.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <span className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
            <Users className="h-3.5 w-3.5" />
            Ver postulaciones
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function JobsListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function JobsList() {
  const { data: jobs, isLoading, isError } = useQuery({
    queryKey: JOB_POSTINGS_QUERY_KEY,
    queryFn: getJobPostings,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Búsquedas laborales
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {!isLoading && jobs ? `${jobs.length} búsqueda${jobs.length !== 1 ? "s" : ""} total${jobs.length !== 1 ? "es" : ""}` : ""}
          </p>
        </div>
        <CreateJobDialog />
      </div>

      {/* Content */}
      {isLoading && <JobsListSkeleton />}

      {isError && (
        <div className="flex items-center gap-2 text-destructive p-4 rounded-lg border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">No se pudieron cargar las búsquedas. Intentá recargar la página.</p>
        </div>
      )}

      {!isLoading && !isError && jobs?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
          <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-medium text-muted-foreground">No hay búsquedas publicadas</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Publicá tu primera búsqueda laboral para encontrar candidatos.
          </p>
          <CreateJobDialog />
        </div>
      )}

      {!isLoading && jobs && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
