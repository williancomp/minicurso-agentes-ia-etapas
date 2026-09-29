import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HORA_ABERTURA, HORA_FECHAMENTO, mesmoDia, posicionarNaGrade } from '@/domain/agenda'
import type { Reserva, Usuario } from '@/domain/tipos'
import { cn } from '@/lib/utils'

const ALTURA_HORA = 44 // px
const HORAS = Array.from({ length: HORA_FECHAMENTO - HORA_ABERTURA }, (_, i) => HORA_ABERTURA + i)

const CORES = [
  'bg-sky-500/15 border-sky-500 text-sky-900 dark:text-sky-100',
  'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-100',
  'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-100',
  'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-100',
  'bg-teal-500/15 border-teal-500 text-teal-900 dark:text-teal-100',
  'bg-orange-500/15 border-orange-500 text-orange-900 dark:text-orange-100',
]

function corDoUsuario(usuarioId: string) {
  let soma = 0
  for (const letra of usuarioId) soma = (soma * 31 + letra.charCodeAt(0)) % 997
  return CORES[soma % CORES.length]
}

const hora = (iso: string) => format(new Date(iso), 'HH:mm')

function useAgora() {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return agora
}

export function AgendaSemanal({
  dias,
  reservas,
  usuarios,
  usuarioAtualId,
  aoSelecionarHorario,
  className,
}: {
  className?: string
  dias: Date[]
  reservas: Reserva[]
  usuarios: Usuario[]
  usuarioAtualId?: string
  /** Clique em um espaço vazio da grade: recebe o início (arredondado para 30 min). */
  aoSelecionarHorario?: (inicio: Date) => void
}) {
  const agora = useAgora()
  const nomeDe = (id: string) => usuarios.find((u) => u.id === id)?.nome ?? id
  const minutosDesdeAbertura = (agora.getHours() - HORA_ABERTURA) * 60 + agora.getMinutes()
  const linhaAgora = (minutosDesdeAbertura / 60) * ALTURA_HORA
  const mostrarLinhaAgora = minutosDesdeAbertura >= 0 && agora.getHours() < HORA_FECHAMENTO

  return (
    <div className={cn('bg-card overflow-x-auto rounded-2xl border shadow-sm', className)}>
      <div className="min-w-[760px]">
        {/* Cabeçalho com os dias */}
        <div className="bg-muted/40 sticky top-0 grid grid-cols-[4rem_repeat(var(--dias),1fr)] border-b" style={{ '--dias': dias.length } as React.CSSProperties}>
          <div />
          {dias.map((dia) => {
            const hoje = mesmoDia(dia, agora)
            return (
              <div key={dia.toISOString()} className="border-l px-3 py-2.5 text-center">
                <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  {format(dia, 'EEE', { locale: ptBR })}
                </div>
                <div
                  className={cn(
                    'mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                    hoje && 'bg-primary text-primary-foreground shadow-primary/30 shadow-md',
                  )}
                >
                  {format(dia, 'd')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grade */}
        <div className="grid grid-cols-[4rem_repeat(var(--dias),1fr)]" style={{ '--dias': dias.length } as React.CSSProperties}>
          <div className="relative" style={{ height: HORAS.length * ALTURA_HORA }}>
            {HORAS.map((h, i) => (
              <div
                key={h}
                className="text-muted-foreground absolute right-2 -translate-y-1/2 text-[11px] tabular-nums"
                style={{ top: i * ALTURA_HORA }}
              >
                {i === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {dias.map((dia) => {
            const hoje = mesmoDia(dia, agora)
            const passado = dia < agora && !hoje
            return (
              <div
                key={dia.toISOString()}
                className={cn(
                  'group/dia relative border-l',
                  hoje && 'bg-primary/[0.03]',
                  passado && 'hachurado',
                  aoSelecionarHorario && !passado && 'cursor-copy',
                )}
                style={{ height: HORAS.length * ALTURA_HORA }}
                onClick={(evento) => {
                  if (!aoSelecionarHorario || passado || evento.target !== evento.currentTarget) return
                  const y = evento.nativeEvent.offsetY
                  const meiasHoras = Math.floor(y / (ALTURA_HORA / 2))
                  const inicio = new Date(dia)
                  inicio.setHours(HORA_ABERTURA, meiasHoras * 30, 0, 0)
                  aoSelecionarHorario(inicio)
                }}
              >
                {HORAS.map((h, i) => (
                  <div
                    key={h}
                    className="border-border/60 pointer-events-none absolute inset-x-0 border-t"
                    style={{ top: i * ALTURA_HORA }}
                  />
                ))}

                {posicionarNaGrade(reservas, dia).map(({ reserva, topo, altura }) => {
                  const minha = reserva.usuarioId === usuarioAtualId
                  return (
                    <Tooltip key={reserva.id}>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
                          className={cn(
                            'absolute inset-x-1 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-xs shadow-xs transition-shadow outline-none hover:z-10 hover:shadow-md focus-visible:z-10 focus-visible:ring-2',
                            minha
                              ? 'bg-primary/15 border-primary text-foreground ring-primary/40 ring-1'
                              : corDoUsuario(reserva.usuarioId),
                          )}
                          style={{ top: `${topo}%`, height: `${altura}%` }}
                        >
                          <div className="truncate font-semibold">{reserva.motivo}</div>
                          <div className="truncate opacity-75 tabular-nums">
                            {hora(reserva.inicio)}–{hora(reserva.fim)}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="space-y-0.5">
                        <div className="font-semibold">{reserva.motivo}</div>
                        <div>
                          {format(new Date(reserva.inicio), "EEEE, d 'de' MMMM", { locale: ptBR })} ·{' '}
                          {hora(reserva.inicio)}–{hora(reserva.fim)}
                        </div>
                        <div className="opacity-75">
                          {minha ? 'Sua reserva' : `Reservado por ${nomeDe(reserva.usuarioId)}`}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}

                {hoje && mostrarLinhaAgora && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: linhaAgora }}>
                    <div className="bg-destructive absolute -top-[4px] -left-[5px] size-2.5 rounded-full" />
                    <div className="bg-destructive h-0.5 w-full" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
