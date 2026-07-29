# Roadmap e restrições conhecidas

Notas que não cabem numa fase específica, mas precisam ficar visíveis antes de
reabrir decisões de produto.

## Múltiplos remédios

O domínio (`@pillify/core`) e a UX web passam a suportar **vários remédios ativos**, cada um
com ciclo, horário e lembretes próprios. Isso entrou **antes da Fase 3** (Capacitor), porque
Android é o alvo imediato de validação.

### Restrição iOS (adiada — fora do escopo atual)

**Status:** anotada; **não bloqueia** Android.

O iOS limita a **64 notificações locais pendentes** por app. Com a política padrão
(horizonte de 14 dias × 4 tentativas de escalonamento = até 56 agendamentos **por remédio**),
um único remédio cabe; o segundo já estoura o teto.

Quando (e se) iOS voltar ao roadmap:

1. Reduzir `ReminderPolicy.horizonDays` e/ou `escalationOffsetsMinutes` **só no adapter iOS**.
2. Ou priorizar remédios ativos no planejamento (ex.: horizonte menor com N > 1).
3. Revalidar o [ADR-004](00-arquitetura.md#adr-004--agendamento-idempotente-com-horizonte-rolante)
   com números reais no simulador.

Até lá, o produto assume **Android-first**. Detalhe também em
[fase-5 § 5C](fase-5-pos-validacao.md#5c--suporte-a-ios).

## Ordem preferencial pós-Fase 2

1. UX multi-remédio (este passo)
2. Fase 3 — Capacitor Android
3. Fase 4 — Validação real
4. Fase 5 — Widget, PWA, iOS, monetização (sob demanda)
