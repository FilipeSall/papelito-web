import {
  ProfileContent,
  ProfileHero,
  ProfileShellProvider,
} from "@/components/layout/profile-page";
import { AddToCartToastHost } from "@/components/layout/products-page/add-to-cart-toast-host";
import { redirect } from "next/navigation";

import { getAuthenticatedProfile } from "./_lib/get-authenticated-profile";

export default async function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getAuthenticatedProfile();

  if (profile.customer.role.trim().toLowerCase() === "seller") {
    redirect("/vendor/dashboard");
  }

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
