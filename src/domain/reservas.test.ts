import { describe, expect, it } from 'vitest'
import { intervalosSeSobrepoem, validarReserva, type NovaReserva } from './reservas'
import type { Reserva } from './tipos'

// Datas fixas no fuso de Cuiabá (-04:00) para o teste não depender do relógio da máquina.
const AGORA = new Date('2026-09-30T07:00:00-04:00')
const h = (hhmm: string, dia = '2026-09-30') => `${dia}T${hhmm}:00-04:00`

const existente: Reserva = {
  id: 'r1',
  salaId: 'ic-lab-01',
  usuarioId: 'ana',
  inicio: h('09:00'),
  fim: h('10:00'),
  motivo: 'Aula de Algoritmos',
  status: 'ativa',
  criadaEm: h('06:00', '2026-09-29'),
}

function nova(inicio: string, fim: string, salaId = 'ic-lab-01'): NovaReserva {
  return { salaId, usuarioId: 'joao', inicio: h(inicio), fim: h(fim), motivo: 'Estudo' }
}

describe('intervalosSeSobrepoem', () => {
  it.each([
    ['08:00', '09:00', false], // encosta no início
    ['10:00', '11:00', false], // encosta no fim
    ['09:30', '10:30', true], // parcial
    ['08:30', '09:30', true], // parcial pelo começo
    ['09:15', '09:45', true], // contido
    ['08:00', '11:00', true], // engloba
    ['09:00', '10:00', true], // idêntico
  ])('CA-04/CA-05: %s–%s contra 09:00–10:00 → %s', (inicio, fim, esperado) => {
    expect(intervalosSeSobrepoem({ inicio: h(inicio), fim: h(fim) }, existente)).toBe(esperado)
  })
})

describe('validarReserva', () => {
  it('CA-01: aceita horário livre', () => {
    expect(validarReserva(nova('14:00', '15:00'), [existente], AGORA)).toEqual({ ok: true })
  })

  it('CA-02: rejeita fim igual ao início', () => {
    expect(validarReserva(nova('14:00', '14:00'), [], AGORA)).toMatchObject({ ok: false, codigo: 'HORARIO_INVALIDO' })
  })

  it('CA-02: rejeita fim antes do início', () => {
    expect(validarReserva(nova('15:00', '14:00'), [], AGORA)).toMatchObject({ ok: false, codigo: 'HORARIO_INVALIDO' })
  })

  it('CA-03: rejeita início no passado', () => {
    expect(validarReserva(nova('06:00', '08:00'), [], AGORA)).toMatchObject({ ok: false, codigo: 'NO_PASSADO' })
  })

  it('CA-03: aceita início exatamente agora', () => {
    expect(validarReserva(nova('07:00', '08:00'), [], AGORA)).toEqual({ ok: true })
  })

  it('CA-04: rejeita englobamento com mensagem que cita a reserva existente', () => {
    const resultado = validarReserva(nova('08:00', '11:00'), [existente], AGORA)
    expect(resultado).toMatchObject({ ok: false, codigo: 'CONFLITO', conflitante: existente })
    if (!resultado.ok) expect(resultado.mensagem).toContain('Aula de Algoritmos')
  })

  it('CA-06: ignora reservas canceladas', () => {
    const cancelada = { ...existente, status: 'cancelada' as const }
    expect(validarReserva(nova('09:00', '10:00'), [cancelada], AGORA)).toEqual({ ok: true })
  })

  it('CA-06: ignora reservas de outras salas', () => {
    expect(validarReserva(nova('09:00', '10:00', 'ic-lab-02'), [existente], AGORA)).toEqual({ ok: true })
  })

  it('R6: verifica o horário antes do conflito', () => {
    expect(validarReserva(nova('10:00', '09:00'), [existente], AGORA)).toMatchObject({ codigo: 'HORARIO_INVALIDO' })
  })
})
