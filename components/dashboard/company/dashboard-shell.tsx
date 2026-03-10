import { CompanySidebar } from "@/components/dashboard/company/sidebar"
import { requireCompany } from "@/lib/auth/require-company"

type Company = {
  company_name: string
}

export async function CompanyDashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const company = await requireCompany()
  return (
    <div className="flex h-screen overflow-hidden">
      <CompanySidebar companyName={company.company_name} />

      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}