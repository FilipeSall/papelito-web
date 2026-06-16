import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { NoCepNotice, VendorPickerList } from "@/components/active-vendor";
import type { VendorPickerOption } from "@/components/active-vendor";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getProductDetail } from "@/features/catalog/services/get-product-detail";
import { getActiveVendor, getProductVendorOptions } from "@/features/active-vendor/server";
import { authOptions } from "@/lib/auth";

interface EscolherVendorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EscolherVendorPage({ params }: EscolherVendorPageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user || !session.accessToken) {
    redirect(`/entrar?callbackUrl=/produtos/${id}/escolher-vendor`);
  }

  const product = await getProductDetail(id);
  if (!product) {
    notFound();
  }

  const productId = Number(product.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const { cep } = await getAccountCoverageCepContext();

  const backToProductHref = `/produtos/${product.id}`;

  return (
    <main className="bg-bg-light">
      <section className="bg-brand-dark">
        <div className="mx-auto w-full max-w-391 px-6 pb-6 pt-8 md:px-8 md:pb-8 md:pt-10">
          <Link
            href={backToProductHref}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-yellow/80 transition hover:text-brand-yellow"
          >
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
            Voltar para o produto
          </Link>
          <h1 className="mt-3 text-3xl font-black uppercase leading-9 tracking-[0.3691px] text-white md:text-4xl md:leading-10">
            Escolher <span className="text-brand-yellow">vendor</span>
          </h1>
          <p className="mt-2 text-sm text-white/70 md:text-base">
            {product.name} — selecione abaixo o vendor que vai atender este produto na sua região.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-391 px-6 py-10 md:px-8">
        {cep ? (
          <ProductVendorOptions productId={productId} cep={cep} productName={product.name} />
        ) : (
          <NoCepNotice
            title="Cadastre um CEP para escolher um vendor"
            description="Sem CEP cadastrado não conseguimos calcular distância e cobertura. Cadastre seu endereço para continuar."
          />
        )}
      </section>
    </main>
  );
}

async function ProductVendorOptions({
  productId,
  cep,
  productName,
}: {
  productId: number;
  cep: string;
  productName: string;
}) {
  const activeResult = await getActiveVendor();
  const activeVendorId = activeResult.ok ? activeResult.vendor.vendorId : null;

  const options = await getProductVendorOptions({ productId, cep, activeVendorId });

  const vendors: VendorPickerOption[] = options.map((option) => ({
    vendorId: option.vendorId,
    storeName: option.storeName,
    city: option.city,
    state: option.state,
    distanceKm: option.distanceKm,
    leadTimeDays: option.leadTimeDays,
    qty: option.qty,
    isActive: option.isActive,
    isNearest: option.isNearest,
  }));

  return (
    <VendorPickerList
      vendors={vendors}
      emptyMessage={`Nenhum vendor com estoque de "${productName}" atende sua região no momento.`}
    />
  );
}
