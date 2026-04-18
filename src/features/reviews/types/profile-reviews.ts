/**
 * Aba de avaliação exibida na página de perfil.
 */
export type ProfileReviewsTab = "published" | "pending";

/**
 * Avaliação já publicada pelo usuário.
 */
export interface PublishedProfileReview {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  reviewedAt: string;
  title: string;
  comment: string;
  helpfulCount: number;
}

/**
 * Produto aguardando avaliação do usuário.
 */
export interface PendingProfileReview {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  purchasedAt: string;
}

/**
 * Payload completo consumido na tela de avaliações.
 */
export interface ProfileReviewsPayload {
  published: PublishedProfileReview[];
  pending: PendingProfileReview[];
}
