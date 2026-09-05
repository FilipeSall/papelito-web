"use client";

import type { KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { ChevronRightIcon } from "@/components/ui/icons";

type CheckoutCustomSelectOption =
  | string
  | {
      label: ReactNode;
      searchText?: string;
      triggerLabel?: ReactNode;
      value: string;
    };

const MENU_ANCHOR_GAP = 8;
const MENU_VIEWPORT_MARGIN = 8;
const MENU_MIN_HEIGHT = 120;
const MENU_MAX_HEIGHT = 240;

type AnchoredMenuPosition = {
  bottom?: number;
  left: number;
  maxHeight: number;
  top?: number;
  width: number;
};

export interface CheckoutCustomSelectProps {
  readonly anchoredMenu?: boolean;
  readonly label: ReactNode;
  readonly placeholder: string;
  readonly value: string;
  readonly options: readonly CheckoutCustomSelectOption[];
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly errorMessage?: string;
  readonly errorClassName?: string;
  readonly labelClassName?: string;
  readonly placeholderClassName?: string;
  readonly selectedValueClassName?: string;
  readonly triggerClassName?: string;
  readonly iconClassName?: string;
  readonly listClassName?: string;
  readonly optionClassName?: string;
  readonly searchable?: boolean;
  readonly loading?: boolean;
  readonly loadingLabel?: string;
  readonly searchInputClassName?: string;
  readonly searchPlaceholder?: string;
  readonly selectedOptionClassName?: string;
  readonly unselectedOptionClassName?: string;
  readonly wrapperClassName?: string;
}

export function CheckoutCustomSelect({
  anchoredMenu = false,
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  errorMessage,
  errorClassName = "min-h-5 text-[11px] tracking-[0.05px] text-red-500",
  labelClassName = "text-xs font-medium uppercase tracking-[0.6px] text-text-tertiary",
  placeholderClassName = "text-black/50",
  selectedValueClassName = "text-brand-dark",
  triggerClassName = "",
  iconClassName = "text-text-muted",
  listClassName = "",
  optionClassName = "",
  searchable = false,
  loading = false,
  loadingLabel = "Atualizando…",
  searchInputClassName = "h-9 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:border-brand-dark/25",
  searchPlaceholder = "Buscar...",
  selectedOptionClassName = "bg-brand-dark text-white",
  unselectedOptionClassName = "text-brand-dark hover:bg-bg-light",
  wrapperClassName = "",
}: Readonly<CheckoutCustomSelectProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selectId = useId();
  const selectedOption = options.find((option) => getOptionValue(option) === value);
  const visibleOptions = searchable ? filterOptions(options, query) : options;
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);
  const toggleOpen = useCallback(() => {
    if (disabled) {
      return;
    }

    setQuery("");
    setIsOpen((current) => !current);
  }, [disabled]);

  useSelectDismissal(wrapperRef, close);
  const menuPosition = useAnchoredMenuPosition(triggerRef, anchoredMenu, isOpen);
  const triggerLabel = selectedOption ? getOptionTriggerLabel(selectedOption) : placeholder;

  return (
    <div
      className={`relative flex flex-col gap-2 ${isOpen ? "z-50" : ""} ${wrapperClassName}`.trim()}
      ref={wrapperRef}
    >
      <label className={labelClassName} htmlFor={selectId}>{label}</label>

      <select
        aria-label={typeof label === "string" ? label : undefined}
        className="sr-only"
        disabled={disabled || loading}
        id={selectId}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          close();
        }}
      >
        {!value ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={getOptionValue(option)} value={getOptionValue(option)}>
            {getNativeOptionLabel(option)}
          </option>
        ))}
      </select>

      <div className="relative">
        <CheckoutSelectTrigger
          disabled={disabled || loading}
          errorMessage={errorMessage}
          iconClassName={iconClassName}
          isOpen={isOpen}
          listboxId={listboxId}
          onToggle={toggleOpen}
          placeholderClassName={placeholderClassName}
          selectedValueClassName={selectedValueClassName}
          triggerClassName={triggerClassName}
          triggerLabel={triggerLabel}
          triggerRef={triggerRef}
          value={value}
          loading={loading}
          loadingLabel={loadingLabel}
        />

        {isOpen ? (
          <CheckoutSelectMenu
            anchoredMenu={anchoredMenu}
            disabled={disabled}
            listboxId={listboxId}
            listClassName={listClassName}
            menuPosition={menuPosition}
            onChange={onChange}
            onClose={close}
            optionClassName={optionClassName}
            options={visibleOptions}
            query={query}
            searchable={searchable}
            searchInputClassName={searchInputClassName}
            searchPlaceholder={searchPlaceholder}
            selectedOptionClassName={selectedOptionClassName}
            unselectedOptionClassName={unselectedOptionClassName}
            value={value}
            onQueryChange={setQuery}
          />
        ) : null}
      </div>

      {errorMessage ? <span className={errorClassName}>{errorMessage}</span> : null}
    </div>
  );
}

