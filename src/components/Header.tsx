import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import {
  Bell,
  Moon,
  Sun,
  Search,
  User,
  CheckCircle2,
  MessageSquare,
  LogOut,
  ChevronDown,
  Mail,
  FolderKanban,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

export function Header({ session, profile }: { session?: any; profile?: any }) {
  const { theme, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: "1",
      type: "lead",
      title: "Novo lead recebido",
      message: "Marcos Silva entrou em contato pela LP",
      time: "Agora mesmo",
      read: false,
    },
    {
      id: "2",
      type: "system",
      title: "Atualização do sistema",
      message: "Novos recursos disponíveis na plataforma",
      time: "Há 2 horas",
      read: false,
    },
  ]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const hasUnread = notifications.some((n) => !n.read);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && hasUnread) {
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    }
  };

  useEffect(() => {
    if (!profile?.email) return;

    let mounted = true;

    const fetchInvitations = async (email: string) => {
      try {
        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .eq("status", "pending")
          .eq("email", email);

        if (!error && data && data.length > 0 && mounted) {
          setNotifications((prev) => {
            const newInvites = data
              .filter((inv) => !prev.some((p) => p.id === `inv-${inv.id}`))
              .map((inv: any) => ({
                id: `inv-${inv.id}`,
                type: "invite",
                title: "Convite para Equipe",
                message: `Você foi convidado para participar como ${inv.role}. Acesse "Equipes" para aceitar.`,
                time: "Novo",
                read: false,
              }));
            // Mescla de forma inteligente
            const others = prev.filter((p) => p.type !== "invite");
            return [...newInvites, ...others];
          });
        }
      } catch (e) {}
    };

    const fetchSysNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("sys_notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data && mounted) {
          setNotifications((prev) => {
            const invites = prev.filter((p) => p.type === "invite");
            const sysData = data.map((n: any) => ({
              id: n.id,
              type: n.type || "system",
              title: n.title,
              message: n.message,
              time: n.created_at
                ? new Date(n.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Agora",
              read: n.read || false,
            }));

            // Combina com os invites, tirando dados fake antigos
            return [...invites, ...sysData];
          });
        }
      } catch (e) {}
    };

    fetchInvitations(profile.email);
    fetchSysNotifications();

    const channel = supabase
      .channel("notifications-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sys_notifications" },
        (payload) => {
          if (!mounted) return;
          const newN = payload.new;
          setNotifications((prev) => [
            {
              id: newN.id,
              type: newN.type || "system",
              title: newN.title,
              message: newN.message,
              time: "Agora mesmo",
              read: false,
            },
            ...prev,
          ]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invitations",
          filter: `email=eq.${profile.email}`,
        },
        () => {
          if (!mounted) return;
          fetchInvitations(profile.email);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.email]);

  const userName =
    profile?.full_name || profile?.email?.split("@")[0] || "Usuário";
  const userEmail = profile?.email || "";
  const userInitials = (profile?.full_name || userEmail || "U")
    .split(/[ .@]/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-border/40 bg-background/40 backdrop-blur-3xl sticky top-0 z-50">
      {/* Search Area */}
      <div className="flex-1 max-w-xl relative group mr-10 h-11">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Buscar no Netuno..."
          className="w-full h-full pl-11 pr-4 text-sm bg-card border border-border/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-card border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all shadow-xl group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          {theme === "dark" ? (
            <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
          ) : (
            <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-700" />
          )}
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleNotificationClick}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-2xl bg-card border border-border/50 text-muted-foreground transition-all shadow-xl hover:scale-105 active:scale-95 relative",
              showNotifications &&
                "border-primary/50 bg-primary/10 text-primary scale-105",
            )}
          >
            <Bell className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card shadow-sm" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-80 bg-card/95 backdrop-blur-3xl border border-border/40 rounded-[32px] shadow-2xl overflow-hidden z-[100] p-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-4 flex justify-between items-center border-b border-border/20 mb-1">
                <h3 className="font-black text-foreground text-sm uppercase tracking-tighter">
                  Notificações
                </h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-lg font-black uppercase tracking-widest">
                  {notifications.length} NOVAS
                </span>
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar px-1 space-y-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-2xl border border-transparent hover:border-border/50 hover:bg-foreground/[0.03] flex gap-4 cursor-pointer group transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all border border-primary/10">
                      {notif.type === "lead" ? (
                        <User size={18} />
                      ) : notif.type === "invite" ? (
                        <Mail size={18} />
                      ) : notif.type === "project" ? (
                        <FolderKanban size={18} />
                      ) : notif.type === "comment" ? (
                        <MessageSquare size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase font-black tracking-widest">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-border/20 mt-1">
                <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
                  Ver Todas Notificações
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative ml-2" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              "flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all shadow-xl hover:scale-105 active:scale-95 group",
              showUserMenu && "border-primary/50 ring-2 ring-primary/10",
            )}
          >
            <div className="w-10 h-10 rounded-2xl bg-background border border-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-lg shadow-primary/20 overflow-hidden transform transition-transform group-hover:scale-105 group-hover:bg-primary/5">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>
            <div className="flex flex-col items-start hidden lg:flex text-left max-w-[140px]">
              <span className="text-sm font-black text-foreground leading-none truncate w-full">
                {userName.split(" ")[0]}
              </span>
              <span className="text-[9px] text-muted-foreground leading-none mt-1 font-black uppercase tracking-tight opacity-60 truncate w-full">
                {userEmail || "Membro Netuno"}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                "text-muted-foreground/50 transition-transform duration-300 group-hover:text-primary",
                showUserMenu && "rotate-180 text-primary",
              )}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-4 w-64 bg-card/95 backdrop-blur-3xl border border-border/40 rounded-[32px] shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-6 border-b border-border/20 mb-2 flex flex-col gap-1 items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-background border-2 border-primary/20 flex items-center justify-center text-primary font-black text-lg mb-3 overflow-hidden shadow-lg shadow-primary/10">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitials
                  )}
                </div>
                <p className="text-sm font-black text-foreground leading-none mb-1">
                  {userName}
                </p>
                <p className="text-[9px] font-black text-muted-foreground break-all uppercase tracking-tight opacity-40 px-2 leading-tight">
                  {userEmail || "Carregando..."}
                </p>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
              >
                <LogOut size={16} className="opacity-70" />
                Encerrar Sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
