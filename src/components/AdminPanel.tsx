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
  created_at: string;
  last_login_at: string | null;
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
  const [activeTab, setActiveTab] = useState<"info" | "team">("info");

  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    active: 0,
    newToday: 0,
  });

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar usuários.");
    } else if (data) {
      setProfiles(data);

      const total = data.length;
      const active = data.filter((p) => p.is_active !== false).length;
      const today = new Date().toISOString().split("T")[0];
      const newToday = data.filter((p) =>
        p.created_at.startsWith(today),
      ).length;

      setStats((prev) => ({ ...prev, total, active, newToday }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();

    // Presence setup
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: profile?.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const metadata: Record<string, any> = {};
        Object.keys(state).forEach((id) => {
          metadata[id] = (state[id] as any[])[0];
        });

        setOnlineUsersMetadata(metadata);
        setStats((prev) => ({ ...prev, online: Object.keys(state).length }));
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setOnlineUsersMetadata((prev) => ({ ...prev, [key]: newPresences[0] }));
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        setOnlineUsersMetadata((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    // Update duration timers
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, []);

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
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao atualizar cargo.");
    } else {
      toast.success("Cargo atualizado com sucesso!");
      fetchProfiles();
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !window.confirm(
        "Atenção: Tem certeza que deseja excluir permanentemente este usuário? Esta ação não pode ser desfeita.",
      )
    )
      return;

    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) {
      toast.error("Erro ao excluir usuário.");
    } else {
      toast.success("Usuário excluído com sucesso!");
      if (selectedProfile?.id === userId) {
        setSelectedProfile(null);
      }
      fetchProfiles();
    }
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
    const presence = onlineUsersMetadata[p.id];
    const isOnline = !!presence;
    const sessionStart = presence?.online_at || p.last_login_at;
    const teamMembers = profiles.filter((child) => child.admin_id === p.id);
    const hasTeam = teamMembers.length > 0;
    const isExpanded = expandedUsers.includes(p.id);

    return (
      <React.Fragment key={p.id}>
        <tr
          onClick={() => {
            setSelectedProfile(p);
            setActiveTab("info");
          }}
          className={cn(
            "group transition-all hover:bg-accent/5 cursor-pointer",
            isChild && "bg-accent/5",
          )}
        >
          <td className="py-4 px-6">
            <div className="flex items-center gap-4">
              {hasTeam && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(p.id);
                  }}
                  className="p-1 hover:bg-accent/10 rounded-md transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {!hasTeam && isChild && <div className="w-6" />}

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
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                    isOnline
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "bg-gray-400",
                  )}
                />
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
            <div className="flex flex-col">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border max-w-fit mb-1",
                  p.role === "super_admin" &&
                    "bg-purple-100 text-purple-700 border-purple-200",
                  p.role === "admin" &&
                    "bg-blue-100 text-blue-700 border-blue-200",
                  p.role === "user" &&
                    "bg-gray-100 text-gray-700 border-gray-200",
                )}
              >
                {p.role === "super_admin" ? "SUPER ADM" : p.role.toUpperCase()}
              </span>
              <span
                className={cn(
                  "text-[10px] items-center flex gap-1 font-bold",
                  p.is_active !== false ? "text-emerald-500" : "text-red-500",
                )}
              >
                <Circle className="w-2 h-2 fill-current" />
                {p.is_active !== false ? "ATIVO" : "INATIVO"}
              </span>
            </div>
          </td>

          <td className="py-4 px-6">
            <div className="flex flex-col">
              {isOnline ? (
                <span className="text-xs font-black text-emerald-500 flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" />
                  EM SESSÃO: {formatDuration(sessionStart)}
                </span>
              ) : (
                <span className="text-xs font-bold text-muted-foreground/60 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  OFFLINE
                </span>
              )}
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Visto:{" "}
                {p.last_login_at
                  ? new Date(p.last_login_at).toLocaleString("pt-BR")
                  : "---"}
              </span>
            </div>
          </td>

          <td className="py-4 px-6 text-right">
            <div className="flex items-center justify-end gap-2">
              <select
                value={p.role}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateUserRole(p.id, e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent font-medium"
              >
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
                <option value="super_admin">SUPER ADMIN</option>
              </select>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleUserStatus(p.id, p.is_active !== false);
                }}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  p.is_active !== false
                    ? "text-red-500 hover:bg-red-500/10"
                    : "text-emerald-500 hover:bg-emerald-500/10",
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
                  deleteUser(p.id);
                }}
                className="p-2 rounded-xl transition-all text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                title="Excluir Usuário"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && teamMembers.map((child) => renderUserRow(child, true))}
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
            <span className="text-accent">NETUNO INFRA</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border hover:bg-accent/5 hover:border-accent/30 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
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
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
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
                : filteredProfiles
                    .filter((p) => {
                      if (!p.admin_id) return true;
                      // Se o patrão deste usuário também estiver na lista filtrada,
                      // não o mostra no nível raiz (pois ele aparecerá dentro da linha do patrão)
                      return !filteredProfiles.find(
                        (parent) => parent.id === p.admin_id,
                      );
                    })
                    .map((p) => renderUserRow(p))}

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
                              ? "bg-emerald-500 animate-pulse"
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
                                  ? "text-emerald-500"
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
                    (() => {
                      const modalTeamMembers = profiles.filter((cp) => {
                        // 1. O próprio usuário que estamos visualizando
                        if (cp.id === selectedProfile.id) return true;

                        // 2. Lógica para o SUPER ADM
                        if (selectedProfile.role === "super_admin") {
                          // Mostrar todos que este Super ADM gerencia explicitamente
                          if (cp.admin_id === selectedProfile.id) return true;
                          // Mostrar todos que não tem gestor (Órfãos)
                          if (!cp.admin_id && cp.id !== selectedProfile.id)
                            return true;
                        }

                        // 3. O gestor direto deste usuário (O "Chefe")
                        if (cp.id === selectedProfile.admin_id) return true;

                        // 4. Quem este usuário gerencia diretamente (Os "Subordinados")
                        if (cp.admin_id === selectedProfile.id) return true;

                        // 5. Colegas de equipe (Quem tem o mesmo gestor)
                        if (
                          selectedProfile.admin_id &&
                          cp.admin_id === selectedProfile.admin_id
                        )
                          return true;

                        // 6. Se o usuário visualizado não tem gestor, mostramos o Super ADM como o gestor implícito
                        if (
                          !selectedProfile.admin_id &&
                          cp.role === "super_admin"
                        )
                          return true;

                        return false;
                      });

                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                              Círculo de Equipe ({modalTeamMembers.length})
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {modalTeamMembers.length > 0 ? (
                              modalTeamMembers.map((member) => (
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
                                        : member.role.toUpperCase()}
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
                        </>
                      );
                    })()
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
    </div>
  );
}
