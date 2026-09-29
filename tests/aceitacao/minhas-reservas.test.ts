/**
 * Testes de aceitação — Funcionalidade 2 (specs/001-minhas-reservas/spec.md, CA-07..CA-13).
 * Dependem apenas da API pública do domínio (docs/api-dominio.md). Não altere para "passar".
 */
import { describe, expect, it } from 'vitest'
import {
  horariosLivres,
  podeCancelar,
  salaDisponivel,
  separarMinhasReservas,
} from '../../src/domain/minhas-reservas'
import type { Reserva } from '../../src/domain/tipos'

const DIA = '2030-03-12'
const em = (hhmm: string, dia = DIA) => new Date(`${dia}T${hhmm}:00-04:00`).toISOString()
const AGORA = new Date(em('10:00'))

let sequencia = 0
function reserva(inicio: string, fim: string, extra: Partial<Reserva> = {}): Reserva {
  sequencia += 1
  return {
    id: `r${sequencia}`,
    salaId: 'sala-a',
    usuarioId: 'ana',
    inicio: em(inicio),
    fim: em(fim),
    motivo: `Reserva ${sequencia}`,
    status: 'ativa',
    criadaEm: em('07:00', '2030-03-01'),
    ...extra,
  }
}

const ids = (reservas: Reserva[]) => reservas.map((r) => r.id)

describe('Funcionalidade 2 — minhas reservas', () => {
  it('CA-07: só as do usuário, separadas e ordenadas', () => {
    const amanha = reserva('08:00', '09:00', { inicio: em('08:00', '2030-03-13'), fim: em('09:00', '2030-03-13') })
    const tarde = reserva('15:00', '16:00')
    const emAndamento = reserva('09:30', '10:30')
    const cedo = reserva('07:00', '08:00')
    const ontem = reserva('08:00', '09:00', { inicio: em('08:00', '2030-03-11'), fim: em('09:00', '2030-03-11') })
    const terminouAgora = reserva('09:00', '10:00')
    const canceladaAntiga = reserva('11:00', '12:00', { status: 'cancelada', inicio: em('11:00', '2030-03-01'), fim: em('12:00', '2030-03-01') })
    const canceladaNova = reserva('16:00', '17:00', { status: 'cancelada' })
    const deOutraPessoa = reserva('13:00', '14:00', { usuarioId: 'joao' })

    const resultado = separarMinhasReservas(
      [tarde, deOutraPessoa, ontem, canceladaAntiga, amanha, cedo, canceladaNova, emAndamento, terminouAgora],
      'ana',
      AGORA,
    )
    expect(ids(resultado.proximas)).toEqual(ids([emAndamento, tarde, amanha]))
    expect(ids(resultado.anteriores)).toEqual(ids([terminouAgora, cedo, ontem]))
    expect(ids(resultado.canceladas)).toEqual(ids([canceladaNova, canceladaAntiga]))
  })

  it('CA-07: quem não tem reservas recebe listas vazias', () => {
    const resultado = separarMinhasReservas([reserva('15:00', '16:00')], 'mariana', AGORA)
    expect(resultado).toEqual({ proximas: [], anteriores: [], canceladas: [] })
  })
})

