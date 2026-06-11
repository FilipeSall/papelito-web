# Plano de Testes Unitários do Front-end

> **Status:** proposta / a implementar.
> **Projeto:** `papelito-web` — frontend headless do marketplace Papelito.
> **Escopo deste documento:** plano técnico, prático e executável para introduzir testes unitários/de integração baseados nas **regras de negócio reais** do sistema. Não é um relatório de execução; é o guia que outro desenvolvedor seguirá para implementar a suíte.

---

## 1. Objetivo

Criar uma rede de segurança anti-regressão sobre as **regras de negócio reais** do front-end, e não testes superficiais de renderização.

O sistema é um marketplace B2B headless (Next.js consumindo WordPress/WooCommerce via GraphQL + REST), e a maior parte da lógica de valor está em:

- **cálculo de carrinho** (subtotal, frete grátis, desconto de cupom, agrupamento por vendor);
- **validações brasileiras** (CNPJ com dígitos verificadores, CEP, telefone, cartão);
- **autenticação JWT** (login, refresh automático, e-mail não verificado, OAuth Google);
- **cobertura/disponibilidade regional por CEP** (quem pode comprar o quê);
- **cupons, pedidos e notificações**.

**O que estes testes garantem:**

- que mudanças futuras não quebrem essas regras silenciosamente;
- que o comportamento observável pelo usuário (preço exibido, botão habilitado/desabilitado, mensagem de erro) continue correto;
- documentação executável das invariantes do domínio.

**Anti-objetivos (o que estes testes NÃO devem ser):**

- ❌ snapshots como única asserção ("renderizou sem quebrar");
- ❌ testes acoplados a detalhes internos de implementação (nomes de variáveis de estado, ordem de chamadas internas);
- ❌ mock de tudo "por segurança" — só a fronteira (rede, sessão, APIs do browser) é mockada; a lógica de domínio nunca;
- ❌ testar página-por-página de Server Components (fora do ROI de testes unitários — ver §11).

---

## 2. Stack recomendada

| Camada | Ferramenta | Papel |
|---|---|---|
| Runner | **Vitest** | Test runner ESM-native, API compatível com Jest |
| Cobertura | **@vitest/coverage-v8** | Relatório de cobertura nativo (V8) |
| Ambiente DOM | **jsdom** | DOM simulado para componentes/hooks |
| Render React | **@testing-library/react** | Render e queries por papel/texto (comportamento) |
| Interação | **@testing-library/user-event** | Simula digitação/clique como um usuário real |
| Matchers DOM | **@testing-library/jest-dom** | `toBeInTheDocument`, `toBeDisabled`, etc. |
| Mock de rede | **msw** | Intercepta HTTP/GraphQL na fronteira (fetch) |
| Alias de imports | **vite-tsconfig-paths** | Resolve `@/*` → `src/*` sem config manual |

Instalação (todas como **devDependencies**):

```bash
# Local (Bun)
bun add -d vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  msw vite-tsconfig-paths

# Sincronizar o package-lock.json para o CI (Node 24 + npm ci)
npm install
```

> ⚠️ O ambiente é híbrido: **Bun 1.3.5 localmente**, mas o **CI usa Node 24 + `npm ci`**. Após instalar com `bun`, rode `npm install` para manter `package-lock.json` sincronizado, senão o CI quebra.

Scripts a adicionar no `package.json`:

```jsonc
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage"
  }
}
```

---

## 3. Justificativa técnica

O pedido sugeriu Vitest. Confirmando a escolha tecnicamente, comparada às alternativas no ecossistema atual do projeto (Next.js 16, React 19, TypeScript strict, Tailwind 4 CSS-first, sem build customizado):

### Por que **Vitest** (escolhido)
- **ESM-native, sem transpiler extra.** O projeto é ESM puro; Vitest roda TS/ESM nativamente. Jest exigiria `ts-jest`/`babel-jest` + configuração de ESM, que é notoriamente trabalhosa com Next 16/React 19.
- **Resolução de `@/*` trivial.** `vite-tsconfig-paths` lê o `tsconfig.json` existente (`@/* → ./src/*`); no Jest seria preciso manter `moduleNameMapper` à mão e em sincronia.
- **API compatível com Jest** (`describe/it/expect/vi`) → curva de aprendizado baixíssima, e RTL/MSW têm suporte maduro.
- **Watch/HMR rápido** e `coverage-v8` embutido, sem dependências adicionais de cobertura.

