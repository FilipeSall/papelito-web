import { describe, expect, it } from "vitest";

import { convertPackagingDraftToPayload } from "./packaging-measurements";

describe("packaging-measurements", () => {
  it("converte centímetros e quilos em inteiros canônicos", () => {
    const result = convertPackagingDraftToPayload({
      code: "CX-01",
      heightCm: "4,5",
      label: "Caixa própria",
      lengthCm: "16,5",
      maxPayloadKg: "1,234",
      source: "custom",
      tareKg: "0",
      widthCm: "12",
    });

    expect(result).toEqual({
      payload: {
        code: "CX-01",
        height_mm: 45,
        label: "Caixa própria",
        length_mm: 165,
        max_payload_g: 1234,
        source: "custom",
        tare_weight_g: 0,
        width_mm: 120,
      },
      errors: {},
    });
  });

  it("recusa conversões que não resultam em inteiros", () => {
    const result = convertPackagingDraftToPayload({
      code: "CX-01",
      heightCm: "4,25",
      label: "Caixa própria",
      lengthCm: "16",
      maxPayloadKg: "",
      source: "custom",
      tareKg: "0,0015",
      widthCm: "12",
    });

    expect(result.payload).toBeNull();
    expect(result.errors.heightCm).toBeDefined();
    expect(result.errors.tareKg).toBeDefined();
  });
});
