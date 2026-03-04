import React, { useState } from "react";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.includes("@")) {
      setError("E-mail inválido");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSuccess("Cadastro realizado com sucesso");
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="signup-form"
      className="space-y-4 max-w-sm"
    >
      <input
        data-testid="email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
        className="w-full rounded p-2 text-black"
      />
      <input
        data-testid="password-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        className="w-full rounded p-2 text-black"
      />
      <button
        type="submit"
        data-testid="submit-btn"
        className="w-full py-2 bg-accent text-foreground rounded font-bold"
      >
        Cadastrar
      </button>

      {error && (
        <p data-testid="error-msg" className="text-red-500 mt-2">
          {error}
        </p>
      )}
      {success && (
        <p data-testid="success-msg" className="text-green-500 mt-2">
          {success}
        </p>
      )}
    </form>
  );
}
