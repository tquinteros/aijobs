// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js"

// Este cliente bypasea RLS - usarlo SOLO en server actions/api routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← esta key está en Supabase → Settings → API
)