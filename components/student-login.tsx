"use client"

import { useState, useEffect } from "react"
import { Mail, User, ArrowRight, BookOpenCheck, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import {
  getActiveAssessment,
  getPublicAssessments,
  hasStudentSubmitted,
  saveStudentSession,
  getQuestionsByDiscipline,
  getDisciplines,
  getSubmissionByEmailAndAssessment,
  type Assessment,
  type Question,
  type Discipline,
  type StudentSession,
  type StudentSubmission,
} from "@/lib/store"
import { cn } from "@/lib/utils"

interface Props {
  onLogin: (session: StudentSession) => void
  onResult?: (submission: StudentSubmission) => void
  onBack?: () => void
  preloadedAssessmentId?: string
}

export function StudentLogin({ onLogin, onResult, onBack, preloadedAssessmentId }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isForgot, setIsForgot] = useState(false)

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [publicAssessments, setPublicAssessments] = useState<Assessment[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [disc, setDisc] = useState<Discipline | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showSelection, setShowSelection] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        if (preloadedAssessmentId) {
          const a = await getActiveAssessment(preloadedAssessmentId)
          if (!mounted) return
          setAssessment(a)
          if (a) await loadAssessmentDetails(a)
        } else {
          const allPublic = await getPublicAssessments()
          if (!mounted) return
          setPublicAssessments(allPublic)
          if (allPublic.length === 1) {
            setAssessment(allPublic[0])
            await loadAssessmentDetails(allPublic[0])
          }
        }
      } catch (err: any) {
        console.error("Init error:", err)
        setInitError(err.message || "Erro desconhecido ao carregar avaliação")
      } finally {
        if (mounted) setIsInitializing(false)
      }
    }

    async function loadAssessmentDetails(a: Assessment) {
      const [allQs, allDs] = await Promise.all([
        getQuestionsByDiscipline(a.disciplineId),
        getDisciplines()
      ])
      if (!mounted) return
      setQuestions(allQs.filter(q => a.questionIds.includes(q.id)))
      setDisc(allDs.find(d => d.id === a.disciplineId) || null)
    }

    init()
    return () => { mounted = false }
  }, [preloadedAssessmentId])

  async function processLogin(isQuery: boolean, selectedA?: Assessment) {
    setError(null)
    const trimName = name.trim()
    const trimEmail = email.trim().toLowerCase()
    
    if (trimName.length < 3) { setError("Informe seu nome completo (mínimo 3 caracteres)."); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) { setError("Informe um e-mail válido."); return }

    const targetA = selectedA || assessment

    // Se houver múltiplas provas e nenhuma selecionada, mostramos a seleção
    if (!targetA && publicAssessments.length > 1) {
      setShowSelection(true)
      return
    }

    if (!targetA) {
      setError("Selecione uma avaliação para continuar.")
      return
    }

    setLoading(true)
    
    const now = new Date()
    const isTakeable = targetA.isPublished &&
      (!targetA.openAt || new Date(targetA.openAt) <= now) &&
      (!targetA.closeAt || new Date(targetA.closeAt) >= now)

    const submitted = await hasStudentSubmitted(trimEmail, targetA.id)

    if (!isQuery && !isTakeable) {
      setError("Esta avaliação está encerrada ou não disponível para novos envios.")
      setLoading(false); return
    }

    if (isQuery && !submitted) {
      setError("Nenhuma avaliação finalizada foi encontrada para este e-mail para esta prova.")
      setLoading(false); return
    }
    if (!isQuery && submitted) {
      setError(`ACESSO BLOQUEADO: Você já finalizou a prova "${targetA.title}" anteriormente.`)
      setLoading(false); return
    }

    // ── Ver resultado: fetch submission and show result directly ──────────────
    if (isQuery && submitted) {
      const sub = await getSubmissionByEmailAndAssessment(trimEmail, targetA.id)
      if (!sub) {
        setError("Não foi possível carregar o resultado. Tente novamente.")
        setLoading(false); return
      }
      setLoading(false)
      if (onResult) onResult(sub)
      return
    }

    // ── Normal login: start assessment ────────────────────────────────────────
    const session: StudentSession = { name: trimName, email: trimEmail, assessmentId: targetA.id, startedAt: new Date().toISOString() }
    saveStudentSession(session)
    onLogin(session)
    setLoading(false)
  }

  async function handleSelectAssessment(a: Assessment) {
    setAssessment(a)
    setError(null)
    setLoading(true)
    try {
      const [allQs, allDs] = await Promise.all([
        getQuestionsByDiscipline(a.disciplineId),
        getDisciplines()
      ])
      setQuestions(allQs.filter(q => a.questionIds.includes(q.id)))
      setDisc(allDs.find(d => d.id === a.disciplineId) || null)
      setShowSelection(false)
    } catch (err) {
      setError("Erro ao carregar detalhes da prova selecionada.")
    } finally {
      setLoading(false)
      // Após selecionar, tentamos logar automaticamente com os dados já preenchidos
      const trimName = name.trim()
      const trimEmail = email.trim().toLowerCase()
      if (trimName.length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
        processLogin(false, a)
      }
    }
  }

  const hasDiscursive = questions.some(q => q.type === "discursive")
  const hasTrueFalse = questions.some(q => q.type === "true-false")
  const hasMultiple = questions.some(q => q.type === "multiple-choice")
  const formats = [hasMultiple && "Objetiva", hasTrueFalse && "V/F", hasDiscursive && "Discursiva"].filter(Boolean).join(" • ")

  if (isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center py-32 gap-4">
        <div className="relative flex h-20 w-20">
          <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-neon opacity-20" />
          <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-neon text-white shadow-2xl">
            <BookOpenCheck className="h-10 w-10 animate-pulse" />
          </div>
        </div>
        <p className="text-emerald-neon font-black uppercase tracking-widest text-xs animate-pulse">Iniciando Ambiente AVALIA...</p>
      </div>
    )
  }

  const now = new Date()
  let takeableStatus = "ok"
  if (assessment) {
    if (!assessment.isPublished) takeableStatus = "unpublished"
    else if (assessment.openAt && new Date(assessment.openAt) > now) takeableStatus = "waiting"
    else if (assessment.closeAt && new Date(assessment.closeAt) < now) takeableStatus = "closed"
  }
  const isTakeable = assessment && takeableStatus === "ok"

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full gap-8 relative z-10">
      {onBack && (
        <div className="w-full flex justify-start mb-2">
           <button 
            type="button" 
            onClick={onBack} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all font-black text-[10px] uppercase tracking-[0.2em] group shadow-sm"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-1" />
            Sair / Voltar para Início
          </button>
        </div>
      )}

      {/* Premium Hero Card */}
      {assessment ? (
        <div className="w-full rounded-[2.5rem] bg-[#020617] text-white p-10 flex flex-col items-center gap-8 text-center shadow-2xl border border-white/5 relative overflow-hidden group">
          {/* Decorative background objects */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-neon/20 rounded-full blur-[100px] -mr-40 -mt-40 transition-all duration-1000 group-hover:bg-emerald-neon/30" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-vibrant/10 rounded-full blur-[80px] -ml-32 -mb-32 transition-all duration-1000 group-hover:bg-orange-vibrant/20" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-neon/20 transform transition-transform group-hover:scale-105 overflow-hidden p-2">
                 <img src="/avalia-logo.png" alt="AVALIA" className="h-full w-full object-contain" />
              </div>
              {assessment.contracting_institution_logo && (
                <>
                  <div className="h-10 w-0.5 bg-white/10" />
                  <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-white/5 transform transition-transform group-hover:scale-105 overflow-hidden p-2">
                    <img src={assessment.contracting_institution_logo} alt="Partner" className="h-full w-full object-contain" />
                  </div>
                </>
              )}
            </div>
            
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 text-emerald-neon text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5" />
                AVALIA — Gestão de Provas
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white leading-none mb-4">{assessment.title}</h1>
            <p className="text-slate-400 text-lg font-medium">
              <span className="text-white">{disc?.name ?? "Módulo Geral"}</span>
              <span className="mx-3 opacity-20">/</span> 
              {disc?.professorName || assessment.professor}
            </p>
          </div>
 
          <div className="flex flex-wrap justify-center gap-4 border-t border-white/5 pt-8 w-full mt-2 relative z-10">
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5">
              <BookOpenCheck className="h-5 w-5 text-emerald-neon" />
              <span className="text-sm font-bold text-slate-200">{assessment.questionIds.length} Questões</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5">
              <Sparkles className="h-5 w-5 text-orange-vibrant" />
              <span className="text-sm font-bold text-slate-200">{assessment.totalPoints.toFixed(1)} Pontos</span>
            </div>
          </div>
        </div>
      ) : publicAssessments.length > 0 ? (
        <div className="w-full rounded-[2.5rem] bg-[#020617] text-white p-10 flex flex-col items-center gap-8 text-center shadow-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-neon/20 rounded-full blur-[100px] -mr-40 -mt-40 transition-all duration-1000 group-hover:bg-emerald-neon/30" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-vibrant/10 rounded-full blur-[80px] -ml-32 -mb-32 transition-all duration-1000 group-hover:bg-orange-vibrant/20" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-neon/20 transform transition-transform group-hover:scale-105 overflow-hidden p-2 mb-6">
              <img src="/avalia-logo.png" alt="AVALIA" className="h-full w-full object-contain" />
            </div>
            
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 text-emerald-neon text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Selecione sua Prova
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white leading-none mb-4">Múltiplas Avaliações</h1>
            <p className="text-slate-400 text-lg font-medium max-w-sm">
              Identificamos <span className="text-white font-bold">{publicAssessments.length} provas públicas</span> ativas. Insira seus dados para escolher qual realizar.
            </p>
          </div>

          <div className="flex justify-center pt-4 w-full mt-2 relative z-10">
            <Button 
              variant="outline" 
              onClick={() => setShowSelection(true)}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl h-12 px-8"
            >
              Ver Lista de Provas
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-[2rem] bg-white border border-border p-10 flex flex-col items-center gap-4 text-center premium-shadow">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-xl font-bold text-foreground">Nenhuma avaliação disponível</p>
          <p className="text-base text-muted-foreground max-w-xs">
            {initError ? `Erro: ${initError}` : "Aguarde o professor publicar a avaliação para acessá-la."}
          </p>
        </div>
      )}

      {/* Main Form Box */}
      <div className="w-full rounded-[2rem] bg-white border border-slate-200/60 premium-shadow p-8 sm:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-xl">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 accent-gradient" />

        {isForgot ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-2 hidden">
              {/* Optional header */}
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl text-sm leading-relaxed shadow-sm">
              <span className="font-bold flex items-center gap-2 mb-2 text-base">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                Recuperação Segura
              </span>
              A recuperação de acesso para alunos é controlada internamente. Por favor, solicite a verificação dos seus dados diretamente no atendimento.
            </div>

            <a href="https://wa.me/5571987483103?text=Olá, preciso recuperar meu login de estudante." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <CheckCircle2 className="h-5 w-5" /> Acionar Secretaria (WhatsApp)
            </a>

            <button type="button" onClick={() => setIsForgot(false)} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors mt-2">
              ← Cancelar e Voltar
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
              <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tight">Acesso ao Exame</h2>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Identifique-se para iniciar a avaliação. Seus dados são protegidos e o progresso é salvo em tempo real.
              </p>
            </div>
            
            <form onSubmit={e => { e.preventDefault(); processLogin(false) }} className="flex flex-col gap-6">
              <div className="group relative z-0 w-full transition-all">
                <div className="relative flex items-center">
                  <User className="absolute left-4 z-10 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <Input 
                    id="student-name" 
                    placeholder=" " 
                    className="peer block w-full appearance-none rounded-xl border border-slate-300 bg-transparent px-4 pl-12 pt-6 pb-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm h-14 transition-all" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    autoFocus 
                  />
                  <Label 
                    htmlFor="student-name" 
                    className="absolute left-12 top-4 -z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-slate-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-12 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary peer-focus:font-medium"
                  >
                    Nome Completo
                  </Label>
                </div>
              </div>

              <div className="group relative z-0 w-full transition-all">
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 z-10 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <Input 
                    id="student-email" 
                    type="email" 
                    placeholder=" " 
                    className="peer block w-full appearance-none rounded-xl border border-slate-300 bg-transparent px-4 pl-12 pt-6 pb-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm h-14 transition-all" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                  <Label 
                    htmlFor="student-email" 
                    className="absolute left-12 top-4 -z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-slate-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-12 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary peer-focus:font-medium"
                  >
                    E-mail Institucional ou Pessoal
                  </Label>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 leading-snug">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={loading || !assessment || !isTakeable} 
                  className="vibrant-button-emerald font-black h-16 text-lg flex-1 rounded-2xl"
                >
                  {isTakeable ? "INICIAR AVALIAÇÃO" : 
                   takeableStatus === "waiting" ? "AGUARDANDO ABERTURA" :
                   takeableStatus === "closed" ? "AVALIAÇÃO ENCERRADA" :
                   "EXAME INDISPONÍVEL"} <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  disabled={loading || !assessment} 
                  onClick={() => processLogin(true)} 
                  className={cn("text-sm font-semibold transition-colors flex items-center gap-1.5", loading || !assessment ? "text-slate-300" : "text-primary hover:text-primary/80")}
                >
                  Ver Resultado Anterior
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsForgot(true)} 
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Problemas no acesso?
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Selection Modal or Overlay */}
      {showSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-[#020617] p-8 text-white relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-neon/10 rounded-full blur-[60px] -mr-24 -mt-24" />
              <h3 className="text-2xl font-black tracking-tight mb-2 relative z-10">Escolha sua Avaliação</h3>
              <p className="text-slate-400 text-sm relative z-10">Existem múltiplas provas públicas disponíveis. Selecione a que deseja realizar agora.</p>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-3">
              {publicAssessments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSelectAssessment(a)}
                  className="group flex flex-col gap-1 p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-neon/40 hover:bg-emerald-neon/[0.02] text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-neon transition-colors leading-tight">{a.title}</span>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-neon transition-all group-hover:translate-x-1" />
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                    <span className="flex items-center gap-1"><BookOpenCheck className="h-3.5 w-3.5" /> {a.questionIds.length} Questões</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span>{a.professor}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button variant="ghost" onClick={() => setShowSelection(false)} className="font-bold text-slate-500">Voltar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white/50 px-4 py-2 rounded-full border border-slate-200">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        Sessão segura e monitorada. Respostas salvas automaticamente.
      </div>
    </div>
  )
}
