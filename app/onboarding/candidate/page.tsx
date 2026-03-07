// app/onboarding/candidate/page.tsx
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createCandidateProfile } from "@/lib/actions/candidate"

// Separás la lógica con auth en su propio componente
async function OnboardingForm() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) redirect("/auth/login")

  const { data: existing } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("id", data.claims.sub)
    .single()

  if (existing) redirect("/dashboard/candidate")

  return (
    <form action={createCandidateProfile} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Nombre completo</label>
        <input
          name="full_name"
          required
          className="w-full border rounded-md px-3 py-2"
          placeholder="Tomás Quinteros"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Título profesional</label>
        <input
          name="title"
          required
          className="w-full border rounded-md px-3 py-2"
          placeholder="Fullstack Developer"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Ubicación</label>
        <input
          name="location"
          className="w-full border rounded-md px-3 py-2"
          placeholder="Córdoba, Argentina"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Bio corta</label>
        <textarea
          name="bio"
          rows={3}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Contá brevemente tu experiencia..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground rounded-md py-2 font-medium"
      >
        Continuar →
      </button>
    </form>
  )
}

// El page wrappea el form en Suspense
export default function CandidateOnboardingPage() {
  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-2">Completá tu perfil</h1>
      <p className="text-muted-foreground mb-8">
        Esto ayuda a la IA a encontrar los mejores matches para vos.
      </p>

      <Suspense fallback={<p className="text-muted-foreground">Cargando...</p>}>
        <OnboardingForm />
      </Suspense>
    </div>
  )
}