import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { supabase } from "../lib/supabase";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Dashboard } from "./Dashboard";
import { Customers } from "./Customers";
import { CRM } from "./CRM";
import { Projects } from "./Projects";
import { Agenda } from "./Agenda";
import { Reports } from "./Reports";
import { Settings } from "./Settings";
import { AdminPanel } from "./AdminPanel";
import { LoadingScreen } from "./LoadingScreen";

interface ApplicationProps {
  session?: any;
  initialProfile?: any;
}

export function Application({ session }: ApplicationProps) {
  const [currentTab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Efeito para simular carregamento fluido apenas em abas específicas
  const handleTabChange = (newTab: string) => {
    if (newTab === currentTab) return;

    // Só mostra o Tsunami para "dashboard" (Visão Geral) e "admin" (Painel Master)
    const shouldShowTsunami = newTab === "dashboard" || newTab === "admin";

    if (shouldShowTsunami) {
      setIsPageLoading(true);
      setTab(newTab);
      setTimeout(() => {
        setIsPageLoading(false);
      }, 1200); // Tempo para o Tsunami passar completo
    } else {
      setTab(newTab);
    }
  };

  useEffect(() => {
    async function initAuth() {
      try {
        const user = session?.user || (await supabase.auth.getUser()).data.user;

        if (!user) {
          setIsPageLoading(false);
          return;
        }

        // 1. Set basic profile from metadata first for immediate display
        const metadata = user.user_metadata;
        setProfile({
          id: user.id,
          full_name: metadata?.full_name || user.email?.split("@")[0] || "Usuário",
          role: metadata?.role || "admin",
          email: user.email,
          admin_id: metadata?.admin_id || null,
        });

        // 2. Fetch complete profile from database
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (dbProfile?.is_active === false) {
          localStorage.setItem("kicked_out_reason", "Acesso Bloqueado: Sua conta foi inativada pelo Administrador enquanto você estava usando o sistema.");
          await supabase.auth.signOut();
          setIsPageLoading(false);
          return;
        }

        if (dbProfile) {
          const updates: any = {
            last_login_at: new Date().toISOString(),
            email: dbProfile.email || user.email,
          };

          if (!dbProfile.admin_id && metadata?.admin_id) {
            updates.admin_id = metadata.admin_id;
            dbProfile.admin_id = metadata.admin_id;
          }

          const fullProfile = {
            ...dbProfile,
            email: dbProfile.email || user.email,
            admin_id: dbProfile.admin_id || metadata?.admin_id || null,
          };

          setProfile(fullProfile);
          await supabase.from("profiles").update(updates).eq("id", user.id);
        }

        // 3. Subscribe to real-time profile changes
        const profileSubscription = supabase
          .channel(`profile-sync-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              if (payload.new) {
                const updatedProfile = payload.new as any;
                
                // Kicks user out immediately in real-time if deactivated by admin
                if (updatedProfile.is_active === false) {
                  localStorage.setItem("kicked_out_reason", "Acesso Bloqueado: Sua conta acaba de ser inativada pelo Administrador.");
                  supabase.auth.signOut();
                  return;
                }

                setProfile((prev: any) => ({
                  ...prev,
                  ...updatedProfile,
                  email: updatedProfile.email || user.email,
                }));
              }
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(profileSubscription);
        };
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setIsPageLoading(false);
      }
    }

    const cleanup = initAuth();

    return () => {
      cleanup.then((fn) => fn && fn());
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    // Canal de presença global — único em toda a aplicação
    const channel = supabase.channel("naveo-presence", {
      config: { presence: { key: profile.id } },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url || null,
          role: profile.role,
          online_at: new Date().toISOString(),
        });
      }
    });

    // Heartbeat: atualiza last_seen_at a cada 30 segundos no banco
    const updatePresence = async () => {
      await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", profile.id);
    };

    // Atualiza imediatamente e depois a cada 30s
    updatePresence();
    const heartbeat = setInterval(updatePresence, 30_000);

    // Ao fechar/sair limpa o heartbeat
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Marca como "saindo" mas o intervalo cuida do resto quando voltar
        clearInterval(heartbeat);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [profile?.id]);

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <ThemeProvider>
      {isPageLoading && <LoadingScreen />}

      <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30 selection:text-white transition-colors duration-700">
        {/* Deep Ocean / Netuno Glow background highlights */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-25%] left-[-25%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[200px] animate-lime-pulse opacity-40 dark:opacity-20" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[180px] opacity-30 dark:opacity-10" />
        </div>

        <Sidebar
          activeTab={currentTab}
          setTab={handleTabChange}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          profile={profile}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-background/5 backdrop-blur-[100px] overflow-hidden z-10 transition-colors duration-700">
          <Header profile={profile} />
          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="p-6 max-w-[1800px] 2xl:max-w-[95%] mx-auto space-y-6 animate-fade-in-up">
              {currentTab === "dashboard" && (
                <Dashboard setTab={handleTabChange} profile={profile} />
              )}
              {currentTab === "customers" && <Customers profile={profile} />}
              {currentTab === "crm" && <CRM profile={profile} />}
              {currentTab === "projects" && <Projects profile={profile} />}
              {currentTab === "agenda" && <Agenda profile={profile} />}
              {currentTab === "reports" && <Reports profile={profile} />}
              {currentTab === "settings" && <Settings profile={profile} />}
              {currentTab === "admin" && isSuperAdmin && (
                <AdminPanel profile={profile} />
              )}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
