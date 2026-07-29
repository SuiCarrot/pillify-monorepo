# Pillify

App de lembrete de remédios / anticoncepcional, offline-first, com validação em Android via
Capacitor. Documentação em [`docs/`](docs/README.md).

## Setup

Requisitos: Node.js 24+ e [pnpm](https://pnpm.io) 11+.

```bash
pnpm install
pnpm dev
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe o Vite em `apps/web` |
| `pnpm build` | Build de produção do web |
| `pnpm test` | Vitest em todos os pacotes |
| `pnpm lint` | ESLint (flat config na raiz) |
| `pnpm typecheck` | `tsc --noEmit` em todos os pacotes |
| `pnpm format` | Prettier write |

## Estrutura

```
apps/web        # Vite + React + Tailwind (UI)
packages/core   # Domínio TypeScript puro (Fase 1)
docs/           # Arquitetura e planos por fase
```
