import { JobsList, JobsListSkeleton } from "@/components/jobs/jobs-list"
import { getPublicJobs } from "@/lib/actions/job"
import { Suspense } from "react"

async function JobsContent() {
  const initialJobs = await getPublicJobs()
  return <JobsList initialJobs={initialJobs} />
}

export default function JobsPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<JobsListSkeleton />}>
        <JobsContent />
      </Suspense>
    </div>
  )
}   