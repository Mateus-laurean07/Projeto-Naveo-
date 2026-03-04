import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { SignupForm } from "./SignupForm";

describe("SignupForm Validation", () => {
  beforeEach(() => {
    render(<SignupForm />);
  });

  it("deve exibir erro para e-mail inválido (sem @)", async () => {
    const user = userEvent.setup();
    const emailInput = screen.getByTestId("email-input");
    const submitBtn = screen.getByTestId("submit-btn");

    await user.type(emailInput, "testeemail.com");
    await user.click(submitBtn);

    const errorMsg = screen.getByTestId("error-msg");
    expect(errorMsg.textContent).toBe("E-mail inválido");
  });

  it("deve exibir erro para senha com menos de 6 caracteres", async () => {
    const user = userEvent.setup();
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const submitBtn = screen.getByTestId("submit-btn");

    await user.type(emailInput, "teste@email.com");
    await user.type(passwordInput, "12345");
    await user.click(submitBtn);

    const errorMsg = screen.getByTestId("error-msg");
    expect(errorMsg.textContent).toBe(
      "A senha deve ter pelo menos 6 caracteres",
    );
  });

  it("deve realizar cadastro com sucesso quando dados forem válidos", async () => {
    const user = userEvent.setup();
    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const submitBtn = screen.getByTestId("submit-btn");

    await user.type(emailInput, "mateus@admin.com");
    await user.type(passwordInput, "senha123");
    await user.click(submitBtn);

    const successMsg = screen.getByTestId("success-msg");
    expect(successMsg.textContent).toBe("Cadastro realizado com sucesso");
  });
});
