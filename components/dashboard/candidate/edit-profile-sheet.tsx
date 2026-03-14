// components/dashboard/candidate/edit-profile-sheet.tsx
"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { updateCandidateProfile } from "@/lib/actions/candidate"
import type { CandidateProfile } from "@/lib/actions/candidate"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Pencil, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { TagInput } from "@/components/ui/tag-input"
import { toast } from "sonner"

type Props = {
    profile: CandidateProfile
}

export function EditProfileSheet({ profile }: Props) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [skills, setSkills] = useState<string[]>(profile.skills ?? [])
    const [seniority, setSeniority] = useState(profile.seniority ?? "mid")

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError("")
        setSuccess(false)

        const formData = new FormData(e.currentTarget)
        formData.set("seniority", seniority)
        formData.set("skills", skills.join(","))

        startTransition(async () => {
            try {
                await updateCandidateProfile(formData)
                await queryClient.invalidateQueries({ queryKey: ["candidateProfile"] })
                setSuccess(true)
                toast.success("Candidate profile updated successfully")
                setOpen(false)
                setSuccess(false)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error saving")
            }
        })
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit profile
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-lg p-6 overflow-y-auto">
                <SheetHeader hidden className="">
                    <SheetTitle></SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                        <Label htmlFor="full_name">Full name</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={profile.full_name ?? ""}
                            disabled={isPending}
                            required
                        />
                    </div>

                    {/* Título */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Professional title</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="ej: Fullstack Developer"
                            defaultValue={profile.title ?? ""}
                            disabled={isPending}
                        />
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-1.5">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            name="location"
                            placeholder="e.g. Buenos Aires, Argentina"
                            defaultValue={profile.location ?? ""}
                            disabled={isPending}
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            placeholder="Briefly describe who you are and what you're looking for"
                            defaultValue={profile.bio ?? ""}
                            disabled={isPending}
                            rows={3}
                        />
                    </div>

                    {/* Seniority */}
                    <div className="space-y-1.5">
                        <Label>Seniority</Label>
                        <Select value={seniority} onValueChange={setSeniority} disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="junior">Junior</SelectItem>
                                <SelectItem value="mid">Mid</SelectItem>
                                <SelectItem value="senior">Senior</SelectItem>
                                <SelectItem value="lead">Lead / Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Años de experiencia */}
                    <div className="space-y-1.5">
                        <Label htmlFor="years_of_experience">Years of experience</Label>
                        <Input
                            id="years_of_experience"
                            name="years_of_experience"
                            type="number"
                            min={0}
                            max={50}
                            defaultValue={profile.years_of_experience ?? ""}
                            disabled={isPending}
                        />
                    </div>

                    {/* Skills */}
                    <div className="space-y-1.5">
                        <Label>
                            Technical skills
                            <span className="text-xs text-muted-foreground ml-1">
                                (Enter to add, click × to remove)
                            </span>
                        </Label>
                        <TagInput
                            value={skills}
                            onChange={setSkills}
                            placeholder="React, TypeScript..."
                            disabled={isPending}
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
                            Profile updated successfully
                        </div>
                    )}

                    {/* Aviso embedding */}
                    <p className="text-xs text-muted-foreground">
                        When saving, your compatibility with available jobs will be recalculated.
                    </p>

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