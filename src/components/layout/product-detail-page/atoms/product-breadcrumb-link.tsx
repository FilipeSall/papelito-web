import Link from "next/link";

interface ProductBreadcrumbLinkProps {
  /** Texto exibido no item do breadcrumb. */
  label: string;
  /** URL navegável para itens não ativos. */
  href?: string;
  /** Define o item atual (último nível), sem link. */
  isCurrent?: boolean;
}

/**
 * Item atômico de breadcrumb para a página de produto.
 *
 * Renderiza um link navegável para níveis anteriores e texto estático
 * para o item atual da trilha.
 */
export function ProductBreadcrumbLink({
  label,
  href,
  isCurrent = false,
}: Readonly<ProductBreadcrumbLinkProps>) {
  if (isCurrent || !href) {
    return (
      <span className="text-xs font-medium leading-4 text-brand-dark" aria-current="page">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="text-xs font-normal leading-4 text-[#99A1AF] transition-colors hover:text-[#6B7280]"
    >
      {label}
    </Link>
  );
}
