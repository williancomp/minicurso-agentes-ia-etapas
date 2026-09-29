import { randomUUID } from 'node:crypto'
import { Hono, type Context } from 'hono'
import { validarReserva, type CodigoRejeicao } from '../src/domain/reservas'
import type { Reserva } from '../src/domain/tipos'
import { abrirBanco, type Banco } from './db'
import * as repo from './repositorio'

export interface OpcoesApp {
  /** Banco já aberto. Se omitido, abre um banco em memória com os dados de demonstração. */
  db?: Banco
  /** Relógio injetável para testes. */
  agora?: () => Date
}

const STATUS_REJEICAO: Record<CodigoRejeicao, 409 | 422> = {
  HORARIO_INVALIDO: 422,
  NO_PASSADO: 422,
  CONFLITO: 409,
}

const TAMANHO_MAXIMO_MOTIVO = 120

/** Usuário "logado": o front-end envia o id escolhido no seletor no cabeçalho X-Usuario-Id. */
function usuarioDaRequisicao(c: Context, db: Banco) {
  const id = c.req.header('X-Usuario-Id')
  return id ? repo.buscarUsuario(db, id) : undefined
}

/** Cria a API. Os testes usam `criarApp()` + `app.request(...)`, sem subir servidor HTTP. */
export function criarApp({ db = abrirBanco(':memory:'), agora = () => new Date() }: OpcoesApp = {}) {
  const app = new Hono().basePath('/api')

  app.get('/saude', (c) => c.json({ ok: true }))

  app.get('/usuarios', (c) => c.json(repo.listarUsuarios(db)))

  app.get('/salas', (c) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(hoje.getDate() + 1)
    const reservasHoje = repo.contarReservasPorSala(db, hoje.toISOString(), amanha.toISOString())
    return c.json(repo.listarSalas(db).map((sala) => ({ ...sala, reservasHoje: reservasHoje[sala.id] ?? 0 })))
  })

  app.get('/salas/:id', (c) => {
    const sala = repo.buscarSala(db, c.req.param('id'))
    if (!sala) return c.json({ erro: 'Sala não encontrada.' }, 404)
    return c.json(sala)
  })

  // Reservas ativas da sala no intervalo [de, ate). Ex.: ?de=2026-09-28T04:00:00.000Z&ate=2026-10-04T04:00:00.000Z
  app.get('/salas/:id/reservas', (c) => {
    const sala = repo.buscarSala(db, c.req.param('id'))
    if (!sala) return c.json({ erro: 'Sala não encontrada.' }, 404)
    const de = c.req.query('de')
    const ate = c.req.query('ate')
    if (!de || !ate || Number.isNaN(Date.parse(de)) || Number.isNaN(Date.parse(ate))) {
      return c.json({ erro: 'Informe os parâmetros "de" e "ate" em ISO 8601.' }, 400)
    }
    const deIso = new Date(de).toISOString()
    const ateIso = new Date(ate).toISOString()
    return c.json(repo.listarReservasDaSala(db, sala.id, deIso, ateIso))
  })

  app.post('/reservas', async (c) => {
    const usuario = usuarioDaRequisicao(c, db)
    if (!usuario) return c.json({ erro: 'Selecione um usuário para reservar.' }, 401)

    const corpo = (await c.req.json().catch(() => null)) as Record<string, unknown> | null
    const { salaId, inicio, fim } = corpo ?? {}
    const motivo = typeof corpo?.motivo === 'string' ? corpo.motivo.trim() : ''
    if (typeof salaId !== 'string' || typeof inicio !== 'string' || typeof fim !== 'string') {
      return c.json({ erro: 'Informe sala, início e fim da reserva.' }, 400)
    }
    if (Number.isNaN(Date.parse(inicio)) || Number.isNaN(Date.parse(fim))) {
      return c.json({ erro: 'Datas em formato inválido. Use ISO 8601.' }, 400)
    }
    if (!motivo) return c.json({ erro: 'Informe o motivo da reserva.' }, 400)
    if (motivo.length > TAMANHO_MAXIMO_MOTIVO) {
      return c.json({ erro: `O motivo deve ter no máximo ${TAMANHO_MAXIMO_MOTIVO} caracteres.` }, 400)
    }
    if (!repo.buscarSala(db, salaId)) return c.json({ erro: 'Sala não encontrada.' }, 404)

    const nova = {
      salaId,
      usuarioId: usuario.id,
      inicio: new Date(inicio).toISOString(),
      fim: new Date(fim).toISOString(),
      motivo,
    }
    const resultado = validarReserva(nova, repo.listarTodasReservasDaSala(db, salaId), agora())
    if (!resultado.ok) {
      return c.json({ erro: resultado.mensagem, codigo: resultado.codigo }, STATUS_REJEICAO[resultado.codigo])
    }

    const reserva: Reserva = { ...nova, id: randomUUID(), status: 'ativa', criadaEm: agora().toISOString() }
    repo.inserirReserva(db, reserva)
    return c.json(reserva, 201)
  })

  app.notFound((c) => c.json({ erro: 'Rota não encontrada.' }, 404))
  app.onError((erro, c) => {
    console.error(erro)
    return c.json({ erro: 'Erro interno no servidor.' }, 500)
  })

  return app
}
