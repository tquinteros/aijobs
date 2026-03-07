// lib/profile.ts
import { createClient } from "@/lib/supabase/server"

export async function getCandidateProfile() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return data // null si no existe todavía
}