### Por que não **`bun test`**
- Embora nativo e já instalado, seu suporte a DOM/mocking é menos maduro que o de Vitest+RTL, e o ecossistema de MSW/Testing Library é menos exercitado nele.
- O **CI roda em Node + npm, não Bun** — usar `bun test` criaria divergência entre o que roda local e o que roda no pipeline. Vitest roda igual nos dois.

### Por que não **Jest**
- Mais maduro historicamente, porém mais lento, com configuração de ESM/Next mais trabalhosa, e foge do que foi pedido. Sem ganho que justifique o custo de setup aqui.

### Sobre o escopo (unidade/integração com jsdom, E2E fora)
Como o front é **headless** e a maior parte da lógica vive **fora dos Server Components** (em funções puras, stores Zustand, hooks client e services), testes de unidade + integração em jsdom cobrem o maior ROI. Testes E2E (Playwright) — que exercitariam fluxos completos no browser real, incluindo RSC e middleware — ficam como **evolução futura** (§12), não neste plano.

---

## 4. Principais fluxos analisados

Mapeamento dos fluxos pedidos → onde a lógica realmente vive no código.

| # | Fluxo | Lógica testável (arquivos reais) |
|---|---|---|
| 1 | **Autenticação** | [src/lib/auth.ts](../src/lib/auth.ts) (`wpLogin`, `wpRefreshAuthToken`, `wpExchangeGoogleToken`, `wpFetchAuthenticatedRole`, `normalizeRole`, `getAccessTokenExpiresAt`), [src/hooks/use-auth-session.ts](../src/hooks/use-auth-session.ts), [proxy.ts](../proxy.ts) (guard de rotas) |
| 2 | **Home / listagem de produtos** | [src/components/ui/product-price.tsx](../src/components/ui/product-price.tsx), [src/lib/format-currency.ts](../src/lib/format-currency.ts), [src/features/catalog/utils/](../src/features/catalog/utils/) |
| 3 | **Detalhe do produto** | [src/features/catalog/types/product-detail.ts](../src/features/catalog/types/product-detail.ts), [src/features/catalog/hooks/use-product-availability.tsx](../src/features/catalog/hooks/use-product-availability.tsx) |
| 4 | **Carrinho** | [src/features/cart/store/use-cart-store.ts](../src/features/cart/store/use-cart-store.ts), [src/features/cart/utils/get-cart-summary.ts](../src/features/cart/utils/get-cart-summary.ts), [src/features/cart/services/resolve-cart-vendor.ts](../src/features/cart/services/resolve-cart-vendor.ts) |
| 5 | **Checkout** | [src/features/checkout/store/use-checkout-store.ts](../src/features/checkout/store/use-checkout-store.ts), [src/features/checkout/hooks/use-checkout-address-form.ts](../src/features/checkout/hooks/use-checkout-address-form.ts), [src/features/checkout/hooks/use-checkout-payment-form.ts](../src/features/checkout/hooks/use-checkout-payment-form.ts), [src/features/checkout/services/lookup-cep.ts](../src/features/checkout/services/lookup-cep.ts), [src/features/checkout/services/place-order.ts](../src/features/checkout/services/place-order.ts), [src/features/checkout/utils/format-checkout-fields.ts](../src/features/checkout/utils/format-checkout-fields.ts) |
| 6 | **Vendor / revendedor** | [src/features/revendedor/hooks/use-revendedor-form.ts](../src/features/revendedor/hooks/use-revendedor-form.ts), [src/features/revendedor/utils/revendedor-formatters.ts](../src/features/revendedor/utils/revendedor-formatters.ts), [src/features/revendedor/store/use-revendedor-registration-draft-store.ts](../src/features/revendedor/store/use-revendedor-registration-draft-store.ts) |
| 7 | **Cobertura por CEP** | [src/features/active-vendor/services/](../src/features/active-vendor/services/) (`get-active-vendor`, `get-available-vendors`, `set-active-vendor`, `wp-mappers`), [src/features/active-vendor/utils/format-vendor-region.ts](../src/features/active-vendor/utils/format-vendor-region.ts), [src/features/catalog/hooks/use-product-availability.tsx](../src/features/catalog/hooks/use-product-availability.tsx) |
| 8 | **Notificações** | [src/features/notifications/store/use-notifications-store.ts](../src/features/notifications/store/use-notifications-store.ts), [src/features/notifications/hooks/use-notifications-poll.ts](../src/features/notifications/hooks/use-notifications-poll.ts), [src/features/notifications/services/get-notifications.ts](../src/features/notifications/services/get-notifications.ts) |
| 9 | **Formulários e validações** | revendedor (acima), checkout (acima), auth ([src/components/auth/organisms/auth-login-form.tsx](../src/components/auth/organisms/auth-login-form.tsx) — uncontrolled + `FormData`) |
| 10 | **Hooks, services e regras puras** | [src/utils/](../src/utils/) (`money.ts`, `error-message.ts`, `normalize-key.ts`, `html.ts`), [src/lib/format-currency.ts](../src/lib/format-currency.ts), [src/features/coupons/services/apply-coupon.ts](../src/features/coupons/services/apply-coupon.ts), mappers diversos |

