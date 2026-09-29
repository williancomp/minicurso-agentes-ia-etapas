# Implementation Plan: Minhas reservas, cancelamento e disponibilidade

**Branch**: `001-minhas-reservas` | **Date**: 2026-10-01 | **Spec**: [spec.md](spec.md)

## Summary
Acrescentar ao domínio as funções de `docs/api-dominio.md` (funcionalidade 2), três rotas na API e duas telas:
"Minhas reservas" (com cancelamento) e horários livres/filtro de disponibilidade. Nada muda no banco: o campo
`status` já existe.

## Technical Context
**Language/Version**: TypeScript ~6.0, Node ≥ 22.13 · **Primary Dependencies**: React 19, Hono, Tailwind 4,
shadcn/ui · **Storage**: `node:sqlite` (tabela `reservas` já tem `status`) · **Testing**: Vitest (unitário, API
com `app.request`, aceitação) · **Target Platform**: navegador + Node local (Windows no laboratório) ·
**Constraints**: sem dependências novas; regras puras no domínio.

## Constitution Check
- I. Regras no domínio → `src/domain/minhas-reservas.ts`; API e UI só chamam. ✅
- II. Todo critério tem teste → tarefas de teste obrigatórias por história (T005, T009, T013). ✅
- III. API como fonte da verdade → `NAO_E_DONO` verificado na rota de cancelamento. ✅
- IV. Contrato estável → assinaturas de `docs/api-dominio.md`. ✅
- V. Simples e portátil → sem dependências novas. ✅

## Project Structure

### Documentation (this feature)
```text
specs/001-minhas-reservas/
├── spec.md · plan.md · data-model.md · tasks.md
├── contracts/api-reservas.md
└── checklists/requirements.md
```

### Source Code (repository root)
```text
src/domain/minhas-reservas.ts (+ .test.ts)   regras FR-001..FR-008
server/app.ts, server/repositorio.ts          rotas e consultas
server/minhas-reservas.test.ts                testes da API
src/pages/pagina-minhas-reservas.tsx          tela "Minhas reservas"
src/components/dialogo-cancelar-reserva.tsx  confirmação
src/components/filtro-disponibilidade.tsx    filtro na listagem
src/components/agenda-semanal.tsx             horários livres na agenda
```

## Complexity Tracking
Nenhuma violação da constituição.
