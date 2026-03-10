import ApplicationsCandidate from '@/components/dashboard/candidate/applications-candidate'
import { getCandidateApplications } from '@/lib/actions/job'
export default async function CandidateJobsPage() {
    const initialApplications = await getCandidateApplications()
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <ApplicationsCandidate initialApplications={initialApplications} />
        </div>
    )
}