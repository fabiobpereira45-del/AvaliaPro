"use client"

import { X } from "lucide-react"

interface Props {
  step: number
  isEditing: boolean
  onClose: () => void
}

export function ExamBuilderHeader({ step, isEditing, onClose }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {isEditing ? "Editar Prova" : "Criar Nova Prova"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Passo {step} de 4
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
