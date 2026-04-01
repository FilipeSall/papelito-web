type ProfileBadgeProps = {
  label: string;
};

/**
 * Badge de status do usuário (ex: "MEMBRO PREMIUM").
 * Estilizado com fundo amarelo e texto escuro.
 */
export function ProfileBadge({ label }: ProfileBadgeProps) {
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-brand-yellow px-3 text-xs font-black text-brand-dark">
      {label}
    </span>
  );
}
