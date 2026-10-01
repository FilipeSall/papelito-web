import { expect, it, vi } from "vitest";
const dependencies = vi.hoisted(() => ({ cep: vi.fn(), coverage: vi.fn(), presentation: vi.fn() }));
vi.mock("./get-account-coverage-cep", () => ({ getAccountCoverageCepContext: dependencies.cep }));
vi.mock("./get-coverage", () => ({ getCoverage: dependencies.coverage }));
vi.mock("./get-product-presentation", () => ({ getProductPresentation: dependencies.presentation }));
import { getProductDetailContext } from "./get-product-detail-context";

it("a cobertura não espera pela descrição contextual para começar", async () => {
  let release!: (value: null) => void;
  dependencies.presentation.mockReturnValue(new Promise((resolve) => { release = resolve; }));
  dependencies.cep.mockResolvedValue({ cep: "70879060" });
  dependencies.coverage.mockResolvedValue({ "123": { hasCoverage: true, bestVendor: { qty: 7 } } });
  const pending = getProductDetailContext("123", { ok: true, vendor: { vendorId: 1, storeName: "A", city: "", state: "", distanceKm: null, leadTimeDays: 1, isDefault: false } }, true);
  await vi.waitFor(() => expect(dependencies.coverage).toHaveBeenCalledWith("70879060", ["123"], 1));
  release(null);
  expect(await pending).toEqual({ initialPresentation: null, selectedVendorStockQty: 7, regionBlock: null });
});
