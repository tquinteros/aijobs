"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import pdfParse from "pdf-parse"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { redis } from "@/lib/redis"
import OpenAI from "openai"
import { generateEmbedding, buildCandidateText } from "@/lib/ai/embeddings"
import { revalidatePath } from "next/cache"

export async function loginAsDemo(role: "candidate" | "company") {
  const supabase = await createClient()

  const credentials = {
    candidate: {
      email: "demo-candidate@hirematch.com",
      password: process.env.DEMO_CANDIDATE_PASSWORD!,
    },
    company: {
      email: "demo-recruiter@hirematch.com",
      password: process.env.DEMO_RECRUITER_PASSWORD!,
    },
  }

  const { error } = await supabase.auth.signInWithPassword(credentials[role])
  if (error) throw new Error("Demo login failed")

  redirect(role === "candidate" ? "/dashboard/candidate" : "/dashboard/company")
}