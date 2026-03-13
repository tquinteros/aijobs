"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import pdfParse from "pdf-parse"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { redis } from "@/lib/redis"
import OpenAI from "openai"
import { generateEmbedding, buildCandidateText } from "@/lib/ai/embeddings"
import { revalidatePath } from "next/cache"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type CandidateProfile = {
  id: string
  full_name: string
  title: string
  location: string
  bio: string
  cv_url: string | null
  cv_raw_text: string | null
  cv_parsed: {
    skills: string[]
    seniority: string
    years_of_experience: number | null
    education: string | string[]
    languages: Record<string, string> | string[]
    job_titles: string[]
    summary: string
    raw_text_quality: string
  } | null
  cv_parsed_at: string | null
  skills: string[]
  seniority: string | null
  years_of_experience: number | null
  languages: string[]
  updated_at: string
}

export async function getCandidateProfile(): Promise<CandidateProfile> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: profile, error: profileError } = await supabase
    .from("candidate_profiles")
    .select(
      "id, full_name, title, location, bio, cv_url, cv_parsed, cv_parsed_at, skills, seniority, years_of_experience, languages, updated_at",
    )
    .eq("id", data.claims.sub)
    .single()

  if (profileError) throw new Error(profileError.message)
  if (!profile) redirect("/onboarding/candidate")

  return profile as CandidateProfile
}
export async function createCandidateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { error: insertError } = await supabase
    .from("candidate_profiles")
    .insert({
      id: data.claims.sub,
      full_name: formData.get("full_name") as string,
      title: formData.get("title") as string,
      location: formData.get("location") as string,
      bio: formData.get("bio") as string,
    })

  if (insertError) throw new Error(insertError.message)

  redirect("/onboarding/candidate/cv")
}

