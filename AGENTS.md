# AGENTS.md — Reserva de Salas

Instruções para agentes de código (OpenCode, Claude Code etc.) que trabalham neste repositório.

## O projeto

Sistema de reserva de salas e laboratórios da UFMT. Front-end React + API Hono + SQLite embutido no Node.
Especificações: `docs/spec.md` (criar reserva) e `specs/001-minhas-reservas/` (funcionalidade 2, Spec Kit).
O contrato das funções de domínio (nomes, parâmetros e códigos de erro) está em `docs/api-dominio.md`:
**não mude essas assinaturas** — os testes de aceitação dependem delas.

## Comandos

| Comando | Quando usar |
|---|---|
| `npm install` | depois de clonar ou mudar dependências |
| `npm run dev` | sobe front (http://localhost:5173) e API (http://localhost:3001/api) |
| `npm test` | testes unitários e da API — **rode antes de concluir qualquer tarefa** |
| `npm run test:aceitacao` | testes de aceitação (`tests/aceitacao/`), derivados dos critérios CA-xx |
| `npm run lint` | ESLint — precisa terminar sem erros |
| `npm run build` | checagem de tipos (tsc) + build |

## Estrutura e responsabilidades

- `src/domain/` — **regras de negócio puras**: funções sem React, sem banco, sem `fetch`, sem `new Date()`
  escondido (receba `agora` por parâmetro). Toda regra da spec mora aqui e tem teste em `*.test.ts` ao lado.
- `server/` — API Hono. Valida a entrada, chama o domínio, persiste com `node:sqlite` (`server/repositorio.ts`).
  A API é a fonte da verdade: **nunca confie só na validação do front-end**.
- `src/` (demais pastas) — interface. Componentes de `src/components/ui/` são do shadcn/ui.
- `tests/aceitacao/` — testes de aceitação mantidos à parte. **Não altere** esses arquivos para fazer os testes passarem.

## Convenções

- Código, nomes e mensagens em **português** (ex.: `validarReserva`, `salaId`, "Sala não encontrada.").
- Datas trafegam em ISO 8601 (UTC) entre front e API; a interface mostra hora local.
- Erros da API: JSON `{ "erro": "mensagem para o usuário", "codigo"?: "CODIGO" }` com status HTTP adequado
  (400 entrada inválida, 401 sem usuário, 403 sem permissão, 404 não encontrado, 409 conflito, 422 regra violada).
- O usuário atual vem no cabeçalho `X-Usuario-Id` (não há login real).
- **Não adicione dependências** sem pedir. Nada de dependências nativas (o app precisa rodar em Windows sem permissão de administrador).
- Scripts npm precisam funcionar no Windows (sem `bash`, `rm -rf`, `&&` com variáveis de ambiente).
- Estilo: TypeScript estrito, sem `any`, componentes em arquivos `kebab-case.tsx`, Tailwind para estilos.

## Antes de concluir uma tarefa

1. `npm test` e `npm run lint` passam.
2. Cada critério `CA-xx` implementado tem ao menos um teste que o cita no nome (ex.: `it('CA-04: …')`).
3. Mostre o diff resumido e diga quais critérios foram cobertos e quais ficaram pendentes.
4. Não faça commit nem push sem o pedido explícito da pessoa.
