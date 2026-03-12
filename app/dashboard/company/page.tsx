import { CompanyProfileSummary } from "@/components/dashboard/company/profile-summary"
import { getCompanyProfile } from "@/lib/actions/company"

export default async function CompanyDashboardPage() {
  const initialProfile = await getCompanyProfile()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <CompanyProfileSummary initialProfile={initialProfile} />
    </div>
  )
}
