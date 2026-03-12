"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getConversationIdForJob } from "@/lib/actions/message"
import { CONVERSATION_ID_FOR_JOB_QUERY_KEY } from "@/lib/messages"

type JobDetailsMessageLinkProps = {
  jobId: string
}

export function JobDetailsMessageLink({ jobId }: JobDetailsMessageLinkProps) {
  const { data: conversationId, isLoading } = useQuery({
    queryKey: CONVERSATION_ID_FOR_JOB_QUERY_KEY(jobId),
    queryFn: () => getConversationIdForJob(jobId),
  })

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-md" />
  }

  if (!conversationId) return null

  return (
    <Button variant="outline" className="w-full gap-2" asChild>
      <Link href={`/dashboard/candidate/messages/${conversationId}`}>
        <MessageCircle className="h-4 w-4" />
        Ver conversación
      </Link>
    </Button>
  )
}

export default JobDetailsMessageLink
