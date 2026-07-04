"use client"

import { useState, useEffect } from "react"
import { 
    Trophy, Zap, Star, Lock, CheckCircle2, 
    BrainCircuit, HelpCircle, MessageSquare, 
    ChevronRight, Loader2, PlayCircle, Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { 
    type Challenge, type ChallengeSubmission, 
    getChallenges, getChallengeSubmissions, saveChallengeSubmission
} from "@/lib/store"

interface Props {
    studentEmail: string
    studentName: string
}

export function StudentChallengeView({ studentEmail, studentName }: Props) {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
    const [answer, setAnswer] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [failedAttempts, setFailedAttempts] = useState(0)
    const [lastError, setLastError] = useState("")

    useEffect(() => {
        loadData()
    }, [studentEmail])

    async function loadData() {
        setLoading(true)
        try {
            const [c, s] = await Promise.all([
                getChallenges(), 
                getChallengeSubmissions(studentEmail)
            ])
            setChallenges(c.filter(ch => ch.isActive).sort((a, b) => a.week - b.week))
            setSubmissions(s)
        } catch (error) {
            console.error("Erro ao carregar desafios:", error)
        } finally {
            setLoading(false)
        }
    }

    const totalXP = submissions.reduce((acc, s) => acc + (s.isCompleted ? s.earnedXP : 0), 0)
    const level = Math.floor(totalXP / 100) + 1
    const progressToNextLevel = totalXP % 100

    function isLocked(index: number) {
        if (index === 0) return false
        const prevChallenge = challenges[index - 1]
        const prevSub = submissions.find(s => s.challengeId === prevChallenge.id)
        return !prevSub || !prevSub.isCompleted
    }

    async function handleSubmit() {
        if (!selectedChallenge || !answer.trim()) return
        
        setIsSubmitting(true)
        const isCorrect = answer.toLowerCase().trim() === (selectedChallenge.correctAnswer || "").toLowerCase().trim()
        
        try {
            if (isCorrect) {
                const penaltyPerFail = Math.floor(selectedChallenge.pointsXP * 0.2)
                const calculatedXP = selectedChallenge.type !== 'quiz' 
                    ? Math.max(selectedChallenge.pointsXP - (failedAttempts * penaltyPerFail), 10)
                    : selectedChallenge.pointsXP

                await saveChallengeSubmission({
                    challengeId: selectedChallenge.id,
                    studentEmail,
                    isCompleted: true,
                    earnedXP: calculatedXP
                })
                setShowSuccess(true)
                setTimeout(() => {
                    setShowSuccess(false)
                    setSelectedChallenge(null)
                    setAnswer("")
                    setFailedAttempts(0)
                    setLastError("")
                    loadData()
                }, 2000)
            } else {
                if (selectedChallenge.type !== 'quiz') {
                    setFailedAttempts(prev => prev + 1)
                    setLastError("Resposta incorreta! Veja a dica abaixo.")
                } else {
                    setLastError("Resposta incorreta! Tente novamente.")
                }
                setAnswer("")
            }
        } catch (error: any) {
            alert("Erro ao salvar: " + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-neon opacity-40" />
                <p className="text-sm font-medium text-slate-500">Buscando seus desafios...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* XP Header */}
            <div className="bg-[#020617] rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-neon/10 blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-3xl bg-emerald-neon/20 border border-emerald-neon/30 flex items-center justify-center relative">
                            <Zap className="h-10 w-10 text-emerald-neon fill-emerald-neon" />
                            <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-lg">
                                LVL {level}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{studentName.split(' ')[0]}</h2>
                            <p className="text-emerald-neon text-xs font-black uppercase tracking-widest mt-1">Explorador Teológico</p>
                        </div>
                    </div>
                    <div className="flex-1 md:max-w-md">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Total: {totalXP}</span>
                            <span className="text-[10px] font-black text-emerald-neon uppercase tracking-widest">Próximo Nível: {100 - progressToNextLevel} XP</span>
                        </div>
                        <Progress value={progressToNextLevel} className="h-2.5 bg-white/5 border border-white/10" />
                    </div>
                </div>
            </div>

            {/* Challenges Timeline */}
            <div className="grid grid-cols-1 gap-4">
                {challenges.map((c, index) => {
                    const sub = submissions.find(s => s.challengeId === c.id)
                    const locked = isLocked(index)
                    const completed = sub?.isCompleted

                    return (
                        <div 
                            key={c.id} 
                            className={cn(
                                "group relative overflow-hidden rounded-[2rem] border-2 transition-all p-6",
                                completed ? "bg-emerald-neon/5 border-emerald-neon/20 shadow-lg shadow-emerald-neon/5" :
                                locked ? "bg-slate-50 border-slate-100 opacity-60" :
                                "bg-white border-border/50 shadow-sm hover:shadow-xl hover:border-emerald-neon/40 cursor-pointer"
                            )}
                            onClick={() => {
                                if (!locked && !completed) {
                                    setSelectedChallenge(c)
                                    setFailedAttempts(0)
                                    setLastError("")
                                }
                            }}
                        >
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-110",
                                    completed ? "bg-emerald-neon border-emerald-neon text-white" :
                                    locked ? "bg-slate-200 border-slate-200 text-slate-400" :
                                    "bg-white border-slate-100 text-slate-400 group-hover:border-emerald-neon group-hover:text-emerald-neon"
                                )}>
                                    {completed ? <CheckCircle2 className="h-7 w-7" /> :
                                     locked ? <Lock className="h-6 w-6" /> :
                                     c.type === 'enigma' ? <BrainCircuit className="h-7 w-7" /> :
                                     c.type === 'quiz' ? <HelpCircle className="h-7 w-7" /> :
                                     c.type === 'decifrar' ? <Zap className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semana {c.week}</span>
                                        {completed && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-neon">Concluído</span>}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 leading-tight">{c.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.description}</p>
                                </div>

                                <div className="hidden sm:flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1">
                                        <Zap className={cn("h-4 w-4", completed ? "text-emerald-neon" : "text-slate-300")} />
                                        <span className={cn("text-xs font-black", completed ? "text-emerald-neon" : "text-slate-400")}>
                                            {c.pointsXP} XP
                                        </span>
                                    </div>
                                    {!completed && !locked && (
                                        <div className="text-[10px] font-black text-emerald-neon uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Iniciar <ChevronRight className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Challenge Detail Overlay */}
            {selectedChallenge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="bg-[#020617] p-8 text-white relative">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setSelectedChallenge(null)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10"
                            >
                                <Lock className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-emerald-neon/20 text-emerald-neon">
                                    <BrainCircuit className="h-8 w-8" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-neon">Missão Semana {selectedChallenge.week}</span>
                                    <h2 className="text-3xl font-black tracking-tight">{selectedChallenge.title}</h2>
                                </div>
                            </div>
                            <p className="text-slate-400 leading-relaxed">{selectedChallenge.description}</p>
                        </div>
                        
                        <div className="p-8 flex-1 overflow-y-auto space-y-6">
                            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 italic text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {selectedChallenge.content}
                            </div>
                            
                            {showSuccess ? (
                                <div className="bg-emerald-neon/10 border-2 border-emerald-neon rounded-2xl p-8 text-center animate-in zoom-in duration-500">
                                    <Trophy className="h-16 w-16 text-emerald-neon mx-auto mb-4 animate-bounce" />
                                    <h3 className="text-2xl font-black text-emerald-neon">DESAFIO CONCLUÍDO!</h3>
                                    <p className="text-emerald-neon/70 font-bold">Você ganhou +{selectedChallenge.type !== 'quiz' ? Math.max(selectedChallenge.pointsXP - (failedAttempts * Math.floor(selectedChallenge.pointsXP * 0.2)), 10) : selectedChallenge.pointsXP} XP</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {lastError && (
                                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold animate-in shake">
                                            {lastError}
                                        </div>
                                    )}
                                    {selectedChallenge.type !== 'quiz' && failedAttempts > 0 && selectedChallenge.hints && selectedChallenge.hints.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in fade-in">
                                            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">
                                                <HelpCircle className="h-4 w-4" /> Dica Recebida (Penalidade no XP)
                                            </div>
                                            <p className="text-amber-800 text-sm italic">
                                                {selectedChallenge.hints[Math.min(failedAttempts - 1, selectedChallenge.hints.length - 1)]}
                                            </p>
                                        </div>
                                    )}

                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Sua Resposta</Label>
                                    <div className="flex gap-3">
                                        <Input 
                                            value={answer} 
                                            onChange={(e) => setAnswer(e.target.value)} 
                                            placeholder="Digite aqui..." 
                                            className="h-14 rounded-2xl border-2 focus-visible:ring-emerald-neon"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        />
                                        <Button 
                                            onClick={handleSubmit} 
                                            disabled={isSubmitting || !answer.trim()}
                                            className="h-14 w-14 rounded-2xl vibrant-button-emerald shrink-0"
                                        >
                                            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                            <Button variant="ghost" onClick={() => { setSelectedChallenge(null); setFailedAttempts(0); setLastError(""); }} className="text-slate-400 font-bold">
                                Voltar depois
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
