import { createClient } from "@/lib/supabase/server"

export async function getSession() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    return null
  }

  return {
    userId: data.claims.sub,
    email: data.claims.email
  }
}