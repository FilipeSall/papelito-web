"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";

import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import { expocannabisClient } from "@/features/expocannabis/client/expocannabis-client";
import type { AttendanceAction, AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext } from "@/features/expocannabis/types/context";
import type { BuyerLookup } from "@/features/expocannabis/types/order";
import { parseStockIssues } from "@/features/expocannabis/utils/stock-issues";
import {
  formatPhone,
  missingSummary,
  onlyDigits,
  validateDetails,
  type DetailsErrors,
} from "@/features/expocannabis/utils/details-validation";
import { formatCep, formatCnpj } from "@/lib/validation/brazilian-documents";

import { CheckoutCta, CheckoutLayout, StickyAside } from "./checkout-layout";
import { OrderSummary } from "./order-summary";
import { RadioCard } from "./radio-card";
import { SectionLabel } from "./section-label";
import { TextField } from "./text-field";
import { WarnBox } from "./warn-box";

type DetailsScreenProps = {
  context: EventContext;
  state: AttendanceState;
  dispatch: Dispatch<AttendanceAction>;
};

type Failure = { text: string; retry: boolean };

type AddressProps = { state: AttendanceState; dispatch: Dispatch<AttendanceAction>; errors: DetailsErrors };

const SHIPPING_FAILURE: Failure = { text: "Não conseguimos calcular o frete pra esse CEP.", retry: true };

function quoteItems(qty: Record<number, number>) {
  return Object.entries(qty).map(([productId, value]) => ({ productId: Number(productId), qty: value }));
}

function buyerAddressText(address: BuyerLookup["address"]): string {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  const cityState = [address.city, address.state].filter(Boolean).join("/");
  const cep = address.cep ? `CEP ${formatCep(address.cep)}` : "";
  return [street, address.neighborhood, cityState, cep].filter(Boolean).join(" · ");
}

function CnpjAddress({ state, dispatch, errors }: Readonly<AddressProps>) {
  const { delivery } = state;
  const setField = (field: "number" | "complement" | "neighborhood") => (value: string) => dispatch({ type: "set-delivery", delivery: { [field]: value } });
  return (
    <div className="expo-reveal grid gap-3.5 min-[768px]:grid-cols-3">
      <TextField id="expo-number" label="Número" value={delivery.number} onChange={setField("number")} error={errors.number} />
      <TextField id="expo-complement" label="Complemento (opcional)" value={delivery.complement} onChange={setField("complement")} />
      <TextField id="expo-neighborhood" label="Bairro" value={delivery.neighborhood} onChange={setField("neighborhood")} error={errors.neighborhood} />
    </div>
  );
}

type CepStatus = "idle" | "searching" | "found";

const CEP_BUTTON_LABEL: Record<CepStatus, string> = { idle: "Buscar pelo CEP", searching: "Buscando…", found: "Endereço preenchido ✓" };
const CEP_HINT: Record<CepStatus, string> = {
  idle: "Digite o CEP e a gente completa rua, bairro e cidade.",
  searching: "Buscando o endereço…",
  found: "Achamos! Agora coloca o número.",
};

function CepRow({ cep, status, error, invalid, shakeKey, onChange, onSearch }: Readonly<{ cep: string; status: CepStatus; error: string; invalid: boolean; shakeKey: number; onChange: (value: string) => void; onSearch: () => void }>) {
  const hint = error || CEP_HINT[status];
  return (
    <>
      <div key={shakeKey} className={`flex items-end gap-3 ${error ? "expo-shake" : ""}`}>
        <TextField id="expo-cep" label="CEP" inputMode="numeric" placeholder="00000-000" value={formatCep(cep)} onChange={onChange} invalid={invalid} describedBy="expo-cep-msg" className="w-55 flex-none" />
        <button
          type="button"
          onClick={onSearch}
          disabled={status === "searching"}
          className="min-h-13 flex-none rounded-lg bg-[#F4F4F5] px-4 text-[15px] font-extrabold transition-transform duration-120 enabled:active:scale-97 disabled:opacity-70 motion-reduce:transition-none"
        >
          {CEP_BUTTON_LABEL[status]}
        </button>
      </div>
      <p id="expo-cep-msg" aria-live="polite" className={`-mt-1.5 text-sm font-bold ${error ? "text-[#B42318]" : ""}`}>
        {hint}
      </p>
    </>
  );
}

