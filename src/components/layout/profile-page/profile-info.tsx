import { ProfileBadge } from "./profile-badge";
import { ProfilePoints } from "./profile-points";

type ProfileInfoProps = {
  name: string;
  email: string;
  badge?: string;
  points?: number;
};

/**
 * Informações do perfil do usuário.
 * Exibe nome, email, badge de status e pontos de fidelidade.
 */
export function ProfileInfo({ name, email, badge, points }: ProfileInfoProps) {
  const displayName = name || "Minha Conta";
  const displayEmail = email || "Seus dados de acesso aparecerao aqui";

  return (
    <div className="flex min-w-0 flex-col">
      <h1 className="text-2xl font-black leading-8 tracking-[0.07px] text-white">
        {displayName}
      </h1>
      <p className="truncate text-sm font-normal leading-5 tracking-[-0.15px] text-white/60">
        {displayEmail}
      </p>
      {(badge || points !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {badge && <ProfileBadge label={badge} />}
          {points !== undefined && <ProfilePoints points={points} />}
        </div>
      )}
    </div>
  );
}
