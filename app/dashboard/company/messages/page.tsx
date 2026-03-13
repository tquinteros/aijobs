import { getCompanyConversations } from "@/lib/actions/message"
import { MessageCircle } from "lucide-react"
import MessageListCompany from "@/components/dashboard/company/messages-list-company"
import type { ConversationWithDetails } from "@/lib/messages"

export default async function CompanyMessagesPage() {
  const initialConversations: ConversationWithDetails[] = await getCompanyConversations()

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

      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageCircle className="h-12 w-12 opacity-20" />
        <p className="text-sm">Select a conversation to view the messages</p>
      </div>
    </div>
  )
}