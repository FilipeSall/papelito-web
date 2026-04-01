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
    <div className="mx-auto w-full max-w-391 px-8 py-8">
      <div className="flex gap-6">
        <ProfileSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
