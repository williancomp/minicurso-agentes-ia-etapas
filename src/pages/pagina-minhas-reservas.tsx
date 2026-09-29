import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarCheck, CalendarClock, CalendarX2, History, MapPin, Search, UserRound, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DialogoCancelarReserva } from '@/components/dialogo-cancelar-reserva'
import { EstadoErro, EstadoVazio } from '@/components/estados'
import { IconeSala } from '@/components/icone-sala'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { podeCancelar, separarMinhasReservas, type MinhasReservas } from '@/domain/minhas-reservas'
import type { ReservaComSala } from '@/domain/tipos'
import { useConsulta } from '@/hooks/use-consulta'
import { api } from '@/lib/api'
import { linkSala } from '@/lib/rotas'
import { useUsuario } from '@/lib/usuario'
import { cn } from '@/lib/utils'

type Aba = keyof MinhasReservas

const ABAS: { id: Aba; rotulo: string; icone: typeof CalendarClock }[] = [
  { id: 'proximas', rotulo: 'Próximas', icone: CalendarClock },
  { id: 'anteriores', rotulo: 'Anteriores', icone: History },
  { id: 'canceladas', rotulo: 'Canceladas', icone: CalendarX2 },
]

const VAZIOS: Record<Aba, { titulo: string; descricao: string }> = {
  proximas: {
    titulo: 'Nenhuma reserva por vir',
    descricao: 'Quando você reservar uma sala, ela aparece aqui com a data e o horário.',
  },
  anteriores: { titulo: 'Nada no histórico ainda', descricao: 'Reservas que já aconteceram aparecem aqui.' },
  canceladas: { titulo: 'Nenhuma reserva cancelada', descricao: 'Ótimo sinal: tudo o que você reservou está de pé.' },
}

export function PaginaMinhasReservas() {
  const { usuarioAtual } = useUsuario()
  const [aba, setAba] = useState<Aba>('proximas')
  const [paraCancelar, setParaCancelar] = useState<ReservaComSala>()
  const consulta = useConsulta(
    () => (usuarioAtual ? api.minhasReservas(usuarioAtual.id) : Promise.resolve([])),
    [usuarioAtual?.id],
  )

  // "agora" é lido quando os dados chegam, para classificar as reservas de forma estável na tela.
  const grupos = useMemo(
    () => separarMinhasReservas(consulta.dados ?? [], usuarioAtual?.id ?? '', new Date()),
    [consulta.dados, usuarioAtual?.id],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            <CalendarCheck className="text-primary size-7" /> Minhas reservas
          </h1>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <UserRound className="size-4" /> {usuarioAtual?.nome ?? 'Carregando…'}
          </p>
        </div>
        <div role="tablist" className="bg-muted inline-flex rounded-xl p-1">
          {ABAS.map(({ id, rotulo, icone: Icone }) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                aba === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icone className="size-4" />
              {rotulo}
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  aba === id ? 'bg-primary/15 text-primary' : 'bg-background/60',
                )}
              >
                {consulta.dados ? grupos[id].length : '·'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {consulta.erro ? (
        <EstadoErro erro={consulta.erro} aoTentarDeNovo={consulta.recarregar} />
      ) : !consulta.dados ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : grupos[aba].length === 0 ? (
        <EstadoVazio
          icone={ABAS.find((a) => a.id === aba)!.icone}
          titulo={VAZIOS[aba].titulo}
          descricao={VAZIOS[aba].descricao}
          acao={
            aba === 'proximas' && (
              <Button asChild>
                <a href="#/">
                  <Search /> Encontrar uma sala
                </a>
              </Button>
            )
          }
        />
      ) : (
        <ul className={cn('space-y-3 transition-opacity', consulta.carregando && 'opacity-60')}>
          {grupos[aba].map((reserva) => (
            <ItemReserva
              key={reserva.id}
              reserva={reserva}
              cancelavel={!!usuarioAtual && podeCancelar(reserva, usuarioAtual.id, new Date()).ok}
              aoCancelar={() => setParaCancelar(reserva)}
            />
          ))}
        </ul>
      )}

      <DialogoCancelarReserva
        reserva={paraCancelar}
        usuarioId={usuarioAtual?.id}
        aoFechar={() => setParaCancelar(undefined)}
        aoCancelar={consulta.recarregar}
      />
    </div>
  )
}

function rotuloDia(data: Date) {
  if (isToday(data)) return 'Hoje'
  if (isTomorrow(data)) return 'Amanhã'
  const dia = format(data, "EEEE, d 'de' MMM", { locale: ptBR })
  return dia.charAt(0).toUpperCase() + dia.slice(1)
}

function ItemReserva({
  reserva,
  cancelavel,
  aoCancelar,
}: {
  reserva: ReservaComSala
  cancelavel: boolean
  aoCancelar: () => void
}) {
  const inicio = new Date(reserva.inicio)
  const fim = new Date(reserva.fim)
  const agora = new Date()
  const emAndamento = reserva.status === 'ativa' && inicio <= agora && fim > agora
  const cancelada = reserva.status === 'cancelada'

  return (
    <li
      className={cn(
        'bg-card group flex flex-col gap-4 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center',
        cancelada && 'bg-muted/30 shadow-none',
      )}
    >
      <div
        className={cn(
          'flex w-16 shrink-0 flex-col items-center rounded-xl border py-2 text-center',
          cancelada ? 'text-muted-foreground' : 'bg-primary/5 border-primary/20',
        )}
      >
        <span className="text-[11px] font-medium uppercase">{format(inicio, 'MMM', { locale: ptBR })}</span>
        <span className={cn('text-2xl leading-none font-semibold', cancelada && 'line-through')}>{format(inicio, 'd')}</span>
        <span className="text-muted-foreground text-[11px]">{format(inicio, 'EEE', { locale: ptBR })}</span>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('font-semibold', cancelada && 'text-muted-foreground line-through')}>{reserva.motivo}</span>
          {emAndamento && (
            <Badge className="bg-success/15 text-success border-transparent">
              <span className="bg-success size-1.5 animate-pulse rounded-full" /> Em andamento
            </Badge>
          )}
          {cancelada && <Badge variant="outline">Cancelada</Badge>}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-foreground font-medium tabular-nums">
            {rotuloDia(inicio)} · {format(inicio, 'HH:mm')}–{format(fim, 'HH:mm')}
          </span>
          <a href={linkSala(reserva.sala.id)} className="hover:text-primary flex items-center gap-1.5 transition-colors">
            <IconeSala tipo={reserva.sala.tipo} className="size-5 rounded-md shadow-none [&_svg]:size-3" />
            {reserva.sala.nome}
          </a>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {reserva.sala.bloco.match(/\(([^)]+)\)/)?.[1] ?? reserva.sala.bloco}
          </span>
        </div>
      </div>

      {cancelavel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={aoCancelar}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-center"
        >
          <X /> Cancelar
        </Button>
      )}
    </li>
  )
}
