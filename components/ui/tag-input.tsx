// components/ui/tag-input.tsx
"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TagInput({
  value,
  onChange,
  placeholder = "Escribí y presioná Enter...",
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag) return
    if (value.includes(tag)) {
      setInputValue("")
      return
    }
    onChange([...value, tag])
    setInputValue("")
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(inputValue)
      return
    }
    // Borrar último tag con Backspace si el input está vacío
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  // También soportar paste de lista separada por comas
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text")
    if (pasted.includes(",")) {
      e.preventDefault()
      const newTags = pasted
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && !value.includes(s))
      if (newTags.length > 0) onChange([...value, ...newTags])
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2",
        "focus-within:ring-1 focus-within:ring-ring transition-shadow",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
              aria-label={`Eliminar ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          // Agregar tag si el usuario hace blur sin presionar Enter
          if (inputValue.trim()) addTag(inputValue)
        }}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={disabled}
        className={cn(
          "flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground",
          disabled && "cursor-not-allowed"
        )}
      />
    </div>
  )
}