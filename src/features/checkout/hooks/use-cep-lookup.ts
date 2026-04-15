"use client";

import { useState } from "react";
import { lookupCep } from "../services/lookup-cep";
import type { CepLookupResult } from "../types/checkout";

type UseCepLookupReturn = {
  isLoading: boolean;
  error: string | null;
  fetchCep: (digits: string) => Promise<CepLookupResult | null>;
};

export function useCepLookup(): UseCepLookupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCep(digits: string): Promise<CepLookupResult | null> {
    setIsLoading(true);
    setError(null);

    try {
      return await lookupCep(digits);
    } catch {
      setError("CEP não encontrado.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, fetchCep };
}
