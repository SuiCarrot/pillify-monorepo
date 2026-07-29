# Fase 2 — UI no Navegador

## Objetivo

Construir a interface completa e a persistência real, iterando no navegador com hot reload.
Ao final desta fase o app é utilizável no Chrome desktop, com uma única limitação conhecida:
os lembretes só disparam com a aba aberta.

Desenvolver aqui e não direto no APK é uma escolha de velocidade: rebuildar Gradle a cada
ajuste de CSS custa minutos que o Vite resolve em milissegundos.

## Tecnologias

| Ferramenta | Versão | Papel |
| --- | --- | --- |
| React | 19.2.8 | UI |
| React Router | 8.3.0 | Navegação entre telas |
| Zustand | 5.0.14 | Estado de UI |
| Dexie | 4.4.4 | Wrapper tipado sobre IndexedDB |
| Tailwind CSS | 4.3.3 | Estilo |
| fake-indexeddb | 6.2.5 | IndexedDB em memória para testes |

## Arquitetura

```
apps/web/src/
├─ adapters/
│  ├─ storage/dexie/
│  │  ├─ db.ts               # schema e migrações
│  │  └─ DexieStorageAdapter.ts
│  └─ notifications/
│     └─ DevNotificationAdapter.ts
├─ composition.ts            # único lugar que escolhe adapters
├─ store/
│  └─ useAppStore.ts         # Zustand
├─ features/
│  ├─ dashboard/             # cartela visual, dose do dia
│  ├─ setup/                 # cadastro e edição do remédio
│  ├─ confirm/               # tela cheia "Tomar agora"
│  └─ history/               # histórico de ciclos
├─ components/               # botões, cartões, layout
└─ routes.tsx
```

### Composition root

Todo o conhecimento de plataforma vive em um arquivo só:

```ts
// composition.ts
const storage = new DexieStorageAdapter(db);
const clock = new SystemClock();
const notifications = Capacitor.isNativePlatform()
  ? new CapacitorNotificationAdapter()   // chega na Fase 3
  : new DevNotificationAdapter();

export const app = createUseCases({ storage, clock, notifications });
```

Nenhum componente React importa Dexie ou Capacitor. Eles consomem casos de uso. Isso é o que
permite a Fase 3 ser uma troca de uma linha em vez de um refactor.

### Schema do Dexie

```ts
db.version(1).stores({
  medications: 'id, active',
  doseLogs: 'id, medicationId, scheduledFor, [medicationId+scheduledFor]',
});
```

O índice composto `[medicationId+scheduledFor]` serve às consultas de histórico por intervalo,
que são a operação mais frequente do dashboard.

### Telas

| Tela | Conteúdo |
| --- | --- |
| **Dashboard** | Cartela visual do ciclo, indicador "Dia 14/21", dose de hoje com estado e ação primária grande |
| **Setup** | Nome do remédio, horário, tipo de ciclo (contínuo, 21+7, 24+4, personalizado), data de início |
| **Confirm** | Tela cheia de confirmação, alvo do toque na notificação. Dois botões: "Tomei agora" e "Adiar 10 min" |
| **History** | Últimos ciclos, aderência, doses esquecidas |

## Decisões

### D2.1 — Dexie/IndexedDB, e não Preferences nem SQLite nativo

Três opções foram consideradas para persistência:

| Opção | Veredito |
| --- | --- |
| `@capacitor/preferences` | Descartada. É chave-valor, sem consulta por intervalo. O histórico de doses viraria um JSON gigante lido e reescrito inteiro. |
| SQLite nativo (`@capacitor-community/sqlite`) | Descartada por ora. Poderoso, mas adiciona plugin nativo, complica o desenvolvimento no navegador e resolve um problema de escala que não temos. |
| **Dexie sobre IndexedDB** | **Escolhida.** Funciona igual no Chrome e na WebView do Android, sem plugin nativo, com índices e consultas de intervalo. |

