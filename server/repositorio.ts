import type { Reserva, ReservaComSala, Sala, Usuario } from '../src/domain/tipos'
import type { Banco } from './db'

type Linha = Record<string, unknown>

function paraSala(linha: Linha): Sala {
  return {
    id: String(linha.id),
    nome: String(linha.nome),
    bloco: String(linha.bloco),
    andar: String(linha.andar),
    tipo: linha.tipo as Sala['tipo'],
    capacidade: Number(linha.capacidade),
    recursos: JSON.parse(String(linha.recursos)),
    descricao: String(linha.descricao),
  }
}

function paraReserva(linha: Linha): Reserva {
  return {
    id: String(linha.id),
    salaId: String(linha.sala_id),
    usuarioId: String(linha.usuario_id),
    inicio: String(linha.inicio),
    fim: String(linha.fim),
    motivo: String(linha.motivo),
    status: linha.status as Reserva['status'],
    criadaEm: String(linha.criada_em),
  }
}

export function listarSalas(db: Banco): Sala[] {
  return (db.prepare('SELECT * FROM salas ORDER BY bloco, nome').all() as Linha[]).map(paraSala)
}

export function buscarSala(db: Banco, id: string): Sala | undefined {
  const linha = db.prepare('SELECT * FROM salas WHERE id = ?').get(id) as Linha | undefined
  return linha ? paraSala(linha) : undefined
}

export function listarUsuarios(db: Banco): Usuario[] {
  return db.prepare('SELECT id, nome, papel, unidade FROM usuarios ORDER BY nome').all() as unknown as Usuario[]
}

export function buscarUsuario(db: Banco, id: string): Usuario | undefined {
  return db.prepare('SELECT id, nome, papel, unidade FROM usuarios WHERE id = ?').get(id) as unknown as
    | Usuario
    | undefined
}

/** Reservas ATIVAS da sala que tocam o intervalo [de, ate). Datas em ISO (UTC). */
export function listarReservasDaSala(db: Banco, salaId: string, de: string, ate: string): Reserva[] {
  const linhas = db
    .prepare(
      `SELECT * FROM reservas
       WHERE sala_id = ? AND status = 'ativa' AND inicio < ? AND fim > ?
       ORDER BY inicio`,
    )
    .all(salaId, ate, de) as Linha[]
  return linhas.map(paraReserva)
}

/** Quantas reservas ativas cada sala tem no intervalo [de, ate). */
export function contarReservasPorSala(db: Banco, de: string, ate: string): Record<string, number> {
  const linhas = db
    .prepare(
      `SELECT sala_id, COUNT(*) AS total FROM reservas
       WHERE status = 'ativa' AND inicio < ? AND fim > ?
       GROUP BY sala_id`,
    )
    .all(ate, de) as { sala_id: string; total: number }[]
  return Object.fromEntries(linhas.map((l) => [l.sala_id, Number(l.total)]))
}

/** Todas as reservas da sala, de qualquer status (as regras de domínio decidem o que conta). */
export function listarTodasReservasDaSala(db: Banco, salaId: string): Reserva[] {
  return (db.prepare('SELECT * FROM reservas WHERE sala_id = ? ORDER BY inicio').all(salaId) as Linha[]).map(
    paraReserva,
  )
}

export function inserirReserva(db: Banco, reserva: Reserva): void {
  db.prepare(
    `INSERT INTO reservas (id, sala_id, usuario_id, inicio, fim, motivo, status, criada_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    reserva.id,
    reserva.salaId,
    reserva.usuarioId,
    reserva.inicio,
    reserva.fim,
    reserva.motivo,
    reserva.status,
    reserva.criadaEm,
  )
}

export function buscarReserva(db: Banco, id: string): Reserva | undefined {
  const linha = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id) as Linha | undefined
  return linha ? paraReserva(linha) : undefined
}

export function marcarComoCancelada(db: Banco, id: string): void {
  db.prepare("UPDATE reservas SET status = 'cancelada' WHERE id = ?").run(id)
}

/** Todas as reservas do usuário (qualquer status), com nome e bloco da sala. */
export function listarReservasDoUsuario(db: Banco, usuarioId: string): ReservaComSala[] {
  const linhas = db
    .prepare(
      `SELECT r.*, s.nome AS sala_nome, s.bloco AS sala_bloco, s.tipo AS sala_tipo
       FROM reservas r JOIN salas s ON s.id = r.sala_id
       WHERE r.usuario_id = ?
       ORDER BY r.inicio`,
    )
    .all(usuarioId) as Linha[]
  return linhas.map((linha) => ({
    ...paraReserva(linha),
    sala: {
      id: String(linha.sala_id),
      nome: String(linha.sala_nome),
      bloco: String(linha.sala_bloco),
      tipo: linha.sala_tipo as Sala['tipo'],
    },
  }))
}

/** Reservas de todas as salas que tocam o intervalo [de, ate), de qualquer status. */
export function listarReservasNoIntervalo(db: Banco, de: string, ate: string): Reserva[] {
  const linhas = db.prepare('SELECT * FROM reservas WHERE inicio < ? AND fim > ?').all(ate, de) as Linha[]
  return linhas.map(paraReserva)
}