function OtherAddress({ state, dispatch, errors }: Readonly<AddressProps>) {
  const [cepError, setCepError] = useState("");
  const [status, setStatus] = useState<CepStatus>("idle");
  const [flash, setFlash] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const { delivery } = state;
  const setField = (field: keyof AttendanceState["delivery"]) => (value: string) => dispatch({ type: "set-delivery", delivery: { [field]: value } });
  const failCep = (message: string) => {
    setCepError(message);
    setShakeKey((key) => key + 1);
  };

  const changeCep = (value: string) => {
    setCepError("");
    setStatus("idle");
    setField("cep")(onlyDigits(value).slice(0, 8));
  };

  const searchCep = async () => {
    const digits = onlyDigits(delivery.cep);
    if (digits.length !== 8) {
      failCep("O CEP tem 8 números. Confere aí?");
      return;
    }
    setCepError("");
    setStatus("searching");
    const result = await lookupCepDetailed(digits);
    if (result.status !== "ok") {
      setStatus("idle");
      failCep("Não achamos esse CEP. Preenche o endereço à mão?");
      return;
    }
    dispatch({ type: "set-delivery", delivery: { cep: digits, ...result.data } });
    setStatus("found");
    setFlash((key) => key + 1);
  };

  return (
    <div className="expo-reveal flex flex-col gap-3.5 rounded-[10px] border-[1.5px] border-[#E4E4E7] p-4">
      <CepRow cep={delivery.cep} status={status} error={cepError || errors.cep || ""} invalid={Boolean(cepError || errors.cep)} shakeKey={shakeKey} onChange={changeCep} onSearch={searchCep} />
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-3">
        <TextField id="expo-street" label="Rua" value={delivery.street} onChange={setField("street")} error={errors.street} flash={flash} />
        <TextField id="expo-number" label="Número" value={delivery.number} onChange={setField("number")} error={errors.number} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField id="expo-complement" label="Complemento (opcional)" value={delivery.complement} onChange={setField("complement")} />
        <TextField id="expo-neighborhood" label="Bairro" value={delivery.neighborhood} onChange={setField("neighborhood")} error={errors.neighborhood} flash={flash} />
      </div>
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-3">
        <TextField id="expo-city" label="Cidade" value={delivery.city} onChange={setField("city")} error={errors.city} flash={flash} />
        <TextField id="expo-state" label="UF" maxLength={2} value={delivery.state} onChange={(value) => setField("state")(value.toUpperCase().slice(0, 2))} error={errors.state} flash={flash} />
      </div>
    </div>
  );
}

function InvoiceSection({ buyer, state, errors, dispatch }: Readonly<{ buyer: BuyerLookup } & AddressProps>) {
  const setContact = (field: "name" | "phone" | "email") => (value: string) =>
    dispatch({ type: "set-contact", contact: { [field]: field === "phone" ? onlyDigits(value).slice(0, 11) : value } });
  return (
    <section aria-label="Dados da nota fiscal" className="flex flex-col gap-3.5">
      <SectionLabel>Nota fiscal</SectionLabel>
      <div className="flex items-center justify-between gap-3 rounded-[10px] bg-[#F4F4F5] px-4 py-3.5">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[17px] font-extrabold">{buyer.legalName}</p>
          <p className="mt-0.5 text-sm font-semibold">CNPJ {formatCnpj(buyer.cnpj)}</p>
        </div>
        <button type="button" onClick={() => dispatch({ type: "change-store" })} className="inline-flex min-h-11 flex-none items-center text-[15px] font-bold underline underline-offset-3">
          Trocar loja
        </button>
      </div>
      <TextField id="expo-name" label="Nome do responsável" autoComplete="name" value={state.contact.name} onChange={setContact("name")} error={errors.name} />
      <div className="grid gap-3.5 min-[768px]:grid-cols-2">
        <TextField id="expo-phone" label="WhatsApp" inputMode="tel" placeholder="(11) 90000-0000" value={formatPhone(state.contact.phone)} onChange={setContact("phone")} error={errors.phone} />
        <TextField id="expo-email" label="E-mail para a nota" type="email" inputMode="email" placeholder="compras@loja.com.br" value={state.contact.email} onChange={setContact("email")} error={errors.email} />
      </div>
    </section>
  );
}

