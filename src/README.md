# Arquitetura Base (`src`)

Estrutura recomendada para escalar o projeto Next.js com App Router:

- `components/`: componentes compartilhados e agnósticos de domínio.
- `hooks/`: hooks reutilizáveis de UI/comportamento.
- `lib/server/`: utilitários server-side (`server-only`, integração com APIs, envs).
- `lib/client/`: utilitários exclusivos do browser.
- `features/`: módulos por domínio de negócio (`auth`, `catalog`, etc).

As rotas continuam no diretório `app/` para manter colocalização do App Router.
