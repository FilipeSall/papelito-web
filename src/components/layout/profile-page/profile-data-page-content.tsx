"use client";

import { buildProfileAccountFormValues } from "@/features/profile/utils/profile-customer-mappers";

import { ProfileDataForm } from "./profile-data-form";
import { useProfileShell } from "./profile-shell-provider";

export function ProfileDataPageContent() {
  const profile = useProfileShell();

  return (
    <ProfileDataForm
      initialValues={buildProfileAccountFormValues(profile.customer, {
        email: profile.email,
        name: profile.name,
      })}
    />
  );
}
