import Link from "next/link";

import type { PapelitoCategory } from "@/features/catalog/services/get-papelito-categories";

interface CategoryIntroProps {
  category: PapelitoCategory;
}

/**
 * Cabeçalho da landing de categoria: trilha, `h1` e descrição.
 *
 * É o único bloco de conteúdo próprio da rota — a listagem abaixo é a mesma da vitrine. Existe
 * para a página ter um `h1` específico da categoria em vez de repetir o título da vitrine.
 */
export function CategoryIntro({ category }: Readonly<CategoryIntroProps>) {
  const subcategoryNames = category.subcategories.map((subcategory) => subcategory.name);

  return (
    <section className="bg-white pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <nav aria-label="Trilha de navegação" className="mb-4 text-sm text-text-secondary">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand-dark">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/produtos" className="hover:text-brand-dark">
                Produtos
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-brand-dark">
              {category.name}
            </li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-brand-dark md:text-3xl">
          {category.name} para revenda no atacado
        </h1>

        {category.description ? (
          <p className="mt-3 max-w-3xl text-sm text-text-secondary md:text-base">
            {category.description}
          </p>
        ) : null}

        {subcategoryNames.length > 0 ? (
          <p className="mt-3 max-w-3xl text-sm text-text-secondary">
            Opções disponíveis: {subcategoryNames.join(" · ")}.
          </p>
        ) : null}
      </div>
    </section>
  );
}
