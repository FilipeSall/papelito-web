"use client";

import { useState, type FormEvent } from "react";

import { normalizeUserCep } from "@/features/catalog/constants/user-cep";
import type { ProductAvailabilityResponse } from "@/features/catalog/types/product-availability";

interface ProductDetailCepAvailabilityProps {
  productId: string;
}

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "result"; available: boolean }
  | { status: "error"; message: string };

export function ProductDetailCepAvailability({
  productId,
}: Readonly<ProductDetailCepAvailabilityProps>) {
  const [cep, setCep] = useState("");
  const [lookupState, setLookupState] = useState<LookupState>({
    status: "idle",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCep = normalizeUserCep(cep);

    if (!normalizedCep) {
      setLookupState({ status: "error", message: "Informe um CEP válido." });
      return;
    }

    setLookupState({ status: "loading" });

    try {
      const params = new URLSearchParams({
        productIds: productId,
        cep: normalizedCep,
      });
      const response = await fetch(
        `/api/catalog/availability?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (response.status === 429) {
        setLookupState({
          status: "error",
          message:
            "Muitas consultas em sequência. Aguarde um pouco e tente novamente.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("availability_request_failed");
      }

      const payload = (await response.json()) as ProductAvailabilityResponse;
      const productAvailability = payload.products[productId];

      if (payload.status !== "ok" || !productAvailability) {
        setLookupState({
          status: "error",
          message: "Não foi possível consultar a disponibilidade agora.",
        });
        return;
      }

      setLookupState({
        status: "result",
        available: productAvailability.available,
      });
    } catch {
      setLookupState({
        status: "error",
        message: "Não foi possível consultar a disponibilidade agora.",
      });
    }
  }

  const isLoading = lookupState.status === "loading";
  const fieldError =
    lookupState.status === "error" ? lookupState.message : undefined;

  return (
    <section className="mt-6 border-2 border-[#E5E7EB] bg-white p-4">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-brand-dark">
        Consulte a disponibilidade
      </h2>
      <p className="mt-1 text-sm leading-5 text-[#6A7282]">
        Informe seu CEP para verificar estoque regional deste produto.
      </p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start"
        onSubmit={handleSubmit}
      >
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="product-detail-cep">
            CEP para consultar disponibilidade
          </label>
          <input
            id="product-detail-cep"
            name="product-detail-cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            placeholder="00000-000"
            value={cep}
            onChange={(event) => {
              setCep(event.target.value);
              if (lookupState.status !== "idle") {
                setLookupState({ status: "idle" });
              }
            }}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={
              fieldError ? "product-detail-cep-message" : undefined
            }
            className="h-12 w-full rounded-full border-2 border-[#E5E7EB] px-4 text-sm text-brand-dark outline-none transition placeholder:text-[#99A1AF] focus:border-brand-dark"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-full bg-brand-dark px-5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Consultando" : "Consultar"}
        </button>
      </form>
      <div
        id="product-detail-cep-message"
        className="mt-2 min-h-5 text-sm"
        aria-live="polite"
      >
        {lookupState.status === "loading" ? (
          <span className="text-[#6A7282]">
            Consultando estoque regional...
          </span>
        ) : null}
        {lookupState.status === "error" ? (
          <span className="text-red-700" role="alert">
            {lookupState.message}
          </span>
        ) : null}
        {lookupState.status === "result" ? (
          <span
            className={
              lookupState.available ? "text-emerald-700" : "text-[#6A7282]"
            }
          >
            {lookupState.available
              ? "Produto disponível para este CEP."
              : "Produto sem estoque regional para este CEP."}
          </span>
        ) : null}
      </div>
    </section>
  );
}
