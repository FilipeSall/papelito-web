import { act, renderHook, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../../test/msw/server";
import { useProductPresentation } from "./use-product-presentation";

const ENDPOINT = "*/api/catalog/products/:productId/presentation";
function presentation(vendorId: number | null, description = "Canônico") {
  return {
    product_id: 123, vendor_id: vendorId, description,
    summary: "Resumo canônico", description_source: vendorId === null || vendorId === 3 ? "papelito" : "vendor",
  };
}

describe("useProductPresentation", () => {
  it("reaproveita o SSR correspondente, mas retry e mudança de contexto fazem nova leitura", async () => {
    const calls: number[] = [];
    server.use(http.get(ENDPOINT, ({ request }) => {
      const vendorId = Number(new URL(request.url).searchParams.get("vendor_id"));
      calls.push(vendorId);
      return HttpResponse.json(presentation(vendorId, "Atual " + vendorId));
    }));
    const initial = { productId: 123, vendorId: 1, description: "SSR A", summary: "Resumo", descriptionSource: "vendor" as const };
    const { result, rerender } = renderHook(
      ({ vendorId }) => useProductPresentation("123", vendorId, initial),
      { initialProps: { vendorId: 1 } },
    );
    expect(result.current.presentation?.description).toBe("SSR A");
    expect(result.current.loading).toBe(false);
    await delay(30);
    expect(calls).toEqual([]);
    rerender({ vendorId: 2 });
    await waitFor(() => expect(result.current.presentation?.description).toBe("Atual 2"));
    rerender({ vendorId: 1 });
    await waitFor(() => expect(result.current.presentation?.description).toBe("Atual 1"));
    act(() => result.current.retry());
    await waitFor(() => expect(calls).toEqual([2, 1, 1]));
  });

  it("troca A → B → C sem atribuir resposta atrasada de A a B", async () => {
    server.use(http.get(ENDPOINT, async ({ request }) => {
      const vendorId = Number(new URL(request.url).searchParams.get("vendor_id"));
      if (vendorId === 1) await delay(80);
      return HttpResponse.json(presentation(vendorId, vendorId === 3 ? "Canônico" : "Vendor " + vendorId));
    }));
    const { result, rerender } = renderHook(
      ({ vendorId }) => useProductPresentation("123", vendorId, null, true),
      { initialProps: { vendorId: 1 } },
    );
    rerender({ vendorId: 2 });
    expect(result.current.presentation).toBeNull();
    await waitFor(() => expect(result.current.presentation?.description).toBe("Vendor 2"));
    await delay(100);
    expect(result.current.presentation?.vendorId).toBe(2);
    rerender({ vendorId: 3 });
    expect(result.current.presentation).toBeNull();
    await waitFor(() => expect(result.current.presentation?.descriptionSource).toBe("papelito"));
  });

  it("anônimo ou contexto não confirmado não consulta personalização", async () => {
    let calls = 0;
    server.use(http.get(ENDPOINT, () => { calls++; return HttpResponse.json(presentation(1)); }));
    const { result, rerender } = renderHook(
      ({ vendorId, enabled }: { vendorId: number | null; enabled: boolean }) => useProductPresentation("123", vendorId, null, enabled),
      { initialProps: { vendorId: 1 as number | null, enabled: false } },
    );
    expect(result.current.presentation).toBeNull();
    rerender({ vendorId: null, enabled: true });
    await delay(20);
    expect(calls).toBe(0);
  });

  it("erro técnico é explícito; retry busca novamente", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ message: "Falha técnica" }, { status: 500 })));
    const { result } = renderHook(() => useProductPresentation("123", 2, null, true));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.presentation).toBeNull();
    server.use(http.get(ENDPOINT, () => HttpResponse.json(presentation(2, "Recuperado"))));
    result.current.retry();
    await waitFor(() => expect(result.current.presentation?.description).toBe("Recuperado"));
  });

  it("recusa dados de outro produto/contexto", async () => {
    server.use(http.get(ENDPOINT, () => HttpResponse.json(presentation(1, "Errado"))));
    const { result } = renderHook(() => useProductPresentation("123", 2, null, true));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.presentation).toBeNull();
  });
});
