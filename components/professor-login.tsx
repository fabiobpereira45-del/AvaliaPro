"use client"

import { useState } from "react"
import { BookOpen, Eye, EyeOff, Lock, Mail, UserPlus, LogIn, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { saveProfessorSession, MASTER_CREDENTIALS, ensureProfessorSync, getProfessorByEmail } from "@/lib/store"

interface Props {
  onLogin: () => void
  onBack?: () => void
}

export function ProfessorLogin({ onLogin, onBack }: Props) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgot, setIsForgot] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function reset() {
    setError("")
    setMessage("")
    setIsSignUp(false)
    setIsForgot(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    if (!email.trim()) { setError("Informe o e-mail."); return }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (err) throw err
      setMessage("E-mail de recuperação enviado! Verifique sua caixa de entrada.")
    } catch (err: any) {
      setError(err.message || "Erro ao enviar e-mail.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    try {
      if (isSignUp) {
        if (!name.trim()) { setError("O nome é obrigatório para o cadastro."); setLoading(false); return }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name, role: "professor" } }
        })
        if (signUpError) throw signUpError
        if (data.session) {
          saveProfessorSession(data.user!.id, data.user!.user_metadata.role || "professor")
          onLogin()
        } else {
          setMessage("Cadastro realizado! Verifique seu e-mail para confirmar a conta.")
          setIsSignUp(false)
        }
      } else {
        const normalizedEmail = email.toLowerCase().trim()
        const isHardcodedMaster = normalizedEmail === MASTER_CREDENTIALS.email || normalizedEmail === "admin@avalia.com"
        
        if (isHardcodedMaster && password === MASTER_CREDENTIALS.password) {
            // Check if account exists in DB first to get photo, etc.
            const dbProfile = await getProfessorByEmail(normalizedEmail)
            const finalAvatar = dbProfile?.avatar_url || null
            saveProfessorSession("master", "master", finalAvatar)
            onLogin()
            return
        }
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        if (data.session) {
          // Fetch full profile from DB to seed the session correctly
          const authRole = data.user.user_metadata?.role || data.user.user_metadata?.type
          let finalRole = authRole
          let finalId = data.user.id
          let finalAvatar = null
          
          if (data.user.email) {
            const dbProfile = await getProfessorByEmail(data.user.email)
            if (dbProfile) {
                finalId = dbProfile.id // Use DB ID instead of Auth UUID
                finalRole = dbProfile.role
                finalAvatar = dbProfile?.avatar_url || null
            }
          }

          if (finalRole !== "master" && finalRole !== "professor") {
            await supabase.auth.signOut()
            throw new Error("Acesso negado. Esta área é restrita a professores.")
          }

          saveProfessorSession(finalId, finalRole, finalAvatar)
          // Sync ID with professor_accounts table
          if (data.user.email) {
            await ensureProfessorSync(data.user.email, data.user.id)
          }
          onLogin()
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro na autenticação.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-10 group">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-[2rem] bg-emerald-neon text-white shadow-xl shadow-emerald-neon/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative overflow-hidden">
           <Sparkles className="h-12 w-12" />
           <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-bl-2xl" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter leading-tight">Painel Docente</h1>
        <p className="text-emerald-neon text-[10px] font-black uppercase tracking-[0.2em] mt-3 text-balance leading-relaxed">AVALIA — Gestão de Provas e Avaliações</p>
        <div className="h-1.5 w-12 bg-emerald-neon mx-auto mt-6 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      </div>

      <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        {/* Forgot Password */}
        {isForgot ? (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-neon/10 mb-4 shadow-inner">
                <KeyRound className="h-6 w-6 text-emerald-neon" />
              </div>
              <h2 className="font-black text-xl text-white tracking-tight">Recuperar Senha</h2>
              <p className="text-xs text-slate-500 mt-2 font-medium">Enviaremos as instruções para seu e-mail</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="forgot-email" className="text-[10px] font-black uppercase tracking-widest text-emerald-neon ml-1">E-mail Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                <Input id="forgot-email" type="email" placeholder="nome@avalia.com" value={email} onChange={e => setEmail(e.target.value)} className="h-14 pl-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-neon" required autoFocus />
              </div>
            </div>
            {error && <p className="text-xs text-orange-vibrant font-bold bg-orange-vibrant/5 rounded-xl px-4 py-3 border border-orange-vibrant/20">{error}</p>}
            {message && <p className="text-xs text-emerald-neon font-bold bg-emerald-neon/5 rounded-xl px-4 py-3 flex items-center gap-2 border border-emerald-neon/20"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</p>}
            <Button type="submit" className="vibrant-button-emerald h-14 font-black text-sm" disabled={loading}>
              {loading ? "Processando..." : "ENVIAR RECUPERAÇÃO"}
            </Button>
            <button type="button" onClick={reset} className="text-xs font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest mt-2">← Cancelar</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prof-name" className="text-[10px] font-black uppercase tracking-widest text-emerald-neon ml-1">Nome Completo</Label>
                <div className="relative">
                  <Input id="prof-name" type="text" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required={isSignUp} className="h-14 bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-neon" />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prof-email" className="text-[10px] font-black uppercase tracking-widest text-emerald-neon ml-1">E-mail de Acesso</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                <Input id="prof-email" type="email" placeholder="professor@avalia.com" value={email} onChange={e => setEmail(e.target.value)} className="h-14 pl-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-neon" required autoFocus />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="prof-password" className="text-[10px] font-black uppercase tracking-widest text-emerald-neon ml-1">Senha</Label>
                {!isSignUp && (
                  <button type="button" onClick={() => { setIsForgot(true); setError(""); setMessage("") }} className="text-[10px] font-black text-slate-500 hover:text-emerald-neon transition-colors uppercase tracking-widest">
                    Esqueci a senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                <Input id="prof-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-14 pl-12 pr-12 bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-neon" required />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-orange-vibrant font-bold bg-orange-vibrant/5 rounded-xl px-4 py-3 border border-orange-vibrant/20">{error}</p>}
            <Button type="submit" className="vibrant-button-emerald h-16 font-black text-sm uppercase tracking-widest mt-2" disabled={loading}>
              {loading ? "Verificando..." : isSignUp ? "CRIAR CONTA DOCENTE" : "ENTRAR NO PAINEL"}
            </Button>
            <div className="text-center mt-2">
              <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage("") }} className="text-[10px] font-black text-slate-500 hover:text-emerald-neon transition-all uppercase tracking-widest">
                {isSignUp ? "Já tenho acesso. Login." : "Solicitar novo acesso docente"}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6 mb-4">Acesso exclusivo para professores e coordenadores</p>
      {onBack && (
        <div className="text-center">
          <button type="button" onClick={onBack} className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 transition-colors">
            ← Voltar
          </button>
        </div>
      )}
    </div>
  )
}
