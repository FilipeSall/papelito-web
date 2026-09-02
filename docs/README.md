# Documentação — papelito-web

Contexto **específico do frontend**. Tudo que é compartilhado com o backend (modelo de negócio, contratos REST/GraphQL, fluxos ponta a ponta) vive em [`../../docs/`](../../docs/README.md) e **não é duplicado aqui**.

## Ordem recomendada de leitura

1. **[`../../docs/system-overview.md`](../../docs/system-overview.md)** — entenda o marketplace antes de olhar o código.
2. **[context/architecture.md](context/architecture.md)** — organização de `app/` e `src/`, grupos de rota, camadas, componentes reutilizáveis, convenções e dívida conhecida.
3. **[context/rendering-and-performance.md](context/rendering-and-performance.md)** — as invariantes de ISR/cache que já foram violadas uma vez e não podem regredir.
4. **[context/testing.md](context/testing.md)** — Vitest, MSW, o que se mocka e o que nunca se mocka.
5. **[brand/identidade-visual.md](brand/identidade-visual.md)** — sistema visual da marca: tokens, contraste, tipografia, microcópia. A **seção 11** traz o *sistema do corredor*, a linguagem da vitrine pública (recortes, `ShelfLabel`/`Shelf`, movimento e armadilhas já verificadas) — leia antes de mexer em qualquer página pública.

Documentos de referência pontual:

| Documento | Conteúdo |
|---|---|
| [context/admin-panel-ui.md](context/admin-panel-ui.md) | arquitetura da informação dos painéis admin e vendor, contrato de URL das abas e do recorte de vendas, sincronia dos filtros de exportação, identidade de status e rotas removidas |

## Onde procurar o que não está aqui

| Pergunta | Documento |
|---|---|
| Como o login e a sessão funcionam? | [`../../docs/flows/authentication.md`](../../docs/flows/authentication.md) |
| Por que existe um gate de onboarding em `proxy.ts`? | [`../../docs/flows/registration-and-onboarding.md`](../../docs/flows/registration-and-onboarding.md) |
| Que rota do WordPress esta feature consome? | [`../../docs/integration-contracts.md`](../../docs/integration-contracts.md) |
| Qual a regra de negócio deste cálculo de carrinho? | [`../../docs/business-rules.md`](../../docs/business-rules.md) |
| Como a disponibilidade regional decide o que fica opaco? | [`../../docs/flows/catalog-and-availability.md`](../../docs/flows/catalog-and-availability.md) |
| Como subo o ambiente e abro um PR? | [`../../docs/development.md`](../../docs/development.md) |
| Esta rota pode ser indexada? Onde fica o canonical, o sitemap e o JSON-LD? | [`../../docs/seo-and-discoverability.md`](../../docs/seo-and-discoverability.md) |

> A `brand/identidade-visual.md` é a fonte canônica da skill `papelito-branding`. **Não mova esse arquivo** sem atualizar `.claude/skills/papelito-branding/SKILL.md`.
