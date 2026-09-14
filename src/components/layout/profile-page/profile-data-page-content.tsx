"use client";

import { buildProfileAccountFormValues } from "@/features/profile/utils/profile-customer-mappers";

import { ProfileDataForm } from "./profile-data-form";
import { ProfileRefundPixKeySection } from "./profile-refund-pix-key-section";
import { useProfileShell } from "./profile-shell-provider";

export function ProfileDataPageContent() {
  const profile = useProfileShell();

  return (
    <div className="flex flex-col gap-6">
      <ProfileDataForm
        initialValues={buildProfileAccountFormValues(profile.customer, {
          email: profile.email,
          name: profile.name,
          cpfLast4: profile.cpfLast4,
        })}
      />
      <ProfileRefundPixKeySection />
    </div>
  );
}
