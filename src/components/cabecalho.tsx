import { CalendarCheck, CalendarRange, DoorOpen } from 'lucide-react'
import { AlternarTema } from '@/components/alternar-tema'
import { SeletorUsuario } from '@/components/seletor-usuario'
import { useRota } from '@/lib/rotas'
import { cn } from '@/lib/utils'

function LinkNav({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-current={ativo ? 'page' : undefined}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors [&_svg]:size-4',
        ativo ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      )}
    >
      {children}
    </a>
  )
}

export function Cabecalho() {
  const rota = useRota()
  return (
    <header className="bg-background/75 sticky top-0 z-40 border-b backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <a href="#/" className="group flex items-center gap-2.5">
          <span className="from-primary flex size-9 items-center justify-center rounded-xl bg-gradient-to-br to-fuchsia-500 text-white shadow-md transition-transform group-hover:scale-105">
            <CalendarRange className="size-5" />
          </span>
          <span className="hidden leading-tight min-[480px]:block">
            <span className="block font-semibold tracking-tight">Reserva de Salas</span>
            <span className="text-muted-foreground block text-[11px]">UFMT · Campus Cuiabá</span>
          </span>
        </a>
        <nav className="ml-2 flex items-center gap-1 sm:ml-4">
          <LinkNav href="#/" ativo={rota.pagina === 'salas' || rota.pagina === 'sala'}>
            <DoorOpen /> <span className="hidden sm:inline">Salas</span>
          </LinkNav>
          <LinkNav href="#/minhas-reservas" ativo={rota.pagina === 'minhas-reservas'}>
            <CalendarCheck /> <span className="hidden sm:inline">Minhas reservas</span>
          </LinkNav>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <AlternarTema />
          <SeletorUsuario />
        </div>
      </div>
    </header>
  )
}
