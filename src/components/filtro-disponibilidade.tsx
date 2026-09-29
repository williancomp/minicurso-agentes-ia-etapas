import { format } from 'date-fns'
import { CalendarSearch, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HORARIOS } from '@/lib/horarios'

export interface Disponibilidade {
  data: string // yyyy-MM-dd
  inicio: string // HH:mm
  fim: string // HH:mm
}

export function FiltroDisponibilidade({
  valor,
  aoMudar,
}: {
  valor: Disponibilidade | undefined
  aoMudar: (valor: Disponibilidade | undefined) => void
}) {
  if (!valor) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-dashed"
        onClick={() => aoMudar({ data: format(new Date(), 'yyyy-MM-dd'), inicio: '08:00', fim: '10:00' })}
      >
        <CalendarSearch /> Ver só salas livres em um horário
      </Button>
    )
  }

  const invalido = valor.fim <= valor.inicio
  return (
    <div className="border-primary/30 bg-primary/5 flex flex-wrap items-center gap-2 rounded-xl border p-2 pl-3">
      <span className="text-primary flex items-center gap-1.5 text-xs font-medium">
        <CalendarSearch className="size-4" /> Livres em
      </span>
      <Input
        type="date"
        aria-label="Data"
        value={valor.data}
        onChange={(e) => e.target.value && aoMudar({ ...valor, data: e.target.value })}
        className="bg-background h-8 w-40"
      />
      <Seletor rotulo="Início" valor={valor.inicio} opcoes={HORARIOS.slice(0, -1)} aoMudar={(inicio) => aoMudar({ ...valor, inicio })} />
      <span className="text-muted-foreground text-xs">até</span>
      <Seletor rotulo="Término" valor={valor.fim} opcoes={HORARIOS.slice(1)} aoMudar={(fim) => aoMudar({ ...valor, fim })} />
      {invalido && <span className="text-destructive text-xs">O término deve ser depois do início.</span>}
      <Button variant="ghost" size="icon" className="ml-auto size-8" aria-label="Remover filtro de horário" onClick={() => aoMudar(undefined)}>
        <X />
      </Button>
    </div>
  )
}

function Seletor({
  rotulo,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string
  valor: string
  opcoes: string[]
  aoMudar: (valor: string) => void
}) {
  return (
    <Select value={valor} onValueChange={aoMudar}>
      <SelectTrigger className="bg-background h-8 w-24" aria-label={rotulo} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {opcoes.map((h) => (
          <SelectItem key={h} value={h}>
            {h}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
