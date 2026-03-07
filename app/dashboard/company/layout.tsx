import { Suspense } from "react"
import { QueryProvider } from "@/components/providers/query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CompanyDashboardShell } from "@/components/dashboard/company/dashboard-shell"
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
      <main className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </main>
    </div>
  )
}

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Suspense fallback={<DashboardFallback />}>
          <CompanyDashboardShell>{children}</CompanyDashboardShell>
        </Suspense>
      </TooltipProvider>
    </QueryProvider>
  )
}
