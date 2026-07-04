"use client"

import { useState, useEffect } from "react"
import { 
    BrainCircuit, Sparkles, Wand2, Copy, ExternalLink, 
    Check, X, ChevronRight, GraduationCap, Layers, 
    Target, Zap, HelpCircle, MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { type Discipline, type ChallengeType } from "@/lib/store"

interface Props {
    open: boolean
    onClose: () => void
    disciplines: Discipline[]
    onApplyPrompt: (data: { title: string, description: string, content: string, correctAnswer: string, type: ChallengeType, hints?: string[] }) => void
}

export function AIChallengeAssistant({ open, onClose, disciplines, onApplyPrompt }: Props) {
    const [step, setStep] = useState(1)
    const [disciplineId, setDisciplineId] = useState("")
    const [audience, setAudience] = useState("Médio (Seminário)")
    const [level, setLevel] = useState("Intermediário")
    const [missionType, setMissionType] = useState<ChallengeType>("enigma")
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (open) {
            setStep(1)
            setCopied(false)
        }
    }, [open])

    if (!open) return null

    const disciplineName = disciplines.find(d => d.id === disciplineId)?.name || "Teologia"

    const generatePrompt = () => {
        const typeLabels: Record<ChallengeType, string> = {
            enigma: "um Enigma (Riddle)",
            quiz: "um Quiz de múltipla escolha",
            decifrar: "um desafio de Decifrar Código/Versículo",
            reflexao: "uma Reflexão Teológica profunda"
        }

        return `Aja como um Agente IA Teológico especializado em gamificação.
Gere uma missão semanal para alunos de Teologia.

REGRAS OBRIGATÓRIAS:
- Disciplina: ${disciplineName}
- Público-alvo: ${audience}
- Nível de Complexidade: ${level}
- Tipo de Missão: ${typeLabels[missionType]}
${missionType === 'quiz' ? '- ATENÇÃO: Crie APENAS UMA ÚNICA QUESTÃO de múltipla escolha. Na descrição ou conteúdo, inclua as alternativas (A, B, C, D).' : ''}
${missionType !== 'quiz' ? '- ATENÇÃO: NÃO CRIE MÚLTIPLAS ESCOLHAS. A resposta deve ser uma palavra, nome ou frase exata e curta.\n- Crie exatamente 3 dicas progressivas para ajudar o aluno se ele errar.\n- NÃO inclua as dicas dentro do "content", use o campo "hints" no JSON.' : ''}

FORMATO DE RESPOSTA (JSON STRICT):
{
  "title": "Título criativo e épico",
  "description": "Uma breve introdução narrativa que envolva o aluno",
  "content": "O corpo do desafio (o enigma em si, texto a decifrar, ou a pergunta com as opções)",
  "correctAnswer": "A resposta exata esperada (ex: a letra correta no quiz, ou a palavra/nome na missão)",
  ${missionType !== 'quiz' ? '"hints": ["Dica 1 mais vaga", "Dica 2 moderada", "Dica 3 muito reveladora"],' : ''}
  "type": "${missionType}"
}
O JSON DEVE SER VÁLIDO E SEM MARKDOWN EM VOLTA SE POSSÍVEL.

Por favor, gere um conteúdo teologicamente rico, preciso e desafiador.`
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatePrompt())
        setCopied(true)
        setTimeout(() => {
            setCopied(false)
            setStep(2)
        }, 1500)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                
                {/* Header Section */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 relative shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-400"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                            <BrainCircuit className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-900">Agente IA Teológico</h2>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">IA Copilot para Desafios Semanais</p>
                        </div>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-8 py-6 bg-white border-b border-slate-50 shrink-0">
                    <div className={cn(
                        "flex items-center gap-2 transition-all",
                        step === 1 ? "text-indigo-600 scale-110" : "text-slate-400 opacity-50"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black",
                            step === 1 ? "border-indigo-600 bg-indigo-50" : "border-slate-200"
                        )}>1</div>
                        <span className="text-xs font-bold uppercase tracking-wider">Configurar Prompt</span>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-slate-200" />

                    <div className={cn(
                        "flex items-center gap-2 transition-all",
                        step === 2 ? "text-indigo-600 scale-110" : "text-slate-400 opacity-50"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black",
                            step === 2 ? "border-indigo-600 bg-indigo-50" : "border-slate-200"
                        )}>2</div>
                        <span className="text-xs font-bold uppercase tracking-wider">Abrir IA Externa</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {step === 1 ? (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-8">
                                {/* PERFIL Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                        <GraduationCap className="h-3 w-3" /> Perfil
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600">DISCIPLINA</label>
                                        <Select value={disciplineId} onValueChange={setDisciplineId}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-200 shadow-sm">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {disciplines.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600">PÚBLICO</label>
                                        <Select value={audience} onValueChange={setAudience}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-200 shadow-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Básico (Iniciante)">Básico (Iniciante)</SelectItem>
                                                <SelectItem value="Médio (Seminário)">Médio (Seminário)</SelectItem>
                                                <SelectItem value="Avançado (Bacharelado)">Avançado (Bacharelado)</SelectItem>
                                                <SelectItem value="Pós-Graduação">Pós-Graduação</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* COMPLEXIDADE Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                        <Layers className="h-3 w-3" /> Complexidade
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600">NÍVEL EXIGIDO</label>
                                        <Select value={level} onValueChange={setLevel}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-200 shadow-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Iniciante">Iniciante</SelectItem>
                                                <SelectItem value="Intermediário">Intermediário</SelectItem>
                                                <SelectItem value="Avançado">Avançado</SelectItem>
                                                <SelectItem value="Mestre">Mestre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600">TIPO DE MISSÃO</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'enigma', icon: BrainCircuit, label: 'Riddle' },
                                                { id: 'quiz', icon: HelpCircle, label: 'Quiz' },
                                                { id: 'decifrar', icon: Zap, label: 'Zap' },
                                                { id: 'reflexao', icon: MessageSquare, label: 'Deep' },
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setMissionType(t.id as ChallengeType)}
                                                    className={cn(
                                                        "h-12 flex items-center justify-center rounded-xl border-2 transition-all",
                                                        missionType === t.id 
                                                            ? "border-indigo-500 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100" 
                                                            : "border-slate-100 hover:border-slate-200 text-slate-300"
                                                    )}
                                                    title={t.label}
                                                >
                                                    <t.icon className="h-5 w-5" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary & Copy Section */}
                            <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between border border-slate-100">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900">Tudo pronto?</h4>
                                    <p className="text-xs text-slate-500">O prompt será gerado para o tipo: <span className="text-indigo-600 font-bold uppercase tracking-wider">{missionType}</span></p>
                                </div>
                                <Button 
                                    onClick={handleCopy}
                                    disabled={!disciplineId}
                                    className="h-14 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black shadow-lg shadow-orange-200 gap-2 transition-all active:scale-95"
                                >
                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                    {copied ? "Prompt Copiado!" : "Copiar Prompt e Avançar"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 text-center py-4">
                            <div className="mx-auto h-20 w-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center mb-4">
                                <Sparkles className="h-10 w-10 text-emerald-500" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black tracking-tight text-slate-900">Prompt pronto para uso!</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                    Use o ChatGPT ou Claude para gerar o conteúdo. Cole o JSON resultante abaixo para preencher os campos automaticamente.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.open('https://chatgpt.com', '_blank')}
                                    className="h-14 rounded-2xl border-2 gap-2 font-bold text-slate-700"
                                >
                                    <ExternalLink className="h-4 w-4" /> Abrir ChatGPT
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.open('https://claude.ai', '_blank')}
                                    className="h-14 rounded-2xl border-2 gap-2 font-bold text-slate-700"
                                >
                                    <ExternalLink className="h-4 w-4" /> Abrir Claude
                                </Button>
                            </div>

                            <div className="pt-4 flex flex-col gap-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cole o JSON gerado aqui:</label>
                                <Textarea 
                                    className="min-h-[120px] rounded-2xl border-2 font-mono text-xs bg-slate-50"
                                    placeholder='{ "title": "...", "description": "...", "content": "..." }'
                                    onChange={(e) => {
                                        try {
                                            const data = JSON.parse(e.target.value)
                                            if (data.title && data.description && data.content) {
                                                onApplyPrompt(data)
                                                onClose()
                                            }
                                        } catch (err) {
                                            // Silently wait for valid JSON
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <Button variant="outline" onClick={onClose} className="w-full text-slate-500 font-bold h-12 rounded-xl">
                        Cancelar e Fechar
                    </Button>
                </div>
            </div>
        </div>
    )
}
