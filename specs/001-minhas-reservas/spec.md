# Feature Specification: Minhas reservas, cancelamento e disponibilidade

**Feature Branch**: `001-minhas-reservas`
**Created**: 2026-10-01
**Status**: Draft
**Input**: User description: "Minhas reservas: o usuário vê as próprias reservas e pode cancelar as futuras;
só o dono cancela; a agenda da sala e a listagem mostram onde e quando há salas livres. Mantenha as assinaturas
de docs/api-dominio.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver minhas reservas (Priority: P1)
Como usuário, quero ver as minhas reservas separadas em Próximas, Anteriores e Canceladas.

**Why this priority**: sem ver as próprias reservas, não há o que cancelar.
**Independent Test**: com reservas de vários estados de dois usuários, abrir "Minhas reservas" como um deles.

**Acceptance Scenarios**:
1. **CA-07** — **Given** tenho reservas futuras, em andamento, passadas e canceladas, e outra pessoa também
   tem, **When** abro "Minhas reservas", **Then** vejo só as minhas, separadas e ordenadas conforme FR-001.

### User Story 2 - Cancelar uma reserva minha (Priority: P1)
Como dono de uma reserva futura, quero cancelá-la para liberar o horário.

**Why this priority**: é a ação central da funcionalidade.
**Independent Test**: cancelar pela interface e pela API; tentar como outra pessoa.

**Acceptance Scenarios**:
1. **CA-08** — **Given** tenho uma reserva ativa que ainda não começou, **When** a cancelo, **Then** ela
   aparece em "Canceladas" e outra pessoa consegue reservar o mesmo horário.
2. **CA-09** — **When** outra pessoa tenta cancelar a minha reserva (inclusive chamando a API diretamente),
   **Then** recebe `NAO_E_DONO` e a reserva continua ativa.
3. **CA-10** — **When** tento cancelar uma reserva já cancelada, **Then** recebo `JA_CANCELADA`.
4. **CA-11** — **When** tento cancelar uma reserva em andamento ou passada, **Then** recebo `JA_INICIADA`.

### User Story 3 - Encontrar horário livre (Priority: P2)
Como usuário, quero ver os horários livres de uma sala e filtrar as salas livres num intervalo.

**Why this priority**: facilita reservar, mas o sistema funciona sem isso.
**Independent Test**: consultar disponibilidade e horários livres com reservas conhecidas.

**Acceptance Scenarios**:
1. **CA-12** — **Given** uma reserva ativa 09:00–10:00, **Then** a sala está indisponível em 09:30–10:30 e
   08:00–11:00 e disponível em 10:00–11:00; reserva cancelada ou de outra sala não a torna indisponível.
2. **CA-13** — **Given** reservas 09–10, 10–11, 13–15 e 14–16 (ativas) e 17–18 (cancelada), **When**
   consulto a janela 07–22, **Then** os horários livres são 07–09, 11–13 e 16–22.

### Edge Cases
- Reserva em andamento aparece em Próximas, mas não pode ser cancelada (FR-001, FR-005).
- Horários encostados contam como disponíveis (mesma regra de sobreposição da funcionalidade 1).
- Reservas sobrepostas ou encostadas formam um único bloco ocupado; o que passa da janela é recortado.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: "Minhas reservas" MUST mostrar só as reservas do usuário atual. Próximas = ativas que ainda não
  terminaram, da mais próxima para a mais distante; Anteriores = ativas já terminadas, da mais recente para a
  mais antiga; Canceladas = status `cancelada`, da mais recente para a mais antiga.
- **FR-002**: Só o dono MUST poder cancelar (`NAO_E_DONO`), verificado **na API**.
- **FR-003**: Reserva já cancelada MUST NOT ser cancelada de novo (`JA_CANCELADA`).
- **FR-004**: Reserva que já começou (início ≤ agora) MUST NOT ser cancelada (`JA_INICIADA`).
- **FR-005**: Ordem de verificação: FR-002 → FR-003 → FR-004.
- **FR-006**: Cancelar MUST mudar o status para `cancelada` (sem apagar); a reserva deixa de bloquear o horário.
- **FR-007**: Sala disponível em [início, fim) quando nenhuma reserva **ativa** dela se sobrepõe ao intervalo.
- **FR-008**: Horários livres = lacunas entre reservas ativas dentro da janela (ver Edge Cases).
- **FR-009**: As funções de domínio MUST seguir `docs/api-dominio.md` (`separarMinhasReservas`, `podeCancelar`,
  `salaDisponivel`, `horariosLivres`).

### Key Entities
- **Reserva**: já existe (`src/domain/tipos.ts`); o status passa a poder ser `cancelada`.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: `npm run test:aceitacao` passa com CA-01..CA-13.
- **SC-002**: Cada CA-07..CA-13 tem ao menos um teste do projeto que o cita no nome.
- **SC-003**: Uma chamada direta à API de outra pessoa para cancelar retorna 403.

## Assumptions
- Não há login real; o usuário atual vem do cabeçalho `X-Usuario-Id`.
- Fora do escopo: reativar reserva, cancelar parte dela, notificar pessoas, administrador cancelando reservas alheias.
