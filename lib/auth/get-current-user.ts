import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

export type UserRole = "candidate" | "company"

export type CurrentUser = {
  id: string
  role: UserRole | null
} | null

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient()

  const { data: claimsData, error } = await supabase.auth.getClaims()

  if (error || !claimsData?.claims?.sub) {
    return null
  }

  const userId = claimsData.claims.sub

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (!profile) {
    return { id: userId, role: null }
  }

  return {
    id: userId,
    role: profile.role,
  }
})