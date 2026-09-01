/**
 * Seta da marca: o mesmo traço desenhado à mão usado no site institucional
 * da Papelito, em vez de uma seta geométrica.
 */
export function BrandArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 15 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.1239 5.33226C14.2421 5.20746 12.6981 4.62811 11.9609 3.97455C11.4704 3.75385 10.3753 3.28505 8.96724 2.90191C7.71566 2.56134 1.36778 -0.607907 0.820908 0.103793C-0.344619 1.64139 8.75109 4.84901 8.84867 5.27675C9.00139 5.94624 2.89636 8.63937 2.11702 9.4041C1.91426 9.58731 1.61319 11.4388 2.01837 12C5.75036 10.9921 8.50036 8.46703 12.0606 6.81358C12.9016 6.4261 13.8049 5.63175 13.9 5.51225"
        fill="currentColor"
      />
    </svg>
  );
}
