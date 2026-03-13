"use client"

import { useQuery } from "@tanstack/react-query"
import { getCandidateProfile, type CandidateProfile } from "@/lib/actions/candidate"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Briefcase,
  Clock,
  Languages,
  GraduationCap,
  Sparkles,
  FileCheck,
  AlertCircle,
} from "lucide-react"
import { EditProfileSheet } from "./edit-profile-sheet"

const senioryLabel: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead / Staff",
  unknown: "Sin determinar",
}

const senioryColor: Record<string, string> = {
  junior: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  mid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  senior: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  lead: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  unknown: "bg-muted text-muted-foreground",
}

function toLanguageList(languages: CandidateProfile["cv_parsed"] extends null ? never : NonNullable<CandidateProfile["cv_parsed"]>["languages"]): string[] {
  if (!languages) return []
  if (Array.isArray(languages)) {
    return languages.map((item) => {
      if (typeof item === "string") return item
      if (typeof item === "object" && item !== null && "language" in item) {
        const o = item as { language: string; level?: string }
        return o.level ? `${o.language} (${o.level})` : o.language
      }
      return String(item)
    })
  }
  return Object.entries(languages).map(([lang, level]) => `${lang} (${level})`)
}

function toEducationList(education: NonNullable<CandidateProfile["cv_parsed"]>["education"]): string[] {
  if (!education) return []

  const formatItem = (item: unknown): string => {
    if (typeof item === "string") return item
    if (typeof item === "object" && item !== null) {
      const values = Object.values(item as Record<string, unknown>).filter(Boolean)
      return values.map(String).join(" · ")
    }
    return String(item)
  }

  if (Array.isArray(education)) {
    return education.map(formatItem)
  }

  return [formatItem(education)]
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
      <div className="p-2 rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}

export function ProfileSummary({ initialProfile }: { initialProfile: CandidateProfile }) {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["candidateProfile"],
    queryFn: getCandidateProfile,
    initialData: initialProfile,
  })

  console.log(profile, "profile")

  if (isLoading) return <SummarySkeleton />

  if (isError || !profile) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 rounded-lg border border-destructive/30 bg-destructive/10">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">Could not load the profile. Please try reloading the page.</p>
      </div>
    )
  }

  const parsed = profile.cv_parsed
  const languages = parsed ? toLanguageList(parsed.languages) : profile.languages
  const education = parsed ? toEducationList(parsed.education) : []
  const seniority = profile.seniority ?? "unknown"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${senioryColor[seniority]}`}>
              {senioryLabel[seniority]}
            </span>
          </div>
          <EditProfileSheet profile={profile} />
        </div>
        <p className="text-muted-foreground mt-1">{profile.title}</p>
        {profile.location && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {profile.location}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Clock}
          label="Experience"
          value={profile.years_of_experience != null ? `${profile.years_of_experience} years` : "No data"}
        />
        <StatCard
          icon={Briefcase}
          label="Experience Level"
          value={senioryLabel[seniority]}
        />
        <StatCard
          icon={Languages}
          label="Languages"
          value={languages.length > 0 ? `${languages.length} language${languages.length > 1 ? "s" : ""}` : "No data"}
        />
        <StatCard
          icon={FileCheck}
          label="CV"
          value={profile.cv_url ? "Uploaded" : "Not uploaded"}
        />
      </div>

      {/* Bio / Summary */}
      {(parsed?.summary || profile.bio) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {parsed?.summary ? "AI generated summary" : "Bio"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed?.summary ?? profile.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Technical skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Languages & Education */}
      <div className="grid md:grid-cols-2 gap-4">
        {languages.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {languages.map((lang, i) => (
                <div key={`lang-${i}-${lang}`} className="text-sm text-muted-foreground">{lang}</div>
              ))}
            </CardContent>
          </Card>
        )}

        {education.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {education.map((ed, i) => (
                <div key={`edu-${i}-${ed}`} className="text-sm text-muted-foreground">{ed}</div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Job titles */}
      {parsed?.job_titles && parsed.job_titles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Previous roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {parsed.job_titles.map((title) => (
                <Badge key={title} variant="outline">{title}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profile.cv_parsed_at && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            CV analyzed on{" "}
            {new Date(profile.cv_parsed_at).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </>
      )}
    </div>
  )
}
