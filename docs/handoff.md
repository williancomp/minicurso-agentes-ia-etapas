# Handoff — 01/10, após a funcionalidade 2

## Estado
- Funcionalidade 1 (criar reserva, CA-01..CA-06) e funcionalidade 2 (minhas reservas, cancelamento e
  disponibilidade, CA-07..CA-13) implementadas; tarefas T001..T017 de `specs/001-minhas-reservas/tasks.md` concluídas.
- `npm test`, `npm run lint`, `npm run build` e `npm run test:aceitacao` passando.

## Decisões
- Só o dono cancela, verificado na API (403 `NAO_E_DONO`); reserva iniciada não se cancela (`JA_INICIADA`).
- Cancelar muda o status (não apaga); cancelada não bloqueia horário.
- Disponibilidade reutiliza a regra de sobreposição da funcionalidade 1 (encostado = disponível).

## Problemas conhecidos
- Nenhum conhecido.

## Próximo passo
- Revisão independente do código e dos testes; registrar a evidência em `docs/verification.md`.
