"use client";

import {
  COLLECTION_NAV_LIVE_SOURCES,
  COLLECTION_NAV_SUBTITLE_MAX_LENGTH,
  COLLECTION_NAV_TITLE_MAX_LENGTH,
  isInternalPath,
} from "@/components/layout/categories-nav/collections-nav-validation";
import { AdminSelectField } from "@/components/layout/admin-panel/sections/products/components/admin-select-field";
import type { CollectionNavItem } from "@/types/home-assets";

import { HINT_CLASS, INPUT_CLASS, LABEL_CLASS } from "../field-classes";

export type CollectionNavDestinationOption = {
  name: string;
  slug: string;
};

const REGISTERED_COLLECTION_PREFIX = "/colecoes?colecao=";

/**
 * O select do projeto não distingue "sem seleção" de valor vazio, então as duas escolhas neutras
 * carregam sentinela própria em vez de string vazia.
 */
const CUSTOM_DESTINATION = "custom";
const NO_LIVE_SOURCE = "none";

export function collectionNavHrefFor(slug: string) {
  return `${REGISTERED_COLLECTION_PREFIX}${slug}`;
}

/**
 * Slug da coleção cadastrada para a qual o card aponta, ou `null` quando o destino é um caminho
 * próprio. `/premium` e `/kits` são páginas dedicadas, não a listagem genérica — por isso não
 * casam aqui e continuam sendo editados como caminho.
 */
function registeredCollectionSlug(href: string, options: CollectionNavDestinationOption[]) {
  if (!href.startsWith(REGISTERED_COLLECTION_PREFIX)) {
    return null;
  }

  const slug = href.slice(REGISTERED_COLLECTION_PREFIX.length);

  return options.some((option) => option.slug === slug) ? slug : null;
}

export function CollectionNavItemEditor({
  collectionOptions,
  index,
  isSaving,
  item,
  onChange,
}: {
  collectionOptions: CollectionNavDestinationOption[];
  index: number;
  isSaving: boolean;
  item: CollectionNavItem;
  onChange: (patch: Partial<CollectionNavItem>) => void;
}) {
  const linkedSlug = registeredCollectionSlug(item.href, collectionOptions);
  const destinationMode = linkedSlug === null ? "custom" : "collection";
  const fieldId = `collection-nav-${item.id}`;
  const destinationOptions = [
    { label: "Caminho personalizado", value: CUSTOM_DESTINATION },
    ...collectionOptions.map((option) => ({
      label: `Coleção · ${option.name}`,
      value: option.slug,
    })),
  ];
  const liveSourceOptions = [
    { label: "Nenhum", value: NO_LIVE_SOURCE },
    ...COLLECTION_NAV_LIVE_SOURCES.map((source) => ({
      label: source.label,
      value: source.collection,
    })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL_CLASS} htmlFor={`${fieldId}-title`}>
          Título *
        </label>
        <input
          className={INPUT_CLASS}
          disabled={isSaving}
          id={`${fieldId}-title`}
          maxLength={COLLECTION_NAV_TITLE_MAX_LENGTH}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={`Card ${index + 1}`}
          type="text"
          value={item.title}
        />
        <p className={`mt-2 ${HINT_CLASS}`}>
          {item.title.trim().length}/{COLLECTION_NAV_TITLE_MAX_LENGTH} caracteres
        </p>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor={`${fieldId}-subtitle`}>
          Texto auxiliar *
        </label>
        <input
          className={INPUT_CLASS}
          disabled={isSaving}
          id={`${fieldId}-subtitle`}
          maxLength={COLLECTION_NAV_SUBTITLE_MAX_LENGTH}
          onChange={(event) => onChange({ subtitle: event.target.value })}
          placeholder="Kits exclusivos"
          type="text"
          value={item.subtitle}
        />
        <p className={`mt-2 ${HINT_CLASS}`}>
          {item.subtitle.trim().length}/{COLLECTION_NAV_SUBTITLE_MAX_LENGTH} caracteres
        </p>
      </div>

      {/*
        * `anchoredMenu` porque a casca do modal rola: sem ele o menu ficaria cortado no fim da
        * área rolável, por baixo do rodapé de ações.
        */}
      <AdminSelectField
        anchoredMenu
        label="Destino *"
        onChange={(value) =>
          onChange({ href: value === CUSTOM_DESTINATION ? "" : collectionNavHrefFor(value) })
        }
        options={destinationOptions}
        placeholder="Selecione o destino"
        value={destinationMode === "custom" ? CUSTOM_DESTINATION : linkedSlug!}
        variant="vendor-create"
      />

      {destinationMode === "custom" ? (
        <div>
          <label className={LABEL_CLASS} htmlFor={`${fieldId}-href`}>
            Caminho *
          </label>
          <input
            className={INPUT_CLASS}
            disabled={isSaving}
            id={`${fieldId}-href`}
            onChange={(event) => onChange({ href: event.target.value })}
            placeholder="/kits"
            type="text"
            value={item.href}
          />
          <p className={`mt-2 ${HINT_CLASS}`}>
            Caminho interno começando com barra. As páginas dedicadas são /kits, /premium,
            /novidades e /promocoes.
          </p>
          {item.href.trim() !== "" && !isInternalPath(item.href) ? (
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#c0392b]">
              O destino precisa começar com barra. Link externo é recusado no salvamento.
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <AdminSelectField
          anchoredMenu
          label="Número ao vivo"
          onChange={(value) => onChange({ collection: value === NO_LIVE_SOURCE ? "" : value })}
          options={liveSourceOptions}
          placeholder="Selecione"
          value={item.collection === "" ? NO_LIVE_SOURCE : item.collection}
          variant="vendor-create"
        />
        <p className={`mt-2 ${HINT_CLASS}`}>
          Na Home o número real substitui o texto auxiliar. Promoções também some do corredor
          enquanto não houver oferta vigente.
        </p>
      </div>

      <label
        className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-none border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
          item.isActive
            ? "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]"
            : "border-[#1a1a1a] bg-white text-[#231f20]/60"
        }`}
      >
        <input
          checked={item.isActive}
          className="h-4 w-4 accent-[#1a1a1a]"
          disabled={isSaving}
          onChange={(event) => onChange({ isActive: event.target.checked })}
          type="checkbox"
        />
        {item.isActive ? "Ativo no corredor" : "Inativo, não aparece no site"}
      </label>
    </div>
  );
}
