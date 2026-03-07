import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CandidateSidebar } from "@/components/dashboard/candidate/sidebar"

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("full_name, title")
    .eq("id", data.claims.sub)
    .single()

  if (!profile) redirect("/onboarding/candidate")

  return (
    <div className="flex min-h-screen">
      <CandidateSidebar
        fullName={profile.full_name}
        title={profile.title}
      />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
