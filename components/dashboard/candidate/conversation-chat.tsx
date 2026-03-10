"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getConversationMessages,
  getConversationDetails,
  sendCandidateMessage,
  markConversationReadCandidate,
} from "@/lib/actions/message"
import { CONVERSATIONS_QUERY_KEY, MESSAGES_QUERY_KEY, type Message } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { SendHorizonal, AlertCircle } from "lucide-react"

type Props = {
  conversationId: string
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 space-y-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
            <Skeleton className="h-9 rounded-xl" style={{ width: `${120 + (i * 30) % 100}px` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConversationChat({ conversationId }: Props) {
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState("")

  const { data: conv, isLoading: loadingConv } = useQuery({
    queryKey: ["conversationDetails", conversationId],
    queryFn: () => getConversationDetails(conversationId),
  })

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: MESSAGES_QUERY_KEY(conversationId),
    queryFn: () => getConversationMessages(conversationId),
  })

  // Scroll to bottom when messages load or new ones arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Mark as read when the chat opens
  useEffect(() => {
    if (!conversationId) return
    markConversationReadCandidate(conversationId).then(() => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    })
  }, [conversationId, queryClient])

  // Supabase Realtime subscription for new messages
  const handleNewMessage = useCallback(
    (msg: Message) => {
      queryClient.setQueryData<Message[]>(
        MESSAGES_QUERY_KEY(conversationId),
        (prev) => {
          if (!prev) return [msg]
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        }
      )
      // Refresh conversation list so unread counters update
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
      // Auto-mark company messages as read since user is viewing
      if (msg.sender_role === "company") {
        markConversationReadCandidate(conversationId)
      }
    },
    [conversationId, queryClient]
  )

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => handleNewMessage(payload.new as Message)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, handleNewMessage])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    setSendError("")

    try {
      const msg = await sendCandidateMessage(conversationId, trimmed)
      setText("")
      // Optimistically add the sent message locally
      queryClient.setQueryData<Message[]>(
        MESSAGES_QUERY_KEY(conversationId),
        (prev) => {
          if (!prev) return [msg]
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        }
      )
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Error al enviar el mensaje")
    } finally {
      setSending(false)
    }
  }

  if (loadingConv || loadingMessages) return <ChatSkeleton />

  const company = conv?.company_profiles?.company_name ?? "Empresa"
  const job = conv?.job_postings?.title ?? "Oferta"

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
            {company[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{company}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{job}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages && messages.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-8">
            No hay mensajes aún. ¡Esperá que la empresa se contacte con vos!
          </p>
        )}

        {messages?.map((msg) => {
          const isCandidate = msg.sender_role === "candidate"
          const time = new Date(msg.created_at).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })

          return (
            <div
              key={msg.id}
              className={cn("flex flex-col gap-0.5", isCandidate ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-2xl text-sm leading-relaxed",
                  isCandidate
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground px-1">{time}</span>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 shrink-0">
        {sendError && (
          <div className="flex items-center gap-1.5 text-destructive text-xs mb-2">
            <AlertCircle className="h-3.5 w-3.5" />
            {sendError}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí un mensaje..."
            disabled={sending}
            className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
