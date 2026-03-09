import JobDetails from '@/components/jobs/job-details';
import { Suspense } from 'react';

export default async function JobIdPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="container mx-auto py-8">
                <JobDetails jobId={id} />
            </div>
        </Suspense>
    )
}