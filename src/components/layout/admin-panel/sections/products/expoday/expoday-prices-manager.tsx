"use client";

import { TriangleAlert } from "lucide-react";

import type { ExpoPricesSnapshot } from "@/features/expocannabis/types/admin-prices";

import { AdminToast, HardPanel, InlineAlert } from "../../../primitives";

import { ExpodayKitPanel } from "./expoday-kit-panel";
import { ExpodayPriceList } from "./expoday-price-list";
import { ExpodayPublishBar } from "./expoday-publish-bar";
import { ExpodaySalesPanel } from "./expoday-sales-panel";
import { useExpodayPrices } from "./use-expoday-prices";

const PUBLISHED_AT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function lastPublishedText(snapshot: ExpoPricesSnapshot): string {
  if (snapshot.version === 0 || !snapshot.updatedAt) return "";
  const when = PUBLISHED_AT.format(new Date(snapshot.updatedAt));
  return snapshot.updatedBy ? `Última publicação em ${when} por ${snapshot.updatedBy}.` : `Última publicação em ${when}.`;
}

function LoadedManager({ initialSnapshot }: Readonly<{ initialSnapshot: ExpoPricesSnapshot }>) {
  const prices = useExpodayPrices(initialSnapshot);
  const { toast } = prices;

  return (
    <div className="space-y-7">
      <HardPanel accent="yellow">
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ExpodaySalesPanel sales={prices.snapshot.sales} />
          <div className="border-t-2 border-[#1a1a1a] pt-5 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-6">
            <ExpodayKitPanel
              available={prices.snapshot.kit.available}
              disabled={prices.saving}
              invalid={prices.kitPctInvalid}
              onChange={prices.setKitPctOff}
              pctOff={prices.draft.kitPctOff}
              unitCents={prices.kitUnitCents}
            />
          </div>
        </div>
      </HardPanel>

      {prices.error ? (
        <InlineAlert icon={TriangleAlert} tone="critical">
          {prices.error}
        </InlineAlert>
      ) : null}

      <ExpodayPriceList
        changedIds={prices.changedIds}
        disabled={prices.saving}
        draft={prices.draft}
        invalidIds={prices.invalidIds}
        onPriceChange={prices.setPrice}
        snapshot={prices.snapshot}
      />

      <ExpodayPublishBar
        blocked={prices.invalidIds.length > 0 || prices.kitPctInvalid}
        changeCount={prices.changeCount}
        lastPublished={lastPublishedText(prices.snapshot)}
        onDiscard={prices.discard}
        onPublish={() => {
          void prices.publish();
        }}
        saving={prices.saving}
      />

      {toast.toast ? (
        <AdminToast description={toast.toast.description} onClose={toast.dismissToast} title={toast.toast.title} visible={toast.isVisible} />
      ) : null}
    </div>
  );
}

type ExpodayPricesManagerProps = {
  /** Snapshot lido do WordPress no servidor; `null` quando a leitura falhou. */
  initialSnapshot: ExpoPricesSnapshot | null;
};

/**
 * Aba ExpoDay de Produtos: vendas do estande, desconto do Kit Premium e preço do evento por
 * produto, com publicação explícita. Sem snapshot, mostra o erro em vez de uma lista vazia que
 * pareceria "nenhum produto".
 */
export function ExpodayPricesManager({ initialSnapshot }: Readonly<ExpodayPricesManagerProps>) {
  if (!initialSnapshot) {
    return (
      <InlineAlert icon={TriangleAlert} tone="critical">
        Não foi possível carregar os preços do estande. Recarregue a página; se continuar, confira se a venda do evento está configurada.
      </InlineAlert>
    );
  }

  return <LoadedManager initialSnapshot={initialSnapshot} />;
}
