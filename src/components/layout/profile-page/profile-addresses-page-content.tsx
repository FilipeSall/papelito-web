"use client";

import { ProfileAddressBook } from "./profile-address-book";
import { useProfileShell } from "./profile-shell-provider";

export function ProfileAddressesPageContent() {
  const profile = useProfileShell();

  return <ProfileAddressBook customer={profile.customer} />;
}
