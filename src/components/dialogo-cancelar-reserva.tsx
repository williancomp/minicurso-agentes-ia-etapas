import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarX2, Loader2 } from 'lucide-react'
import { useState } from 'react'
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
import type { ReservaComSala } from '@/domain/tipos'
import { api } from '@/lib/api'

export function DialogoCancelarReserva({
  reserva,
  usuarioId,
  aoFechar,
  aoCancelar,
}: {
  reserva: ReservaComSala | undefined
  usuarioId: string | undefined
  aoFechar: () => void
  aoCancelar: () => void
}) {
  const [enviando, setEnviando] = useState(false)

  async function confirmar() {
    if (!reserva || !usuarioId) return
    setEnviando(true)
    try {
      await api.cancelarReserva(reserva.id, usuarioId)
      toast.success('Reserva cancelada', { description: `${reserva.sala.nome} está livre nesse horário.` })
      aoCancelar()
      aoFechar()
    } catch (e) {
      toast.error('Não foi possível cancelar', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={!!reserva} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="bg-destructive/10 text-destructive mb-2 flex size-11 items-center justify-center rounded-xl">
            <CalendarX2 className="size-5" />
          </div>
          <DialogTitle>Cancelar esta reserva?</DialogTitle>
          <DialogDescription>O horário volta a ficar livre para outras pessoas. Não dá para desfazer.</DialogDescription>
        </DialogHeader>
        {reserva && (
          <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
            <div className="font-medium">{reserva.motivo}</div>
            <div className="text-muted-foreground">
              {reserva.sala.nome} · {format(new Date(reserva.inicio), "EEEE, d 'de' MMMM", { locale: ptBR })} ·{' '}
              {format(new Date(reserva.inicio), 'HH:mm')}–{format(new Date(reserva.fim), 'HH:mm')}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar} disabled={enviando}>
            Manter reserva
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={enviando}>
            {enviando && <Loader2 className="animate-spin" />}
            Cancelar reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
