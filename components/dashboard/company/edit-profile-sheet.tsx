// components/dashboard/company/edit-profile-sheet.tsx
"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { updateCompanyProfile } from "@/lib/actions/company"
import type { CompanyProfile } from "@/lib/company"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Pencil, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

type Props = {
  profile: CompanyProfile
}

export function EditCompanyProfileSheet({ profile }: Props) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await updateCompanyProfile(formData)
        await queryClient.invalidateQueries({ queryKey: ["companyProfile"] })
        setSuccess(true)
        setOpen(false)
        setSuccess(false)
        toast.success("Company profile updated successfully")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving the company profile")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          Edit company profile
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg p-6 overflow-y-auto">
        <SheetHeader hidden>
          <SheetTitle></SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre de la empresa */}
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              name="company_name"
              defaultValue={profile.company_name ?? ""}
              disabled={isPending}
              required
            />
          </div>

          {/* Sitio web */}
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://..."
              defaultValue={profile.website ?? ""}
              disabled={isPending}
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g: Buenos Aires, Argentina"
              defaultValue={profile.location ?? "e.g: Buenos Aires, Argentina"}
              disabled={isPending}
            />
          </div>

          {/* Industria */}
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              placeholder="e.g: Technology, Finance..."
              defaultValue={profile.industry ?? ""}
              disabled={isPending}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe briefly what the company does"
              defaultValue={profile.description ?? ""}
              disabled={isPending}
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg border border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-sm p-3 rounded-lg border border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Company profile updated successfully
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

