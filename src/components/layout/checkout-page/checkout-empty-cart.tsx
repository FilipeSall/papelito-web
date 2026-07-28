import Link from "next/link";

export function CheckoutEmptyCart() {
  return (
    <main className="bg-bg-light">
      <section className="bg-brand-dark">
        <div className="mx-auto w-full max-w-391 px-6 pb-7 pt-8 md:px-8 md:pb-8 md:pt-10">
          <h1 className="text-4xl font-black uppercase leading-10 tracking-[0.3691px] text-white">
            Checkout
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-8 md:px-8">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
          <p className="text-base text-text-tertiary">
            Seu carrinho está vazio. Adicione produtos antes de continuar o checkout.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-brand-yellow px-6 text-sm font-black uppercase tracking-[-0.1504px] text-brand-dark transition hover:brightness-95"
            href="/produtos"
          >
            Ir para produtos
          </Link>
        </div>
      </section>
    </main>
  );
}
