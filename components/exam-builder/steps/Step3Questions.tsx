"use client"

import { Shuffle, List, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Question, type QuestionType } from "@/lib/store"
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
  availableQuestions: Question[]
  onUpdate: <K extends keyof ExamBuilderState>(key: K, value: ExamBuilderState[K]) => void
  onAutoSelect: () => void
  onToggle: (id: string) => void
}

export function Step3Questions({ state, availableQuestions, onUpdate, onAutoSelect, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-4">

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onUpdate("selectionMode", "auto")}
          className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
            state.selectionMode === "auto"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/40"
          }`}
        >
          <Shuffle className="h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Automático</div>
            <div className="text-xs font-normal text-muted-foreground">Seleção aleatória do banco</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onUpdate("selectionMode", "manual")}
          className={`flex items-center gap-2.5 p-3 rounded-lg border-2 text-sm font-medium transition-colors text-left ${
            state.selectionMode === "manual"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/40"
          }`}
        >
          <List className="h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Manual</div>
            <div className="text-xs font-normal text-muted-foreground">Escolha as questões</div>
          </div>
        </button>
      </div>

      {/* Auto mode info */}
      {state.selectionMode === "auto" && (
        <div className={`rounded-lg p-4 text-sm font-medium ${
          availableQuestions.length < state.questionCount
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-muted text-muted-foreground"
        }`}>
          <div className="font-bold mb-1">
            {Math.min(state.questionCount, availableQuestions.length)} questão
            {Math.min(state.questionCount, availableQuestions.length) !== 1 ? "ões" : ""} serão selecionadas
          </div>
          <p className="opacity-90">
            Extraídas aleatoriamente de {availableQuestions.length} questão
            {availableQuestions.length !== 1 ? "ões" : ""} disponíveis.
          </p>
          {availableQuestions.length < state.questionCount && (
            <p className="mt-2 text-xs font-bold flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Banco possui menos questões que o solicitado ({state.questionCount}).
            </p>
          )}
        </div>
      )}

      {/* Manual mode list */}
      {state.selectionMode === "manual" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${state.selectedIds.size < state.questionCount ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
              Selecione exatamente <strong>{state.questionCount}</strong> questão
              {state.questionCount !== 1 ? "ões" : ""} ({state.selectedIds.size} selecionada
              {state.selectedIds.size !== 1 ? "s" : ""})
              {state.selectedIds.size < state.questionCount && (
                <span className="ml-2">— Faltam {state.questionCount - state.selectedIds.size}</span>
              )}
            </p>
            {availableQuestions.length > state.questionCount && (
              <Button size="sm" variant="outline" onClick={onAutoSelect}>
                <Shuffle className="h-3.5 w-3.5 mr-1.5" /> Sortear
              </Button>
            )}
          </div>

          {availableQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma questão disponível para este formato e disciplina.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {availableQuestions.map((q, i) => {
                const checked = state.selectedIds.has(q.id)
                const disabled = !checked && state.selectedIds.size >= state.questionCount
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      if (!disabled) onToggle(q.id)
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked ? "border-primary bg-primary/5" :
                      disabled ? "border-border opacity-40 cursor-not-allowed" :
                      "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      checked ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {FORMAT_LABELS[q.type] || q.type}
                        </span>
                      </div>
                      <span className="text-sm">{q.text}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
