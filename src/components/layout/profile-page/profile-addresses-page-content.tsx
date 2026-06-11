"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ProfileAddressBook } from "./profile-address-book";
import { useProfileShell } from "./profile-shell-provider";

function ProfileAddressesPageContentInner() {
  const profile = useProfileShell();
  const searchParams = useSearchParams();
  const openEditorOnMount = searchParams.get("openEditor") === "1";

  return (
    <ProfileAddressBook
      customer={profile.customer}
      openEditorOnMount={openEditorOnMount}
    />
  );
}

export function ProfileAddressesPageContent() {
  return (
    <Suspense fallback={null}>
      <ProfileAddressesPageContentInner />
    </Suspense>
  );
}
