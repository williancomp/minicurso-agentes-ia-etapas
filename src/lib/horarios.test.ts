import { describe, expect, it } from 'vitest'
import { intervaloLocal } from './horarios'

describe('intervaloLocal', () => {
  // Regressão do defeito de fuso encontrado na verificação (M6): o horário digitado é hora LOCAL.
  it('interpreta o horário digitado como hora local', () => {
    const { inicio, fim } = intervaloLocal('2030-10-01', '08:00', '09:30')
    expect([inicio.getFullYear(), inicio.getMonth(), inicio.getDate()]).toEqual([2030, 9, 1])
    expect([inicio.getHours(), inicio.getMinutes()]).toEqual([8, 0])
    expect([fim.getHours(), fim.getMinutes()]).toEqual([9, 30])
  })
})
