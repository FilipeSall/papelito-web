"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";

import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import { expocannabisClient } from "@/features/expocannabis/client/expocannabis-client";
import type { AttendanceAction, AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext } from "@/features/expocannabis/types/context";
import { parseStockIssues } from "@/features/expocannabis/utils/stock-issues";
import {
  formatPhone,
  missingSummary,
  onlyDigits,
  validateDetails,
  type DetailsErrors,
} from "@/features/expocannabis/utils/details-validation";
import { formatCep, formatCnpj } from "@/lib/validation/brazilian-documents";

import { CheckoutStepper } from "./checkout-stepper";
import { OrderSummary } from "./order-summary";
import { RadioCard } from "./radio-card";
import { TextField } from "./text-field";

type DetailsScreenProps = {
  context: EventContext;
  state: AttendanceState;
  dispatch: Dispatch<AttendanceAction>;
};

type Failure = { text: string; retry: boolean };

const SHIPPING_FAILURE: Failure = { text: "Não conseguimos calcular o frete pra esse CEP.", retry: true };

function quoteItems(qty: Record<number, number>) {
  return Object.entries(qty).map(([productId, value]) => ({ productId: Number(productId), qty: value }));
}

function CnpjAddress({ state, dispatch, errors }: Readonly<{ state: AttendanceState; dispatch: Dispatch<AttendanceAction>; errors: DetailsErrors }>) {
  const { delivery } = state;
  const setField = (field: "number" | "complement" | "neighborhood") => (value: string) => dispatch({ type: "set-delivery", delivery: { [field]: value } });
  return (
    <div className="expo-rise mt-3 grid gap-3 min-[768px]:grid-cols-3">
      <TextField id="expo-number" label="Número" value={delivery.number} onChange={setField("number")} error={errors.number} />
      <TextField id="expo-complement" label="Complemento" value={delivery.complement} onChange={setField("complement")} />
      <TextField id="expo-neighborhood" label="Bairro" value={delivery.neighborhood} onChange={setField("neighborhood")} error={errors.neighborhood} />
    </div>
  );
}

