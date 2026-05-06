import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ProfileWishlist } from "@/components/layout/profile-page";
import { fetchFavorites } from "@/features/favorites";
import { authOptions } from "@/lib/auth";

export default async function ProfileFavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect("/entrar");
  }

  const favorites = await fetchFavorites(session.accessToken);

  return <ProfileWishlist initialItems={favorites.items} />;
}
