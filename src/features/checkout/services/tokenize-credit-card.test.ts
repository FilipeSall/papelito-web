import { afterEach, describe, expect, it, vi } from "vitest";

import { tokenizeCreditCard } from "./tokenize-credit-card";

describe("tokenizeCreditCard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("tokenizes with the public key and only the Content-Type header", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAGARME_PUBLIC_KEY", "pk_test_example");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "token_123",
          card: { last_four_digits: "0010" },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      tokenizeCreditCard({
        holderName: "Maria da Silva",
        cardNumber: "4000000000000010",
        expiryDate: "12/30",
        cvv: "123",
      }),
    ).resolves.toEqual({ tokenId: "token_123", last4: "0010" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pagar.me/core/v5/tokens?appId=pk_test_example",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("returns a safe Pagar.me validation message when tokenization fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAGARME_PUBLIC_KEY", "pk_test_example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Invalid request",
            errors: {
              "request.card.number": ["is invalid"],
            },
          }),
          { status: 400 },
        ),
      ),
    );

    await expect(
      tokenizeCreditCard({
        holderName: "Maria da Silva",
        cardNumber: "4000000000000010",
        expiryDate: "12/30",
        cvv: "123",
      }),
    ).rejects.toThrow("Invalid request (request.card.number: is invalid)");
  });
});
