# Constituição — Reserva de Salas UFMT

## Princípios

### I. Regras de negócio no domínio
Toda regra da especificação vive em `src/domain/` como função pura (sem React, sem banco, sem relógio
escondido: `agora` chega por parâmetro). API e interface **usam** essas funções; não as reimplementam.

### II. Todo critério tem teste (INEGOCIÁVEL)
Cada critério de aceitação `CA-xx` tem ao menos um teste automatizado que o cita no nome. Tarefas de teste
são obrigatórias em `tasks.md`, não opcionais. Os testes de `tests/aceitacao/` são mantidos à parte e não podem
ser alterados para passar.

### III. A API é a fonte da verdade
A API valida tudo — entrada, permissões e regras —, mesmo que a interface já valide. Esconder um botão não é
controle de acesso.

### IV. Contrato estável
As assinaturas de `docs/api-dominio.md` (nomes, parâmetros, códigos de erro) não mudam sem atualizar esse
documento e os testes de aceitação.

### V. Simples e portátil
Sem dependências novas sem justificativa; nenhuma dependência nativa; scripts npm que funcionem no Windows.

## Restrições técnicas
TypeScript estrito · React + Tailwind + shadcn/ui · API Hono · `node:sqlite` · Vitest · código e mensagens em
português · erros da API no formato `{ erro, codigo? }`.

## Fluxo de trabalho
Antes de concluir uma tarefa: `npm test` e `npm run lint` passam; o diff é mostrado à pessoa; commits só com
pedido explícito. Ver também `AGENTS.md`.

## Governança
Esta constituição prevalece sobre preferências do agente. Mudanças exigem registro aqui, com data.

**Versão**: 1.0.0 | **Ratificada**: 2026-10-01 | **Última alteração**: 2026-10-01
