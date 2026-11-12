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

const ARROW_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const SEARCH_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
    <path d="M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z" />
    <path d="m16 16 5 5" />
  </svg>
);

const SOLID_BUTTON =
  "flex w-full items-center justify-center gap-2.5 rounded-md border-[3px] border-[#231F20] text-[21px] font-extrabold transition-[transform,box-shadow] duration-80 active:translate-y-[6px] active:shadow-none motion-reduce:transition-none";

const SKELETON_BARS = ["h-3.5 w-[130px]", "h-7 w-[62%]", "h-4 w-[40%]", "h-4 w-[86%]", "h-4 w-[54%]"];

/** Esqueleto do cartão da loja e do botão enquanto a Receita responde. */
function StoreSkeleton() {
  return (
    <>
      <div aria-busy="true" className="flex flex-col gap-3.5 rounded-md border-2 border-[#E4E4E7] p-[22px]">
        {SKELETON_BARS.map((bar) => (
          <div key={bar} className={`expo-skeleton ${bar}`} />
        ))}
      </div>
      <div aria-hidden className="expo-skeleton mt-2 h-[76px]" />
    </>
  );
}

function FoundStore({ store, onConfirm, onReject }: Readonly<{ store: BuyerLookup; onConfirm: () => void; onReject: () => void }>) {
  const address = [store.address.street, store.address.city, store.address.state].filter(Boolean).join(", ");

  return (
    <>
      <div role="status" aria-label="Loja encontrada" className="expo-found relative mt-2 flex flex-col gap-2 rounded-md border-[3px] border-[#231F20] p-[22px]">
        <span aria-hidden className="expo-stamp absolute -top-3.5 right-[18px] rotate-4 border-[3px] border-[#231F20] bg-brand-yellow px-3 py-1.5 text-[15px] font-extrabold uppercase tracking-[0.06em] shadow-[4px_4px_0_#231F20]">
          CNPJ ativo
        </span>
        <p className="text-[13px] font-extrabold uppercase tracking-widest text-[#52525B]">Achamos a loja</p>
        <h2 className="line-clamp-2 text-[27px] font-extrabold leading-[1.15]">{store.legalName}</h2>
        <p className="text-base font-bold">CNPJ {formatCnpj(store.cnpj)}</p>
        <p className="line-clamp-3 text-base font-medium leading-[1.45] text-[#52525B]">{address}</p>
        <p className="mt-1 text-sm font-semibold text-[#52525B]">Dá pra trocar o endereço de entrega no fechamento.</p>
      </div>
      <div className="expo-found mt-2.5 flex flex-col gap-2">
        <button type="button" onClick={onConfirm} className={`${SOLID_BUTTON} min-h-[76px] bg-brand-yellow shadow-[0_6px_0_#231F20]`}>
          É essa, bora pro pedido
          {ARROW_ICON}
        </button>
        <button type="button" onClick={onReject} className="min-h-12 self-center px-1.5 text-base font-bold underline underline-offset-3">
          Não é essa, corrigir CNPJ
        </button>
      </div>
    </>
  );
}

function SearchButton({ ready, disabled, onSearch }: Readonly<{ ready: boolean; disabled: boolean; onSearch: () => void }>) {
  const tone = "h-[76px] mt-2 bg-brand-yellow shadow-[0_6px_0_#231F20] disabled:border-[#A1A1AA] disabled:bg-[#E4E4E7] disabled:text-[#52525B] disabled:shadow-[0_6px_0_#A1A1AA] disabled:cursor-not-allowed";

  return (
    <button type="button" onClick={onSearch} disabled={disabled} className={`${SOLID_BUTTON} ${tone} ${ready ? "expo-nudge" : ""}`}>
      Buscar loja
      {SEARCH_ICON}
    </button>
  );
}

type PassBodyProps = {
  digits: string;
  message: CnpjMessage;
  searching: boolean;
  store: BuyerLookup | null;
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSearch: () => void;
  onConfirm: (buyer: BuyerLookup) => void;
  onReject: () => void;
};

