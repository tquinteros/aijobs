"use server"

import { createClient } from "@/lib/supabase/server"
import type { PublicJobListing } from "@/lib/company"

export async function getPublicJobs(): Promise<PublicJobListing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("job_postings")
    .select(
      `
      *,
      company_profiles (company_name, industry, location)
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []) as PublicJobListing[]
}
