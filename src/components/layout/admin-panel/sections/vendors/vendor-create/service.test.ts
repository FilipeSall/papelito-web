import { afterEach, describe, expect, it, vi } from "vitest";

import { createInitialVendorCreateForm } from "./form";
import { createAdminVendor } from "./service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createAdminVendor", () => {
  it("posts the unchanged payload to the admin proxy and returns the created vendor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vendor: { id: 7, email: "vendor@example.com" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const form = createInitialVendorCreateForm();
    const vendor = await createAdminVendor(form);

    expect(vendor).toEqual({ id: 7, email: "vendor@example.com" });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
  });

  it("surfaces the proxy error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "CNPJ já cadastrado." }),
    }));

    await expect(createAdminVendor(createInitialVendorCreateForm())).rejects.toThrow("CNPJ já cadastrado.");
  });
});
