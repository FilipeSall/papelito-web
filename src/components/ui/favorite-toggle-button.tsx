"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { signOutAndClearSession } from "@/features/auth/client/logout";
import {
  addFavoriteClient,
  FavoritesAuthError,
  removeFavoriteClient,
} from "@/features/favorites/client/favorites-api";

interface FavoriteToggleButtonProps {
  productId: string;
  initialIsFavorite?: boolean;
  className?: string;
}

export function FavoriteToggleButton({
  productId,
  initialIsFavorite = false,
  className = "",
}: FavoriteToggleButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    if (status === "loading" || isSubmitting) {
      return;
    }

    if (status !== "authenticated") {
      router.push("/entrar");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = isFavorite
        ? await removeFavoriteClient(productId)
        : await addFavoriteClient(productId);

      setIsFavorite(result.isFavorite);
    } catch (error) {
      if (error instanceof FavoritesAuthError) {
        await signOutAndClearSession({ callbackUrl: "/entrar" });
        return;
      }

      console.error("[favorites] toggle failed", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={isFavorite}
      disabled={isSubmitting}
      onClick={handleClick}
      className={`flex size-14 cursor-pointer items-center justify-center rounded-full border-2 bg-white transition duration-200 ${
        isFavorite
          ? "border-[#D96952] bg-[#FFF3EE] text-[#B6432D] shadow-[0_12px_24px_rgba(217,105,82,0.16)]"
          : "border-[#E5E7EB] text-[#99A1AF] hover:border-[#F1B3A6] hover:text-[#C65D47]"
      } ${isSubmitting ? "opacity-70" : ""} ${className}`.trim()}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill={isFavorite ? "currentColor" : "none"}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M9 15.2C9 15.2 3.6 11.8 2.15 8.65C0.85 5.85 1.95 3.45 4.3 3.15C5.95 2.95 7.4 3.75 8.2 5.05L9 6.35L9.8 5.05C10.6 3.75 12.05 2.95 13.7 3.15C16.05 3.45 17.15 5.85 15.85 8.65C14.4 11.8 9 15.2 9 15.2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
