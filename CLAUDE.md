# CLAUDE.md — papelito-web (frontend Next.js)

Frontend headless do marketplace Papelito. Consome o WordPress (`../papelito-wordpress`) via WPGraphQL para catálogo e cliente, e via REST (`/wp-json/papelito/v1/*`) para todas as regras de negócio.

## Onde está a documentação

**Não duplique aqui o que é compartilhado.** Contexto de negócio, contratos com o backend e fluxos ponta a ponta vivem em [`../docs/`](../docs/README.md).

| Preciso de… | Documento |
|---|---|
| Índice do frontend | [docs/README.md](docs/README.md) |
| Organização de `app/` e `src/`, componentes, convenções, dívida conhecida | [docs/context/architecture.md](docs/context/architecture.md) |
| Invariantes de ISR, cache e disponibilidade regional | [docs/context/rendering-and-performance.md](docs/context/rendering-and-performance.md) |
| Testes (Vitest, MSW, o que se mocka) | [docs/context/testing.md](docs/context/testing.md) |
| Design system, tokens, contraste, microcópia | [docs/brand/identidade-visual.md](docs/brand/identidade-visual.md) |
| Painel admin: abas, contrato de URL | [docs/context/admin-panel-ui.md](docs/context/admin-panel-ui.md) |
| Contratos com o WordPress | [`../docs/integration-contracts.md`](../docs/integration-contracts.md) |
| Regras de negócio | [`../docs/business-rules.md`](../docs/business-rules.md) |
| Fluxos funcionais | [`../docs/README.md#fluxos`](../docs/README.md#fluxos) |
| Setup, branch/PR/deploy | [`../docs/development.md`](../docs/development.md) |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 5 strict · Tailwind CSS 4 (sem `tailwind.config`; CSS-first) · NextAuth v4 **JWT-only, sem adapter de banco** · Apollo Client v4 · Zustand · SWR · Embla · Vitest + MSW.

O WordPress é a única fonte de verdade. O frontend não tem banco.

## Invariantes do frontend

- **O frontend nunca decide se uma compra é permitida.** Bloqueio na UI é experiência; a autorização real é do WordPress. `require-checkout-customer.ts` e o `place-order` do backend são as barreiras de verdade.
- **O gate de onboarding B2B roteia por `session.b2b.onboardingStatus`, nunca por `profileComplete`.** `papelito_profile_complete` tem dois escritores e vira `'1'` na verificação de e-mail mesmo quando o onboarding B2B falhou. O gate vive **exclusivamente** em [proxy.ts](proxy.ts). **Não reintroduza efeito de cliente** — o antigo `B2bOnboardingRedirect` rodava depois do render, em todas as rotas, e era burlável.
- **Home pública é ISR/cacheável.** Sem `getServerSession`, `cookies()`, `headers()` ou fetch `no-store` no SSR de `app/(public)/page.tsx`. UI de seller é escondida no cliente com `SellerHidden`.
- **O catálogo público renderiza todos os produtos.** Nenhuma listagem bloqueia SSR em CEP, vendor ativo ou cobertura. Produto indisponível fica opaco com tooltip, não desaparece.
- **A taxonomia Papelito é a fonte única de classificação.** Produto publicado sem categoria fica fora da vitrine; categorias e abas são dados do backend, sem enum/fallback no frontend.
- **A fonte da região é apenas o CEP salvo na conta.** Sem prompt, sem cookie, sem store de CEP — esse desenho foi implementado e removido.
- **CPF e data de nascimento nunca voltam em claro do WordPress.** O contexto expõe só `cpfLast4` e `hasBirthDate`.
- **Sem update otimista na validação de estoque.** Trava por produto antes da chamada, atualização condicional na store, `+` desabilitado durante a validação. Erro é **fail-closed**.
- **Cartão é tokenizado no browser**; só o `token_id` chega ao backend. PCI fora de escopo.
- **Proxy nunca converte `FormData` para JSON** — o upload de documento empresarial depende disso.
- **`getAdminUserDetail` precisa continuar `no-store`**, senão `router.refresh()` não re-busca depois de uma ação administrativa.

## Convenções

- **Sem barrel exports profundos.** Cada `index.ts` re-exporta só a própria pasta.
- Server Components por padrão; `"use client"` só com estado, evento ou API de browser.
- Server-only isolado em `src/lib/server/*` com `import "server-only"`.
- **Sem comentários em código** salvo para justificar workaround ou invariante.
- Tailwind apenas. Sem CSS Modules, sem styled-components.
- TypeScript strict; `unknown` + narrowing em vez de `any`.
- **Reutilize os componentes de `src/components/auth/*` e `src/components/ui/*`** em vez de estilizar `<input>`/`<select>`/`<button>` na página. Formulário é uncontrolled + `FormData` no submit (`auth-login-form.tsx` é a referência).
- Componente específico de uma página vive em `src/components/layout/<rota>/`; **não importe de lá em outra página** — promova para `ui/` se virou reutilizável.
- Bun local, `npm ci` no CI → `bun.lock` e `package-lock.json` são commitados juntos.

## Variáveis de ambiente

Tabela completa em [docs/context/architecture.md](docs/context/architecture.md#variáveis-de-ambiente-envlocal). Duas armadilhas:

- `GOOGLE_CLIENT_ID` precisa ser **exatamente igual** a `PAPELITO_GOOGLE_CLIENT_ID` no WordPress.
- Em produção, `NEXTAUTH_URL=https://marketplace.papelito.com`. **Nunca** use `papelito-web.vercel.app` — sessões não são compartilhadas entre os domínios.

## Comandos

```bash
nvm use && bun install
bun run dev
bun run lint
./node_modules/.bin/tsc --noEmit
bun run test:run
bun run build
npm ci                     # valida o package-lock.json como o CI faz
```
