import Link from "next/link"
import ConversationChat from "@/components/dashboard/candidate/conversation-chat"
import MessageListCandidate from "@/components/dashboard/candidate/messages-list-candidate"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { getCandidateConversations, getConversationDetails, getConversationMessages } from "@/lib/actions/message"
import { ConversationWithDetails } from "@/lib/messages"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const initialConversations: ConversationWithDetails[] = await getCandidateConversations()
  const { messages: initialMessages, hasMore: initialHasMore } = await getConversationMessages(conversationId)
  const initialConvDetails: ConversationWithDetails = await getConversationDetails(conversationId)
  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-0px)] min-h-0 overflow-hidden border rounded-lg">
      {/* Sidebar: conversation list — hidden on mobile when viewing a conversation */}
      <aside className="hidden md:flex md:w-80 shrink-0 border-r flex-col min-h-0">
        <div className="px-4 py-3 border-b shrink-0">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> 
            Messages
          </h2>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MessageListCandidate initialConversations={initialConversations} />
        </div>
      </aside>

      {/* Chat panel — full width on mobile with back link */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="md:hidden shrink-0 border-b px-3 py-2.5 bg-background">
          <Link
            href="/dashboard/candidate/messages"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to messages
          </Link>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <ConversationChat
            conversationId={conversationId}
            initialMessages={initialMessages}
            initialHasMore={initialHasMore}
            initialConvDetails={initialConvDetails}
          />
        </div>
      </div>
    </div>
  )
}
