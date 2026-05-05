"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ProfileCustomer } from "@/features/profile/types/profile-customer";

type ProfileShellData = {
  customer: ProfileCustomer;
  email: string;
  image?: string | null;
  name: string;
};

const ProfileShellContext = createContext<ProfileShellData | null>(null);

type ProfileShellProviderProps = {
  children: ReactNode;
  value: ProfileShellData;
};

export function ProfileShellProvider({
  children,
  value,
}: ProfileShellProviderProps) {
  return (
    <ProfileShellContext.Provider value={value}>
      {children}
    </ProfileShellContext.Provider>
  );
}

export function useProfileShell() {
  const context = useContext(ProfileShellContext);

  if (!context) {
    throw new Error("useProfileShell must be used within ProfileShellProvider.");
  }

  return context;
}
