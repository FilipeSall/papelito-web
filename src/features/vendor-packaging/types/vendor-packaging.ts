/**
 * Origem de um perfil de embalagem.
 */
export type VendorPackagingSource = "rpc" | "custom";

/**
 * Perfil persistido de caixa do vendor.
 */
export type VendorPackagingProfile = {
  active: boolean;
  code: string;
  createdAt: string;
  heightMm: number;
  id: number;
  label: string;
  lengthMm: number;
  maxPayloadG: number | null;
  source: VendorPackagingSource;
  tareWeightG: number;
  updatedAt: string;
  version: number;
  widthMm: number;
};

/**
 * Modelo RPC oferecido como preenchimento do formulário.
 */
export type VendorPackagingCatalogItem = {
  category: string;
  code: string;
  heightMm: number;
  label: string;
  lengthMm: number;
  maxPayloadG: number | null;
  widthMm: number;
};

/**
 * Dados carregados pela página de cubagem.
 */
export type VendorPackagingSnapshot = {
  catalog: VendorPackagingCatalogItem[];
  items: VendorPackagingProfile[];
  loadFailed: boolean;
};

/**
 * Rascunho do formulário nas unidades apresentadas ao vendor.
 */
export type VendorPackagingDraft = {
  code: string;
  heightCm: string;
  label: string;
  lengthCm: string;
  maxPayloadKg: string;
  source: VendorPackagingSource;
  tareKg: string;
  widthCm: string;
};

/**
 * Corpo canônico enviado ao WordPress.
 */
export type VendorPackagingPayload = {
  code: string;
  height_mm: number;
  label: string;
  length_mm: number;
  max_payload_g: number | null;
  source?: VendorPackagingSource;
  tare_weight_g: number;
  width_mm: number;
};

/**
 * Resultado da conversão e validação local do formulário.
 */
export type VendorPackagingConversionResult = {
  errors: Partial<Record<keyof VendorPackagingDraft, string>>;
  payload: VendorPackagingPayload | null;
};
