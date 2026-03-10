import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CandidateSidebar } from "@/components/dashboard/candidate/sidebar"
import { requireCandidate } from "@/lib/auth/require-candidate"

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {


  const profile = await requireCandidate()

  return (
    <div className="flex h-screen overflow-hidden">
      <CandidateSidebar
        fullName={profile.full_name}
        title={profile.title}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
