// app/jobs/[id]/page.tsx
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getJobById } from "@/lib/actions/job"
import JobDetails from "@/components/jobs/job-details"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

function JobDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-9 w-44" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Separator />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

async function JobDetailsContent({
  paramsPromise
}: {
  paramsPromise: Promise<{ id: string }>
}) {
  const { id } = await paramsPromise
  const user = await getCurrentUser()
  const canApply = user?.role !== "company"

  const [initialJob] = await Promise.all([
    getJobById(id),
  ])

  return (
    <JobDetails
      id={id}
      initialJob={initialJob}
      canApply={canApply}
    />
  )
}


export default function JobIdPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return (
    < div className="container mx-auto py-8" >
      <Suspense fallback={<JobDetailsSkeleton />}>
        <JobDetailsContent paramsPromise={params} />
      </Suspense>
    </ div >
  )
}