function DeliverySection({ buyer, state, errors, dispatch }: Readonly<{ buyer: BuyerLookup } & AddressProps>) {
  const selectMode = (mode: "cnpj" | "other") => {
    const base = mode === "cnpj" ? buyer.address : { cep: "", street: "", city: "", state: "" };
    dispatch({ type: "set-delivery", delivery: { mode, cep: base.cep, street: base.street, city: base.city, state: base.state, number: "", neighborhood: "", complement: "" } });
  };
  return (
    <section aria-labelledby="expo-delivery-title" className="flex flex-col gap-3">
      <SectionLabel id="expo-delivery-title">Endereço de entrega</SectionLabel>
      <div role="radiogroup" aria-labelledby="expo-delivery-title" className="flex flex-col gap-2.5">
        <RadioCard title="Endereço do CNPJ" sub={buyerAddressText(buyer.address)} checked={state.delivery.mode === "cnpj"} onSelect={() => selectMode("cnpj")} />
        <RadioCard title="Entregar em outro endereço" sub="Outra unidade, depósito ou endereço atualizado" checked={state.delivery.mode === "other"} onSelect={() => selectMode("other")} />
      </div>
      {state.delivery.mode === "cnpj" ? <CnpjAddress state={state} dispatch={dispatch} errors={errors} /> : <OtherAddress state={state} dispatch={dispatch} errors={errors} />}
    </section>
  );
}

/**
 * Tela 03: nota fiscal, contato do lojista e endereço de entrega.
 *
 * "Continuar" cadastra o comprador, cota com frete no servidor e só então segue para o pagamento.
 * Resposta que chega depois de a tela sair (troca de loja no meio da cotação) é descartada.
 */
export function DetailsScreen({ context, state, dispatch }: Readonly<DetailsScreenProps>) {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const mounted = useRef(true);
  const buyer = state.buyer;
  const errors = submitted ? validateDetails(state) : {};
  const summary = missingSummary(errors);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (!buyer) return null;

  const submit = async () => {
    setSubmitted(true);
    setFailure(null);
    if (missingSummary(validateDetails(state))) return;

    setBusy(true);
    const registered = await expocannabisClient.upsertBuyer({ cnpj: buyer.cnpj, name: state.contact.name.trim(), phone: state.contact.phone, email: state.contact.email.trim() });
    if (!mounted.current) return;
    if (!registered.ok) {
      setBusy(false);
      setFailure({ text: registered.message, retry: true });
      return;
    }
    dispatch({ type: "set-registered", registered: registered.data });

    const quote = await expocannabisClient.quote({ items: quoteItems(state.qty), kits: state.kits, cep: state.delivery.cep, recipientCnpj: buyer.cnpj });
    if (!mounted.current) return;
    setBusy(false);
    if (quote.ok) {
      dispatch({ type: "set-quote", quote: quote.data });
      dispatch({ type: "go", screen: 4 });
      return;
    }
    if (quote.code === "papelito_event_out_of_stock") {
      dispatch({ type: "stock-issue", products: parseStockIssues(quote.data) });
      return;
    }
    setFailure(quote.code === "papelito_event_shipping_unavailable" ? SHIPPING_FAILURE : { text: quote.message, retry: true });
  };

  const footer = (
    <>
      {summary ? <WarnBox>{summary}</WarnBox> : null}
      {failure ? (
        <WarnBox
          action={
            failure.retry ? (
              <button type="button" onClick={submit} className="min-h-11 flex-none rounded-lg bg-white px-4 text-[15px] font-extrabold text-[#231F20]">
                Tentar de novo
              </button>
            ) : null
          }
        >
          {failure.text}
        </WarnBox>
      ) : null}
      <CheckoutCta onClick={submit} disabled={busy}>
        {busy ? "Calculando o frete…" : "Continuar para pagamento"}
      </CheckoutCta>
    </>
  );

  return (
    <CheckoutLayout
      current={1}
      back={{ label: "Voltar ao pedido", onBack: () => dispatch({ type: "go", screen: 2 }) }}
      title="Dados e entrega"
      intro={<p className="mt-1.5 text-base font-medium text-[#52525B]">Confira com o lojista antes de seguir pro pagamento.</p>}
      aside={
        <StickyAside>
          <OrderSummary context={context} state={state} />
        </StickyAside>
      }
      footer={footer}
    >
      <InvoiceSection buyer={buyer} state={state} errors={errors} dispatch={dispatch} />
      <DeliverySection buyer={buyer} state={state} errors={errors} dispatch={dispatch} />
    </CheckoutLayout>
  );
}
