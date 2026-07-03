"use client"

import { useEffect, useState, useCallback } from "react"
import { X } from "lucide-react"
import { type Discipline, type Question, type QuestionType, type Assessment, getDisciplines, getQuestionsByDiscipline } from "@/lib/store"
import { ExamBuilderHeader } from "./ExamBuilderHeader"
import { ExamBuilderFooter } from "./ExamBuilderFooter"
import { Step1Title } from "./steps/Step1Title"
import { Step2Format } from "./steps/Step2Format"
import { Step3Questions } from "./steps/Step3Questions"
import { Step4Preview } from "./steps/Step4Preview"

export type SelectionMode = "auto" | "manual"

export interface ExamBuilderState {
  // Step 1
  title: string
  disciplineId: string
  logoBase64: string
  contractingInstitutionName: string
  contractingInstitutionLogo: string
  rules: string
  modality: "public" | "private"
  // Step 2
  formats: QuestionType[]
  questionCount: number
  pointsPerQuestion: number
  timeLimitMinutes: number
  // Step 3
  selectionMode: SelectionMode
  selectedIds: Set<string>
}

interface Props {
  open: boolean
  assessment?: Assessment | null
  onClose: () => void
  onSave: () => void
}

const FORMAT_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Múltipla Escolha",
  "true-false": "Verdadeiro ou Falso",
  discursive: "Discursiva",
  "fill-in-the-blank": "Preencher as Lacunas",
  "incorrect-alternative": "Alternativa Incorreta",
  matching: "Associação",
}

const defaultState = (): ExamBuilderState => ({
  title: "",
  disciplineId: "",
  logoBase64: "",
  contractingInstitutionName: "",
  contractingInstitutionLogo: "",
  rules: "",
  modality: "public",
  formats: ["multiple-choice"],
  questionCount: 10,
  pointsPerQuestion: 1,
  timeLimitMinutes: 0,
  selectionMode: "auto",
  selectedIds: new Set(),
})

