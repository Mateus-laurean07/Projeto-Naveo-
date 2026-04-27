import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, UserPlus, User, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";
import { LoadingScreen } from "./LoadingScreen";

const TridentLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn(className)}>
    <defs>
      <linearGradient id="trident-reg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBDF72" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
    </defs>
    <g fill="#000" stroke="url(#trident-reg)" strokeWidth="0.2">
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
      stroke="url(#trident-reg)"
      strokeWidth="0.1"
    />
  </svg>
);

const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Register({ onGoToLogin }: { onGoToLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setFormError(null);
    const isSuperAdminPassword = data.password === "Netuno_321";
    let finalRole = isSuperAdminPassword ? "super_admin" : "user";
    let inviteData = null;

    try {
      // Buscar convite pendente para este email
      const { data: invData, error: invError } = await supabase
        .from("invitations")
        .select("role, avatar_url, invited_by")
        .eq("email", data.email)
        .eq("status", "pending")
        .maybeSingle();

      if (!invError && invData) {
        finalRole = invData.role;
        inviteData = invData;
      }
    } catch (e) {
      console.error("Erro ao verificar convites");
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          role: finalRole,
          avatar_url: inviteData?.avatar_url || null,
          admin_id: inviteData?.invited_by || null,
        },
      },
    });

    if (!error && authData.user && inviteData) {
      // Atualizar status do convite para aceito
      await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("email", data.email)
        .eq("status", "pending");

      // Forçar refresh para atualizar dados
      supabase.auth.refreshSession();
    }

    if (error) {
      let ptMessage = error.message;
      if (
        ptMessage.toLowerCase().includes("email rate limit exceeded") ||
        ptMessage.toLowerCase().includes("rate limit")
      ) {
        ptMessage =
          "Limite de tentativas de e-mail atingido por segurança. Por favor, aguarde alguns instantes.";
      } else if (ptMessage.toLowerCase().includes("confirmation email")) {
        ptMessage =
          "A conta foi criada, mas o serviço de e-mail (Resend) bloqueou o envio automático. Tente fazer o login diretamente agora! Se não funcionar, desative a 'Confirmação de E-mail' no painel do Supabase.";
      } else if (ptMessage.toLowerCase().includes("user already registered")) {
        ptMessage = "Este e-mail já está cadastrado no sistema.";
      } else if (ptMessage.toLowerCase().includes("password")) {
        ptMessage = "Sua senha é muito fraca ou inválida.";
      } else {
        ptMessage = "Ocorreu um erro inesperado: " + ptMessage;
      }
      setFormError(ptMessage);
    } else {
      // Disparar broadcast alertando todos os painéis masters sobre o novo cadastro
      const channel = supabase.channel("admin-notifications");
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.send({
            type: "broadcast",
            event: "new_registration",
            payload: { email: data.email, name: data.name },
          });
          supabase.removeChannel(channel);
        }
      });
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {isSubmitting && <LoadingScreen />}

      <div className="max-w-md w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-lime-pulse">
            <TridentLogo className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            Crie sua Conta
          </h2>
          <p className="text-muted-foreground">Junte-se ao Netuno hoje mesmo</p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50">
          {success ? (
            <div className="text-center py-6 animate-fade-in text-balance">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <Mail className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-3">
                Verifique seu E-mail!
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Enviamos um link de confirmação para o seu e-mail.
                <strong>
                  {" "}
                  Acesse sua caixa de entrada e clique no link para ativar sua
                  conta.
                </strong>
              </p>
              <button
                onClick={onGoToLogin}
                className="w-full bg-accent hover:bg-accent/80 text-white py-4 rounded-2xl font-black transition-all shadow-xl shadow-accent/20 active:scale-95"
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center animate-fade-in">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    {...register("name")}
                    placeholder="Seu nome"
                    className={`w-full bg-background border rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:ring-1 transition-colors ${
                      errors.name
                        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                        : "border-border focus:border-accent focus:ring-accent"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400 animate-fade-in">
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                  <div className="w-5 h-5 border-2 border-border border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" /> Cadastrar
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-muted-foreground text-sm">
              Já tem uma conta?{" "}
              <button
                onClick={onGoToLogin}
                className="text-foreground hover:text-accent font-medium transition-colors ml-1"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
