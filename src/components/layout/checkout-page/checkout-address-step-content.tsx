"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowRightIcon } from "@/components/ui/icons";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { useCartStore } from "@/features/cart";
import { getShippingQuote, useCheckoutAddressForm, useCheckoutStore } from "@/features/checkout";
import { toGa4Item } from "@/lib/analytics/ga4-ecommerce";
import { useEcommerceEventOnce } from "@/lib/analytics/use-ecommerce-event-once";
import { formatBRL } from "@/lib/format-currency";
import { BRAZIL_STATES } from "./checkout-constants";
import { CheckoutCustomSelect } from "./checkout-custom-select";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutField } from "./checkout-field";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { formatBusinessDays } from "@/features/shipping/utils/format-business-days";

type ShippingStatus = "idle" | "loading" | "success" | "error";
type ShippingQuoteKey = readonly [
  "shippingQuote",
  number,
  string,
  string,
];

function resolveCartVendorId(items: ReturnType<typeof useCartStore.getState>["items"]) {
  const vendorIds = items
    .map((item) => item.vendorId)
    .filter((vendorId): vendorId is number => typeof vendorId === "number" && vendorId > 0);
  const uniqueVendorIds = new Set(vendorIds);

  return vendorIds.length === items.length && uniqueVendorIds.size === 1
    ? vendorIds[0]
    : null;
}

function shouldShowShippingName(service: string, name: string) {
  return name.trim().toLowerCase() !== service.trim().toLowerCase();
}

type CheckoutAddressStepContentProps = {
	company?: { legalName: string; cnpj: string } | null;
};

