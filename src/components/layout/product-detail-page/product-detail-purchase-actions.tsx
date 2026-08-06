"use client";

import { AddToCartToast } from "@/components/layout/products-page/add-to-cart-toast";
import { FavoriteToggleButton } from "@/components/ui";
import { CartIcon } from "@/components/ui/icons";
import { useProductShare } from "./use-product-share";

interface ProductDetailPurchaseActionsProps {
  productId: string;
  productName: string;
  initialIsFavorite: boolean;
  isAddingToCart: boolean;
  isPurchaseDisabled: boolean;
  isPurchaseBlockedByRole: boolean;
  roleBlockedMessage?: string;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

function RoleBlockedTooltip({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-56 -translate-x-1/2 rounded-lg bg-brand-dark px-3 py-2 text-center text-[11px] font-black leading-4 text-white opacity-0 shadow-[0_12px_24px_rgba(35,31,32,0.25)] transition-opacity group-hover/role-tooltip:opacity-100 group-focus-within/role-tooltip:opacity-100"
    >
      {message}
    </span>
  );
}

export function ProductDetailPurchaseActions({
  productId,
  productName,
  initialIsFavorite,
  isAddingToCart,
  isPurchaseDisabled,
  isPurchaseBlockedByRole,
  roleBlockedMessage,
  onAddToCart,
  onBuyNow,
}: Readonly<ProductDetailPurchaseActionsProps>) {
  const { shareToast, shareToastVisible, dismissShareToast, shareProduct } =
    useProductShare(productName);
  const isActionDisabled = isAddingToCart || isPurchaseDisabled || isPurchaseBlockedByRole;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 max-[319px]:grid max-[319px]:grid-cols-2">
        <div className="group/role-tooltip relative min-w-0 flex-1 max-[319px]:col-span-2">
          <RoleBlockedTooltip message={roleBlockedMessage} />
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isActionDisabled}
            title={roleBlockedMessage}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 text-center text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 max-[425px]:h-auto max-[425px]:min-h-14 max-[425px]:px-4 max-[425px]:py-3 max-[425px]:text-sm max-[425px]:leading-4"
          >
            <CartIcon className="size-4.5 max-[425px]:size-5.5" />
            <span className="min-w-0 whitespace-normal wrap-break-word">
              {isAddingToCart ? "VALIDANDO" : (
                <>
                  <span className="inline min-[426px]:hidden">ADICIONAR</span>
                  <span className="hidden min-[426px]:inline">ADICIONAR AO CARRINHO</span>
                </>
              )}
            </span>
          </button>
        </div>
        <div className="max-[319px]:justify-self-end">
          <FavoriteToggleButton productId={productId} initialIsFavorite={initialIsFavorite} />
        </div>
        <div className="relative flex max-[319px]:justify-self-start">
          {shareToast ? (
            <AddToCartToast
              detail={shareToast}
              onClose={dismissShareToast}
              visible={shareToastVisible}
              placement="anchor-top"
            />
          ) : null}
          <button
            type="button"
            aria-label="Compartilhar produto"
            className="flex size-14 cursor-pointer items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-white text-[#99A1AF]"
            onClick={shareProduct}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M11.8125 3H15V6.1875"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 10.5L15 3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 10.5V13.125C15 13.6223 14.8025 14.0992 14.4508 14.4508C14.0992 14.8025 13.6223 15 13.125 15H4.875C4.37772 15 3.90081 14.8025 3.54917 14.4508C3.19754 14.0992 3 13.6223 3 13.125V4.875C3 4.37772 3.19754 3.90081 3.54917 3.54917C3.90081 3.19754 4.37772 3 4.875 3H7.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="group/role-tooltip relative mt-4">
        <RoleBlockedTooltip message={roleBlockedMessage} />
        <button
          type="button"
          onClick={onBuyNow}
          disabled={isActionDisabled}
          title={roleBlockedMessage}
          className="h-14 w-full cursor-pointer rounded-full bg-brand-dark text-base font-black uppercase tracking-[-0.3125px] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAddingToCart ? "VALIDANDO" : "COMPRAR AGORA"}
        </button>
      </div>
    </>
  );
}
