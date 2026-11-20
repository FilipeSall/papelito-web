import type { VendorOrderBox } from "@/features/vendor-orders/types/vendor-orders";

const MEASURE = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const WEIGHT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Quantas caixas o pedido leva, em texto para a linha de cabeçalho. */
export function packingHeadline(boxes: readonly VendorOrderBox[]): string {
  return `${boxes.length} ${boxes.length === 1 ? "caixa" : "caixas"}`;
}

/** Medidas de uma caixa como o vendor confere na balança e na trena. */
export function boxLabel(box: VendorOrderBox): string {
  const dimensions = [box.lengthCm, box.widthCm, box.heightCm].map((value) => MEASURE.format(value)).join(" × ");
  return `${dimensions} cm · ${WEIGHT.format(box.weightKg)} kg`;
}

/**
 * Caixas que o vendor precisa despachar, com as medidas usadas na cotação do frete. São a referência
 * do que foi cobrado: postar em outra quantidade ou tamanho pode gerar cobrança complementar.
 */
export function VendorOrderPacking({ boxes }: Readonly<{ boxes: readonly VendorOrderBox[] }>) {
  return (
    <>
      <span className="block font-black">{packingHeadline(boxes)}</span>
      <ol className="mt-1 grid gap-0.5 text-[#231f20]/74">
        {boxes.map((box, index) => (
          <li key={`${index}:${boxLabel(box)}`}>
            Caixa {index + 1}: {boxLabel(box)}
          </li>
        ))}
      </ol>
    </>
  );
}
