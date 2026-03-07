// lib/ai/embeddings.ts
import OpenAI from "openai"

const openai = new OpenAI()

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })
  return response.data[0].embedding
}

// Texto representativo del candidato para el embedding
export function buildCandidateText(parsedCV: {
  skills?: string[]
  seniority?: string
  years_of_experience?: number
  job_titles?: string[]
  summary?: string
}): string {
  return [
    parsedCV.skills?.length ? `Skills: ${parsedCV.skills.join(", ")}` : "",
    parsedCV.seniority ? `Seniority: ${parsedCV.seniority}` : "",
    parsedCV.years_of_experience ? `Years of experience: ${parsedCV.years_of_experience}` : "",
    parsedCV.job_titles?.length ? `Titles: ${parsedCV.job_titles.join(", ")}` : "",
    parsedCV.summary ? `Summary: ${parsedCV.summary}` : "",
  ].filter(Boolean).join("\n").trim()
}

// Texto representativo de la oferta para el embedding
export function buildJobText(job: {
  title: string
  description: string
  required_skills?: string[]
  nice_to_have_skills?: string[]
  seniority_required?: string
  years_required?: number
}): string {
  return [
    `Title: ${job.title}`,
    job.required_skills?.length ? `Required skills: ${job.required_skills.join(", ")}` : "",
    job.nice_to_have_skills?.length ? `Nice to have: ${job.nice_to_have_skills.join(", ")}` : "",
    job.seniority_required ? `Seniority: ${job.seniority_required}` : "",
    job.years_required ? `Years required: ${job.years_required}` : "",
    `Description: ${job.description}`,
  ].filter(Boolean).join("\n").trim()
}