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

export function Subscriptions({
  setActiveTab,
}: {
  setActiveTab?: (tab: string) => void;
}) {
  const currentSub = {
    planName: "Trial Gratuito",
    status: "Ativo",
    price: "R$ 997,90/mês",
    originalPrice: "R$ 1.397,90",
    billingCycle: "Mensal",
    nextBillingDate: "19 de março de 2026",
    daysLeft: "4 dias",
    expirationDate: "27 de fevereiro de 2026",
    startDate: "19 de fevereiro de 2026",
    paymentMethod: "Cartão de crédito final 4242",
    memberSince: "15/01/2025",
    isTrial: false,
  };

  const hasSubscription = false;

  if (!hasSubscription) {
    return (
      <div className="space-y-6 max-w-4xl animate-in fade-in zoom-in-95 duration-200 pb-12">
        <div className="flex items-center gap-6 mb-10 bg-card/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/40 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Minha Assisnatura
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
            Você ainda não possui uma assinatura Netuno ativa. Escolha um plano
            para destravar todo o poder do seu CRM.
          </p>

          <button
            onClick={() => setActiveTab && setActiveTab("planos")}
            className="bg-accent hover:bg-accent/80 text-white px-10 py-4 rounded-[1.5rem] font-black flex items-center gap-3 transition-all shadow-xl shadow-accent/25 hover:scale-105 active:scale-95"
          >
            Explorar Planos <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
}
