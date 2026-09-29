# Especificação — Criar reserva de sala

> Funcionalidade 1 · versão 1.0.

## Objetivo

Permitir que um usuário (docente, discente ou técnico) reserve uma sala para um intervalo de horário,
impedindo reservas incompatíveis com as que já existem.

## Escopo

**Dentro:**
- Formulário "Nova reserva" na página da sala (data, início, término, motivo).
- Clique em um horário vazio da agenda abre o formulário já preenchido com aquele horário.
- Validação e gravação pela API (`POST /api/reservas`).
- A nova reserva aparece na agenda semanal logo após ser criada.

**Fora (nesta versão):**
- Reservas recorrentes, edição de reserva, aprovação por gestor.
- Cancelamento e "minhas reservas" (funcionalidade 2).
- Restrição de horário de funcionamento na API (a interface só oferece horários entre 07:00 e 22:00).
- Autenticação real (o usuário é escolhido no cabeçalho).

## Regras

- **R1.** Uma reserva ocupa o intervalo semiaberto **[início, fim)**: o minuto final não fica ocupado.
- **R2.** O término deve ser estritamente posterior ao início.
- **R3.** Não se reserva um horário cujo início já passou (início igual a "agora" é permitido).
- **R4.** Duas reservas **ativas** da **mesma sala** não podem se sobrepor. Sobrepor = `A.inicio < B.fim` e
  `B.inicio < A.fim` (cobre parcial, contida, idêntica e englobando).
- **R5.** Reservas **canceladas** não bloqueiam horário. Reservas de outras salas também não.
- **R6.** Ordem de verificação: R2 → R3 → R4 (a primeira regra violada define a resposta).
- **R7.** Motivo é obrigatório (1 a 120 caracteres, após remover espaços das pontas).

## Restrições técnicas

- As regras R1–R6 ficam em `src/domain/reservas.ts`, como funções puras (API pública em
  [`docs/api-dominio.md`](api-dominio.md)). A API e a interface **usam** essas funções; não as reimplementam.
- A API valida tudo, mesmo que a interface já valide.
- Datas em ISO 8601; o domínio recebe `agora` como parâmetro (testável sem relógio real).

## Contrato da API

`POST /api/reservas` · cabeçalho `X-Usuario-Id: <id do usuário>` · corpo:

```json
{ "salaId": "ic-lab-01", "inicio": "2026-09-30T13:00:00.000Z", "fim": "2026-09-30T14:00:00.000Z", "motivo": "Monitoria" }
```

| Situação | Status | Corpo |
|---|---|---|
| Criada | 201 | a reserva criada (`id`, `status: "ativa"`, …) |
| Sem usuário / usuário desconhecido | 401 | `{ "erro": "Selecione um usuário para reservar." }` |
| Campos ausentes, data inválida, motivo vazio ou longo | 400 | `{ "erro": "…" }` |
| Sala inexistente | 404 | `{ "erro": "Sala não encontrada." }` |
| Violação de R2 | 422 | `{ "erro": "O horário de término deve ser posterior ao de início.", "codigo": "HORARIO_INVALIDO" }` |
| Violação de R3 | 422 | `{ "erro": "Não é possível reservar um horário que já passou.", "codigo": "NO_PASSADO" }` |
| Violação de R4 | 409 | `{ "erro": "A sala já está reservada das HH:MM às HH:MM (motivo).", "codigo": "CONFLITO" }` |

## Critérios de aceitação

Tabela de referência: já existe uma reserva ativa **09:00–10:00** na sala.

| ID | Dado / Quando / Então |
|---|---|
| **CA-01** | Dado um horário livre no futuro, quando reservo com motivo, então a reserva é criada como `ativa` e aparece na agenda. |
| **CA-02** | Quando o término é igual ou anterior ao início, então a reserva é rejeitada com `HORARIO_INVALIDO` e a mensagem de R2 aparece no formulário. |
| **CA-03** | Quando o início já passou, então a reserva é rejeitada com `NO_PASSADO`. Início exatamente igual a "agora" é aceito. |
| **CA-04** | Quando peço 09:30–10:30, 08:30–09:30, 09:15–09:45, 09:00–10:00 ou 08:00–11:00, então a reserva é rejeitada com `CONFLITO` e a mensagem cita o horário da reserva existente. |
| **CA-05** | Quando peço 08:00–09:00 ou 10:00–11:00 (horários encostados), então a reserva é criada. |
| **CA-06** | Dado que a reserva 09:00–10:00 foi cancelada, ou que ela é de outra sala, quando peço 09:00–10:00, então a reserva é criada. |

## Rastreabilidade

| Critério | Teste unitário (`src/domain/reservas.test.ts`) | Aceitação (`tests/aceitacao/`) |
|---|---|---|
| CA-01 | aceita horário livre | CA-01 |
| CA-02 | rejeita fim igual/antes do início | CA-02 |
| CA-03 | rejeita início no passado; aceita início exatamente agora | CA-03 |
| CA-04 | `intervalosSeSobrepoem` (tabela); rejeita englobamento | CA-04 |
| CA-05 | `intervalosSeSobrepoem` (encostados) | CA-05 |
| CA-06 | ignora canceladas; ignora outras salas | CA-06 |
