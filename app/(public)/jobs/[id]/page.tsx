import JobDetails from "@/components/jobs/job-details"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth/get-current-user"

async function JobDetailsWithUser() {
  const user = await getCurrentUser()
  const canApply = user?.role !== "company"

  return <JobDetails canApply={canApply} />
}

export default function JobIdPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={null}>
        <JobDetailsWithUser />
      </Suspense>
    </div>
  )
}