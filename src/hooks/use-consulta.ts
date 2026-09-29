import { useCallback, useEffect, useState } from 'react'

export interface EstadoConsulta<T> {
  dados: T | undefined
  erro: Error | undefined
  carregando: boolean
  recarregar: () => void
}

interface Resultado<T> {
  chave: string
  dados?: T
  erro?: Error
}

/**
 * Executa `buscar` ao montar e sempre que `dependencias` mudarem (comparadas por valor).
 * Enquanto a nova busca não termina, `carregando` é verdadeiro e `dados` mantém o último resultado.
 */
export function useConsulta<T>(buscar: () => Promise<T>, dependencias: unknown[]): EstadoConsulta<T> {
  const [versao, setVersao] = useState(0)
  const chave = `${versao}:${JSON.stringify(dependencias)}`
  const [resultado, setResultado] = useState<Resultado<T>>({ chave: '' })

  useEffect(() => {
    let cancelado = false
    buscar().then(
      (dados) => !cancelado && setResultado({ chave, dados }),
      (e: unknown) => !cancelado && setResultado({ chave, erro: e instanceof Error ? e : new Error(String(e)) }),
    )
    return () => {
      cancelado = true
    }
    // `buscar` costuma ser uma função nova a cada render; a chave já representa suas dependências.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  const atual = resultado.chave === chave
  return {
    dados: resultado.dados,
    erro: atual ? resultado.erro : undefined,
    carregando: !atual,
    recarregar,
  }
}
