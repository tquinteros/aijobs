import { ProfileSummary } from "@/components/dashboard/candidate/profile-summary"
import { getCandidateProfile } from "@/lib/actions/candidate"
export default async function CandidateDashboardPage() {
  const initialProfile = await getCandidateProfile()
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ProfileSummary initialProfile={initialProfile} />
    </div>
  )
}
