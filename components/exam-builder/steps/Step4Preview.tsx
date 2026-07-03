"use client"

import { ArrowUp, ArrowDown, RefreshCw, Trash2 } from "lucide-react"
import { type Question, type Discipline, type QuestionType, PROFESSOR_CREDENTIALS } from "@/lib/store"
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
  disciplines: Discipline[]
  availableQuestions: Question[]
  onMove: (index: number, direction: "up" | "down") => void
  onSwap: (id: string) => void
  onRemove: (id: string) => void
}

export function Step4Preview({ state, disciplines, availableQuestions, onMove, onSwap, onRemove }: Props) {
  const selectedDisc = disciplines.find(d => d.id === state.disciplineId)

  const previewIds = [...state.selectedIds].length === 0
    ? availableQuestions.slice(0, state.questionCount).map(q => q.id)
    : [...state.selectedIds]

  const previewQs = previewIds
    .map(id => availableQuestions.find(q => q.id === id))
    .filter(Boolean) as Question[]

  return (
    <div className="flex flex-col gap-4">
      {/* Preview document */}
      <div className="bg-white border rounded-xl shadow-sm text-black p-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-5">
          {state.logoBase64 && (
            <img src={state.logoBase64} alt="Logo" className="w-16 h-16 object-contain" />
          )}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-black uppercase tracking-tight text-emerald-700">
              {state.title || "Sem título"}
            </h1>
            {selectedDisc && (
              <p className="text-xs font-semibold uppercase mt-1 text-gray-500">
                {selectedDisc.name}
              </p>
            )}
          </div>
          {state.contractingInstitutionLogo && (
            <img src={state.contractingInstitutionLogo} alt="Logo parceiro" className="w-16 h-16 object-contain" />
          )}
        </div>

        {/* Dados do aluno */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-5 border-b border-gray-200 pb-4">
          <div className="flex gap-2"><span className="font-semibold">Aluno(a):</span><div className="border-b border-black flex-1" /></div>
          <div className="flex gap-2"><span className="font-semibold">Data:</span><div className="border-b border-black w-24" /></div>
          <div className="flex gap-2"><span className="font-semibold">Professor:</span><span>{PROFESSOR_CREDENTIALS.name}</span></div>
          <div className="flex gap-2"><span className="font-semibold">Nota:</span><div className="border-b border-black w-24" /></div>
        </div>

        {/* Regras */}
        {state.rules && (
          <div className="mb-5 p-3 border border-gray-200 rounded bg-gray-50">
            <h3 className="text-xs font-bold uppercase mb-1 text-gray-500">Regras & Instruções</h3>
            <p className="text-xs whitespace-pre-wrap leading-relaxed">{state.rules}</p>
          </div>
        )}

        {/* Questões */}
        <div className="flex flex-col gap-5">
          {previewQs.map((q, idx) => (
            <div key={q.id} className="border border-gray-200 rounded-lg p-4 relative">
              {/* Actions */}
              <div className="flex gap-1 mb-3 pb-2 border-b border-gray-100">
                <button
                  onClick={() => onMove(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 px-2 flex items-center gap-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 border text-xs font-medium"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Subir
                </button>
                <button
                  onClick={() => onMove(idx, "down")}
                  disabled={idx === previewQs.length - 1}
                  className="p-1 px-2 flex items-center gap-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 border text-xs font-medium"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Descer
                </button>
                <button
                  onClick={() => onSwap(q.id)}
                  className="p-1 px-2 flex items-center gap-1 hover:bg-blue-50 rounded text-blue-600 border border-blue-200 ml-auto text-xs font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Trocar
                </button>
                <button
                  onClick={() => onRemove(q.id)}
                  className="p-1 px-2 flex items-center gap-1 hover:bg-red-50 text-red-500 border border-red-200 rounded text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>

              {/* Question text */}
              <div className="flex gap-2 mb-2">
                <span className="font-bold text-gray-700">{idx + 1}.</span>
                <span className="text-sm font-medium text-gray-900 leading-relaxed">{q.text}</span>
              </div>

              {/* Choices */}
              {q.type === "multiple-choice" && q.choices && (
                <div className="flex flex-col gap-1.5 ml-5">
                  {q.choices.map((c, ci) => (
                    <div key={c.id} className="flex items-start gap-2 text-sm">
                      <span className="font-semibold">({String.fromCharCode(97 + ci)})</span>
                      <span>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {q.type === "true-false" && (
                <div className="flex gap-4 ml-5 text-sm">
                  <span>( ) V</span><span>( ) F</span>
                </div>
              )}
              {q.type === "discursive" && (
                <div className="mt-3 ml-5 space-y-4">
                  {[0,1,2].map(i => <div key={i} className="border-b border-gray-300 w-full" />)}
                </div>
              )}
              {q.type === "matching" && q.pairs && (
                <div className="mt-2 ml-5 flex flex-col gap-2">
                  {q.pairs.map(p => (
                    <div key={p.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1 border p-1.5 rounded bg-gray-50 text-xs">{p.left}</div>
                      <span className="text-xs font-bold text-gray-400">→</span>
                      <div className="flex-1 border p-1.5 rounded bg-gray-50 text-xs">{p.right}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
