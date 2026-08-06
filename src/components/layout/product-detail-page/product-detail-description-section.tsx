import type { DescriptionParagraph } from "./product-detail-helpers";

interface ProductDetailDescriptionSectionProps {
  paragraphs: DescriptionParagraph[];
}

export function ProductDetailDescriptionSection({
  paragraphs,
}: Readonly<ProductDetailDescriptionSectionProps>) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB]">
        <div className="inline-flex h-13.5 items-center border-b-2 border-brand-yellow px-4 text-sm font-black uppercase tracking-[-0.3125px] text-brand-dark md:px-8 md:text-base">
          Descrição
        </div>
      </div>
      <div className="flex flex-col gap-3 px-8 py-8">
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
