"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

type CheckoutCustomSelectOption =
  | string
  | {
      label: string;
      value: string;
    };

export interface CheckoutCustomSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: readonly CheckoutCustomSelectOption[];
  onChange: (value: string) => void;
  errorMessage?: string;
  labelClassName?: string;
  triggerClassName?: string;
  listClassName?: string;
  optionClassName?: string;
}

export function CheckoutCustomSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  errorMessage,
  labelClassName = "text-xs font-medium uppercase tracking-[0.6px] text-text-tertiary",
  triggerClassName = "",
  listClassName = "",
  optionClassName = "",
}: CheckoutCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => getOptionValue(option) === value);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef}>
      <label className={labelClassName}>
        {label}
      </label>

      <div className="relative">
        <button
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`flex h-11.5 w-full cursor-pointer items-center justify-between rounded-[14px] border bg-white px-4 text-sm tracking-[-0.1504px] outline-none transition ${
            errorMessage
              ? "border-red-400 focus:border-red-500"
              : isOpen
                ? "border-brand-dark/30"
                : "border-[#E5E7EB] focus:border-brand-dark/25"
          } ${triggerClassName}`.trim()}
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className={value ? "text-brand-dark" : "text-black/50"}>
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
          <ChevronRightIcon
            className={`h-4 w-4 text-text-muted transition-transform ${
              isOpen ? "rotate-90" : "-rotate-90"
            }`}
          />
        </button>

        {isOpen && (
          <ul
            className={`absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-[14px] border border-[#E5E7EB] bg-white py-1 shadow-[0_10px_24px_rgba(35,31,32,0.12)] ${listClassName}`.trim()}
            id={listboxId}
            role="listbox"
          >
            {options.map((option) => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const isSelected = value === optionValue;

              return (
                <li key={optionValue} role="option" aria-selected={isSelected}>
                  <button
                    className={`w-full cursor-pointer px-4 py-2 text-left text-sm tracking-[-0.1504px] transition ${
                      isSelected
                        ? "bg-brand-dark text-white"
                        : "text-brand-dark hover:bg-bg-light"
                    } ${optionClassName}`.trim()}
                    type="button"
                    onClick={() => {
                      onChange(optionValue);
                      setIsOpen(false);
                    }}
                  >
                    {optionLabel}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {errorMessage ? (
        <span className="min-h-5 text-[11px] tracking-[0.05px] text-red-500">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}

function getOptionValue(option: CheckoutCustomSelectOption) {
  return typeof option === "string" ? option : option.value;
}

function getOptionLabel(option: CheckoutCustomSelectOption) {
  return typeof option === "string" ? option : option.label;
}
