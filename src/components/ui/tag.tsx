interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps) {
  return (
    <p
      className={`font-black text-xs leading-4 tracking-[1.2px] uppercase text-brand-dark/60 ${className ?? ""}`}
    >
      {children}
    </p>
  );
}
