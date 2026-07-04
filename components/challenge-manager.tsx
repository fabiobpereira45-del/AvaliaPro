"use client"

import { useState, useEffect } from "react"
import { 
    Trophy, Plus, Pencil, Trash2, Eye, EyeOff, 
    Wand2, Search, Filter, Calendar, Zap, 
    Gamepad2, HelpCircle, MessageSquare, BrainCircuit, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { 
    type Challenge, type ChallengeType, type Discipline,
    getChallenges, addChallenge, updateChallenge, deleteChallenge,
    getDisciplines
} from "@/lib/store"
import { AIChallengeAssistant } from "./ai-challenge-assistant"

export function ChallengeManager() {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)

    // Form states
    const [disciplineId, setDisciplineId] = useState("")
    const [week, setWeek] = useState(1)
    const [type, setType] = useState<ChallengeType>("enigma")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [content, setContent] = useState("")
    const [correctAnswer, setCorrectAnswer] = useState("")
    const [pointsXP, setPointsXP] = useState(20)
    const [isActive, setIsActive] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isAssistantOpen, setIsAssistantOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [c, d] = await Promise.all([getChallenges(), getDisciplines()])
            setChallenges(c)
            setDisciplines(d)
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoading(true) // Wait, should be false
            setLoading(false)
        }
    }

    function openCreate() {
        setEditingChallenge(null)
        setDisciplineId("")
        setWeek(challenges.length + 1)
        setType("enigma")
        setTitle("")
        setDescription("")
        setContent("")
        setCorrectAnswer("")
        setPointsXP(20)
        setIsActive(true)
        setIsModalOpen(true)
    }

    function openEdit(c: Challenge) {
        setEditingChallenge(c)
        setDisciplineId(c.disciplineId)
        setWeek(c.week)
        setType(c.type)
        setTitle(c.title)
        setDescription(c.description)
        setContent(c.content)
        setCorrectAnswer(c.correctAnswer || "")
        setPointsXP(c.pointsXP)
        setIsActive(c.isActive)
        setIsModalOpen(true)
    }

    async function handleSave() {
        if (!disciplineId || !title || !description || !content) {
            alert("Por favor, preencha todos os campos obrigatórios.")
            return
        }

        const data = {
            disciplineId,
            week,
            type,
            title,
            description,
            content,
            correctAnswer: correctAnswer || undefined,
            pointsXP,
            isActive
        }

        try {
            if (editingChallenge) {
                await updateChallenge(editingChallenge.id, data)
            } else {
                await addChallenge(data)
            }
            setIsModalOpen(false)
            loadData()
        } catch (error: any) {
            alert("Erro ao salvar desafio: " + error.message)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja excluir este desafio?")) return
        try {
            await deleteChallenge(id)
            loadData()
        } catch (error: any) {
            alert("Erro ao excluir: " + error.message)
        }
    }

    async function generateWithAI() {
        setIsModalOpen(false)
        setIsAssistantOpen(true)
    }

    function handleApplyAIPrompt(data: { title: string, description: string, content: string, correctAnswer: string, type: ChallengeType }) {
        setTitle(data.title)
        setDescription(data.description)
        setContent(data.content)
        setCorrectAnswer(data.correctAnswer || "")
        setType(data.type || type)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-emerald-neon" />
                        Desafios Semanais
                    </h1>
                    <p className="text-muted-foreground">Gerencie missões gamificadas para seus alunos.</p>
                </div>
                <Button onClick={openCreate} className="vibrant-button-emerald h-12 px-6 gap-2">
                    <Plus className="h-5 w-5" /> Nova Missão
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-neon" />
                </div>
            ) : challenges.length === 0 ? (
                <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center space-y-4">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-slate-100">
                        <Zap className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold">Nenhum desafio criado</h3>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm">
                        Comece a gamificar sua turma criando o primeiro desafio semanal.
                    </p>
                    <Button onClick={openCreate} variant="outline" className="rounded-2xl border-2">
                        Criar Primeira Missão
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map((c) => (
                        <div key={c.id} className="bg-white border border-border/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-neon/30 transition-all group flex flex-col h-full">
                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "p-2.5 rounded-xl text-white",
                                        c.type === 'enigma' ? "bg-purple-500" :
                                        c.type === 'quiz' ? "bg-emerald-neon" :
                                        c.type === 'decifrar' ? "bg-blue-500" : "bg-orange-500"
                                    )}>
                                        {c.type === 'enigma' ? <BrainCircuit className="h-5 w-5" /> :
                                         c.type === 'quiz' ? <HelpCircle className="h-5 w-5" /> :
                                         c.type === 'decifrar' ? <Zap className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-full text-slate-500">
                                            Semana {c.week}
                                        </span>
                                        {!c.isActive && <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg group-hover:text-emerald-neon transition-colors leading-tight">{c.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white" />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">12 alunos completaram</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50/50 border-t border-border/40 flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                    <Zap className="h-4 w-4 text-emerald-neon fill-emerald-neon" />
                                    <span className="text-xs font-black text-emerald-neon">{c.pointsXP} XP</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 hover:bg-emerald-neon/10 hover:text-emerald-neon">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-500 text-slate-400">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Criação/Edição */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8">
                    <DialogHeader>
                        <div className="flex justify-between items-center mr-6">
                            <DialogTitle className="text-2xl font-black tracking-tight">
                                {editingChallenge ? "Editar Missão" : "Criar Nova Missão"}
                            </DialogTitle>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-full gap-2 border-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-neon/10 hover:text-emerald-neon transition-all"
                                onClick={generateWithAI}
                                disabled={isGenerating || !disciplineId}
                            >
                                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                Gerar com IA
                            </Button>
                        </div>
                        <DialogDescription>Defina as regras e o conteúdo do desafio semanal.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                            <Label>Disciplina *</Label>
                            <Select value={disciplineId} onValueChange={setDisciplineId}>
                                <SelectTrigger className="rounded-xl border-2">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {disciplines.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Semana *</Label>
                            <Input type="number" value={week} onChange={(e) => setWeek(Number(e.target.value))} className="rounded-xl border-2" />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>Tipo de Desafio *</Label>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { id: 'enigma', label: 'Enigma', icon: BrainCircuit },
                                { id: 'quiz', label: 'Quiz', icon: HelpCircle },
                                { id: 'decifrar', label: 'Decifrar', icon: Zap },
                                { id: 'reflexao', label: 'Reflexão', icon: MessageSquare },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id as ChallengeType)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                        type === t.id 
                                            ? "border-emerald-neon bg-emerald-neon/10 text-emerald-neon shadow-lg shadow-emerald-neon/10" 
                                            : "border-slate-100 hover:border-slate-200 text-slate-400"
                                    )}
                                >
                                    <t.icon className={cn("h-6 w-6", type === t.id ? "animate-bounce" : "")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>Título da Missão *</Label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="Ex: O Mistério das Cartas Paulinas" 
                            className="rounded-xl border-2"
                        />
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>Descrição / Instruções *</Label>
                        <Textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="O que o aluno deve fazer?" 
                            className="rounded-xl border-2 min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>Conteúdo do Desafio (Enigma ou Perguntas) *</Label>
                        <Textarea 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            placeholder="Escreva o enigma ou código aqui..." 
                            className="rounded-xl border-2 min-h-[120px] font-mono text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2">
                            <Label>Resposta Correta (Se houver)</Label>
                            <Input 
                                value={correctAnswer} 
                                onChange={(e) => setCorrectAnswer(e.target.value)} 
                                placeholder="A resposta exata..." 
                                className="rounded-xl border-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Pontos (XP)</Label>
                            <Input 
                                type="number" 
                                value={pointsXP} 
                                onChange={(e) => setPointsXP(Number(e.target.value))} 
                                className="rounded-xl border-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="active" checked={isActive} onCheckedChange={(checked) => setIsActive(!!checked)} />
                        <label htmlFor="active" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Ativar missão imediatamente
                        </label>
                    </div>

                    <DialogFooter className="pt-8">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button onClick={handleSave} className="vibrant-button-emerald rounded-xl px-8">
                            {editingChallenge ? "Salvar Alterações" : "Criar Missão"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AIChallengeAssistant 
                open={isAssistantOpen} 
                onClose={() => {
                    setIsAssistantOpen(false)
                    setIsModalOpen(true)
                }}
                disciplines={disciplines}
                onApplyPrompt={(data) => {
                    handleApplyAIPrompt(data)
                    setIsAssistantOpen(false)
                    setIsModalOpen(true)
                }}
            />
        </div>
    )
}
