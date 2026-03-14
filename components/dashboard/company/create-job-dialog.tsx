"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createJobPosting } from "@/lib/actions/company"
import { JOB_POSTINGS_QUERY_KEY } from "@/lib/company"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react"
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

export function CreateJobDialog() {
  const [open, setOpen] = useState(false)
  const [locationType, setLocationType] = useState<string>("")
  const [seniority, setSeniority] = useState<string>("")
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: FormData) => createJobPosting(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_POSTINGS_QUERY_KEY })
      setOpen(false)
      setLocationType("")
      setSeniority("")
      setRequiredSkills([])
      setNiceToHaveSkills([])
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (locationType) formData.set("location_type", locationType)
    if (seniority) formData.set("seniority_required", seniority)
    if (requiredSkills.length) formData.set("required_skills", requiredSkills.join(","))
    if (niceToHaveSkills.length) formData.set("nice_to_have_skills", niceToHaveSkills.join(","))
    mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New job search
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish job search</DialogTitle>
          <DialogDescription>
            Complete the details of the position. The fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Position title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Fullstack Developer"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the responsibilities, the team and the context of the role..."
              rows={5}
              required
            />
          </div>

          {/* Location type + location */}
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="New York, USA"
                disabled={locationType === "remote"}
              />
            </div>
          </div>

          {/* Seniority + years */}
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
              <Label htmlFor="years_required">Years of experience</Label>
              <Input
                id="years_required"
                name="years_required"
                type="number"
                min={0}
                placeholder="3"
              />
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Minimum salary</Label>
              <Input
                id="salary_min"
                name="salary_min"
                type="number"
                min={0}
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Maximum salary</Label>
              <Input
                id="salary_max"
                name="salary_max"
                type="number"
                min={0}
                placeholder="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                placeholder="USD"
                defaultValue="USD"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="required_skills">Required skills</Label>
            <TagInput
              value={requiredSkills}
              onChange={setRequiredSkills}
              placeholder="e.g. React, TypeScript (type and press Enter)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nice_to_have_skills">Optional skills</Label>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Publishing..." : "Publish job search"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
