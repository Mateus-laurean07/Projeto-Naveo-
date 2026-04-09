import React, { useState } from "react";
import {
  User,
  Users,
  Bell,
  Globe,
  Layout,
  ChevronRight,
  Shield,
  CreditCard,
  Zap,
  Package,
  Wallet,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Profile } from "./Profile";
import { Teams } from "./Teams";
import { Plans } from "./Plans";
import { Subscriptions } from "./Subscriptions";
import { Payments } from "./Payments";

export function Settings({ profile }: { profile?: any }) {
  const [activeTab, setActiveTab] = useState("perfil");

  const settingsTabs = [
    {
      id: "perfil",
      label: "Perfil",
      icon: User,
      description: "Gerencie suas informações pessoais e cargo",
    },
    {
      id: "planos",
      label: "Planos",
      icon: Package,
      description: "Gerencie os planos de serviço do sistema",
    },
    {
      id: "assinaturas",
      label: "Assinaturas",
      icon: CreditCard,
      description: "Controle as assinaturas vinculadas aos clientes",
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: Wallet,
      description: "Fluxo de faturamento e pagamentos",
    },
    {
      id: "equipes",
      label: "Equipes",
      icon: Users,
      description: "Gerencie colaboradores e permissões",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full -m-8 overflow-hidden bg-background">
      {/* Navigation Sidebar - Modern & Slimmer */}
      <div className="w-full lg:w-80 flex flex-col border-r border-border/50 bg-card/20 backdrop-blur-xl p-8 gap-8">
        <div className="flex flex-col gap-1 px-2">
          <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">
            CONFIGURAÇÕES
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
            Diretrizes do Sistema
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-2xl shadow-primary/20 scale-[1.02] z-10"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-background border border-border/50 group-hover:border-primary/30",
                  )}
                >
                  <tab.icon size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-[13px] uppercase tracking-wider">
                  {tab.label}
                </span>
              </div>
              <ChevronRight
                size={14}
                className={cn(
                  "transition-all duration-300",
                  activeTab === tab.id ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="mt-auto p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Status da Conta</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold text-foreground capitalize">{profile?.role || 'Usuário'}</span>
          </div>
        </div>
      </div>

      {/* Content Area - Full Expansion */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background relative">
        <div className="p-10 max-w-[1600px] mx-auto">
          {activeTab === "perfil" && <Profile />}
          {activeTab === "planos" && (
            <Plans profile={profile} setActiveTab={setActiveTab} />
          )}
          {activeTab === "assinaturas" && (
            <Subscriptions profile={profile} setActiveTab={setActiveTab} />
          )}
          {activeTab === "financeiro" && <Payments profile={profile} />}
          {activeTab === "equipes" && <Teams profile={profile} />}
        </div>
      </div>
    </div>
  );
}
