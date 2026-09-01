interface TagProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Etiqueta de papel: chapa kraft cheia com a ponta direita inclinada, no mesmo
 * recorte da placa do logo. Vazada, ela sumia no amarelo em que vive.
 */
export function Tag({ children, className }: TagProps) {
  return (
    <p
      className={`inline-flex w-fit items-center gap-2 tag-cut bg-[#faf8f2] py-1.5 pl-3 pr-5 text-[0.6875rem] font-black uppercase leading-4 tracking-[0.18em] text-brand-dark ${className ?? ""}`}
    >
      <span aria-hidden className="inline-block size-1.5 rotate-45 bg-brand-dark" />
      {children}
    </p>
  );
}
