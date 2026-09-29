import { HORA_ABERTURA, HORA_FECHAMENTO } from '@/domain/agenda'

/** Horários de meia em meia hora dentro do expediente: 07:00, 07:30, …, 22:00. */
export const HORARIOS = Array.from({ length: (HORA_FECHAMENTO - HORA_ABERTURA) * 2 + 1 }, (_, i) => {
  const minutos = HORA_ABERTURA * 60 + i * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})

/** Converte data (yyyy-MM-dd) e horários (HH:mm) na hora local do navegador em um intervalo de `Date`. */
export function intervaloLocal(data: string, inicio: string, fim: string) {
  return { inicio: new Date(`${data}T${inicio}`), fim: new Date(`${data}T${fim}`) }
}
