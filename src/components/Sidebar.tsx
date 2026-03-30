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
  Rocket,
  ListChecks,
  ChevronDown,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { TridentLogo } from "./Logo";
import { useTheme } from "./ThemeProvider";

interface SidebarProps {
  activeTab: string;
  setTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  profile?: any;
}

export function Sidebar({
  activeTab,
  setTab,
  collapsed,
  setCollapsed,
  profile,
}: SidebarProps) {
  const { theme } = useTheme();
  const isSuperAdmin = profile?.role === "super_admin";
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([
    "projects",
  ]);

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const mainMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      allowed: true,
    },
    { id: "customers", label: "Clientes", icon: Users, allowed: true },
    { id: "crm", label: "Pipeline", icon: BarChart3, allowed: true },
    {
      id: "projects_group",
      label: "Projetos",
      icon: Briefcase,
      allowed: true,
      subItems: [
        { id: "projects", label: "Gestão", icon: Briefcase },
        { id: "tasks", label: "Tarefas", icon: ListChecks },
      ],
    },
    { id: "agenda", label: "Agenda", icon: Calendar, allowed: true },
    { id: "reports", label: "Relatórios", icon: FileText, allowed: true },
    { id: "tunoo", label: "Tunoo", icon: Rocket, allowed: true },
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
            <div
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-110",
                theme === "dark" ? "bg-primary" : "bg-[#1a7efb]"
              )}
            >
              <TridentLogo className="w-full h-full" />
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
          .map((item) => {
            const isExpanded = expandedMenus.includes(item.id);
            const hasSubItems = !!(item as any).subItems;
            const subItems = (item as any).subItems || [];
            const isAnySubActive = subItems.some(
              (s: any) => s.id === activeTab,
            );

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.id);
                    } else {
                      setTab(item.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    activeTab === item.id || (hasSubItems && isAnySubActive)
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 sidebar-item-active font-black"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:translate-x-1",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {activeTab === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-sm" />
                    )}
                    <item.icon
                      size={20}
                      className={cn(
                        "shrink-0 transition-all duration-300",
                        activeTab === item.id || (hasSubItems && isAnySubActive)
                          ? "scale-110 text-primary"
                          : "group-hover:scale-110 group-hover:text-primary",
                      )}
                    />
                    {!collapsed && (
                      <span className="font-bold text-[14px] tracking-tight">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {hasSubItems && !collapsed && (
                    <ChevronDown
                      size={16}
                      className={cn(
                        "transition-transform duration-500 opacity-40 group-hover:opacity-100",
                        isExpanded && "rotate-180",
                      )}
                    />
                  )}
                </button>

                {/* Sub Menu Rendering */}
                {hasSubItems && isExpanded && !collapsed && (
                  <div className="ml-9 space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {subItems.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={() => setTab(sub.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group text-xs",
                          activeTab === sub.id
                            ? "text-primary font-black"
                            : "text-muted-foreground hover:text-primary hover:translate-x-1",
                        )}
                      >
                        <sub.icon
                          size={14}
                          className={cn(
                            activeTab === sub.id
                              ? "text-primary"
                              : "text-muted-foreground/40 group-hover:text-primary",
                          )}
                        />
                        <span className="tracking-tight uppercase font-medium">
                          {sub.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

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
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group mb-1.5 relative",
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
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
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
