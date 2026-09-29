import { useSyncExternalStore } from 'react'

// Roteamento mínimo baseado em hash (#/salas/ic-lab-01), sem dependências extras.

export type Rota =
  | { pagina: 'salas' }
  | { pagina: 'sala'; id: string }
  | { pagina: 'minhas-reservas' }
  | { pagina: 'nao-encontrada' }

export function interpretarRota(hash: string): Rota {
  const caminho = hash.replace(/^#/, '') || '/'
  if (caminho === '/') return { pagina: 'salas' }
  if (caminho.replace(/\/$/, '') === '/minhas-reservas') return { pagina: 'minhas-reservas' }
  const sala = caminho.match(/^\/salas\/([^/]+)\/?$/)
  if (sala) return { pagina: 'sala', id: decodeURIComponent(sala[1]) }
  return { pagina: 'nao-encontrada' }
}

function assinar(aoMudar: () => void) {
  window.addEventListener('hashchange', aoMudar)
  return () => window.removeEventListener('hashchange', aoMudar)
}

export function useRota(): Rota {
  const hash = useSyncExternalStore(assinar, () => window.location.hash)
  return interpretarRota(hash)
}

export const linkSala = (id: string) => `#/salas/${encodeURIComponent(id)}`
