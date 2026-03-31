# Convenções de Rotas (`app`)

- `(public)`: páginas públicas e institucionais.
- `(app)`: área autenticada/protegida.
- `loading.tsx`, `error.tsx`, `not-found.tsx`: estados globais do App Router.

Mantenha lógica de domínio fora de `app/` e importe de `src/features` e `src/lib`.
