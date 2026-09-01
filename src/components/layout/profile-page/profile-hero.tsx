import { ProfileAvatar } from "./profile-avatar";
import { ProfileInfo } from "./profile-info";

type ProfileHeroProps = {
  name: string;
  email: string;
  image?: string | null;
  badge?: string;
  points?: number;
};

/**
 * Placa de identidade do comprador: fundo escuro com a trama do painel e faixa amarela de recorte.
 */
export function ProfileHero({ name, email, image, badge, points }: ProfileHeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-brand-dark">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-391 items-center gap-5 px-4 py-7 sm:gap-6 sm:px-6 lg:px-8 max-[500px]:min-h-[176px]">
        <ProfileAvatar image={image} name={name} />
        <ProfileInfo badge={badge} email={email} name={name} points={points} />
      </div>
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
    </section>
  );
}
