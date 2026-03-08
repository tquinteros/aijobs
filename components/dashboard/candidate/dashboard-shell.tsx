import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CandidateSidebar } from "@/components/dashboard/candidate/sidebar"


type Profile = {
  full_name: string
  title: string
} 

export async function DashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Profile
}) {
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
