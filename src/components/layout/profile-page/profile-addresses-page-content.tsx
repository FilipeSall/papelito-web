"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ProfileAddressBook } from "./profile-address-book";
import { useProfileShell } from "./profile-shell-provider";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";

function ProfileAddressesPageContentInner() {
  const profile = useProfileShell();
  const searchParams = useSearchParams();
  const openEditorOnMount = searchParams.get("openEditor") === "1";

  return (
    <ProfileAddressBook
      company={profile.company}
      customer={profile.customer}
      openEditorOnMount={openEditorOnMount}
    />
  );
}

function ProfileAddressesPageContentContent() {
  return (
    <Suspense fallback={null}>
      <ProfileAddressesPageContentInner />
    </Suspense>
  );
}

/**
 * O boundary é obrigatório: este componente chama `useSearchParams()` e, sem ele, o `next build`
 * falha no prerender da rota com `missing-suspense-with-csr-bailout`. Fica embutido aqui, e não na
 * página, para não depender de cada chamador lembrar — mesmo padrão do `NavigationLoader`.
 */
export function ProfileAddressesPageContent() {
  return (
    <Suspense fallback={<LogoSpinnerLoader className="min-h-[50vh]" label="Carregando" />}>
      <ProfileAddressesPageContentContent />
    </Suspense>
  );
}
