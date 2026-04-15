"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface CheckoutCustomSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

export function CheckoutCustomSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: CheckoutCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

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
      <label className="text-xs font-medium uppercase tracking-[0.6px] text-text-tertiary">
        {label}
      </label>

      <div className="relative">
        <button
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`flex h-[46px] w-full items-center justify-between rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-sm tracking-[-0.1504px] outline-none transition ${
            isOpen ? "border-brand-dark/30" : "focus:border-brand-dark/25"
          }`}
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className={value ? "text-brand-dark" : "text-black/50"}>
            {value || placeholder}
          </span>
          <ChevronRightIcon
            className={`h-4 w-4 text-text-muted transition-transform ${
              isOpen ? "rotate-90" : "-rotate-90"
            }`}
          />
        </button>

        {isOpen && (
          <ul
            className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-[14px] border border-[#E5E7EB] bg-white py-1 shadow-[0_10px_24px_rgba(35,31,32,0.12)]"
            id={listboxId}
            role="listbox"
          >
            {options.map((option) => {
              const isSelected = value === option;

              return (
                <li key={option} role="option" aria-selected={isSelected}>
                  <button
                    className={`w-full px-4 py-2 text-left text-sm tracking-[-0.1504px] transition ${
                      isSelected
                        ? "bg-brand-dark text-white"
                        : "text-brand-dark hover:bg-bg-light"
                    }`}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
