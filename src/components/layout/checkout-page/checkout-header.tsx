import Link from "next/link";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { CheckoutStepNav } from "./checkout-step-nav";

interface CheckoutHeaderProps {
  currentStep: 1 | 2 | 3;
  backHref?: string;
  backLabel?: string;
}

export function CheckoutHeader({ currentStep, backHref, backLabel }: CheckoutHeaderProps) {
  return (
    <section className="bg-brand-dark">
      <div className="mx-auto w-full max-w-391 px-6 pb-7 pt-8 md:px-8 md:pb-8 md:pt-10">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              aria-label={backLabel}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              href={backHref}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>
          )}
          <h1 className="text-4xl font-black uppercase leading-10 tracking-[0.3691px] text-white">
            Checkout
          </h1>
        </div>

        <div className="mt-6">
          <CheckoutStepNav currentStep={currentStep} />
        </div>
      </div>
    </section>
  );
}
