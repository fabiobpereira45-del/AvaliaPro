"use client"

import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type QuestionType } from "@/lib/store"
import { type ExamBuilderState } from "../ExamBuilder"

const FORMAT_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Múltipla Escolha",
  "true-false": "Verdadeiro ou Falso",
  discursive: "Discursiva",
  "fill-in-the-blank": "Preencher as Lacunas",
  "incorrect-alternative": "Alternativa Incorreta",
  matching: "Associação",
}

interface Props {
  state: ExamBuilderState
  availableCount: number
  onUpdate: <K extends keyof ExamBuilderState>(key: K, value: ExamBuilderState[K]) => void
}

export function Step2Format({ state, availableCount, onUpdate }: Props) {
  const [pointsInput, setPointsInput] = React.useState(state.pointsPerQuestion.toString())

  return (
    <div className="flex flex-col gap-5">

      {/* Formato das Questões */}
      <div className="flex flex-col gap-1.5">
        <Label>Formato das Questões *</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FORMAT_LABELS) as QuestionType[]).map(f => {
            const selected = state.formats.includes(f)
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  const next = selected
                    ? state.formats.filter(x => x !== f)
                    : [...state.formats, f]
                  onUpdate("formats", next)
                }}
                className={`text-left p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {FORMAT_LABELS[f]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quantidade + Pontos */}
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="q-count">Nº de Questões *</Label>
          <Input
            id="q-count"
            type="number"
            min={1}
            max={50}
            value={state.questionCount}
            onChange={e => onUpdate("questionCount", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            {availableCount} questão{availableCount !== 1 ? "ões" : ""} disponíveis
          </p>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="pts-q">Pontos por Questão *</Label>
          <Input
            id="pts-q"
            type="text"
            inputMode="decimal"
            value={pointsInput}
            onChange={e => {
              const val = e.target.value.replace(",", ".")
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                setPointsInput(val)
                const num = parseFloat(val)
                if (!isNaN(num)) onUpdate("pointsPerQuestion", num)
                else if (val === "") onUpdate("pointsPerQuestion", 0)
              }
            }}
            onBlur={() => setPointsInput(state.pointsPerQuestion.toString())}
          />
          <p className="text-xs text-muted-foreground">
            Total: {(state.questionCount * state.pointsPerQuestion).toFixed(1)} pts
          </p>
        </div>
      </div>

      {/* Tempo Limite */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="time-limit">Tempo Limite (minutos — 0 para ilimitado)</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="time-limit"
            type="number"
            min={0}
            value={state.timeLimitMinutes}
            onChange={e => onUpdate("timeLimitMinutes", Number(e.target.value))}
            className="pl-9"
            placeholder="Ex: 60"
          />
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Se definido, o cronômetro aparecerá para o aluno e a prova será enviada ao expirar.
        </p>
      </div>
    </div>
  )
}

import React from "react"
