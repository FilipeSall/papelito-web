import { redirect } from "next/navigation";

/** Ver `app/(app)/perfil/pedidos/[id]/suporte/page.tsx`: a URL por pedido virou lista filtrada. */
export default async function VendorOrderSupportRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/vendor/chamados?pedido=${encodeURIComponent(id)}`);
}
