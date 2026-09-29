/**
 * Testes de aceitação — Funcionalidade 1 (docs/spec.md, CA-01..CA-06).
 * Dependem apenas da API pública do domínio (docs/api-dominio.md). Não altere para "passar".
 */
import { describe, expect, it } from 'vitest'
import { validarReserva, type NovaReserva } from '../../src/domain/reservas'
import type { Reserva } from '../../src/domain/tipos'

const DIA = '2030-03-12'
const em = (hhmm: string, dia = DIA) => `${dia}T${hhmm}:00-04:00`
const AGORA = new Date(em('07:00'))

const existente: Reserva = {
  id: 'existente',
  salaId: 'sala-a',
  usuarioId: 'ana',
  inicio: em('09:00'),
  fim: em('10:00'),
  motivo: 'Aula de Redes',
  status: 'ativa',
  criadaEm: em('08:00', '2030-03-01'),
}

function pedido(inicio: string, fim: string, extra: Partial<NovaReserva> = {}): NovaReserva {
  return { salaId: 'sala-a', usuarioId: 'joao', inicio: em(inicio), fim: em(fim), motivo: 'Estudo em grupo', ...extra }
}

function rejeitadoCom(resultado: ReturnType<typeof validarReserva>, codigo: string) {
  expect(resultado.ok).toBe(false)
  if (!resultado.ok) {
    expect(resultado.codigo).toBe(codigo)
    expect(typeof resultado.mensagem).toBe('string')
    expect(resultado.mensagem.trim()).not.toBe('')
  }
}

describe('Funcionalidade 1 — criar reserva', () => {
  it('CA-01: horário livre no futuro é aceito', () => {
    expect(validarReserva(pedido('14:00', '15:30'), [existente], AGORA).ok).toBe(true)
  })

  it('CA-01: sem nenhuma reserva existente é aceito', () => {
    expect(validarReserva(pedido('09:00', '10:00'), [], AGORA).ok).toBe(true)
  })

  it('CA-02: término igual ao início é rejeitado (HORARIO_INVALIDO)', () => {
    rejeitadoCom(validarReserva(pedido('14:00', '14:00'), [], AGORA), 'HORARIO_INVALIDO')
  })

  it('CA-02: término antes do início é rejeitado (HORARIO_INVALIDO)', () => {
    rejeitadoCom(validarReserva(pedido('15:00', '14:00'), [], AGORA), 'HORARIO_INVALIDO')
  })

  it('CA-03: início no passado é rejeitado (NO_PASSADO)', () => {
    rejeitadoCom(validarReserva(pedido('06:00', '08:00'), [], AGORA), 'NO_PASSADO')
  })

  it('CA-03: início em um dia anterior é rejeitado (NO_PASSADO)', () => {
    const ontem = { inicio: em('14:00', '2030-03-11'), fim: em('15:00', '2030-03-11') }
    rejeitadoCom(validarReserva(pedido('14:00', '15:00', ontem), [], AGORA), 'NO_PASSADO')
  })

  it('CA-03: início exatamente agora é aceito', () => {
    expect(validarReserva(pedido('07:00', '08:00'), [], AGORA).ok).toBe(true)
  })

  it.each([
    ['09:30', '10:30', 'sobreposição no fim'],
    ['08:30', '09:30', 'sobreposição no início'],
    ['09:15', '09:45', 'contida'],
    ['09:00', '10:00', 'idêntica'],
    ['08:00', '11:00', 'englobando'],
  ])('CA-04: %s–%s (%s) conflita com 09:00–10:00', (inicio, fim) => {
    const resultado = validarReserva(pedido(inicio, fim), [existente], AGORA)
    rejeitadoCom(resultado, 'CONFLITO')
    if (!resultado.ok) expect(resultado.conflitante?.id).toBe('existente')
  })

  it.each([
    ['08:00', '09:00'],
    ['10:00', '11:00'],
  ])('CA-05: %s–%s encostado em 09:00–10:00 é aceito', (inicio, fim) => {
    expect(validarReserva(pedido(inicio, fim), [existente], AGORA).ok).toBe(true)
  })

  it('CA-06: reserva cancelada não bloqueia o horário', () => {
    const cancelada: Reserva = { ...existente, status: 'cancelada' }
    expect(validarReserva(pedido('09:00', '10:00'), [cancelada], AGORA).ok).toBe(true)
  })

  it('CA-06: reserva de outra sala não bloqueia o horário', () => {
    expect(validarReserva(pedido('09:00', '10:00', { salaId: 'sala-b' }), [existente], AGORA).ok).toBe(true)
  })

  it('CA-06: cancelada não bloqueia, mas uma ativa no mesmo horário sim', () => {
    const cancelada: Reserva = { ...existente, id: 'cancelada', status: 'cancelada' }
    const ativa: Reserva = { ...existente, id: 'ativa', inicio: em('09:30'), fim: em('11:00') }
    rejeitadoCom(validarReserva(pedido('09:00', '10:00'), [cancelada, ativa], AGORA), 'CONFLITO')
  })
})
