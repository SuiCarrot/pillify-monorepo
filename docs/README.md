# Pillify — Documentação de Implementação

Documentos de planejamento do Pillify, um app de lembrete de remédios e anticoncepcional
focado em lembretes que resistem ao "notification overload".

O contexto de produto e negócio está em [briefing.md](briefing.md). Os documentos
abaixo cobrem a execução técnica.

## Índice

| Documento | Conteúdo |
| --- | --- |
| [00 — Arquitetura e decisões globais](00-arquitetura.md) | Arquitetura hexagonal, ports e adapters, ADRs transversais |
| [Fase 0 — Scaffold](fase-0-scaffold.md) | Monorepo pnpm, toolchain, configuração base |
| [Fase 1 — Domínio](fase-1-dominio.md) | `packages/core`: ciclo, doses, agendamento, testes |
| [Fase 2 — UI no navegador](fase-2-ui-navegador.md) | Persistência Dexie, telas React, adapter de desenvolvimento |
| [Fase 3 — Capacitor Android](fase-3-capacitor-android.md) | Build nativa, alarmes exatos, notificações acionáveis |
| [Fase 4 — Validação real](fase-4-validacao.md) | APK por sideload, roteiro de teste, critérios de sucesso |
| [Fase 5 — Pós-validação](fase-5-pos-validacao.md) | Widget nativo, PWA, iOS, monetização |

## Decisão que orienta todo o plano

A hipótese central do produto é **"lembrete que não dá para ignorar"**. Validar isso num
PWA produziria um falso negativo, porque a plataforma web não tem alarme local confiável.
Os detalhes estão em [00-arquitetura.md](00-arquitetura.md#adr-001--validação-em-android-nativo-e-não-em-pwa),
mas o resumo é:

- **Notification Triggers API** nunca saiu do flag experimental do Chrome.
- **Periodic Background Sync** entrega a cada 12h–36h, não é despertador.
- **Web Push** exige rede na hora da entrega e o WebKit ignora botões de ação.

Por isso o navegador é o ambiente de **desenvolvimento**, e o APK Android via Capacitor é o
ambiente de **validação**.

## Stack consolidada

Versões verificadas em 29/07/2026.

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Runtime de build | Node.js | 24.14.0 |
| Gerenciador de pacotes | pnpm (workspaces + catalog) | 11.9.0 |
| Linguagem | TypeScript | 5.9.3 |
| Bundler | Vite | 8.1.5 |
| UI | React | 19.2.8 |
| Estilo | Tailwind CSS (via `@tailwindcss/vite`) | 4.3.3 |
| Estado de UI | Zustand | 5.0.14 |
| Roteamento | React Router | 8.3.0 |
| Persistência | Dexie (IndexedDB) | 4.4.4 |
| Datas | date-fns | 4.4.0 |
| Testes | Vitest | 4.1.10 |
| Lint | ESLint + typescript-eslint | 10.8.0 / 8.65.0 |
| Formatação | Prettier | 3.9.6 |
| Runtime nativo | Capacitor | 8.4.2 |
| Notificações nativas | `@capacitor/local-notifications` | 8.2.1 |

## Como revisar

Cada documento de fase segue a mesma estrutura: **Objetivo**, **Tecnologias**,
**Arquitetura**, **Decisões** (com alternativas descartadas e o porquê), **Entregáveis** e
**Critério de pronto**.

As seções de **Decisões** são as que mais merecem atenção na revisão, porque são reversíveis
agora e caras depois.
