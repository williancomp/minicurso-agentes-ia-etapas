import type { Reserva, ReservaComSala, Sala, Usuario } from '@/domain/tipos'

export class ErroApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export interface SalaComResumo extends Sala {
  reservasHoje: number
  /** Presente quando a listagem é consultada com um intervalo (?inicio&fim). */
  disponivel?: boolean
}

/**
 * Chama a API em /api (o Vite redireciona para http://localhost:3001 no `npm run dev`).
 * Respostas de erro vêm no formato { "erro": "mensagem" }.
 */
export async function chamarApi<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ErroApi('Não foi possível conectar à API. Ela está rodando (npm run dev)?', 0)
  }
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const mensagem =
      corpo && typeof corpo.erro === 'string'
        ? corpo.erro
        : resposta.status >= 500
          ? 'A API respondeu com erro. Verifique o terminal onde rodou "npm run dev".'
          : `Falha na requisição (HTTP ${resposta.status}).`
    throw new ErroApi(mensagem, resposta.status)
  }
  return corpo as T
}

export interface DadosNovaReserva {
  salaId: string
  inicio: string
  fim: string
  motivo: string
}

const comoUsuario = (usuarioId: string) => ({ 'X-Usuario-Id': usuarioId })

export const api = {
  listarSalas: (intervalo?: { inicio: Date; fim: Date }) =>
    chamarApi<SalaComResumo[]>(
      intervalo ? `/salas?inicio=${intervalo.inicio.toISOString()}&fim=${intervalo.fim.toISOString()}` : '/salas',
    ),
  buscarSala: (id: string) => chamarApi<Sala>(`/salas/${encodeURIComponent(id)}`),
  listarUsuarios: () => chamarApi<Usuario[]>('/usuarios'),
  listarReservasDaSala: (id: string, de: Date, ate: Date) =>
    chamarApi<Reserva[]>(
      `/salas/${encodeURIComponent(id)}/reservas?de=${de.toISOString()}&ate=${ate.toISOString()}`,
    ),
  criarReserva: (dados: DadosNovaReserva, usuarioId: string) =>
    chamarApi<Reserva>('/reservas', { method: 'POST', body: JSON.stringify(dados), headers: comoUsuario(usuarioId) }),
  minhasReservas: (usuarioId: string) =>
    chamarApi<ReservaComSala[]>('/reservas/minhas', { headers: comoUsuario(usuarioId) }),
  cancelarReserva: (id: string, usuarioId: string) =>
    chamarApi<Reserva>(`/reservas/${encodeURIComponent(id)}/cancelar`, {
      method: 'POST',
      headers: comoUsuario(usuarioId),
    }),
}
