// Tipos do domínio compartilhados entre o front-end (src/) e a API (server/).

export type Recurso =
  | 'projetor'
  | 'computadores'
  | 'ar-condicionado'
  | 'quadro-digital'
  | 'videoconferencia'
  | 'acessibilidade'

export type TipoSala = 'laboratorio' | 'sala-de-aula' | 'auditorio' | 'reuniao'

export interface Sala {
  id: string
  nome: string
  bloco: string
  andar: string
  tipo: TipoSala
  capacidade: number
  recursos: Recurso[]
  descricao: string
}

export type PapelUsuario = 'docente' | 'discente' | 'tecnico'

export interface Usuario {
  id: string
  nome: string
  papel: PapelUsuario
  unidade: string
}

export type StatusReserva = 'ativa' | 'cancelada'

export interface Reserva {
  id: string
  salaId: string
  usuarioId: string
  /** Data/hora de início em ISO 8601 (UTC), ex.: 2026-09-30T12:00:00.000Z */
  inicio: string
  /** Data/hora de fim em ISO 8601 (UTC). */
  fim: string
  motivo: string
  status: StatusReserva
  criadaEm: string
}

/** Reserva acompanhada dos dados básicos da sala (usada em "Minhas reservas"). */
export interface ReservaComSala extends Reserva {
  sala: Pick<Sala, 'id' | 'nome' | 'bloco' | 'tipo'>
}
