import { describe, expect, it } from 'vitest'
import type { Reserva, ReservaComSala, Sala } from '../src/domain/tipos'
import { criarApp } from './app'
import { abrirBanco } from './db'

// Seed gerado para a semana de 28/09/2026 (hora local da máquina) e relógio fixo na segunda às 06:00.
const AGORA = new Date(2026, 8, 28, 6, 0)
const local = (dia: number, hora: number, minuto = 0) => new Date(2026, 8, dia, hora, minuto).toISOString()

function montar() {
  const app = criarApp({ db: abrirBanco(':memory:', AGORA), agora: () => AGORA })
  const como = (usuario: string) => ({ 'Content-Type': 'application/json', 'X-Usuario-Id': usuario })
  return {
    minhas: (usuario: string) => app.request('/api/reservas/minhas', { headers: como(usuario) }),
    cancelar: (id: string, usuario: string) =>
      app.request(`/api/reservas/${id}/cancelar`, { method: 'POST', headers: como(usuario) }),
    criar: (corpo: object, usuario: string) =>
      app.request('/api/reservas', { method: 'POST', headers: como(usuario), body: JSON.stringify(corpo) }),
    salas: (inicio: string, fim: string) => app.request(`/api/salas?inicio=${inicio}&fim=${fim}`),
  }
}

async function primeiraFuturaDe(api: ReturnType<typeof montar>, usuario: string) {
  const reservas = (await (await api.minhas(usuario)).json()) as ReservaComSala[]
  return reservas.find((r) => r.status === 'ativa' && Date.parse(r.inicio) > AGORA.getTime())!
}

describe('GET /api/reservas/minhas', () => {
  it('lista só as reservas do usuário, com dados da sala', async () => {
    const reservas = (await (await montar().minhas('mariana')).json()) as ReservaComSala[]
    expect(reservas.length).toBeGreaterThan(0)
    expect(reservas.every((r) => r.usuarioId === 'mariana')).toBe(true)
    expect(reservas[0].sala.nome).toBeTruthy()
  })

  it('exige usuário', async () => {
    const app = criarApp()
    expect((await app.request('/api/reservas/minhas')).status).toBe(401)
  })
})

describe('POST /api/reservas/:id/cancelar', () => {
  it('o dono cancela e o horário fica livre para outra pessoa', async () => {
    const api = montar()
    const reserva = await primeiraFuturaDe(api, 'ana')
    const resposta = await api.cancelar(reserva.id, 'ana')
    expect(resposta.status).toBe(200)
    expect(((await resposta.json()) as Reserva).status).toBe('cancelada')

    const nova = { salaId: reserva.salaId, inicio: reserva.inicio, fim: reserva.fim, motivo: 'Aproveitando o horário' }
    expect((await api.criar(nova, 'joao')).status).toBe(201)
  })

  it('outra pessoa recebe 403 e a reserva continua ativa', async () => {
    const api = montar()
    const reserva = await primeiraFuturaDe(api, 'ana')
    const resposta = await api.cancelar(reserva.id, 'joao')
    expect(resposta.status).toBe(403)
    expect(await resposta.json()).toMatchObject({ codigo: 'NAO_E_DONO' })
    const depois = await primeiraFuturaDe(api, 'ana')
    expect(depois.id).toBe(reserva.id)
  })

  it('cancelar duas vezes devolve 409', async () => {
    const api = montar()
    const reserva = await primeiraFuturaDe(api, 'carlos')
    await api.cancelar(reserva.id, 'carlos')
    expect((await api.cancelar(reserva.id, 'carlos')).status).toBe(409)
  })

  it('reserva que já passou devolve 422', async () => {
    const api = montar()
    const reservas = (await (await api.minhas('joao')).json()) as ReservaComSala[]
    const passada = reservas.find((r) => Date.parse(r.fim) < AGORA.getTime())!
    expect((await api.cancelar(passada.id, 'joao')).status).toBe(422)
  })

  it('reserva inexistente devolve 404', async () => {
    expect((await montar().cancelar('nao-existe', 'ana')).status).toBe(404)
  })
})

describe('GET /api/salas?inicio&fim', () => {
  it('marca a disponibilidade de cada sala no intervalo', async () => {
    // Seed: ic-lab-01 ocupado segunda 07:30–09:30; faet-sala-203 segunda 08:00–10:00.
    const salas = (await (await montar().salas(local(28, 8), local(28, 9))).json()) as (Sala & {
      disponivel: boolean
    })[]
    expect(salas.find((s) => s.id === 'ic-lab-01')?.disponivel).toBe(false)
    expect(salas.find((s) => s.id === 'faet-sala-203')?.disponivel).toBe(false)
    expect(salas.find((s) => s.id === 'ic-lab-02')?.disponivel).toBe(true)
  })

  it('reserva cancelada não torna a sala indisponível', async () => {
    // Seed: ic-lab-02 tem só uma reserva CANCELADA na terça 08:00–10:00.
    const salas = (await (await montar().salas(local(29, 8), local(29, 10))).json()) as (Sala & {
      disponivel: boolean
    })[]
    expect(salas.find((s) => s.id === 'ic-lab-02')?.disponivel).toBe(true)
  })

  it('horário encostado conta como disponível', async () => {
    const salas = (await (await montar().salas(local(28, 9, 30), local(28, 10))).json()) as (Sala & {
      disponivel: boolean
    })[]
    expect(salas.find((s) => s.id === 'ic-lab-01')?.disponivel).toBe(true)
  })

  it('intervalo inválido devolve 400', async () => {
    expect((await montar().salas(local(28, 10), local(28, 9))).status).toBe(400)
  })
})
