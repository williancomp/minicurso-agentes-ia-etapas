# Handoff — 30/09

## Estado
- Criar reserva implementado conforme `docs/spec.md` (CA-01..CA-06).
- Regras em `src/domain/reservas.ts` (`validarReserva`, `intervalosSeSobrepoem`); API `POST /api/reservas`;
  diálogo "Nova reserva" na página da sala (também abre ao clicar num horário vazio da agenda).
- `npm test`, `npm run lint` e `npm run test:aceitacao` passando.

## Decisões
- Intervalo semiaberto [início, fim): horários encostados são permitidos (CA-05).
- Reservas canceladas e de outras salas não bloqueiam (CA-06).
- Início exatamente igual a "agora" é aceito (CA-03).
- A API valida tudo, mesmo que a interface já valide.

## Problemas conhecidos
- Ainda não existe cancelamento nem "minhas reservas" (fora do escopo da funcionalidade 1).
- Não há restrição de horário de funcionamento na API; a interface oferece só 07:00–22:00.

## Próximo passo
- Especificar e implementar "Minhas reservas e cancelamento" com o Spec Kit, mantendo as assinaturas
  de `docs/api-dominio.md`.
