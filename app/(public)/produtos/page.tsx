import {
  ProductsHeroBanner,
  ProductsSection,
} from "@/components/layout/products-page";

/**
 * Página de listagem de produtos.
 *
 * Exibe o catálogo completo de produtos da Papelito com:
 * - Banner hero com título e descrição
 * - Filtros por categoria (tabs) e sidebar (preço/categorias)
 * - Grid responsivo de produtos
 *
 * Os filtros são atualmente estáticos (sem funcionalidade).
 * TODO: Implementar filtros dinâmicos via query params ou estado.
 */
export default function ProdutosPage() {
  return (
    <main className="flex flex-col bg-white">
      <ProductsHeroBanner />
      <ProductsSection />
    </main>
  );
}
