import { CompanySidebar } from "@/components/dashboard/company/sidebar"

type Company = {
  company_name: string
}

export function CompanyDashboardShell({
  children,
  company,
}: {
  children: React.ReactNode
  company: Company
}) {
  return (
    <div className="flex min-h-screen">
      <CompanySidebar companyName={company.company_name} />

      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}