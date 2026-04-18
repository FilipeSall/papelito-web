/**
 * Status possível de um cupom na área do usuário.
 */
export type ProfileCouponStatus = "active" | "used" | "expired";

/**
 * Filtro de visualização da lista de cupons.
 */
export type ProfileCouponFilter = "all" | ProfileCouponStatus;

/**
 * Modelo de um cupom exibido no perfil.
 */
export interface ProfileCouponItem {
  id: string;
  code: string;
  description: string;
  highlight: string;
  minimumLabel?: string;
  expiresAtLabel: string;
  status: ProfileCouponStatus;
}

/**
 * Payload retornado pela API de cupons do perfil.
 */
export interface ProfileCouponsPayload {
  coupons: ProfileCouponItem[];
  activeCountLabel: string;
}
