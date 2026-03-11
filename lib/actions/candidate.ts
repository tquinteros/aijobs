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
    .select("*")
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
        content: `Eres un parser de CVs profesional. Extraé información estructurada 
        de CVs en cualquier formato, idioma o calidad.
        
        REGLAS:
        - Devolvé SOLO JSON válido con exactamente estas keys:
          skills, seniority, years_of_experience, education, languages, job_titles, summary, raw_text_quality
        - Si no podés determinar un valor, usá null (nunca inventes datos)
        - Para seniority usá exactamente uno de: "junior", "mid", "senior", "lead", "unknown"
        - Para skills: normalizá nombres (ej: "React.js" → "React", "NodeJS" → "Node.js")
        - Para years_of_experience: calculá el total real como número entero
        - Si el texto está corrupto o mal formateado, extraé lo que puedas 
          y marcá raw_text_quality como "poor", sino "good"
        - Detectá el idioma automáticamente
        
        CRITERIOS DE SENIORITY:
        - junior: 0-2 años o sin experiencia laboral real
        - mid: 2-5 años
        - senior: 5-8 años
        - lead: 8+ años o menciona gestión de equipos
        - unknown: no hay suficiente información`,
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
  redirect("/dashboard/candidate")
}

export async function updateCVAndRefreshMatches(formData: FormData) {
  await uploadAndParseCV(formData)
}