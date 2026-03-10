// lib/messages.ts

export type Conversation = {
    id: string
    candidate_id: string
    company_id: string
    job_id: string | null
    status: "active" | "archived" | "blocked"
    last_message_at: string | null
    last_message_preview: string | null
    unread_candidate: number
    unread_company: number
    created_at: string
  }
  
  export type Message = {
    id: string
    conversation_id: string
    sender_id: string
    sender_role: "candidate" | "company"
    content: string
    attachment_url: string | null
    attachment_type: string | null
    read_at: string | null
    created_at: string
  }
  
  // Conversación enriquecida para la lista (solo campos necesarios para UI)
  export type ConversationWithDetails = Conversation & {
    job_postings: { title: string } | null
    candidate_profiles: { full_name: string } | null
    company_profiles: { company_name: string } | null
  }
  
  export const CONVERSATIONS_QUERY_KEY = ["conversations"] as const
  export const MESSAGES_QUERY_KEY = (id: string) => ["messages", id] as const