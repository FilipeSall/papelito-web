import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildEventContext } from "../test/fixtures";
import { ATTENDANCE_STORAGE_KEY, IDLE_RESET_MS, IDLE_WARNING_MS, useAttendance } from "./use-attendance";

const LOOKUP = {
  cnpj: "11222333000181",
  legalName: "Loja LTDA",
  tradeName: "Loja",
  address: { cep: "01001000", street: "Praça da Sé", city: "São Paulo", state: "SP", number: "", neighborhood: "" },
  companyId: null,
};

const ctx = buildEventContext();

describe("useAttendance", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persiste e reidrata o atendimento", () => {
    const first = renderHook(() => useAttendance(ctx));
    act(() => first.result.current.dispatch({ type: "start", buyer: LOOKUP }));
    act(() => first.result.current.dispatch({ type: "set-qty", productId: 200, qty: 5 }));
    first.unmount();

    const second = renderHook(() => useAttendance(ctx));

    expect(second.result.current.state.screen).toBe(2);
    expect(second.result.current.state.qty).toEqual({ 200: 5 });
    expect(JSON.parse(window.localStorage.getItem(ATTENDANCE_STORAGE_KEY) ?? "{}").buyer.tradeName).toBe("Loja");
  });

  it("reset limpa tudo e volta à tela 1", () => {
    const { result } = renderHook(() => useAttendance(ctx));
    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));
    act(() => result.current.dispatch({ type: "set-qty", productId: 200, qty: 5 }));
    act(() => result.current.reset());

    expect(result.current.state.screen).toBe(1);
    expect(result.current.state.qty).toEqual({});
    expect(result.current.state.buyer).toBeNull();
  });

  it("CNPJ novo confirmado começa atendimento novo", () => {
    const { result } = renderHook(() => useAttendance(ctx));
    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));
    act(() => result.current.dispatch({ type: "set-qty", productId: 200, qty: 5 }));
    act(() => result.current.dispatch({ type: "start", buyer: { ...LOOKUP, cnpj: "99999999000191" } }));

    expect(result.current.state.qty).toEqual({});
  });

  it("trocar loja mantém o carrinho e volta à tela 1", () => {
    const { result } = renderHook(() => useAttendance(ctx));
    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));
    act(() => result.current.dispatch({ type: "set-qty", productId: 200, qty: 5 }));
    act(() => result.current.dispatch({ type: "change-store" }));

    expect(result.current.state.screen).toBe(1);
    expect(result.current.state.qty).toEqual({ 200: 5 });
  });

  it("confirmar outra loja depois de trocar mantém o carrinho e limpa o contato", () => {
    const { result } = renderHook(() => useAttendance(ctx));
    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));
    act(() => result.current.dispatch({ type: "set-qty", productId: 200, qty: 5 }));
    act(() => result.current.dispatch({ type: "set-contact", contact: { name: "Maria" } }));
    act(() => result.current.dispatch({ type: "change-store" }));
    act(() => result.current.dispatch({ type: "switch-buyer", buyer: { ...LOOKUP, cnpj: "99999999000191" } }));

    expect(result.current.state.screen).toBe(2);
    expect(result.current.state.qty).toEqual({ 200: 5 });
    expect(result.current.state.buyer?.cnpj).toBe("99999999000191");
    expect(result.current.state.contact.name).toBe("");
  });

  it("reseta após 3 min, exceto com cobrança em andamento", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAttendance(ctx));
    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));

    act(() => vi.advanceTimersByTime(IDLE_WARNING_MS));
    expect(result.current.idleWarning).toBe(true);

    act(() => vi.advanceTimersByTime(IDLE_RESET_MS));
    expect(result.current.state.screen).toBe(1);
    expect(result.current.idleWarning).toBe(false);

    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));
    act(() =>
      result.current.dispatch({
        type: "set-order",
        order: { orderId: 501, orderNumber: "501", state: "at_terminal", detail: "", totalCents: 1, method: "card" },
      }),
    );
    act(() => vi.advanceTimersByTime(IDLE_WARNING_MS + IDLE_RESET_MS));
    expect(result.current.idleWarning).toBe(false);
    expect(result.current.state.screen).toBe(2);
  });

  it("cobrança sem desfecho confirmado sobrevive à inatividade com pedido e chave", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAttendance(ctx));
    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));
    act(() => result.current.dispatch({ type: "set-checkout-id", id: "chk-0001" }));
    act(() =>
      result.current.dispatch({
        type: "set-order",
        order: { orderId: 501, orderNumber: "501", state: "check_terminal", detail: "unknown", totalCents: 1, method: "card" },
      }),
    );

    act(() => vi.advanceTimersByTime(IDLE_WARNING_MS + IDLE_RESET_MS));

    expect(result.current.idleWarning).toBe(false);
    expect(result.current.state.order?.orderId).toBe(501);
    expect(result.current.state.checkoutAttemptId).toBe("chk-0001");
  });

  it("toque adia a inatividade e Continuar fecha o aviso", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAttendance(ctx));
    act(() => result.current.dispatch({ type: "start", buyer: LOOKUP }));

    act(() => vi.advanceTimersByTime(IDLE_WARNING_MS - 1000));
    act(() => window.dispatchEvent(new Event("pointerdown")));
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.idleWarning).toBe(false);

    act(() => vi.advanceTimersByTime(IDLE_WARNING_MS));
    expect(result.current.idleWarning).toBe(true);
    act(() => result.current.keepAlive());
    expect(result.current.idleWarning).toBe(false);
  });

  it("ignora armazenamento corrompido", () => {
    window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, "{lixo");
    const { result } = renderHook(() => useAttendance(ctx));

    expect(result.current.state.screen).toBe(1);
  });
});
