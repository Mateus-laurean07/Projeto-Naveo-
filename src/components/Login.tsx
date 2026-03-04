import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";

const TridentLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn(className)}>
    <defs>
      <linearGradient id="trident-login" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBDF72" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
    </defs>
    <g fill="#000" stroke="url(#trident-login)" strokeWidth="0.2">
      <path d="M12 1L13.8 7L12 8.5L10.2 7L12 1Z" />
      <path d="M12 9.5C12 9.5 13.5 10 15 10C16.5 10 18.5 8.5 19.5 4.5L16 9C15.5 10 14.5 11 12.5 11.5L11.5 11.5C9.5 11 8.5 10 8 9L4.5 4.5C5.5 8.5 7.5 10 9 10C10.5 10 12 9.5 12 9.5Z" />
    </g>
    <rect
      x="11.5"
      y="11.8"
      width="1"
      height="11"
      rx="0.3"
      fill="#000"
      stroke="url(#trident-login)"
      strokeWidth="0.1"
    />
  </svg>
);

// Definição do Schema de Validação
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .email("Insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login({ onGoToRegister }: { onGoToRegister: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      let ptMessage = error.message;
      if (ptMessage.toLowerCase().includes("invalid login credentials")) {
        ptMessage = "E-mail ou senha incorretos.";
      } else if (
        ptMessage.toLowerCase().includes("email rate limit exceeded") ||
        ptMessage.toLowerCase().includes("rate limit")
      ) {
        ptMessage = "Muitas tentativas de login. Aguarde alguns minutos.";
      } else {
        ptMessage = "Erro ao fazer login: " + ptMessage;
      }
      setFormError(ptMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ondas de fundo Netuno */}
      <div className="auth-wave-container">
        <div className="auth-wave"></div>
        <div className="auth-wave"></div>
      </div>

      <div className="max-w-md w-full animate-fade-in-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-lime-pulse">
            <TridentLogo className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            Central Netuno
          </h2>
          <p className="text-muted-foreground">
            Acesse sua conta para continuar
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 backdrop-blur-sm bg-card/80">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center animate-fade-in">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="Seu e-mail"
                  className={`w-full bg-background border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-1 transition-colors ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : "border-border focus:border-accent focus:ring-accent"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 animate-fade-in">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Sua senha secreta"
                  className={`w-full bg-background border rounded-xl py-3 pl-10 pr-12 text-foreground focus:outline-none focus:ring-1 transition-colors ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : "border-border focus:border-accent focus:ring-accent"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 animate-fade-in">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/80 text-foreground py-3.5 rounded-xl font-medium transition-all shadow-[0_0_20px_hsl(var(--accent))/30] hover:shadow-[0_0_30px_hsl(var(--accent))/50] active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Entrar na Plataforma
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-muted-foreground text-sm">
              Não tem uma conta?{" "}
              <button
                onClick={onGoToRegister}
                className="text-accent hover:text-foreground font-medium transition-colors ml-1"
              >
                Cadastre-se grátis
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
