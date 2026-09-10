import { redirect } from "next/navigation";

/**
 * Um pedido passou a poder ter vários chamados, então esta URL deixou de endereçar um recurso.
 * Redireciona para a lista filtrada pelo pedido, preservando os links já enviados por notificação.
 */
export default async function OrderSupportRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/perfil/chamados?pedido=${encodeURIComponent(id)}`);
}
