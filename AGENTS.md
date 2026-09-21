# Codex Context — papelito-web

**As instruções deste repositório vivem em [CLAUDE.md](CLAUDE.md)** — stack, invariantes e convenções. Leia-o primeiro; este arquivo não duplica o conteúdo.

Documentação:

- [docs/README.md](docs/README.md) — índice do frontend.
- [`../docs/README.md`](../docs/README.md) — contexto compartilhado com o backend: negócio, contratos REST/GraphQL e fluxos ponta a ponta.

O backend fica no repositório irmão `../papelito-wordpress`. Mudança que cruza os dois exige PR nos dois, na mesma branch nominal.

## Validação esperada

```bash
bun run lint
./node_modules/.bin/tsc --noEmit
bun run test:run
bun run build
npm ci        # o CI usa Node 24 + npm ci; package-lock.json precisa estar sincronizado
```

Lint de editor conta como validação: warning de SonarLint no que você tocou é pendência de entrega, e a saída nunca é escrever comentário. **`bun run lint` não vê nenhum destes** — o projeto não tem `eslint-plugin-sonarjs`, então confira no painel de problemas do editor antes de fechar. Os que mais reaparecem:

- `typescript:S6759` — props de componente vão como `Readonly<Props>` na assinatura.
- `typescript:S3358` — ternário aninhado sai; decomponha em variáveis nomeadas.
- `typescript:S3776` — complexidade cognitiva acima de 15. No React ela vem do JSX: o corpo de um `.map()` conta como função aninhada. Extraia componentes (`<ItemCard />`, `<ItemFacts />`), não comprima a lógica.
- `typescript:S7721` — função que não lê estado nem props vai para o escopo do módulo.

Detalhe e exemplos em [CLAUDE.md § Convenções](CLAUDE.md#convenções). Classe Tailwind arbitrária com token equivalente (`tracking-[0.1em]` → `tracking-widest`) também é pendência; confira o valor em [app/globals.css](app/globals.css), que redefine parte dos tokens.

**Símbolo exportado nasce com JSDoc/TSDoc** — bloco `/** */` acima da declaração, escrito para quem vai ler o código, e `/** */` por campo na declaração do tipo de props. Forma canônica e o que escrever em [CLAUDE.md § Documentação no código](CLAUDE.md#documentação-no-código-jsdoctsdoc); [`src/components/layout/profile-page/profile-form-field.tsx`](src/components/layout/profile-page/profile-form-field.tsx) é o exemplo.

Mudança no fluxo de disponibilidade regional: conferir as invariantes em [docs/context/rendering-and-performance.md](docs/context/rendering-and-performance.md) e confirmar no resumo do build que `/` continua estática/ISR.
