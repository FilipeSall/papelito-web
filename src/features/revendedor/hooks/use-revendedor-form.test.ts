import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRevendedorForm } from "./use-revendedor-form";

describe("useRevendedorForm", () => {
  it("blocks invalid submission and exposes field errors", async () => {
    const onValidSubmit = vi.fn();
    const { result } = renderHook(() => useRevendedorForm({ onValidSubmit }));

    await act(async () => {
      const response = await result.current.handleSubmit();
      expect(response).toBe(false);
    });

    expect(onValidSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.storeName).toBe("Informe o nome da loja.");
    expect(result.current.errors.cnpj).toBe("Informe um CNPJ válido.");
  });

  it("formats fields and submits normalized values", async () => {
    const onValidSubmit = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRevendedorForm({ onValidSubmit }));

    act(() => {
      result.current.setFieldValue("storeName", " Loja Papelito ");
      result.current.setFieldValue("firstName", " Ana ");
      result.current.setFieldValue("lastName", " Souza ");
      result.current.setFieldValue("cnpj", "12345678000195");
      result.current.setFieldValue("phone", "11987654321");
      result.current.setFieldValue("email", "ana@papelito.com");
      result.current.setFieldValue("instagram", "@ana");
      result.current.setFieldValue("city", "Sao Paulo");
      result.current.setFieldValue("state", "SP");
      result.current.setFieldValue("cep", "01310930");
      result.current.setFieldValue("minCep", "01001000");
      result.current.setFieldValue("maxCep", "02002000");
      result.current.setFieldValue("discoveryChannel", "Google");
      result.current.setHasSoldPapelito("sim");
    });

    await act(async () => {
      const response = await result.current.handleSubmit();
      expect(response).toBe(true);
    });

    expect(onValidSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: "Loja Papelito",
        firstName: "Ana",
        lastName: "Souza",
        cnpj: "12.345.678/0001-95",
        phone: "(11) 98765-4321",
        cep: "01310-930",
        minCep: "01001-000",
        maxCep: "02002-000",
        instagram: "ana",
      }),
    );
  });
});
