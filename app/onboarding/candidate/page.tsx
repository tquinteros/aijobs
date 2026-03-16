// app/onboarding/candidate/page.tsx
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createCandidateProfile } from "@/lib/actions/candidate"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

async function OnboardingForm() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .single()

  if (profile?.role !== "candidate") redirect("/")

  const { data: existing } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("id", data.claims.sub)
    .single()

  if (existing) redirect("/dashboard/candidate")

  return (
    <form action={createCandidateProfile} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          placeholder="Tomás Quinteros"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título profesional</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="Fullstack Developer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          name="location"
          required
          placeholder="Córdoba, Argentina"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio corta</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          required
          placeholder="Contá brevemente tu experiencia..."
        />
      </div>

      <Button type="submit" className="w-full">
        Continuar →
      </Button>
    </form>
  )
}

export default function CandidateOnboardingPage() {
  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <CardDescription>
            This helps the AI find the best matches for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
          >
            <OnboardingForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}