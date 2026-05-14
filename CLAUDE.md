# CLAUDE.md — papelito-web (frontend Next.js)

Frontend headless do marketplace Papelito. Consome o WordPress (`../papelito-wordpress`) via WPGraphQL para dados/auth e via REST (`/wp-json/papelito/v1/*`) para fluxos custom (cadastro, OAuth Google, CEP).

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** (sem `tailwind.config`; configuração CSS-first)
- **NextAuth v4** — JWT-only (sem adapter de banco). WordPress é a única fonte de verdade.
- **Apollo Client v4** — adiciona `Authorization: Bearer <session.accessToken>` em todas as queries GraphQL
- **Zustand** — estado global leve (carrinho)
- **SWR** — fetching incremental
- **Embla** — carrosséis

## Layout do repositório

```
app/                       App Router. Cada rota = pasta com page.tsx
  (app)/                   Layout autenticado/principal
  api/auth/[...nextauth]/  Catch-all do NextAuth
  api/auth/register/       Proxy custom → WP /papelito/v1/auth/register
  api/profile/             Endpoints relacionados ao perfil
  cadastro/                Fluxo público de cadastro (etapa-1 + etapa-2)
  entrar/                  Login
  perfil/                  Área autenticada
middleware.ts              Auth + guard de profileComplete
src/
  components/              UI (atoms / molecules / organisms / pages-layout)
    auth/                  Atomic design para auth/cadastro
    ui/                    Componentes compartilhados de produto/loja
    layout/<rota>/         Composições por página (mantém top-level limpo)
  features/                Lógica de domínio por bounded context
    auth/ cart/ catalog/ checkout/ coupons/ orders/ profile/ revendedor/
  hooks/                   Hooks reutilizáveis (use-auth-session, etc.)
  lib/
    auth.ts                authOptions do NextAuth (providers + callbacks)
    apollo/                Apollo Client configurado para WPGraphQL
    server/                Código server-only (env, wp-rest helper)
    client/                Helpers client-only
    format-currency.ts
  types/
    next-auth.d.ts         Augments de Session/JWT/User
mock/                      Dados mockados pra UI sem WP rodando (USE_MOCK_DATA=true)
docs/                      Arquitetura, onboarding, runbooks
```

## Componentes padrão

**Sempre prefira reusar os componentes abaixo a estilizar `<input>`/`<select>`/`<button>` na página.** Eles encapsulam tipografia, espaçamento, foco e tema do sistema.

### `src/components/auth/` — formulários (login, cadastro, recuperar senha)

Atomic design. Variante "dark" (fundo `bg-brand-dark`).

| Camada | Componente | Uso |
|---|---|---|
| atom | `AuthFieldLabel` | Label uppercase tracking-widest |
| atom | `AuthInput` | `<input>` estilizado (forwarda todas as props HTML) |
| atom | `AuthSelect` | `<select>` estilizado (mesma estética do input) |
| atom | `AuthIconButton` | Botão circular com ícone (mostrar/ocultar senha, etc.) |
| atom | `AuthSocialButton` | Botão "Entrar com Google/etc.", já chama `signIn(provider)` |
| atom | `AuthSubmitButton` | Botão pill amarelo (CTA principal) com `icon` opcional |
| atom | icones em `auth-icons.tsx` | `ArrowRightIcon`, `EyeIcon`, `EyeOffIcon` |
| molecule | `AuthTextField` | Label + AuthInput. Suporta `type`, `defaultValue`, `required`, `autoComplete` |
| molecule | `AuthSelectField` | Label + AuthSelect. Children = `<option>` |
| molecule | `AuthPasswordField` | Label + AuthInput type=password + toggle de visibilidade |
| molecule | `AuthSocialDivider` | Separador "ou continue com" |
| molecule | `AuthLoginHeader` | Título + subtítulo padrão de tela de auth |
| organism | `AuthLoginForm` | Form completo de login (referência canônica de uso) |
| organism | `AuthWelcomePanel` | Painel amarelo lateral com benefícios |

**Padrão de formulário:** uncontrolled + `FormData` no submit (ver [auth-login-form.tsx](src/components/auth/organisms/auth-login-form.tsx)). Estado controlado só quando há lógica visual (toggle de senha, checkbox de termos).

### `src/components/ui/` — UI compartilhado

Componentes neutros usados em várias páginas/contextos:

