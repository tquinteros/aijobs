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
}): string {
  // Skills repetidas 3x para darles más peso semántico
  const skillsLine = parsedCV.skills?.length
    ? Array(3).fill(`Skills: ${parsedCV.skills.join(", ")}`).join("\n")
    : ""

  return [
    skillsLine,
    parsedCV.job_titles?.length ? `Titles: ${parsedCV.job_titles.join(", ")}` : "",
    parsedCV.seniority ? `Seniority: ${parsedCV.seniority}` : "",
    parsedCV.years_of_experience != null ? `Years of experience: ${parsedCV.years_of_experience}` : "",
  ].filter(Boolean).join("\n").trim()
}

export function buildJobText(job: {
  title: string
  description: string
  required_skills?: string[]
  nice_to_have_skills?: string[]
  seniority_required?: string
  years_required?: number
}): string {
  const requiredSkillsLine = job.required_skills?.length
    ? Array(3).fill(`Required skills: ${job.required_skills.join(", ")}`).join("\n")
    : ""

  return [
    `Title: ${job.title}`,
    requiredSkillsLine,
    job.nice_to_have_skills?.length ? `Nice to have: ${job.nice_to_have_skills.join(", ")}` : "",
    job.seniority_required ? `Seniority: ${job.seniority_required}` : "",
    job.years_required != null ? `Years required: ${job.years_required}` : "",
  ].filter(Boolean).join("\n").trim()
}