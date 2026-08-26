import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Cadastro");

/**
 * Existe apenas para marcar o fluxo como não indexável: a página é um Client Component e
 * Client Component não pode exportar `metadata`.
 */
export default function CadastroLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
