import { ProfileAvatar } from "./profile-avatar";
import { ProfileInfo } from "./profile-info";

type ProfileHeroProps = {
  name: string;
  email: string;
  badge?: string;
  points?: number;
};

/**
 * Seção hero do perfil do usuário.
 * Compõe o avatar e as informações do usuário em um banner escuro.
 */
export function ProfileHero({ name, email, badge, points }: ProfileHeroProps) {
  return (
    <section className="w-full bg-brand-dark">
      <div className="mx-auto flex w-full max-w-391 items-center gap-6 px-8 py-6">
        <ProfileAvatar />
        <ProfileInfo badge={badge} email={email} name={name} points={points} />
      </div>
    </section>
  );
}
