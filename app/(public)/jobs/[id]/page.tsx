import JobDetails from '@/components/jobs/job-details';
import { Suspense } from 'react';

export default function JobIdPage() {
    return (
        <Suspense fallback={null}>
        <div className="container mx-auto py-8">
            <JobDetails />
        </div>
        </Suspense>
    )
}