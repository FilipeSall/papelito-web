"use client";

import { useCallback, useState } from "react";

import { assetsHref, type AssetsPageKey } from "./assets-config";

/**
 * A página ativa vive no estado do cliente e é espelhada na URL com `replaceState`.
 *
 * Navegação do Next remontaria o gerenciador e descartaria edição ainda não salva; `pushState`
 * empilharia um histórico que o router não escuta, fazendo o Voltar mudar a URL sem mudar a tela.
 */
export function useAssetsPage(initialPage: AssetsPageKey) {
  const [activePage, setActivePage] = useState<AssetsPageKey>(initialPage);

  const selectPage = useCallback((next: AssetsPageKey) => {
    setActivePage(next);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", assetsHref(next));
    }
  }, []);

  return { activePage, selectPage };
}