export function CheckoutAddressStepContent({
	company = null,
}: CheckoutAddressStepContentProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);

  const beginCheckoutPayload = useMemo(
    () =>
      items.map((item) =>
        toGa4Item({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
        }),
      ),
    [items],
  );

  useEcommerceEventOnce(
    "begin_checkout",
    beginCheckoutPayload,
    items.length > 0 ? "checkout" : null,
  );
  const shippingQuoteState = useCheckoutStore((state) => state.shippingQuote);
  const selectedShippingQuote = shippingQuoteState.selectedOption;
  const currentShippingQuote = shippingQuoteState.quote;
  const setShippingQuote = useCheckoutStore((state) => state.setShippingQuote);
  const setSelectedShippingQuote = useCheckoutStore((state) => state.setSelectedShippingQuote);
  const clearShippingQuote = useCheckoutStore((state) => state.clearShippingQuote);
  const previousSelectedShippingCodeRef = useRef<string | null>(null);

  const {
    form,
    isFormValid,
    cepLoading,
    cepError,
    updateField,
    handleZipCodeChange,
    handleNumberChange,
  } = useCheckoutAddressForm();

  const destinationCep = form.zipCode.replace(/\D/g, "");
  const vendorId = useMemo(() => resolveCartVendorId(items), [items]);
  const quoteItems = useMemo(
    () =>
      items
        .map((item) => ({
          productId: Number(item.id),
          qty: item.quantity,
        }))
        .filter((item) => Number.isInteger(item.productId) && item.productId > 0),
    [items],
  );
  const quoteItemsKey = useMemo(
    () =>
      items
        .map((item) => `${item.id}:${item.quantity}`)
        .sort()
        .join("|"),
    [items],
  );
  const shouldQuoteShipping =
    Boolean(vendorId) &&
    destinationCep.length === 8 &&
    items.length > 0 &&
    quoteItems.length === items.length;
  const shippingQuoteKey: ShippingQuoteKey | null =
    shouldQuoteShipping && vendorId
      ? ["shippingQuote", vendorId, destinationCep, quoteItemsKey]
      : null;
  const shippingQuoteRequestKey = shippingQuoteKey ? shippingQuoteKey.join("|") : null;

  useEffect(() => {
    if (selectedShippingQuote?.code) {
      previousSelectedShippingCodeRef.current = selectedShippingQuote.code;
    }
  }, [selectedShippingQuote?.code]);

  useEffect(() => {
    clearShippingQuote();
  }, [clearShippingQuote, shippingQuoteRequestKey]);

  const shippingQuote = useSWR(
    shippingQuoteKey,
    ([, currentVendorId, currentDestinationCep]) =>
      getShippingQuote({
        vendorId: currentVendorId,
        destinationCep: currentDestinationCep,
        items: quoteItems,
      }),
    {
      onError: () => clearShippingQuote(),
      onSuccess: (result) => {
        setShippingQuote(result);

        const preferredCode = previousSelectedShippingCodeRef.current;

        if (!preferredCode) {
          setSelectedShippingQuote(null);
          return;
        }

        const matchedOption = result.options.find(
          (option) => option.code === preferredCode,
        );

        if (!matchedOption) {
          setSelectedShippingQuote(null);
          previousSelectedShippingCodeRef.current = null;
          return;
        }

        previousSelectedShippingCodeRef.current = matchedOption.code;
        setSelectedShippingQuote(matchedOption);
      },
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );
  const shippingOptions = currentShippingQuote?.options ?? [];
  const invalidProductIdsForShipping =
    vendorId && destinationCep.length === 8 && quoteItems.length !== items.length;
  const isShippingLoading =
    shouldQuoteShipping &&
    !invalidProductIdsForShipping &&
    !currentShippingQuote &&
    shippingQuote.isValidating;
  const shippingStatus: ShippingStatus = invalidProductIdsForShipping
    ? "error"
    : isShippingLoading
      ? "loading"
      : shippingQuote.error
        ? "error"
      : shippingOptions.length > 0
          ? "success"
          : "idle";
  const shippingError =
    invalidProductIdsForShipping
      ? "Carrinho contém produtos sem identificador válido para cotar frete."
      : shippingQuote.error instanceof Error
        ? shippingQuote.error.message
        : null;
  const shouldBlockForShipping =
    shouldQuoteShipping && (shippingStatus !== "success" || !selectedShippingQuote);
  const showShippingLoadingFeedback = shouldQuoteShipping && shippingStatus === "loading";
  // Botão desabilitado sem explicação deixava o comprador olhando para um controle cinza sem
  // saber o que faltava — endereço incompleto e frete não escolhido são indistinguíveis.
  const blockedReason = !isFormValid
    ? "Preencha CEP, rua, número, bairro, cidade e estado para continuar."
    : shouldBlockForShipping
      ? showShippingLoadingFeedback
        ? "Aguarde a cotação do frete terminar."
        : "Escolha uma opção de entrega para continuar."
      : null;

  async function handleAdvance() {
    router.push("/checkout/pagamento");
  }

  if (items.length === 0) return <CheckoutEmptyCart />;

  return (
    <main className="bg-bg-light">
      <CheckoutHeader backHref="/carrinho" backLabel="Voltar para carrinho" currentStep={1} />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,299px)]">
          <form className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[20px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
              Endereço de entrega
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
              <CheckoutField
                label="CEP"
                placeholder="00000-000"
                value={form.zipCode}
                isLoading={cepLoading}
                errorMessage={cepError}
                onChange={handleZipCodeChange}
              />

				<div className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] p-4 text-sm md:col-span-2"><p className="font-black uppercase text-brand-dark">Comprando em nome de</p><p className="mt-2 font-medium">{company?.legalName}</p><p>CNPJ: {company?.cnpj}</p></div>

              <div className="md:col-span-2">
                <CheckoutField
                  label="Rua / Logradouro"
                  placeholder="Nome da rua"
                  value={form.street}
                  onChange={(value) => updateField("street", value)}
                />
              </div>

              <CheckoutField
                label="Número"
                placeholder="Ex: 123"
                value={form.number}
                onChange={handleNumberChange}
              />

              <CheckoutField
                label="Complemento"
                placeholder="Apto, bloco... (opcional)"
                value={form.complement}
                onChange={(value) => updateField("complement", value)}
              />

              <CheckoutField
                label="Bairro"
                placeholder="Nome do bairro"
                value={form.neighborhood}
                onChange={(value) => updateField("neighborhood", value)}
              />

              <CheckoutField
                label="Cidade"
                placeholder="Nome da cidade"
                value={form.city}
                onChange={(value) => updateField("city", value)}
              />

              <CheckoutCustomSelect
                label="Estado"
                options={BRAZIL_STATES}
                placeholder="Selecione"
                value={form.state}
                onChange={(value) => updateField("state", value)}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <p className="text-xs font-black uppercase tracking-[0.6px] text-brand-dark">
                Frete Correios
              </p>

              {!vendorId ? (
                <p className="mt-2 text-sm leading-5 text-text-tertiary">
                  A cotação por vendor será ativada quando o carrinho carregar o vendor escolhido.
                </p>
              ) : destinationCep.length !== 8 ? (
                <p className="mt-2 text-sm leading-5 text-text-tertiary">
                  Informe um CEP válido para cotar PAC e SEDEX.
                </p>
              ) : shippingStatus === "loading" ? (
                <p className="mt-2 text-sm leading-5 text-text-tertiary">
                  Cotando frete nos Correios...
                </p>
              ) : shippingStatus === "error" ? (
                <p className="mt-2 text-sm leading-5 text-[#B42318]">
                  {shippingError ?? "Não foi possível cotar o frete."}
                </p>
              ) : shippingOptions.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {shippingOptions.map((option) => {
                    const isSelected = selectedShippingQuote?.code === option.code;

                    return (
                      <button
                        key={option.code}
                        type="button"
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-brand-dark bg-white shadow-sm"
                            : "border-[#E5E7EB] bg-white/70 hover:border-brand-dark/30"
                        }`}
                        onClick={() => {
                          previousSelectedShippingCodeRef.current = option.code;
                          setSelectedShippingQuote(option);
                        }}
                      >
                        <span>
                          <span className="block text-sm font-black text-brand-dark">
                            {option.service}
                          </span>
                          {shouldShowShippingName(option.service, option.name) ? (
                            <span className="block text-xs text-text-secondary">
                              {option.name}
                            </span>
                          ) : null}
                          <span className="block text-xs text-text-tertiary">
                            {option.deliveryTime
                              ? formatBusinessDays(option.deliveryTime)
                              : "Prazo sob consulta"}
                          </span>
                        </span>
                        <span className="text-sm font-black text-brand-dark">
                          {formatBRL(option.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {showShippingLoadingFeedback ? (
              <LogoSpinnerLoader
                className="mt-4 rounded-[14px] border border-[#E5E7EB] bg-[#FFFCF0] px-4 py-4"
                label=""
                layout="stacked"
                message="Carregando opções de entrega..."
                size="sm"
              />
            ) : null}

            {blockedReason ? (
              <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                {blockedReason}
              </p>
            ) : null}

            <button
              type="button"
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
				disabled={!isFormValid || shouldBlockForShipping}
              onClick={handleAdvance}
            >
					Próximo: Pagamento
              <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
            </button>
          </form>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