---

## 5. Regras de negócio relevantes

Invariantes extraídas diretamente do código. Cada uma deve ter ≥1 teste cobrindo caminho feliz e borda/erro.

### Carrinho e preço ([get-cart-summary.ts](../src/features/cart/utils/get-cart-summary.ts))
1. `CART_SHIPPING_THRESHOLD = 99`, `CART_SHIPPING_COST = 8.9`.
2. Frete grátis quando `subtotal >= 99`; senão frete = `8.9`; carrinho vazio → frete = `0`.
3. `shippingOverride` finito e ≥0 **sobrepõe** o cálculo (cotação de frete real); negativo é clampado a 0.
4. Desconto de cupom = `min(coupon.discountValue, subtotal)` (nunca desconta mais que o subtotal).
5. `total = max(0, subtotal - discount) + shipping` — total nunca negativo.
6. Subtotais arredondados a 2 casas; itens agrupados por `vendorId` em `vendorGroups`.
7. `amountToFreeShipping` = quanto falta para R$99 (0 se já tem frete grátis).

### Carrinho — store ([use-cart-store.ts](../src/features/cart/store/use-cart-store.ts))
8. `addItem` de produto já existente **soma** a quantidade ao item existente.
9. `setItemQuantity` com quantidade `<= 0` **remove** o item.
10. Persistência em `localStorage` (`papelito-cart-store` v3) com normalização de itens corrompidos no carregamento.

### Resolução de vendor ([resolve-cart-vendor.ts](../src/features/cart/services/resolve-cart-vendor.ts))
11. Status possíveis: `ok | missing_cep | unavailable | vendor_conflict`.
12. HTTP 401 → mensagem "Entre na sua conta para adicionar produtos ao carrinho."
13. `vendor_conflict` impede misturar produtos de vendors diferentes.

### Validações brasileiras ([revendedor-formatters.ts](../src/features/revendedor/utils/revendedor-formatters.ts), [format-checkout-fields.ts](../src/features/checkout/utils/format-checkout-fields.ts))
14. `isValidCnpj` valida pelos **dígitos verificadores oficiais**; rejeita sequências repetidas (`11111111111111`) e comprimento ≠ 14.
15. `normalizeCep`/`isValidCep` exigem exatamente 8 dígitos; máscara `00000-000`.
16. `formatPhone` aplica `(XX) XXXXX-XXXX` até 11 dígitos.
17. `isValidEmail` valida por regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
18. `formatCnpj`/`formatPhone`/`formatCep` formatam **progressivamente** conforme o usuário digita (não exigem valor completo).
19. `formatCvv` trunca em 4 dígitos; `formatExpiryDate` → `MM/YY`; `formatCardNumber` em grupos de 4.

### Formulário de revendedor ([use-revendedor-form.ts](../src/features/revendedor/hooks/use-revendedor-form.ts))
20. Validação por campo com mensagens específicas; submit inválido **não** chama `onValidSubmit` e retorna `false`.
21. Regra de faixa de CEP: `minCep <= maxCep` (senão "O CEP final precisa ser maior ou igual ao CEP inicial.").
22. Draft multi-step persiste dados entre etapas ([use-revendedor-registration-draft-store.ts](../src/features/revendedor/store/use-revendedor-registration-draft-store.ts): `patchStep1/2/3`, `mergeDraft`, `resetDraft`).

### Checkout ([use-checkout-address-form.ts](../src/features/checkout/hooks/use-checkout-address-form.ts), [use-checkout-payment-form.ts](../src/features/checkout/hooks/use-checkout-payment-form.ts))
23. `isFormValid` exige CEP com 8 dígitos + street/number/neighborhood/city/state preenchidos.
24. CEP válido auto-preenche street/neighborhood/city/state via `fetchCep`.
25. Cartão válido exige: holderName ≥3, número ≥13 dígitos, validade = 4 dígitos, cvv ≥3, parcelas preenchidas.
26. PIX e boleto sempre liberam continuar (`canContinue = true`).
27. `lookupCep`: tenta ViaCEP, faz fallback para BrasilAPI; se ambos falham → erro "CEP não encontrado.".

