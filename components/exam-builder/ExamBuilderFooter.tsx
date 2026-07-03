"use client"

import { ChevronLeft, ChevronRight, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  step: number
  saving: boolean
  canProceed: boolean
  onBack: () => void
  onNext: () => void
  onSave: () => void
}

export function ExamBuilderFooter({ step, saving, canProceed, onBack, onNext, onSave }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
      <Button variant="outline" onClick={onBack} className="gap-1.5">
        <ChevronLeft className="h-4 w-4" />
        {step === 1 ? "Cancelar" : "Voltar"}
      </Button>

      {step < 4 ? (
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="vibrant-button-emerald gap-1.5 px-8"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={onSave}
          disabled={saving}
          className="vibrant-button-emerald gap-1.5 px-8"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Publicar Prova
            </>
          )}
        </Button>
      )}
    </div>
  )
}
