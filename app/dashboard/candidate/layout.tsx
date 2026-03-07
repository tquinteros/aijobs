import { Suspense } from "react"
import { QueryProvider } from "@/components/providers/query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DashboardShell } from "@/components/dashboard/candidate/dashboard-shell"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardFallback() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-card p-4 space-y-4 shrink-0">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </aside>
    </div>
  )
}

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Suspense fallback={<DashboardFallback />}>
          <DashboardShell>{children}</DashboardShell>
        </Suspense>
      </TooltipProvider>
    </QueryProvider>
  )
}