### Autenticação ([auth.ts](../src/lib/auth.ts))
28. Login com credenciais inválidas → `null`; e-mail não verificado → erro `papelito_email_not_verified`.
29. JWT é renovado automaticamente quando `Date.now() >= accessTokenExpires - 30_000` (≤30s para expirar).
30. Refresh token inválido → limpa `accessToken`/`accessTokenExpires`.
31. `normalizeRole` normaliza role do JWT; `role` vazio → fallback para query GraphQL/REST.
32. `profileComplete = false` (usuário Google sem perfil) → redirecionamento para completar perfil.

### Guard de rotas ([proxy.ts](../proxy.ts))
33. Rotas protegidas (`/perfil`, `/carrinho`, `/checkout`, `/admin`) redirecionam não-autenticados para `/entrar`.
34. Sellers são bloqueados de `/carrinho` e `/checkout`; `/admin/*` restrito a administradores.

### Cobertura / disponibilidade regional ([use-product-availability.tsx](../src/features/catalog/hooks/use-product-availability.tsx), [active-vendor/services](../src/features/active-vendor/services/))
35. Disponibilidade só é consultada para usuário **autenticado + customer + com CEP salvo**; anônimo/sem CEP vê catálogo normal (`not_applicable`).
36. Cache client em `localStorage` (TTL 5min) + SWR dedup.
37. Produto indisponível não some do catálogo — fica com `isUnavailable` e `disabledReason` ("O vendor da sua região não tem esse produto.").
38. `getActiveVendor`/`getAvailableVendors` mapeiam erros: `unauthenticated | missing_cep | no_vendor_available | network | unknown`.

### Cupons ([apply-coupon.ts](../src/features/coupons/services/apply-coupon.ts))
39. Códigos de erro `papelito_coupon_*` mapeados para mensagens amigáveis; cupom vazio → "Informe um cupom.".

### Notificações ([use-notifications-store.ts](../src/features/notifications/store/use-notifications-store.ts), [use-notifications-poll.ts](../src/features/notifications/hooks/use-notifications-poll.ts))
40. `markRead(id)` só decrementa `unreadCount` se a notificação **era** não lida; `markAllRead` zera o count.
41. Polling a cada 60s **apenas** quando `document.visibilityState === 'visible'`.
42. Usuário não autenticado → limpa `items` e `unreadCount`; mudança no count → revalida a lista.

---

## 6. Estratégia geral de testes

Pirâmide de testes, da base (mais barata e estável) ao topo:

```
        ╱ componentes-chave (RTL + user-event) — comportamento visível
       ╱  services (MSW) — contratos de rede e tratamento de erro
      ╱   stores + hooks (renderHook + act) — estado e regras client
     ╱___ funções puras — regras de negócio determinísticas (base larga)
```

**Princípios:**

- **Testar comportamento observável**, não implementação. Para um hook: o que ele retorna e como reage a eventos — não o nome dos `useState` internos.
- **AAA** (Arrange / Act / Assert) e **um conceito por teste**.
- **Queries por papel/texto** (`getByRole`, `getByLabelText`, `findByText`) em vez de `data-testid` ou estrutura de DOM.
- **Mocar só a fronteira**: rede (MSW), sessão (`next-auth/react`), APIs do browser (timers, `localStorage`, `next/image`, `next/navigation`). **Lógica de domínio nunca é mockada.**
- **Quando um teste só consegue passar olhando o estado interno**, é sinal de extrair a regra para uma **função pura** e testá-la diretamente.
- **Sem snapshot como única asserção.** Snapshot é aceitável só como complemento de uma asserção de comportamento, nunca sozinho.

---

## 7. Estrutura de pastas sugerida

Co-localização (`*.test.ts(x)` ao lado do arquivo testado) para unidade + uma pasta `test/` central para infraestrutura compartilhada.

