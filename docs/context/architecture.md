# Arquitetura do frontend

## Stack

| Peça | Versão / observação |
|---|---|
| Next.js | 16, App Router |
| React | 19 |
| TypeScript | 5, strict |
| Tailwind CSS | 4 — **sem `tailwind.config`**, configuração CSS-first em `app/globals.css` |
| NextAuth | v4, **JWT-only**, sem adapter de banco |
| Apollo Client | v4 contra WPGraphQL; anexa `Authorization: Bearer <session.accessToken>` |
| Zustand | estado global leve (carrinho, checkout, notificações) |
| SWR | fetching incremental e polling |
| Embla | carrosséis |
| Vitest + MSW | testes |

O WordPress é a única fonte de verdade. O frontend não tem banco.

## `app/` — rotas

```
app/
  (public)/     rotas públicas e de compra: produtos, colecoes, kits, novidades, premium,
                promocoes, carrinho, checkout, revendedor, convite, pdv, sobre, termos,
                privacidade, confirmar-email-faturamento, vendor
  (app)/        área autenticada: perfil, dashboard
  (vendor)/     painel do vendor (guard de role seller no layout)
  admin/        painel administrativo (guard de admin em proxy.ts)
  api/          proxies server-side e rotas internas
  cadastro/  entrar/  pos-login/  confirmar-email/  recuperar-senha/  redefinir-senha/
  _verify-stepper/    rota interna de verificação (prefixo _ = não roteável publicamente)
  layout.tsx  error.tsx  loading.tsx  not-found.tsx  globals.css
```

Pontos que a lista de pastas não conta:

- Os grupos `(public)`, `(app)` e `(vendor)` **não cobrem todas as rotas**. `cadastro/`, `entrar/`, `pos-login/`, `confirmar-email/`, `recuperar-senha/`, `redefinir-senha/` e `admin/` ficam no topo, fora de grupo, porque têm layout próprio ou nenhum.
- **Lógica de domínio não mora em `app/`.** As rotas compõem; a lógica vem de `src/features` e `src/lib`.
- `_verify-stepper` usa o prefixo `_` do App Router para existir no repositório sem virar rota pública. Mesma técnica vale para qualquer utilitário de rota.
- O gate de autenticação, o gate de onboarding B2B e o guard de admin vivem todos em **`proxy.ts`** (o middleware do Next 16, na raiz do repositório) — não em layouts nem em efeitos de cliente.

### `app/api/` — dois tipos de rota

**Proxies server-side.** A maior parte de `app/api/*` existe para manter o JWT do WordPress no servidor: a rota recebe a chamada do browser com a sessão, adiciona `Authorization: Bearer`, repassa e devolve o resultado. Isso vale para `admin/*`, `company/*`, `vendor/*`, `profile/*`, `notifications/*`, `messages/*`, `coupons/*`, `legacy-migration/*`, `checkout/place-order`, `auth/register` e afins.

Regras que valem para todo proxy:

- repassa `Idempotency-Key` quando existe;
- **autoriza uploads no servidor e envia o arquivo diretamente ao WordPress** — arquivos não atravessam Functions da Vercel; ver [`../../../docs/file-uploads.md`](../../../docs/file-uploads.md);
- preserva status e mensagem de erro do WordPress em vez de reescrevê-los;
- não loga corpo de requisição com dado sensível.

**Rotas com lógica própria.** Poucas, e todas com razão registrada:

| Rota | Por que existe |
|---|---|
| `api/catalog/availability` | agrega e cacheia disponibilidade por `accountId + cep + activeVendorId + productIdsHash` |
| `api/catalog` | resolve o PDF do catálogo com validação e fallback |
| `api/cart/stock` | consulta em lote e normaliza a resposta de estoque para reconciliação do carrinho |
| `api/cart/resolve-vendor` | resolve vendor na adição de item |
| `api/admin/catalog-pdf` | valida o upload antes de repassar |

## `src/` — código

```
src/
  components/    UI compartilhada
    auth/        atomic design dos formulários de auth (variante escura)
    ui/          componentes neutros de produto/loja
    layout/      composições por página: layout/<rota>/
    active-vendor/ providers/ shared/
  features/      um módulo por domínio de negócio
  hooks/         hooks reutilizáveis (use-auth-session, ...)
  lib/           auth.ts, apollo/, server/, client/, format-currency.ts, site-logos.ts, validation/
  constants/  types/  utils/
```

A distinção que importa:

