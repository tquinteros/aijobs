"use client"

import { useQuery } from "@tanstack/react-query"
import { getCandidateApplications } from "@/lib/actions/job"
import type { CandidateApplicationWithJob } from "@/lib/company"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase, CalendarClock, MapPin } from "lucide-react"
import Link from "next/link"

function ApplicationsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function statusLabel(status: CandidateApplicationWithJob["status"]) {
  switch (status) {
    case "applied":
      return "Postulado"
    case "reviewed":
      return "En revisión"
    case "contacted":
      return "Contactado"
    case "rejected":
      return "Rechazado"
    case "hired":
      return "Contratado"
    default:
      return status
  }
}

function statusVariant(status: CandidateApplicationWithJob["status"]): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "applied":
      return "secondary"
    case "reviewed":
    case "contacted":
      return "default"
    case "rejected":
      return "destructive"
    case "hired":
      return "outline"
    default:
      return "secondary"
  }
}

export default function ApplicationsCandidate({ initialApplications }: { initialApplications: CandidateApplicationWithJob[] }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidateApplications"],
    queryFn: getCandidateApplications,
    initialData: initialApplications,
  })

  if (isLoading) return <ApplicationsSkeleton />

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        No se pudieron cargar tus postulaciones. Intentá recargar la página.
      </p>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Todavía no te postulaste a ningún empleo. Explora las oportunidades en la pestaña{" "}
        <Link href="/dashboard/candidate/jobs" className="text-primary underline-offset-2 hover:underline">
          Empleos
        </Link>.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((app) => {
        const job = app.job_postings
        if (!job) return null
        const company = job.company_profiles
        const appliedDate = new Date(app.applied_at).toLocaleDateString("es-AR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })

        return (
          <Card key={app.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  {job.title}
                </CardTitle>
                {company && (
                  <p className="text-sm text-muted-foreground">
                    {company.company_name}
                    {company.location ? ` · ${company.location}` : ""}
                  </p>
                )}
              </div>
              <Badge variant={statusVariant(app.status)}>
                {statusLabel(app.status)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Postulado el {appliedDate}</span>
              </div>
              {job.location_type && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {job.location_type === "remote" && "Remoto"}
                    {job.location_type === "hybrid" && "Híbrido"}
                    {job.location_type === "onsite" && "Presencial"}
                    {job.location ? ` · ${job.location}` : ""}
                  </span>
                </div>
              )}
              {job.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {job.required_skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {job.required_skills.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{job.required_skills.length - 4} más
                    </span>
                  )}
                </div>
              )}
              <div className="pt-2">
                <Link
                  href={`/dashboard/candidate/jobs/${job.id}`}
                  className="text-xs text-primary font-medium hover:underline underline-offset-2"
                >
                  Ver detalle del empleo
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}