describe('Funcionalidade 2 — cancelamento', () => {
  it('CA-08: o dono pode cancelar reserva ativa que ainda não começou', () => {
    expect(podeCancelar(reserva('15:00', '16:00'), 'ana', AGORA)).toEqual({ ok: true })
  })

  it('CA-08: depois de cancelada, a reserva não bloqueia mais o horário', () => {
    const cancelada = reserva('15:00', '16:00', { status: 'cancelada' })
    expect(salaDisponivel([cancelada], 'sala-a', { inicio: em('15:00'), fim: em('16:00') })).toBe(true)
  })

  it('CA-09: outra pessoa não pode cancelar (NAO_E_DONO)', () => {
    const resultado = podeCancelar(reserva('15:00', '16:00'), 'joao', AGORA)
    expect(resultado).toMatchObject({ ok: false, codigo: 'NAO_E_DONO' })
  })

  it('CA-09: dono é verificado antes das demais regras', () => {
    const canceladaPassada = reserva('08:00', '09:00', { status: 'cancelada' })
    expect(podeCancelar(canceladaPassada, 'joao', AGORA)).toMatchObject({ ok: false, codigo: 'NAO_E_DONO' })
  })

  it('CA-10: reserva já cancelada (JA_CANCELADA)', () => {
    const cancelada = reserva('15:00', '16:00', { status: 'cancelada' })
    expect(podeCancelar(cancelada, 'ana', AGORA)).toMatchObject({ ok: false, codigo: 'JA_CANCELADA' })
  })

  it.each([
    ['09:30', '10:30', 'em andamento'],
    ['10:00', '11:00', 'começando agora'],
    ['08:00', '09:00', 'passada'],
  ])('CA-11: %s–%s (%s) não pode ser cancelada (JA_INICIADA)', (inicio, fim) => {
    expect(podeCancelar(reserva(inicio, fim), 'ana', AGORA)).toMatchObject({ ok: false, codigo: 'JA_INICIADA' })
  })

  it('CA-08..CA-11: mensagens de recusa não são vazias', () => {
    const resultado = podeCancelar(reserva('15:00', '16:00'), 'joao', AGORA)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.mensagem.trim()).not.toBe('')
  })
})

describe('Funcionalidade 2 — disponibilidade', () => {
  const ocupada = [reserva('09:00', '10:00')]
  const intervalo = (inicio: string, fim: string) => ({ inicio: em(inicio), fim: em(fim) })

  it.each([
    ['09:30', '10:30'],
    ['08:00', '11:00'],
    ['09:00', '10:00'],
    ['09:15', '09:45'],
  ])('CA-12: indisponível em %s–%s', (inicio, fim) => {
    expect(salaDisponivel(ocupada, 'sala-a', intervalo(inicio, fim))).toBe(false)
  })

  it.each([
    ['10:00', '11:00'],
    ['08:00', '09:00'],
  ])('CA-12: disponível em %s–%s (encostado)', (inicio, fim) => {
    expect(salaDisponivel(ocupada, 'sala-a', intervalo(inicio, fim))).toBe(true)
  })

  it('CA-12: reserva cancelada ou de outra sala não torna indisponível', () => {
    const cancelada = [reserva('09:00', '10:00', { status: 'cancelada' })]
    expect(salaDisponivel(cancelada, 'sala-a', intervalo('09:00', '10:00'))).toBe(true)
    expect(salaDisponivel(ocupada, 'sala-b', intervalo('09:00', '10:00'))).toBe(true)
  })

  it('CA-13: lacunas entre reservas ativas, juntando encostadas e sobrepostas', () => {
    const reservas = [
      reserva('13:00', '15:00'),
      reserva('09:00', '10:00'),
      reserva('14:00', '16:00'),
      reserva('10:00', '11:00'),
      reserva('17:00', '18:00', { status: 'cancelada' }),
      reserva('18:00', '19:00', { salaId: 'sala-b' }),
    ]
    expect(horariosLivres(reservas, 'sala-a', intervalo('07:00', '22:00'))).toEqual([
      intervalo('07:00', '09:00'),
      intervalo('11:00', '13:00'),
      intervalo('16:00', '22:00'),
    ])
  })

  it('CA-13: reservas que passam da janela são recortadas', () => {
    const reservas = [reserva('06:00', '08:00'), reserva('21:00', '23:00')]
    expect(horariosLivres(reservas, 'sala-a', intervalo('07:00', '22:00'))).toEqual([intervalo('08:00', '21:00')])
  })

  it('CA-13: sem reservas, a janela inteira está livre', () => {
    expect(horariosLivres([], 'sala-a', intervalo('07:00', '22:00'))).toEqual([intervalo('07:00', '22:00')])
  })
})
