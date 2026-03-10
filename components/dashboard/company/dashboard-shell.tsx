import { requireCompany } from "@/lib/auth/require-company"
import { CompanyDashboardShellClient } from "./dashboard-shell-client"

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
    <CompanyDashboardShellClient companyName={company.company_name}>
      {children}
    </CompanyDashboardShellClient>
  )
}