import { ArrowUpRight, MapPin, Users } from 'lucide-react'
import { IconeRecurso } from '@/components/icone-recurso'
import { IconeSala } from '@/components/icone-sala'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NOMES_RECURSOS, NOMES_TIPOS } from '@/domain/salas'
import type { SalaComResumo } from '@/lib/api'
import { linkSala } from '@/lib/rotas'

function siglaDoBloco(bloco: string) {
  return bloco.match(/\(([^)]+)\)/)?.[1] ?? bloco
}

export function CartaoSala({ sala }: { sala: SalaComResumo }) {
  return (
    <a
      href={linkSala(sala.id)}
      className="group bg-card hover:border-primary/40 hover:shadow-primary/5 focus-visible:ring-ring/50 relative flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-all outline-none hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-[3px]"
    >
      <div className="flex items-start gap-3">
        <IconeSala tipo={sala.tipo} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold tracking-tight">{sala.nome}</h3>
          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
            <MapPin className="size-3 shrink-0" />
            {siglaDoBloco(sala.bloco)} · {sala.andar}
          </p>
        </div>
        <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      <p className="text-muted-foreground line-clamp-2 text-sm">{sala.descricao}</p>

      <div className="flex flex-wrap gap-1.5">
        {sala.recursos.map((recurso) => (
          <Tooltip key={recurso}>
            <TooltipTrigger asChild>
              <span className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-lg">
                <IconeRecurso recurso={recurso} className="size-3.5" />
                <span className="sr-only">{NOMES_RECURSOS[recurso]}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{NOMES_RECURSOS[recurso]}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Users className="text-muted-foreground size-4" />
          {sala.capacidade} lugares
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground font-normal">
            {NOMES_TIPOS[sala.tipo]}
          </Badge>
          {sala.disponivel ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Livre no horário
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className={
                sala.reservasHoje === 0
                  ? 'bg-success/15 text-success'
                  : 'bg-warning/20 text-amber-700 dark:text-warning'
              }
            >
              {sala.reservasHoje === 0 ? 'Livre hoje' : `${sala.reservasHoje} hoje`}
            </Badge>
          )}
        </div>
      </div>
    </a>
  )
}
