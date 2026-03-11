import React, { useState, useEffect } from "react";
import { Check, Star, ArrowRight, X, AlertTriangle, User } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const availablePlans = [
  {
    id: "starter",
    name: "Starter",
    price: "97,00",
    description: "Para quem está começando a organizar as vendas.",
    features: ["Até 500 contatos", "1 Usuário", "Suporte por email"],
    recommended: false,
    current: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "197,00",
    description: "A solução completa para times em crescimento.",
    features: [
      "Contatos ilimitados",
      "Até 5 Usuários",
      "Suporte prioritário",
      "Relatórios Avançados",
    ],
    recommended: true,
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "497,00",
    description: "Para operações complexas de alta escala.",
    features: [
      "Tudo do Pro",
      "Usuários Ilimitados",
      "Gerente de Conta",
      "API e Webhooks",
    ],
    recommended: false,
    current: false,
  },
];

export function Plans({
  profile: activeProfile,
  setActiveTab,
}: {
  profile?: any;
  setActiveTab?: (tab: string) => void;
}) {
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const ownerId = activeProfile?.admin_id || activeProfile?.id;
        if (!ownerId) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", ownerId)
          .single();

        if (error) {
          if (error.code !== "PGRST116") throw error;
        }

        if (data) {
          const isComplete = Boolean(
            data.full_name?.trim() && data.email?.trim(), // Relaxando para exigir apenas nome e email para o upgrade básico
          );
          setIsProfileComplete(isComplete);
        }
      } catch (err) {
        console.error("Erro ao verificar perfil:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    checkProfile();
  }, []);

  const handleUpgradeClick = () => {
    if (loadingProfile) return;

    if (!isProfileComplete) {
      setShowIncompleteModal(true);
      return;
    }

    toast.success("Redirecionando para o Checkout...");
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col items-center mb-16 text-center mt-4">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Planos <span className="text-accent">Netuno</span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg font-medium">
          Evolua seu negócio com a ferramenta certa. Faça upgrade ou downgrade a
          qualquer momento, sem fidelidade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 pb-12">
        {availablePlans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col bg-card/60 backdrop-blur-xl border-2 rounded-[2.5rem] p-10 transition-all duration-500 group",
              plan.recommended
                ? "border-accent shadow-[0_20px_50px_rgba(var(--accent-rgb),0.15)] scale-105 z-10"
                : "border-border/40 hover:border-accent/40 hover:shadow-2xl hover:-translate-y-2",
            )}
          >
            {plan.recommended && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-accent text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                <Star className="w-4 h-4 fill-white" />
                Destaque
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-black text-foreground mb-2">
                {plan.name}
              </h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="flex items-baseline gap-1 mb-10">
              <span className="text-xs font-bold text-muted-foreground">
                R$
              </span>
              <span className="text-5xl font-black text-foreground tracking-tighter">
                {plan.price}
              </span>
              <span className="text-muted-foreground font-bold text-sm">
                /mês
              </span>
            </div>

            <div className="flex-1 space-y-4 mb-10 border-t border-border/40 pt-10">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 group/item">
                  <div className="bg-accent/10 p-1.5 rounded-full shrink-0 group-hover/item:scale-110 transition-transform">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-semibold text-foreground/80">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => !plan.current && handleUpgradeClick()}
              disabled={loadingProfile}
              className={cn(
                "w-full py-5 rounded-[1.5rem] font-black transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-widest",
                plan.current
                  ? "bg-muted text-muted-foreground cursor-default border border-border/50"
                  : plan.recommended
                    ? "bg-accent hover:bg-accent/80 text-white shadow-xl shadow-accent/25 hover:scale-[1.02]"
                    : "bg-foreground/5 hover:bg-accent hover:text-white text-foreground border border-border/50",
              )}
            >
              {plan.current ? (
                "Seu Plano"
              ) : (
                <>
                  Assinar <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Modal Profile Incompleto */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border/10 rounded-2xl w-full max-w-[450px] shadow-2xl p-8 text-center flex flex-col relative">
            <button
              onClick={() => setShowIncompleteModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-[#3B82F6]" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              Perfil Incompleto
            </h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Para prosseguir com a contratação de um Plano Netuno, é necessário
              preencher suas informações pessoais e de faturamento no menu de
              Perfil, garantindo a segurança e validade do seu contrato.
            </p>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="flex-1 bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium py-3 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setShowIncompleteModal(false);
                  if (setActiveTab) setActiveTab("perfil");
                }}
                className="flex-[2] bg-[#3B82F6] hover:bg-blue-600 text-foreground font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
              >
                Completar Perfil Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
