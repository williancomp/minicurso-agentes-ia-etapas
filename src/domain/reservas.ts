import type { Reserva } from './tipos'

// Regras de criação de reserva — ver docs/spec.md (CA-01 a CA-06).

export interface NovaReserva {
  salaId: string
  usuarioId: string
  /** ISO 8601, ex.: 2026-09-30T09:00:00-04:00 */
  inicio: string
  /** ISO 8601 */
  fim: string
  motivo: string
}

export type CodigoRejeicao = 'HORARIO_INVALIDO' | 'NO_PASSADO' | 'CONFLITO'

export type ResultadoValidacao =
  | { ok: true }
  | { ok: false; codigo: CodigoRejeicao; mensagem: string; conflitante?: Reserva }

export interface Intervalo {
  inicio: string
  fim: string
}

/**
 * Dois intervalos semiabertos [inicio, fim) se sobrepõem quando um começa antes do outro terminar.
 * Horários encostados (um termina às 9h, o outro começa às 9h) NÃO se sobrepõem.
 */
export function intervalosSeSobrepoem(a: Intervalo, b: Intervalo): boolean {
  return Date.parse(a.inicio) < Date.parse(b.fim) && Date.parse(b.inicio) < Date.parse(a.fim)
}

function horaMinuto(iso: string): string {
  const data = new Date(iso)
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
}

/**
 * Decide se `nova` pode ser criada, dadas as reservas já existentes (de qualquer sala e status).
 * As verificações seguem a ordem: horário inválido → passado → conflito.
 */
export function validarReserva(nova: NovaReserva, existentes: Reserva[], agora: Date): ResultadoValidacao {
  const inicio = Date.parse(nova.inicio)
  const fim = Date.parse(nova.fim)

  if (!(fim > inicio)) {
    return {
      ok: false,
      codigo: 'HORARIO_INVALIDO',
      mensagem: 'O horário de término deve ser posterior ao de início.',
    }
  }

  if (inicio < agora.getTime()) {
    return { ok: false, codigo: 'NO_PASSADO', mensagem: 'Não é possível reservar um horário que já passou.' }
  }

  const conflitante = existentes.find(
    (reserva) => reserva.salaId === nova.salaId && reserva.status === 'ativa' && intervalosSeSobrepoem(reserva, nova),
  )
  if (conflitante) {
    return {
      ok: false,
      codigo: 'CONFLITO',
      mensagem: `A sala já está reservada das ${horaMinuto(conflitante.inicio)} às ${horaMinuto(conflitante.fim)} (${conflitante.motivo}).`,
      conflitante,
    }
  }

  return { ok: true }
}
