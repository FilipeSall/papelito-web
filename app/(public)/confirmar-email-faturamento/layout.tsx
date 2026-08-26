import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Confirmar e-mail de faturamento");

/**
 * Existe apenas para marcar o fluxo como não indexável: a página é um Client Component e
 * Client Component não pode exportar `metadata`.
 */
export default function ConfirmarEmailFaturamentoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
