import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "./require-auth"

export async function requireCompany() {
  const session = await requireAuth()

  const supabase = await createClient()

  const { data: company } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("id", session.userId)
    .single()

  if (!company) {
    redirect("/onboarding/company")
  }

  return company
}