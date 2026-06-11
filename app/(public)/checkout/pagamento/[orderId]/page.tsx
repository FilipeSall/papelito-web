import { notFound } from "next/navigation";

import { CheckoutPendingPayment } from "@/components/layout/checkout-page/checkout-pending-payment";
import { getProfileOrderDetail } from "@/features/orders";
import { requireCheckoutCustomer } from "@/features/checkout/server/require-checkout-customer";

type CheckoutPendingPaymentPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutPendingPaymentPage({
  params,
}: CheckoutPendingPaymentPageProps) {
  await requireCheckoutCustomer("/checkout");

  const { orderId } = await params;
  const order = await getProfileOrderDetail(orderId);

  if (!order) {
    notFound();
  }

  return (
    <main className="bg-bg-light">
      <section className="mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-391 items-center px-6 py-12 md:px-8">
        <CheckoutPendingPayment initialOrder={order} />
      </section>
    </main>
  );
}
