import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const saveCustomerCpf = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/features/company/client/company-client", () => ({ saveCustomerCpf }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

import { CpfCompletionForm } from "./cpf-completion-form";

describe("CpfCompletionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists a valid CPF and returns to the requested path", async () => {
    saveCustomerCpf.mockResolvedValue({ ok: true, data: { identityStatus: "verified" } });
    render(<CpfCompletionForm callbackUrl="/convite" />);

    fireEvent.change(screen.getByLabelText("CPF"), { target: { value: "52998224725" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => expect(saveCustomerCpf).toHaveBeenCalledWith("529.982.247-25"));
    expect(replace).toHaveBeenCalledWith("/convite");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid CPF before calling the backend", () => {
    render(<CpfCompletionForm />);

    fireEvent.change(screen.getByLabelText("CPF"), { target: { value: "11111111111" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByText(/informe um cpf válido/i)).toBeInTheDocument();
    expect(saveCustomerCpf).not.toHaveBeenCalled();
  });
});
