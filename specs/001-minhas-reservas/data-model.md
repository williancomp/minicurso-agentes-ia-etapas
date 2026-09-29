# Data Model: Minhas reservas

Sem tabelas novas. A entidade `Reserva` (`src/domain/tipos.ts`) já tem `status: 'ativa' | 'cancelada'`.

| Transição | De → Para | Condição |
|---|---|---|
| Cancelar | `ativa` → `cancelada` | usuário é o dono · reserva ainda não começou |

Tipos novos do domínio (ver `docs/api-dominio.md`): `MinhasReservas` (próximas, anteriores, canceladas),
`ResultadoCancelamento` (`ok` ou `codigo`: `NAO_E_DONO` · `JA_CANCELADA` · `JA_INICIADA`), `Intervalo`.
