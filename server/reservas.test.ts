import { describe, expect, it } from 'vitest'
import { criarApp } from './app'
import { abrirBanco } from './db'

// Banco com os dados de demonstração gerados para a semana de 28/09/2026 e relógio fixo.
// O seed usa a hora local da máquina, então as datas do teste também são locais.
const AGORA = new Date(2026, 8, 28, 6, 0)
const local = (dia: number, hora: number) => new Date(2026, 8, dia, hora, 0).toISOString()

function montar() {
  const app = criarApp({ db: abrirBanco(':memory:', AGORA), agora: () => AGORA })
  return (corpo: unknown, usuario: string | null = 'joao') =>
    app.request('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(usuario ? { 'X-Usuario-Id': usuario } : {}) },
      body: JSON.stringify(corpo),
    })
}

const corpoValido = {
  salaId: 'ic-lab-01',
  inicio: local(29, 10),
  fim: local(29, 11),
  motivo: 'Reunião do projeto de extensão',
}

describe('POST /api/reservas', () => {
  it('cria a reserva e devolve 201', async () => {
    const resposta = await montar()(corpoValido)
    expect(resposta.status).toBe(201)
    expect(await resposta.json()).toMatchObject({ salaId: 'ic-lab-01', usuarioId: 'joao', status: 'ativa' })
  })

  it('exige usuário identificado', async () => {
    expect((await montar()(corpoValido, null)).status).toBe(401)
  })

  it('exige motivo', async () => {
    const resposta = await montar()({ ...corpoValido, motivo: '   ' })
    expect(resposta.status).toBe(400)
  })

  it('devolve 404 para sala inexistente', async () => {
    expect((await montar()({ ...corpoValido, salaId: 'sala-fantasma' })).status).toBe(404)
  })

  it('devolve 409 com o código CONFLITO ao sobrepor uma reserva do seed', async () => {
    // Seed: ic-lab-01 tem aula na segunda 07:30–09:30.
    const resposta = await montar()({ ...corpoValido, inicio: local(28, 9), fim: local(28, 10) })
    expect(resposta.status).toBe(409)
    expect(await resposta.json()).toMatchObject({ codigo: 'CONFLITO' })
  })

  it('a segunda reserva idêntica é rejeitada', async () => {
    const enviar = montar()
    expect((await enviar(corpoValido)).status).toBe(201)
    expect((await enviar(corpoValido, 'ana')).status).toBe(409)
  })

  it('devolve 422 para horário no passado', async () => {
    const resposta = await montar()({ ...corpoValido, inicio: local(27, 10), fim: local(27, 11) })
    expect(resposta.status).toBe(422)
    expect(await resposta.json()).toMatchObject({ codigo: 'NO_PASSADO' })
  })
})
