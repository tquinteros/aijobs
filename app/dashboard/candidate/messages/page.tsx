import MessageListCandidate from "@/components/dashboard/candidate/messages-list-candidate"
import { MessageCircle } from "lucide-react"
import { getCandidateConversations } from "@/lib/actions/message"
import { ConversationWithDetails } from "@/lib/messages"

export default async function CandidateMessagesPage() {
  const initialConversations: ConversationWithDetails[] = await getCandidateConversations()
  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-0px)] min-h-0 overflow-hidden border rounded-lg">
      {/* Sidebar: conversation list — full width on mobile, fixed width on desktop */}
      <aside className="w-full md:w-80 shrink-0 border-r flex flex-col min-h-0 flex-1 md:flex-initial">
        <div className="px-4 py-3 border-b shrink-0">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Mensajes
          </h2>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MessageListCandidate initialConversations={initialConversations} />
        </div>
      </aside>

      {/* Right panel: empty state — hidden on mobile */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground min-w-0">
        <MessageCircle className="h-12 w-12 opacity-20" />
        <p className="text-sm">Seleccioná una conversación para ver los mensajes</p>
      </div>
    </div>
  )
}
