import { getCompanyConversations, getConversationMessagesForCompany, getConversationDetailsForCompany } from "@/lib/actions/message"
import { MessageCircle } from "lucide-react"
import MessageListCompany from "@/components/dashboard/company/messages-list-company"
import ConversationChatCompany from "@/components/dashboard/company/conversation-chat-company"
import type { ConversationWithDetails } from "@/lib/messages"
import type { Message } from "@/lib/messages"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params

  const [initialConversations, firstPage, initialConvDetails] = await Promise.all([
    getCompanyConversations(),
    getConversationMessagesForCompany(conversationId),
    getConversationDetailsForCompany(conversationId),
  ])
  const initialMessages = firstPage.messages
  const initialHasMore = firstPage.hasMore

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden border rounded-lg">
      <aside className="w-80 shrink-0 border-r flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageListCompany initialConversations={initialConversations} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <ConversationChatCompany
          conversationId={conversationId}
          initialMessages={initialMessages}
          initialHasMore={initialHasMore}
          initialConvDetails={initialConvDetails}
        />
      </div>
    </div>
  )
}