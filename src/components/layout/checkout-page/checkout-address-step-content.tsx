"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowRightIcon } from "@/components/ui/icons";
import { LogoSpinnerLoader } from "@/components/ui/logo-spinner-loader";
import { useCartStore, useCartSummary } from "@/features/cart";
import {
  getShippingQuote,
  resolveCartVendorId,
  useCheckoutAddressForm,
  useCheckoutStore,
} from "@/features/checkout";
import { toGa4Item } from "@/lib/analytics/ga4-ecommerce";
import { useEcommerceEventOnce } from "@/lib/analytics/use-ecommerce-event-once";
import { formatDocument } from "@/features/checkout/utils/format-checkout-fields";
import { formatBRL } from "@/lib/format-currency";
import { BRAZIL_STATES } from "./checkout-constants";
import { CheckoutCompanyZipCodeButton } from "./checkout-company-zip-code-button";
import { CheckoutCustomSelect } from "./checkout-custom-select";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutField } from "./checkout-field";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { formatBusinessDays } from "@/features/shipping/utils/format-business-days";
import type { ZipRange } from "@/features/shipping/utils/zip-ranges";


/** Referência estável: uma lista nova a cada render invalidaria o memo do resumo. */
const EMPTY_ZIP_RANGES: readonly ZipRange[] = [];

type ShippingStatus = "idle" | "loading" | "success" | "error";
type ShippingQuoteKey = readonly [
  "shippingQuote",
  number,
  string,
  string,
];

function shouldShowShippingName(service: string, name: string) {
  return name.trim().toLowerCase() !== service.trim().toLowerCase();
}

type CheckoutAddressStepContentProps = {
	company?: { legalName: string; cnpj: string; zipCode?: string | null } | null;
	freeShippingMinimumCents?: number | null;
	freeShippingZipRanges?: readonly ZipRange[];
};

export function CheckoutAddressStepContent({
	company = null,
	freeShippingMinimumCents = null,
	freeShippingZipRanges = EMPTY_ZIP_RANGES,
}: CheckoutAddressStepContentProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const cartSummary = useCartSummary(freeShippingMinimumCents, { freeShippingZipRanges });
  const hasAutomaticFreeShipping = cartSummary.isFreeShippingCouponEligible;

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
            {company ? (
              <div className="mb-6 rounded-[12px] border border-[#EFF1F3] border-l-2 border-l-brand-yellow bg-[#FBFBFC] px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">
                  Comprando em nome de
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <p className="text-sm font-semibold leading-5 tracking-[-0.1504px] text-brand-dark">
                    {company.legalName}
                  </p>
                  <p className="text-xs leading-4 tabular-nums text-text-tertiary">
                    CNPJ {formatDocument(company.cnpj)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-yellow" />
              <h2 className="text-[20px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
                Endereço de entrega
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
              <CheckoutField
                label="CEP"
                placeholder="00000-000"
                value={form.zipCode}
                isLoading={cepLoading}
                errorMessage={cepError}
                onChange={handleZipCodeChange}
                action={
                  <CheckoutCompanyZipCodeButton
                    companyZipCode={company?.zipCode}
                    currentZipCode={form.zipCode}
                    isLoading={cepLoading}
                    onSync={handleZipCodeChange}
                  />
                }
              />

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
              <div className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-2 w-2 rotate-45 bg-brand-yellow" />
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-dark">
                  Frete Correios
                </p>
              </div>

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
                <p className="mt-2 flex items-start gap-1 text-sm leading-5 text-[#c0392b]" role="alert">
                  <span aria-hidden>⚠</span>
                  <span>{shippingError ?? "Não foi possível cotar o frete."}</span>
                </p>
              ) : shippingOptions.length > 0 ? (
                <div
                  aria-label="Opções de entrega"
                  className="mt-3 grid gap-2"
                  role="radiogroup"
                >
                  {shippingOptions.map((option) => {
                    const isSelected = selectedShippingQuote?.code === option.code;

                    return (
                      <button
                        aria-checked={isSelected}
                        key={option.code}
                        role="radio"
                        type="button"
                        className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-[12px] border px-4 py-3 text-left outline-none transition-[background-color,border-color,box-shadow] duration-150 focus-visible:border-brand-dark/60 focus-visible:ring-2 focus-visible:ring-brand-dark/8 ${
                          isSelected
                            ? "border-brand-dark/70 bg-white"
                            : "border-[#E8EAED] bg-white/70 hover:border-[#D6D9DE] hover:bg-white"
                        }`}
                        onClick={() => {
                          previousSelectedShippingCodeRef.current = option.code;
                          setSelectedShippingQuote(option);
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                              isSelected ? "border-[5px] border-brand-dark" : "border-[#D6D9DE]"
                            }`}
                          >
                          </span>
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
                        </span>
                        {hasAutomaticFreeShipping ? (
                          <span className="flex shrink-0 flex-col items-end gap-0.5">
                            <del className="text-xs font-semibold text-text-tertiary">
                              {formatBRL(option.price)}
                            </del>
                            <span className="animate-free-shipping text-xs font-black uppercase tracking-[0.08em] text-[#15803D]">
                              Frete grátis
                            </span>
                          </span>
                        ) : (
                          <span className="shrink-0 text-sm font-black text-brand-dark">
                            {formatBRL(option.price)}
                          </span>
                        )}
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
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark outline-none transition enabled:cursor-pointer enabled:hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand-dark/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
