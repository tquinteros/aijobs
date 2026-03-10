import { requireCandidate } from "@/lib/auth/require-candidate"
import { CandidateDashboardShellClient } from "./dashboard-shell-client"

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireCandidate()

  return (
    <CandidateDashboardShellClient
      fullName={profile.full_name}
      title={profile.title}
    >
      {children}
    </CandidateDashboardShellClient>
  )
}