type CheckoutSelectTriggerProps = {
  readonly disabled: boolean;
  readonly errorMessage?: string;
  readonly iconClassName: string;
  readonly isOpen: boolean;
  readonly listboxId: string;
  readonly onToggle: () => void;
  readonly placeholderClassName: string;
  readonly selectedValueClassName: string;
  readonly triggerClassName: string;
  readonly triggerLabel: ReactNode;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly value: string;
  readonly loading: boolean;
  readonly loadingLabel: string;
};

const CheckoutSelectTrigger = ({
  disabled,
  errorMessage,
  iconClassName,
  isOpen,
  listboxId,
  onToggle,
  placeholderClassName,
  selectedValueClassName,
  triggerClassName,
  triggerLabel,
  triggerRef,
  value,
  loading,
  loadingLabel,
}: CheckoutSelectTriggerProps) => (
  <button
    aria-controls={listboxId}
    aria-disabled={disabled}
    aria-expanded={isOpen}
    aria-haspopup="true"
    aria-busy={loading}
    className={getTriggerClassName({ disabled, errorMessage, isOpen, triggerClassName })}
    disabled={disabled || loading}
    ref={triggerRef}
    type="button"
    onClick={onToggle}
  >
    <span
      className={`min-w-0 truncate text-left ${value ? selectedValueClassName : placeholderClassName}`}
    >
      {triggerLabel}
    </span>
    {loading ? (
      <Loader2 aria-label={loadingLabel} className="h-4 w-4 shrink-0 animate-spin" />
    ) : (
      <ChevronRightIcon
        className={`h-4 w-4 shrink-0 transition-transform ${iconClassName} ${isOpen ? "rotate-90" : "-rotate-90"}`}
      />
    )}
  </button>
);

type CheckoutSelectMenuProps = {
  readonly anchoredMenu: boolean;
  readonly disabled: boolean;
  readonly listboxId: string;
  readonly listClassName: string;
  readonly menuPosition: AnchoredMenuPosition | null;
  readonly onChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onQueryChange: (query: string) => void;
  readonly optionClassName: string;
  readonly options: readonly CheckoutCustomSelectOption[];
  readonly query: string;
  readonly searchable: boolean;
  readonly searchInputClassName: string;
  readonly searchPlaceholder: string;
  readonly selectedOptionClassName: string;
  readonly unselectedOptionClassName: string;
  readonly value: string;
};

function CheckoutSelectMenu({
  anchoredMenu,
  disabled,
  listboxId,
  listClassName,
  menuPosition,
  onChange,
  onClose,
  onQueryChange,
  optionClassName,
  options,
  query,
  searchable,
  searchInputClassName,
  searchPlaceholder,
  selectedOptionClassName,
  unselectedOptionClassName,
  value,
}: CheckoutSelectMenuProps) {
  return (
    <div
      className={getMenuClassName(anchoredMenu, listClassName)}
      id={listboxId}
      style={getMenuStyle(anchoredMenu, menuPosition)}
    >
      {searchable ? (
        <div className="sticky top-0 z-10 bg-white px-2 pb-1 pt-1">
          <input
            aria-label={searchPlaceholder}
            autoFocus
            className={searchInputClassName}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => handleSearchKeyDown(event, options, onChange, onClose)}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
        </div>
      ) : null}

      {searchable && options.length === 0 ? (
        <div className="px-4 py-3 text-sm text-black/50">Nenhum resultado.</div>
      ) : null}

      {options.map((option) => (
        <CheckoutSelectOption
          disabled={disabled}
          isSelected={value === getOptionValue(option)}
          key={getOptionValue(option)}
          onChange={onChange}
          onClose={onClose}
          option={option}
          optionClassName={optionClassName}
          selectedOptionClassName={selectedOptionClassName}
          unselectedOptionClassName={unselectedOptionClassName}
        />
      ))}
    </div>
  );
}

type CheckoutSelectOptionProps = {
  readonly disabled: boolean;
  readonly isSelected: boolean;
  readonly onChange: (value: string) => void;
  readonly onClose: () => void;
  readonly option: CheckoutCustomSelectOption;
  readonly optionClassName: string;
  readonly selectedOptionClassName: string;
  readonly unselectedOptionClassName: string;
};

function CheckoutSelectOption({
  disabled,
  isSelected,
  onChange,
  onClose,
  option,
  optionClassName,
  selectedOptionClassName,
  unselectedOptionClassName,
}: CheckoutSelectOptionProps) {
  const optionValue = getOptionValue(option);

  function handleClick() {
    if (disabled) {
      return;
    }

    onChange(optionValue);
    onClose();
  }

  return (
    <div>
      <button
        aria-pressed={isSelected}
        className={`w-full cursor-pointer px-4 py-2 text-left text-sm tracking-[-0.1504px] transition ${
          isSelected ? selectedOptionClassName : unselectedOptionClassName
        } ${optionClassName}`.trim()}
        type="button"
        onClick={handleClick}
      >
        {getOptionLabel(option)}
      </button>
    </div>
  );
}

