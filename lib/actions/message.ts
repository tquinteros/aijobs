// lib/actions/messages.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import type { ConversationWithDetails, Message } from "@/lib/messages"

// Normalize relation that may come as object or single-element array from PostgREST
function normalizeRelation<T>(rel: T | T[] | null): T | null {
  if (rel == null) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export async function getOrCreateConversation(
  candidateId: string,
  jobId: string
): Promise<string> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const companyId = auth.claims.sub

  // Verificar que la empresa es dueña del job
  const { data: job } = await supabase
    .from("job_postings")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", companyId)
    .single()

  if (!job) throw new Error("No tenés permiso para contactar en esta oferta")

  // Verificar que el candidato aplicó a esta oferta
  const { data: application } = await supabase
    .from("applications")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId)
    .single()

  if (!application) throw new Error("El candidato no aplicó a esta oferta")

  // Buscar conversación existente o crear una nueva
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .single()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      candidate_id: candidateId,
      company_id: companyId,
      job_id: jobId,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)
  return created.id
}

export async function getConversationIdForJob(jobId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims?.sub) return null

  const candidateId = auth.claims.sub as string

  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId)
    .maybeSingle()

  if (error) return null
  return data?.id ?? null
}

export async function getCandidateConversations(): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const candidateId = auth.claims.sub

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      candidate_id,
      company_id,
      job_id,
      status,
      last_message_at,
      last_message_preview,
      unread_candidate,
      unread_company,
      created_at,
      job_postings ( title ),
      candidate_profiles ( full_name ),
      company_profiles ( company_name )
    `)
    .eq("candidate_id", candidateId)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  const list = (data ?? []) as Record<string, unknown>[]
  for (const row of list) {
    row.job_postings = normalizeRelation(row.job_postings as object | object[] | null)
    row.candidate_profiles = normalizeRelation(row.candidate_profiles as object | object[] | null)
    row.company_profiles = normalizeRelation(row.company_profiles as object | object[] | null)
    if (!row.company_profiles && row.company_id) {
      const { data: cp } = await supabaseAdmin
        .from("company_profiles")
        .select("company_name")
        .eq("id", row.company_id)
        .single()
      row.company_profiles = cp ? { company_name: cp.company_name } : null
    }
  }
  return list as unknown as ConversationWithDetails[]
}

export async function getCompanyConversations(): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const companyId = auth.claims.sub

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      candidate_id,
      company_id,
      job_id,
      status,
      last_message_at,
      last_message_preview,
      unread_candidate,
      unread_company,
      created_at,
      job_postings ( title ),
      candidate_profiles ( full_name ),
      company_profiles ( company_name )
    `)
    .eq("company_id", companyId)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  const list = (data ?? []) as Record<string, unknown>[]
  for (const row of list) {
    row.job_postings = normalizeRelation(row.job_postings as object | object[] | null)
    row.candidate_profiles = normalizeRelation(row.candidate_profiles as object | object[] | null)
    row.company_profiles = normalizeRelation(row.company_profiles as object | object[] | null)
    if (!row.candidate_profiles && row.candidate_id) {
      const { data: cp } = await supabaseAdmin
        .from("candidate_profiles")
        .select("full_name")
        .eq("id", row.candidate_id)
        .single()
      row.candidate_profiles = cp ? { full_name: cp.full_name } : null
    }
  }
  return list as unknown as ConversationWithDetails[]
}

