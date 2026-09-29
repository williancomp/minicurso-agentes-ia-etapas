import { Compass } from 'lucide-react'
import { Cabecalho } from '@/components/cabecalho'
import { EstadoVazio } from '@/components/estados'
import { Button } from '@/components/ui/button'
import { PaginaMinhasReservas } from '@/pages/pagina-minhas-reservas'
import { PaginaSala } from '@/pages/pagina-sala'
import { PaginaSalas } from '@/pages/pagina-salas'
import { useRota } from '@/lib/rotas'

export function App() {
  const rota = useRota()

  return (
    <div className="flex min-h-svh flex-col">
      <Cabecalho />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {rota.pagina === 'salas' && <PaginaSalas />}
        {rota.pagina === 'sala' && <PaginaSala key={rota.id} id={rota.id} />}
        {rota.pagina === 'minhas-reservas' && <PaginaMinhasReservas />}
        {rota.pagina === 'nao-encontrada' && (
          <EstadoVazio
            icone={Compass}
            titulo="Página não encontrada"
            descricao="Esse endereço não existe por aqui."
            acao={
              <Button asChild variant="outline">
                <a href="#/">Voltar para as salas</a>
              </Button>
            }
          />
        )}
      </main>
      <footer className="text-muted-foreground border-t py-6 text-center text-xs">
        Reserva de Salas · UFMT · Campus Cuiabá
      </footer>
    </div>
  )
}
