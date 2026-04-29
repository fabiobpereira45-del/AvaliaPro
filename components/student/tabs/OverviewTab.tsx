"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, CheckCircle2, Library, FileText, BookOpenCheck, MessageSquare } from "lucide-react"
import type { StudentProfile } from "@/lib/store"
import { cn } from "@/lib/utils"

type Tab = "overview" | "materials" | "grades" | "exams" | "chat" | "perfil"

interface OverviewTabProps {
  profile: StudentProfile
  onTabChange: (tab: Tab) => void
}

export function OverviewTab({ profile, onTabChange }: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 bg-[#020617]">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full -mr-40 -mt-40 blur-[100px] opacity-40 bg-emerald-neon/30" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full -ml-32 -mb-32 blur-[80px] opacity-20 bg-orange-vibrant/20" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <h3 className="text-4xl font-black mb-4 leading-tight tracking-tighter">Prepare-se para <br /> sua Próxima Prova!</h3>
              <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
                Olá, {profile.name.split(' ')[0]}. Sua jornada acadêmica foca agora na excelência das avaliações.
              </p>
            </div>
            <div className="flex gap-4">
              <Button className="vibrant-button-emerald h-14 px-10 text-lg" onClick={() => onTabChange("exams")}>
                Acessar Provas
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/5 font-bold rounded-2xl h-14 px-8 border border-white/10" onClick={() => onTabChange("materials")}>
                Materiais
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border/50 shadow-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2 ring-4 ring-primary/5">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold">Status Acadêmico</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No momento você está em dia com todas as obrigações e materiais.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100 uppercase tracking-tighter">
              Matrícula Regular
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: "exams", label: "Minhas Provas", sub: "Avaliações Disponíveis", icon: BookOpenCheck, color: "text-emerald-neon", bg: "bg-emerald-neon/10" },
          { id: "grades", label: "Desempenho", sub: "Notas e Boletim", icon: FileText, color: "text-orange-vibrant", bg: "bg-orange-vibrant/10" },
          { id: "materials", label: "Biblioteca", sub: "Materiais de Estudo", icon: Library, color: "text-blue-400", bg: "bg-blue-400/10" },
          { id: "chat", label: "Suporte", sub: "Dúvidas e Chat", icon: MessageSquare, color: "text-white", bg: "bg-white/10" },
        ].map((card) => (
          <button key={card.id} onClick={() => onTabChange(card.id as Tab)} className="bg-[#020617] border border-white/5 rounded-[2rem] p-8 shadow-xl hover:border-emerald-neon/40 transition-all text-left flex flex-col group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[3rem]" />
            <div className={cn("p-3 rounded-2xl mb-6 w-12 h-12 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg", card.bg, card.color)}>
              <card.icon className="h-6 w-6" />
            </div>
            <h4 className="font-black text-xl text-white tracking-tight">{card.label}</h4>
            <p className="text-[10px] text-emerald-neon/60 mt-2 uppercase font-black tracking-widest">{card.sub}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
