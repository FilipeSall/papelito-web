import { HardPanel } from "@/components/layout/admin-panel/primitives";
import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

type ReturnItem = { id?: number; orderId?: number; requestedAt?: string; status?: string };

export const dynamic = "force-dynamic";

export default async function VendorReturnsPage() {
  await redirectIfVendorOnboardingPending("/vendor/devolucoes");
  const token = await getSellerAccessToken();
  const result = token
    ? await wpRest<{ items?: ReturnItem[] }>("/papelito/v1/vendor/me/returns", { headers: { Authorization: `Bearer ${token}` } })
    : null;
  const items = result?.ok ? result.data.items ?? [] : [];

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader eyebrow="Pós-venda" signal="devoluções" title="Devoluções" description="Acompanhe aprovações, autorizações reversas, recebimentos, inspeções e estornos manuais." />
      <HardPanel accent="black">
        <div className="px-5 py-6 md:px-7">
          {items.length === 0 ? <p className="text-sm text-[#1a1a1a]/72">Nenhuma devolução para tratar.</p> : <ul className="space-y-3">{items.map((item) => <li className="border-b border-dashed border-black/20 pb-3 text-sm" key={item.id}><strong>Pedido #{item.orderId}</strong><span className="ml-3 uppercase text-[#1a1a1a]/65">{item.status}</span><span className="ml-3 text-[#1a1a1a]/65">{item.requestedAt}</span></li>)}</ul>}
        </div>
      </HardPanel>
    </div>
  );
}
