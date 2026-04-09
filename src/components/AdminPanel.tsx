import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Users,
  Shield,
  Activity,
  UserPlus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  Clock,
  Circle,
  User,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "user";
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  created_at: string;
  last_login_at: string | null;
  last_seen_at: string | null;
  is_active: boolean;
  admin_id: string | null;
}

export function AdminPanel({ profile }: { profile: any }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsersMetadata, setOnlineUsersMetadata] = useState<
    Record<string, any>
  >({});
  const onlineIds = Object.keys(onlineUsersMetadata);
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "team">("info");

  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    active: 0,
    newToday: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Recalcula stats toda vez que profiles, currentTime ou metadados de presença mudam
  // Isso garante que "Online Agora" se atualiza a cada segundo e em tempo real
  useEffect(() => {
    if (profiles.length === 0) return;

    const twoMinutesAgo = new Date(currentTime.getTime() - 2 * 60 * 1000);
    const total = profiles.length;
    const active = profiles.filter((p) => p.is_active !== false).length;
    const today = new Date().toISOString().split("T")[0];
    const newToday = profiles.filter((p) =>
      p.created_at?.startsWith(today),
    ).length;

    // Online = Presença (Realtime) OU Heartbeat (2 min) OU Você mesmo
    const online = profiles.filter((p) => {
      const pId = String(p.id).trim().toLowerCase();
      const isSelf = pId === String(profile?.id).trim().toLowerCase();

      // Busca nos metadados de presença usando busca case-insensitive nas chaves
      const isOnlineByPresence = Object.keys(onlineUsersMetadata).some(
        (key) => String(key).trim().toLowerCase() === pId,
      );

      const lastSeen = (p as any).last_seen_at || p.last_login_at;
      const isOnlineByHeartbeat =
        lastSeen && new Date(lastSeen) > twoMinutesAgo;

      return isSelf || isOnlineByPresence || isOnlineByHeartbeat;
    }).length;

    setStats({ total, online, active, newToday });
  }, [profiles, currentTime, onlineUsersMetadata, profile?.id]);

  const fetchProfiles = async (showToast = true, isManualSync = false) => {
    if (showToast && !isManualSync) setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (showToast) toast.error("Erro ao carregar usuários.");
      if (isManualSync) setIsRefreshing(false);
    } else if (data) {
      setProfiles(data);
      if (isManualSync) {
        toast.success("Sincronização concluída!");
        setIsRefreshing(false);
      }
    }
    if (showToast && !isManualSync) setLoading(false);
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    setCurrentTime(new Date()); // Sincroniza o relógio interno imediatamente
    await fetchProfiles(true, true);
  };

  useEffect(() => {
    if (!profile?.id) return;

    fetchProfiles();

    // 1. Presença em tempo real — usa o mesmo canal do Application.tsx
    const presenceChannel = supabase.channel("naveo-presence", {
      config: { presence: { key: profile.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const metadata: Record<string, any> = {};
        Object.keys(state).forEach((id) => {
          metadata[id] = (state[id] as any[])[0];
        });
        setOnlineUsersMetadata(metadata);
        // Não alteramos stats.online aqui — o useEffect cuida disso
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setOnlineUsersMetadata((prev) => ({ ...prev, [key]: newPresences[0] }));
        setStats((prev) => ({ ...prev, online: prev.online + 1 }));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsersMetadata((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        // stats.online é recalculado pelo useEffect
      })
      .subscribe();

    // 2. Realtime: detecta novos usuários e atualizações em tempo real
    const profilesChannel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // Novo usuário registrado — adiciona imediatamente à lista
            setProfiles((prev) => {
              const exists = prev.some((p) => p.id === (payload.new as any).id);
              if (exists) return prev;
              const newProfile = payload.new as Profile;
              return [newProfile, ...prev]; // useEffect recalcula stats
            });
            toast.success("🆕 Novo usuário registrado!");
          } else if (payload.eventType === "UPDATE") {
            const updatedId = String((payload.new as any).id)
              .trim()
              .toLowerCase();
            setProfiles((prev) =>
              prev.map((p) =>
                String(p.id).trim().toLowerCase() === updatedId
                  ? { ...p, ...(payload.new as any) }
                  : p,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = String((payload.old as any).id)
              .trim()
              .toLowerCase();
            setProfiles((prev) =>
              prev.filter(
                (p) => String(p.id).trim().toLowerCase() !== deletedId,
              ),
            );
          }
        },
      )
      .subscribe((status) => {
        // Ao conectar o Realtime, recarrega para pegar alterações recentes
        if (status === "SUBSCRIBED") {
          fetchProfiles();
        }
      });

    // 3. Listener do Broadcast de Registro para tempo real garantido (Ignora problemas do postgres_changes)
    const notifChannel = supabase
      .channel("admin-notifications")
      .on("broadcast", { event: "new_registration" }, () => {
        toast.success("🆕 Um novo usuário se cadastrou agora mesmo!");
        // Dá 1 segundo só por segurança para a trigger do supabase inserir e finalizar e fazemos um silent fetch
        setTimeout(() => {
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (data) setProfiles(data);
            });
        }, 1500);
      })
      .subscribe();

    // 4. Timer para atualizar o display do relógio a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 5. Fallback Background Check - Verifica silenciosamente de 15 em 15s p/ caso falhe o socket
    const fallbackTimer = setInterval(() => {
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setProfiles(data);
        });
    }, 15000);

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(notifChannel);
      clearInterval(timer);
      clearInterval(fallbackTimer);
    };
  }, [profile?.id]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao atualizar status.");
    } else {
      toast.success(
        `Usuário ${!currentStatus ? "ativado" : "desativado"} com sucesso!`,
      );
      fetchProfiles();
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) {
        toast.error(`Erro ao atualizar cargo master: ${error.message}`);
        console.error("Erro Supabase Role:", error);
      } else {
        toast.success("Privilégio atualizado com sucesso!");
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === userId ? { ...p, role: newRole as any } : p,
          ),
        );
      }
    } catch (e: any) {
      toast.error(
        `Erro fatal ao salvar privilégio: ${e.message || "Erro desconhecido"}`,
      );
    }
  };

  const updateJobTitle = async (userId: string, newJob: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ job_title: newJob })
        .eq("id", userId);

      if (error) {
        toast.error(`Erro ao atualizar cargo: ${error.message}`);
        console.error("Erro Supabase Job Title:", error);
      } else {
        toast.success("Cargo salvo!");
        setProfiles((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, job_title: newJob } : p)),
        );
      }
    } catch (e: any) {
      toast.error(`Erro ao salvar cargo: ${e.message || "Erro de conexão"}`);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    // Trava de Segurança: Verificar se o usuário possui tarefas/projetos não concluídos
    const { data: projetosAtivos, error: projetosError } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userToDelete)
      .neq("status", "Concluído")
      .limit(1);

    if (projetosError) {
      toast.error("Erro ao verificar as atividades vinculadas a este usuário.");
      return;
    }

    if (projetosAtivos && projetosAtivos.length > 0) {
      toast.error(
        "AÇÃO BLOQUEADA: Este usuário possui Projetos Ativos! Para não perder os dados da empresa, transfira os projetos ou altere o status deste usuário para Inativo/Bloqueado.",
        {
          duration: 8000,
          style: {
            background: "#EF4444",
            color: "white",
            border: "none",
            fontWeight: "bold",
          },
        },
      );
      setUserToDelete(null);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userToDelete);

    if (error) {
      toast.error("Erro ao excluir usuário.");
    } else {
      toast.success("Usuário excluído com sucesso!");
      if (selectedProfile?.id === userToDelete) {
        setSelectedProfile(null);
      }
      fetchProfiles();
    }
    setUserToDelete(null);
  };

  const formatDuration = (date: string | null) => {
    if (!date) return "Nunca logou";
    const start = new Date(date).getTime();
    const now = currentTime.getTime();
    let diff = Math.floor((now - start) / 1000);

    if (diff < 0) diff = 0;

    const months = Math.floor(diff / (30 * 24 * 3600));
    diff %= 30 * 24 * 3600;
    const weeks = Math.floor(diff / (7 * 24 * 3600));
    diff %= 7 * 24 * 3600;
    const days = Math.floor(diff / (24 * 3600));
    diff %= 24 * 3600;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    const parts = [];
    if (months > 0) parts.push(`${months} meses`);
    if (weeks > 0) parts.push(`${weeks} sem`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(" ");
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleExpanded = (userId: string) => {
    setExpandedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const renderUserRow = (p: Profile, isChild = false) => {
    const pId = String(p.id).trim().toLowerCase();
    const isSelf = pId === String(profile?.id).trim().toLowerCase();
    const presenceEntry = Object.entries(onlineUsersMetadata).find(
      ([key]) => String(key).trim().toLowerCase() === pId,
    );
    const presence = presenceEntry ? presenceEntry[1] : null;
    const isOnlineByPresence = !!presence;

    const isOnlineByHeartbeat = (() => {
      const lastSeen = (p as any).last_seen_at || p.last_login_at;
      if (!lastSeen) return false;
      const diffMs = currentTime.getTime() - new Date(lastSeen).getTime();
      return diffMs < 2 * 60 * 1000; // 2 minutos
    })();
    const isOnline = isSelf || isOnlineByPresence || isOnlineByHeartbeat;

    const sessionStart = presence?.online_at || p.last_login_at;
    const teamMembers = profiles.filter((child) => child.admin_id === p.id);
    const hasTeam = teamMembers.length > 0;
    const isExpanded = expandedUsers.includes(p.id);
    const isNewUser = (() => {
      if (!p.created_at) return false;
      const createdDate = new Date(p.created_at).getTime();
      const diffMs = currentTime.getTime() - createdDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    })();

    return (
      <React.Fragment key={p.id}>
        <tr
          onClick={() => {
            setSelectedProfile(p);
            setActiveTab("info");
          }}
          className={cn(
            "group transition-colors cursor-pointer",
            isNewUser
              ? "bg-amber-500/10 hover:bg-amber-500/15 shadow-[inset_4px_0_0_rgba(245,158,11,1)]"
              : "hover:bg-foreground/[0.02] hover:bg-accent/5",
            isChild && !isNewUser && "bg-accent/5",
          )}
        >
          <td className="py-4 px-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-accent/20 flex items-center justify-center border border-border/50 shadow-sm">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-accent" />
                  )}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                )}
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                  {p.full_name || "Sem Nome"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />{" "}
                  {p.email && p.email !== "---"
                    ? p.email
                    : p.id === profile?.id || p.full_name === profile?.full_name
                      ? profile?.email || "Seu E-mail"
                      : "---"}
                </span>
              </div>
            </div>
          </td>

          <td className="py-4 px-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {p.company_name || "N/A"}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {p.phone || "---"}
              </span>
            </div>
          </td>

          <td className="py-4 px-6">
            <div className="flex flex-col gap-2">
              <div className="relative group/cargo max-w-[140px]">
                <Briefcase className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground group-focus-within/cargo:text-primary" />
                <input
                  type="text"
                  defaultValue={p.job_title || ""}
                  placeholder="Sem Cargo"
                  disabled={
                    // Super Admin pode tudo
                    profile?.role === "super_admin"
                      ? false
                      : // Admin não muda Super Admin
                        profile?.role === "admin"
                        ? p.role === "super_admin"
                        : // User só muda User (não muda Admin nem Super Admin)
                          p.role !== "user"
                  }
                  onBlur={(e) => updateJobTitle(p.id, e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.target as HTMLInputElement).blur()
                  }
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "w-full bg-background border border-border/50 rounded-lg pl-6 pr-2 py-1 text-[11px] focus:outline-none focus:border-primary/50 font-bold transition-all placeholder:font-normal",
                    profile?.role !== "super_admin" &&
                      ((profile?.role === "admin" &&
                        p.role === "super_admin") ||
                        (profile?.role === "user" && p.role !== "user")) &&
                      "opacity-60 cursor-not-allowed bg-muted/20",
                  )}
                />
              </div>
            </div>
          </td>
          <td className="py-4 px-6">
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              {!p.is_active ? (
                <div className="flex items-center gap-2 group/status">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                  <span className="text-[11px] font-black tracking-tighter text-red-500 uppercase">
                    Bloqueado
                  </span>
                </div>
              ) : isOnline ? (
                <div className="flex items-center gap-2 group/status">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
                  <span className="text-[11px] font-black tracking-tighter text-primary uppercase">
                    Online
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/status">
                  <span className="text-[11px] font-black tracking-tighter text-muted-foreground/40 uppercase">
                    Offline
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">
                  {p.last_seen_at
                    ? new Date(p.last_seen_at).toLocaleString([], {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--/-- --:--"}
                </span>
              </div>
            </div>
          </td>

          <td className="py-4 px-6 text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <div className="relative group/select">
                  <Shield
                    className={cn(
                      "absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors",
                      p.role === "super_admin"
                        ? "text-purple-500"
                        : p.role === "admin"
                          ? "text-blue-500"
                          : "text-muted-foreground",
                    )}
                  />
                  <select
                    value={p.role}
                    disabled={
                      profile?.role !== "super_admin" &&
                      profile?.role !== "admin"
                    }
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateUserRole(p.id, e.target.value)}
                    className={cn(
                      "w-full appearance-none bg-background border rounded-2xl pl-8 pr-8 py-2.5 text-[10px] focus:outline-none font-black uppercase tracking-widest transition-all cursor-pointer hover:border-primary/50",
                      profile?.role !== "super_admin" &&
                        profile?.role !== "admin" &&
                        "opacity-50 cursor-not-allowed",
                      p.role === "super_admin" &&
                        "border-purple-500/30 text-purple-600 bg-purple-500/[0.03]",
                      p.role === "admin" &&
                        "border-blue-500/30 text-blue-600 bg-blue-500/[0.03] shadow-[0_4px_12px_rgba(59,130,246,0.08)]",
                      p.role === "user" &&
                        "border-border/50 text-muted-foreground bg-foreground/[0.02]",
                    )}
                  >
                    <option value="user">SISTEMA: USER</option>
                    <option value="admin">SISTEMA: ADMIN</option>
                    <option value="super_admin">SISTEMA: SUPER ADM</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none transition-transform group-hover/select:translate-y-[-40%]" />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (p.role === "super_admin") {
                      toast.error("Não é possível desativar o Super Admin.");
                      return;
                    }
                    toggleUserStatus(p.id, p.is_active !== false);
                  }}
                  disabled={p.role === "super_admin"}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    p.is_active !== false
                      ? "text-red-500 hover:bg-red-500/10"
                      : "text-primary hover:bg-primary/10",
                    p.role === "super_admin" && "opacity-30 cursor-not-allowed",
                  )}
                  title={p.is_active !== false ? "Desativar" : "Ativar"}
                >
                  {p.is_active !== false ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (p.role === "super_admin") {
                      toast.error(
                        "Segurança: Super Admins não podem ser excluídos.",
                      );
                      return;
                    }
                    setUserToDelete(p.id);
                  }}
                  disabled={p.role === "super_admin"}
                  className={cn(
                    "p-2 rounded-xl transition-all text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                    p.role === "super_admin" && "opacity-30 cursor-not-allowed",
                  )}
                  title="Excluir Usuário"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            CONTROLE MASTER
          </h1>
          <p className="text-muted-foreground mt-1 font-medium italic">
            Monitoramento de usuários em tempo real •{" "}
            <span className="text-accent">NAVEO INFRA</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleManualSync}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border hover:bg-accent/5 hover:border-accent/30 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg"
          >
            <RefreshCw
              className={cn("w-4 h-4", isRefreshing && "animate-spin")}
            />
            Sincronizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            icon: Users,
            label: "Total Usuários",
            value: stats.total,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            icon: Circle,
            label: "Online Agora",
            value: stats.online,
            color: "text-primary",
            bg: "bg-primary/10",
            glow: true,
          },
          {
            icon: CheckCircle,
            label: "Contas Ativas",
            value: stats.active,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
          },
          {
            icon: UserPlus,
            label: "Novos Hoje",
            value: stats.newToday,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all"
          >
            <div
              className={cn(
                "absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 rounded-full",
                card.color.replace("text", "bg"),
              )}
            />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className={cn("p-3 rounded-2xl", card.bg)}>
                <card.icon
                  className={cn(
                    "w-6 h-6",
                    card.color,
                    card.glow && "animate-pulse",
                  )}
                />
              </div>
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                {card.label}
              </h3>
            </div>
            <p className="text-4xl font-black text-foreground relative z-10">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden text-foreground">
        <div className="p-8 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Monitor de Atividade
            </h2>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border/50 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="py-5 px-8 text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                  Usuário / Sistema
                </th>
                <th className="py-5 px-6 text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                  Empresa & Contato
                </th>
                <th className="py-5 px-6 text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                  Cargo / Status
                </th>
                <th className="py-5 px-6 text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                  Último Acesso
                </th>
                <th className="py-5 px-8 text-[11px] font-black uppercase text-muted-foreground tracking-widest text-right">
                  Ações de Controle
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading
                ? Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="py-12 px-8">
                          <div className="h-12 bg-muted/20 rounded-2xl w-full" />
                        </td>
                      </tr>
                    ))
                : filteredProfiles.map((p) => renderUserRow(p, false))}

              {!loading && filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Search className="w-16 h-16" />
                      <p className="text-xl font-bold uppercase tracking-widest">
                        Nenhum usuário encontrado
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal de Detalhes do Usuário */}
      <Dialog.Root
        open={!!selectedProfile}
        onOpenChange={(open) => !open && setSelectedProfile(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border/50 rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh]">
            {selectedProfile && (
              <>
                <div className="p-8 border-b border-border/20 flex justify-between items-center bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                      {selectedProfile.avatar_url ? (
                        <img
                          src={selectedProfile.avatar_url}
                          alt={selectedProfile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <Dialog.Title className="text-2xl font-black text-foreground uppercase tracking-tight">
                        {selectedProfile.full_name}
                      </Dialog.Title>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            onlineUsersMetadata[selectedProfile.id]
                              ? "bg-primary animate-pulse"
                              : "bg-gray-400",
                          )}
                        />
                        {onlineUsersMetadata[selectedProfile.id]
                          ? "Online Agora"
                          : "Desconectado"}
                      </p>
                    </div>
                  </div>
                  <Dialog.Close className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-muted-foreground" />
                  </Dialog.Close>
                </div>

                <div className="p-2 bg-muted/20 border-b border-border/10">
                  <div className="flex gap-1 p-1 bg-background/50 rounded-2xl border border-border/50">
                    <button
                      onClick={() => setActiveTab("info")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        activeTab === "info"
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-foreground/5",
                      )}
                    >
                      <Activity className="w-4 h-4" />
                      Informações
                    </button>
                    <button
                      onClick={() => setActiveTab("team")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        activeTab === "team"
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-foreground/5",
                      )}
                    >
                      <Users className="w-4 h-4" />
                      Equipes
                    </button>
                  </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                  {activeTab === "info" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            E-mail de Contato
                          </label>
                          <div className="flex items-center gap-3 p-4 bg-muted/10 border border-border/50 rounded-2xl group hover:border-primary/30 transition-colors">
                            <Mail className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">
                              {selectedProfile.email || "---"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Telefone / WhatsApp
                          </label>
                          <div className="flex items-center gap-3 p-4 bg-muted/10 border border-border/50 rounded-2xl group hover:border-primary/30 transition-colors">
                            <Phone className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">
                              {selectedProfile.phone || "---"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Cargo Profissional
                          </label>
                          <div className="flex items-center gap-3 p-4 bg-muted/10 border border-border/50 rounded-2xl group hover:border-primary/30 transition-colors">
                            <Briefcase className="w-4 h-4 text-primary" />
                            <input
                              type="text"
                              defaultValue={selectedProfile.job_title || ""}
                              onBlur={(e) =>
                                updateJobTitle(
                                  selectedProfile.id,
                                  e.target.value,
                                )
                              }
                              placeholder="Nenhum cargo definido"
                              className="text-sm font-bold text-foreground bg-transparent w-full focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Empresa Vinculada
                          </label>
                          <div className="flex items-center gap-3 p-4 bg-muted/10 border border-border/50 rounded-2xl group hover:border-primary/30 transition-colors">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-foreground">
                              {selectedProfile.company_name || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Shield className="w-12 h-12 text-primary" />
                          </div>
                          <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">
                            Privilégios do Sistema
                          </label>
                          <p className="text-2xl font-black text-foreground uppercase tracking-tighter">
                            {selectedProfile.role === "super_admin"
                              ? "SUPER ADM"
                              : selectedProfile.role.toUpperCase()}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/10 border border-border/50 rounded-2xl">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
                              Status
                            </label>
                            <span
                              className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                selectedProfile.is_active !== false
                                  ? "text-primary"
                                  : "text-red-500",
                              )}
                            >
                              {selectedProfile.is_active !== false
                                ? "Ativo"
                                : "Inativo"}
                            </span>
                          </div>
                          <div className="p-4 bg-muted/10 border border-border/50 rounded-2xl">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
                              Membro desde
                            </label>
                            <span className="text-xs font-black text-foreground uppercase tracking-widest text-[10px]">
                              {new Date(
                                selectedProfile.created_at,
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-muted/10 border border-border/50 rounded-2xl">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
                            Última Atividade
                          </label>
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {selectedProfile.last_login_at
                              ? new Date(
                                  selectedProfile.last_login_at,
                                ).toLocaleString("pt-BR")
                              : "Nunca"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                          Círculo de Equipe (
                          {
                            profiles.filter(
                              (cp) =>
                                cp.id === selectedProfile.id ||
                                cp.id === selectedProfile.admin_id ||
                                cp.admin_id === selectedProfile.id ||
                                (selectedProfile.admin_id &&
                                  cp.admin_id === selectedProfile.admin_id),
                            ).length
                          }
                          )
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {profiles.filter(
                          (cp) =>
                            cp.id === selectedProfile.id ||
                            cp.id === selectedProfile.admin_id ||
                            cp.admin_id === selectedProfile.id ||
                            (selectedProfile.admin_id &&
                              cp.admin_id === selectedProfile.admin_id),
                        ).length > 0 ? (
                          profiles
                            .filter(
                              (cp) =>
                                cp.id === selectedProfile.id ||
                                cp.id === selectedProfile.admin_id ||
                                cp.admin_id === selectedProfile.id ||
                                (selectedProfile.admin_id &&
                                  cp.admin_id === selectedProfile.admin_id),
                            )
                            .map((member) => (
                              <div
                                key={member.id}
                                className={cn(
                                  "flex items-center justify-between p-4 border rounded-2xl transition-all group",
                                  member.id === profile?.id
                                    ? "bg-primary/5 border-primary/30"
                                    : member.id === selectedProfile.id
                                      ? "bg-muted/30 border-border/50"
                                      : "bg-background border-border/50 hover:border-primary/30",
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-accent/10 flex items-center justify-center border border-border group-hover:border-primary/20">
                                    {member.avatar_url ? (
                                      <img
                                        src={member.avatar_url}
                                        alt={member.full_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <User className="w-5 h-5 text-accent" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground leading-tight">
                                      {member.full_name || "Sem Nome"}
                                      {member.id === profile?.id && (
                                        <span className="ml-2 text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full uppercase">
                                          Você
                                        </span>
                                      )}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "w-1.5 h-1.5 rounded-full",
                                          member.is_active !== false
                                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
                                        )}
                                      ></span>
                                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                        {member.is_active !== false
                                          ? "Ativo"
                                          : "Inativo"}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                      {member.email && member.email !== "---"
                                        ? member.email
                                        : member.id === profile?.id
                                          ? profile?.email
                                          : "---"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-muted/50 rounded-lg border border-border/20 text-muted-foreground group-hover:text-primary transition-colors">
                                    {member.role === "super_admin"
                                      ? "SUPER ADM"
                                      : (member.role || "user").toUpperCase()}
                                  </span>
                                  {member.id === selectedProfile.admin_id && (
                                    <span className="text-[8px] font-bold text-accent uppercase tracking-tighter">
                                      Gestor
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-3xl opacity-40">
                            <Users className="w-12 h-12 mx-auto mb-3" />
                            <p className="text-xs font-black uppercase tracking-[0.2em]">
                              Este usuário não possui equipe
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-border/20 bg-muted/10 flex justify-end shrink-0">
                  <Dialog.Close asChild>
                    <button className="px-8 py-3 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl">
                      Fechar Detalhes
                    </button>
                  </Dialog.Close>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal de Exclusão de Usuário */}
      <Dialog.Root
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card border border-border/50 rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden animate-in zoom-in-95 fade-in duration-300 p-8">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-2 border border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
                <AlertCircle className="w-10 h-10 text-red-500 flex-shrink-0" />
              </div>
              <Dialog.Title className="text-2xl font-black text-foreground uppercase tracking-tight">
                Excluir Usuário?
              </Dialog.Title>
              <Dialog.Description className="text-sm font-medium text-muted-foreground leading-relaxed">
                Tem certeza que deseja excluir permanentemente este usuário?{" "}
                <span className="text-red-500 font-bold block mt-2">
                  Esta ação não pode ser desfeita.
                </span>
              </Dialog.Description>

              <div className="flex gap-4 w-full mt-6">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-muted/40 hover:bg-muted/60 text-foreground font-black text-[11px] uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteUser}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
