/** Origem da descrição efetiva, determinada exclusivamente pelo WordPress. */
export type DescriptionSource = "papelito" | "vendor";

/** Visão privada do próprio vendor; nunca usada como apresentação pública. */
export interface VendorProductCustomization {
  productId: number;
  vendorId: number;
  canonicalDescription: string;
  vendorDescription: string | null;
  /** Se o texto guardado do vendor é o exibido; falso mantém o texto e mostra o da Papelito. */
  vendorDescriptionEnabled: boolean;
  effectiveDescription: string;
  descriptionSource: DescriptionSource;
  canEdit: boolean;
  updatedAt: string | null;
}