- **`components/`** = compartilhado e **agnóstico de domínio**. Se precisa conhecer regra de negócio, não é `components/`.
- **`features/`** = módulo por domínio. Cada um pode ter `types/`, `services/`, `hooks/`, `store/`, `utils/`, `client/`, `server/`.
- **`lib/server/`** = `import "server-only"` no topo, envs e integração; **`lib/client/`** = exclusivo de browser.
- **`components/layout/<rota>/`** = composições específicas de uma página, com atomic design interno. **Não importe de `layout/<rota>/` em outra página** — se virou reutilizável, promova para `ui/`.

Domínios em `features/`:

```
active-vendor  auth  cart  catalog  checkout  company  coupons  favorites  messages
notifications  orders  profile  revendedor  vendor-coverage  vendor-dashboard
vendor-orders  vendor-recipient  vendor-settings  vendor-stock
```

## Componentes que devem ser reutilizados

**Prefira reutilizar a estilizar `<input>` / `<select>` / `<button>` na página.** Eles encapsulam tipografia, espaçamento, foco e tema.

### `src/components/auth/` — formulários

Atomic design, variante escura (fundo `bg-brand-dark`). Usado em login, cadastro, recuperação de senha e no onboarding empresarial.

| Camada | Componentes |
|---|---|
| atoms | `AuthFieldLabel`, `AuthInput`, `AuthSelect`, `AuthIconButton`, `AuthSocialButton`, `AuthSubmitButton`, ícones em `auth-icons.tsx` |
| molecules | `AuthTextField`, `AuthSelectField`, `AuthPasswordField`, `AuthSocialDivider`, `AuthLoginHeader` |
| organisms | `AuthLoginForm` (referência canônica de uso), `AuthWelcomePanel` |

**Padrão de formulário: uncontrolled + `FormData` no submit** (ver `src/components/auth/organisms/auth-login-form.tsx`). Estado controlado só quando existe lógica visual — toggle de senha, checkbox de termos.

### `src/components/ui/`

`AddToCartButton` (integrado à feature `cart`, aceita `disabledReason`), `BaseModal`, `ImageWithSkeleton`, `ProductImageFallback`, `ProductPrice`, `SectionHeader`, `StarRating`, `Tag`, `PageContainer`, `FavoriteToggleButton`, `LogoSpinnerLoader`, `MenuUnderline`, `NavigationLoader`, `ToastCloseButton`, além de `icons/` e `badges/`.

`BaseModal` fornece **apenas a casca**: portal, `role="dialog"`/`aria-modal`, ESC, overlay, trava de scroll, foco preso e retorno de foco. **Não tem header nem footer** — cada uso monta os seus. `vendor-cancel-shipment-modal.tsx` é o precedente de uso; `vendor-reject-modal.tsx` é o precedente da paleta de perigo (`#b91c1c`, hover `#991b1b`) mas monta o próprio diálogo.

## Convenções

