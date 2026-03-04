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
    <div className="flex flex-col gap-8 animate-fade-in-up h-full">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
          CONFIGURAÇÕES
        </h1>
        <p className="text-muted-foreground text-base">
          Gerencie sua conta e as diretrizes do Netuno
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[550px]">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 flex flex-col gap-1.5">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border border-transparent",
                activeTab === tab.id
                  ? "bg-primary/10 border-primary/10 shadow-xl shadow-primary/5"
                  : "hover:bg-foreground/5",
              )}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
                    activeTab === tab.id
                      ? "bg-primary text-white scale-105"
                      : "bg-card border border-border/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary",
                  )}
                >
                  <tab.icon size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span
                    className={cn(
                      "font-bold text-[14px] transition-colors",
                      activeTab === tab.id
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {tab.label}
                  </span>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={cn(
                  "transition-all duration-300 opacity-0 group-hover:opacity-100",
                  activeTab === tab.id
                    ? "opacity-100 translate-x-1 text-primary"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card/40 backdrop-blur-3xl rounded-[2.5rem] border border-border/50 p-8 overflow-y-auto custom-scrollbar shadow-2xl relative">
          {activeTab === "perfil" && <Profile />}
          {activeTab === "planos" && <Plans setActiveTab={setActiveTab} />}
          {activeTab === "assinaturas" && (
            <Subscriptions setActiveTab={setActiveTab} />
          )}
          {activeTab === "financeiro" && <Payments />}
          {activeTab === "equipes" && <Teams profile={profile} />}
        </div>
      </div>
    </div>
  );
}
