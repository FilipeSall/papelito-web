import { ProfileBadge } from "./profile-badge";
import { ProfilePoints } from "./profile-points";

type ProfileInfoProps = {
  name: string;
  email: string;
  badge?: string;
  points?: number;
};

/**
 * Identificação do comprador no topo do painel: nome, e-mail de acesso e etiquetas.
 */
export function ProfileInfo({ name, email, badge, points }: ProfileInfoProps) {
  const displayName = name || "Minha conta";
  const displayEmail = email || "Seus dados de acesso aparecerão aqui";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h1 className="text-2xl font-black uppercase leading-[1.1] tracking-tight text-white md:text-3xl">
        {displayName}
      </h1>
      <p className="truncate text-sm font-semibold tracking-[0.02em] text-brand-yellow">
        {displayEmail}
      </p>
      {badge || points !== undefined ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {badge ? <ProfileBadge label={badge} /> : null}
          {points !== undefined ? <ProfilePoints points={points} /> : null}
        </div>
      ) : null}
    </div>
  );
}
