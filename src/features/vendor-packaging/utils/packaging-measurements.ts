import type {
  VendorPackagingConversionResult,
  VendorPackagingDraft,
  VendorPackagingPayload,
} from "../types/vendor-packaging";

type MeasurementField = "heightCm" | "lengthCm" | "maxPayloadKg" | "tareKg" | "widthCm";

function parseScaledInteger(value: string, scale: number, allowZero: boolean) {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "" || !/^\d+(?:\.\d+)?$/.test(normalized)) {
    return { value: null, error: "Informe um número válido." };
  }

  const [wholePart, fractionPart = ""] = normalized.split(".");
  const precision = String(scale).length - 1;
  const extraDigits = fractionPart.slice(precision);
  if (extraDigits !== "" && /[^0]/.test(extraDigits)) {
    return { value: null, error: "Use uma medida que resulte em um inteiro." };
  }

  const scaledFraction = fractionPart.slice(0, precision).padEnd(precision, "0");
  const parsed = Number(wholePart) * scale + Number(scaledFraction || 0);
  if (!Number.isSafeInteger(parsed) || (!allowZero && parsed <= 0)) {
    return {
      value: null,
      error: allowZero ? "Informe um número igual ou maior que zero." : "Informe um número positivo.",
    };
  }

  return { value: parsed, error: "" };
}

function assignMeasurement(
  errors: Partial<Record<keyof VendorPackagingDraft, string>>,
  field: MeasurementField,
  value: string,
  scale: number,
  allowZero: boolean,
) {
  const parsed = parseScaledInteger(value, scale, allowZero);
  if (parsed.error) {
    errors[field] = parsed.error;
  }
  return parsed.value;
}

/**
 * Converte e valida o formulário de cubagem para o contrato REST em mm/g.
 *
 * @param draft Rascunho nas unidades da interface.
 * @returns Payload canônico ou erros por campo.
 */
export function convertPackagingDraftToPayload(
  draft: VendorPackagingDraft,
): VendorPackagingConversionResult {
  const errors: Partial<Record<keyof VendorPackagingDraft, string>> = {};
  const code = draft.code.trim().toUpperCase();
  const label = draft.label.trim();

  if (!code) errors.code = "Informe o código da caixa.";
  if (!label) errors.label = "Informe o nome da caixa.";

  const lengthMm = assignMeasurement(errors, "lengthCm", draft.lengthCm, 10, false);
  const widthMm = assignMeasurement(errors, "widthCm", draft.widthCm, 10, false);
  const heightMm = assignMeasurement(errors, "heightCm", draft.heightCm, 10, false);
  const tareWeightG = draft.tareKg.trim()
    ? assignMeasurement(errors, "tareKg", draft.tareKg, 1000, true)
    : 0;
  const maxPayloadG = draft.maxPayloadKg.trim()
    ? assignMeasurement(errors, "maxPayloadKg", draft.maxPayloadKg, 1000, false)
    : null;

  if (Object.keys(errors).length > 0) {
    return { errors, payload: null };
  }

  const payload: VendorPackagingPayload = {
    code,
    height_mm: heightMm as number,
    label,
    length_mm: lengthMm as number,
    max_payload_g: maxPayloadG,
    source: draft.source,
    tare_weight_g: tareWeightG as number,
    width_mm: widthMm as number,
  };

  return { errors, payload };
}
