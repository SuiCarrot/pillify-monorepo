# Fase 4 — Validação Real

## Objetivo

Descobrir se o produto funciona **na vida real**, com uma pessoa real, durante um ciclo
completo de 21+7 dias. As fases anteriores provaram que o software está correto; esta prova
que ele é útil.

Não há entrega de código planejada nesta fase, apenas correções que a validação exigir.

## Tecnologias

| Ferramenta | Papel |
| --- | --- |
| Gradle (via Android Studio) | Geração do APK de debug |
| ADB | Instalação por USB e leitura de logs |
| Aparelho Android físico | Ambiente de teste (o emulador não reproduz gestão de bateria de fabricante) |

Sem Play Store, sem conta de desenvolvedor, sem assinatura de release. Instalação por
sideload.

## Roteiro de instalação

1. `pnpm mobile:build` para gerar `dist/` e sincronizar com o projeto nativo.
2. Gerar o APK de debug pelo Android Studio ou por `./gradlew assembleDebug`.
3. Instalar via `adb install` com o aparelho em modo de depuração USB.
4. Conceder a permissão de notificação no primeiro onboarding.
5. **Adicionar o Pillify às exceções de otimização de bateria.** Este passo não é opcional em
   aparelhos Xiaomi, Samsung e Huawei.
6. Configurar o remédio real com a data de início do ciclo corrente.

## Roteiro de teste técnico

Executar antes de entregar o aparelho, para não gastar dias de validação descobrindo um bug
de plataforma.

| Cenário | Resultado esperado |
| --- | --- |
| App fechado (removido dos recentes), celular bloqueado | Notificação dispara no horário exato |
| Modo avião ativo | Notificação dispara normalmente |
| Aparelho reiniciado antes do horário | Alarme sobrevive ao reboot ([D3.5](fase-3-capacitor-android.md#d35--reagendamento-após-reboot-deve-ser-verificado-não-assumido)) |
| Toque em "Tomei" com o app fechado | Dose registrada, escalonamento restante cancelado |
| Toque em "Adiar 10 min" | Novo alerta em 10 minutos, dose segue pendente |
| Notificação ignorada | Reincidências em +10, +20 e +30 min, sem empilhar na bandeja |
| App sem abrir por 3 dias | Dia da cartela correto ao reabrir, sem duplicar doses |
| App volta do segundo plano sem ter sido encerrado | `appStateChange` dispara o replanejamento e o horizonte é reconstruído ([ADR-004](00-arquitetura.md#gatilho-do-replanejamento)) |
| Aparelho sem carga durante a noite | Alarme dispara ao religar ou no horário, sem perder o registro |
| Troca de fuso horário no aparelho | Horário de parede preservado (ADR-006) |
| App em segundo plano por uma semana | IndexedDB íntegro, nada despejado ([D2.1](fase-2-ui-navegador.md#d21--dexieindexeddb-e-não-preferences-nem-sqlite-nativo)) |

## Roteiro de validação de produto

Duração: um ciclo completo, 28 dias.

### O que medir

| Métrica | Como obter | O que indica |
| --- | --- | --- |
| Aderência | Doses tomadas ÷ doses previstas | Eficácia geral do produto |
| Atraso médio | Diferença entre `takenAt` e `scheduledFor` | Se o lembrete gera ação imediata |
| Tentativa de resolução | Em qual das 4 tentativas a dose foi confirmada | Se o escalonamento é necessário ou excessivo |
| Doses esquecidas | Contagem de `missed` | Falha real do produto |
| Aberturas do app | Log local | Se o app é consultado ou apenas reativo |

O `DoseLog` já contém tudo o que é preciso. Uma exportação simples em JSON pelas
configurações basta para a análise — não vale construir tela de analytics nesta fase.

### O que perguntar

Estas respostas valem mais que as métricas, e devem ser colhidas na primeira semana e no fim
do ciclo:

- A notificação incomodou a ponto de dar vontade de desligar?
- O escalonamento de 4 tentativas foi útil ou irritante?
- Em algum momento a notificação passou despercebida?
- O botão "Tomei" na notificação foi usado, ou você preferiu abrir o app?
- A cartela visual ajuda, ou o que importa é só "tomei hoje?"
- Faltou alguma coisa óbvia?

## Decisões

### D4.1 — Um único usuário, um ciclo completo, antes de qualquer feature nova

**Decisão:** nenhuma funcionalidade nova entra durante a Fase 4, exceto correção de bug que
impeça a validação.

Adicionar features durante a validação contamina o resultado: fica impossível dizer o que
funcionou. Ideias que surgirem viram backlog para a Fase 5.

### D4.2 — APK de debug, sem assinatura de release

Não há distribuição, apenas um aparelho conhecido. Configurar keystore, build de release e
ofuscação seria trabalho a serviço de nada nesta fase.

**Consequência:** o APK de debug é maior e mais lento. Irrelevante para o que estamos medindo.

### D4.3 — Instrumentação local, sem telemetria remota

**Decisão:** nenhum SDK de analytics. Os dados já estão no `DoseLog`, o usuário é uma pessoa
conhecida, e o app trata de informação de saúde. Enviar isso para terceiros seria
desproporcional ao que se ganha.

Isso também mantém o [ADR-007](00-arquitetura.md#adr-007--sem-backend-no-mvp) intacto: nenhum
backend no MVP.

### D4.4 — Critério de decisão definido antes de começar

Para não racionalizar o resultado depois, os limiares ficam registrados agora:

- **Seguir para a Fase 5:** aderência acima de 95% e nenhum relato de "não vi a notificação".
- **Iterar dentro da Fase 4:** aderência entre 85% e 95%, ou reclamação sobre a insistência
  do escalonamento. Ajustar a `ReminderPolicy` e rodar mais um ciclo.
- **Repensar a abordagem:** aderência abaixo de 85%, ou notificações perdidas por causa de
  plataforma. Nesse caso o problema é de canal, não de produto, e as alternativas do
  [ADR-001](00-arquitetura.md#adr-001--validação-em-android-nativo-e-não-em-pwa) voltam à
  mesa.

## Entregáveis

- [ ] APK de debug instalado no aparelho de validação
- [ ] Exceção de otimização de bateria configurada e documentada
- [ ] Roteiro de teste técnico integralmente executado e registrado
- [ ] Exportação de `DoseLog` em JSON disponível nas configurações
- [ ] Ciclo de 28 dias concluído
- [ ] Relatório curto com métricas, respostas da entrevista e a decisão conforme D4.4

## Critério de pronto

Um ciclo de 28 dias concluído com dados coletados e uma decisão explícita tomada segundo os
limiares de D4.4, com o backlog da Fase 5 alimentado pelo que a validação revelou.
