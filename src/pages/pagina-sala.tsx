import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, DoorClosed, Info, MapPin, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AgendaSemanal } from '@/components/agenda-semanal'
import { DialogoNovaReserva, type SugestaoHorario } from '@/components/dialogo-nova-reserva'
import { EstadoErro, EstadoVazio } from '@/components/estados'
import { IconeRecurso } from '@/components/icone-recurso'
import { IconeSala } from '@/components/icone-sala'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { diasDaSemana, inicioDaSemana } from '@/domain/agenda'
import { NOMES_RECURSOS, NOMES_TIPOS } from '@/domain/salas'
import { useConsulta } from '@/hooks/use-consulta'
import { api, ErroApi } from '@/lib/api'
import { useUsuario } from '@/lib/usuario'
import { cn } from '@/lib/utils'

export function PaginaSala({ id }: { id: string }) {
  const { usuarios, usuarioAtual } = useUsuario()
  const [segunda, setSegunda] = useState(() => inicioDaSemana(new Date()))
  const dias = useMemo(() => diasDaSemana(segunda), [segunda])

  const sala = useConsulta(() => api.buscarSala(id), [id])
  const reservas = useConsulta(() => api.listarReservasDaSala(id, segunda, addDays(segunda, 7)), [id, segunda])
  const [dialogo, setDialogo] = useState<{ aberto: boolean; sugestao?: SugestaoHorario }>({ aberto: false })

  if (sala.erro instanceof ErroApi && sala.erro.status === 404) {
    return (
      <EstadoVazio
        icone={DoorClosed}
        titulo="Sala não encontrada"
        descricao="O endereço pode estar errado ou a sala foi removida do sistema."
        acao={
          <Button asChild variant="outline">
            <a href="#/">
              <ArrowLeft /> Ver todas as salas
            </a>
          </Button>
        }
      />
    )
  }
  if (sala.erro) return <EstadoErro erro={sala.erro} aoTentarDeNovo={sala.recarregar} />

  const semanaAtual = inicioDaSemana(new Date()).getTime() === segunda.getTime()
  const totalSemana = reservas.dados?.length ?? 0

  return (
    <div className="space-y-6">
      <a href="#/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="size-4" /> Todas as salas
      </a>

      {!sala.dados ? (
        <Skeleton className="h-36 rounded-3xl" />
      ) : (
        <section className="bg-card relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8">
          <div className="from-primary/10 absolute -top-24 -right-24 size-72 rounded-full bg-gradient-to-br to-fuchsia-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <IconeSala tipo={sala.dados.tipo} className="size-14 rounded-2xl [&_svg]:size-7" />
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {NOMES_TIPOS[sala.dados.tipo]}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{sala.dados.nome}</h1>
                <p className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" /> {sala.dados.bloco} · {sala.dados.andar}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" /> {sala.dados.capacidade} lugares
                  </span>
                </p>
                <p className="max-w-2xl text-sm">{sala.dados.descricao}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
              {sala.dados.recursos.map((recurso) => (
                <span key={recurso} className="bg-secondary flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                  <IconeRecurso recurso={recurso} className="text-primary size-3.5" />
                  {NOMES_RECURSOS[recurso]}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="text-primary size-5" /> Agenda da semana
            </h2>
            <p className="text-muted-foreground text-sm">
              {format(dias[0], "d 'de' MMM", { locale: ptBR })} a {format(dias.at(-1)!, "d 'de' MMM 'de' yyyy", { locale: ptBR })}
              {reservas.dados && ` · ${totalSemana} ${totalSemana === 1 ? 'reserva' : 'reservas'}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setDialogo({ aberto: true })} disabled={!sala.dados} className="shadow-primary/25 mr-auto shadow-md sm:mr-2">
              <CalendarPlus /> Nova reserva
            </Button>
            <Button variant="outline" size="icon" aria-label="Semana anterior" onClick={() => setSegunda(addDays(segunda, -7))}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" disabled={semanaAtual} onClick={() => setSegunda(inicioDaSemana(new Date()))}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" aria-label="Próxima semana" onClick={() => setSegunda(addDays(segunda, 7))}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        {reservas.erro ? (
          <EstadoErro erro={reservas.erro} aoTentarDeNovo={reservas.recarregar} />
        ) : !reservas.dados ? (
          <Skeleton className="h-[720px] rounded-2xl" />
        ) : (
          <>
            <AgendaSemanal
              className={cn('transition-opacity', reservas.carregando && 'opacity-60')}
              dias={dias}
              reservas={reservas.dados}
              usuarios={usuarios}
              usuarioAtualId={usuarioAtual?.id}
              aoSelecionarHorario={(inicio) => setDialogo({ aberto: true, sugestao: { inicio } })}
            />
            <p className="text-muted-foreground text-center text-xs">
              Dica: clique em um horário vazio da agenda para reservar a partir dele.
            </p>
            {totalSemana === 0 && (
              <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                <Info className="size-4" /> Nenhuma reserva nesta semana — a sala está livre em todos os horários.
              </p>
            )}
          </>
        )}
      </section>

      {sala.dados && (
        <DialogoNovaReserva
          sala={sala.dados}
          sugestao={dialogo.sugestao}
          aberto={dialogo.aberto}
          aoMudarAberto={(aberto) => setDialogo((atual) => ({ ...atual, aberto }))}
          aoCriar={reservas.recarregar}
        />
      )}
    </div>
  )
}