- `ImageWithSkeleton` — Image do Next com placeholder
- `ProductImageFallback` — fallback quando `<Image>` falha
- `SectionHeader` — título de seção homepage
- `StarRating` — estrelas de avaliação
- `ProductPrice` — formatação de preço (ver `format-currency.ts`)
- `AddToCartButton` — CTA de adicionar ao carrinho (já fala com `cart` feature)
- `Tag` — chip/badge reusável
- `PageContainer` — wrapper com max-width consistente
- `icons/`, `badges/` — re-exports

### `src/components/layout/<rota>/` — composições por página

Por convenção, componentes específicos de uma página vivem em `layout/<nome-da-rota>/` e seguem atomic design interno (`atoms/`, `molecules/`, `organisms/`). Não importe daqui em outras páginas; promova pra `ui/` se virar reutilizável.

## Auth — fluxo

1. **Credenciais** (`/entrar`) → NextAuth `Credentials` provider chama mutation GraphQL `login` no WP → `wp_authenticate()` em `wp_users` → JWT em [src/lib/auth.ts](src/lib/auth.ts)
2. **Google OAuth** → NextAuth Google provider → `signIn` callback troca `id_token` por par WP via `POST /wp-json/papelito/v1/auth/google` → cria/encontra `wp_users`, retorna o mesmo JWT
3. **Cadastro** (`/cadastro` → `/cadastro/etapa-2`) → `/api/auth/register` (proxy) → WP `POST /papelito/v1/auth/register` → cria `wp_users` + meta → auto-`signIn('credentials')`

Token e refresh do WP ficam na sessão JWT do NextAuth (`session.accessToken`, `session.refreshToken`). Apollo lê `session.accessToken` automaticamente.

`session.profileComplete = false` indica usuário Google sem perfil preenchido (CNPJ/CEP/etc. faltando) — middleware redireciona para `/perfil/completar` em rotas protegidas.

## Variáveis de ambiente (`.env.local`)

| Var | Obrigatória | Descrição |
|---|---|---|
| `NEXTAUTH_SECRET` | sim | Assina cookies de sessão NextAuth |
| `NEXTAUTH_URL` | sim | URL pública do app (ex: `http://localhost:3000`) |
| `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT` | recomendado | Default: `http://localhost:8080/graphql` |
| `NEXT_PUBLIC_WP_REST_BASE` | recomendado | Default: `http://localhost:8080/wp-json` |
| `GOOGLE_CLIENT_ID` | opcional | Habilita botão Google. Mesmo valor deve estar no WP como `PAPELITO_GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` | opcional | Par com o id acima |
| `USE_MOCK_DATA` | opcional | `true` força mocks (`mock/`) sem chamar WP |

## Convenções

- **Sem `barrel exports` profundos**. Cada `index.ts` re-exporta o conteúdo da própria pasta.
- **Server-only** isolado em `src/lib/server/*` com `import "server-only"` no topo.
- **Sem comentários em código** salvo justificar workaround/invariante (regra do projeto).
- **Tailwind only** para estilização. Sem CSS Modules, sem styled-components.
- **TypeScript strict**. Nada de `any`; prefira `unknown` + narrowing.
- **Server Components** por padrão. Marque `"use client"` só quando necessário (estado, eventos, browser APIs).
- **NextAuth v4 patterns**: `authorize`, `signIn`, `jwt`, `session` callbacks. JWT-only, sem DB adapter.

## Comandos comuns

```bash
nvm use
bun install
bun run dev                     # next dev
bun run build                   # next build
bun run lint                    # eslint
./node_modules/.bin/tsc --noEmit   # typecheck
npm ci                          # CI / validacao do package-lock.json
```

- Padrao local: Bun para instalar dependencias e rodar scripts.
- CI: Node 24 + `npm ci`, entao `package-lock.json` deve permanecer sincronizado com `package.json`.

## Pontos de integração com `../papelito-wordpress`

- GraphQL: `/graphql` (mutations `login`, `refreshJwtAuthToken`; queries `customer`, produtos, pedidos)
- REST custom: `/wp-json/papelito/v1/*` — registrado em `plugin_papelito/includes/auth_endpoints.php` e `rest_api.php`
- CORS: gerenciado pelo mu-plugin `papelito-cors.php` no WP. Origin do front entra em `PAPELITO_ALLOWED_ORIGINS`.
