"use client";

import { useEffect, useMemo, useState } from "react";

import { requestProfileReviews } from "../services/request-profile-reviews";
import type {
  PendingProfileReview,
  ProfileReviewsPayload,
  ProfileReviewsTab,
  PublishedProfileReview,
} from "../types/profile-reviews";

type UseProfileReviewsResult = {
  activeTab: ProfileReviewsTab;
  setActiveTab: (tab: ProfileReviewsTab) => void;
  publishedReviews: PublishedProfileReview[];
  pendingReviews: PendingProfileReview[];
  pendingCount: number;
  isLoading: boolean;
  errorMessage: string | null;
};

/**
 * Hook da camada de lógica da tela de avaliações.
 *
 * Responsabilidades:
 * - carregar os dados via service;
 * - controlar tab ativa;
 * - expor estados de carregamento/erro para a UI.
 */
export function useProfileReviews(): UseProfileReviewsResult {
  const [activeTab, setActiveTab] = useState<ProfileReviewsTab>("published");
  const [payload, setPayload] = useState<ProfileReviewsPayload>({
    published: [],
    pending: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await requestProfileReviews(controller.signal);
        setPayload(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao buscar avaliações.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, []);

  const pendingCount = useMemo(() => payload.pending.length, [payload.pending.length]);

  return {
    activeTab,
    setActiveTab,
    publishedReviews: payload.published,
    pendingReviews: payload.pending,
    pendingCount,
    isLoading,
    errorMessage,
  };
}
