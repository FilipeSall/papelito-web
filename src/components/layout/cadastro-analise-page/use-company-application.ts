"use client";

import { useEffect, useState } from "react";

import type { Application, ApplicationLoadState } from "./application-view";

/**
 * Carrega a candidatura da sessão e expõe o estado de carregamento separado do dado.
 *
 * `setApplication` fica exposto porque o envio do documento devolve a candidatura já
 * atualizada — recarregar depois do upload traria o mesmo objeto por outro caminho.
 */
export function useCompanyApplication() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loadState, setLoadState] = useState<ApplicationLoadState>("loading");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;

    void fetch("/api/company-applications/current", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;

        if (response.status === 404) {
          setApplication(null);
          setLoadState("missing");
          return;
        }

        if (!response.ok) {
          setApplication(null);
          setLoadState("error");
          return;
        }

        setApplication(await response.json() as Application);
        setLoadState("loaded");
      })
      .catch(() => {
        if (!active) return;
        setApplication(null);
        setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [reloadCount]);

  function reload() {
    setLoadState("loading");
    setReloadCount((current) => current + 1);
  }

  return { application, setApplication, loadState, reload };
}
