# Contrato da API — Minhas reservas

Todas as rotas usam o cabeçalho `X-Usuario-Id`. Erros: `{ "erro": "…", "codigo"?: "…" }`.

| Rota | Sucesso | Erros |
|---|---|---|
| `GET /api/reservas/minhas` | 200 — reservas do usuário (qualquer status) com `sala: { id, nome, bloco, tipo }` | 401 |
| `POST /api/reservas/:id/cancelar` | 200 — reserva com `status: "cancelada"` | 401 · 404 · 403 `NAO_E_DONO` · 409 `JA_CANCELADA` · 422 `JA_INICIADA` |
| `GET /api/salas?inicio=…&fim=…` | 200 — salas com `disponivel: boolean` | 400 intervalo inválido |
