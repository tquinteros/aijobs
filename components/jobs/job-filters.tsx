// components/jobs/jobs-filters.tsx
"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"
import type { JobFilters } from "@/lib/job-filters"

type Props = {
  filters: JobFilters
  totalJobs: number
  filteredCount: number
}

const SEARCH_DEBOUNCE_MS = 400

export function JobsFilters({ filters, totalJobs, filteredCount }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchInput, setSearchInput] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync input from URL when filters.search changes (e.g. Clear or navigation)
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateParam("search", value)
        debounceRef.current = null
      }, SEARCH_DEBOUNCE_MS)
    },
    [updateParam]
  )

  const hasActiveFilters = filters.location_type || filters.seniority || filters.search

  const clearFilters = () => {
    router.replace(pathname, { scroll: false })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, skills, companies..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Location type */}
        <Select
          value={filters.location_type || "all"}
          onValueChange={(v) => updateParam("location_type", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
          </SelectContent>
        </Select>

        {/* Seniority */}
        <Select
          value={filters.seniority || "all"}
          onValueChange={(v) => updateParam("seniority", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="mid">Mid</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {hasActiveFilters
          ? `${filteredCount} of ${totalJobs} job${totalJobs !== 1 ? "s" : ""}`
          : `${totalJobs} job${totalJobs !== 1 ? "s" : ""} available`
        }
      </p>
    </div>
  )
}