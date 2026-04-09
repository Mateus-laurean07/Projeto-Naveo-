import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  Clock,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Checkout } from "./Checkout";

export function Subscriptions({
  profile: activeProfile,
  setActiveTab,
}: {
  profile?: any;
  setActiveTab?: (tab: string) => void;
}) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckout, setIsCheckout] = useState(false);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const ownerId = activeProfile?.admin_id || activeProfile?.id;
        if (!ownerId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("user_id", ownerId)
          .maybeSingle();

        if (error) throw error;
        setSubscription(data);
      } catch (e) {
        console.error("Erro ao carregar assinatura:", e);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isCheckout) {
    return <Checkout onBack={() => setIsCheckout(false)} />;
  }

  if (!subscription) {
    return (
      <div className="space-y-6 w-full animate-in fade-in zoom-in-95 duration-200 pb-12">
        <div className="flex items-center gap-6 mb-10 bg-card/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/40 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Minha Assinatura
            </h1>
            <p className="text-sm font-medium text-muted-foreground/80">
              Gerencie seu plano e detalhes de faturamento
            </p>
          </div>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center mt-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-8 border border-accent/20">
            <ShieldCheck className="w-12 h-12 text-accent" />
          </div>

          <h2 className="text-3xl font-black text-foreground mb-4">
            Nenhuma Assinatura Ativa
          </h2>
          <p className="text-muted-foreground max-w-sm mb-10 text-lg font-medium leading-relaxed">
            Você ainda não possui uma assinatura Naveo ativa. Escolha um plano
            para destravar todo o poder do seu CRM.
          </p>

          <button
            onClick={() => setIsCheckout(true)}
            className="bg-accent hover:bg-accent/80 text-white px-10 py-4 rounded-[1.5rem] font-black flex items-center gap-3 transition-all shadow-xl shadow-accent/25 hover:scale-105 active:scale-95"
          >
            Explorar Planos <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in zoom-in-95 duration-200 pb-12">
      <div className="flex items-center gap-6 mb-10 bg-card/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/40 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
            Plano {subscription.plans?.name || "Ativo"}
          </h1>
          <p className="text-sm font-medium text-muted-foreground/80">
            Status:{" "}
            <span className="text-emerald-500 font-bold">
              {subscription.status}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Renovação
              </p>
              <p className="text-xl font-black text-foreground">
                {subscription.renewal_date
                  ? new Date(subscription.renewal_date).toLocaleDateString(
                      "pt-BR",
                    )
                  : "---"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Valor Mensal
              </p>
              <p className="text-xl font-black text-foreground">
                R$ {subscription.plans?.price || "---"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Precisa de mais recursos?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Você pode migrar seu plano a qualquer momento.
            </p>
          </div>
          <button
            onClick={() => setIsCheckout(true)}
            className="w-full py-4 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-foreground font-black text-xs uppercase tracking-widest transition-all"
          >
            Alterar Meu Plano
          </button>
        </div>
      </div>
    </div>
  );
}
