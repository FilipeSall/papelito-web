import {
  ProfileContent,
  ProfileHero,
  ProfileShellProvider,
} from "@/components/layout/profile-page";

import { getAuthenticatedProfile } from "./_lib/get-authenticated-profile";

export default async function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getAuthenticatedProfile();

  return (
    <ProfileShellProvider
      value={{
        customer: profile.customer,
        email: profile.email,
        image: profile.image,
        name: profile.name,
      }}
    >
      <ProfileHero
        email={profile.email}
        image={profile.image}
        name={profile.name}
      />
      <ProfileContent>{children}</ProfileContent>
    </ProfileShellProvider>
  );
}
