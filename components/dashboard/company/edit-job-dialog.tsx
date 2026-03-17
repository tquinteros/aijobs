"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateJobPosting } from "@/lib/actions/company"
import { JOB_POSTINGS_QUERY_KEY, type JobPosting } from "@/lib/company"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagInput } from "@/components/ui/tag-input"

const SENIORITY_OPTIONS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
]

const LOCATION_TYPE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
]

interface EditJobDialogProps {
  job: JobPosting
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditJobDialog({ job, open, onOpenChange }: EditJobDialogProps) {
  const [locationType, setLocationType] = useState<string>(job.location_type ?? "")
  const [seniority, setSeniority] = useState<string>(job.seniority_required ?? "")
  const [requiredSkills, setRequiredSkills] = useState<string[]>(job.required_skills ?? [])
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>(job.nice_to_have_skills ?? [])
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: FormData) => updateJobPosting(job.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_POSTINGS_QUERY_KEY })
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (locationType) formData.set("location_type", locationType)
    if (seniority) formData.set("seniority_required", seniority)
    formData.set("required_skills", requiredSkills.join(","))
    formData.set("nice_to_have_skills", niceToHaveSkills.join(","))
    mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit job posting</DialogTitle>
          <DialogDescription>
            Update the details of this position. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Position title *</Label>
            <Input
              id="edit-title"
              name="title"
              placeholder="e.g. Fullstack Developer"
              defaultValue={job.title}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              name="description"
              placeholder="Describe the responsibilities, the team and the context of the role..."
              rows={5}
              defaultValue={job.description}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location type</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                name="location"
                placeholder="New York, USA"
                defaultValue={job.location ?? ""}
                disabled={locationType === "remote"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Seniority required</Label>
              <Select value={seniority} onValueChange={setSeniority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {SENIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-years">Years of experience</Label>
              <Input
                id="edit-years"
                name="years_required"
                type="number"
                min={0}
                placeholder="3"
                defaultValue={job.years_required ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-salary-min">Minimum salary</Label>
              <Input
                id="edit-salary-min"
                name="salary_min"
                type="number"
                min={0}
                placeholder="2000"
                defaultValue={job.salary_min ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-salary-max">Maximum salary</Label>
              <Input
                id="edit-salary-max"
                name="salary_max"
                type="number"
                min={0}
                placeholder="4000"
                defaultValue={job.salary_max ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Input
                id="edit-currency"
                name="currency"
                placeholder="USD"
                defaultValue={job.currency ?? "USD"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Required skills</Label>
            <TagInput
              value={requiredSkills}
              onChange={setRequiredSkills}
              placeholder="e.g. React, TypeScript (type and press Enter)"
            />
          </div>
          <div className="space-y-2">
            <Label>Optional skills</Label>
            <TagInput
              value={niceToHaveSkills}
              onChange={setNiceToHaveSkills}
              placeholder="e.g. Docker, AWS (type and press Enter)"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
