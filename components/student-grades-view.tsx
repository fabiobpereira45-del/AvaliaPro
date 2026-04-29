import { useEffect, useState } from "react"
import { FileText, Award, CalendarCheck, Loader2, Calculator, CheckCircle2, Clock, Lock } from "lucide-react"
import {
    type Discipline, type Semester, type StudentSubmission, type Attendance, type Assessment, type StudentGrade, type GradingSettings,
    getDisciplines, getSemesters, getSubmissions, getAttendances, getAttendancesByStudent, getAssessments, getStudentGrades, getGradingSettings,
    calculateAttendanceScore, calculateFinalGrade
} from "@/lib/store"

interface Props {
    studentId: string
    studentEmail: string
    studentDoc?: string
}

export function StudentGradesView({ studentId, studentEmail, studentDoc }: Props) {
    const [disciplines, setDisciplines] = useState<Discipline[]>([])
    const [semesters, setSemesters] = useState<Semester[]>([])
    const [officialGrades, setOfficialGrades] = useState<StudentGrade[]>([])
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
    const [attendances, setAttendances] = useState<Attendance[]>([])
    const [gradingSettings, setGradingSettings] = useState<GradingSettings | null>(null)
    const [assessments, setAssessments] = useState<Assessment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [d, sem, sub, allGrades, setts, asses] = await Promise.all([
                    getDisciplines(),
                    getSemesters(),
                    getSubmissions(),
                    getStudentGrades(),
                    getGradingSettings(),
                    getAssessments()
                ])

                setDisciplines(d)
                setSemesters(sem)
                setGradingSettings(setts)
                setAssessments(asses)

                // Filter and CONSOLIDATE official grades by student identifier and discipline
                const consolidatedGradesMap = new Map<string, StudentGrade>();

                allGrades.forEach(g => {
                    if (!g.isReleased) return;
                    const gId = String(g.studentIdentifier || "").trim().toLowerCase();
                    const sEmail = String(studentEmail || "").trim().toLowerCase();
                    const sId = String(studentId || "").trim().toLowerCase();
                    const sDoc = String(studentDoc || "").replace(/\D/g, "");
                    const gIdClean = gId.replace(/\D/g, "");

                    const isMe = (gId === sEmail || gId === sId || (sDoc && (gId === sDoc || gIdClean === sDoc)));

                    if (isMe) {
                        const discKey = g.disciplineId || 'geral';
                        const existing = consolidatedGradesMap.get(discKey);
                        if (!existing) {
                            consolidatedGradesMap.set(discKey, { ...g });
                        } else {
                            consolidatedGradesMap.set(discKey, {
                                ...existing,
                                examGrade: Math.max(existing.examGrade, g.examGrade),
                                worksGrade: Math.max(existing.worksGrade, g.worksGrade),
                                seminarGrade: Math.max(existing.seminarGrade, g.seminarGrade),
                                participationBonus: Math.max(existing.participationBonus, g.participationBonus),
                                attendanceScore: Math.max(existing.attendanceScore, g.attendanceScore),
                            });
                        }
                    }
                });

                // --- AUTO-INJEÇÃO DE DISCIPLINAS ATIVAS ---
                const mySubs = sub.filter(s => {
                    const assessment = asses.find(a => a.id === s.assessmentId)
                    return s.studentEmail === studentEmail && assessment?.releaseResults === true
                })
                setSubmissions(mySubs)

                const flatAtts = await getAttendancesByStudent(studentId)
                setAttendances(flatAtts)

                // Encontrar IDs de disciplinas com atividade RELEVANTE (Submissões Liberadas)
                const activeDisciplineIds = new Set<string>();
                mySubs.forEach(s => {
                    const assessment = asses.find(a => a.id === s.assessmentId);
                    if (assessment?.disciplineId) activeDisciplineIds.add(assessment.disciplineId);
                });

                // Injetar no mapa se não existir
                activeDisciplineIds.forEach(discId => {
                    if (!consolidatedGradesMap.has(discId)) {
                        consolidatedGradesMap.set(discId, {
                            id: `auto-${discId}-${studentId}`,
                            studentIdentifier: studentEmail || studentId,
                            studentName: "", 
                            disciplineId: discId,
                            isPublic: false,
                            examGrade: 0,
                            worksGrade: 0,
                            seminarGrade: 0,
                            participationBonus: 0,
                            attendanceScore: 0,
                            customDivisor: 2,
                            isReleased: true,
                            createdAt: new Date().toISOString()
                        });
                    }
                });

                setOfficialGrades(Array.from(consolidatedGradesMap.values()))

            } catch (err) {
                console.error("Erro ao carregar notas:", err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [studentId, studentEmail])

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    const calculateDynamicGrade = (grade: StudentGrade) => {
        let finalExamGrade = grade.examGrade || 0;

        // Dynamic Exam Grade from Submissions
        if (grade.disciplineId) {
            const disciplineAssessments = assessments.filter(a => a.disciplineId === grade.disciplineId && a.releaseResults === true);
            const assessmentIds = disciplineAssessments.map(a => a.id);
            const studentDisciplineSubs = submissions.filter(s => assessmentIds.includes(s.assessmentId));
            if (studentDisciplineSubs.length > 0) {
                finalExamGrade = Math.max(...studentDisciplineSubs.map(s => {
                    const pct = Number(s.percentage || 0);
                    const rawScore = Number(s.score || 0);
                    const totalPts = Number(s.totalPoints || 0);
                    if (pct > 0) return Math.round((pct / 10) * 100) / 100;
                    if (totalPts > 0 && rawScore > 10) return Math.round((rawScore / totalPts) * 10 * 100) / 100;
                    return rawScore;
                }));
            }
        }

        const videoAula = grade.participationBonus || 0;
        const works = grade.worksGrade || 0;
        const seminar = grade.seminarGrade || 0;

        // Média simplificada focada em Prova
        const media = finalExamGrade;

        return {
            videoAula,
            works,
            seminar,
            examGrade: finalExamGrade,
            media,
        }
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Resumo de Destaque */}
            <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-neon/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="h-20 w-20 bg-emerald-neon text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-neon/20 animate-pulse">
                    <Award className="h-10 w-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-white tracking-tight">Desempenho Acadêmico</h3>
                    <p className="text-emerald-neon/60 text-sm font-bold uppercase tracking-widest mt-1">Resultados Oficiais das Avaliações</p>
                </div>
                <div className="flex gap-6">
                    <div className="text-center">
                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Módulos</div>
                        <div className="text-4xl font-black text-white">{officialGrades.length}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <h3 className="text-xl font-black text-white border-b border-white/5 pb-4 flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                        <Calculator className="h-5 w-5 text-emerald-neon" />
                    </div>
                    Boletim de Notas
                </h3>

                {officialGrades.length === 0 ? (
                    <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto opacity-20 mb-3" />
                        <p className="text-sm">Nenhuma nota oficial lançada ou liberada até o momento.</p>
                        <p className="text-[10px] mt-2 italic opacity-60">Se você realizou uma avaliação recentemente, aguarde a correção e liberação do professor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {officialGrades.map(grade => {
                            const disc = disciplines.find(d => d.id === grade.disciplineId)
                            const dyn = calculateDynamicGrade(grade)
                            // Normaliza passingAverage: pode estar em escala 0-100 (ex: 70)
                            // enquanto dyn.media está em escala 0-10. Divide por 10 se > 10.
                            const rawPassing = gradingSettings?.passingAverage || 7
                            const passingGrade = rawPassing > 10 ? rawPassing / 10 : rawPassing
                            const isPassing = dyn.media >= passingGrade

                            // Check if exam was released by professor
                            const examReleased = grade.isReleased && (grade.examGrade > 0 || dyn.examGrade > 0)

                            return (
                                <div key={grade.id} className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 shadow-xl hover:border-emerald-neon/40 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-neon/5 to-transparent rounded-bl-full" />
                                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 relative z-10">
                                        <div className="space-y-2">
                                            <h4 className="font-black text-2xl text-white tracking-tight">{disc?.name || "Disciplina Geral"}</h4>
                                            <p className="text-[10px] text-emerald-neon/60 uppercase tracking-[0.2em] font-black">
                                                {semesters.find(s => s.id === disc?.semesterId)?.name || "Módulo Atual"}
                                            </p>
                                        </div>
 
                                        <div className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Resultado Final</div>
                                                <div className={`text-4xl font-black ${isPassing ? 'text-emerald-neon' : 'text-orange-vibrant'}`}>
                                                    {dyn.media.toFixed(1)}
                                                </div>
                                            </div>
                                            <div className={`h-14 w-14 border rounded-2xl flex items-center justify-center shadow-lg ${isPassing ? 'bg-emerald-neon/10 text-emerald-neon border-emerald-neon/20' : 'bg-orange-vibrant/10 text-orange-vibrant border-orange-vibrant/20'}`}>
                                                {isPassing ? <CheckCircle2 className="h-8 w-8" /> : <Award className="h-8 w-8" />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={`mb-8 text-xs font-black p-4 rounded-2xl flex items-center gap-3 uppercase tracking-widest ${isPassing ? 'bg-emerald-neon/10 text-emerald-neon' : 'bg-orange-vibrant/10 text-orange-vibrant'}`}>
                                        <div className={cn("w-2 h-2 rounded-full animate-pulse", isPassing ? "bg-emerald-neon" : "bg-orange-vibrant")} />
                                        {isPassing ? 'Aprovado' : 'Aguardando Pontuação'}
                                    </div>
 
                                    {/* Nota das Atividades - Simplified for Assessment Focus */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 group-hover:bg-white/10 transition-all">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Prova Online</div>
                                            {examReleased ? (
                                                <div className="font-black text-white text-2xl">{dyn.examGrade.toFixed(1)}</div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Lock className="h-4 w-4" />
                                                    <span className="text-[10px] font-bold uppercase">Privado</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Trabalhos</div>
                                            <div className="font-black text-white text-2xl">{dyn.works.toFixed(1)}</div>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Seminários</div>
                                            <div className="font-black text-white text-2xl">{dyn.seminar.toFixed(1)}</div>
                                        </div>
                                        <div className="bg-emerald-neon/5 border border-emerald-neon/20 rounded-2xl p-5">
                                            <div className="text-[10px] text-emerald-neon font-black uppercase tracking-widest mb-2">Bonus Part.</div>
                                            <div className="font-black text-emerald-neon text-2xl">{dyn.videoAula.toFixed(1)}</div>
                                        </div>
                                    </div>

                                    {/* Totais */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                            <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Nota Atividades</div>
                                            <div className="font-black text-blue-700 text-xl">{dyn.notaAtividades.toFixed(1)}</div>
                                            <div className="text-[9px] text-blue-400">máx 10</div>
                                        </div>
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                                            <div className="text-[10px] text-indigo-600 font-bold uppercase mb-1">Prova Online</div>
                                            {examReleased ? (
                                                <>
                                                    <div className="font-black text-indigo-700 text-xl">{dyn.examGrade.toFixed(1)}</div>
                                                    <div className="text-[9px] text-indigo-400">máx 10</div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 py-1">
                                                    <Lock className="h-4 w-4 text-indigo-300" />
                                                    <div className="text-[10px] text-indigo-400 font-semibold">Aguardando</div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`rounded-lg p-4 text-center border-2 ${isPassing ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
                                            <div className={`text-[10px] font-bold uppercase mb-1 ${isPassing ? 'text-green-600' : 'text-red-600'}`}>Média Final</div>
                                            <div className={`font-black text-xl ${isPassing ? 'text-green-700' : 'text-red-700'}`}>{dyn.media.toFixed(2)}</div>
                                            <div className={`text-[9px] ${isPassing ? 'text-green-400' : 'text-red-400'}`}>(Ativ + Prova) / 2</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-[10px] text-muted-foreground text-right italic">
                                        Fórmula: (Nota Atividades + Prova Online) / 2 — Aprovação: {passingGrade.toFixed(1)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Histórico de Tentativas (Submissões de Prova) */}
            {submissions.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-lg font-bold text-foreground mb-4 opacity-70">Histórico de Respostas (Simulados/Provas Online)</h4>
                    <div className="space-y-3">
                        {submissions.map(sub => (
                            <div key={sub.id} className="bg-muted/30 border border-border rounded-lg p-4 flex items-center justify-between text-sm">
                                <div>
                                    <p className="font-semibold text-foreground">Resultado de Prova Online</p>
                                    <p className="text-xs text-muted-foreground">Enviado em {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{sub.score} / {sub.totalPoints} pts</div>
                                    <div className="text-xs text-primary">{sub.percentage}% de acerto</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
