"use client"

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react"
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getConversationMessages,
  getConversationDetails,
  sendCandidateMessage,
  markConversationReadCandidate,
} from "@/lib/actions/message"
import { CONVERSATIONS_QUERY_KEY, MESSAGES_QUERY_KEY, type Message, type ConversationWithDetails } from "@/lib/messages"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { SendHorizonal, AlertCircle, Loader2 } from "lucide-react"

type Props = {
  conversationId: string
  // initialMessages ahora es la primera página
  initialMessages: Message[]
  initialHasMore: boolean
  initialConvDetails: ConversationWithDetails | null
}

export default function ConversationChat({
  conversationId,
  initialMessages,
  initialHasMore,
  initialConvDetails,
}: Props) {
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState("")
  const [sendError, setSendError] = useState("")
  // Anchor: id del mensaje que estaba arriba al cargar más (para restaurar scroll)
  const scrollAnchorRef = useRef<string | null>(null)
  // Evitar scroll-to-bottom mientras cargamos página anterior
  const isLoadingMoreRef = useRef(false)

  const { data: conv } = useQuery({
    queryKey: ["conversationDetails", conversationId],
    queryFn: () => getConversationDetails(conversationId),
    initialData: initialConvDetails ?? undefined,
  })

  // useInfiniteQuery en vez de useQuery (pageParam = cursor string | undefined)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: MESSAGES_QUERY_KEY(conversationId),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      return getConversationMessages(conversationId, pageParam)
    },
    // cursor = created_at del mensaje más antiguo de la página anterior
    getNextPageParam: (firstPage): string | undefined => {
      if (!firstPage.hasMore) return undefined
      return firstPage.messages[0]?.created_at ?? undefined
    },
    initialPageParam: undefined as string | undefined,
    // Inyectar la primera página desde el servidor
    initialData: {
      pages: [{ messages: initialMessages, hasMore: initialHasMore }],
      pageParams: [undefined],
    },
    // Las páginas nuevas (más viejas) van al principio
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  })

  // Aplanar todas las páginas en un array de mensajes
  const messages = data?.pages.flatMap((p) => p.messages) ?? []

  // Scroll al fondo solo en el mount inicial y cuando llegan mensajes nuevos propios
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" })
      isFirstMount.current = false
    }
  }, [])

  // Cuando llega un mensaje nuevo (realtime o enviado), scroll al fondo solo si ya estaba abajo
  const lastMessageId = messages[messages.length - 1]?.id
  useEffect(() => {
    if (isLoadingMoreRef.current) return
    if (!isFirstMount.current) {
      const container = scrollContainerRef.current
      if (!container) return
      const { scrollTop, scrollHeight, clientHeight } = container
      const nearBottom = scrollHeight - scrollTop - clientHeight < 120
      if (nearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }
    }
  }, [lastMessageId])

  // Antes de fetchear: guardar el mensaje visible arriba para restaurar scroll después
  const handleLoadMore = useCallback(async () => {
    const container = scrollContainerRef.current
    if (!container) return
    const scrollTop = container.scrollTop
    const elements = container.querySelectorAll<HTMLElement>("[data-msg-id]")
    let anchorId: string | null = null
    for (const el of elements) {
      const top = el.offsetTop
      if (top <= scrollTop + 30) anchorId = el.getAttribute("data-msg-id")
    }
    if (!anchorId && messages.length > 0) anchorId = messages[0].id
    scrollAnchorRef.current = anchorId
    isLoadingMoreRef.current = true
    await fetchNextPage()
  }, [fetchNextPage, messages.length])

  // Después de cargar página anterior: hacer scroll al mensaje ancla para mantener posición
  useLayoutEffect(() => {
    const anchorId = scrollAnchorRef.current
    scrollAnchorRef.current = null
    isLoadingMoreRef.current = false
    if (anchorId) {
      const el = scrollContainerRef.current?.querySelector<HTMLElement>(
        `[data-msg-id="${anchorId}"]`
      )
      if (el) {
        el.scrollIntoView({ block: "start", behavior: "auto" })
      }
    }
  }, [data?.pages.length])

  // Detectar scroll cerca del tope para cargar más
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    if (container.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      handleLoadMore()
    }
  }, [hasNextPage, isFetchingNextPage, handleLoadMore])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (!conversationId) return
    markConversationReadCandidate(conversationId).then(() => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    })
  }, [conversationId, queryClient])

  const handleNewMessage = useCallback(
    (msg: Message) => {
      queryClient.setQueryData(
        MESSAGES_QUERY_KEY(conversationId),
        (old: { pages: { messages: Message[]; hasMore: boolean }[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old
          const lastPage = old.pages[old.pages.length - 1]
          const optimisticIndex = lastPage.messages.findIndex(
            (m) => m.id.startsWith("optimistic-") && m.content === msg.content
          )

          const updatedLastPage = {
            ...lastPage,
            messages: optimisticIndex !== -1
              ? lastPage.messages.map((m, i) => i === optimisticIndex ? msg : m)
              : lastPage.messages.some((m) => m.id === msg.id)
                ? lastPage.messages
                : [...lastPage.messages, msg],
          }

          return {
            ...old,
            pages: [...old.pages.slice(0, -1), updatedLastPage],
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
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
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => handleNewMessage(payload.new as Message))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, handleNewMessage])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    setText("")
    setSendError("")

    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: "me",
      sender_role: "candidate",
      content: trimmed,
      attachment_url: null,
      attachment_type: null,
      read_at: null,
      created_at: new Date().toISOString(),
    }

    // Insertar optimista en la última página
    queryClient.setQueryData(
      MESSAGES_QUERY_KEY(conversationId),
      (old: { pages: { messages: Message[]; hasMore: boolean }[]; pageParams: unknown[] } | undefined) => {
        if (!old) return old
        const lastPage = old.pages[old.pages.length - 1]
        return {
          ...old,
          pages: [
            ...old.pages.slice(0, -1),
            { ...lastPage, messages: [...lastPage.messages, optimisticMsg] },
          ],
        }
      }
    )

    try {
      const realMsg = await sendCandidateMessage(conversationId, trimmed)
      queryClient.setQueryData(
        MESSAGES_QUERY_KEY(conversationId),
        (old: { pages: { messages: Message[]; hasMore: boolean }[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old
          const lastPage = old.pages[old.pages.length - 1]
          return {
            ...old,
            pages: [
              ...old.pages.slice(0, -1),
              {
                ...lastPage,
                messages: lastPage.messages.map((m) =>
                  m.id === optimisticId ? realMsg : m
                ),
              },
            ],
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    } catch (err) {
      queryClient.setQueryData(
        MESSAGES_QUERY_KEY(conversationId),
        (old: { pages: { messages: Message[]; hasMore: boolean }[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old
          const lastPage = old.pages[old.pages.length - 1]
          return {
            ...old,
            pages: [
              ...old.pages.slice(0, -1),
              {
                ...lastPage,
                messages: lastPage.messages.filter((m) => m.id !== optimisticId),
              },
            ],
          }
        }
      )
      setText(trimmed)
      setSendError(err instanceof Error ? err.message : "Error al enviar el mensaje")
    }
  }

  const company = conv?.company_profiles?.company_name ?? "Empresa"
  const job = conv?.job_postings?.title ?? "Oferta"

  return (
    <div className="flex flex-col h-full">
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

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {/* Indicador de carga arriba */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-8">
            No hay mensajes aún. ¡Esperá que la empresa se contacte con vos!
          </p>
        )}

        {messages.map((msg, i) => {
          const isCandidate = msg.sender_role === "candidate"
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
                data-msg-id={msg.id}
                className={cn("flex flex-col gap-0.5", isCandidate ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-2xl text-sm leading-relaxed transition-opacity",
                    isCandidate
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
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