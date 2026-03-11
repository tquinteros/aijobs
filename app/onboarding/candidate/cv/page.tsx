// app/onboarding/candidate/cv/page.tsx
"use client"

import { useRef, useState } from "react"
import { CheckCircle, FileText, Loader2, UploadCloud, XCircle } from "lucide-react"
import { uploadAndParseCV } from "@/lib/actions/candidate"
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

export default function CVUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  async function handleSubmit() {
    if (!file) return
  
    setErrorMsg("")
    setStep("uploading")
    await new Promise(r => setTimeout(r, 500))
  
    setStep("extracting")
    await new Promise(r => setTimeout(r, 500))
  
    setStep("analyzing")
    await new Promise(r => setTimeout(r, 400))
  
    setStep("saving")
  
    const formData = new FormData()
    formData.append("cv", file)
  
    try {
      await uploadAndParseCV(formData)
      setStep("done")
      toast.success("¡CV analizado correctamente!")
      router.push("/dashboard/candidate")
    } catch (error) {
      setStep("error")
      setErrorMsg(error instanceof Error ? error.message : "Error desconocido")
    }
  }

  const isLoading = ["uploading", "extracting", "analyzing", "saving"].includes(step)

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">Paso 2 de 2</p>
        <h1 className="text-2xl font-bold">Subí tu CV</h1>
        <p className="text-muted-foreground mt-1">
          La IA va a extraer tus skills y experiencia automáticamente.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${isLoading ? "pointer-events-none opacity-60" : ""}
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
              <p className="font-medium">Arrastrá tu CV acá</p>
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
          Analizar y continuar →
        </button>
      )}
    </div>
  )
}