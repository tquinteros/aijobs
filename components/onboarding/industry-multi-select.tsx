"use client"

import * as React from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"

const INDUSTRIES = [
  "Tech",
  "Marketing",
  "UX/UI",
  "Health",
  "Finance",
  "Education",
  "Retail",
  "E-commerce",
  "Manufacturing",
  "Logistics",
  "Real Estate",
  "Legal",
  "HR",
  "Sales",
  "Customer Support",
  "Hospitality",
  "Media",
  "Gaming",
  "Energy",
  "Non-profit",
] as const

export function IndustryMultiSelect() {
  const anchor = useComboboxAnchor()
  const [selectedIndustries, setSelectedIndustries] = React.useState<string[]>([])

  return (
    <Combobox
      multiple
      autoHighlight
      items={INDUSTRIES}
      value={selectedIndustries}
      onValueChange={(nextValue) => setSelectedIndustries(nextValue as string[])}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values) => (
            <React.Fragment>
              {values.map((value: string) => (
                <ComboboxChip key={value}>{value}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder="Search and select industries..."
                className="min-w-24 border-0 bg-transparent p-0 text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <input
        type="hidden"
        id="industry"
        name="industry"
        value={selectedIndustries.join(", ")}
      />

      <ComboboxContent
        anchor={anchor}
        className="rounded-xl border border-border/60 bg-popover/95 p-1 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-popover/90"
      >
        <ComboboxEmpty className="py-3 text-sm">No industries found.</ComboboxEmpty>
        <ComboboxList className="max-h-60 overflow-y-auto overscroll-contain scroll-py-1">
          {(item) => (
            <ComboboxItem
              key={item}
              value={item}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors data-highlighted:bg-accent data-highlighted:text-accent-foreground"
            >
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
