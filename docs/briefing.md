# ARCHITECTURE & PROJECT BRIEF: App de Lembrete de Remédios / Anticoncepcional

## 1. Contexto & Problema de Negócio (UX Goal)

- **Público-alvo inicial:** Uso pessoal / Validação com a esposa (com potencial de monetização B2C).
- **Problema principal:** Notificações tradicionais de smartphones são facilmente ignoradas ou limpas em lote (notification overload).
- **Objetivo de UX:** Garantir alta visibilidade dos lembretes diários (ex: ciclo de anticoncepcional) usando estratégias passivas e ativas de alta prioridade (Widgets de tela inicial, Notificações com interação obrigatória e status visível do ciclo).

## 2. Decisão de Arquitetura & Stack Tecnológica

**Abordagem adotada:** Hybrid Progressive Delivery (Web-First → CapacitorJS)

```
[ PWA Web App ]  ──(Fase 1: MVP)──>  Validação de UX e lógica de ciclo
       │
       ▼
[ CapacitorJS ]  ──(Fase 2: Mobile)──> Builds nativas (Android .aab / iOS)
       │                              └─ Notificações Locais de alta prioridade
       │                              └─ Widgets nativos de tela inicial
       ▼
[ Monetização ]  ──(Fase 3: Store)──> Publicação na Play Store (RevenueCat / Freemium)
```

### Stack definida

| Camada | Tecnologia |
| --- | --- |
| Frontend Web | React / Next.js ou Vite + TypeScript + TailwindCSS |
| Mobile Runtime / Bridge | CapacitorJS (`@capacitor/core`, `@capacitor/cli`) |
| Estado & Persistência Local | IndexedDB / SQLite / LocalStorage (offline-first) |
| Push & Alertas (PWA) | Web Push API com `requireInteraction: true` |
| Push & Alertas (Capacitor) | `@capacitor/local-notifications` com Actionable Notifications e som de prioridade |
| Widgets Nativos (Fase 2) | Ponte nativa (`home_widget` ou código nativo Kotlin via Capacitor Plugin) |

## 3. Diretrizes de Produto & Funcionalidades Principais

### A. Core Engine (Gestão de Remédios & Ciclo)

**Lógica de Cartela/Ciclo:**

- Suporte a configurações flexíveis (ex: 21 dias + 7 dias de pausa, 24+4, ou contínuo).
- Mapeamento do estado diário: Pendente, Tomado (com timestamp), Adiado ou Esquecido.

**Dashboard Visual:**

- Exibição clara do dia atual dentro da cartela/ciclo (ex: "Dia 14/21").

### B. Sistema de Notificação e Lembretes (Anti-Ignorância)

**Notificações Acionáveis (Actionable Push):**

- Botões diretos na notificação: `[Marcar como Tomado]` e `[Adiar 10 min]`.

**Persistência de Alerta:**

- Flag `requireInteraction: true` para impedir que a notificação suma sozinha.
- Lógica de re-notificação periódica enquanto o estado for Pendente.

**App Open Intent:**

- Ao clicar na notificação, abertura imediata de uma modal/tela cheia de confirmação ("Tomar Agora").

### C. Widget de Tela Inicial (Requisito Chave)

- Exibição do estado do remédio direto na home do celular.
- **Estado Pendente:** Destaque em cor de alerta + horário do remédio.
- **Estado Concluído:** Cor neutra/verde + confirmação de horário tomado.

## 4. Estratégia de Monetização (Roadmap Comercial)

**Modelo:** Freemium com Assinatura (Subscription via RevenueCat no Android/iOS).

### Plano Gratuito

- Lembrete simples de 1 remédio + notificações padrão.

### Plano Pro (Pago)

- Widgets interativos para a tela inicial.
- Relatórios e histórico de ciclos exportáveis em PDF.
- Múltiplos remédios / perfis familiares.
- Backup e sincronização em nuvem.

## 5. Instruções para o Agente de IA (Cursor IDE)

**Instrução de Inicialização:**

> Atue como um Engenheiro de Software Full Stack especialista em Web, TypeScript, React e CapacitorJS.
>
> A missão é arquitetar um MVP offline-first para um aplicativo de lembrete de remédios/anticoncepcional focado em alta retenção e facilidade de uso.
>
> Priorize uma estrutura limpa, modular e tipada em TypeScript. Mantenha o código pronto para ser executado como Web App (PWA) no primeiro momento, e envelopado com CapacitorJS na sequência sem quebras de arquitetura.