```
papelito-web/
├── vitest.config.ts                 # env jsdom, alias via plugin, setupFiles, coverage
├── vitest.setup.ts                  # jest-dom, MSW lifecycle, cleanup RTL, env defaults
├── test/
│   ├── msw/
│   │   ├── server.ts                # setupServer(...handlers)
│   │   └── handlers/
│   │       ├── auth.ts              # GraphQL login/refresh + REST /auth/google /auth/me
│   │       ├── coupons.ts           # /api/coupons/apply (ok + papelito_coupon_*)
│   │       ├── cep.ts               # ViaCEP + BrasilAPI (sucesso/erro)
│   │       ├── notifications.ts     # /api/notifications/me (+ 401)
│   │       ├── availability.ts      # /api/catalog/availability
│   │       └── checkout.ts          # /api/checkout/place-order, resolve-vendor
│   ├── factories/
│   │   ├── cart.ts                  # buildCartItem, buildCartCoupon
│   │   ├── product.ts               # buildProduct, buildProductDetail
│   │   ├── session.ts               # buildSession({ role, accessToken, profileComplete })
│   │   ├── vendor.ts                # buildActiveVendor, buildAvailableVendor
│   │   └── notification.ts          # buildNotification
│   └── utils/
│       ├── render-with-providers.tsx  # SessionProvider/ApolloProvider/AvailabilityProvider
│       └── reset-stores.ts            # zera stores Zustand + localStorage entre testes
└── src/
    ├── features/cart/utils/get-cart-summary.test.ts
    ├── features/cart/store/use-cart-store.test.ts
    ├── features/revendedor/utils/revendedor-formatters.test.ts
    ├── features/checkout/hooks/use-checkout-payment-form.test.ts
    ├── lib/auth.test.ts
    ├── components/ui/product-price.test.tsx
    └── ...                          # demais testes co-localizados
```

Exemplo de `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/types/**", "src/**/*.test.{ts,tsx}"],
    },
  },
});
```

Exemplo de `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./test/msw/server";

process.env.NEXTAUTH_SECRET ??= "test-secret";
process.env.NEXTAUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_WP_GRAPHQL_ENDPOINT ??= "http://localhost:8080/graphql";
process.env.NEXT_PUBLIC_WP_REST_BASE ??= "http://localhost:8080/wp-json";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
});
afterAll(() => server.close());
```

---

## 8. Plano em 10 steps

Cada step traz: **Objetivo · Arquivos/áreas · Tipos de teste · Regras de negócio · Riscos · Resultado esperado.**

### Step 1 — Diagnóstico da estrutura atual do projeto
- **Objetivo:** confirmar o estado atual e produzir um inventário priorizado do que testar.
- **Arquivos/áreas:** [package.json](../package.json), [tsconfig.json](../tsconfig.json), árvore de `src/features/*`, `src/utils/`, `src/lib/`, `src/hooks/`.
- **Tipos de teste:** nenhum ainda — é levantamento. Classificar cada arquivo em: *pura* | *store* | *hook* | *service-rede* | *componente* | *server-only/RSC (fora de escopo)*.
- **Regras de negócio:** mapear as regras da §5 aos arquivos.
- **Riscos:** confundir código `server-only` (`import "server-only"`, ex. parte de `active-vendor/services`) com testável em jsdom; marcar claramente o que precisa de adaptação.
- **Resultado esperado:** checklist priorizado (puras → stores → hooks → services → componentes) que guia os steps 3–9.

### Step 2 — Configuração do ambiente de testes
- **Objetivo:** deixar `bun run test` e `npm run test:ci` funcionando, sem nenhum teste real ainda.
- **Arquivos/áreas:** instalar devDeps (§2); criar `vitest.config.ts`, `vitest.setup.ts`, `test/msw/server.ts`; adicionar scripts ao [package.json](../package.json); rodar `npm install` para sincronizar `package-lock.json`.
- **Tipos de teste:** um smoke test trivial (`expect(1 + 1).toBe(2)`) só para validar a config.
- **Regras de negócio:** nenhuma.
- **Riscos:** divergência Bun ↔ npm no lockfile; env vars (`NEXT_PUBLIC_*`, `NEXTAUTH_*`) ausentes → definir defaults no setup; Tailwind 4 não deve ser processado nos testes (`css: false`).
- **Resultado esperado:** infra verde, MSW ligado com `onUnhandledRequest: "error"`, scripts disponíveis.

