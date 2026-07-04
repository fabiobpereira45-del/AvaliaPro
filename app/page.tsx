"use client"

import { useState, useEffect, useCallback } from "react"
import { AssessmentHeader } from "@/components/assessment-header"
import { StudentLogin } from "@/components/student-login"
import { AssessmentForm } from "@/components/assessment-form"
import { AssessmentResult } from "@/components/assessment-result"
import { ProfessorLogin } from "@/components/professor-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { StudentDashboard } from "@/components/student-dashboard"
import { EnrollmentForm } from "@/components/enrollment-form"
import { GradeViewer } from "@/components/grade-viewer"
import { InstitutionalManager } from "@/components/institutional-manager"
import {
  getStudentSession,
  getSubmissionByEmailAndAssessment,
  getProfessorSession,
  type StudentSession,
  type StudentSubmission,
} from "@/lib/store"
import { BookOpen, GraduationCap, ClipboardList, User, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type View = "landing" | "public-exam-login" | "student-portal-login" | "student-assessment" | "student-result" | "professor-login" | "admin" | "student-dashboard"

export default function HomePage() {
  const [view, setView] = useState<View>("landing")
  const [session, setSession] = useState<StudentSession | null>(null)
  const [submission, setSubmission] = useState<StudentSubmission | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showEnroll, setShowEnroll] = useState(false)
  const [showGrade, setShowGrade] = useState(false)

  useEffect(() => {
    setMounted(true)

    const { hash } = window.location
    const isLoginHash = hash === "#admin" || hash === "#/admin" || hash === "#master"

    // If there is an admin intent in the URL, prioritize the login screen
    if (isLoginHash) {
      setView("professor-login")
      return
    }

    // Restore professor session
    const profSession = getProfessorSession()
    if (profSession) {
      setView("admin")
      return
    }

    // Restore student session (only if not an admin intent)
    async function checkStudentSession() {
      try {
        const studentSession = getStudentSession()
        if (studentSession) {
          const existing = await getSubmissionByEmailAndAssessment(studentSession.email, studentSession.assessmentId)
          if (existing) {
            setSession(studentSession)
            setSubmission(existing)
          } else {
            setSession(studentSession)
          }
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão do aluno:", error)
        // Limpa possíveis dados corrompidos
        setSession(null)
        setSubmission(null)
      }
    }

    checkStudentSession()
  }, [])

  const handleStudentLogin = useCallback(async (sess: StudentSession) => {
    setSession(sess)
    const existing = await getSubmissionByEmailAndAssessment(sess.email, sess.assessmentId)
    if (existing && existing.submittedAt) {
      setSubmission(existing)
      setView("student-result")
    } else {
      setView("student-assessment")
    }
  }, [])

  const handleResult = useCallback((sub: StudentSubmission) => {
    setSubmission(sub)
    setView("student-result")
  }, [])

  const handleSubmit = useCallback((sub: StudentSubmission) => {
    setSubmission(sub)
    setView("student-result")
  }, [])

  const handleProfessorLogin = useCallback(() => {
    setView("admin")
  }, [])

  const handleLogout = useCallback(() => {
    setView("landing")
    setSession(null)
    setSubmission(null)
  }, [])

  if (!mounted) return null

  // Admin views
  if (view === "professor-login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <ProfessorLogin onLogin={handleProfessorLogin} onBack={() => setView("landing")} />
      </div>
    )
  }

  if (view === "admin") {
    return <AdminDashboard onLogout={() => setView("landing")} />
  }

  return (
    <div className="min-h-screen bg-background">
      {!["student-dashboard", "student-portal-login", "student-assessment", "student-result"].includes(view) && (
        <AssessmentHeader
          studentName={session?.name}
          studentEmail={session?.email}
          onAdminClick={() => setView("professor-login")}
          onStudentAreaClick={session ? () => setView("student-dashboard") : undefined}
        />
      )}

      <main className="mx-auto max-w-[1400px] sm:px-4 sm:py-8">
        {/* Landing Page */}
        {view === "landing" && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="bg-gradient-to-br from-[#020617] to-[#0f172a] rounded-b-[2.5rem] sm:rounded-[2.5rem] px-6 py-12 pt-20 sm:p-8 md:p-12 text-white shadow-2xl border-b sm:border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-neon/10 rounded-full -ml-48 -mt-48 blur-[100px]" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-vibrant/10 rounded-full blur-[100px]" />

              <div className="text-left relative z-10 flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-neon/10 border border-emerald-neon/20 text-[10px] uppercase tracking-[0.3em] font-black text-emerald-neon mb-2">
                  Plataforma de Alta Performance
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                  AVALIA <span className="text-emerald-neon">PRO</span><br />
                  <span className="text-emerald-neon text-4xl md:text-5xl">PROVAS & GESTÃO</span>
                </h1>
                <div className="h-2 w-24 bg-emerald-neon rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <p className="text-lg text-slate-400 font-medium max-w-md leading-relaxed">
                  Liderança e Tecnologia em Gestão de Provas. <br />
                  <span className="text-white">Excelência na avaliação acadêmica.</span>
                </p>
                
                <div className="pt-4 flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-emerald-neon font-black tracking-widest">SISTEMA</span>
                    <span className="text-sm font-bold text-white uppercase tracking-tighter">CERTIFICADO 2026</span>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-orange-vibrant font-black tracking-widest">FOCO</span>
                    <span className="text-sm font-bold text-white uppercase tracking-tighter">GESTÃO ACADÊMICA</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex-shrink-0 group">
                <div className="absolute inset-0 bg-emerald-neon/20 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-[3rem] bg-white shadow-2xl transition-transform duration-500 hover:scale-105 overflow-hidden flex items-center justify-center p-8 border-4 border-emerald-neon/20">
                  <img
                    src="/avalia-logo.png"
                    alt="AVALIA Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">

              {/* Desafios Semanais (Antiga Área do Aluno) */}
              <button
                onClick={() => setView("student-portal-login")}
                className="group relative overflow-hidden bg-card border-2 border-border rounded-2xl p-6 text-left shadow-lg hover:shadow-xl hover:border-emerald-neon/40 hover:scale-[1.02] transition-all"
              >
                <div className="absolute inset-0 bg-emerald-neon/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 rounded-xl bg-emerald-neon/10 text-emerald-neon">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="bg-emerald-neon/10 text-emerald-neon text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Beta
                  </div>
                </div>
                <h2 className="text-xl font-extrabold mb-1 text-foreground">Desafios Semanais</h2>
                <p className="text-sm text-muted-foreground">Participe de quizes, enigmas e conquiste XP em sua jornada.</p>
              </button>

              {/* Prova Pública ou Retomar Prova */}
              <button
                onClick={() => {
                  if (session) {
                    if (submission && submission.submittedAt) setView("student-result")
                    else setView("student-assessment")
                  } else {
                    setView("public-exam-login")
                  }
                }}
                className={cn(
                  "group relative overflow-hidden bg-white border-2 rounded-2xl p-6 text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all",
                  session ? "border-indigo-400 bg-indigo-50/20" : "border-border hover:border-accent/40"
                )}
              >
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity", session ? "bg-indigo-400/5" : "bg-accent/5")} />
                <GraduationCap className={cn("h-8 w-8 mb-3", session ? "text-indigo-600" : "text-accent")} />
                <h2 className="text-xl font-extrabold mb-1 text-foreground">
                  {session ? "Retomar minha Prova" : "Prova Pública"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {session 
                    ? "Você tem uma prova em andamento. Clique para continuar." 
                    : "Acesso aberto para avaliações públicas sem matrícula."}
                </p>
                {session && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Sessão Ativa</span>
                  </div>
                )}
              </button>
            </div>

            {/* Espaço removido: seções institucionais suprimidas a pedido do cliente */}
          </div>
        )}

        {view === "public-exam-login" && <StudentLogin onLogin={handleStudentLogin} onResult={handleResult} onBack={() => setView("landing")} />}
        {view === "student-portal-login" && (
          <StudentDashboard session={null} onBack={() => setView("landing")} onLogout={handleLogout} />
        )}
        {view === "student-assessment" && session && (
          <AssessmentForm session={session} onSubmit={handleSubmit} onBack={() => setView("landing")} />
        )}
        {view === "student-result" && submission && (
          <AssessmentResult submission={submission} onBack={handleLogout} />
        )}
        {view === "student-dashboard" && (
          <StudentDashboard
            session={session}
            onBack={() => {
              if (submission && submission.submittedAt) {
                setView("student-result")
              } else if (session) {
                setView("student-assessment")
              } else {
                setView("landing")
              }
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Modals */}
      {showEnroll && (
        <EnrollmentForm
          onClose={() => setShowEnroll(false)}
          onSuccess={() => setView("student-portal-login")}
        />
      )}
      {showGrade && (
        <GradeViewer onClose={() => setShowGrade(false)} />
      )}
    </div>
  )
}
