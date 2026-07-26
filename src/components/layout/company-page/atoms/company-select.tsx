"use client";

import { useEffect, useId, useRef, useState } from "react";

export type CompanySelectOption<T extends string> = {
  value: T;
  label: string;
};

type CompanySelectProps<T extends string> = {
  id?: string;
  name?: string;
  value: T;
  options: readonly CompanySelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const SIZE_CLASSES = {
  sm: "h-9 px-2 text-[12px] tracking-[0.08em]",
  md: "h-11 px-3 text-sm tracking-[0.06em]",
} as const;

const OPTION_SIZE_CLASSES = {
  sm: "px-2 py-2 text-[12px] tracking-[0.08em]",
  md: "px-3 py-2.5 text-sm tracking-[0.06em]",
} as const;

/**
 * Select da área de empresa. Substitui o `<select>` nativo porque o popup do navegador ignora a
 * estética brutalista da marca (borda 2px, radius 0, sombra dura). Mantém `name` via input hidden
 * para os formulários que leem `FormData`.
 */
export function CompanySelect<T extends string>({
  id,
  name,
  value,
  options,
  onChange,
  disabled,
  size = "md",
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: CompanySelectProps<T>) {
  const generatedId = useId();
  const triggerId = id ?? `company-select-${generatedId}`;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const typeaheadRef = useRef({ query: "", at: 0 });

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : "—";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  function openAt(index: number) {
    if (disabled) return;
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)));
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    setOpen(false);
    containerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    if (option && option.value !== value) {
      onChange(option.value);
    }
  }

  function moveTo(index: number) {
    const clamped = Math.max(0, Math.min(index, options.length - 1));
    if (open) {
      setActiveIndex(clamped);
      return;
    }
    commit(clamped);
  }

  function handleTypeahead(key: string) {
    const now = Date.now();
    const state = typeaheadRef.current;
    state.query = now - state.at > 700 ? key.toLowerCase() : state.query + key.toLowerCase();
    state.at = now;

    const from = open ? activeIndex : selectedIndex;
    const match = options.findIndex((option, index) => {
      if (state.query.length === 1 && index === from) return false;
      return option.label.toLowerCase().startsWith(state.query);
    });
    if (match >= 0) moveTo(match);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    const current = open ? activeIndex : Math.max(0, selectedIndex);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open && event.altKey) openAt(current);
        else if (!open) moveTo(current + 1);
        else moveTo(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open && event.altKey) openAt(current);
        else moveTo(current - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) commit(activeIndex);
        else openAt(current);
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          handleTypeahead(event.key);
        }
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`.trim()}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={triggerId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openAt(Math.max(0, selectedIndex)))}
        onKeyDown={handleKeyDown}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 border-2 border-[#1a1a1a] bg-white font-bold uppercase text-[#1a1a1a] transition-shadow hover:shadow-[3px_3px_0px_#1a1a1a] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none ${SIZE_CLASSES[size]}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span
          aria-hidden
          className={`inline-block h-0 w-0 shrink-0 border-x-4 border-t-[6px] border-x-transparent border-t-[#1a1a1a] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-activedescendant={`${triggerId}-option-${activeIndex}`}
          tabIndex={-1}
          className="absolute left-0 top-[calc(100%+4px)] z-30 max-h-60 w-full min-w-max overflow-auto border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[4px_4px_0px_#1a1a1a]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                id={`${triggerId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                className={`cursor-pointer font-bold uppercase ${OPTION_SIZE_CLASSES[size]} ${
                  isActive ? "bg-brand-yellow text-[#1a1a1a]" : "bg-transparent text-[#1a1a1a]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`inline-block h-2 w-2 shrink-0 rotate-45 ${
                      isSelected ? "bg-[#1a1a1a]" : "bg-transparent"
                    }`}
                  />
                  {option.label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
