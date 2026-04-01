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
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-black leading-8 tracking-[0.07px] text-white">
        {name}
      </h1>
      <p className="text-sm font-normal leading-5 tracking-[-0.15px] text-white/60">
        {email}
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
