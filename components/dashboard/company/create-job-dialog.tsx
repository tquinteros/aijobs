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

const SENIORITY_OPTIONS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
]

const LOCATION_TYPE_OPTIONS = [
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
  { value: "onsite", label: "Presencial" },
]

export function CreateJobDialog() {
  const [open, setOpen] = useState(false)
  const [locationType, setLocationType] = useState<string>("")
  const [seniority, setSeniority] = useState<string>("")
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (formData: FormData) => createJobPosting(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOB_POSTINGS_QUERY_KEY })
      setOpen(false)
      setLocationType("")
      setSeniority("")
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (locationType) formData.set("location_type", locationType)
    if (seniority) formData.set("seniority_required", seniority)
    mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva búsqueda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicar búsqueda laboral</DialogTitle>
          <DialogDescription>
            Completá los detalles del puesto. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título del puesto *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ej: Fullstack Developer"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describí las responsabilidades, el equipo y el contexto del rol..."
              rows={5}
              required
            />
          </div>

          {/* Location type + location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modalidad</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná..." />
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
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                name="location"
                placeholder="Buenos Aires, Argentina"
                disabled={locationType === "remote"}
              />
            </div>
          </div>

          {/* Seniority + years */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Seniority requerido</Label>
              <Select value={seniority} onValueChange={setSeniority}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná..." />
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
              <Label htmlFor="years_required">Años de experiencia</Label>
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
              <Label htmlFor="salary_min">Salario mínimo</Label>
              <Input
                id="salary_min"
                name="salary_min"
                type="number"
                min={0}
                placeholder="2000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Salario máximo</Label>
              <Input
                id="salary_max"
                name="salary_max"
                type="number"
                min={0}
                placeholder="4000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
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
            <Label htmlFor="required_skills">Skills requeridos</Label>
            <Input
              id="required_skills"
              name="required_skills"
              placeholder="React, TypeScript, Node.js (separados por coma)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nice_to_have_skills">Skills opcionales</Label>
            <Input
              id="nice_to_have_skills"
              name="nice_to_have_skills"
              placeholder="Docker, AWS, GraphQL (separados por coma)"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Ocurrió un error"}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Publicando..." : "Publicar búsqueda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
