"use client";

import { useState } from "react";

import { expocannabisClient } from "@/features/expocannabis/client/expocannabis-client";
import type { BuyerLookup } from "@/features/expocannabis/types/order";
import {
  localCnpjError,
  lookupErrorMessage,
  typingMessage,
  type CnpjMessage,
} from "@/features/expocannabis/utils/cnpj-messages";
import { formatCnpj } from "@/lib/validation/brazilian-documents";

import { CnpjPass } from "./cnpj-pass";
import { Keypad } from "./keypad";

type CnpjScreenProps = {
  onConfirm: (buyer: BuyerLookup) => void;
};

const LOOKUP_TIMEOUT_MS = 8000;

type LookupOutcome = Awaited<ReturnType<typeof expocannabisClient.lookupBuyer>>;

const TIMEOUT_OUTCOME: LookupOutcome = { ok: false, status: 0, code: "timeout", message: "" };

function lookupWithTimeout(cnpj: string): Promise<LookupOutcome> {
  return Promise.race([
    expocannabisClient.lookupBuyer(cnpj),
    new Promise<LookupOutcome>((resolve) => {
      setTimeout(() => resolve(TIMEOUT_OUTCOME), LOOKUP_TIMEOUT_MS);
    }),
  ]);
}

function FoundStore({ store, onConfirm, onReject }: Readonly<{ store: BuyerLookup; onConfirm: () => void; onReject: () => void }>) {
  const address = [store.address.street, store.address.city, store.address.state].filter(Boolean).join(", ");

  return (
    <section aria-labelledby="expo-found-title" className="expo-rise relative rounded-xl border-[3px] border-[#231F20] bg-white p-8 shadow-[10px_10px_0_#231F20]">
      <span className="expo-stamp absolute right-6 top-6 border-[3px] border-[#231F20] bg-brand-yellow px-3 py-1 text-sm font-extrabold uppercase">
        CNPJ ativo
      </span>
      <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#52525B]">Achamos a loja</p>
      <h2 id="expo-found-title" className="mt-2 line-clamp-2 pr-32 text-[28px] font-extrabold leading-tight">
        {store.legalName}
      </h2>
      <p className="mt-2 text-base font-semibold">CNPJ {formatCnpj(store.cnpj)}</p>
      <p className="mt-1 line-clamp-3 text-base text-[#52525B]">{address}</p>
      <p className="mt-4 text-sm font-semibold text-[#52525B]">Dá pra trocar o endereço de entrega no fechamento.</p>
      <div className="mt-6 grid gap-3">
        <button type="button" onClick={onConfirm} className="h-[68px] rounded-md bg-brand-yellow text-xl font-extrabold shadow-[0_6px_0_#231F20] active:translate-y-[6px] active:shadow-none">
          É essa, bora pro pedido
        </button>
        <button type="button" onClick={onReject} className="h-14 rounded-md border-2 border-[#231F20] bg-white text-base font-bold">
          Não é essa, corrigir CNPJ
        </button>
      </div>
    </section>
  );
}

/**
 * Tela 01: o operador digita o CNPJ do lojista e confirma a loja da Receita.
 *
 * Confirmar começa um atendimento novo; erro da Receita fora do ar oferece "Tentar de novo".
 */
export function CnpjScreen({ onConfirm }: Readonly<CnpjScreenProps>) {
  const [digits, setDigits] = useState("");
  const [message, setMessage] = useState<CnpjMessage>(typingMessage(""));
  const [shake, setShake] = useState(0);
  const [searching, setSearching] = useState(false);
  const [store, setStore] = useState<BuyerLookup | null>(null);

  const changeDigits = (next: string) => {
    setDigits(next);
    setMessage(typingMessage(next));
  };

  const fail = (next: CnpjMessage) => {
    setMessage(next);
    setShake((value) => value + 1);
  };

  const search = async () => {
    const local = localCnpjError(digits);
    if (local) {
      fail(local);
      return;
    }

    setSearching(true);
    setMessage({ text: "Buscando a loja na Receita…", error: false, retry: false });
    const result = await lookupWithTimeout(digits);
    setSearching(false);

    if (result.ok) {
      setStore(result.data);
      setMessage({ text: "Pronto, CNPJ conferido.", error: false, retry: false });
      return;
    }

    fail(lookupErrorMessage(result.code, result.message));
  };

  const reject = () => {
    setStore(null);
    changeDigits("");
  };

  if (store) {
    return (
      <div className="mx-auto max-w-[720px] px-12 py-10">
        <FoundStore store={store} onConfirm={() => onConfirm(store)} onReject={reject} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[720px] gap-8 px-12 py-10 min-[1024px]:max-w-[1100px] min-[1024px]:grid-cols-2 min-[1024px]:items-center">
      <div className="expo-rise">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#52525B]">Exclusivo para lojistas</p>
        <p className="mt-2 font-[family-name:var(--font-expo-marker)] text-[22px]">Bora fechar negócio?</p>
        <h1 className="mt-2 font-[family-name:var(--font-expo-display)] text-[66px] uppercase leading-[0.95]">Qual o CNPJ da loja?</h1>
        <p className="mt-4 text-lg font-medium text-[#52525B]">É com ele que a gente puxa a nota fiscal e o endereço de entrega. Rapidinho.</p>
      </div>
      <div className="grid gap-5">
        <CnpjPass digits={digits} message={message} shake={shake} searching={searching} onDigits={changeDigits} onSubmit={search} />
        {searching ? <div aria-hidden className="expo-skeleton h-16 rounded-md" /> : null}
        {message.retry ? (
          <button type="button" onClick={search} className="h-14 rounded-md border-2 border-[#231F20] bg-white text-base font-extrabold">
            Tentar de novo
          </button>
        ) : null}
        <Keypad
          disabled={searching}
          onDigit={(digit) => changeDigits(`${digits}${digit}`.slice(0, 14))}
          onClear={() => changeDigits("")}
          onBackspace={() => changeDigits(digits.slice(0, -1))}
        />
        <button
          type="button"
          onClick={search}
          disabled={digits.length === 0 || searching}
          className="h-[76px] rounded-md bg-brand-yellow text-2xl font-extrabold shadow-[0_6px_0_#231F20] active:translate-y-[6px] active:shadow-none disabled:bg-[#E4E4E7] disabled:shadow-none"
        >
          Buscar loja
        </button>
        <p className="text-center text-sm text-[#52525B]">Sem CNPJ? Nosso time atende no balcão. Venda proibida para menores de 18 anos.</p>
      </div>
    </div>
  );
}