### Step 3 — Testes de funções puras e regras de negócio
- **Objetivo:** cobrir a camada determinística — maior ROI, zero mock.
- **Arquivos/áreas:** [get-cart-summary.ts](../src/features/cart/utils/get-cart-summary.ts), [revendedor-formatters.ts](../src/features/revendedor/utils/revendedor-formatters.ts), [format-checkout-fields.ts](../src/features/checkout/utils/format-checkout-fields.ts), [format-currency.ts](../src/lib/format-currency.ts), [money.ts](../src/utils/money.ts), [error-message.ts](../src/utils/error-message.ts), [normalize-key.ts](../src/utils/normalize-key.ts), [html.ts](../src/utils/html.ts), [format-vendor-region.ts](../src/features/active-vendor/utils/format-vendor-region.ts), [wp-mappers.ts](../src/features/active-vendor/services/wp-mappers.ts), funções puras de [auth.ts](../src/lib/auth.ts) (`normalizeRole`, `getAccessTokenExpiresAt`).
- **Tipos de teste:** tabelas-verdade (parametrizados com `it.each`) cobrindo limites.
- **Regras de negócio:** §5 #1–7, #14–19, #31; mappers snake_case→camelCase.
- **Riscos:** esquecer os valores de fronteira (subtotal `98.99` vs `99.00`; CNPJ inválido vs sequência repetida; CEP `<8`; cartão `<13` dígitos; cupom `> subtotal`).
- **Resultado esperado:** suíte verde da camada pura, cobertura alta nesses arquivos.

### Step 4 — Testes dos componentes de produto e home
- **Objetivo:** validar exibição condicional de preço/desconto/badge/indisponibilidade.
- **Arquivos/áreas:** [product-price.tsx](../src/components/ui/product-price.tsx), [add-to-cart-button.tsx](../src/components/ui/add-to-cart-button.tsx), card de produto e estados vazios em `components/layout/products-page/` e `components/layout/home/`.
- **Tipos de teste:** RTL + user-event; asserções por papel/texto.
- **Regras de negócio:** preço atual exibido; `originalPrice` tachado só quando maior; badge exibido/oculto; `AddToCartButton` desabilitado com `disabledReason` quando indisponível; estado vazio quando lista sem produtos.
- **Riscos:** **não** usar snapshot como única asserção; mockar `next/image` e `useCartStore`; não testar layout/CSS.
- **Resultado esperado:** comportamento de exibição de produto coberto sem fragilidade.

### Step 5 — Testes dos fluxos de autenticação
- **Objetivo:** cobrir login, refresh, OAuth, role e guard de rotas.
- **Arquivos/áreas:** [auth.ts](../src/lib/auth.ts), [use-auth-session.ts](../src/hooks/use-auth-session.ts), [proxy.ts](../proxy.ts), [auth-login-form.tsx](../src/components/auth/organisms/auth-login-form.tsx).
- **Tipos de teste:** unit/integração de services com MSW (GraphQL + REST); `renderHook` para `useAuthSession` mockando `useSession`; testes da lógica de decisão do guard; render do form de login (preenchimento e submit chamando `signIn`).
- **Regras de negócio:** §5 #28–34.
- **Riscos:** `auth.ts` mistura GraphQL e REST — handlers MSW para os dois; controlar o relógio (`vi.useFakeTimers`) para testar refresh ≤30s; não recriar o NextAuth inteiro, testar as funções/callbacks isoladas.
- **Resultado esperado:** regras de sessão, refresh, e-mail não verificado, role e redirecionamentos cobertas.

### Step 6 — Testes de carrinho
- **Objetivo:** validar manipulação do carrinho, frete, cupom e resolução de vendor.
- **Arquivos/áreas:** [use-cart-store.ts](../src/features/cart/store/use-cart-store.ts), [get-cart-summary.ts](../src/features/cart/utils/get-cart-summary.ts) (integrado ao store), [resolve-cart-vendor.ts](../src/features/cart/services/resolve-cart-vendor.ts), `use-cart-summary.ts`.
- **Tipos de teste:** `renderHook` + `act` com reset de store/`localStorage`; service com MSW.
- **Regras de negócio:** §5 #8–13 + #1–7 via store.
- **Riscos:** persistência `localStorage` precisa de reset entre testes (`reset-stores.ts`); `applyCoupon` é async → MSW + `await`; testar carrinho vazio e produto indisponível.
- **Resultado esperado:** add/remove/quantidade/subtotal/frete/cupom/vendor validados.

### Step 7 — Testes de checkout
- **Objetivo:** validar endereço, CEP, pagamento, resumo e criação de pedido.
- **Arquivos/áreas:** [use-checkout-store.ts](../src/features/checkout/store/use-checkout-store.ts), [use-checkout-address-form.ts](../src/features/checkout/hooks/use-checkout-address-form.ts), [use-checkout-payment-form.ts](../src/features/checkout/hooks/use-checkout-payment-form.ts), [lookup-cep.ts](../src/features/checkout/services/lookup-cep.ts), [place-order.ts](../src/features/checkout/services/place-order.ts).
- **Tipos de teste:** `renderHook` para os forms; service com MSW (ViaCEP→BrasilAPI→erro; place-order sucesso/erro tipado).
- **Regras de negócio:** §5 #23–27; resumo do pedido (subtotal/frete/total via `getCartSummary`); fluxos de sucesso e falha da API.
- **Riscos:** checkout depende de tokenização Pagar.me e contrato WP; testar `placeOrder` e `tokenizeCreditCard` com MSW, além dos estados PIX/boleto/cartão; página de sucesso só deve renderizar para pagamento `paid`/`captured`; controlar fallback ViaCEP→BrasilAPI com `server.use`.
- **Resultado esperado:** validação de dados obrigatórios, CEP, pagamento e criação de pedido cobertas.

