"use client"

import { useQuery } from "@tanstack/react-query"
import { getCompanyProfile } from "@/lib/actions/company"
import type { CompanyProfile } from "@/lib/company"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { EditCompanyProfileSheet } from "./edit-profile-sheet"
import { MapPin, Globe, Building2, AlertCircle } from "lucide-react"

function SummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
  )
}

export function CompanyProfileSummary({ initialProfile }: { initialProfile: CompanyProfile }) {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["companyProfile"],
    queryFn: getCompanyProfile,
    initialData: initialProfile,
  })

  if (isLoading) return <SummarySkeleton />

  if (isError || !profile) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 rounded-lg border border-destructive/30 bg-destructive/10">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">No se pudo cargar el perfil de empresa. Intentá recargar la página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{profile.company_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              {profile.industry && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {profile.industry}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
          <EditCompanyProfileSheet profile={profile} />
        </div>
      </div>

      {/* Description */}
      {profile.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Descripción de la empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {profile.industry && (
              <Badge variant="secondary">
                {profile.industry}
              </Badge>
            )}
            {profile.location && (
              <Badge variant="outline">
                {profile.location}
              </Badge>
            )}
          </div>

          {profile.updated_at && (
            <>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                Perfil actualizado el{" "}
                {new Date(profile.updated_at).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

