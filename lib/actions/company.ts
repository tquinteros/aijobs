"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type {
  CompanyProfile,
  JobPosting,
  JobApplicationForCompany,
  ApplicationStatus,
  MatchDetail,
  MatchBreakdown,
} from "@/lib/company"
import { buildJobText, generateEmbedding } from "../ai/embeddings"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { redis } from "../redis"
import { revalidatePath } from "next/cache"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function createCompanyProfile(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { error: insertError } = await supabase.from("company_profiles").insert({
    id: data.claims.sub,
    company_name: formData.get("company_name") as string,
    industry: formData.get("industry") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
    website: (formData.get("website") as string) || null,
  })

  if (insertError) throw new Error(insertError.message)

  redirect("/dashboard/company")
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: profile, error: profileError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", data.claims.sub)
    .single()

  if (profileError) throw new Error(profileError.message)
  if (!profile) redirect("/onboarding/company")

  return profile as CompanyProfile
}

const LOGO_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"]

function getLogoExtension(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export async function updateCompanyProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const userId = auth.claims.sub

  let logoUrl: string | null | undefined = undefined

  const logoFile = formData.get("logo") as File | null
  if (logoFile && logoFile.size > 0) {
    if (!LOGO_TYPES.includes(logoFile.type))
      throw new Error("Logo must be JPEG, PNG or WebP")
    if (logoFile.size > LOGO_MAX_SIZE)
      throw new Error("Logo must be under 2MB")
    const ext = getLogoExtension(logoFile.type)
    const filePath = `company/${userId}/logo.${ext}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from("aijobs-cv")
      .upload(filePath, logoFile, {
        contentType: logoFile.type,
        upsert: true,
      })
    if (uploadError) throw new Error(`Error uploading logo: ${uploadError.message}`)
    const { data: urlData } = supabaseAdmin.storage
      .from("aijobs-cv")
      .getPublicUrl(filePath)
    logoUrl = urlData.publicUrl
  }

  const updates: Record<string, unknown> = {
    company_name: formData.get("company_name") as string,
    website: ((formData.get("website") as string) || null) as string | null,
    description: (formData.get("description") as string) || null,
    location: (formData.get("location") as string) || null,
    industry: (formData.get("industry") as string) || null,
    updated_at: new Date().toISOString(),
  }
  if (logoUrl !== undefined) updates.logo_url = logoUrl

  const { error } = await supabase
    .from("company_profiles")
    .update(updates)
    .eq("id", userId)

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/company")
}

export async function getJobPostings(): Promise<JobPosting[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: jobs, error: jobsError } = await supabase
    .from("job_postings")
    .select("*")
    .eq("company_id", data.claims.sub)
    .order("created_at", { ascending: false })

  if (jobsError) throw new Error(jobsError.message)

  return (jobs ?? []) as JobPosting[]
}

export async function createJobPosting(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const toSkillsArray = (val: string | null): string[] =>
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : []

  const salaryMin = formData.get("salary_min") as string
  const salaryMax = formData.get("salary_max") as string
  const yearsRequired = formData.get("years_required") as string

  const jobData = {
    company_id: data.claims.sub,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    location_type: (formData.get("location_type") as string) || null,
    location: (formData.get("location") as string) || null,
    salary_min: salaryMin ? parseInt(salaryMin) : null,
    salary_max: salaryMax ? parseInt(salaryMax) : null,
    currency: (formData.get("currency") as string) || "USD",
    seniority_required: (formData.get("seniority_required") as string) || null,
    years_required: yearsRequired ? parseInt(yearsRequired) : null,
    required_skills: toSkillsArray(formData.get("required_skills") as string),
    nice_to_have_skills: toSkillsArray(formData.get("nice_to_have_skills") as string),
    status: "active",
  }

  // 1. Insertar la oferta
  const { data: insertedJob, error: insertError } = await supabase
    .from("job_postings")
    .insert(jobData)
    .select()
    .single()

  if (insertError) throw new Error(insertError.message)

  // 2. Generar y guardar embedding de la oferta
  const jobText = buildJobText({
    title: jobData.title,
    description: jobData.description,
    required_skills: jobData.required_skills,
    nice_to_have_skills: jobData.nice_to_have_skills,
    seniority_required: jobData.seniority_required as string,
    years_required: jobData.years_required as number,
  })
  const embedding = await generateEmbedding(jobText)

  const { error: embeddingError } = await supabase
    .from("job_postings")
    .update({ embedding })
    .eq("id", insertedJob.id)

  if (embeddingError) throw new Error(`Error guardando embedding: ${embeddingError.message}`)

  try {
    const keys = await redis.keys("jobs:vector:*")
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    console.log("[jobs] Cache invalidado por nuevo job:", keys.length, "keys borradas")
  } catch (e) {
    console.error("[jobs] Error invalidando cache:", e)
  }
  revalidatePath("/jobs")
  revalidatePath("/dashboard/company")
}

export async function updateJobPosting(jobId: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const toSkillsArray = (val: string | null): string[] =>
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : []

  const salaryMin = formData.get("salary_min") as string
  const salaryMax = formData.get("salary_max") as string
  const yearsRequired = formData.get("years_required") as string

  const jobData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    location_type: (formData.get("location_type") as string) || null,
    location: (formData.get("location") as string) || null,
    salary_min: salaryMin ? parseInt(salaryMin) : null,
    salary_max: salaryMax ? parseInt(salaryMax) : null,
    currency: (formData.get("currency") as string) || "USD",
    seniority_required: (formData.get("seniority_required") as string) || null,
    years_required: yearsRequired ? parseInt(yearsRequired) : null,
    required_skills: toSkillsArray(formData.get("required_skills") as string),
    nice_to_have_skills: toSkillsArray(formData.get("nice_to_have_skills") as string),
    updated_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from("job_postings")
    .update(jobData)
    .eq("id", jobId)
    .eq("company_id", data.claims.sub)

  if (updateError) throw new Error(updateError.message)

  const jobText = buildJobText({
    title: jobData.title,
    description: jobData.description,
    required_skills: jobData.required_skills,
    nice_to_have_skills: jobData.nice_to_have_skills,
    seniority_required: jobData.seniority_required as string,
    years_required: jobData.years_required as number,
  })
  const embedding = await generateEmbedding(jobText)

  const { error: embeddingError } = await supabase
    .from("job_postings")
    .update({ embedding })
    .eq("id", jobId)

  if (embeddingError) throw new Error(`Error saving embedding: ${embeddingError.message}`)

  try {
    const keys = await redis.keys("jobs:vector:*")
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    console.log("[jobs] Cache invalidated after job update:", keys.length, "keys deleted")
  } catch (e) {
    console.error("[jobs] Error invalidating cache:", e)
  }

  revalidatePath("/jobs")
  revalidatePath("/dashboard/company")
}

export async function updateJobStatus(
  jobId: string,
  status: JobPosting["status"]
): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { error: updateError } = await supabase
    .from("job_postings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("company_id", data.claims.sub)

  if (updateError) throw new Error(updateError.message)
}

export async function getJobWithApplications(jobId: string): Promise<{
  job: JobPosting
  applications: JobApplicationForCompany[]
}> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: job, error: jobError } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", jobId)
    .eq("company_id", data.claims.sub)
    .single()

  if (jobError || !job) throw new Error("Job not found or unauthorized")

  const { data: rawApplications, error: appError } = await supabase
    .from("applications")
    .select("id, candidate_id, status, cover_letter, applied_at, updated_at, match_id")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false })

  if (appError) throw new Error(appError.message)

  const apps = rawApplications ?? []
  const candidateIds = apps.map((a) => a.candidate_id)

  const profileMap: Record<string, JobApplicationForCompany["candidate_profiles"]> = {}
  const matchMap: Record<string, { score: number, breakdown: MatchBreakdown, strengths: string[], gaps: string[], explanation: string, recommendation: "strong_yes" | "yes" | "maybe" | "no" } | null> = {}

  if (candidateIds.length > 0) {
    // Fetch profiles
    const { data: profiles } = await supabaseAdmin
      .from("candidate_profiles")
      .select("id, full_name, title, location, seniority, years_of_experience, skills, languages, cv_url")
      .in("id", candidateIds)

    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }

    // Fetch matches para este job
    const { data: matches } = await supabaseAdmin
      .from("matches")
      .select("candidate_id, score, breakdown, strengths, gaps, explanation, recommendation")
      .eq("job_id", jobId)
      .in("candidate_id", candidateIds)

    for (const m of matches ?? []) {
      matchMap[m.candidate_id] = { score: m.score, breakdown: m.breakdown, strengths: m.strengths, gaps: m.gaps, explanation: m.explanation, recommendation: m.recommendation }
    }
  }

  const applications: JobApplicationForCompany[] = apps
    .map((app) => ({
      ...app,
      candidate_profiles: profileMap[app.candidate_id] ?? null,
      match: matchMap[app.candidate_id] ?? null,
    }))
    // Ordenar: con score primero (descendente), sin score al final
    .sort((a, b) => {
      if (a.match && b.match) return b.match.score - a.match.score
      if (a.match) return -1
      if (b.match) return 1
      return 0
    })

  return {
    job: job as JobPosting,
    applications,
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  jobId: string,
  status: ApplicationStatus
): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: job } = await supabase
    .from("job_postings")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", data.claims.sub)
    .single()

  if (!job) throw new Error("Unauthorized")

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("job_id", jobId)

  if (updateError) throw new Error(updateError.message)
}

// lib/actions/company.ts — agregar
export async function generateMatchScore(
  candidateId: string,
  jobId: string,
  applicationId: string
): Promise<number> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")

  const { data: job } = await supabaseAdmin
    .from("job_postings")
    .select("embedding")
    .eq("id", jobId)
    .single()

  if (!job?.embedding) throw new Error("Job sin embedding")

  const { data: candidate } = await supabaseAdmin
    .from("candidate_profiles")
    .select("embedding")
    .eq("id", candidateId)
    .single()

  if (!candidate?.embedding) throw new Error("Candidato sin embedding")

  const parseEmbedding = (val: unknown): number[] => {
    if (Array.isArray(val)) return val
    if (typeof val === "string") return JSON.parse(val)
    throw new Error("Formato de embedding inválido")
  }

  const a = parseEmbedding(job.embedding)
  const b = parseEmbedding(candidate.embedding)
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  const score = Math.round((dot / (magA * magB)) * 100)

  // Guardar en matches (upsert por si ya existe)
  const { data: match } = await supabase
    .from("matches")
    .upsert(
      { candidate_id: candidateId, job_id: jobId, score, calculated_at: new Date().toISOString() },
      { onConflict: "candidate_id,job_id" }
    )
    .select("id")
    .single()

  // Vincular match_id en la application
  if (match?.id) {
    await supabase
      .from("applications")
      .update({ match_id: match.id })
      .eq("id", applicationId)
  }

  return score
}


export async function generateMatchDetail(
  candidateId: string,
  jobId: string,
  applicationId: string
): Promise<MatchDetail> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")

  // Verificar ownership
  const { data: jobOwnership } = await supabase
    .from("job_postings")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", auth.claims.sub)
    .single()

  if (!jobOwnership) throw new Error("Unauthorized")

  // Si ya existe el análisis completo, devolverlo sin llamar a OpenAI
  const { data: existingMatch } = await supabaseAdmin
    .from("matches")
    .select("score, breakdown, strengths, gaps, explanation, recommendation")
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId)
    .not("explanation", "is", null)
    .single()

  if (existingMatch?.explanation) {
    return existingMatch as MatchDetail
  }

  // Traer datos completos del candidato y del job
  const [{ data: candidate }, { data: job }] = await Promise.all([
    supabaseAdmin
      .from("candidate_profiles")
      .select("full_name, title, seniority, years_of_experience, skills, cv_parsed, embedding")
      .eq("id", candidateId)
      .single(),
    supabaseAdmin
      .from("job_postings")
      .select("title, description, seniority_required, years_required, required_skills, nice_to_have_skills, embedding")
      .eq("id", jobId)
      .single(),
  ])

  if (!candidate || !job) throw new Error("Candidate or job not found")

  // Calcular score si no existe todavía
  const parseEmbedding = (val: unknown): number[] => {
    if (Array.isArray(val)) return val
    if (typeof val === "string") return JSON.parse(val)
    throw new Error("Invalid embedding format")
  }

  const a = parseEmbedding(job.embedding)
  const b = parseEmbedding(candidate.embedding)
  const dot = a.reduce((sum: number, val: number, i: number) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum: number, val: number) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum: number, val: number) => sum + val * val, 0))
  const score = Math.round((dot / (magA * magB)) * 100)

  // Llamar a GPT para el análisis detallado
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert technical recruiter. Analyze the compatibility between a candidate and a job posting.

Return ONLY valid JSON with exactly this structure:
{
  "breakdown": {
    "technical_skills": <0-100>,
    "experience_level": <0-100>,
    "education": <0-100>
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "gaps": ["<specific gap 1>", "<specific gap 2>"],
  "explanation": "<2-3 sentence summary of the overall match>",
  "recommendation": "<strong_yes|yes|maybe|no>"
}

RULES:
- breakdown scores should reflect the partial match for each dimension
- strengths: specific matches between candidate skills and job requirements (max 4)
- gaps: specific missing requirements (max 3, empty array if none)
- explanation: concise, factual, professional tone
- recommendation criteria:
  * strong_yes: score >= 75, strong skill match
  * yes: score >= 60, good overall fit
  * maybe: score >= 45, partial match with notable gaps
  * no: score < 45, significant misalignment`,
      },
      {
        role: "user",
        content: `CANDIDATE:
Name: ${candidate.full_name}
Title: ${candidate.title}
Seniority: ${candidate.seniority}
Years of experience: ${candidate.years_of_experience}
Skills: ${candidate.skills?.join(", ")}
CV Summary: ${(candidate.cv_parsed as { summary?: string })?.summary ?? "N/A"}

JOB:
Title: ${job.title}
Seniority required: ${job.seniority_required}
Years required: ${job.years_required}+
Required skills: ${job.required_skills?.join(", ")}
Nice to have: ${job.nice_to_have_skills?.join(", ") ?? "None"}
Description: ${job.description?.slice(0, 500)}

Overall compatibility score: ${score}%

Analyze this match and return the JSON.`,
      },
    ],
  })

  const content = aiResponse.choices[0].message.content
  if (!content) throw new Error("OpenAI returned no response")

  const analysis = JSON.parse(content)

  // Guardar todo en matches
  const { data: match } = await supabaseAdmin
    .from("matches")
    .upsert(
      {
        candidate_id: candidateId,
        job_id: jobId,
        score,
        breakdown: analysis.breakdown,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        explanation: analysis.explanation,
        recommendation: analysis.recommendation,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id,job_id" }
    )
    .select("id")
    .single()

  if (match?.id) {
    await supabaseAdmin
      .from("applications")
      .update({ match_id: match.id })
      .eq("id", applicationId)
  }

  return { score, ...analysis } as MatchDetail
}