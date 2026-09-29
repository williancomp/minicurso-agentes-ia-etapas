import { intervalosSeSobrepoem, type Intervalo } from './reservas'
import type { Reserva } from './tipos'

// Regras da funcionalidade 2 — ver docs/spec-minhas-reservas.md (CA-07 a CA-13).

export interface MinhasReservas<R extends Reserva = Reserva> {
  /** Ativas que ainda não terminaram (inclui as em andamento), da mais próxima para a mais distante. */
  proximas: R[]
  /** Ativas que já terminaram, da mais recente para a mais antiga. */
  anteriores: R[]
  /** Canceladas, da mais recente para a mais antiga (pelo início). */
  canceladas: R[]
}

export function separarMinhasReservas<R extends Reserva>(
  reservas: R[],
  usuarioId: string,
  agora: Date,
): MinhasReservas<R> {
  const minhas = reservas.filter((reserva) => reserva.usuarioId === usuarioId)
  const crescente = (a: Reserva, b: Reserva) => Date.parse(a.inicio) - Date.parse(b.inicio)
  const decrescente = (a: Reserva, b: Reserva) => crescente(b, a)
  const terminou = (reserva: Reserva) => Date.parse(reserva.fim) <= agora.getTime()

  return {
    proximas: minhas.filter((r) => r.status === 'ativa' && !terminou(r)).sort(crescente),
    anteriores: minhas.filter((r) => r.status === 'ativa' && terminou(r)).sort(decrescente),
    canceladas: minhas.filter((r) => r.status === 'cancelada').sort(decrescente),
  }
}

export type CodigoRecusaCancelamento = 'NAO_E_DONO' | 'JA_CANCELADA' | 'JA_INICIADA'

export type ResultadoCancelamento =
  | { ok: true }
  | { ok: false; codigo: CodigoRecusaCancelamento; mensagem: string }

/**
 * Só o dono cancela, só reservas ativas e só antes de começarem.
 * Ordem das verificações: dono → já cancelada → já iniciada.
 */
export function podeCancelar(reserva: Reserva, usuarioId: string, agora: Date): ResultadoCancelamento {
  if (reserva.usuarioId !== usuarioId) {
    return { ok: false, codigo: 'NAO_E_DONO', mensagem: 'Só quem fez a reserva pode cancelá-la.' }
  }
  if (reserva.status === 'cancelada') {
    return { ok: false, codigo: 'JA_CANCELADA', mensagem: 'Esta reserva já foi cancelada.' }
  }
  if (Date.parse(reserva.inicio) <= agora.getTime()) {
    return {
      ok: false,
      codigo: 'JA_INICIADA',
      mensagem: 'Não é possível cancelar uma reserva que já começou ou terminou.',
    }
  }
  return { ok: true }
}

const bloqueia = (salaId: string) => (reserva: Reserva) => reserva.salaId === salaId && reserva.status === 'ativa'

/** A sala está livre em todo o intervalo? (mesma regra de sobreposição da criação de reserva) */
export function salaDisponivel(reservas: Reserva[], salaId: string, intervalo: Intervalo): boolean {
  return !reservas.filter(bloqueia(salaId)).some((reserva) => intervalosSeSobrepoem(reserva, intervalo))
}

/**
 * Lacunas livres da sala dentro de `janela`, em ordem cronológica.
 * Reservas ativas sobrepostas ou encostadas formam um único bloco ocupado.
 */
export function horariosLivres(reservas: Reserva[], salaId: string, janela: Intervalo): Intervalo[] {
  const inicioJanela = Date.parse(janela.inicio)
  const fimJanela = Date.parse(janela.fim)
  if (!(fimJanela > inicioJanela)) return []

  const ocupados = reservas
    .filter(bloqueia(salaId))
    .map((r) => ({ inicio: Math.max(Date.parse(r.inicio), inicioJanela), fim: Math.min(Date.parse(r.fim), fimJanela) }))
    .filter((r) => r.fim > r.inicio)
    .sort((a, b) => a.inicio - b.inicio)

  const livres: Intervalo[] = []
  let cursor = inicioJanela
  for (const ocupado of ocupados) {
    if (ocupado.inicio > cursor) {
      livres.push({ inicio: new Date(cursor).toISOString(), fim: new Date(ocupado.inicio).toISOString() })
    }
    cursor = Math.max(cursor, ocupado.fim)
  }
  if (fimJanela > cursor) {
    livres.push({ inicio: new Date(cursor).toISOString(), fim: new Date(fimJanela).toISOString() })
  }
  return livres
}
