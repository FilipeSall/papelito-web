import Link from "next/link";
import { Undo2 } from "lucide-react";

import { ProfilePageTitle, ProfilePanel, ReturnCancelButton } from "@/components/layout/profile-page";
import { returnReasonLabel, returnStatusMeta } from "@/features/returns/return-status";
import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";
import { mapVendorReturn } from "@/features/returns/services/get-vendor-returns";

export const dynamic = "force-dynamic";

// O WordPress só aceita cancelamento antes da postagem; espelhar a mesma lista
// evita oferecer um botao que voltaria 409.
const CANCELLABLE = new Set(["requested", "awaiting_reverse_authorization", "awaiting_posting"]);

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
  year: "numeric",
});

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export default async function ProfileReturnsPage() {
  const session = await getUserApiSession();
  const result =
    "error" in session
      ? null
      : await wpRest<{ items?: Array<Record<string, unknown>> }>("/papelito/v1/profile/me/returns", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
  const items = result?.ok && Array.isArray(result.data.items) ? result.data.items.map(mapVendorReturn) : [];

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <ProfilePageTitle title="Minhas devoluções" />

      <ProfilePanel tone="white">
        <div className="px-5 py-6 md:px-7">
          {items.length === 0 ? (
            <div className="py-6 text-center">
              <Undo2 aria-hidden className="mx-auto h-7 w-7 text-[#1a1a1a]" strokeWidth={2.2} />
              <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
                Você ainda não pediu nenhuma devolução
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#1a1a1a]/72">
                A devolução é aberta na página do pedido, dentro do prazo contado a partir da entrega.
              </p>
              <Link
                className="mt-5 inline-block text-xs font-black uppercase tracking-[0.18em] text-[#1a1a1a] underline underline-offset-4"
                href="/perfil"
              >
                Ver meus pedidos
              </Link>
            </div>
          ) : (
            <ul className="divide-y-2 divide-[#1a1a1a]/10">
              {items.map((item) => {
                const meta = returnStatusMeta(item.status);
                return (
                  <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 first:pt-0" key={item.id}>
                    <div className="min-w-0">
                      <Link
                        className="text-sm font-black uppercase tracking-tight text-[#1a1a1a] underline-offset-4 hover:underline"
                        href={`/perfil/devolucoes/${item.id}`}
                      >
                        Pedido #{item.orderId}
                      </Link>
                      <p className="mt-1 text-xs font-semibold text-[#1a1a1a]/70">
                        {returnReasonLabel(item.reason)} · aberta em {formatDate(item.requestedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]">
                        {meta.label}
                      </p>
                      {CANCELLABLE.has(item.status) ? <ReturnCancelButton returnId={item.id} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ProfilePanel>
    </main>
  );
}