export function ExamBuilder({ open, assessment, onClose, onSave }: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<ExamBuilderState>(defaultState())
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])

  // ─── Init / reset ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    let mounted = true

    async function init() {
      const discs = await getDisciplines()
      if (!mounted) return
      setDisciplines(discs)

      if (assessment) {
        setState({
          title: assessment.title,
          disciplineId: assessment.disciplineId,
          logoBase64: assessment.logoBase64 ?? "",
          contractingInstitutionName: assessment.contracting_institution_name ?? "",
          contractingInstitutionLogo: assessment.contracting_institution_logo ?? "",
          rules: assessment.rules ?? "",
          modality: assessment.modality ?? "public",
          formats: ["multiple-choice"],
          questionCount: assessment.questionIds?.length || 10,
          pointsPerQuestion: assessment.pointsPerQuestion || 1,
          timeLimitMinutes: assessment.timeLimitMinutes ?? 0,
          selectionMode: "manual",
          selectedIds: new Set(assessment.questionIds || []),
        })
      } else {
        setState({ ...defaultState(), disciplineId: discs[0]?.id ?? "" })
      }
      setStep(1)
    }

    init()
    return () => { mounted = false }
  }, [open, assessment])

  // ─── Load questions when discipline / formats change ─────────────────
  useEffect(() => {
    if (!state.disciplineId) return
    let mounted = true
    async function load() {
      let qs = await getQuestionsByDiscipline(state.disciplineId)
      if (!mounted) return
      if (state.formats.length > 0) qs = qs.filter(q => state.formats.includes(q.type))
      setAvailableQuestions(qs)
    }
    load()
    return () => { mounted = false }
  }, [state.disciplineId, state.formats])

  // ─── Helpers ─────────────────────────────────────────────────────────
  const update = useCallback(<K extends keyof ExamBuilderState>(key: K, value: ExamBuilderState[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  function handleAutoSelect() {
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5)
    const count = Math.min(state.questionCount, shuffled.length)
    const picked = shuffled.slice(0, count)
    const ids = new Set(picked.map(q => q.id))
    setState(prev => ({ ...prev, selectedIds: ids, questionCount: count }))
  }

  function toggleQuestion(id: string) {
    setState(prev => {
      const next = new Set(prev.selectedIds)
      if (next.has(id)) next.delete(id)
      else if (next.size < prev.questionCount) next.add(id)
      return { ...prev, selectedIds: next }
    })
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    setState(prev => {
      const arr = [...prev.selectedIds]
      if (direction === "up" && index > 0) {
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
      } else if (direction === "down" && index < arr.length - 1) {
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
      }
      return { ...prev, selectedIds: new Set(arr) }
    })
  }

  function swapQuestion(idToReplace: string) {
    const unselected = availableQuestions.filter(q => !state.selectedIds.has(q.id))
    if (!unselected.length) { alert("Não há mais questões disponíveis para trocar."); return }
    const replacement = unselected[Math.floor(Math.random() * unselected.length)]
    setState(prev => {
      const arr = [...prev.selectedIds]
      const idx = arr.indexOf(idToReplace)
      if (idx !== -1) arr[idx] = replacement.id
      return { ...prev, selectedIds: new Set(arr) }
    })
  }

  function removeQuestion(id: string) {
    setState(prev => {
      const arr = [...prev.selectedIds].filter(x => x !== id)
      return { ...prev, selectedIds: new Set(arr), questionCount: arr.length }
    })
  }

  // ─── Navigation guards ────────────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 1) return state.title.trim().length > 0 && state.disciplineId.length > 0
    if (step === 2) return state.formats.length > 0 && state.questionCount >= 1 && state.pointsPerQuestion > 0
    if (step === 3 && state.selectionMode === "manual") return state.selectedIds.size === state.questionCount
    return true
  }

  function handleNext() {
    if (step === 3 && state.selectionMode === "auto") handleAutoSelect()
    setStep(s => s + 1)
  }

  function handleBack() {
    if (step === 1) { onClose(); return }
    if (step === 4 && state.selectionMode === "auto") { setStep(2); return }
    setStep(s => s - 1)
  }

  // ─── Save ─────────────────────────────────────────────────────────────
  async function handleSave() {
    const { addAssessment, updateAssessment, PROFESSOR_CREDENTIALS } = await import("@/lib/store")
    const validIds = [...state.selectedIds].filter(id => availableQuestions.some(q => q.id === id))
    if (!validIds.length) { alert("A prova precisa ter pelo menos uma questão."); return }

    const selectedDisc = disciplines.find(d => d.id === state.disciplineId)
    const professorName = selectedDisc?.professorName || PROFESSOR_CREDENTIALS.name

    setSaving(true)
    try {
      const payload = {
        title: state.title.trim(),
        disciplineId: state.disciplineId,
        professor: professorName,
        logoBase64: state.logoBase64,
        contracting_institution_name: state.contractingInstitutionName.trim(),
        contracting_institution_logo: state.contractingInstitutionLogo,
        rules: state.rules.trim(),
        questionIds: validIds,
        pointsPerQuestion: state.pointsPerQuestion,
        totalPoints: validIds.length * state.pointsPerQuestion,
        modality: state.modality,
        timeLimitMinutes: state.timeLimitMinutes > 0 ? state.timeLimitMinutes : null,
      }
      if (assessment) await updateAssessment(assessment.id, payload)
      else await addAssessment({ ...payload, institution: "AVALIA", openAt: null, closeAt: null, isPublished: false })
      onSave()
      onClose()
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message || "Tente novamente."}`)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — CSS Grid with fixed header + scrollable body + fixed footer */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden"
          style={{
            display: "grid",
            gridTemplateRows: "auto auto 1fr auto",
            height: "90vh",
            maxHeight: "90vh",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Row 1: Header */}
          <ExamBuilderHeader
            step={step}
            isEditing={!!assessment}
            onClose={onClose}
          />

          {/* Row 2: Step indicator bar */}
          <div className="px-6 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-1">
              {[
                { n: 1, label: "Título" },
                { n: 2, label: "Formato" },
                { n: 3, label: "Questões" },
                { n: 4, label: "Visualizar" },
              ].map(({ n, label }, i, arr) => (
                <div key={n} className="flex items-center gap-1 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-200 ${
                    step > n ? "bg-emerald-500 text-white" :
                    step === n ? "bg-emerald-500 text-white scale-110 ring-2 ring-emerald-500/30" :
                    "bg-muted text-muted-foreground border border-border"
                  }`}>
                    {step > n ? "✓" : n}
                  </div>
                  <span className={`text-[11px] font-medium whitespace-nowrap ${step === n ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  {i < arr.length - 1 && (
                    <div className={`h-px flex-1 mx-1 ${step > n ? "bg-emerald-500" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Scrollable body — THIS IS THE ONLY SCROLLABLE PART */}
          <div className="overflow-y-auto overscroll-contain px-6 py-4">
            {step === 1 && (
              <Step1Title
                state={state}
                disciplines={disciplines}
                onUpdate={update}
              />
            )}
            {step === 2 && (
              <Step2Format
                state={state}
                availableCount={availableQuestions.length}
                onUpdate={update}
              />
            )}
            {step === 3 && (
              <Step3Questions
                state={state}
                availableQuestions={availableQuestions}
                onUpdate={update}
                onAutoSelect={handleAutoSelect}
                onToggle={toggleQuestion}
              />
            )}
            {step === 4 && (
              <Step4Preview
                state={state}
                disciplines={disciplines}
                availableQuestions={availableQuestions}
                onMove={moveQuestion}
                onSwap={swapQuestion}
                onRemove={removeQuestion}
              />
            )}
          </div>

          {/* Row 4: Footer — ALWAYS VISIBLE, NEVER MOVES */}
          <ExamBuilderFooter
            step={step}
            saving={saving}
            canProceed={canProceed()}
            onBack={handleBack}
            onNext={handleNext}
            onSave={handleSave}
          />
        </div>
      </div>
    </>
  )
}
