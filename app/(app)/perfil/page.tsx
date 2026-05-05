import { OrdersList, ProfileContent, ProfileHero } from "@/components/layout/profile-page";

import { getAuthenticatedProfile } from "./_lib/get-authenticated-profile";

export default async function ProfilePage() {
  const profile = await getAuthenticatedProfile();

  return (
    <>
      <ProfileHero
        email={profile.email}
        image={profile.image}
        name={profile.name}
      />
      <ProfileContent>
        <OrdersList orders={[]} />
      </ProfileContent>
    </>
  );
}
