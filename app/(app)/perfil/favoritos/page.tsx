import {
  ProfileContent,
  ProfileHero,
  ProfileWishlist,
} from "@/components/layout/profile-page";

import { getAuthenticatedProfile } from "../_lib/get-authenticated-profile";

export default async function ProfileFavoritesPage() {
  const profile = await getAuthenticatedProfile();

  return (
    <>
      <ProfileHero
        email={profile.email}
        image={profile.image}
        name={profile.name}
      />
      <ProfileContent>
        <ProfileWishlist />
      </ProfileContent>
    </>
  );
}
