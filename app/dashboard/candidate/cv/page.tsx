import CvProfile from '@/components/dashboard/candidate/cv-profile'
import React from 'react'
import { getCandidateProfile } from '@/lib/actions/candidate'
export default async function CandidateCVPage() {
    const initialProfile = await getCandidateProfile()
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <CvProfile initialProfile={initialProfile} />
        </div>
    )
}