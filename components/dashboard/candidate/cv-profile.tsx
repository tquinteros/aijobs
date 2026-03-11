"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, FileText, Loader2, UploadCloud, XCircle, Info } from "lucide-react"
import { CandidateProfile, getCandidateProfile, uploadAndParseCV } from "@/lib/actions/candidate"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
type Step = "idle" | "uploading" | "extracting" | "analyzing" | "saving" | "done" | "error"

const stepMessages: Record<Step, string> = {
  idle: "",
  uploading: "Subiendo archivo...",
  extracting: "Extrayendo texto del PDF...",
  analyzing: "La IA está analizando tu CV...",
  saving: "Guardando tu perfil...",
  done: "¡Todo listo!",
  error: "Ocurrió un error",
}

export default function CvProfile({ initialProfile }: { initialProfile: CandidateProfile }) {
  const queryClient = useQueryClient()
  const { data: profile } = useQuery({
    queryKey: ["candidateProfile"],
    queryFn: getCandidateProfile,
    initialData: initialProfile,
  })

  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [now, setNow] = useState(() => Date.now())
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const { isLocked, remainingMs, remainingLabel } = useMemo(() => {
    const lastParsedAt = profile?.cv_parsed_at ?? profile?.updated_at
    if (!lastParsedAt) {
      return { isLocked: false, remainingMs: 0, remainingLabel: "" }
    }

    const last = new Date(lastParsedAt).getTime()
    const diffMs = now - last
    const DAY_MS = 24 * 60 * 60 * 1000

    if (diffMs >= DAY_MS) {
      return { isLocked: false, remainingMs: 0, remainingLabel: "" }
    }

    const remaining = DAY_MS - diffMs
    const totalSeconds = Math.max(0, Math.floor(remaining / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const parts: string[] = []
    if (hours) parts.push(`${hours}h`)
    if (minutes || (!hours && seconds)) parts.push(`${minutes}m`)
    if (!hours && seconds) parts.push(`${seconds}s`)

    return {
      isLocked: true,
      remainingMs: remaining,
      remainingLabel: parts.join(" "),
    }
  }, [profile?.cv_parsed_at, profile?.updated_at, now])

  function handleFile(selected: File) {
    if (selected.type !== "application/pdf") {
      setErrorMsg("Solo se aceptan archivos PDF")
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg("El archivo no puede superar 5MB")
      return
    }
    setErrorMsg("")
    setFile(selected)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (!isLocked && dropped) handleFile(dropped)
  }

  async function handleSubmit() {
    if (!file || isLocked) return

    try {
      setStep("uploading")
      await new Promise(r => setTimeout(r, 600))

      setStep("extracting")
      await new Promise(r => setTimeout(r, 600))

      setStep("analyzing")

      const formData = new FormData()
      formData.append("cv", file)

      setStep("saving")
      await uploadAndParseCV(formData)
      toast.success("¡CV analizado correctamente!", {
        action: {
          label: "Ir a dashboard",
          onClick: () => router.push("/dashboard/candidate"),
        },
      })
      queryClient.refetchQueries({ queryKey: ["candidateProfile"] })
      setStep("done")
    } catch (error) {
      setStep("error")
      setErrorMsg(error instanceof Error ? error.message : "Error desconocido")
    }
  }

  const isLoading = ["uploading", "extracting", "analyzing", "saving"].includes(step)
  const isDisabledByLock = isLocked && step !== "done"

  return (
    <div className="max-w-lg mx-auto py-4">
      {/* Header */}
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold">Actualizá tu CV</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Subí una nueva versión de tu CV para que la IA vuelva a analizarlo y actualice tus embeddings.
        </p>
        <p className="text-xs text-muted-foreground">
          Esto reemplazará el CV anterior y actualizará tu perfil automáticamente.
        </p>
        {isLocked && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-100 text-amber-900 px-3 py-1 text-xs">
            <Info className="h-3 w-3" />
            <span>
              Solo podés actualizar tu CV una vez cada 24 horas. Podrás subir uno nuevo en{" "}
              <span className="font-semibold">{remainingLabel}</span>.
            </span>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !isLoading && !isLocked && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${(isLoading || isDisabledByLock) ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-primary" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB · PDF
            </p>
            {!isLoading && (
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-xs text-muted-foreground hover:text-destructive mt-1"
              >
                Cambiar archivo
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud className="w-10 h-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Arrastrá tu nuevo CV acá</p>
              <p className="text-sm text-muted-foreground">o hacé click para seleccionar</p>
            </div>
            <p className="text-xs text-muted-foreground">PDF · Máximo 5MB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
          <XCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Progress steps */}
      {isLoading && (
        <div className="mt-6 space-y-2">
          {(["uploading", "extracting", "analyzing", "saving"] as Step[]).map((s, i) => {
            const steps: Step[] = ["uploading", "extracting", "analyzing", "saving"]
            const currentIdx = steps.indexOf(step)
            const thisIdx = i
            const isDone = thisIdx < currentIdx
            const isCurrent = thisIdx === currentIdx

            return (
              <div key={s} className="flex items-center gap-3 text-sm">
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />
                )}
                <span className={isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {stepMessages[s]}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit button */}
      {!isLoading && (
        <button
          onClick={handleSubmit}
          disabled={!file || step === "done"}
          className="w-full mt-6 bg-primary text-primary-foreground rounded-md py-2 font-medium
            disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Analizar nuevo CV →
        </button>
      )}
    </div>
  )
}