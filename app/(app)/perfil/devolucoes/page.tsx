import { HardPanel } from "@/components/layout/admin-panel/primitives";
import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

type ReturnItem = { id?: number; orderId?: number; requestedAt?: string; status?: string };

export const dynamic = "force-dynamic";

export default async function ProfileReturnsPage() {
  const session = await getUserApiSession();
  const result = "error" in session ? null : await wpRest<{ items?: ReturnItem[] }>("/papelito/v1/profile/me/returns", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  const items = result?.ok ? result.data.items ?? [] : [];
  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <header><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a1a1a]/60">Pós-venda</p><h1 className="mt-2 text-4xl font-black tracking-tight">Minhas devoluções</h1><p className="mt-2 text-sm text-[#1a1a1a]/72">Acompanhe a autorização reversa, postagem, recebimento e estorno.</p></header>
      <HardPanel accent="black"><div className="px-5 py-6 md:px-7">{items.length === 0 ? <p className="text-sm text-[#1a1a1a]/72">Você ainda não tem devoluções.</p> : <ul className="space-y-3">{items.map((item) => <li className="border-b border-dashed border-black/20 pb-3 text-sm" key={item.id}><strong>Pedido #{item.orderId}</strong><span className="ml-3 uppercase text-[#1a1a1a]/65">{item.status}</span><span className="ml-3 text-[#1a1a1a]/65">{item.requestedAt}</span></li>)}</ul>}</div></HardPanel>
    </main>
  );
}
