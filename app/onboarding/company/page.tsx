import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createCompanyProfile } from "@/lib/actions/company"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

async function CompanyOnboardingForm() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .single()

  if (profile?.role !== "company") redirect("/")

  const { data: existing } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("id", data.claims.sub)
    .single()

  if (existing) redirect("/dashboard/company")

  return (
    <form action={createCompanyProfile} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Nombre de la empresa</Label>
        <Input
          id="company_name"
          name="company_name"
          required
          placeholder="Acme Inc."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">Industria</Label>
        <Input
          id="industry"
          name="industry"
          placeholder="Tecnología, Retail, Salud..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          name="location"
          placeholder="Buenos Aires, Argentina"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Sitio web</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción de la empresa</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Contá brevemente qué hace la empresa y qué tipo de talento buscan..."
        />
      </div>
      <Button type="submit" className="w-full">
        Completar perfil →
      </Button>
    </form>
  )
}

export default function CompanyOnboardingPage() {
  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Completá el perfil de tu empresa</CardTitle>
          <CardDescription>
            Esta información ayuda a conectar tu empresa con los candidatos adecuados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-muted-foreground">Cargando...</p>}>
            <CompanyOnboardingForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
