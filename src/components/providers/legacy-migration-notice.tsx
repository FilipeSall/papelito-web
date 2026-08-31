"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Building2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthSession } from "@/hooks/use-auth-session";

const protectedPrefixes = ["/perfil", "/checkout", "/carrinho", "/dashboard"];

function formatLimit(value: string | null | undefined) {
  if (!value) return "a data informada pela Papelito";
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return "a data informada pela Papelito";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function modalKey(level: string, graceEndsAt: string | null | undefined) {
  return `papelito:legacy-migration-modal:${level}:${graceEndsAt ?? "open"}`;
}

export function LegacyMigrationNotice() {
  const pathname = usePathname();
  const { b2b, isLegacyMigrationVisible, status } = useAuthSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const inProtectedArea = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const limit = formatLimit(b2b?.legacyGraceEndsAt);
  const level = b2b?.legacyWarningLevel ?? "none";
  const pending =
    b2b?.legacyMigrationStatus === "pending_company_review" ||
    b2b?.legacyMigrationStatus === "pending_membership_approval";
  const message = pending
    ? "Sua solicitação empresarial está em análise. Você continua comprando pelo fluxo atual durante o prazo de graça."
    : `A Papelito passará a operar somente com contas empresariais. Atualize seu cadastro e vincule sua conta a um CNPJ até ${limit}.`;
  const shouldRender = status === "authenticated" && inProtectedArea && isLegacyMigrationVisible;

  const tone = useMemo(() => {
    if (level === "urgent") return "border-[#A11D1D] bg-[#FFF1F1] text-[#5F1111]";
    if (level === "warning") return "border-[#B7791F] bg-[#FFF8E6] text-[#61420E]";
    return "border-[#1F6F68] bg-[#ECFFFB] text-[#123F3B]";
  }, [level]);

  useEffect(() => {
    if (!shouldRender || pending) return;
    const key = modalKey(level, b2b?.legacyGraceEndsAt);
    if (window.localStorage.getItem(key) === "1") return;
    window.localStorage.setItem(key, "1");
    const timer = window.setTimeout(() => setModalOpen(true), 0);
    void fetch("/api/legacy-migration/warning-viewed", { method: "POST" }).catch(() => undefined);
    return () => window.clearTimeout(timer);
  }, [b2b?.legacyGraceEndsAt, level, pending, shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {!bannerDismissed ? (
        <div
          className={`mx-auto mt-4 flex w-[min(1180px,calc(100%-24px))] items-start gap-3 border-2 px-4 py-3 text-sm shadow-[4px_4px_0_rgba(0,0,0,0.12)] ${tone}`}
          role="status"
        >
          <Building2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-snug">{message}</p>
            <Link
              href="/perfil/empresa"
              className="mt-2 inline-flex text-xs font-black uppercase tracking-[0.08em] underline underline-offset-4"
            >
              Atualizar cadastro empresarial
            </Link>
          </div>
          <button
            type="button"
            aria-label="Fechar aviso"
            className="grid h-8 w-8 shrink-0 place-items-center border border-current"
            onClick={() => setBannerDismissed(true)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legacy-migration-title"
        >
          <div className="w-full max-w-md border-2 border-brand-dark bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.22)]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-[#B7791F]" aria-hidden="true" />
              <div>
                <h2 id="legacy-migration-title" className="text-lg font-black text-brand-dark">
                  Cadastro empresarial necessário
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#3B332B]">{message}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/perfil/empresa"
                className="inline-flex h-10 items-center justify-center bg-brand-dark px-4 text-sm font-black text-white"
              >
                Atualizar cadastro
              </Link>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center border-2 border-brand-dark px-4 text-sm font-black text-brand-dark"
                onClick={() => setModalOpen(false)}
              >
                Continuar agora
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
