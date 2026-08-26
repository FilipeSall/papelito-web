"use client";

import { useMemo, useState } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import {
  PHONE_COUNTRIES,
  type CountryCode,
  findPhoneCountry,
  formatNationalPhone,
  onlyDigits,
  parsePhoneValue,
  toE164,
} from "@/utils/phone";

type PhoneInputProps = {
  countryTriggerClassName?: string;
  countryWrapperClassName?: string;
  disabled?: boolean;
  id?: string;
  inputClassName?: string;
  listClassName?: string;
  name?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchInputClassName?: string;
  value: string;
  wrapperClassName?: string;
};

/**
 * Campo de telefone com seletor de pais e mascara automatica.
 *
 * O usuario digita apenas digitos; o valor emitido em `onChange` e sempre E.164 (`+5561999999999`).
 */
export function PhoneInput({
  countryTriggerClassName = "",
  countryWrapperClassName = "w-[7.5rem] shrink-0",
  disabled = false,
  id,
  inputClassName = "h-11.5 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-sm text-brand-dark outline-none transition focus:border-brand-dark/25",
  listClassName = "",
  name,
  onChange,
  placeholder = "(00) 00000-0000",
  value,
  searchInputClassName,
  wrapperClassName = "flex items-start gap-2",
}: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(() => parsePhoneValue(value).country);
  const [national, setNational] = useState(() => {
    const parsed = parsePhoneValue(value);
    return formatNationalPhone(parsed.nationalNumber, parsed.country);
  });
  const [syncedValue, setSyncedValue] = useState(value);

  if (value !== syncedValue) {
    const parsed = parsePhoneValue(value);

    setSyncedValue(value);
    setCountry(parsed.country);
    setNational(formatNationalPhone(parsed.nationalNumber, parsed.country));
  }

  function emit(nextNational: string, nextCountry: CountryCode) {
    const next = toE164(nextNational, nextCountry);

    setSyncedValue(next);
    onChange(next);
  }

  function handleCountryChange(nextCode: string) {
    const nextCountry = findPhoneCountry(nextCode).code;
    const digits = onlyDigits(national);

    setCountry(nextCountry);
    setNational(formatNationalPhone(digits, nextCountry));
    emit(digits, nextCountry);
  }

  function handleNationalChange(nextValue: string) {
    const masked = formatNationalPhone(nextValue, country);

    setNational(masked);
    emit(masked, country);
  }

  const options = useMemo(
    () =>
      PHONE_COUNTRIES.map((entry) => ({
        label: `${entry.flag} ${entry.name} +${entry.callingCode}`,
        searchText: `${entry.name} ${entry.code} +${entry.callingCode}`,
        triggerLabel: `${entry.flag} +${entry.callingCode}`,
        value: entry.code,
      })),
    [],
  );

  return (
    <div className={wrapperClassName}>
      <CheckoutCustomSelect
        disabled={disabled}
        label="País"
        labelClassName="sr-only"
        listClassName={`w-[18rem] ${listClassName}`.trim()}
        onChange={handleCountryChange}
        options={options}
        placeholder="País"
        searchInputClassName={searchInputClassName}
        searchPlaceholder="Buscar país ou código"
        searchable
        triggerClassName={countryTriggerClassName}
        value={country}
        wrapperClassName={countryWrapperClassName}
      />
      <input
        aria-label="Número de telefone"
        autoComplete="tel-national"
        className={inputClassName}
        disabled={disabled}
        id={id}
        inputMode="numeric"
        name={name}
        onChange={(event) => handleNationalChange(event.target.value)}
        placeholder={placeholder}
        type="tel"
        value={national}
      />
    </div>
  );
}
