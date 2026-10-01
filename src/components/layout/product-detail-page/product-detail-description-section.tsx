import type { DescriptionParagraph } from "./product-detail-helpers";

interface ProductDetailDescriptionSectionProps {
  /** Consulta contextual ainda em andamento, com referência canônica visível. */
  loading?: boolean;
  /** Falha técnica; não significa que o vendor deixou de personalizar. */
  error?: string | null;
  /** Refaz a consulta do contexto atual. */
  onRetry?: () => void;
  paragraphs: DescriptionParagraph[];
}

export function ProductDetailDescriptionSection({
  paragraphs,
  loading = false,
  error = null,
  onRetry,
}: Readonly<ProductDetailDescriptionSectionProps>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB]">
        <div className="inline-flex h-13.5 items-center border-b-2 border-brand-yellow px-4 text-sm font-black uppercase tracking-[-0.3125px] text-brand-dark md:px-8 md:text-base">
          Descrição
        </div>
      </div>
      <div className="flex flex-col gap-3 px-8 py-8">
        {loading ? <p role="status" className="text-xs">Consultando descrição do vendor…</p> : null}
        {error ? (
          <div role="alert" className="text-sm">
            <p>A descrição do vendor está indisponível. Exibindo a referência da Papelito.</p>
            <button type="button" onClick={onRetry} className="mt-2 font-semibold underline focus-visible:outline-2 focus-visible:outline-brand-yellow">Tentar novamente</button>
          </div>
        ) : null}
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.id}
            className="whitespace-pre-line text-sm font-normal leading-[22.75px] tracking-[-0.150391px] text-[#4A5565]"
          >
            {paragraph.text}
          </p>
        ))}
      </div>
    </section>
  );
}
