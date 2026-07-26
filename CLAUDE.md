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
proxy.ts                   Middleware (Next 16): auth + gate de onboarding B2B + guard de admin
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
3. **Cadastro** (`/cadastro` → `/cadastro/etapa-2`) → `/api/auth/register` (proxy) → WP `POST /papelito/v1/auth/register` → cria `wp_users` + meta com status pendente → front redireciona para `/confirmar-email` → `POST /api/auth/verify-email` libera o login por senha

Token e refresh do WP ficam na sessão JWT do NextAuth (`session.accessToken`, `session.refreshToken`). Apollo lê `session.accessToken` automaticamente.

### Gate de onboarding B2B

**Invariante: a autoridade sobre "cadastro incompleto" é `session.b2b.onboardingStatus`, nunca `profileComplete`.**
`papelito_profile_complete` é usermeta com dois escritores e vira `'1'` no verify-email mesmo quando
o onboarding B2B falhou; usá-lo para rotear quica usuários legados já completos.

O gate vive **exclusivamente** em [proxy.ts](proxy.ts): quando `token.b2b.onboardingStatus === "incomplete"`,
as rotas do matcher redirecionam para `/cadastro/completar?callbackUrl=<destino>`. A própria rota de
onboarding é isenta (quebra-loop) e entra no matcher só para o `authorized` do `withAuth` mandar
anônimo para `/entrar`. Sem contexto B2B o gate abre (fail-open) — a compra segue barrada em
[require-checkout-customer.ts](src/features/checkout/server/require-checkout-customer.ts).

Não reintroduza um efeito de cliente para isso: o antigo `B2bOnboardingRedirect` rodava depois do
render, em todas as rotas (inclusive públicas), mandava para `/perfil/empresa` e era burlável.

A tela é [app/cadastro/completar](app/cadastro/completar) — reusa os componentes de `auth/`, recebe
e-mail/nome do Google (e-mail `readOnly`) e coleta telefone, CPF, nascimento, CEP e CNPJ. CPF e data
de nascimento ficam cifrados no WP e **não** voltam em claro: o contexto expõe só `cpfLast4` e
`hasBirthDate` para retomar o preenchimento. Concluir chama `update({ refreshB2b: true })` para o
token sair de `incomplete`; cancelar encerra a sessão sem marcar o cadastro como concluído.

Login por credenciais pode retornar `papelito_email_not_verified`; a UI deve orientar reenvio para `/confirmar-email?email=...`.

## Performance — home, catálogo e disponibilidade regional

Contexto completo em [docs/performance/home-produtos-loading-fix.md](docs/performance/home-produtos-loading-fix.md). Invariantes que qualquer agente deve preservar:

- **Home pública deve continuar cacheável/ISR.** Não reintroduza `getServerSession`, `cookies()`, `headers()` ou fetch `no-store` em `app/(public)/page.tsx`. Seller-specific UI deve ser escondida no cliente com `SellerHidden`.
- **Catálogo público renderiza todos os produtos.** `/produtos`, `/colecoes`, `/kits`, `/novidades`, `/premium` e `/promocoes` não devem bloquear SSR em CEP, vendor ativo ou cobertura.
- **Disponibilidade regional é progressiva no cliente.** Use `ProductAvailabilityProvider` + `useProductAvailability`; a API interna é `GET /api/catalog/availability?productIds=...`.
- **Produto sem estoque/cobertura no vendor da região não some do catálogo.** Ele fica com opacidade reduzida, mostra tooltip em hover/focus e o `AddToCartButton` recebe `disabledReason`.
- **Fonte da região:** apenas CEP salvo na conta do usuário logado. Usuário anônimo ou sem CEP não chama availability e vê catálogo normal.
- **Cache esperado:** disponibilidade tem cache server-side por `accountId + cep + activeVendorId + productIdsHash` por 5 min e cache client em `localStorage`/SWR por 5 min.
- **Query GraphQL de listagem é leve.** `PRODUCTS_LIST_QUERY` não deve voltar a carregar campos de detalhe como descrição completa, galeria e SKU; esses pertencem à query de detalhe.

## Pagamento / Checkout (Pagar.me) — em implementação

Plano completo em [../pagarme-integration-plan.MD](../pagarme-integration-plan.MD). Pontos que afetam o front:

- **Pagamento direto ao vendor, sem split de receita.** O front não calcula nem exibe comissão de marketplace; o vendor recebe 100% (produtos + frete) e arca com as taxas. O backend usa `split` PSP com um único recebedor dentro de `payments[]` apenas para roteamento integral.
- **Cartão é tokenizado no browser** (`POST /tokens?appId=<NEXT_PUBLIC_PAGARME_PUBLIC_KEY>`); só o `token_id` trafega para o backend — PCI fora de escopo.
- O botão "Finalizar" chama `placeOrder()` e envia token/cartão, PIX ou boleto para o backend.
- Telas de resultado: PIX (QR + copia-e-cola + polling), boleto (linha digitável), cartão (sucesso/falha síncrono).
- Onboarding do vendor: form de KYC/dados bancários no painel do vendor → cria o recebedor Pagar.me (vendor só vende com recebedor `active`).

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
| `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` | quando pagamento ligado | `pk_test`/`pk_live` — só tokeniza cartão no browser (`/tokens`); nunca envia PAN ao backend |
| `PAPELITO_FRONT_PROXY_TOKEN` | recomendado em prod | Segredo server-side compartilhado com o WordPress para chamadas internas do proxy Next; permite rate limit de frete por comprador sem expor confiança em headers públicos |

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
