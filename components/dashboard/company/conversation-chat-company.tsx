"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getConversationMessagesForCompany,
  getConversationDetailsForCompany,
  sendCompanyMessage,
  markConversationReadCompany,
} from "@/lib/actions/message"
import { CONVERSATIONS_QUERY_KEY, MESSAGES_QUERY_KEY, type Message, type ConversationWithDetails } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { SendHorizonal, AlertCircle } from "lucide-react"

type Props = {
  conversationId: string
  initialMessages: Message[]
  initialConvDetails: ConversationWithDetails | null
}

export default function ConversationChatCompany({
  conversationId,
  initialMessages,
  initialConvDetails,
}: Props) {
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState("")
  const [sendError, setSendError] = useState("")

  const { data: conv } = useQuery({
    queryKey: ["conversationDetailsCompany", conversationId],
    queryFn: () => getConversationDetailsForCompany(conversationId),
    initialData: initialConvDetails ?? undefined,
  })

  const { data: messages } = useQuery({
    queryKey: MESSAGES_QUERY_KEY(conversationId),
    queryFn: () => getConversationMessagesForCompany(conversationId),
    initialData: initialMessages,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!conversationId) return
    markConversationReadCompany(conversationId).then(() => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    })
  }, [conversationId, queryClient])

  const handleNewMessage = useCallback(
    (msg: Message) => {
      queryClient.setQueryData<Message[]>(
        MESSAGES_QUERY_KEY(conversationId),
        (prev) => {
          if (!prev) return [msg]
          if (prev.some((m) => m.id === msg.id)) return prev
          // Reemplazar optimista si el contenido coincide
          const optimisticIndex = prev.findIndex(
            (m) => m.id.startsWith("optimistic-") && m.content === msg.content
          )
          if (optimisticIndex !== -1) {
            const updated = [...prev]
            updated[optimisticIndex] = msg
            return updated
          }
          return [...prev, msg]
        }
      )
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
      if (msg.sender_role === "candidate") {
        markConversationReadCompany(conversationId)
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
    if (!trimmed) return

    // Limpiar input y error inmediatamente
    setText("")
    setSendError("")

    // Crear mensaje optimista con ID temporal
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: "me",
      sender_role: "company",
      content: trimmed,
      attachment_url: null,
      attachment_type: null,
      read_at: null,
      created_at: new Date().toISOString(),
    }

    // Insertar optimista en el cache — aparece inmediatamente
    queryClient.setQueryData<Message[]>(
      MESSAGES_QUERY_KEY(conversationId),
      (prev) => [...(prev ?? []), optimisticMsg]
    )

    try {
      const realMsg = await sendCompanyMessage(conversationId, trimmed)

      // Reemplazar el optimista con el mensaje real de la DB
      queryClient.setQueryData<Message[]>(
        MESSAGES_QUERY_KEY(conversationId),
        (prev) => prev?.map((m) => m.id === optimisticId ? realMsg : m) ?? [realMsg]
      )
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })

    } catch (err) {
      // Si falla: sacar el optimista, devolver texto al input, mostrar error
      queryClient.setQueryData<Message[]>(
        MESSAGES_QUERY_KEY(conversationId),
        (prev) => prev?.filter((m) => m.id !== optimisticId) ?? []
      )
      setText(trimmed)
      setSendError(err instanceof Error ? err.message : "Error al enviar el mensaje")
    }
  }

  const candidateName = conv?.candidate_profiles?.full_name ?? "Candidato/a"

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
            {candidateName[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{candidateName}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-8">
            No hay mensajes aún. Enviá el primer mensaje para contactar a la persona candidata.
          </p>
        )}

        {messages.map((msg, i) => {
          const isCompany = msg.sender_role === "company"
          const isOptimistic = msg.id.startsWith("optimistic-")
          const msgDate = msg.created_at.slice(0, 10)
          const prevDate = messages[i - 1]?.created_at.slice(0, 10)
          const showDayDivider = prevDate !== msgDate
          const time = new Date(msg.created_at).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })
          const dateLabel = new Date(msg.created_at).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
          })

          return (
            <div key={msg.id} className="contents">
              {showDayDivider && (
                <div className="flex justify-center py-3">
                  <span className="text-xs text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                    {dateLabel}
                  </span>
                </div>
              )}
              <div
                className={cn("flex flex-col gap-0.5", isCompany ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-2xl text-sm leading-relaxed transition-opacity",
                    isCompany
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                    // Levemente transparente mientras espera confirmación de DB
                    isOptimistic && "opacity-60"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">{time}</span>
              </div>
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
            className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}