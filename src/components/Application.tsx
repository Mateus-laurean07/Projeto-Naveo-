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

export function Application() {
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
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const metadata = data.user.user_metadata;
        // Pre-fill with metadata while loading real profile
        if (metadata?.full_name) {
          setProfile({
            id: data.user.id,
            full_name: metadata.full_name,
            role: metadata.role || "admin",
            email: data.user.email,
          });
        }

        supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) {
              setProfile({ ...p, email: p.email || data.user.email });
              // Update last_login_at
              supabase
                .from("profiles")
                .update({
                  last_login_at: new Date().toISOString(),
                  email: p.email || data.user.email,
                })
                .eq("id", p.id)
                .then();
            }
            // Termina o carregamento inicial quando o perfil chegar
            setTimeout(() => setIsPageLoading(false), 1000);
          });
      } else {
        setIsPageLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: profile.id,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          online_at: new Date().toISOString(),
          full_name: profile.full_name,
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
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