### Step 8 — Testes de vendor/revendedor
- **Objetivo:** validar cadastro multi-step, validações e persistência entre etapas.
- **Arquivos/áreas:** [use-revendedor-form.ts](../src/features/revendedor/hooks/use-revendedor-form.ts), [revendedor-formatters.ts](../src/features/revendedor/utils/revendedor-formatters.ts), [use-revendedor-registration-draft-store.ts](../src/features/revendedor/store/use-revendedor-registration-draft-store.ts).
- **Tipos de teste:** `renderHook` + user-event para o form; teste de store para o draft.
- **Regras de negócio:** §5 #14–22 (campos obrigatórios, formatação em tempo real, `minCep <= maxCep`, submit válido chama `onValidSubmit` / inválido bloqueia, persistência entre steps).
- **Riscos:** validação só dispara após submit ou após erro+mudança — replicar essa condição; cuidado com formatação progressiva (não esperar valor completo cedo demais).
- **Resultado esperado:** cadastro multi-step, validações de campo e cobertura por faixa de CEP validados.

### Step 9 — Testes de notificações, CEP e integrações com API
- **Objetivo:** cobrir notificações, disponibilidade/cobertura regional e contratos de API restantes.
- **Arquivos/áreas:** [use-notifications-store.ts](../src/features/notifications/store/use-notifications-store.ts), [use-notifications-poll.ts](../src/features/notifications/hooks/use-notifications-poll.ts), [get-notifications.ts](../src/features/notifications/services/get-notifications.ts), [use-product-availability.tsx](../src/features/catalog/hooks/use-product-availability.tsx), [active-vendor/services](../src/features/active-vendor/services/), [apply-coupon.ts](../src/features/coupons/services/apply-coupon.ts).
- **Tipos de teste:** store + `renderHook` com **fake timers** (polling) + MSW; provider wrapper para availability.
- **Regras de negócio:** §5 #35–42.
- **Riscos:** polling exige `vi.useFakeTimers()` e controle de `document.visibilityState`; availability só dispara para auth+customer+CEP (testar também o caso anônimo que **não** dispara); cache `localStorage` precisa de reset; cobrir 401 em notificações.
- **Resultado esperado:** notificações (contagem, leitura, polling, 401) e cobertura regional (dentro/fora, mensagens, estados) cobertas.

### Step 10 — Padronização, cobertura, documentação e CI
- **Objetivo:** consolidar a suíte como barreira anti-regressão estável e documentada.
- **Arquivos/áreas:** [package.json](../package.json), config de cobertura, doc curta em `docs/`, workflow de CI.
- **Tipos de teste:** revisão da suíte (nomes consistentes, AAA, sem flaky); thresholds de cobertura por camada.
- **Regras de negócio:** nenhuma nova — garantir que todas da §5 têm teste.
- **Riscos:** thresholds irreais geram ruído — usar metas realistas (puras altas, UI moderadas); CI usa Node 24 + `npm ci` + `npm run test:ci`.
- **Resultado esperado:** `test:ci` no pipeline, doc de "como testar" em `docs/`, suíte verde e não-flaky.

---

## 9. Estratégia de mocks

### HTTP / GraphQL — **MSW**
- `setupServer(...handlers)` em `test/msw/server.ts`, ligado no `vitest.setup.ts` com `onUnhandledRequest: "error"` (nenhuma chamada de rede real passa despercebida).
- Handlers organizados por domínio em `test/msw/handlers/`.
- Cenários de erro com `server.use(...)` por teste: HTTP 401, `papelito_coupon_*`, "CEP não encontrado", refresh token inválido, `vendor_conflict`.
- GraphQL (`graphql.query`/`graphql.mutation` do MSW) para `login`/`refreshJwtAuthToken`/`customer`; REST (`http.post`/`http.get`) para `/wp-json/papelito/v1/*`, `/api/*`, ViaCEP e BrasilAPI.

