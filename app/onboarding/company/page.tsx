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
import { Textarea } from "@/components/ui/textarea"
import { IndustryMultiSelect } from "@/components/onboarding/industry-multi-select"

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
        <Label htmlFor="company_name">Name of the company</Label>
        <Input
          id="company_name"
          name="company_name"
          required
          placeholder="Acme Inc."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <IndustryMultiSelect />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
            placeholder="New York, USA"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description of the company</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Briefly describe what the company does and what type of talent they are looking for..."
        />
      </div>
      <Button type="submit" className="w-full">
        Complete profile →
      </Button>
    </form>
  )
}

export default function CompanyOnboardingPage() {
  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete the profile of your company</CardTitle>
          <CardDescription>
            This information helps connect your company with the appropriate candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
            <CompanyOnboardingForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
