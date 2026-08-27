import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { NoCepNotice, VendorPickerList, type VendorPickerOption } from "@/components/active-vendor";
import { getActiveVendor, getProductVendorOptions } from "@/features/active-vendor/server";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getKitDetail } from "@/features/catalog/services/get-kit-detail";
import { authOptions } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Escolher vendor");

export default async function ChooseKitVendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.accessToken) redirect(`/entrar?callbackUrl=/kits/${slug}/escolher-vendor`);

  const kit = await getKitDetail(slug);
  if (!kit) notFound();
  const productId = Number(kit.id);
  const { cep } = await getAccountCoverageCepContext();

  return (
    <main className="bg-bg-light">
      <section className="bg-brand-dark">
        <div className="mx-auto w-full max-w-391 px-6 pb-6 pt-8 md:px-8 md:pb-8 md:pt-10">
          <Link href={`/kits/${slug}`} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-yellow/80 transition hover:text-brand-yellow">
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Voltar para o Kit
          </Link>
          <h1 className="mt-3 text-3xl font-black uppercase leading-9 tracking-[0.3691px] text-white md:text-4xl md:leading-10">Escolher <span className="text-brand-yellow">vendor</span></h1>
          <p className="mt-2 text-sm text-white/70 md:text-base">{kit.name} — selecione o vendor que atenderá este Kit na sua região.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-391 px-6 py-10 md:px-8">
        {cep ? <KitVendorOptions productId={productId} cep={cep} productName={kit.name} /> : <NoCepNotice title="Cadastre um CEP para escolher um vendor" description="Sem CEP cadastrado não conseguimos calcular distância e cobertura. Cadastre seu endereço para continuar." />}
      </section>
    </main>
  );
}

async function KitVendorOptions({ productId, cep, productName }: { productId: number; cep: string; productName: string }) {
  const activeResult = await getActiveVendor();
  const options = await getProductVendorOptions({ productId, cep, activeVendorId: activeResult.ok ? activeResult.vendor.vendorId : null });
  const vendors: VendorPickerOption[] = options.map((option) => ({ ...option }));
  return <VendorPickerList vendors={vendors} emptyMessage={`Nenhum vendor com estoque de "${productName}" atende sua região no momento.`} />;
}
