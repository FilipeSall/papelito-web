"use client";

/**
 * Estado de origem indisponível da listagem.
 *
 * Existe para não servir falha de backend como "Nenhum produto encontrado.": o cliente
 * precisa distinguir "não consegui carregar" de "não há produtos para este filtro".
 */
export function CatalogUnavailableNotice() {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 py-16 text-center"
    >
      <p className="text-sm font-semibold text-brand-dark">
        Não foi possível carregar os produtos agora.
      </p>
      <p className="max-w-md px-4 text-sm text-text-muted">
        A falha é temporária e não tem relação com os filtros aplicados. Tente novamente em
        alguns instantes.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark/90"
      >
        Tentar novamente
      </button>
    </div>
  );
}
