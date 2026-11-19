"use client";

import Image from "next/image";
import { useState } from "react";

import { expocannabisClient } from "@/features/expocannabis/client/expocannabis-client";
import type { BuyerLookup } from "@/features/expocannabis/types/order";
import { localCnpjError, lookupErrorMessage, typingMessage, type CnpjMessage } from "@/features/expocannabis/utils/cnpj-messages";
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

const ICON = "/images/expocannabis/figma";

const SKELETON_BARS = ["h-3.5 w-[130px]", "h-7 w-[62%]", "h-4 w-[40%]", "h-4 w-[86%]", "h-4 w-[54%]"];

/** Esqueleto do cartão da loja e do botão enquanto a Receita responde. */
function StoreSkeleton() {
  return (
    <>
      <div aria-busy="true" className="flex flex-col gap-3.5 border border-expo-linha bg-white p-5.5">
        {SKELETON_BARS.map((bar) => (
          <div key={bar} className={`expo-skeleton ${bar}`} />
        ))}
      </div>
      <div aria-hidden className="expo-skeleton mt-2 h-19" />
    </>
  );
}

function FoundStore({ store, onConfirm, onReject }: Readonly<{ store: BuyerLookup; onConfirm: () => void; onReject: () => void }>) {
  const address = [store.address.street, store.address.city, store.address.state].filter(Boolean).join(", ");

  return (
    <>
      <div role="status" aria-label="Loja encontrada" className="expo-sobe relative flex flex-col gap-2 bg-expo-kraft p-5.5">
        <p className="text-[13px] font-extrabold uppercase tracking-[1.3px] text-expo-zinc">Achamos a loja</p>
        <span className="expo-carimbo absolute right-4 top-4 bg-brand-yellow px-3 py-1.5 text-[15px] font-extrabold uppercase tracking-[0.9px] max-sm:static max-sm:self-start">
          CNPJ ativo
        </span>
        <p className="text-[26px] font-extrabold leading-8 sm:text-[32px] sm:leading-[38px]">{store.legalName}</p>
        <p className="num text-base font-bold">{`CNPJ ${formatCnpj(store.cnpj)}`}</p>
        <p className="text-base font-medium text-expo-zinc">{address}</p>
        <p className="pt-2 text-sm font-semibold text-expo-zinc">Dá pra trocar o endereço de entrega no fechamento.</p>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        className="expo-sobe mt-2 flex min-h-19 items-center justify-center gap-3 bg-brand-yellow text-[21px] font-extrabold"
      >
        É essa, bora pro pedido
        <Image src={`${ICON}/icon-seta.svg`} alt="" width={24} height={24} aria-hidden className="size-6" />
      </button>
      <button type="button" onClick={onReject} className="mx-auto min-h-11 text-base font-bold underline underline-offset-4">
        Não é essa, corrigir CNPJ
      </button>
    </>
  );
}

function SearchButton({ ready, disabled, onSearch }: Readonly<{ ready: boolean; disabled: boolean; onSearch: () => void }>) {
  const tone = ready ? "bg-brand-yellow text-expo-ink" : "bg-expo-cinza text-expo-zinc";

  return (
    <button
      type="button"
      onClick={onSearch}
      disabled={disabled}
      className={`flex h-19 w-full items-center justify-center gap-3 text-[21px] font-extrabold ${tone}`}
    >
      Buscar loja
      <Image src={`${ICON}/icon-buscar.svg`} alt="" width={22} height={22} aria-hidden className="size-5.5" />
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
        <button type="button" onClick={onSearch} className="h-14 border-2 border-expo-ink bg-white text-base font-extrabold">
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
    <div className="flex min-h-full flex-col bg-expo-noite pz:flex-row pz:items-center">
      <section aria-labelledby="expo-cnpj-title" className="relative flex-none px-6 pb-16 pt-8 sm:px-12 pz:flex-1 pz:pb-12">
        <p className="b-entra-esq text-[13px] font-bold uppercase text-brand-yellow">Bora fechar negócio?</p>
        <h1 id="expo-cnpj-title" className="ultra expo-sobe mt-2 max-w-[500px] text-[40px] leading-[42px] text-white sm:text-[52px] sm:leading-[54px]">
          Qual o CNPJ <br />
          da loja?
        </h1>
        <p className="max-w-[450px] pt-4 text-[18px] font-semibold leading-[25px] text-expo-cinza">
          É com ele que a gente puxa a nota fiscal e o endereço de entrega. Rapidinho.
        </p>
        <Image
          src={`${ICON}/pzinho-sacola.svg`}
          alt=""
          aria-hidden
          width={245}
          height={245}
          className="expo-pula absolute left-[470px] top-0 w-[245px] max-w-none max-sm:hidden pz:left-auto pz:right-6"
        />
      </section>
      <div className="relative -mt-10 flex flex-col px-4 pb-6 sm:px-12 pz:mt-0 pz:w-[560px] pz:flex-none pz:px-0 pz:pr-12">
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
        <p className="mt-auto px-2 pb-1 pt-4.5 text-center text-sm font-semibold text-expo-areia">
          Sem CNPJ? Nosso time atende no balcão. Venda proibida para menores de 18 anos.
        </p>
      </div>
    </div>
  );
}
