"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

export function HeroSearchForm() {
  const router = useRouter()
  const [locationType, setLocationType] = useState<string>("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const search = (formData.get("search") as string)?.trim() ?? ""
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (locationType) params.set("location_type", locationType)
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-16"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          name="search"
          placeholder="Search jobs, skills, companies..."
          className="pl-9 h-11 w-full"
          aria-label="Search jobs"
        />
      </div>
      {/* <Select value={locationType || "all"} onValueChange={(v) => setLocationType(v === "all" ? "" : v)}>
        <SelectTrigger className="!h-11 min-w-[140px]" aria-label="Location type">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All locations</SelectItem>
          <SelectItem value="remote">Remote</SelectItem>
          <SelectItem value="hybrid">Hybrid</SelectItem>
          <SelectItem value="onsite">Onsite</SelectItem>
        </SelectContent>
      </Select> */}
      <Button type="submit" size="lg" className="!h-11 px-6 shrink-0">
        <Search className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  )
}
