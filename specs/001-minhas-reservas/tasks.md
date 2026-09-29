# Tasks: Minhas reservas, cancelamento e disponibilidade

**Input**: `specs/001-minhas-reservas/` (spec.md, plan.md, data-model.md, contracts/)
**Tests**: obrigatórios (constituição, princípio II) — escreva o teste da história antes de implementá-la.

## Format: `[ID] [P?] [Story] Description`
**[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência).

## Phase 1: Setup
- [X] T001 Conferir `docs/api-dominio.md` e criar `src/domain/minhas-reservas.ts` exportando as assinaturas (corpo pendente)

## Phase 2: Foundational
- [X] T002 Adicionar ao `server/repositorio.ts` a busca de reservas por usuário e a atualização de status
- [X] T003 [P] Adicionar ao cliente `src/lib/api.ts` as funções das três rotas novas

## Phase 3: User Story 1 - Ver minhas reservas (P1) 🎯 MVP
- [X] T004 [US1] Implementar `separarMinhasReservas` (FR-001) em `src/domain/minhas-reservas.ts`
- [X] T005 [P] [US1] Testes "CA-07: …" em `src/domain/minhas-reservas.test.ts`
- [X] T006 [US1] Rota `GET /api/reservas/minhas` em `server/app.ts` + teste em `server/minhas-reservas.test.ts`
- [X] T007 [US1] Página `src/pages/pagina-minhas-reservas.tsx` (abas) e link no cabeçalho

**Checkpoint**: `npm test` verde; "Minhas reservas" lista só as do usuário.

## Phase 4: User Story 2 - Cancelar (P1)
- [X] T008 [US2] Implementar `podeCancelar` (FR-002..FR-005) no domínio
- [X] T009 [P] [US2] Testes "CA-08".."CA-11" no domínio e na API (incluindo 403 real, sem mock)
- [X] T010 [US2] Rota `POST /api/reservas/:id/cancelar` usando `podeCancelar` com o usuário do cabeçalho
- [X] T011 [US2] `src/components/dialogo-cancelar-reserva.tsx` e botão só para reservas canceláveis

**Checkpoint**: outra pessoa recebe 403 ao chamar a API diretamente.

## Phase 5: User Story 3 - Horário livre (P2)
- [X] T012 [US3] Implementar `salaDisponivel` e `horariosLivres` (FR-007, FR-008) reutilizando a regra de sobreposição
- [X] T013 [P] [US3] Testes "CA-12" e "CA-13"
- [X] T014 [US3] `GET /api/salas?inicio&fim` + `src/components/filtro-disponibilidade.tsx`
- [X] T015 [US3] Horários livres clicáveis em `src/components/agenda-semanal.tsx`

## Phase 6: Polish
- [X] T016 `npm test`, `npm run lint`, `npm run build` e `npm run test:aceitacao` passando
- [X] T017 Atualizar `docs/handoff.md` com o estado e os critérios cobertos

## Dependencies
Setup → Foundational → US1 → US2 (usa a tela da US1) · US3 depende só da Foundational.
