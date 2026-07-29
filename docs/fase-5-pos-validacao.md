# Fase 5 — Pós-validação

## Objetivo

Reunir tudo que foi deliberadamente adiado do MVP. Este documento é um **mapa de opções, não
um plano de execução**: só faz sentido detalhar cada item depois que a
[Fase 4](fase-4-validacao.md) disser o que o produto realmente precisa.

O erro clássico aqui é construir a lista inteira. A validação existe justamente para revelar
que boa parte dela não importa.

## Escopo adiado

| Item | Origem | Pré-requisito |
| --- | --- | --- |
| Widget de tela inicial | Briefing, requisito chave | Validação positiva |
| PWA completo | Briefing, Fase 1 original | Interesse em distribuição web |
| Suporte a iOS | Briefing | Aparelho iOS entre os usuários |
| Backup e sincronização | Briefing, plano Pro | Mais de um dispositivo |
| Relatórios em PDF | Briefing, plano Pro | Demanda comprovada |
| Múltiplos remédios (UX) | Briefing / pedido pré-Fase 3 | **Feito na web** antes do Capacitor; ver [roadmap](roadmap.md) |
| Perfis familiares | Briefing, plano Pro | Demanda comprovada |
| Monetização | Briefing, Fase 3 | Todas as anteriores |

---

## 5A — Widget de tela inicial

O briefing classifica isso como requisito chave, e é a funcionalidade mais alinhada com o
problema de negócio: um widget é **passivo**, não pode ser dispensado com um deslize e está
visível toda vez que a pessoa desbloqueia o celular.

### Tecnologia

Widgets Android não têm plugin oficial no Capacitor. É necessário:

- `AppWidgetProvider` em Kotlin com `RemoteViews`.
- Um plugin Capacitor customizado (`@Plugin` / `@PluginMethod`) para a camada JS empurrar o
  estado atual para o widget.
- `SharedPreferences` como canal de dados entre o app e o processo do widget, já que o widget
  **não** consegue ler o IndexedDB da WebView.

### Decisão de arquitetura antecipada

O widget precisa de um estado pré-digerido e mínimo: status da dose de hoje, horário e dia da
cartela. Nada de reprocessar regra de negócio em Kotlin.

**Decisão:** o app calcula um `WidgetSnapshot` usando `packages/core` e o grava em
`SharedPreferences` a cada mudança de estado. O widget apenas renderiza esse snapshot. A regra
de negócio continua existindo em um único lugar.

**Consequência:** o Kotlin fica limitado a apresentação e ao tratamento do toque, e não
duplica lógica de ciclo.

---

## 5B — PWA completo

Retomar o que foi adiado no [ADR-001](00-arquitetura.md#adr-001--validação-em-android-nativo-e-não-em-pwa):
`vite-plugin-pwa` em modo `injectManifest`, manifest, ícones e cache offline.

Vale notar que, mesmo com PWA, **o lembrete confiável continua sendo o do app nativo**. O PWA
serviria para acesso rápido em desktop e para quem não quer instalar APK, não como
substituto do canal de notificação.

Se a distribuição web virar prioridade, aí sim entra o Web Push com backend agendador, com as
limitações já mapeadas: dependência de rede e ausência de botões de ação no iOS.

---

## 5C — Suporte a iOS

`cap add ios` exige macOS, Xcode e conta de desenvolvedor Apple. `@capacitor/local-notifications`
funciona em iOS com alarmes locais reais, então o canal de notificação é sólido.

**Restrição relevante:** o iOS limita a **64 notificações locais pendentes** por app. O
horizonte rolante de 14 dias com escalonamento de 4 tentativas gera 56 agendamentos para um
remédio — cabe, mas não sobra espaço para um segundo. Com a UX multi-remédio já ativa no
Android, isso **precisa ser tratado antes de qualquer build iOS**. Ver
[roadmap](roadmap.md#restrição-ios-adiada--fora-do-escopo-atual).

O [ADR-004](00-arquitetura.md#adr-004--agendamento-idempotente-com-horizonte-rolante) já prevê
horizonte configurável, então a adaptação é ajustar `horizonDays` / escalonamento por
plataforma.

Vale registrar que essa restrição valida a decisão de manter o horizonte como parâmetro em vez
de constante.

---

## 5D — Backup e sincronização

Primeiro passo barato, que pode até ser antecipado: exportação e importação manual em JSON. Já
está prevista como entregável da Fase 4 para fins de análise, e resolve o pior cenário (troca
de celular) sem infraestrutura.

Sincronização de verdade quebra o [ADR-007](00-arquitetura.md#adr-007--sem-backend-no-mvp) e
traz consigo contas, autenticação, resolução de conflito e armazenamento de dado de saúde em
servidor, com as obrigações de LGPD que isso implica. Só com justificativa clara.

---

## 5E — Monetização

O briefing prevê freemium com RevenueCat. A ordem correta é: validar, ter usuários além da
família, e só então cobrar.

O plano Pro descrito no briefing (widgets, PDF, múltiplos perfis, nuvem) depende quase
inteiramente dos itens acima. Não há o que monetizar antes deles.

Um ponto que merece consideração se o app for público: um aplicativo de saúde que esconde o
widget de lembrete atrás de assinatura pode ser percebido como cobrança pela funcionalidade
que evita esquecer o remédio. Vale reavaliar qual é a fronteira do plano gratuito antes de
implementar.

---

## Decisões

### D5.1 — Nenhum item desta fase começa sem a Fase 4 concluída

**Decisão:** esta fase permanece um documento de opções até existir o relatório de validação.
Cada item vira um plano detalhado próprio, no momento em que for priorizado.

### D5.2 — Widget é o primeiro candidato

Se a validação for positiva, o widget é o próximo item por padrão. É o que o briefing marca
como requisito chave e o que ataca o problema por um ângulo diferente do notificacional, que
é a hipótese que já teremos testado.

### D5.3 — A arquitetura já suporta tudo isso

Nenhum item da lista exige mexer em `packages/core`. Widget consome um snapshot, PWA e iOS são
novos adapters de `NotificationPort`, sincronização é um novo adapter de `StoragePort`.

Isso é a validação retroativa do custo pago na Fase 0 com a arquitetura hexagonal — e vale
manter a disciplina justamente aqui, quando a pressa de entregar features é maior.
