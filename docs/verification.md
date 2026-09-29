# Verificação — funcionalidades 1 e 2 (01/10)

Evidência registrada depois da revisão em dupla (checklist de revisão de código) e da correção dos
defeitos encontrados nos ajustes de disponibilidade e cancelamento.

## Comandos executados

| Comando | Resultado |
|---|---|
| `npm test` | 60 testes passando |
| `npm run test:aceitacao` | 38 testes passando (CA-01..CA-13) |
| `npm run lint` · `npm run build` | sem erros |

## Critério → evidência

| CA | Teste do projeto | Aceitação | Resultado | Observação |
|---|---|---|---|---|
| CA-01 | `src/domain/reservas.test.ts` | ✔ | passa | |
| CA-02 | `reservas.test.ts` · `server/reservas.test.ts` | ✔ | passa | |
| CA-03 | `reservas.test.ts` · `server/reservas.test.ts` | ✔ | passa | início = agora aceito |
| CA-04 | `reservas.test.ts` (tabela de `intervalosSeSobrepoem`, inclui 08:00–11:00) | ✔ | passa | teste tautológico substituído |
| CA-05 | `reservas.test.ts` (encostados na tabela) | ✔ | passa | |
| CA-06 | `reservas.test.ts` | ✔ | passa | |
| CA-07 | `src/domain/minhas-reservas.test.ts` · `server/minhas-reservas.test.ts` | ✔ | passa | |
| CA-08 | `server/minhas-reservas.test.ts` | ✔ | passa | |
| CA-09 | `server/minhas-reservas.test.ts` (403 real, sem mock) | ✔ | passa | teste com mock removido |
| CA-10 | `minhas-reservas.test.ts` | ✔ | passa | |
| CA-11 | `minhas-reservas.test.ts` | ✔ | passa | |
| CA-12 | `minhas-reservas.test.ts` (encostado = disponível) | ✔ | passa | |
| CA-13 | `minhas-reservas.test.ts` (cancelada não ocupa) | ✔ | passa | |

## Defeitos encontrados e corrigidos

| # | Defeito | Como foi achado | Correção e evidência |
|---|---|---|---|
| 1 | Reserva que engloba outra era aceita | `test:aceitacao` (CA-04) | sobreposição `A.inicio < B.fim && B.inicio < A.fim` |
| 2 | Encostado aparecia como indisponível | `test:aceitacao` (CA-12) | `salaDisponivel` reutiliza `intervalosSeSobrepoem` |
| 3 | Cancelada contava como ocupada nos horários livres | `test:aceitacao` (CA-13) | filtro por `status = ativa` |
| 4 | Qualquer usuário cancelava reserva alheia pela API | leitura do diff · `curl` com outro `X-Usuario-Id` | rota usa o usuário do cabeçalho em `podeCancelar` |
| 5 | Teste de 403 com mock (passava sempre) | leitura dos testes | teste real de 403 restaurado |
| 6 | Hora local gravada como UTC | uso da interface em UTC−4 | `intervaloLocal` sem `Z` · `src/lib/horarios.test.ts` |
| 7 | Teste de CA-04 tautológico | leitura dos testes | asserção real sobre `CONFLITO` |

## Pendências
- Nenhuma.
