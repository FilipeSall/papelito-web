import {
  ProfileContent,
  ProfileDataForm,
  ProfileHero,
} from "@/components/layout/profile-page";
import { buildProfileAccountFormValues } from "@/features/profile/utils/profile-customer-mappers";

import { getAuthenticatedProfile } from "../_lib/get-authenticated-profile";

export default async function ProfileDataPage() {
  const profile = await getAuthenticatedProfile();

  return (
    <>
      <ProfileHero
        email={profile.email}
        image={profile.image}
        name={profile.name}
      />
      <ProfileContent>
        <ProfileDataForm
          initialValues={buildProfileAccountFormValues(profile.customer, {
            email: profile.email,
            name: profile.name,
          })}
        />
      </ProfileContent>
    </>
  );
}
