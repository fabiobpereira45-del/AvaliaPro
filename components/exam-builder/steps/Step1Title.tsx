"use client"

import { Globe, Lock, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { type Discipline } from "@/lib/store"
import { type ExamBuilderState } from "../ExamBuilder"

interface Props {
  state: ExamBuilderState
  disciplines: Discipline[]
  onUpdate: <K extends keyof ExamBuilderState>(key: K, value: ExamBuilderState[K]) => void
}

export function Step1Title({ state, disciplines, onUpdate }: Props) {
  const selectedDisc = disciplines.find(d => d.id === state.disciplineId)

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpdate("logoBase64", ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleContractingLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpdate("contractingInstitutionLogo", ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exam-title">Título da Prova *</Label>
        <Input
          id="exam-title"
          value={state.title}
          onChange={e => onUpdate("title", e.target.value)}
          placeholder="Ex: Avaliação Bimestral — Livros Poéticos"
          autoFocus
        />
      </div>

      {/* Disciplina */}
      <div className="flex flex-col gap-1.5">
        <Label>Disciplina *</Label>
        <Select
          value={state.disciplineId}
          onValueChange={v => {
            onUpdate("disciplineId", v)
            onUpdate("selectedIds", new Set())
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a disciplina" />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedDisc?.description && (
          <p className="text-xs text-muted-foreground">{selectedDisc.description}</p>
        )}
      </div>

      {/* Logo Institucional */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exam-logo">Logo da Instituição (Opcional)</Label>
        <div className="flex items-center gap-3">
          <Input
            id="exam-logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="flex-1"
          />
          {state.logoBase64 && (
            <div className="w-10 h-10 border rounded-md overflow-hidden flex items-center justify-center bg-muted">
              <img src={state.logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Aparece no cabeçalho ao imprimir a prova física.
        </p>
      </div>

      {/* Instituição Contratante */}
      <div className="p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <ShieldCheck className="h-4 w-4" />
          Instituição Contratante (Parceiro)
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contracting-name">Nome da Instituição</Label>
          <Input
            id="contracting-name"
            value={state.contractingInstitutionName}
            onChange={e => onUpdate("contractingInstitutionName", e.target.value)}
            placeholder="Ex: Faculdade Teológica Internacional"
            className="bg-white"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contracting-logo">Logo da Instituição</Label>
          <div className="flex items-center gap-3">
            <Input
              id="contracting-logo"
              type="file"
              accept="image/*"
              onChange={handleContractingLogoUpload}
              className="flex-1 bg-white"
            />
            {state.contractingInstitutionLogo && (
              <div className="w-10 h-10 border rounded-md overflow-hidden flex items-center justify-center bg-white shadow-sm">
                <img src={state.contractingInstitutionLogo} alt="Logo parceiro" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Aparece ao lado da logo AVALIA quando adicionada.
          </p>
        </div>
      </div>

      {/* Regras */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exam-rules">Regras da Prova (Opcional)</Label>
        <Textarea
          id="exam-rules"
          value={state.rules}
          onChange={e => onUpdate("rules", e.target.value)}
          placeholder="Ex: Não é permitido o uso de celular durante a prova..."
          className="resize-none h-20"
        />
      </div>

      {/* Modalidade */}
      <div className="flex flex-col gap-2">
        <Label>Modalidade da Prova *</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdate("modality", "public")}
            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left ${
              state.modality === "public"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-border hover:border-green-300"
            }`}
          >
            <Globe className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold">Pública</div>
              <div className="text-xs font-normal text-muted-foreground">Qualquer pessoa com nome e e-mail</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onUpdate("modality", "private")}
            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left ${
              state.modality === "private"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/40"
            }`}
          >
            <Lock className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold">Privada</div>
              <div className="text-xs font-normal text-muted-foreground">Só alunos matriculados (login)</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