O `StoragePort` protege essa escolha: se o volume de dados algum dia justificar SQLite, troca-se
o adapter.

**Ponto a verificar na Fase 3:** persistência de IndexedDB na WebView do Android sob pressão de
memória. A expectativa é que dados de app instalado não sejam despejados, mas isso entra no
roteiro de teste em vez de ser assumido.

### D2.2 — Zustand só para estado de UI

**Decisão:** o Zustand guarda estado **efêmero de interface** (modal aberta, aba selecionada,
carregando) e um cache dos dados vindos dos casos de uso. Ele **não** contém regra de negócio
e não é a fonte de verdade — a fonte de verdade é o IndexedDB, através do `StoragePort`.

**Alternativa descartada:** TanStack Query. Excelente para servidor remoto, mas aqui não há
rede, latência nem invalidação de cache distribuído. Seria complexidade sem contrapartida.

### D2.3 — `DevNotificationAdapter` com limitação explícita

Implementa `NotificationPort` com `setTimeout` e a Notification API do navegador. Funciona
apenas com a aba viva.

**Decisão:** o adapter expõe uma flag `isReliable: false`, e a UI mostra um aviso permanente
em ambiente de desenvolvimento. O objetivo é impedir que alguém — inclusive nós, daqui a três
semanas — conclua que "o lembrete não funciona" testando no navegador.

### D2.4 — Reconciliação no `visibilitychange`

O replanejamento do horizonte
([ADR-004](00-arquitetura.md#gatilho-do-replanejamento)) precisa de um gatilho. Reconciliar
apenas no bootstrap não basta: o caso mais frequente é o app já estar carregado e apenas
voltar ao primeiro plano, o que não reinicializa nada.

**Decisão:** o gatilho fica atrás de uma abstração `LifecyclePort` com um único evento,
`becameActive`. No navegador ele vem de `visibilitychange` com
`document.visibilityState === 'visible'`; na Fase 3, de `appStateChange` com
`isActive === true`, emitido pelo `@capacitor/app`.

Assim a Fase 3 não altera a lógica de reconciliação, apenas a origem do evento. Como o
planejamento é idempotente, disparar em excesso não causa dano; o risco real está em disparar
de menos.

### D2.5 — Ação primária grande e única

O dashboard tem **um** botão dominante, dimensionado para toque com o polegar e uso apressado.
O caso de uso real é alguém de pé, com o celular numa mão, antes do café.

**Decisão de UX:** nada de menus de contexto ou gestos escondidos no caminho crítico. A ação
"marcar como tomado" é atingível em um toque a partir de qualquer estado do app.

### D2.6 — Acessibilidade e modo escuro desde o início

Contraste mínimo AA, alvos de toque de pelo menos 44px, e suporte a `prefers-color-scheme`.
Retrofit de acessibilidade é sempre mais caro do que fazer certo desde o começo, e o app será
consultado de madrugada e com sono.

## Entregáveis

- [ ] `db.ts` com schema versionado e `DexieStorageAdapter` implementando `StoragePort`
- [ ] Testes do adapter usando `fake-indexeddb`
- [ ] `DevNotificationAdapter` com flag de não-confiabilidade
- [ ] `composition.ts` com injeção condicional preparada para o Capacitor
- [ ] Store Zustand com estado de UI
- [ ] As quatro telas, responsivas e com modo escuro
- [ ] Seed de desenvolvimento: um remédio 21+7 já configurado para não recadastrar a cada reload
- [ ] Aviso visível de que notificações do navegador não são confiáveis

## Critério de pronto

É possível cadastrar um remédio 21+7, ver "Dia 1/21" no dashboard, marcar a dose como tomada,
recarregar a página e observar o estado preservado. Avançando o relógio do sistema em alguns
dias, o dashboard reflete o dia correto da cartela. O histórico mostra as doses passadas com
os status certos.
