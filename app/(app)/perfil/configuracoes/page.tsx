import {
  ProfileContent,
  ProfileHero,
  ProfileSettings,
} from "@/components/layout/profile-page";

import { getAuthenticatedProfile } from "../_lib/get-authenticated-profile";

export default async function ProfileSettingsPage() {
  const profile = await getAuthenticatedProfile();

  return (
    <>
      <ProfileHero
        email={profile.email}
        image={profile.image}
        name={profile.name}
      />
      <ProfileContent>
        <ProfileSettings />
      </ProfileContent>
    </>
  );
}
