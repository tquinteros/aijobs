// components/dashboard/company/edit-profile-sheet.tsx
"use client"

import { useState, useTransition, useRef, useEffect } from "react"
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
import { Pencil, Loader2, AlertCircle, CheckCircle, Upload, X } from "lucide-react"
import { toast } from "sonner"

const LOGO_ACCEPT = "image/jpeg,image/png,image/webp"
const LOGO_MAX_SIZE = 2 * 1024 * 1024 // 2MB

type Props = {
  profile: CompanyProfile
}

export function EditCompanyProfileSheet({ profile }: Props) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Please choose a JPEG, PNG or WebP image")
      return
    }
    if (file.size > LOGO_MAX_SIZE) {
      toast.error("Image must be under 2MB")
      return
    }
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    setLogoFile(file)
    setLogoPreviewUrl(URL.createObjectURL(file))
    e.target.value = ""
  }

  function clearLogo() {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    setLogoFile(null)
    setLogoPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    if (logoFile) formData.set("logo", logoFile)

    startTransition(async () => {
      try {
        await updateCompanyProfile(formData)
        await queryClient.invalidateQueries({ queryKey: ["companyProfile"] })
        setSuccess(true)
        clearLogo()
        setOpen(false)
        setSuccess(false)
        toast.success("Company profile updated successfully")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving the company profile")
      }
    })
  }

  const displayLogoUrl = logoPreviewUrl ?? profile.logo_url

  function handleOpenChange(next: boolean) {
    if (!next) clearLogo()
    setOpen(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
          {/* Logo */}
          <div className="space-y-2">
            <Label>Company logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                {displayLogoUrl ? (
                  <img
                    src={displayLogoUrl}
                    alt="Company logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  name="logo"
                  accept={LOGO_ACCEPT}
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {displayLogoUrl ? "Change" : "Upload logo"}
                </Button>
                {(displayLogoUrl || logoFile) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                    onClick={clearLogo}
                    disabled={isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG or WebP. Max 2MB. Saved when you click Save changes.
                </p>
              </div>
            </div>
          </div>

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

