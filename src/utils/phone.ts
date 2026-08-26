import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "BR";

const E164_MAX_DIGITS = 15;
const REGIONAL_INDICATOR_OFFSET = 0x1f1a5;

export type PhoneCountry = {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

export type ParsedPhone = {
  country: CountryCode;
  nationalNumber: string;
};

function countryFlag(code: string) {
  return String.fromCodePoint(
    ...Array.from(code.toUpperCase(), (letter) => REGIONAL_INDICATOR_OFFSET + letter.charCodeAt(0)),
  );
}

function countryNameResolver() {
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" });
  } catch {
    return null;
  }
}

function buildPhoneCountries(): readonly PhoneCountry[] {
  const resolver = countryNameResolver();
  const collator = new Intl.Collator("pt-BR");

  const countries = getCountries().map((code) => ({
    code,
    name: resolver?.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
    flag: countryFlag(code),
  }));

  countries.sort((first, second) => collator.compare(first.name, second.name));

  const defaultIndex = countries.findIndex((country) => country.code === DEFAULT_PHONE_COUNTRY);

  if (defaultIndex > 0) {
    countries.unshift(...countries.splice(defaultIndex, 1));
  }

  return countries;
}

export const PHONE_COUNTRIES = buildPhoneCountries();

const FALLBACK_COUNTRY: PhoneCountry = {
  code: DEFAULT_PHONE_COUNTRY,
  name: "Brasil",
  callingCode: "55",
  flag: countryFlag(DEFAULT_PHONE_COUNTRY),
};

export function findPhoneCountry(code: string | undefined): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((country) => country.code === code) ??
    PHONE_COUNTRIES.find((country) => country.code === DEFAULT_PHONE_COUNTRY) ??
    FALLBACK_COUNTRY
  );
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Corta o excedente que estouraria o limite de 15 digitos da E.164 para o pais escolhido.
 */
export function limitNationalDigits(value: string, country: CountryCode) {
  const available = E164_MAX_DIGITS - findPhoneCountry(country).callingCode.length;
  return onlyDigits(value).slice(0, Math.max(available, 1));
}

/**
 * Aplica a mascara nacional do pais informado sobre digitos crus, sem o codigo internacional.
 */
export function formatNationalPhone(value: string, country: CountryCode) {
  const digits = limitNationalDigits(value, country);
  return digits === "" ? "" : new AsYouType(country).input(digits);
}

/**
 * Converte digitos nacionais no valor canonico E.164 (`+5561999999999`) usado pela API.
 */
export function toE164(value: string, country: CountryCode) {
  const digits = limitNationalDigits(value, country);

  if (digits === "") {
    return "";
  }

  const parsed = parsePhoneNumberFromString(digits, country);
  return parsed?.number ?? `+${findPhoneCountry(country).callingCode}${digits}`;
}

function splitByCallingCode(digits: string): ParsedPhone | null {
  const match = PHONE_COUNTRIES.filter((country) => digits.startsWith(country.callingCode)).sort(
    (first, second) => second.callingCode.length - first.callingCode.length,
  )[0];

  return match
    ? { country: match.code, nationalNumber: digits.slice(match.callingCode.length) }
    : null;
}

/**
 * Le qualquer valor armazenado (E.164, mascarado ou apenas digitos) como pais + numero nacional.
 */
export function parsePhoneValue(value: string): ParsedPhone {
  const trimmed = value.trim();

  if (trimmed === "") {
    return { country: DEFAULT_PHONE_COUNTRY, nationalNumber: "" };
  }

  const isInternational = trimmed.startsWith("+");
  const digits = onlyDigits(trimmed);
  const parsed = isInternational
    ? parsePhoneNumberFromString(`+${digits}`)
    : parsePhoneNumberFromString(digits, DEFAULT_PHONE_COUNTRY);

  if (parsed) {
    const country =
      parsed.country ??
      PHONE_COUNTRIES.find((entry) => entry.callingCode === parsed.countryCallingCode)?.code;

    if (country) {
      return { country, nationalNumber: parsed.nationalNumber };
    }
  }

  if (isInternational) {
    const split = splitByCallingCode(digits);

    if (split) {
      return split;
    }
  }

  return {
    country: DEFAULT_PHONE_COUNTRY,
    nationalNumber: limitNationalDigits(digits, DEFAULT_PHONE_COUNTRY),
  };
}

export function isValidPhone(value: string, country: CountryCode) {
  const digits = limitNationalDigits(value, country);
  return digits !== "" && isValidPhoneNumber(digits, country);
}

export type { CountryCode };
