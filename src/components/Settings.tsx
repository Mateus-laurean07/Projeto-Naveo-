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
import { toast } from "sonner";

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
    <div className="flex flex-col lg:flex-row gap-0 h-full -m-4 sm:-m-6 lg:-m-10 overflow-hidden bg-background">
      {/* Navigation Sidebar - Modern & Slimmer */}
      <div className="w-full lg:w-80 flex flex-col border-b lg:border-r border-border/50 bg-card/20 backdrop-blur-xl p-4 sm:p-6 lg:p-8 gap-4 sm:gap-8">
        <div className="flex flex-col gap-1 px-2">
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter uppercase leading-none">
            CONFIGURAÇÕES
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
            Diretrizes do Sistema
          </p>
        </div>

        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
          {settingsTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isSuperAdmin = profile?.role === "super_admin";
            const isTeamsRestricted = tab.id === "equipes" && !profile?.is_pro && !isSuperAdmin;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isTeamsRestricted) {
                    toast.error("Acesso Restrito", {
                      description: "A funcionalidade de Equipes está disponível apenas no plano PRO."
                    });
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "group flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-300 min-w-[140px] lg:min-w-full lg:w-full",
                  isActive
                    ? "bg-primary text-white shadow-2xl shadow-primary/20 scale-[1.02] z-10"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  isTeamsRestricted && "opacity-50 grayscale-[0.5]"
                )}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-background border border-border/50 group-hover:border-primary/30",
                    )}
                  >
                    <tab.icon size={isActive ? 18 : 16} strokeWidth={2.5} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="font-bold text-[11px] sm:text-[13px] uppercase tracking-wider truncate w-full">
                      {tab.label}
                    </span>
                    {isTeamsRestricted && (
                      <span className="text-[8px] sm:text-[9px] font-black text-primary uppercase">Plano PRO</span>
                    )}
                  </div>
                </div>
                {!isActive && !isTeamsRestricted ? null : (
                  <div className="hidden lg:block ml-2">
                    {isTeamsRestricted ? (
                      <Zap size={14} className="text-amber-500 fill-amber-500" />
                    ) : (
                      <ChevronRight
                        size={14}
                        className={cn(
                          "transition-all duration-300",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar - hide on mobile to save space */}
        <div className="hidden lg:block mt-auto p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Status da Conta</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold text-foreground capitalize">{profile?.role || 'Usuário'}</span>
          </div>
        </div>
      </div>

      {/* Content Area - Full Expansion */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background relative">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto">
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
