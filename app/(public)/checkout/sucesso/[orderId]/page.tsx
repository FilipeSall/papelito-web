import { notFound, redirect } from "next/navigation";

import { CheckoutSuccessContent } from "@/components/layout/checkout-page/checkout-success-content";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";
import { getProfileOrderDetail } from "@/features/orders";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Pedido confirmado");

type CheckoutSuccessPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutSuccessPage({
  params,
}: CheckoutSuccessPageProps) {
  await requireCheckoutCustomer("/checkout");

  const { orderId } = await params;
  const order = await getProfileOrderDetail(orderId);

  if (!order) {
    notFound();
  }

  const paymentState = order.payment.state ?? "";

  if (paymentState !== "paid" && paymentState !== "captured") {
    if (order.payment.pix || order.payment.boleto) {
      redirect(`/checkout/pagamento/${order.id}`);
    }

    redirect(`/perfil/pedidos/${order.id}`);
  }

  return <CheckoutSuccessContent order={order} />;
}