function handleSearchKeyDown(
  event: ReactKeyboardEvent<HTMLInputElement>,
  options: readonly CheckoutCustomSelectOption[],
  onChange: (value: string) => void,
  onClose: () => void,
) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  const first = options[0];

  if (first) {
    onChange(getOptionValue(first));
    onClose();
  }
}

function getTriggerClassName({
  disabled,
  errorMessage,
  isOpen,
  triggerClassName,
}: {
  readonly disabled: boolean;
  readonly errorMessage?: string;
  readonly isOpen: boolean;
  readonly triggerClassName: string;
}) {
  let stateClassName = "border-[#E5E7EB] focus:border-brand-dark/25";

  if (disabled) {
    stateClassName = "cursor-not-allowed border-[#E5E7EB] bg-[#F5F5F5] text-black/40";
  } else if (errorMessage) {
    stateClassName = "border-red-400 focus:border-red-500";
  } else if (isOpen) {
    stateClassName = "border-brand-dark/30";
  }

  return `flex h-11.5 w-full cursor-pointer items-center justify-between rounded-[14px] border bg-white px-4 text-sm tracking-[-0.1504px] outline-none transition ${stateClassName} ${triggerClassName}`.trim();
}

function getMenuClassName(anchoredMenu: boolean, listClassName: string) {
  const positionClassName = anchoredMenu
    ? "fixed z-50 overflow-auto"
    : "absolute z-50 mt-2 max-h-60 w-full overflow-auto";

  return `${positionClassName} rounded-[14px] border border-[#E5E7EB] bg-white py-1 shadow-[0_10px_24px_rgba(35,31,32,0.12)] ${listClassName}`.trim();
}

function getMenuStyle(anchoredMenu: boolean, menuPosition: AnchoredMenuPosition | null) {
  if (!anchoredMenu) {
    return undefined;
  }

  return {
    bottom: menuPosition?.bottom,
    left: menuPosition?.left,
    maxHeight: menuPosition?.maxHeight,
    top: menuPosition?.top,
    visibility: menuPosition ? "visible" : "hidden",
    width: menuPosition?.width,
  } as const;
}

function useSelectDismissal(
  wrapperRef: RefObject<HTMLDivElement | null>,
  close: () => void,
) {
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [close, wrapperRef]);
}

function useAnchoredMenuPosition(
  triggerRef: RefObject<HTMLButtonElement | null>,
  anchoredMenu: boolean | undefined,
  isOpen: boolean,
) {
  const [menuPosition, setMenuPosition] = useState<AnchoredMenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!anchoredMenu || !isOpen) {
      return;
    }

    function place() {
      const trigger = triggerRef.current;

      if (!trigger) {
        return;
      }

      const anchor = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - anchor.bottom - MENU_ANCHOR_GAP - MENU_VIEWPORT_MARGIN;
      const spaceAbove = anchor.top - MENU_ANCHOR_GAP - MENU_VIEWPORT_MARGIN;
      const opensUpwards = spaceBelow < MENU_MIN_HEIGHT && spaceAbove > spaceBelow;
      const available = opensUpwards ? spaceAbove : spaceBelow;
      const maxLeft = Math.max(
        MENU_VIEWPORT_MARGIN,
        window.innerWidth - anchor.width - MENU_VIEWPORT_MARGIN,
      );

      setMenuPosition({
        bottom: opensUpwards ? window.innerHeight - anchor.top + MENU_ANCHOR_GAP : undefined,
        left: Math.min(Math.max(anchor.left, MENU_VIEWPORT_MARGIN), maxLeft),
        maxHeight: Math.max(MENU_MIN_HEIGHT, Math.min(MENU_MAX_HEIGHT, available)),
        top: opensUpwards ? undefined : anchor.bottom + MENU_ANCHOR_GAP,
        width: anchor.width,
      });
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchoredMenu, isOpen, triggerRef]);

  return menuPosition;
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function getOptionSearchText(option: CheckoutCustomSelectOption) {
  if (typeof option === "string") return option;
  if (option.searchText) return option.searchText;
  return typeof option.label === "string" ? option.label : option.value;
}

function filterOptions(options: readonly CheckoutCustomSelectOption[], query: string) {
  const term = normalizeSearchText(query.trim());

  return term === ""
    ? options
    : options.filter((option) => normalizeSearchText(getOptionSearchText(option)).includes(term));
}

function getOptionValue(option: CheckoutCustomSelectOption) {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option: CheckoutCustomSelectOption) {
  return typeof option === "string" ? option : option.label;
}

function getNativeOptionLabel(option: CheckoutCustomSelectOption) {
  const label = getOptionLabel(option);

  return typeof label === "string" || typeof label === "number"
    ? String(label)
    : getOptionValue(option);
}

function getOptionTriggerLabel(option: CheckoutCustomSelectOption) {
  if (typeof option === "string") return option;
  return option.triggerLabel ?? option.label;
}
