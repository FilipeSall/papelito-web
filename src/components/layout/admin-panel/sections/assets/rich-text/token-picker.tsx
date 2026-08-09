"use client";

import { CreditCard, Info, Package, Search, Sparkles, Ticket, Truck, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { BaseModal } from "@/components/ui/base-modal";
import {
  listTokenDefinitions,
  type RichTextProductFact,
  type TokenDefinition,
  type TokenIcon,
} from "@/features/rich-text";

import {
  COMPACT_BUTTON_CLASS,
  DASHED_BOX_CLASS,
  DIAMOND_CLASS,
  ICON_BUTTON_CLASS,
  INPUT_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../field-classes";

type TokenPickerProps = {
  onClose: () => void;
  onSelect: (token: string, params?: Record<string, string>) => void;
  promotionProducts: RichTextProductFact[];
};

const ICONS: Record<TokenIcon, typeof Truck> = {
  campaign: Sparkles,
  "credit-card": CreditCard,
  package: Package,
  ticket: Ticket,
  truck: Truck,
};

function groupDefinitions(definitions: TokenDefinition[]) {
  const groups = new Map<string, TokenDefinition[]>();

  for (const definition of definitions) {
    groups.set(definition.group, [...(groups.get(definition.group) ?? []), definition]);
  }

  return Array.from(groups.entries());
}

function groupHeadingId(group: string) {
  const slug = group
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `token-group-${slug || "other"}`;
}

export function TokenPicker({ onClose, onSelect, promotionProducts }: TokenPickerProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [pendingProductToken, setPendingProductToken] = useState<TokenDefinition | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const definitions = listTokenDefinitions().filter((definition) =>
      term === ""
        ? true
        : [definition.label, definition.description, definition.group]
            .join(" ")
            .toLocaleLowerCase("pt-BR")
            .includes(term),
    );
    return groupDefinitions(definitions);
  }, [search]);

  const matchingProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return term === ""
      ? promotionProducts
      : promotionProducts.filter((product) => product.name.toLocaleLowerCase("pt-BR").includes(term));
  }, [promotionProducts, search]);

  function chooseDefinition(definition: TokenDefinition) {
    if (definition.paramKind === "promotion-product") {
      setPendingProductToken(definition);
      setExpandedInfo(null);
      setSearch("");
      return;
    }

    onSelect(definition.id);
  }

  function returnToDefinitions() {
    setPendingProductToken(null);
    setSearch("");
  }

  const productStep = pendingProductToken !== null;
  const title = productStep ? `Escolha o produto para ${pendingProductToken.label}` : "Inserir dado dinâmico";
  const description = productStep
    ? "Apenas produtos da campanha relâmpago ativa podem ser usados nesta variável."
    : "Busque e insira valores que o sistema resolve automaticamente no site.";

  return (
    <BaseModal
      ariaDescribedBy="token-picker-description"
      ariaLabelledBy="token-picker-title"
      contentClassName="max-w-3xl"
      initialFocusRef={searchRef}
      onClose={onClose}
      open
    >
      <div className="max-h-[min(44rem,calc(100vh-3rem))] overflow-hidden rounded-none border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-brand-yellow" />
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
              <span aria-hidden className={DIAMOND_CLASS} />
              Dados dinâmicos
            </p>
            <h2
              className="mt-1.5 text-lg font-black uppercase tracking-tight text-[#1a1a1a]"
              id="token-picker-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-[#231f20]/70" id="token-picker-description">
              {description}
            </p>
          </div>
          <button
            aria-label="Fechar seletor de dados dinâmicos"
            className={ICON_BUTTON_CLASS}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        <div className="border-b-2 border-[#1a1a1a]/14 bg-white px-5 py-3">
          <label className="sr-only" htmlFor="token-picker-search">
            {productStep ? "Buscar produto em promoção" : "Buscar dado dinâmico"}
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/50" />
            <input
              className={`${INPUT_CLASS} pl-10`}
              id="token-picker-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={productStep ? "Buscar produto em promoção" : "Buscar por nome ou categoria"}
              ref={searchRef}
              type="search"
              value={search}
            />
          </div>
        </div>

        <div className="max-h-[calc(min(44rem,100vh-3rem)-12.5rem)] overflow-y-auto p-5">
          {productStep ? (
            <div>
              <button className={`${SECONDARY_BUTTON_CLASS} mb-4`} onClick={returnToDefinitions} type="button">
                Voltar para variáveis
              </button>
              {promotionProducts.length === 0 ? (
                <p className={DASHED_BOX_CLASS}>
                  Não há campanha relâmpago ativa. Ative uma campanha e adicione produtos antes de inserir esta variável.
                </p>
              ) : matchingProducts.length === 0 ? (
                <p className="px-1 py-5 text-sm text-[#231f20]/70">Nenhum produto encontrado.</p>
              ) : (
                <ul className="space-y-2">
                  {matchingProducts.map((product) => (
                    <li
                      className="flex items-center justify-between gap-4 border-2 border-[#1a1a1a]/14 bg-white p-3"
                      key={product.productId}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1a1a1a]">{product.name}</p>
                        <p className="mt-1 text-xs text-[#231f20]/70">
                          Use este produto em {pendingProductToken.label}.
                        </p>
                      </div>
                      <button
                        className={COMPACT_BUTTON_CLASS}
                        onClick={() => onSelect(pendingProductToken.id, { productId: String(product.productId) })}
                        type="button"
                      >
                        Inserir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : groups.length === 0 ? (
            <p className="px-1 py-5 text-sm text-[#231f20]/70">Nenhum dado dinâmico encontrado.</p>
          ) : (
            <div className="space-y-6">
              {groups.map(([group, definitions]) => {
                const headingId = groupHeadingId(group);

                return (
                  <section aria-labelledby={headingId} key={group}>
                    <h3
                      className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]"
                      id={headingId}
                    >
                      <span aria-hidden className={DIAMOND_CLASS} />
                      {group}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {definitions.map((definition) => {
                        const Icon = ICONS[definition.icon];
                        const infoId = `token-info-${definition.id}`;
                        const isInfoOpen = expandedInfo === definition.id;

                        return (
                          <li className="border-2 border-[#1a1a1a]/14 bg-white" key={definition.id}>
                            <div className="flex items-start gap-3 p-3">
                              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]">
                                <Icon aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#1a1a1a]">{definition.label}</p>
                                <p className="mt-1 text-xs leading-5 text-[#231f20]/70">{definition.description}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  aria-controls={infoId}
                                  aria-expanded={isInfoOpen}
                                  aria-label={`Saiba mais sobre ${definition.label}`}
                                  className={ICON_BUTTON_CLASS}
                                  onClick={() => setExpandedInfo((current) => (current === definition.id ? null : definition.id))}
                                  type="button"
                                >
                                  <Info aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                                </button>
                                <button className={COMPACT_BUTTON_CLASS} onClick={() => chooseDefinition(definition)} type="button">
                                  Inserir
                                </button>
                              </div>
                            </div>
                            {isInfoOpen ? (
                              <dl className="grid gap-3 border-t-2 border-[#1a1a1a]/12 bg-[#faf8f2] px-4 py-3 text-xs leading-5 text-[#231f20]/80 sm:grid-cols-3" id={infoId}>
                                <div><dt className="font-black uppercase tracking-[0.14em] text-[#231f20]/56">Exemplo</dt><dd className="mt-1">{definition.sampleValue}</dd></div>
                                <div><dt className="font-black uppercase tracking-[0.14em] text-[#231f20]/56">Origem</dt><dd className="mt-1">{definition.source}</dd></div>
                                <div><dt className="font-black uppercase tracking-[0.14em] text-[#231f20]/56">Onde alterar</dt><dd className="mt-1">{definition.configuration}</dd></div>
                              </dl>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
