const STROKE = "stroke-current [stroke-linecap:square] [stroke-linejoin:miter] [vector-effect:non-scaling-stroke]";

type BoxGlyphProps = {
  className?: string;
  heightMm: number;
  lengthMm: number;
  widthMm: number;
};

const VIEW = 56;
const PADDING = 4;
const DEPTH_RATIO = 0.42;

function boxGeometry(lengthMm: number, widthMm: number, heightMm: number) {
  const usable = VIEW - PADDING * 2;
  const depthUnits = Math.max(lengthMm, 1) * DEPTH_RATIO;
  const spanX = Math.max(widthMm, 1) + depthUnits;
  const spanY = Math.max(heightMm, 1) + depthUnits;
  const scale = Math.min(usable / spanX, usable / spanY);
  const depth = depthUnits * scale;
  const width = widthMm * scale;
  const height = heightMm * scale;
  const left = (VIEW - (width + depth)) / 2;
  const top = (VIEW - (height + depth)) / 2;

  return { depth, height, left, top, width };
}

/**
 * Silhueta da caixa desenhada nas proporções reais dela, em projeção cavaleira.
 *
 * O traço não escala com o slot (`non-scaling-stroke`): a mesma silhueta aparece na grade, na
 * prateleira e na bancada em tamanhos diferentes, e sem isso ela engordaria junto.
 *
 * Não é ornamento: comprimento vira profundidade, largura vira frente e altura vira altura, e o
 * conjunto é escalado para preencher o slot sem distorcer a razão entre os três. Uma caixa rasa e
 * larga desenha diferente de um cubo, e é assim que o vendor reconhece o modelo que já usa antes
 * de ler a medida. A comparação de tamanho absoluto fica com os números, não com a silhueta.
 */
export function PackagingBoxGlyph({
  className,
  heightMm,
  lengthMm,
  widthMm,
}: Readonly<BoxGlyphProps>) {
  const { depth, height, left, top, width } = boxGeometry(lengthMm, widthMm, heightMm);
  const frontTop = top + depth;
  const frontBottom = frontTop + height;
  const right = left + width;
  const backTop = top;
  const backRight = right + depth;

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      strokeWidth={2}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className={STROKE}
        d={`M${left} ${frontTop}L${left + depth} ${backTop}L${backRight} ${backTop}L${right} ${frontTop}Z`}
      />
      <path
        className={STROKE}
        d={`M${right} ${frontTop}L${backRight} ${backTop}L${backRight} ${backTop + height}L${right} ${frontBottom}Z`}
      />
      <rect
        className={STROKE}
        height={height}
        width={width}
        x={left}
        y={frontTop}
      />
      <path
        className={`${STROKE} opacity-45`}
        d={`M${left + depth / 2} ${backTop + depth / 2}L${right + depth / 2} ${backTop + depth / 2}`}
      />
    </svg>
  );
}

type StepGlyphProps = {
  className?: string;
};

/**
 * Marco 1 — escolher modelos: três caixas de tamanhos diferentes, a da frente marcada.
 */
export function PackagingPickGlyph({ className }: Readonly<StepGlyphProps>) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className={`${STROKE} opacity-40`} height="9" width="9" x="3" y="5" />
      <rect className={`${STROKE} opacity-40`} height="11" width="11" x="18" y="3" />
      <rect className={STROKE} height="13" width="15" x="5" y="16" />
      <path className={STROKE} d="M9 22l3 3 6-6" />
    </svg>
  );
}

/**
 * Marco 2 — conferir medidas: caixa com cota de largura e cota de altura.
 */
export function PackagingMeasureGlyph({ className }: Readonly<StepGlyphProps>) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className={STROKE} height="14" width="18" x="4" y="6" />
      <path className={STROKE} d="M4 25h18" />
      <path className={STROKE} d="M4 23v4M22 23v4" />
      <path className={STROKE} d="M27 6v14" />
      <path className={STROKE} d="M25 6h4M25 20h4" />
      <path className={`${STROKE} opacity-45`} d="M8 10h10" />
    </svg>
  );
}

/**
 * Marco 3 — pronto para despachar: caixa lacrada com etiqueta e o traço de saída.
 */
export function PackagingDispatchGlyph({ className }: Readonly<StepGlyphProps>) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className={STROKE} height="16" width="18" x="10" y="8" />
      <path className={STROKE} d="M19 8v16" />
      <rect className={STROKE} height="5" width="7" x="12" y="11" />
      <path className={STROKE} d="M2 12h5M2 17h7M2 22h5" />
    </svg>
  );
}

/**
 * Glifo da barra de prontidão: caixa sem medida física, com a cota cortada.
 */
export function PackagingMissingDataGlyph({ className }: Readonly<StepGlyphProps>) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className={STROKE} height="15" width="17" x="4" y="5" />
      <path className={`${STROKE} opacity-45`} d="M4 10h17" />
      <path className={STROKE} d="M4 25h17" />
      <path className={STROKE} d="M4 23v4M21 23v4" />
      <path className={STROKE} d="M25 9l6 6M31 9l-6 6" />
    </svg>
  );
}

/**
 * Glifo de caixa própria: o contorno tracejado que a grade usa como convite de cadastro.
 */
export function PackagingCustomGlyph({ className }: Readonly<StepGlyphProps>) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        className={STROKE}
        height="20"
        strokeDasharray="4 3"
        width="24"
        x="4"
        y="6"
      />
      <path className={STROKE} d="M16 12v8M12 16h8" />
    </svg>
  );
}