### Sessão / autenticação
- `vi.mock("next-auth/react")` para `useSession`/`signIn`.
- Factory `buildSession({ role, accessToken, profileComplete })`.
- `render-with-providers.tsx` envolve componentes em `SessionProvider` (e `ApolloProvider`/`ProductAvailabilityProvider` quando necessário).

### Dados do usuário / domínio
- **Factories** (`buildCartItem`, `buildProduct`, `buildVendor`, `buildNotification`, `buildSession`) com overrides parciais — nunca fixtures gigantes copiadas e coladas.

### Browser / Next
- `vi.mock("next/image")` (renderiza `<img>` simples).
- `vi.mock("next/navigation")` para `useRouter`/`redirect`/`usePathname`.
- `localStorage.clear()` no `afterEach`.
- `vi.useFakeTimers()` para polling de notificações e dedup do SWR; ajustar `document.visibilityState` via `Object.defineProperty`.

### Regra de ouro
Mocar **somente a fronteira** (rede, sessão, browser). A lógica de domínio — cálculos, validações, transições de estado — **nunca** é mockada: é exatamente o que está sob teste.

---

## 10. Critérios de aceite

O plano é considerado concluído quando:

- ✅ `bun run test` (local) e `npm run test:ci` (CI Node 24) passam sem falhas.
- ✅ Toda regra de negócio listada na §5 tem ≥1 teste cobrindo caminho feliz **e** borda/erro.
- ✅ Camada de funções puras com cobertura alta (meta ~90%+); stores/hooks/services cobertos por testes de **comportamento**; nenhum teste usa snapshot como única asserção.
- ✅ Nenhum teste depende de rede real — MSW intercepta tudo (`onUnhandledRequest: "error"`).
- ✅ `package-lock.json` sincronizado com `package.json` (CI não quebra).
- ✅ Suíte não-flaky: timers controlados, stores e `localStorage` resetados entre testes.
- ✅ Documento curto de "como rodar e escrever testes" disponível em `docs/`.
- ✅ `test:ci` integrado ao pipeline de CI como barreira de merge.

---

## 11. Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| **Server Components / RSC** (home, catálogo, páginas) não são cobertos por testes unitários jsdom | Escopo intencional: testar a **lógica que eles consomem** (funções puras, services), não a renderização da página. E2E (Playwright) cobre isso depois. |
| **Código `server-only`** (`import "server-only"`) quebra em jsdom | Identificar no Step 1; testar a lógica pura extraída ou stubar `server-only`. |
| **Persistência `localStorage`** (cart, checkout, draft) vaza estado entre testes | `reset-stores.ts` + `localStorage.clear()` no `afterEach`. |
| **SWR / polling** geram timers pendentes e flakiness | `vi.useFakeTimers()` e `await vi.advanceTimersByTimeAsync(...)`; controlar `visibilityState`. |
| **Divergência Bun ↔ npm** no lockfile | Sempre `npm install` após instalar devDeps com `bun`; CI valida com `npm ci`. |
| **Testar implementação interna** de stores/hooks gera fragilidade | Testar saída/comportamento observável; extrair regra para função pura quando o teste precisar olhar o estado interno. |
| **Checkout Pagar.me depende de API externa e tokenização no browser** | Mockar `/tokens`, `/api/checkout/place-order` e pedido de perfil; validar que PAN/CVV não entram no payload para o backend e que sucesso/pagamento pendente redirecionam corretamente. |
| **Apollo v4 + React 19** podem exigir setup específico | Preferir interceptar no nível de fetch com MSW; usar `MockedProvider` só se necessário. |
| **Env vars** ausentes nos testes (`NEXT_PUBLIC_*`, `NEXTAUTH_*`) | Defaults no `vitest.setup.ts`. |

---

## 12. Próximos passos

1. **Ordem de implementação:** Step 2 → Step 3 primeiro (infra + funções puras = ROI rápido e estável), depois Steps 4–9 por fluxo, fechando com Step 10.
2. **Integrar `test:ci` ao pipeline** de CI (Node 24 + `npm ci` + `npm run test:ci`) como barreira de merge.
3. **E2E com Playwright** como evolução futura — cobre RSC, middleware e fluxos ponta-a-ponta (login → carrinho → checkout) que ficam fora do escopo unitário.
4. **Codegen GraphQL** (opcional): gerar tipos a partir do schema do WPGraphQL para fortalecer os mocks e os contratos de `auth.ts`/catálogo.
5. **Ampliar checkout Pagar.me** com testes da tokenização e dos estados PIX/boleto/cartão na UI de revisão e pagamento pendente.
