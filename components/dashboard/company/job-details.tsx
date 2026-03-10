"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  Users,
  ExternalLink,
  ChevronDown,
  Inbox,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { getJobWithApplications, updateJobStatus, updateApplicationStatus } from "@/lib/actions/company"
import {
  COMPANY_JOB_WITH_APPLICATIONS_QUERY_KEY,
  JOB_POSTINGS_QUERY_KEY,
  type JobApplicationForCompany,
  type ApplicationStatus,
  type JobPosting,
} from "@/lib/company"
import { getOrCreateConversation } from "@/lib/actions/message"

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

const jobStatusConfig: Record<
  JobPosting["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  active: { label: "Activo", variant: "default" },
  paused: { label: "Pausado", variant: "secondary" },
  closed: { label: "Cerrado", variant: "destructive" },
}

const applicationStatusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  applied: {
    label: "Nueva",
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  reviewed: {
    label: "En revisión",
    className:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  },
  contacted: {
    label: "Contactado/a",
    className:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  },
  rejected: {
    label: "Rechazado/a",
    className:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  hired: {
    label: "Contratado/a",
    className:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
}

const ALL_APPLICATION_STATUSES: ApplicationStatus[] = [
  "applied",
  "reviewed",
  "contacted",
  "rejected",
  "hired",
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function JobDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-44" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <Separator />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    </div>
  )
}

function ApplicationCard({
  application,
  jobId,
}: {
  application: JobApplicationForCompany
  jobId: string
}) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const candidate = application.candidate_profiles
  const statusCfg = applicationStatusConfig[application.status]

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      updateApplicationStatus(application.id, jobId, status),
    onSuccess: (_data, status) => {
      toast.success(`Estado actualizado a "${applicationStatusConfig[status].label}"`)
      queryClient.invalidateQueries({
        queryKey: COMPANY_JOB_WITH_APPLICATIONS_QUERY_KEY(jobId),
      })
    },
    onError: () => {
      toast.error("No se pudo actualizar el estado")
    },
  })

  const { mutate: contactCandidate, isPending: isStartingChat } = useMutation({
    mutationFn: async () => {
      if (!application.candidate_id) {
        throw new Error("Candidato inválido")
      }
      const conversationId = await getOrCreateConversation(application.candidate_id, jobId)
      router.push(`/dashboard/company/messages/${conversationId}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar el chat")
    },
  })

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-sm font-semibold bg-muted">
              {candidate?.full_name ? getInitials(candidate.full_name) : "?"}
            </AvatarFallback>
          </Avatar>

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold leading-tight">
                  {candidate?.full_name ?? "Candidato/a"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {candidate?.title ?? "—"}
                  {candidate?.location ? ` · ${candidate.location}` : ""}
                </p>
              </div>

              {/* Status dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-opacity ${statusCfg.className} ${isPending ? "opacity-60" : "hover:opacity-80 cursor-pointer"}`}
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    {statusCfg.label}
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {ALL_APPLICATION_STATUSES.filter((s) => s !== application.status).map(
                    (s) => (
                      <DropdownMenuItem key={s} onClick={() => changeStatus(s)}>
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${applicationStatusConfig[s].className}`}
                        />
                        {applicationStatusConfig[s].label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {candidate?.seniority && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {seniorityLabel[candidate.seniority] ?? candidate.seniority}
                </Badge>
              )}
              {candidate?.years_of_experience != null && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {candidate.years_of_experience}+ años
                </span>
              )}
              {candidate?.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {candidate.location}
                </span>
              )}
            </div>

            {/* Skills */}
            {candidate?.skills && candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.slice(0, 6).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs font-normal">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 6 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{candidate.skills.length - 6} más
                  </span>
                )}
              </div>
            )}

            {/* Cover letter */}
            {application.cover_letter && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Carta de presentación
                </p>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed border line-clamp-3">
                  {application.cover_letter}
                </p>
              </div>
            )}

            {/* Footer row */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                Aplicó el{" "}
                {new Date(application.applied_at).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="flex items-center gap-2">
                {candidate?.cv_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    asChild
                  >
                    <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver CV
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  disabled={isStartingChat}
                  onClick={() => contactCandidate()}
                >
                  {isStartingChat ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Inbox className="h-3.5 w-3.5" />
                  )}
                  Contactar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const JobDetails = ({ jobId }: { jobId: string }) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: COMPANY_JOB_WITH_APPLICATIONS_QUERY_KEY(jobId),
    queryFn: () => getJobWithApplications(jobId),
  })

  const { mutate: changeJobStatus, isPending: isChangingStatus } = useMutation({
    mutationFn: (status: JobPosting["status"]) => updateJobStatus(jobId, status),
    onSuccess: (_data, status) => {
      toast.success(`Búsqueda ${jobStatusConfig[status].label.toLowerCase()}`)
      queryClient.invalidateQueries({
        queryKey: COMPANY_JOB_WITH_APPLICATIONS_QUERY_KEY(jobId),
      })
      queryClient.invalidateQueries({ queryKey: JOB_POSTINGS_QUERY_KEY })
    },
    onError: () => {
      toast.error("No se pudo cambiar el estado")
    },
  })

  if (isLoading) return <JobDetailsSkeleton />

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <div>
          <p className="font-semibold">No se pudo cargar la búsqueda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Es posible que no tengas acceso o que haya sido eliminada.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Volver
        </Button>
      </div>
    )
  }

  const { job, applications } = data

  const salaryText =
    job.salary_min != null && job.salary_max != null
      ? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : job.salary_min != null
        ? `Desde ${job.currency} ${job.salary_min.toLocaleString()}`
        : null

  const currentStatus = jobStatusConfig[job.status]

  const applicationsByStatus = {
    applied: applications.filter((a) => a.status === "applied").length,
    reviewed: applications.filter((a) => a.status === "reviewed").length,
    contacted: applications.filter((a) => a.status === "contacted").length,
    hired: applications.filter((a) => a.status === "hired").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

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
        Volver a búsquedas
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
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
                {job.location && job.location_type !== "remote"
                  ? ` · ${job.location}`
                  : ""}
              </Badge>
            )}
            <Badge variant={currentStatus.variant} className="text-xs">
              {currentStatus.label}
            </Badge>
          </div>
        </div>

        {/* Job status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 shrink-0" disabled={isChangingStatus}>
              {isChangingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
              Cambiar estado
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {job.status !== "active" && (
              <DropdownMenuItem onClick={() => changeJobStatus("active")}>
                Activar búsqueda
              </DropdownMenuItem>
            )}
            {job.status !== "paused" && (
              <DropdownMenuItem onClick={() => changeJobStatus("paused")}>
                Pausar búsqueda
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {job.status !== "closed" && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => changeJobStatus("closed")}
              >
                Cerrar búsqueda
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Descripción del puesto</CardTitle>
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
                <CardTitle className="text-base">Habilidades requeridas</CardTitle>
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
                <CardTitle className="text-base">Habilidades deseables</CardTitle>
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalles</CardTitle>
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
                  <span>{job.years_required}+ años de experiencia</span>
                </div>
              )}
              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Publicado el{" "}
                  {new Date(job.created_at).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Applications summary */}
          {applications.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Resumen de postulaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(
                  [
                    ["applied", "Nuevas"],
                    ["reviewed", "En revisión"],
                    ["contacted", "Contactados/as"],
                    ["hired", "Contratados/as"],
                    ["rejected", "Rechazados/as"],
                  ] as [ApplicationStatus, string][]
                )
                  .filter(([key]) => applicationsByStatus[key] > 0)
                  .map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${applicationStatusConfig[key].className}`}
                      >
                        {applicationsByStatus[key]}
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator />

      {/* Applications list */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            Postulaciones
            {applications.length > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({applications.length})
              </span>
            )}
          </h2>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">Sin postulaciones aún</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los candidatos que se postulen aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                jobId={jobId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default JobDetails