export async function getConversationMessages(
  conversationId: string,
  cursor?: string,
  limit = 20
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const candidateId = auth.claims.sub

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("candidate_id", candidateId)
    .single()

  if (!conv) throw new Error("No tenés acceso a esta conversación")

  let query = supabase
    .from("messages")
    .select("id, conversation_id, sender_id, sender_role, content, attachment_url, attachment_type, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt("created_at", cursor)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const hasMore = rows.length > limit
  const messages = rows.slice(0, limit).reverse()

  return { messages, hasMore }
}

export async function getConversationMessagesForCompany(
  conversationId: string,
  cursor?: string,
  limit = 20
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const companyId = auth.claims.sub

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("company_id", companyId)
    .single()

  if (!conv) throw new Error("No tenés acceso a esta conversación")

  let query = supabase
    .from("messages")
    .select("id, conversation_id, sender_id, sender_role, content, attachment_url, attachment_type, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt("created_at", cursor)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Message[]
  const hasMore = rows.length > limit
  const messages = rows.slice(0, limit).reverse()

  return { messages, hasMore }
}

export async function getConversationDetails(conversationId: string): Promise<ConversationWithDetails> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const candidateId = auth.claims.sub

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      candidate_id,
      company_id,
      job_id,
      status,
      last_message_at,
      last_message_preview,
      unread_candidate,
      unread_company,
      created_at,
      job_postings ( title ),
      candidate_profiles ( full_name ),
      company_profiles ( company_name )
    `)
    .eq("id", conversationId)
    .eq("candidate_id", candidateId)
    .single()

  if (error) throw new Error(error.message)
  const row = data as Record<string, unknown>
  row.job_postings = normalizeRelation(row.job_postings as object | object[] | null)
  row.candidate_profiles = normalizeRelation(row.candidate_profiles as object | object[] | null)
  row.company_profiles = normalizeRelation(row.company_profiles as object | object[] | null)
  if (!row.company_profiles && row.company_id) {
    const { data: cp } = await supabaseAdmin
      .from("company_profiles")
      .select("company_name")
      .eq("id", row.company_id)
      .single()
    row.company_profiles = cp ? { company_name: cp.company_name } : null
  }
  if (!row.job_postings && row.job_id) {
    const { data: jp } = await supabaseAdmin
      .from("job_postings")
      .select("title")
      .eq("id", row.job_id)
      .single()
    row.job_postings = jp ? { title: jp.title } : null
  }
  return row as unknown as ConversationWithDetails
}

export async function getConversationDetailsForCompany(conversationId: string): Promise<ConversationWithDetails> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const companyId = auth.claims.sub

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      candidate_id,
      company_id,
      job_id,
      status,
      last_message_at,
      last_message_preview,
      unread_candidate,
      unread_company,
      created_at,
      job_postings ( title ),
      candidate_profiles ( full_name ),
      company_profiles ( company_name )
    `)
    .eq("id", conversationId)
    .eq("company_id", companyId)
    .single()

  if (error) throw new Error(error.message)
  const row = data as Record<string, unknown>
  row.job_postings = normalizeRelation(row.job_postings as object | object[] | null)
  row.candidate_profiles = normalizeRelation(row.candidate_profiles as object | object[] | null)
  row.company_profiles = normalizeRelation(row.company_profiles as object | object[] | null)
  if (!row.candidate_profiles && row.candidate_id) {
    const { data: cp } = await supabaseAdmin
      .from("candidate_profiles")
      .select("full_name")
      .eq("id", row.candidate_id)
      .single()
    row.candidate_profiles = cp ? { full_name: cp.full_name } : null
  }
  return row as unknown as ConversationWithDetails
}

export async function sendCandidateMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const candidateId = auth.claims.sub

  // Security: verify the candidate owns this conversation
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("candidate_id", candidateId)
    .single()

  if (!conv) throw new Error("No tenés acceso a esta conversación")

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: candidateId,
      sender_role: "candidate",
      content: content.trim(),
    })
    .select("id, conversation_id, sender_id, sender_role, content, attachment_url, attachment_type, read_at, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data as Message
}

export async function sendCompanyMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const companyId = auth.claims.sub

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("company_id", companyId)
    .single()

  if (!conv) throw new Error("No tenés acceso a esta conversación")

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: companyId,
      sender_role: "company",
      content: content.trim(),
    })
    .select("id, conversation_id, sender_id, sender_role, content, attachment_url, attachment_type, read_at, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data as Message
}

export async function markConversationReadCandidate(conversationId: string): Promise<void> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const candidateId = auth.claims.sub

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("candidate_id", candidateId)
    .single()

  if (!conv) return

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("sender_role", "company")
    .is("read_at", null)

  await supabase
    .from("conversations")
    .update({ unread_candidate: 0 })
    .eq("id", conversationId)

}

export async function markConversationReadCompany(conversationId: string): Promise<void> {
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect("/auth/login")
  const companyId = auth.claims.sub

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("company_id", companyId)
    .single()

  if (!conv) return

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("sender_role", "candidate")
    .is("read_at", null)

  await supabase
    .from("conversations")
    .update({ unread_company: 0 })
    .eq("id", conversationId)
}