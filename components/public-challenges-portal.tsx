"use client"

import { useState } from "react"
import { ArrowLeft, User, Trophy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StudentChallengeView } from "./student-challenge-view"

interface Props {
  onBack: () => void
}

export function PublicChallengesPortal({ onBack }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLogged, setIsLogged] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      alert("Por favor, preencha nome e e-mail.")
      return
    }
    
    setLoading(true)
    // Simulate a brief verification, could also save to a "prospects" table
    setTimeout(() => {
      setLoading(false)
      setIsLogged(true)
    }, 800)
  }

  if (isLogged) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-8rem)]">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
        <StudentChallengeView studentEmail={email} studentName={name} />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-[60vh] flex flex-col justify-center py-12 px-4 animate-in fade-in duration-500">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-primary -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Início
        </Button>
      </div>
      
      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 text-center">
        <div className="h-20 w-20 bg-emerald-neon/10 text-emerald-neon rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Trophy className="h-10 w-10" />
        </div>
        
        <h1 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Desafios Semanais</h1>
        <p className="text-sm text-slate-500 mb-8 font-medium">
          Acesso aberto! Insira seus dados para participar dos enigmas e quizzes.
        </p>

        <form onSubmit={handleStart} className="space-y-5 text-left">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Como quer ser chamado?" 
                className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-neon"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Seu E-mail principal</Label>
            <Input 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="seu@email.com" 
              className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-neon"
              required
            />
            <p className="text-[10px] text-slate-400 font-medium">
              Usaremos o e-mail para salvar seu progresso e XP.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-bold vibrant-button-emerald mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar Jornada"}
          </Button>
        </form>
      </div>
    </div>
  )
}
