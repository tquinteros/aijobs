import { JobsList, JobsListSkeleton } from "@/components/jobs/jobs-list"
import { getPublicJobs } from "@/lib/actions/job"
import { parseFiltersFromSearchParams } from "@/lib/job-filters"
import { Suspense } from "react"

async function JobsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const filters = parseFiltersFromSearchParams(params)
  const initialData = await getPublicJobs(filters)
  return <JobsList initialData={initialData} />
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<JobsListSkeleton />}>
        <JobsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}   