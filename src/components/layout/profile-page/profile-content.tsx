import { ReactNode } from "react";

import { ProfileSidebar } from "./profile-sidebar";

type ProfileContentProps = {
  children: ReactNode;
};

/**
 * Campo de trabalho do painel do comprador: papel kraft com a trama usada nos painéis de vendor e admin.
 */
export function ProfileContent({ children }: ProfileContentProps) {
  return (
    <div className="relative z-10 w-full bg-[#ede9df]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(35,31,32,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(35,31,32,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto w-full max-w-391 px-4 py-7 sm:px-6 md:py-9 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:gap-8">
          <ProfileSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
