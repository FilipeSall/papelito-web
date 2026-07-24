import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CadastroPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

// Componentes de auth/social podem depender de next-auth; simplificamos para o teste do CTA.
vi.mock("@/components/auth/atoms", () => ({
  ArrowRightIcon: () => <span />,
  AuthSocialButton: () => <button type="button">Google</button>,
  AuthSubmitButton: ({ children }: { children: React.ReactNode }) => (
    <button type="submit">{children}</button>
  ),
}));
vi.mock("@/components/auth/molecules", () => ({
  AuthSocialDivider: () => <div />,
  AuthTextField: ({ id, label }: { id: string; label: string }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={id} />
    </label>
  ),
}));

describe("Cadastro — CTA de onboarding B2B", () => {
  it("oferece as duas opções: cadastrar minha empresa e entrar em uma empresa", () => {
    render(<CadastroPage />);
    expect(screen.getByRole("button", { name: /cadastrar minha empresa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar em uma empresa/i })).toBeInTheDocument();
  });

  it("no modo titular (default), o campo CNPJ é exibido", () => {
    render(<CadastroPage />);
    expect(screen.getByLabelText(/CNPJ da empresa/i)).toBeInTheDocument();
  });

it("ao escolher entrar em uma empresa, mantém o CNPJ para criar a solicitação após o e-mail", () => {
    render(<CadastroPage />);
    fireEvent.click(screen.getByRole("button", { name: /entrar em uma empresa/i }));
    expect(screen.getByLabelText(/CNPJ da empresa/i)).toBeInTheDocument();
    expect(screen.getByText(/solicite acesso a uma empresa existente/i)).toBeInTheDocument();
  });
});
