import { describe, expect, it } from 'vitest'
import { horariosLivres, podeCancelar, salaDisponivel, separarMinhasReservas } from './minhas-reservas'
import type { Reserva } from './tipos'

const em = (hhmm: string, dia = '2026-10-01') => new Date(`${dia}T${hhmm}:00-04:00`).toISOString()
const AGORA = new Date(em('10:00'))

let contador = 0
function reserva(inicio: string, fim: string, extra: Partial<Reserva> = {}): Reserva {
  contador += 1
  return {
    id: `r${contador}`,
    salaId: 'lab',
    usuarioId: 'ana',
    inicio: em(inicio),
    fim: em(fim),
    motivo: 'Aula',
    status: 'ativa',
    criadaEm: em('07:00', '2026-09-01'),
    ...extra,
  }
}

describe('separarMinhasReservas', () => {
  const futura = reserva('14:00', '15:00')
  const emAndamento = reserva('09:30', '11:00')
  const passada = reserva('08:00', '09:00')
  const cancelada = reserva('16:00', '17:00', { status: 'cancelada' })
  const deOutro = reserva('13:00', '14:00', { usuarioId: 'joao' })

  it('CA-07: separa próximas (inclui em andamento), anteriores e canceladas só do usuário', () => {
    const resultado = separarMinhasReservas([futura, passada, deOutro, cancelada, emAndamento], 'ana', AGORA)
    expect(resultado.proximas).toEqual([emAndamento, futura])
    expect(resultado.anteriores).toEqual([passada])
    expect(resultado.canceladas).toEqual([cancelada])
  })

  it('CA-07: usuário sem reservas recebe listas vazias', () => {
    expect(separarMinhasReservas([futura], 'mariana', AGORA)).toEqual({ proximas: [], anteriores: [], canceladas: [] })
  })
})

describe('podeCancelar', () => {
  it('CA-08: dono pode cancelar reserva ativa futura', () => {
    expect(podeCancelar(reserva('14:00', '15:00'), 'ana', AGORA)).toEqual({ ok: true })
  })

  it('CA-09: outra pessoa não pode cancelar', () => {
    expect(podeCancelar(reserva('14:00', '15:00'), 'joao', AGORA)).toMatchObject({ ok: false, codigo: 'NAO_E_DONO' })
  })

  it('CA-10: reserva já cancelada', () => {
    const r = reserva('14:00', '15:00', { status: 'cancelada' })
    expect(podeCancelar(r, 'ana', AGORA)).toMatchObject({ ok: false, codigo: 'JA_CANCELADA' })
  })

  it('CA-11: reserva em andamento ou passada', () => {
    expect(podeCancelar(reserva('09:30', '11:00'), 'ana', AGORA)).toMatchObject({ codigo: 'JA_INICIADA' })
    expect(podeCancelar(reserva('08:00', '09:00'), 'ana', AGORA)).toMatchObject({ codigo: 'JA_INICIADA' })
  })
})

describe('salaDisponivel', () => {
  const ocupada = [reserva('09:00', '10:00')]

  it('CA-12: sobreposição torna a sala indisponível', () => {
    expect(salaDisponivel(ocupada, 'lab', { inicio: em('09:30'), fim: em('10:30') })).toBe(false)
    expect(salaDisponivel(ocupada, 'lab', { inicio: em('08:00'), fim: em('11:00') })).toBe(false)
  })

  it('CA-12: encostado, cancelada ou outra sala mantém disponível', () => {
    expect(salaDisponivel(ocupada, 'lab', { inicio: em('10:00'), fim: em('11:00') })).toBe(true)
    expect(salaDisponivel(ocupada, 'outra', { inicio: em('09:00'), fim: em('10:00') })).toBe(true)
    const cancelada = [reserva('09:00', '10:00', { status: 'cancelada' })]
    expect(salaDisponivel(cancelada, 'lab', { inicio: em('09:00'), fim: em('10:00') })).toBe(true)
  })
})

describe('horariosLivres', () => {
  const janela = { inicio: em('07:00'), fim: em('22:00') }

  it('CA-13: devolve as lacunas entre reservas ativas, juntando as encostadas e sobrepostas', () => {
    const reservas = [
      reserva('09:00', '10:00'),
      reserva('10:00', '11:00'),
      reserva('13:00', '15:00'),
      reserva('14:00', '16:00'),
      reserva('17:00', '18:00', { status: 'cancelada' }),
    ]
    expect(horariosLivres(reservas, 'lab', janela)).toEqual([
      { inicio: em('07:00'), fim: em('09:00') },
      { inicio: em('11:00'), fim: em('13:00') },
      { inicio: em('16:00'), fim: em('22:00') },
    ])
  })

  it('CA-13: reserva que atravessa a janela é recortada', () => {
    const reservas = [reserva('06:00', '08:00'), reserva('21:00', '23:00')]
    expect(horariosLivres(reservas, 'lab', janela)).toEqual([{ inicio: em('08:00'), fim: em('21:00') }])
  })

  it('CA-13: janela toda ocupada não tem lacunas', () => {
    expect(horariosLivres([reserva('06:00', '23:00')], 'lab', janela)).toEqual([])
  })
})
