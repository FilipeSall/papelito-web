"use client";

import { formatZipCode } from "@/features/checkout/utils/format-checkout-fields";

type CheckoutCompanyZipCodeButtonProps = {
  companyZipCode: string | null | undefined;
  currentZipCode: string;
  isLoading?: boolean;
  onSync: (zipCode: string) => void;
};

function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function CompanyIcon() {
  return (
    <svg
      aria-hidden
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 21h18" />
      <path d="M5.5 21V5.2a1 1 0 0 1 1-1h6.6a1 1 0 0 1 1 1V21" />
      <path d="M14.1 21v-9.3h3.9a1 1 0 0 1 1 1V21" />
      <path d="M8.4 8.3h2.8M8.4 12.1h2.8M8.4 15.9h2.8" />
    </svg>
  );
}

function AppliedIcon() {
  return (
    <svg
      aria-hidden
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CheckoutCompanyZipCodeButton({
  companyZipCode,
  currentZipCode,
  isLoading = false,
  onSync,
}: CheckoutCompanyZipCodeButtonProps) {
  const companyDigits = onlyDigits(companyZipCode);

  if (companyDigits.length !== 8) return null;

  const formatted = formatZipCode(companyDigits);
  const isSynced = onlyDigits(currentZipCode) === companyDigits;
  const tooltip = isSynced
    ? `CEP da empresa aplicado (${formatted})`
    : "Usar CEP da empresa";

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        aria-label={
          isSynced
            ? `CEP do cadastro da empresa já aplicado: ${formatted}`
            : `Usar o CEP do cadastro da empresa: ${formatted}`
        }
        className={`inline-flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border outline-none transition-[background-color,border-color,color,box-shadow] duration-150 ${
          isSynced
            ? "cursor-default border-transparent bg-transparent text-[#16A34A]"
            : "cursor-pointer border-[#E8EAED] bg-[#FBFBFC] text-text-tertiary hover:border-[#D6D9DE] hover:bg-white hover:text-brand-dark focus-visible:border-brand-dark/60 focus-visible:ring-2 focus-visible:ring-brand-dark/8 disabled:cursor-not-allowed disabled:opacity-50"
        }`}
        disabled={isSynced || isLoading}
        onClick={() => onSync(companyDigits)}
        type="button"
      >
        {isSynced ? <AppliedIcon /> : <CompanyIcon />}
      </button>

      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-brand-dark px-2 py-1 text-[11px] font-medium leading-4 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        role="tooltip"
      >
        {tooltip}
        <span className="absolute left-1/2 top-full -ml-1 h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-brand-dark" />
      </span>
    </span>
  );
}
