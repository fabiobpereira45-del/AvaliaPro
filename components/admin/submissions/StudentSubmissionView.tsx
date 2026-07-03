"use client"

import { X, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react"
import { type Assessment, type Question, type StudentSubmission, type QuestionType } from "@/lib/store"
import { formatTime } from "../admin-utils"

const FORMAT_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Múltipla Escolha",
  "true-false": "Verdadeiro ou Falso",
  discursive: "Discursiva",
  "fill-in-the-blank": "Preencher as Lacunas",
  "incorrect-alternative": "Alternativa Incorreta",
  matching: "Associação",
}

interface Props {
  open: boolean
  submission: StudentSubmission
  assessment: Assessment
  questions: Question[]
  onClose: () => void
}

export function StudentSubmissionView({ open, submission, assessment, questions, onClose }: Props) {
  if (!open) return null

  // Ensure questions map matches the assessment
  const orderedQuestions = assessment.questionIds
    .map(id => questions.find(q => q.id === id))
    .filter(Boolean) as Question[]

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={e => e.stopPropagation()}>
        <div 
          className="bg-white rounded-2xl shadow-2xl border w-full max-w-4xl overflow-hidden flex flex-col"
          style={{ height: "90vh", maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Respostas do Aluno</h2>
              <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <span className="font-medium text-slate-700">{submission.studentName}</span>
                <span>•</span>
                <span>{submission.studentEmail}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b bg-white shrink-0">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase">Nota Final</span>
              <span className={`text-2xl font-black ${submission.percentage >= 70 ? "text-emerald-600" : "text-rose-600"}`}>
                {submission.score.toFixed(1)} / {submission.totalPoints.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase">Aproveitamento</span>
              <span className="text-xl font-bold text-slate-800">{submission.percentage.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase">Tempo de Prova</span>
              <div className="flex items-center gap-1.5 text-slate-800">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-lg">{formatTime(submission.timeElapsedSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/50 space-y-6">
            {orderedQuestions.map((q, idx) => {
              const studentAnsObj = submission.answers.find(a => a.questionId === q.id)
              const studentAnswer = studentAnsObj?.answer || ""
              const isDiscursive = q.type === "discursive"
              const isCorrect = studentAnswer === q.correctAnswer
              let hasAnswered = !!studentAnswer
              
              let parsedAns: Record<string, string> = {}
              let parsedCorrect: Record<string, string> = {}
              if (q.type === "matching") {
                  try { parsedAns = JSON.parse(studentAnswer) } catch {}
                  try { parsedCorrect = JSON.parse(q.correctAnswer) } catch {}
                  hasAnswered = Object.keys(parsedAns).length > 0
              }

              return (
                <div key={q.id} className={`p-5 rounded-xl border-2 ${
                  isDiscursive ? "border-amber-200 bg-amber-50/30" : 
                  !hasAnswered ? "border-slate-200 bg-white" :
                  isCorrect ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"
                }`}>
                  {/* Question Title & Status */}
                  <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b border-slate-100">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="text-sm font-medium text-slate-900 leading-relaxed">
                        {q.text}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">
                        {FORMAT_LABELS[q.type]}
                      </span>
                      {!isDiscursive && hasAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      {!isDiscursive && hasAnswered && !isCorrect && <XCircle className="h-5 w-5 text-rose-500" />}
                      {!isDiscursive && !hasAnswered && <AlertTriangle className="h-5 w-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Rendering answer logic based on type */}
                  <div className="pl-9 space-y-3">
                    
                    {/* Em Branco */}
                    {!hasAnswered && !isDiscursive && (
                      <div className="text-sm italic text-slate-400 font-medium bg-slate-100/50 p-3 rounded-lg border border-slate-200">
                        Nenhuma resposta fornecida pelo aluno.
                      </div>
                    )}

                    {/* Discursiva */}
                    {isDiscursive && (
                      <div className="flex flex-col gap-2">
                        <div className="text-xs font-bold text-amber-700 uppercase">Resposta Escrita</div>
                        <div className="text-sm text-slate-800 p-4 rounded-lg bg-white border border-amber-200 whitespace-pre-wrap">
                          {studentAnswer || <span className="italic text-slate-400">Em branco</span>}
                        </div>
                      </div>
                    )}

                    {/* Múltipla Escolha / Incorreta / TF */}
                    {(q.type === "multiple-choice" || q.type === "incorrect-alternative" || q.type === "true-false") && (
                      <div className="flex flex-col gap-2">
                        {q.choices?.map((c) => {
                          const isStudentChoice = c.id === studentAnswer
                          const isActuallyCorrect = c.id === q.correctAnswer
                          
                          let style = "border-slate-200 bg-white text-slate-700"
                          if (isActuallyCorrect) style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium shadow-sm ring-1 ring-emerald-500"
                          else if (isStudentChoice) style = "border-rose-500 bg-rose-50 text-rose-900 line-through opacity-80"

                          return (
                            <div key={c.id} className={`p-3 rounded-lg border text-sm flex items-start gap-3 transition-colors ${style}`}>
                              <div className="mt-0.5 shrink-0 flex">
                                {isActuallyCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                {isStudentChoice && !isActuallyCorrect && <XCircle className="h-4 w-4 text-rose-600" />}
                                {!isActuallyCorrect && !isStudentChoice && <div className="w-4 h-4 rounded-full border border-slate-300" />}
                              </div>
                              <span className="flex-1">{c.text}</span>
                              {isStudentChoice && <span className="text-[10px] font-bold uppercase tracking-wide shrink-0 px-1.5 py-0.5 rounded bg-black/5 text-slate-600">Resposta</span>}
                              {isActuallyCorrect && <span className="text-[10px] font-bold uppercase tracking-wide shrink-0 px-1.5 py-0.5 rounded bg-emerald-600 text-white">Correta</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Preencher a Lacuna */}
                    {q.type === "fill-in-the-blank" && hasAnswered && (
                      <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1 p-3 border rounded-lg bg-white">
                          <span className="text-xs font-bold text-slate-500 uppercase">Aluno Respondeu:</span>
                          <span className={`text-sm font-medium ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>{studentAnswer}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1 p-3 border border-emerald-200 rounded-lg bg-emerald-50">
                          <span className="text-xs font-bold text-emerald-700 uppercase">Gabarito:</span>
                          <span className="text-sm font-medium text-emerald-900">{q.correctAnswer}</span>
                        </div>
                      </div>
                    )}

                    {/* Associação */}
                    {q.type === "matching" && q.pairs && (
                      <div className="flex flex-col gap-2">
                        {q.pairs.map(p => {
                          const sAns = parsedAns[p.id]
                          const cAns = parsedCorrect[p.id]
                          const isMatchCorrect = sAns === cAns
                          return (
                            <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                              !sAns ? "border-slate-200 bg-white" :
                              isMatchCorrect ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50"
                            }`}>
                              <div className="flex-1 text-sm font-medium">{p.left}</div>
                              <div className="shrink-0 text-slate-400 font-bold">→</div>
                              <div className="flex-1 text-sm">
                                {sAns ? (
                                  <span className={isMatchCorrect ? "text-emerald-700 font-medium" : "text-rose-700 line-through"}>{sAns}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Sem resposta</span>
                                )}
                                {!isMatchCorrect && (
                                  <div className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Correto: {cAns}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
