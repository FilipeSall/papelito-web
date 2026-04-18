"use client";

import { useEffect, useMemo, useState } from "react";

import { requestProfileCoupons } from "../services/request-profile-coupons";
import type {
  ProfileCouponFilter,
  ProfileCouponItem,
  ProfileCouponsPayload,
} from "../types/profile-coupons";

type UseProfileCouponsResult = {
  coupons: ProfileCouponItem[];
  filteredCoupons: ProfileCouponItem[];
  filter: ProfileCouponFilter;
  setFilter: (filter: ProfileCouponFilter) => void;
  couponCodeInput: string;
  setCouponCodeInput: (value: string) => void;
  copyFeedbackById: Record<string, boolean>;
  applyCouponMessage: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  activeCountLabel: string;
  onApplyCouponCode: () => void;
  onCopyCouponCode: (coupon: ProfileCouponItem) => Promise<void>;
};

/**
 * Hook com toda a lógica da seção de cupons da rota privada.
 */
export function useProfileCoupons(): UseProfileCouponsResult {
  const [payload, setPayload] = useState<ProfileCouponsPayload>({
    coupons: [],
    activeCountLabel: "0 cupons ativos disponíveis",
  });
  const [filter, setFilter] = useState<ProfileCouponFilter>("active");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [copyFeedbackById, setCopyFeedbackById] = useState<Record<string, boolean>>({});
  const [applyCouponMessage, setApplyCouponMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await requestProfileCoupons(controller.signal);
        setPayload(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao carregar os cupons.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const filteredCoupons = useMemo(() => {
    if (filter === "all") return payload.coupons;
    return payload.coupons.filter((coupon) => coupon.status === filter);
  }, [filter, payload.coupons]);

  function onApplyCouponCode() {
    const code = couponCodeInput.trim().toUpperCase();

    if (!code) {
      setApplyCouponMessage("Digite um código de cupom para continuar.");
      return;
    }

    const existing = payload.coupons.find((item) => item.code === code);

    if (existing) {
      setApplyCouponMessage(`Cupom ${code} já está na sua carteira.`);
      return;
    }

    // TODO(backend-coupons): substituir regra local por validação em endpoint
    // de aplicação de cupom e retornar cupom real da API.
    setApplyCouponMessage(`Cupom ${code} adicionado localmente (modo mock).`);

    const injectedCoupon: ProfileCouponItem = {
      id: `local-${code}`,
      code,
      description: "Cupom adicionado localmente para testes da interface.",
      highlight: "Benefício informado no checkout",
      expiresAtLabel: "Expira: em validação",
      status: "active",
    };

    setPayload((current) => ({
      ...current,
      coupons: [injectedCoupon, ...current.coupons],
      activeCountLabel: `${current.coupons.filter((item) => item.status === "active").length + 1} cupons ativos disponíveis`,
    }));
    setCouponCodeInput("");
    setFilter("active");
  }

  async function onCopyCouponCode(coupon: ProfileCouponItem) {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopyFeedbackById((current) => ({ ...current, [coupon.id]: true }));
      setTimeout(() => {
        setCopyFeedbackById((current) => ({ ...current, [coupon.id]: false }));
      }, 1200);
    } catch {
      setApplyCouponMessage("Não foi possível copiar o código agora.");
    }
  }

  return {
    coupons: payload.coupons,
    filteredCoupons,
    filter,
    setFilter,
    couponCodeInput,
    setCouponCodeInput,
    copyFeedbackById,
    applyCouponMessage,
    isLoading,
    errorMessage,
    activeCountLabel: payload.activeCountLabel,
    onApplyCouponCode,
    onCopyCouponCode,
  };
}
