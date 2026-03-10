import MessageListCandidate from "@/components/dashboard/candidate/messages-list-candidate"
import { MessageCircle } from "lucide-react"
import { getCandidateConversations } from "@/lib/actions/message"
import { ConversationWithDetails } from "@/lib/messages"

export default async function CandidateMessagesPage() {
  const initialConversations: ConversationWithDetails[] = await getCandidateConversations()
  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden border rounded-lg">
      {/* Sidebar: conversation list */}
      <aside className="w-80 shrink-0 border-r flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Mensajes
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageListCandidate initialConversations={initialConversations} />
        </div>
      </aside>

      {/* Right panel: empty state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageCircle className="h-12 w-12 opacity-20" />
        <p className="text-sm">Seleccioná una conversación para ver los mensajes</p>
      </div>
    </div>
  )
}
