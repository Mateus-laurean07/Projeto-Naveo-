import React from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

interface SidebarProps {
  activeTab: string;
  setTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  profile?: any;
}

// Representing Neptune with custom Trident SVG for a premium logo
const TridentLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn(className)}>
    <defs>
      <linearGradient id="trident-sidebar" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
    </defs>
    <g fill="#000" stroke="url(#trident-sidebar)" strokeWidth="0.2">
      <path d="M12 1L13.8 7L12 8.5L10.2 7L12 1Z" />
      <path d="M12 9.5C12 9.5 13.5 10 15 10C16.5 10 18.5 8.5 19.5 4.5L16 9C15.5 10 14.5 11 12.5 11.5L11.5 11.5C9.5 11 8.5 10 8 9L4.5 4.5C5.5 8.5 7.5 10 9 10C10.5 10 12 9.5 12 9.5Z" />
      <circle cx="12" cy="11.5" r="1.5" fill="none" />
    </g>
    <rect
      x="11.5"
      y="11.8"
      width="1"
      height="11"
      rx="0.3"
      fill="#000"
      stroke="url(#trident-sidebar)"
      strokeWidth="0.1"
    />
  </svg>
);

export function Sidebar({
  activeTab,
  setTab,
  collapsed,
  setCollapsed,
  profile,
}: SidebarProps) {
  const isSuperAdmin = profile?.role === "super_admin";

  const mainMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      allowed: true,
    },
    { id: "customers", label: "Clientes", icon: Users, allowed: true },
    { id: "crm", label: "Pipeline", icon: BarChart3, allowed: true },
    { id: "projects", label: "Projetos", icon: Briefcase, allowed: true },
    { id: "agenda", label: "Agenda", icon: Calendar, allowed: true },
    { id: "reports", label: "Relatórios", icon: FileText, allowed: true },
  ];

  const adminMenuItems = [
    {
      id: "admin",
      label: "Painel Master",
      icon: ShieldCheck,
      allowed: isSuperAdmin,
    },
  ];

  const bottomLabels = [
    { id: "settings", label: "Configurações", icon: Settings, allowed: true },
  ];

  return (
    <div
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border/40 transition-all duration-500 ease-in-out z-40 shadow-2xl",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Visual Identity Area */}
      <div className="flex items-center justify-between p-7 overflow-hidden">
        {!collapsed && (
          <div
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => setTab("dashboard")}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300 animate-lime-pulse">
              <TridentLogo className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-foreground leading-none lime-glow-text">
                NETUNO
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 rounded-2xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300 backdrop-blur-md border border-transparent hover:border-primary/20"
        >
          {collapsed ? (
            <ChevronRight size={22} className="animate-pulse" />
          ) : (
            <ChevronLeft size={22} />
          )}
        </button>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {mainMenuItems
          .filter((i) => i.allowed)
          .map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                activeTab === item.id
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 sidebar-item-active"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:translate-x-1",
              )}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-sm" />
              )}
              <item.icon
                size={20}
                className={cn(
                  "shrink-0 transition-all duration-300",
                  activeTab === item.id
                    ? "scale-110 text-primary"
                    : "group-hover:scale-110 group-hover:text-primary",
                )}
              />
              {!collapsed && (
                <span className="font-bold text-[14px] tracking-tight">
                  {item.label}
                </span>
              )}
            </button>
          ))}

        {isSuperAdmin && !collapsed && (
          <div className="pt-6 pb-2 px-4 flex items-center gap-2">
            <span className="w-2 h-0.5 bg-primary/20 rounded-full"></span>
            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
              Master Access
            </p>
          </div>
        )}

        {adminMenuItems
          .filter((i) => i.allowed)
          .map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                activeTab === item.id
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20 sidebar-item-active"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:translate-x-1",
              )}
            >
              <item.icon
                size={20}
                className="shrink-0 transition-all duration-300 group-hover:scale-110"
              />
              {!collapsed && (
                <span className="font-bold text-[14px] tracking-tight">
                  {item.label}
                </span>
              )}
            </button>
          ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border/40">
        {bottomLabels.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group mb-1.5",
              activeTab === item.id
                ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
            )}
          >
            <item.icon
              size={20}
              className="shrink-0 group-hover:rotate-[20deg] transition-transform duration-500"
            />
            {!collapsed && (
              <span className="font-bold text-[14px] tracking-tight">
                {item.label}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 group mt-1"
        >
          <LogOut
            size={20}
            className="group-hover:-translate-x-1 transition-transform duration-300 opacity-70 group-hover:opacity-100"
          />
          {!collapsed && (
            <span className="font-bold text-[14px] tracking-tight">
              Encerrar Sessão
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
