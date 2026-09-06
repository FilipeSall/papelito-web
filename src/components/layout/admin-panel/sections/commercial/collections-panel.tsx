"use client";

import { CalendarClock, Loader2, Save, Sparkles, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import {
  COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS,
  COLLECTIONS_CONFIG_MAX_LIMIT,
  type CollectionsConfig,
} from "@/features/catalog/types/collections-config";

import {
  AdminToast,
  FOCUS_RING,
  InlineAlert,
  PrimaryButton,
  SectionHeading,
  useAdminToast,
} from "../../primitives";


type CollectionsPanelProps = {
  initialConfig: CollectionsConfig;
  initialIssues: string[];
};

const FIELD_CLASS =
  "mt-2 h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40";

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label
      className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
      htmlFor={htmlFor}
    >
      <span className="flex h-4 items-center">{children}</span>
    </label>
  );
}

function CollectionBlock({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: typeof Sparkles;
  title: string;
}) {
  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="border-b-2 border-[#1a1a1a] px-5 py-4">
        <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {title}
        </h3>
        <p className="mt-2 max-w-xl text-xs leading-5 text-[#231f20]/70">{description}</p>
      </div>
      <div className="px-5 py-5 md:px-6">{children}</div>
    </section>
  );
}

export function CollectionsPanel({
  initialConfig,
  initialIssues,
}: Readonly<CollectionsPanelProps>) {
  const router = useRouter();
  const [newArrivalsLimit, setNewArrivalsLimit] = useState(String(initialConfig.newArrivals.limit));
  const [hasExpiration, setHasExpiration] = useState(initialConfig.newArrivals.expirationDays > 0);
  const [expirationDays, setExpirationDays] = useState(
    initialConfig.newArrivals.expirationDays > 0
      ? String(initialConfig.newArrivals.expirationDays)
      : "30",
  );
  const [hasPromotionsCap, setHasPromotionsCap] = useState(initialConfig.promotions.limit > 0);
  const [promotionsLimit, setPromotionsLimit] = useState(
    initialConfig.promotions.limit > 0 ? String(initialConfig.promotions.limit) : "12",
  );
  const [error, setError] = useState<string | null>(initialIssues[0] ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [, startTransition] = useTransition();
  const { dismissToast, isVisible, showToast, toast } = useAdminToast();

  function parseCount(value: string, minimum: number): number | null {
    if (!/^\d+$/.test(value.trim())) {
      return null;
    }

    const parsed = Number(value);

    return parsed >= minimum && parsed <= COLLECTIONS_CONFIG_MAX_LIMIT ? parsed : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const limit = parseCount(newArrivalsLimit, 1);

    if (limit === null) {
      setError(`Informe entre 1 e ${COLLECTIONS_CONFIG_MAX_LIMIT} produtos em Recém-chegados.`);

      return;
    }

    let days = 0;

    if (hasExpiration) {
      if (!/^\d+$/.test(expirationDays.trim())) {
        days = -1;
      } else {
        days = Number(expirationDays);
      }

      if (days < 1 || days > COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS) {
        setError(`Informe entre 1 e ${COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS} dias de validade.`);

        return;
      }
    }

    let promotions = 0;

    if (hasPromotionsCap) {
      const parsed = parseCount(promotionsLimit, 1);

      if (parsed === null) {
        setError(`Informe entre 1 e ${COLLECTIONS_CONFIG_MAX_LIMIT} produtos em Promoções.`);

        return;
      }

      promotions = parsed;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/collections-config", {
        body: JSON.stringify({
          newArrivals: { expirationDays: days, limit },
          promotions: { limit: promotions },
        }),
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = (await response.json().catch(() => null)) as
        | (CollectionsConfig & { message?: string })
        | null;

      if (!response.ok) {
        setError(payload?.message ?? "Não foi possível salvar a configuração das coleções.");

        return;
      }

      showToast({
        description:
          days > 0
            ? `Recém-chegados passa a mostrar até ${limit} produtos publicados nos últimos ${days} dias.`
            : `Recém-chegados passa a mostrar os ${limit} produtos mais recentes, sem prazo.`,
        title: "Coleções salvas",
      });
      startTransition(() => router.refresh());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar a configuração das coleções.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <SectionHeading
        action={
          <PrimaryButton disabled={isSaving} type="submit">
            {isSaving ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            )}
            Salvar coleções
          </PrimaryButton>
        }
        description="Recorte das duas vitrines que a plataforma calcula sozinha. A pertinência é automática; aqui você governa quantos produtos entram."
        title="Coleções automáticas"
      />

      <CollectionBlock
        description="Os produtos mais recentes do catálogo, na home e em /novidades. A ordem é sempre da publicação mais nova para a mais antiga."
        icon={Sparkles}
        title="Recém-chegados"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="new-arrivals-limit">Quantidade de produtos</FieldLabel>
            <input
              className={[FIELD_CLASS, "max-w-28", FOCUS_RING].join(" ")}
              disabled={isSaving}
              id="new-arrivals-limit"
              inputMode="numeric"
              onChange={(event) => setNewArrivalsLimit(event.target.value)}
              type="number"
              value={newArrivalsLimit}
            />
            <p className="mt-2 text-xs leading-5 text-[#231f20]/64">
              Teto da coleção inteira, de 1 a {COLLECTIONS_CONFIG_MAX_LIMIT}. A paginação de
              /novidades corre dentro dele.
            </p>
          </div>

          <div>
            <span className="flex h-4 items-center text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
              Validade
            </span>
            <div className="mt-2 space-y-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-[#1a1a1a] bg-white px-3 py-2">
                <input
                  checked={!hasExpiration}
                  className="h-4 w-4 accent-[#1a1a1a]"
                  disabled={isSaving}
                  name="new-arrivals-expiration"
                  onChange={() => setHasExpiration(false)}
                  type="radio"
                />
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                  Sem prazo de expiração
                </span>
              </label>

              <label className="flex min-h-11 cursor-pointer flex-wrap items-center gap-3 border-2 border-[#1a1a1a] bg-white px-3 py-2">
                <input
                  checked={hasExpiration}
                  className="h-4 w-4 accent-[#1a1a1a]"
                  disabled={isSaving}
                  name="new-arrivals-expiration"
                  onChange={() => setHasExpiration(true)}
                  type="radio"
                />
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                  Expira em
                </span>
                <input
                  aria-label="Dias de validade"
                  className={[
                    "h-9 w-20 rounded-none border-2 border-[#1a1a1a] bg-white px-2 text-sm text-[#1a1a1a] outline-none disabled:opacity-45",
                    FOCUS_RING,
                  ].join(" ")}
                  disabled={isSaving || !hasExpiration}
                  onChange={(event) => setExpirationDays(event.target.value)}
                  type="number"
                  value={expirationDays}
                />
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                  dias
                </span>
              </label>
            </div>
            <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#231f20]/64">
              <CalendarClock aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
              Com prazo, um produto só participa enquanto estiver dentro do período desde a
              publicação. Sem prazo, valem sempre os mais novos.
            </p>
          </div>
        </div>
      </CollectionBlock>

      <CollectionBlock
        description="Produto entra em Promoções quando tem preço promocional — seja por desconto no cadastro, seja por campanha ativa. Esse critério não muda aqui."
        icon={Tag}
        title="Promoções"
      >
        <div className="max-w-md">
          <span className="flex h-4 items-center text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
            Quantidade de produtos
          </span>
          <div className="mt-2 space-y-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-[#1a1a1a] bg-white px-3 py-2">
              <input
                checked={!hasPromotionsCap}
                className="h-4 w-4 accent-[#1a1a1a]"
                disabled={isSaving}
                name="promotions-cap"
                onChange={() => setHasPromotionsCap(false)}
                type="radio"
              />
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                Sem teto — mostra todos os elegíveis
              </span>
            </label>

            <label className="flex min-h-11 cursor-pointer flex-wrap items-center gap-3 border-2 border-[#1a1a1a] bg-white px-3 py-2">
              <input
                checked={hasPromotionsCap}
                className="h-4 w-4 accent-[#1a1a1a]"
                disabled={isSaving}
                name="promotions-cap"
                onChange={() => setHasPromotionsCap(true)}
                type="radio"
              />
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                No máximo
              </span>
              <input
                aria-label="Quantidade máxima em Promoções"
                className={[
                  "h-9 w-20 rounded-none border-2 border-[#1a1a1a] bg-white px-2 text-sm text-[#1a1a1a] outline-none disabled:opacity-45",
                  FOCUS_RING,
                ].join(" ")}
                disabled={isSaving || !hasPromotionsCap}
                onChange={(event) => setPromotionsLimit(event.target.value)}
                type="number"
                value={promotionsLimit}
              />
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                produtos
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#231f20]/64">
            Com teto, entram os mais recentes entre os elegíveis.
          </p>
        </div>
      </CollectionBlock>

      {error ? <InlineAlert tone="critical">⚠ {error}</InlineAlert> : null}

      {toast ? (
        <AdminToast
          description={toast.description}
          onClose={dismissToast}
          title={toast.title}
          visible={isVisible}
        />
      ) : null}
    </form>
  );
}
