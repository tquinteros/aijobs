// app/api/parse-cv/route.ts
import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { cvText } = await request.json()

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "El texto del CV es muy corto o está vacío" },
        { status: 400 }
      )
    }

    const response = await openai.chat.completions.create({
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
          - unknown: no hay suficiente información
          
          FORMATO DE RESPUESTA:
          {
            "skills": ["React", "TypeScript"],
            "seniority": "mid",
            "years_of_experience": 4,
            "education": "Autodidacta / CoderHouse",
            "languages": ["Español", "Inglés avanzado"],
            "job_titles": ["Fullstack Developer"],
            "summary": "Resumen breve generado por vos",
            "raw_text_quality": "good"
          }`
        },
        {
          role: "user",
          content: `Parseá este CV y devolvé SOLO el JSON:\n\n${cvText}`
        }
      ]
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error("OpenAI no devolvió respuesta")

    const parsed = JSON.parse(content)
    return NextResponse.json({ success: true, data: parsed })

  } catch (error) {
    console.error("Error parsing CV:", error)
    return NextResponse.json(
      { error: "Error al procesar el CV" },
      { status: 500 }
    )
  }
}