- **Sem barrel exports profundos.** Cada `index.ts` re-exporta apenas o conteúdo da própria pasta.
- Server Components por padrão. `"use client"` só com estado, evento ou API de browser.
- Server-only isolado em `src/lib/server/*` com `import "server-only"` na primeira linha.
- **Sem comentários em código** salvo para justificar workaround ou invariante.
- Tailwind apenas. Sem CSS Modules, sem styled-components.
- TypeScript strict; `unknown` + narrowing em vez de `any`.
- NextAuth v4: callbacks `authorize`, `signIn`, `jwt`, `session`. JWT-only.
- Bun local, `npm ci` no CI → `bun.lock` e `package-lock.json` andam juntos. Ver [`../../../docs/development.md`](../../../docs/development.md#toolchain-híbrido--a-armadilha-do-lockfile).

## Variáveis de ambiente (`.env.local`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXTAUTH_SECRET` | sim | assina os cookies de sessão |
| `NEXTAUTH_URL` | sim | URL pública do app |
| `APP_URL` | opcional | base canônica desta implantação, repassada ao WordPress para montar links de e-mail. Só é necessária para Preview e Production emitirem **domínios diferentes** — e então precisa de escopo separado na Vercel. Sem ela, `getAppBaseUrl()` usa o domínio que a Vercel injeta e, por último, `NEXTAUTH_URL` |
| `NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT` | recomendado | default `http://localhost:8080/graphql` |
| `NEXT_PUBLIC_WP_REST_BASE` | recomendado | default `http://localhost:8080/wp-json` |
| `GOOGLE_CLIENT_ID` | opcional | habilita o botão Google; **mesmo valor** de `PAPELITO_GOOGLE_CLIENT_ID` no WP |
| `GOOGLE_CLIENT_SECRET` | opcional | par do id acima |
| `USE_MOCK_DATA` | opcional | `true` usa `mock/` sem chamar o WordPress |
| `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` | quando pagamento ligado | tokeniza cartão no browser; **nunca** trafega PAN ao backend |
| `PAPELITO_FRONT_PROXY_TOKEN` | recomendado em produção | segredo compartilhado com o WordPress para chamadas internas do proxy; permite rate limit de frete por comprador sem confiar em header público |

**Em produção, `NEXTAUTH_URL` deve ser `https://marketplace.papelito.com`.** O domínio `papelito-web.vercel.app` pode continuar acessível como fallback, mas nunca como `NEXTAUTH_URL`: **sessões de login não são compartilhadas entre os dois domínios**.

### `APP_URL` e a base dos links de e-mail

`getAppBaseUrl()` (`src/lib/server/app-url.ts`) resolve, nesta ordem:

1. `APP_URL` / `NEXT_PUBLIC_APP_URL`;
2. domínio que a Vercel injeta sozinha — `VERCEL_PROJECT_PRODUCTION_URL` em production, `VERCEL_URL` em preview;
3. `NEXTAUTH_URL`;
4. `http://localhost:3000`, **somente** fora de `VERCEL_ENV`.

Em `production`/`preview` sem nada resolvido a função **lança**: um erro no log é melhor que e-mail com link `localhost`.

**`APP_URL` é opcional.** Ela existe para um caso específico: fazer Preview e Production emitirem **domínios diferentes**. Se você não precisa disso, os passos 2 e 3 já entregam um domínio que atende de verdade.

**Por que `NEXTAUTH_URL` é fallback e não a fonte preferida.** O mesmo valor também define o callback do OAuth e o host do cookie de sessão. Mudá-la para acertar um link de e-mail **desloga usuário** e exige o domínio novo nas redirect URIs do Google — dois efeitos que `APP_URL` não tem. Além disso ela está hoje como *All Environments*, então sozinha não distingue Preview de Production. Como último recurso, porém, é um domínio válido, e é o que evita exigir variável nova só para corrigir o link.

Base de loopback é descartada quando `VERCEL_ENV` é `production`/`preview`, em qualquer posição da cadeia — a mesma guarda existe no WordPress (`papelito_frontend_is_local_base()`). São duas camadas de propósito: aqui o header nem é enviado; lá o valor é recusado mesmo se chegar.

O valor sai daqui em `X-Papelito-Frontend-Base` (só em mutações, via `proxyCompanyRequest`) e o WordPress o valida contra `PAPELITO_ALLOWED_ORIGINS` antes de usar. Contrato completo em [integration-contracts.md](../../../docs/integration-contracts.md#base-pública-dos-links-de-e-mail).

## Dívida conhecida

Itens reais, já identificados, ainda abertos:

**Acessibilidade**

- `StarRating` não tem `aria-label` descritivo (algo como "4,5 de 5 estrelas, 120 avaliações").
- `PromoMarquee` anima automaticamente sem mecanismo de pausa, o que viola **WCAG 2.2.2**, e usa `key={i}`.

**Números mágicos e layout**

- `CategoryNavItem` posiciona por valores absolutos (`top-[14px] left-[22px]`, `top-[46px]`, `top-[77px]`).
- `promo-card.tsx` usa `left-[227px] top-[181px]`.
- `best-sellers-section.tsx` fixa `grid-cols-4` sem responsividade.
- `FLASH_SALE_INITIAL_SECONDS` é hardcoded em vez de vir da API.

**Refactors planejados e nunca feitos**

- `src/hooks/use-carousel.ts` não existe — a lógica de carrossel segue duplicada.
- `src/features/catalog/transformers/` não existe.
- Os antigos consumidores de validador (`revendedor-formatters.ts`, `revendedor-registration.ts`, `format-checkout-fields.ts`, `checkout-address-step-content.tsx`, `profile-data-form.tsx`, `app/api/profile/document/route.ts`) deveriam migrar para `src/lib/validation/brazilian-documents.ts`. **Não confirmado se a migração aconteceu.**

**Inconsistência menor**

- As etiquetas de atomic design em JSDoc ("atômico", "molecular", "organismo") são aplicadas de forma irregular.
