import { ReactNode } from "react";

import { ProfileSidebar } from "./profile-sidebar";

type ProfileContentProps = {
  children: ReactNode;
};

/**
 * Container principal do conteúdo do perfil.
 * Compõe o sidebar com o conteúdo dinâmico da página.
 */
export function ProfileContent({ children }: ProfileContentProps) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-391 px-4 py-6 sm:px-6 md:py-7 lg:px-8 lg:py-8 max-[500px]:mt-4">
      <div className="flex flex-col gap-6 lg:flex-row">
        <ProfileSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
