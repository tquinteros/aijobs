import { Suspense } from "react"
import { QueryProvider } from "@/components/providers/query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyDashboardShell } from "@/components/dashboard/company/dashboard-shell"

function DashboardFallback() {
  return (
    <div className="lg:flex min-h-screen hidden">
      <aside className="w-64 border-r bg-card p-4 space-y-4 shrink-0">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </aside>
    </div>
  )
}

export default async function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Suspense fallback={<DashboardFallback />}>
          <CompanyDashboardShell>
            {children}
          </CompanyDashboardShell>
        </Suspense>
      </TooltipProvider>
    </QueryProvider>
  )
}