function OtherAddress({ state, dispatch, errors }: Readonly<{ state: AttendanceState; dispatch: Dispatch<AttendanceAction>; errors: DetailsErrors }>) {
  const [cepError, setCepError] = useState("");
  const [searching, setSearching] = useState(false);
  const [flash, setFlash] = useState(false);
  const { delivery } = state;
  const setField = (field: keyof AttendanceState["delivery"]) => (value: string) => dispatch({ type: "set-delivery", delivery: { [field]: value } });

  const searchCep = async () => {
    const digits = onlyDigits(delivery.cep);
    if (digits.length !== 8) {
      setCepError("O CEP tem 8 números. Confere aí?");
      return;
    }
    setCepError("");
    setSearching(true);
    const result = await lookupCepDetailed(digits);
    setSearching(false);
    if (result.status !== "ok") {
      setCepError("Não achamos esse CEP. Preenche o endereço à mão?");
      return;
    }
    dispatch({ type: "set-delivery", delivery: { cep: digits, ...result.data } });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 600);
  };

  return (
    <div className="expo-rise mt-3 grid gap-3 min-[768px]:grid-cols-3">
      <div className="flex items-end gap-2 min-[768px]:col-span-3">
        <TextField id="expo-cep" label="CEP" inputMode="numeric" value={formatCep(delivery.cep)} onChange={(value) => setField("cep")(onlyDigits(value).slice(0, 8))} error={cepError || errors.cep} className="flex-1" />
        <button type="button" onClick={searchCep} disabled={searching} className="mb-0 h-[52px] rounded-md border-2 border-[#231F20] px-4 text-base font-extrabold disabled:opacity-50">
          {searching ? "Buscando…" : "Buscar CEP"}
        </button>
      </div>
      <TextField id="expo-street" label="Rua" value={delivery.street} onChange={setField("street")} error={errors.street} flash={flash} className="min-[768px]:col-span-2" />
      <TextField id="expo-number" label="Número" value={delivery.number} onChange={setField("number")} error={errors.number} />
      <TextField id="expo-complement" label="Complemento" value={delivery.complement} onChange={setField("complement")} />
      <TextField id="expo-neighborhood" label="Bairro" value={delivery.neighborhood} onChange={setField("neighborhood")} error={errors.neighborhood} flash={flash} />
      <TextField id="expo-city" label="Cidade" value={delivery.city} onChange={setField("city")} error={errors.city} flash={flash} />
      <TextField id="expo-state" label="UF" value={delivery.state} onChange={(value) => setField("state")(value.toUpperCase().slice(0, 2))} error={errors.state} flash={flash} />
    </div>
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
  const setContact = (field: "name" | "phone" | "email") => (value: string) =>
    dispatch({ type: "set-contact", contact: { [field]: field === "phone" ? onlyDigits(value).slice(0, 11) : value } });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (!buyer) return null;

  const selectMode = (mode: "cnpj" | "other") => {
    const base = mode === "cnpj" ? buyer.address : { cep: "", street: "", city: "", state: "" };
    dispatch({ type: "set-delivery", delivery: { mode, cep: base.cep, street: base.street, city: base.city, state: base.state, number: "", neighborhood: "", complement: "" } });
  };

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

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <CheckoutStepper current={1} />
        <h1 className="mt-4 text-[30px] font-extrabold">Dados e entrega</h1>
        <div className="mt-4 grid gap-6 min-[1024px]:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <section aria-labelledby="expo-invoice-title" className="rounded-lg bg-[#F4F4F5] p-4">
              <h2 id="expo-invoice-title" className="text-xs font-extrabold uppercase tracking-[0.08em]">
                Nota fiscal
              </h2>
              <p className="mt-1 line-clamp-2 text-lg font-extrabold">{buyer.legalName}</p>
              <p className="text-base">CNPJ {formatCnpj(buyer.cnpj)}</p>
              <button type="button" onClick={() => dispatch({ type: "change-store" })} className="mt-2 h-11 text-sm font-bold underline">
                Trocar loja
              </button>
            </section>
            <section aria-labelledby="expo-contact-title" className="grid gap-3">
              <h2 id="expo-contact-title" className="text-[21px] font-extrabold">
                Quem recebe o resumo
              </h2>
              <TextField id="expo-name" label="Nome de quem compra" autoComplete="name" value={state.contact.name} onChange={setContact("name")} error={errors.name} />
              <div className="grid gap-3 min-[768px]:grid-cols-2">
                <TextField id="expo-phone" label="WhatsApp" inputMode="tel" value={formatPhone(state.contact.phone)} onChange={setContact("phone")} error={errors.phone} />
                <TextField id="expo-email" label="E-mail" type="email" inputMode="email" value={state.contact.email} onChange={setContact("email")} error={errors.email} />
              </div>
            </section>
            <section aria-labelledby="expo-delivery-title">
              <h2 id="expo-delivery-title" className="text-[21px] font-extrabold">
                Entrega
              </h2>
              <div role="radiogroup" aria-labelledby="expo-delivery-title" className="mt-3 grid gap-3 min-[768px]:grid-cols-2">
                <RadioCard
                  title="Endereço do CNPJ"
                  sub={[buyer.address.street, buyer.address.city, buyer.address.state].filter(Boolean).join(", ")}
                  checked={state.delivery.mode === "cnpj"}
                  onSelect={() => selectMode("cnpj")}
                />
                <RadioCard title="Entregar em outro endereço" sub="Outro CEP" checked={state.delivery.mode === "other"} onSelect={() => selectMode("other")} />
              </div>
              {state.delivery.mode === "cnpj" ? <CnpjAddress state={state} dispatch={dispatch} errors={errors} /> : <OtherAddress state={state} dispatch={dispatch} errors={errors} />}
            </section>
          </div>
          <OrderSummary context={context} state={state} />
        </div>
      </div>
      <div className="grid gap-2 border-t-2 border-[#E4E4E7] px-8 py-4">
        {summary ? (
          <p role="alert" className="text-base font-bold text-[#B42318]">
            {summary}
          </p>
        ) : null}
        {failure ? (
          <div role="alert" className="flex items-center justify-between gap-3 text-base font-bold text-[#B42318]">
            <span>{failure.text}</span>
            {failure.retry ? (
              <button type="button" onClick={submit} className="h-11 rounded-md border-2 border-[#231F20] px-4 text-[#231F20]">
                Tentar de novo
              </button>
            ) : null}
          </div>
        ) : null}
        <button type="button" onClick={submit} disabled={busy} className="h-[60px] rounded-md bg-brand-yellow text-xl font-extrabold shadow-[0_5px_0_#231F20] disabled:opacity-60">
          {busy ? "Calculando o frete…" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
