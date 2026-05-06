import {
  ProfileContent,
  ProfileHero,
  ProfileShellProvider,
} from "@/components/layout/profile-page";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";

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
      <AddToCartToastHost />
    </ProfileShellProvider>
  );
}
