# Fase 0 — Scaffold

## Objetivo

Deixar o monorepo pronto para receber código: workspace configurado, toolchain instalada,
lint e testes rodando em pipeline local. Nenhuma regra de negócio nesta fase.

A fase termina quando `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam num
projeto ainda vazio.

## Tecnologias

| Ferramenta | Versão | Papel |
| --- | --- | --- |
| Node.js | 24.14.0 | Runtime de build (já instalado na máquina) |
| pnpm | 11.9.0 | Workspaces e catalog de versões (já instalado) |
| TypeScript | 7.0.2 | Linguagem e type-check |
| Vite | 8.1.5 | Dev server e bundler |
| React | 19.2.8 | UI |
| `@vitejs/plugin-react` | 6.0.4 | Integração React no Vite |
| Tailwind CSS | 4.3.3 | Estilo, via `@tailwindcss/vite` |
| Vitest | 4.1.10 | Testes unitários |
| ESLint | 10.8.0 | Lint (flat config) |
| typescript-eslint | 8.65.0 | Regras TypeScript |
| Prettier | 3.9.6 | Formatação |

## Arquitetura

```
pillify-monorepo/
├─ .npmrc                    # node-linker=hoisted
├─ pnpm-workspace.yaml       # packages + catalog de versões
├─ package.json              # scripts agregadores
├─ tsconfig.base.json        # compilerOptions compartilhados
├─ eslint.config.js          # flat config, raiz única
├─ .prettierrc
├─ docs/
├─ packages/
│  └─ core/
│     ├─ package.json        # name: @pillify/core, exports apontando para src
│     ├─ tsconfig.json
│     └─ src/index.ts
└─ apps/
   └─ web/
      ├─ package.json        # depende de @pillify/core via workspace:*
      ├─ tsconfig.json
      ├─ vite.config.ts
      ├─ index.html
      └─ src/main.tsx
```

### Workspace e catalog

O `pnpm-workspace.yaml` declara os pacotes e centraliza as versões num **catalog**, para que
`packages/core` e `apps/web` nunca divirjam de versão:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

catalog:
  typescript: ^7.0.2
  vitest: ^4.1.10
  react: ^19.2.8
  react-dom: ^19.2.8
```

Cada `package.json` referencia `"react": "catalog:"` em vez de repetir o número.

### O `.npmrc` não é opcional

```
node-linker=hoisted
```

O Gradle do Android resolve plugins nativos do Capacitor por **caminho físico** dentro de
`node_modules`, e o layout padrão do pnpm (symlinks para um store global) quebra essa
resolução. O sintoma aparece só na Fase 3, na forma de erro de build do Gradle difícil de
associar à causa.

Precisa existir **antes do primeiro `pnpm install`**. Adicionar depois exige apagar
`node_modules` e reinstalar.

### Regras de lint que protegem a arquitetura

A [regra de dependência](00-arquitetura.md#regra-de-dependência) e a pureza do domínio só
sobrevivem se forem verificadas automaticamente. No
`eslint.config.js`, um bloco específico para `packages/core/**`:

- `no-restricted-imports` bloqueando `@capacitor/*`, `dexie`, `react` e qualquer caminho
  relativo que suba para fora do pacote.
- `no-restricted-globals` bloqueando `window`, `document`, `localStorage` e `navigator`.
- `no-restricted-syntax` bloqueando `new Date()` sem argumento e `Date.now()`, que devem
  passar pelo `ClockPort`.

Sem isso, a primeira pressa de prazo fura a arquitetura e ninguém percebe até a Fase 3.

## Decisões

### D0.1 — TypeScript 7 (compilador nativo)

O `latest` do TypeScript hoje é **7.0.2**, a reescrita em Go, com type-check muito mais
rápido. O typescript-eslint 8.65.0 é a versão corrente e acompanha essa linha.

**Decisão:** adotar TypeScript 7.

**Risco aceito:** sendo uma major recente com compilador reescrito, pode haver aresta em
plugin de ecossistema. **Mitigação:** a versão está no catalog do pnpm, então o rollback para
a linha 6.x é uma única linha alterada em um único arquivo. Se aparecer incompatibilidade na
Fase 0, faz-se o downgrade ali mesmo, antes de existir código.

### D0.2 — Tailwind v4 via plugin do Vite, sem PostCSS

O Tailwind 4 tem integração nativa com Vite através de `@tailwindcss/vite`, dispensando
`postcss.config.js` e `tailwind.config.js`. A configuração de tema vira CSS, com `@theme`.

**Decisão:** usar `@tailwindcss/vite`. Menos arquivos de configuração e build mais rápido.

**Alternativa descartada:** pipeline PostCSS clássico. Só faria sentido se precisássemos de
outros plugins PostCSS, o que não é o caso.

### D0.3 — Vitest em vez de Jest

`packages/core` é TypeScript puro e o app já usa Vite. O Vitest compartilha a mesma
resolução de módulos e o mesmo transformador, então não existe uma segunda configuração de
build só para testes.

**Decisão:** Vitest 4, com dois projetos no workspace: `core` rodando em ambiente `node`
(sem DOM, para garantir que o domínio realmente não depende de navegador) e `web` rodando em
`jsdom`.

Rodar os testes do core em ambiente `node` é proposital: se alguém introduzir um
`document.querySelector` no domínio, o teste quebra antes do lint reclamar.

### D0.4 — ESLint flat config única na raiz

**Decisão:** um `eslint.config.js` na raiz, com blocos por caminho, em vez de um arquivo de
configuração por pacote. Num monorepo de dois pacotes, configuração distribuída custa mais
manutenção do que entrega.

### D0.5 — Aprovação explícita de scripts de instalação

O pnpm 10+ não executa scripts de `postinstall` de dependências sem aprovação explícita via
`onlyBuiltDependencies`. Isso é uma proteção contra supply chain attack e vamos mantê-la
ligada.

**Consequência prática:** na Fase 3, os pacotes do Capacitor que precisarem de postinstall
terão que ser adicionados a essa lista conscientemente. Isso é desejável, não um atrito.

## Entregáveis

- [ ] `.npmrc` com `node-linker=hoisted`
- [ ] `pnpm-workspace.yaml` com packages e catalog
- [ ] `tsconfig.base.json` em modo `strict`, com `verbatimModuleSyntax` e `isolatedModules`
- [ ] `packages/core` com `package.json`, `tsconfig.json` e `src/index.ts` vazio
- [ ] `apps/web` com Vite, React, Tailwind e um "hello world" estilizado
- [ ] `eslint.config.js` com as restrições de arquitetura descritas acima
- [ ] `.prettierrc` e `.editorconfig`
- [ ] `.gitignore` cobrindo `node_modules`, `dist`, e mais tarde `android/`
- [ ] Scripts na raiz: `dev`, `build`, `test`, `lint`, `typecheck`, `format`
- [ ] `README.md` da raiz atualizado com instruções de setup

## Critério de pronto

Numa máquina limpa, `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
passa sem erro nem warning. `pnpm dev` abre a página estilizada com Tailwind. Um `import`
proibido colocado de propósito em `packages/core` faz o lint falhar.