export async function uploadAndParseCV(formData: FormData) {
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")
  const userId = data.claims.sub

  // 1.b Limitar cambios de CV a una vez cada 24hs
  const { data: existingProfile } = await supabase
    .from("candidate_profiles")
    .select("cv_parsed_at")
    .eq("id", userId)
    .single()

  if (existingProfile?.cv_parsed_at) {
    const lastParsed = new Date(existingProfile.cv_parsed_at)
    const now = new Date()
    const diffMs = now.getTime() - lastParsed.getTime()
    const HOURS_24 = 24 * 60 * 60 * 1000

    if (diffMs < HOURS_24) {
      throw new Error("Solo podés actualizar tu CV una vez cada 24 horas.")
    }
  }

  // 2. Obtener archivo
  const file = formData.get("cv") as File
  if (!file || file.size === 0) throw new Error("No se recibió ningún archivo")
  if (file.type !== "application/pdf") throw new Error("El archivo debe ser PDF")
  if (file.size > 5 * 1024 * 1024) throw new Error("El archivo no puede superar 5MB")

  // 3. Extraer texto del PDF
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const pdfData = await pdfParse(buffer)
  const cvText = pdfData.text

  if (!cvText || cvText.trim().length < 50) {
    throw new Error("No se pudo extraer texto del PDF. Probá con otro archivo.")
  }

  // 4. Subir PDF a Supabase Storage
  const filePath = `${userId}/cv.pdf`
  const { error: uploadError } = await supabaseAdmin.storage
    .from("aijobs-cv")
    .upload(filePath, file, {
      contentType: "application/pdf",
      upsert: true,
    })
  // .upload(filePath, buffer, {
  //   contentType: "application/pdf",
  //   upsert: true, // sobreescribe si ya existe
  // })

  if (uploadError) throw new Error(`Error subiendo archivo: ${uploadError.message}`)

  // 5. Obtener URL pública del archivo
  const { data: urlData } = supabaseAdmin.storage
    .from("aijobs-cv")
    .getPublicUrl(filePath)

  // 6. Parsear el CV con OpenAI directamente
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional CV parser. Extract structured information from CVs in any format, language, or quality.
      
      RULES:
      - Return ONLY valid JSON with exactly these keys:
        skills, seniority, years_of_experience, education, languages, job_titles, summary, raw_text_quality
      - If you cannot determine a value, use null (never invent data)
      - For seniority use exactly one of: "junior", "mid", "senior", "lead", "unknown"
      - For skills: normalize names (e.g. "React.js" → "React", "NodeJS" → "Node.js", "Tailwind" → "Tailwind CSS")
      - For job_titles: always normalize to English (e.g. "Diseñador Gráfico" → "Graphic Designer", "Desarrollador Full-stack" → "Full-stack Developer")
      - For years_of_experience: calculate the real total as an integer
      - For languages: return as array of strings (e.g. ["Spanish (Native)", "English (Advanced)"])
      - If text is corrupted or poorly formatted, extract what you can and mark raw_text_quality as "poor", otherwise "good"
      
      SENIORITY CRITERIA:
      - junior: 0-2 years or no real work experience
      - mid: 2-5 years
      - senior: 5-8 years
      - lead: 8+ years or mentions team management
      - unknown: not enough information
      
      RESPONSE FORMAT:
      {
        "skills": ["React", "TypeScript"],
        "seniority": "mid",
        "years_of_experience": 4,
        "education": "CoderHouse — JavaScript & React",
        "languages": ["Spanish (Native)", "English (Advanced)"],
        "job_titles": ["Full-stack Developer"],
        "summary": "Brief professional summary in English",
        "raw_text_quality": "good"
      }`
      },
      {
        role: "user",
        content: `Parseá este CV y devolvé SOLO el JSON:\n\n${cvText}`,
      },
    ],
  })

  const content = aiResponse.choices[0].message.content
  if (!content) throw new Error("OpenAI no devolvió respuesta")
  const parsedCV = JSON.parse(content)

  const toArray = (val: unknown): string[] =>
    Array.isArray(val) ? val.map(String) : []

  // 7. Guardar todo en candidate_profiles
  const { error: updateError } = await supabase
    .from("candidate_profiles")
    .update({
      cv_url: urlData.publicUrl,
      cv_raw_text: cvText,
      cv_parsed: parsedCV,
      cv_parsed_at: new Date().toISOString(),
      skills: toArray(parsedCV.skills),
      seniority: parsedCV.seniority ?? null,
      years_of_experience: parsedCV.years_of_experience ?? null,
      languages: toArray(parsedCV.languages),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) throw new Error(`Error guardando perfil: ${updateError.message}`)

  // 8. Generar y guardar embedding del candidato
  const candidateText = buildCandidateText(parsedCV)
  const embedding = await generateEmbedding(candidateText)

  const { error: embeddingError } = await supabase
    .from("candidate_profiles")
    .update({ embedding })
    .eq("id", userId)

  if (embeddingError) throw new Error(`Error guardando embedding: ${embeddingError.message}`)

  // 9. Invalidar cache de matches personalizados y borrar matches persistidos
  const cacheKey = `jobs:vector:${userId}`
  try {
    await redis.del(cacheKey)
  } catch (e) {
    console.error("[candidate] Error borrando cache Redis de matches:", e)
  }

  try {
    await supabase
      .from("candidate_job_matches")
      .delete()
      .eq("candidate_id", userId)
  } catch (e) {
    console.error("[candidate] Error borrando candidate_job_matches:", e)
  }
  revalidatePath("/dashboard/candidate")
}

export async function updateCandidateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const userId = auth.claims.sub

  const skillsRaw = formData.get("skills") as string
  const skills = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const yearsRaw = formData.get("years_of_experience") as string

  const updates = {
    full_name: formData.get("full_name") as string,
    title: formData.get("title") as string,
    bio: formData.get("bio") as string,
    location: formData.get("location") as string,
    seniority: formData.get("seniority") as string,
    years_of_experience: yearsRaw ? parseInt(yearsRaw) : null,
    skills,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from("candidate_profiles")
    .update(updates)
    .eq("id", userId)

  if (error) throw new Error(error.message)

  const embeddingInput = {
    skills: updates.skills,
    seniority: updates.seniority,
    years_of_experience: updates.years_of_experience ?? 0,
    job_titles: [updates.title],
  }

  const text = buildCandidateText(embeddingInput)
  const embedding = await generateEmbedding(text)

  const { error: embeddingError } = await supabase
    .from("candidate_profiles")
    .update({ embedding })
    .eq("id", userId)

  if (embeddingError) throw new Error(`Error actualizando embedding: ${embeddingError.message}`)

  try {
    await redis.del(`jobs:vector:${userId}`)
  } catch (e) {
    console.error(e)
  }

  await supabase.from("matches").delete().eq("candidate_id", userId)

  revalidatePath("/dashboard/candidate")
}