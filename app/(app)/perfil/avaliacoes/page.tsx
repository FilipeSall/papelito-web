import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import {
  ProfileContent,
  ProfileHero,
  ProfileReviews,
} from "@/components/layout/profile-page";

export default async function ProfileReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/entrar");

  const { name, email, image } = session.user;

  return (
    <>
      <ProfileHero
        email={email ?? ""}
        image={image}
        name={name ?? ""}
      />
      <ProfileContent>
        <ProfileReviews />
      </ProfileContent>
    </>
  );
}
