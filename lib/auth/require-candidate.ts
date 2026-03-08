import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "./require-auth"

export async function requireCandidate() {
  const session = await requireAuth()

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("full_name, title")
    .eq("id", session.userId)
    .single()

  if (!profile) {
    redirect("/onboarding/candidate")
  }

  return profile
}