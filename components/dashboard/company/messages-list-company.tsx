"use client"

import { useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getCompanyConversations } from "@/lib/actions/message"
import { CONVERSATIONS_QUERY_KEY, type ConversationWithDetails } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"

type Props = {
  initialConversations: ConversationWithDetails[]
}

export default function MessageListCompany({ initialConversations }: Props) {
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const { data: conversations, isError } = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: getCompanyConversations,
    initialData: initialConversations,
    refetchInterval: 30_000,
  })

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted || !user?.id) return
      channelRef.current = supabase
        .channel("conversations-company")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `company_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
          }
        )
        .subscribe()
    })

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [queryClient])

  if (isError) {
    return (
      <p className="p-4 text-sm text-destructive">
        No se pudieron cargar los mensajes.
      </p>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6 text-muted-foreground">
        <MessageCircle className="h-10 w-10 opacity-30" />
        <p className="text-sm">Todavía no tenés conversaciones con candidatos.</p>
        <p className="text-xs">
          Cuando contactes a alguien desde una búsqueda, la conversación aparecerá acá.
        </p>
      </div>
    )
  }

  return (
    <nav className="divide-y">
      {conversations.map((conv) => {
        const isActive = pathname === `/dashboard/company/messages/${conv.id}`
        const unread = conv.unread_company ?? 0
        const candidateName = conv.candidate_profiles?.full_name ?? "Candidato/a"
        const job = conv.job_postings?.title ?? "Oferta"
        const preview = conv.last_message_preview ?? "Sin mensajes aún"
        const timeLabel = conv.last_message_at
          ? new Date(conv.last_message_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
            })
          : null

        return (
          <Link
            key={conv.id}
            href={`/dashboard/company/messages/${conv.id}`}
            className={cn(
              "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
              isActive && "bg-muted"
            )}
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
              {candidateName[0]?.toUpperCase() ?? "?"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-sm truncate",
                    unread > 0 ? "font-semibold" : "font-medium"
                  )}
                >
                  {candidateName}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {timeLabel && (
                    <span className="text-xs text-muted-foreground">{timeLabel}</span>
                  )}
                  {unread > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 text-xs rounded-full">
                      {unread}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{job}</p>
              <p
                className={cn(
                  "text-xs truncate mt-0.5",
                  unread > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {preview}
              </p>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}