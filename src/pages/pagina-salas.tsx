import { Building2, CalendarX2, DoorOpen, SearchX, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CartaoSala } from '@/components/cartao-sala'
import { EstadoErro, EstadoVazio } from '@/components/estados'
import { FiltroDisponibilidade, type Disponibilidade } from '@/components/filtro-disponibilidade'
import { FiltrosSalas } from '@/components/filtros-salas'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { filtrarSalas, listarBlocos, type FiltroSalas } from '@/domain/salas'
import { useConsulta } from '@/hooks/use-consulta'
import { api } from '@/lib/api'
import { intervaloLocal } from '@/lib/horarios'
import { useUsuario } from '@/lib/usuario'
import { cn } from '@/lib/utils'

export function PaginaSalas() {
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade>()
  const intervalo = disponibilidade && disponibilidade.fim > disponibilidade.inicio ? intervaloLocal(disponibilidade.data, disponibilidade.inicio, disponibilidade.fim) : undefined
  const { dados: salas, erro, carregando, recarregar } = useConsulta(() => api.listarSalas(intervalo), [intervalo])
  const { usuarioAtual } = useUsuario()
  const [filtro, setFiltro] = useState<FiltroSalas>({})

  const visiveis = useMemo(
    () => filtrarSalas(salas ?? [], filtro).filter((sala) => !intervalo || sala.disponivel !== false),
    [salas, filtro, intervalo],
  )
  const blocos = useMemo(() => listarBlocos(salas ?? []), [salas])
  const livresHoje = salas?.filter((s) => s.reservasHoje === 0).length ?? 0
  const primeiroNome = usuarioAtual?.nome.replace(/^(Prof\.|Profa\.)\s*/, '').split(' ')[0]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent px-6 py-10 sm:px-10">
        <div className="fundo-pontilhado absolute inset-0" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="bg-background/70 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="text-primary size-3.5" /> Semestre 2026/2
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {primeiroNome ? `Olá, ${primeiroNome}! ` : ''}Encontre a sala certa para sua atividade.
            </h1>
            <p className="text-muted-foreground text-balance">
              Laboratórios, salas de aula e auditórios do campus Cuiabá em um só lugar. Abra uma sala para ver a
              agenda da semana.
            </p>
          </div>
          <div className="flex gap-3">
            <Resumo icone={DoorOpen} valor={salas?.length} rotulo="salas" />
            <Resumo icone={Building2} valor={salas ? blocos.length : undefined} rotulo="blocos" />
            <Resumo icone={Sparkles} valor={salas ? livresHoje : undefined} rotulo="livres hoje" />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <FiltrosSalas filtro={filtro} blocos={blocos} aoMudar={setFiltro} />
        <FiltroDisponibilidade valor={disponibilidade} aoMudar={setDisponibilidade} />
      </div>

      {erro ? (
        <EstadoErro erro={erro} aoTentarDeNovo={recarregar} />
      ) : carregando && !salas ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-60 rounded-2xl" />
          ))}
        </div>
      ) : visiveis.length === 0 && intervalo && filtrarSalas(salas ?? [], filtro).length > 0 ? (
        <EstadoVazio
          icone={CalendarX2}
          titulo="Todas ocupadas nesse horário"
          descricao="As salas que atendem aos filtros já estão reservadas nesse intervalo. Tente outro horário ou outro dia."
          acao={
            <Button variant="outline" onClick={() => setDisponibilidade(undefined)}>
              Ver todas as salas
            </Button>
          }
        />
      ) : visiveis.length === 0 ? (
        <EstadoVazio
          icone={SearchX}
          titulo="Nenhuma sala encontrada"
          descricao="Nenhuma sala atende a todos os filtros escolhidos. Tente remover algum recurso ou reduzir a capacidade mínima."
          acao={
            <Button variant="outline" onClick={() => setFiltro({})}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {intervalo
              ? `${visiveis.length} ${visiveis.length === 1 ? 'sala livre' : 'salas livres'} no horário escolhido`
              : visiveis.length === salas?.length
                ? `${visiveis.length} salas cadastradas`
                : `${visiveis.length} de ${salas?.length} salas`}
          </p>
          <div className={cn('grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3', carregando && 'opacity-60')}>
            {visiveis.map((sala) => (
              <CartaoSala key={sala.id} sala={sala} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Resumo({ icone: Icone, valor, rotulo }: { icone: typeof DoorOpen; valor?: number; rotulo: string }) {
  return (
    <div className="bg-background/70 min-w-24 rounded-2xl border px-4 py-3 backdrop-blur">
      <Icone className="text-primary mb-1 size-4" />
      <div className="text-2xl font-semibold tabular-nums">{valor ?? '–'}</div>
      <div className="text-muted-foreground text-xs">{rotulo}</div>
    </div>
  )
}
