import JobDetails from '@/components/dashboard/company/job-details';
import { Suspense } from 'react';

export default async function JobIdPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <Suspense fallback={null}>
            <div className="container mx-auto py-8">
                <JobDetails jobId={id} />
            </div>
        </Suspense>
    )
}