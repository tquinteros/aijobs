import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompanySidebar } from "@/components/dashboard/company/sidebar"

export async function CompanyDashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("company_name, industry")
    .eq("id", data.claims.sub)
    .single()

  if (!profile) redirect("/onboarding/company")

  return (
    <div className="flex min-h-screen">
      <CompanySidebar
        companyName={profile.company_name}
        industry={profile.industry}
      />
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  )
}
