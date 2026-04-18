"use client";

import Image from "next/image";

import {
  useProfileReviews,
  type PendingProfileReview,
  type ProfileReviewsTab,
  type PublishedProfileReview,
} from "@/features/reviews";

type ReviewsTabButtonProps = {
  tab: ProfileReviewsTab;
  label: string;
  isActive: boolean;
  badgeCount?: number;
  onSelect: (tab: ProfileReviewsTab) => void;
};

/**
 * Ícone de estrela usado no resumo visual da nota da avaliação.
 */
function ReviewStar({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden
      className={`h-3 w-3 ${filled ? "text-brand-yellow" : "text-gray-300"}`}
      fill="currentColor"
      viewBox="0 0 12 12"
    >
      <path d="M6 1L7.41 4.05L10.8 4.32L8.28 6.52L9.05 9.84L6 8.03L2.95 9.84L3.72 6.52L1.2 4.32L4.59 4.05L6 1Z" />
    </svg>
  );
}

/**
 * Grupo visual de estrelas preenchidas com base na nota da avaliação.
 */
function ReviewStars({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-0.5" aria-label={`${safeRating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <ReviewStar key={`review-star-${index}`} filled={index < safeRating} />
      ))}
    </div>
  );
}

/**
 * Botão de aba usado no switch entre "Minhas Avaliações" e "Aguardando Avaliação".
 */
function ReviewsTabButton({
  tab,
  label,
  isActive,
  badgeCount,
  onSelect,
}: ReviewsTabButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-black tracking-[-0.15px] transition ${
        isActive
          ? "bg-brand-dark text-white"
          : "bg-transparent text-gray-500 hover:bg-gray-100"
      }`}
      onClick={() => onSelect(tab)}
      type="button"
    >
      <span>{label}</span>
      {typeof badgeCount === "number" && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-yellow px-1.5 text-xs text-brand-dark">
          {badgeCount}
        </span>
      )}
    </button>
  );
}

/**
 * Componente de tabs da página de avaliações.
 */
function ReviewsTabs({
  activeTab,
  pendingCount,
  onSelectTab,
}: {
  activeTab: ProfileReviewsTab;
  pendingCount: number;
  onSelectTab: (tab: ProfileReviewsTab) => void;
}) {
  return (
    <div className="inline-flex h-12 items-start gap-1 rounded-[14px] bg-white px-1 py-1 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.1)]">
      <ReviewsTabButton
        isActive={activeTab === "published"}
        label="Minhas Avaliações"
        onSelect={onSelectTab}
        tab="published"
      />
      <ReviewsTabButton
        badgeCount={pendingCount}
        isActive={activeTab === "pending"}
        label="Aguardando Avaliação"
        onSelect={onSelectTab}
        tab="pending"
      />
    </div>
  );
}

/**
 * Card de uma avaliação já publicada pelo usuário.
 */
function PublishedReviewCard({ review }: { review: PublishedProfileReview }) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-[14px] bg-bg-light">
          <Image
            alt={review.productName}
            className="object-contain p-1.5"
            fill
            sizes="80px"
            src={review.productImage}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-brand-dark">{review.productName}</p>
              <div className="mt-1 flex items-center gap-2">
                <ReviewStars rating={review.rating} />
                <span className="text-xs text-gray-400">{review.reviewedAt}</span>
              </div>
            </div>

            <button
              className="text-xs font-medium text-gray-400 transition hover:text-brand-dark"
              type="button"
            >
              Editar
            </button>
          </div>

          <p className="text-base font-black text-brand-dark">{review.title}</p>
          <p className="text-sm leading-6 text-gray-500">{review.comment}</p>
          <p className="text-xs text-gray-400">👍 {review.helpfulCount} pessoas acharam útil</p>
        </div>
      </div>
    </article>
  );
}

/**
 * Card de produto aguardando avaliação do usuário.
 */
function PendingReviewCard({ review }: { review: PendingProfileReview }) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-[14px] bg-bg-light">
          <Image
            alt={review.productName}
            className="object-contain p-1.5"
            fill
            sizes="80px"
            src={review.productImage}
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-brand-dark">{review.productName}</p>
            <p className="mt-1 text-xs text-gray-400">{review.purchasedAt}</p>
            <p className="mt-2 text-sm text-gray-500">
              Você já recebeu este item. Que tal compartilhar sua experiência?
            </p>
          </div>

          <button
            className="inline-flex h-10 shrink-0 items-center rounded-full bg-brand-dark px-5 text-xs font-black uppercase tracking-[0.3px] text-white transition hover:opacity-90"
            type="button"
          >
            Avaliar Produto
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Estado de carregamento da lista de avaliações.
 */
function ReviewsLoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          className="h-36 animate-pulse rounded-2xl bg-white shadow-sm"
          key={`reviews-skeleton-${index}`}
        />
      ))}
    </div>
  );
}

/**
 * Estado de erro para falha no carregamento da API de avaliações.
 */
function ReviewsErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-600">
      {message}
    </div>
  );
}

/**
 * Tela de avaliações da rota privada do perfil.
 *
 * Estrutura:
 * - tabs para alternar entre avaliações publicadas e pendentes;
 * - lista de cards com dados do usuário;
 * - estados de loading e erro.
 */
export function ProfileReviews() {
  const {
    activeTab,
    setActiveTab,
    publishedReviews,
    pendingReviews,
    pendingCount,
    isLoading,
    errorMessage,
  } = useProfileReviews();

  return (
    <section className="flex flex-1 flex-col gap-6">
      <ReviewsTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingCount}
      />

      {isLoading && <ReviewsLoadingState />}

      {!isLoading && errorMessage && <ReviewsErrorState message={errorMessage} />}

      {!isLoading && !errorMessage && (
        <div className="space-y-4">
          {activeTab === "published" ? (
            publishedReviews.length > 0 ? (
              publishedReviews.map((review) => (
                <PublishedReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
                <p className="text-sm text-gray-500">Você ainda não publicou avaliações.</p>
              </div>
            )
          ) : pendingReviews.length > 0 ? (
            pendingReviews.map((review) => (
              <PendingReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-sm text-gray-500">Não há avaliações pendentes no momento.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