function PassBody({ digits, message, searching, store, onDigit, onClear, onBackspace, onSearch, onConfirm, onReject }: Readonly<PassBodyProps>) {
  if (store) return <FoundStore store={store} onConfirm={() => onConfirm(store)} onReject={onReject} />;
  if (searching) return <StoreSkeleton />;

  return (
    <>
      {message.retry ? (
        <button type="button" onClick={onSearch} className="h-14 rounded-md border-2 border-[#231F20] bg-white text-base font-extrabold">
          Tentar de novo
        </button>
      ) : null}
      <Keypad onDigit={onDigit} onClear={onClear} onBackspace={onBackspace} />
      <SearchButton ready={digits.length === 14 && !message.error} disabled={digits.length === 0} onSearch={onSearch} />
    </>
  );
}

/**
 * Tela 01: o operador digita o CNPJ do lojista e confirma a loja da Receita.
 *
 * Confirmar começa um atendimento novo; erro da Receita fora do ar oferece "Tentar de novo".
 */
export function CnpjScreen({ onConfirm }: Readonly<CnpjScreenProps>) {
  const [digits, setDigits] = useState("");
  const [status, setStatus] = useState<CnpjMessage | null>(null);
  const [shake, setShake] = useState(0);
  const [searching, setSearching] = useState(false);
  const [store, setStore] = useState<BuyerLookup | null>(null);
  const message = status ?? typingMessage(digits);

  const changeDigits = (update: (previous: string) => string) => {
    setDigits((previous) => update(previous).replace(/\D/g, "").slice(0, 14));
    setStatus(null);
  };

  const fail = (next: CnpjMessage) => {
    setStatus(next);
    setShake((value) => value + 1);
  };

  const search = async () => {
    const local = localCnpjError(digits);
    if (local) {
      fail(local);
      return;
    }

    setSearching(true);
    setStatus({ text: "Buscando a loja na Receita…", error: false, retry: false });
    const result = await lookupWithTimeout(digits);
    setSearching(false);

    if (result.ok) {
      setStore(result.data);
      setStatus({ text: "Pronto, CNPJ conferido.", error: false, retry: false });
      return;
    }

    fail(lookupErrorMessage(result.code, result.message));
  };

  const reject = () => {
    setStore(null);
    changeDigits(() => "");
  };

  return (
    <div className="flex min-h-full flex-col bg-white min-[1024px]:flex-row">
      <section aria-labelledby="expo-cnpj-title" className="flex flex-none flex-col items-start bg-brand-yellow px-12 pb-[120px] pt-[30px] min-[1024px]:flex-1 min-[1024px]:justify-center min-[1024px]:pb-12 min-[1024px]:pt-12">
        <p className="expo-in-1 inline-block -rotate-3 bg-[#231F20] px-4 pb-1 pt-1.5 font-[family-name:var(--font-expo-marker)] text-[22px] text-brand-yellow">
          Bora fechar negócio?
        </p>
        <h1 id="expo-cnpj-title" className="expo-in-2 mt-[22px] font-[family-name:var(--font-expo-display)] text-[66px] uppercase leading-none">
          Qual o CNPJ <br />
          da loja?
        </h1>
        <p className="expo-in-2 mt-4 max-w-[560px] text-[19px] font-semibold leading-[1.4]">
          É com ele que a gente puxa a nota fiscal e o endereço de entrega. Rapidinho.
        </p>
      </section>
      <div className="relative -mt-[92px] flex min-h-0 flex-1 flex-col px-12 min-[1024px]:mt-0 min-[1024px]:justify-center min-[1024px]:py-12">
        <CnpjPass
          digits={digits}
          message={message}
          shake={shake}
          searching={searching}
          found={store !== null}
          onDigits={(next) => changeDigits(() => next)}
          onSubmit={search}
        >
          <PassBody
            digits={digits}
            message={message}
            searching={searching}
            store={store}
            onDigit={(digit) => changeDigits((previous) => `${previous}${digit}`)}
            onClear={() => changeDigits(() => "")}
            onBackspace={() => changeDigits((previous) => previous.slice(0, -1))}
            onSearch={search}
            onConfirm={onConfirm}
            onReject={reject}
          />
        </CnpjPass>
        <p className="mt-auto pb-[22px] pt-[18px] text-center text-sm font-semibold text-[#52525B] min-[1024px]:mt-6">
          Sem CNPJ? Nosso time atende no balcão. Venda proibida para menores de 18 anos.
        </p>
      </div>
    </div>
  );
}
