import React from 'react'
import { JobsList } from "@/components/dashboard/company/jobs-list"
import { getJobPostings } from '@/lib/actions/company'

const CompanyJobsPage = async () => {

    const initialJobs = await getJobPostings()

    return (
        <div className="p-6">
            <JobsList initialJobs={initialJobs} />
        </div>
    )
}

export default CompanyJobsPage