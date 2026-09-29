import { format } from 'date-fns'
import { AlertCircle, CalendarPlus, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HORA_ABERTURA, HORA_FECHAMENTO } from '@/domain/agenda'
import type { Sala } from '@/domain/tipos'
import { api } from '@/lib/api'
import { useUsuario } from '@/lib/usuario'

const HORARIOS = Array.from({ length: (HORA_FECHAMENTO - HORA_ABERTURA) * 2 + 1 }, (_, i) => {
  const minutos = HORA_ABERTURA * 60 + i * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})
const MAXIMO_MOTIVO = 120

export interface SugestaoHorario {
  inicio: Date
}

function valoresIniciais(sugestao?: SugestaoHorario) {
  const base = sugestao?.inicio ?? new Date()
  const hhmm = format(base, 'HH:mm')
  const inicio = HORARIOS.includes(hhmm) && hhmm !== HORARIOS.at(-1) ? hhmm : '08:00'
  const fim = HORARIOS[Math.min(HORARIOS.indexOf(inicio) + 2, HORARIOS.length - 1)]
  return { data: format(base, 'yyyy-MM-dd'), inicio, fim }
}

export function DialogoNovaReserva({
  sala,
  sugestao,
  aberto,
  aoMudarAberto,
  aoCriar,
}: {
  sala: Sala
  sugestao?: SugestaoHorario
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  aoCriar: () => void
}) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-md">
        {/* `key` recria o formulário a cada abertura, com os valores sugeridos */}
        {aberto && (
          <Formulario
            key={sugestao?.inicio.toISOString() ?? 'novo'}
            sala={sala}
            sugestao={sugestao}
            aoConcluir={() => {
              aoMudarAberto(false)
              aoCriar()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({ sala, sugestao, aoConcluir }: { sala: Sala; sugestao?: SugestaoHorario; aoConcluir: () => void }) {
  const { usuarioAtual } = useUsuario()
  const [valores, setValores] = useState(() => ({ ...valoresIniciais(sugestao), motivo: '' }))
  const [erro, setErro] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!usuarioAtual) return
    setEnviando(true)
    setErro(undefined)
    try {
      // Os campos estão na hora local do navegador; a API recebe ISO 8601 em UTC.
      await api.criarReserva(
        {
          salaId: sala.id,
          inicio: new Date(`${valores.data}T${valores.inicio}`).toISOString(),
          fim: new Date(`${valores.data}T${valores.fim}`).toISOString(),
          motivo: valores.motivo,
        },
        usuarioAtual.id,
      )
      toast.success('Reserva criada!', {
        description: `${sala.nome} · ${format(new Date(`${valores.data}T00:00`), 'dd/MM')} das ${valores.inicio} às ${valores.fim}`,
      })
      aoConcluir()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CalendarPlus className="text-primary size-5" /> Nova reserva
        </DialogTitle>
        <DialogDescription>
          {sala.nome} · reservando como <strong className="text-foreground">{usuarioAtual?.nome ?? '…'}</strong>
        </DialogDescription>
      </DialogHeader>

      {erro && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive animate-in fade-in slide-in-from-top-1 flex gap-2.5 rounded-lg border p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="font-medium">Não foi possível reservar</div>
            <div className="text-destructive/90">{erro}</div>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="data">Data</Label>
        <Input
          id="data"
          type="date"
          required
          value={valores.data}
          onChange={(e) => setValores({ ...valores, data: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Início</Label>
          <Select value={valores.inicio} onValueChange={(inicio) => setValores({ ...valores, inicio })}>
            <SelectTrigger className="w-full" aria-label="Horário de início">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {HORARIOS.slice(0, -1).map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Término</Label>
          <Select value={valores.fim} onValueChange={(fim) => setValores({ ...valores, fim })}>
            <SelectTrigger className="w-full" aria-label="Horário de término">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {HORARIOS.slice(1).map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="motivo">Motivo</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {valores.motivo.length}/{MAXIMO_MOTIVO}
          </span>
        </div>
        <Textarea
          id="motivo"
          required
          maxLength={MAXIMO_MOTIVO}
          placeholder="Ex.: Aula prática de Banco de Dados"
          value={valores.motivo}
          onChange={(e) => setValores({ ...valores, motivo: e.target.value })}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={enviando || !usuarioAtual} className="w-full sm:w-auto">
          {enviando ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
          Reservar
        </Button>
      </DialogFooter>
    </form>
  )
}
