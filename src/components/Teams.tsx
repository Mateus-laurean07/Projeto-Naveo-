import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Edit3,
  Trash2,
  X,
  Calendar,
  Search,
  ChevronRight,
  User,
  ChevronDown,
  CheckCircle2,
  Camera,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { toast } from "sonner";

type Member = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  nickname?: string;
  birth_date?: string;
  joined_at: string;
  last_activity: string;
  status: "Ativo" | "Pendente" | "Arquivado";
  is_invitation?: boolean;
  is_new?: boolean;
  is_received?: boolean;
  invited_by?: string;
  is_pro?: boolean;
  last_seen_at?: string;
  last_login_at?: string;
  admin_id?: string | null;
  job_title?: string;
};

const INITIAL_ROLES = [
  "Proprietário",
  "Administrador",
  "Diretor",
  "Gerente",
  "Coordenador",
  "Supervisor",
  "Analista",
  "Auxiliar",
  "Estagiário",
  "Jovem Aprendiz",
  "Financeiro",
  "Recursos Humanos",
  "Marketing",
  "Vendedor",
  "Atendimento",
  "Suporte Técnico",
  "Consultor",
  "Desenvolvedor",
  "Desenvolvedor Front-End",
  "Desenvolvedor Back-End",
  "Desenvolvedor Full-Stack",
  "Designer UI/UX",
  "Design",
  "Social Media",
];

export function Teams({ profile: currentProfile }: { profile?: any }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("com-acesso");
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newMemberRole, setNewMemberRole] = useState("");
  const [invitations, setInvitations] = useState<Member[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editPreviewImage, setEditPreviewImage] = useState<string | null>(null);
  const [customRoles, setCustomRoles] = useState<string[]>(INITIAL_ROLES);
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [activeProfile, setActiveProfile] = useState<any>(currentProfile);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    type: "danger",
    onConfirm: () => {},
  });
  const [onlineUsersMetadata, setOnlineUsersMetadata] = useState<
    Record<string, any>
  >({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
    });
  }, []);

  useEffect(() => {
    setActiveProfile(currentProfile);
  }, [currentProfile]);

  useEffect(() => {
    fetchData();
  }, [activeProfile?.id, activeProfile?.role, activeProfile?.admin_id]);

  useEffect(() => {
    if (!activeProfile?.id) return;

    // 1. Presença em tempo real (Supabase Presence)
    const presenceChannel = supabase.channel("netuno-presence", {
      config: { presence: { key: activeProfile.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const metadata: Record<string, any> = {};
        Object.keys(state).forEach((id) => {
          metadata[id] = (state[id] as any[])[0];
        });
        setOnlineUsersMetadata(metadata);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setOnlineUsersMetadata((prev) => ({ ...prev, [key]: newPresences[0] }));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsersMetadata((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .subscribe();

    // 2. Timer para atualizar o tempo atual (para o cálculo de offline por heartbeat)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Atualiza a cada 10s para performance

    return () => {
      supabase.removeChannel(presenceChannel);
      clearInterval(timer);
    };
  }, [activeProfile?.id]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMembers(), fetchInvitations()]);
    setLoading(false);
  };

  const fetchInvitations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let orFilter = `email.eq.${user?.email || "none"}`;
      if (currentProfile?.id) {
        orFilter = `invited_by.eq.${currentProfile.id},${orFilter}`;
      }

      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("status", "pending")
        .or(orFilter)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setInvitations(
          data.map((inv) => ({
            id: inv.id,
            full_name:
              inv.email === user?.email
                ? "Convite Recebido"
                : "Aguardando Cadastro",
            email: inv.email,
            role: inv.role || "user", // O role de acesso real
            job_title: inv.job_title || "Membro", // O cargo visual
            joined_at: new Date(inv.created_at).toLocaleDateString("pt-BR"),
            last_activity: "Pendente",
            status: "Pendente",
            is_invitation: true,
            is_received: inv.email === user?.email,
            invited_by: inv.invited_by,
          })),
        );
      }
    } catch (e) {
      console.error("Erro ao carregar convites");
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const user = authUser || (await supabase.auth.getUser()).data.user;

      if (!user) {
        setLoading(false);
        return;
      }
      if (!authUser) setAuthUser(user);

      // 1. Tentar obter o perfil ativo atualizado do banco
      // Forçamos a busca para garantir que temos o admin_id mais recente (link da equipe)
      const { data: dbProfile, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profError) throw profError;

      let resolvedProfile = dbProfile || activeProfile;
      if (dbProfile) setActiveProfile(dbProfile);

      if (!resolvedProfile) {
        setLoading(false);
        return;
      }

      // 2. Definir o ID da Equipe (Team Owner)
      // Prioridade: admin_id do banco > admin_id do metadata > id do próprio usuário
      const teamId =
        resolvedProfile?.admin_id ||
        user.user_metadata?.admin_id ||
        (resolvedProfile?.role === "admin" ? resolvedProfile.id : null) ||
        user.id;

      let query = supabase.from("profiles").select("*");

      // Se for super_admin, ele vê tudo por RLS, então restringimos à equipe dele no frontend
      // Para os demais, o RLS já faz o isolamento, mas o filtro garante que pegamos o admin e os colegas
      const queryFilter = `id.eq.${teamId},admin_id.eq.${teamId}`;
      query = query.or(queryFilter);

      const { data, error } = await query.order("full_name");

      if (error) throw error;

      // 2. Mapear todos os dados vindos do banco — o banco é a fonte de verdade
      let finalData: Member[] =
        data?.map((m) => ({
          id: m.id,
          full_name: m.full_name || m.email?.split("@")[0] || "Sem Nome",
          email: m.email || user.email || "",
          role: m.role || "user",
          job_title: m.job_title || "",
          avatar_url: m.avatar_url || "",
          nickname: m.nickname || "",
          birth_date: m.birth_date || "",
          is_pro: m.is_pro || false,
          last_seen_at: m.last_seen_at,
          last_login_at: m.last_login_at,
          admin_id: m.admin_id,
          joined_at: m.created_at
            ? new Date(m.created_at).toLocaleDateString("pt-BR")
            : "N/A",
          last_activity: "Ativo",
          status: (m.is_active === false ? "Arquivado" : "Ativo") as
            | "Ativo"
            | "Pendente"
            | "Arquivado",
        })) || [];

      // Garante que o próprio usuário apareça mesmo que o banco não o retorne
      if (!finalData.some((m) => m.id === user.id)) {
        finalData = [
          {
            id: user.id,
            full_name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Eu (Você)",
            email: user.email || "",
            role: user.user_metadata?.role || resolvedProfile?.role || "user",
            job_title: resolvedProfile?.job_title || "",
            joined_at: new Date().toLocaleDateString("pt-BR"),
            status: (resolvedProfile?.is_active === false
              ? "Arquivado"
              : "Ativo") as any,
            last_activity: "Agora",
          },
          ...finalData,
        ];
      }

      setMembers(finalData);
    } catch (e: any) {
      console.error("Erro ao carregar equipe:", e);
      toast.error("Erro ao carregar equipe. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Funções de Hierarquia de Cargos
  const canManageMember = (member: Member) => {
    if (!activeProfile) return false;

    // Se eu for o próprio usuário, posso me gerenciar (ex: sair da equipe)
    if (member.id === activeProfile?.id) return true;

    // Se eu for o dono da equipe (admin_id is null), posso gerenciar qualquer um
    if (!activeProfile?.admin_id) return true;

    // Se eu for super_admin, posso tudo
    if (activeProfile?.role === "super_admin") return true;

    // "Sem Hierarquia": em uma equipe, o que o gestor vê, eles veem.
    // Membros podem gerenciar uns aos outros desde que o alvo não seja o dono.
    if (activeProfile?.admin_id && member.admin_id === activeProfile.admin_id) {
      return true;
    }

    // Se o alvo for o dono da equipe (admin_id null), ninguém mexe nele exceto o próprio
    if (!member.admin_id) return false;

    return false;
  };

  const handleEdit = (member: Member) => {
    if (!canManageMember(member)) {
      toast.error(
        "Acesso negado: apenas o proprietário pode gerenciar este perfil.",
      );
      return;
    }
    setSelectedMember(member);
    setEditPreviewImage(null);
    setIsEditing(true);
  };

  const handleDelete = async (
    id: string,
    isInvitation?: boolean,
    memberRole?: string,
  ) => {
    try {
      if (isInvitation) {
        // Convites podem ser removidos por quem tem autoridade
        const { error } = await supabase
          .from("invitations")
          .delete()
          .eq("id", id);
        if (error) throw error;
        setInvitations((prev) => prev.filter((i) => i.id !== id));
      } else {
        // Regra: O usuário não pode se excluir se ele for o DONO da própria equipe
        // Mas se ele for um MEMBRO (tiver admin_id), ele pode "Sair" da equipe.
        const user = authUser || (await supabase.auth.getUser()).data.user;
        const isSelf = user && id === user.id;

        if (isSelf) {
          if (!activeProfile?.admin_id) {
            toast.error(
              "Você é o administrador desta equipe e não pode sair. Você deve excluir a equipe ou transferir a administração primeiro.",
            );
            return;
          }
          // Se for membro, ele pode sair (admin_id = null)
        } else if (memberRole) {
          // Sem hierarquia - a lógica agora é centralizada no canManageMember
          if (
            !canManageMember(
              members.find((m) => m.id === id) || { ...members[0], id },
            )
          ) {
            const memberName =
              members.find((m) => m.id === id)?.full_name || "este membro";
            toast.error(`Você não tem autoridade para remover ${memberName}.`);
            return;
          }
        }

        // Usar RPC para garantir privilégios e sincronização correta
        const { error } = await supabase.rpc("manage_team_member", {
          target_user_id: id,
          is_removal: true,
          new_role: null,
        });

        if (error) throw error;

        // Garante que a pessoa NÃO seja bloqueada no sistema, apenas desvinculada, e reseta o admin_id
        await supabase.from("profiles").update({ is_active: true, admin_id: null }).eq("id", id);

        setMembers((prev) => prev.filter((m) => m.id !== id));
      }

      const user = authUser || (await supabase.auth.getUser()).data.user;
      const isSelf = user && id === user.id;

      if (isSelf) {
        toast.success(
          "Você saiu da equipe com sucesso! O sistema será reiniciado em instantes para aplicar as mudanças.",
        );
        setTimeout(() => window.location.reload(), 2500);
      } else {
        toast.success("Membro removido da equipe com sucesso!");
      }
    } catch (e: any) {
      const user = authUser || (await supabase.auth.getUser()).data.user;
      const isSelf = user && id === user.id;

      toast.error(
        isSelf
          ? "Erro ao processar sua saída da equipe."
          : "Erro ao remover o membro da equipe.",
      );
      console.error(e);
    }
  };

  const subTabs = [
    { id: "com-acesso", label: "Membros da Equipe" },
    { id: "pendentes", label: "Convites Pendentes" },
    { id: "arquivados", label: "Usuários Arquivados" },
  ];

  const RoleSelect = ({
    value,
    onChange,
    id,
  }: {
    value: string;
    onChange: (v: string) => void;
    id: string;
  }) => {
    const [search, setSearch] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const filteredRoles = customRoles.filter(
      (r) =>
        r.toLowerCase().includes(search.toLowerCase()) ||
        r.toLowerCase().includes(value.toLowerCase()),
    );

    const handleSelect = (role: string) => {
      onChange(role);
      setSearch("");
      setShowRoleDropdown(null);
    };

    const handleCreate = () => {
      if (search && !customRoles.includes(search)) {
        setCustomRoles((prev) => [...prev, search]);
        handleSelect(search);
      }
    };

    const handleDeleteRole = (e: React.MouseEvent, roleToDelete: string) => {
      e.stopPropagation();
      e.preventDefault();
      setCustomRoles((prev) => prev.filter((r) => r !== roleToDelete));
      if (value === roleToDelete) {
        onChange("");
      }
      toast.success(`Cargo "${roleToDelete}" removido.`);
    };

    return (
      <div className="relative group/role">
        <div className="relative">
          <input
            type="text"
            placeholder="Selecione ou digite um cargo..."
            value={isFocused ? search : value || ""}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowRoleDropdown(id);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsFocused(false);
                setShowRoleDropdown(null);
                setSearch("");
              }, 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (search && !filteredRoles.includes(search)) {
                  handleCreate();
                } else if (filteredRoles.length > 0) {
                  handleSelect(filteredRoles[0]);
                }
              }
            }}
            className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium pr-12"
          />
          <ChevronDown
            size={18}
            className={cn(
              "absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform duration-300 pointer-events-none",
              showRoleDropdown === id && "rotate-180 text-primary",
            )}
          />
        </div>

        {showRoleDropdown === id && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[150] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-[220px] overflow-y-auto p-1.5 custom-scrollbar">
              {filteredRoles.length > 0
                ? filteredRoles.map((role) => (
                    <div
                      key={role}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(role);
                      }}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm cursor-pointer transition-all flex items-center justify-between group/item",
                        value === role || search === role
                          ? "bg-primary text-primary-foreground font-bold"
                          : "hover:bg-primary/10 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Shield
                          size={14}
                          className={cn(
                            "opacity-50",
                            (value === role || search === role) &&
                              "opacity-100",
                          )}
                        />
                        {role}
                      </span>
                      {(value === role || search === role) && (
                        <CheckCircle2 size={14} />
                      )}
                      <button
                        onMouseDown={(e) => handleDeleteRole(e, role)}
                        className={cn(
                          "p-1.5 rounded-lg transition-all opacity-0 group-hover/item:opacity-100",
                          value === role || search === role
                            ? "hover:bg-white/20 text-primary-foreground"
                            : "hover:bg-red-500/10 text-muted-foreground hover:text-red-500",
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                : search && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCreate();
                      }}
                      className="px-4 py-4 rounded-xl text-sm cursor-pointer border border-dashed border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-all flex flex-col gap-1"
                    >
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-60 text-foreground">
                        Novo Cargo Identificado
                      </span>
                      <span className="font-bold">Criar "{search}"</span>
                    </div>
                  )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-border/50">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">
            Equipe & Colaboradores
          </h2>
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mt-1">
            Gerencie o acesso dos seus parceiros no Netuno
          </p>
        </div>
        <button
          onClick={() => {
            const role = activeProfile?.role;
            const isPro = activeProfile?.is_pro || currentProfile?.is_pro;
            // Permitir se for admin, super_admin ou se for o dono da própria conta com plano PRO
            // "Sem hierarquia": em uma equipe, todos veem e podem clicar se o gestor puder.
            // Aqui verificamos apenas se há vínculo de equipe ou se é admin independente.
            const canAdd =
              role === "super_admin" ||
              role === "admin" ||
              activeProfile?.admin_id || // Se for membro da equipe, herda o direito de convite pela conta do gestor
              (role === "user" && isPro);

            if (!canAdd) {
              toast.error(
                "O plano PRO (ou superior) é necessário para gerenciar equipes. Faça upgrade no menu de Planos.",
              );
              return;
            }
            setIsAdding(true);
          }}
          className="flex-shrink-0 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl flex items-center justify-center gap-3 font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px]"
        >
          <UserPlus size={16} />
          <span>Adicionar Membro</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-6 border-b border-border/40 pb-1">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "text-sm font-medium pb-4 relative transition-colors flex items-center gap-2",
              activeSubTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.id === "pendentes" &&
              invitations.some((inv) => inv.is_received) && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
              )}
            {activeSubTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
            )}
          </button>
        ))}
      </div>

      {/* Members List (Table Layout based on Image 1) */}
      <div className="bg-card/30 backdrop-blur-md rounded-3xl border border-border/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Nome
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                  Data de Nascimento
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                  Permissões
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                        Sincronizando com as águas...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                (activeSubTab === "pendentes"
                  ? invitations
                  : members.filter((m) =>
                      activeSubTab === "arquivados"
                        ? m.status === "Arquivado"
                        : true,
                    )
                ).map((member) => {
                  const mId = String(member.id).trim().toLowerCase();
                  const isSelf = mId === String(authUser?.id || activeProfile?.id).trim().toLowerCase();
                  
                  const isOnlineByPresence = Object.keys(onlineUsersMetadata).some(
                    key => String(key).trim().toLowerCase() === mId
                  );

                  const isOnline =
                    isSelf ||
                    isOnlineByPresence ||
                    (() => {
                      const lastSeen =
                        member.last_seen_at || member.last_login_at;
                      if (!lastSeen) return false;
                      return (
                        currentTime.getTime() - new Date(lastSeen).getTime() <
                        2 * 60 * 1000
                      );
                    })();

                  return (
                    <tr
                      key={member.id}
                      className={cn(
                        "group transition-colors cursor-pointer",
                        member.id === activeProfile?.id
                          ? "bg-primary/[0.03] shadow-[inset_4px_0_0_hsl(var(--primary))]"
                          : member.is_new
                            ? "bg-amber-500/10 hover:bg-amber-500/15 shadow-[inset_4px_0_0_rgba(245,158,11,1)]"
                            : "hover:bg-foreground/[0.02]",
                      )}
                      onClick={() => {
                        if (member.is_new) {
                          setMembers((prev) =>
                            prev.map((m) =>
                              m.id === member.id ? { ...m, is_new: false } : m,
                            ),
                          );
                        }
                      }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-black shrink-0 transition-all relative",
                              member.is_invitation
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-md shadow-amber-500/10"
                                : "border-primary/20 bg-background text-primary shadow-lg shadow-primary/10",
                            )}
                          >
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.full_name || "Membro"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (member.full_name || "M")
                                .slice(0, 2)
                                .toUpperCase()
                            )}

                            {!member.is_invitation && isOnline && (
                              <div
                                title="Online"
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm truncate">
                                {member.nickname
                                  ? `${member.full_name} (${member.nickname})`
                                  : member.full_name}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                                  member.is_invitation
                                    ? "text-amber-500"
                                    : member.status === "Arquivado"
                                      ? "text-red-500"
                                      : isOnline
                                        ? "text-primary"
                                        : "text-slate-400 opacity-60",
                                )}
                              >
                                {member.is_invitation
                                  ? "Convidado"
                                  : member.status === "Arquivado"
                                    ? "Inativo"
                                    : isOnline
                                      ? "Ativo"
                                      : "Offline"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {member.email && member.email !== "---"
                                ? member.email
                                : member.id === authUser?.id
                                  ? authUser?.email
                                  : "---"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm text-muted-foreground font-medium">
                          {member.birth_date || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            member.job_title || member.role === "SUPER ADM"
                              ? "text-primary"
                              : "text-foreground/80",
                          )}
                        >
                          {member.job_title || "Membro"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!member.is_invitation ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isSuperAdmin = activeProfile?.role === "super_admin";
                                  const isPro = activeProfile?.is_pro || currentProfile?.is_pro;
                                  
                                  if (!isPro && !isSuperAdmin) {
                                    toast.error(
                                      "Você não tem permissão para editar equipes. Assine o plano PRO.",
                                    );
                                    return;
                                  }
                                  handleEdit(member);
                                }}
                                className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isSuperAdmin = activeProfile?.role === "super_admin";
                                  const isPro = activeProfile?.is_pro || currentProfile?.is_pro;

                                  if (!isPro && !isSuperAdmin) {
                                    toast.error(
                                      "Você não tem permissão para remover membros. Assine o plano PRO.",
                                    );
                                    return;
                                  }

                                  const isSelf =
                                    member.id === activeProfile?.id;

                                  setConfirmModal({
                                    isOpen: true,
                                    title: isSelf
                                      ? "Sair da Equipe"
                                      : "Remover Membro",
                                    message: isSelf
                                      ? "Você deseja sair da equipe? Seu histórico de atividades será preservado, mas você só poderá acessar os projetos novamente se for convidado no futuro."
                                      : `Você tem certeza que deseja remover ${member.full_name || "este membro"} da sua equipe?`,
                                    confirmText: isSelf
                                      ? "Sair Agora"
                                      : "Remover Membro",
                                    type: isSelf ? "warning" : "danger",
                                    onConfirm: () => {
                                      handleDelete(
                                        member.id,
                                        member.is_invitation,
                                        member.role,
                                      );
                                    },
                                  });
                                }}
                                title={
                                  member.id === activeProfile?.id
                                    ? "Sair da Equipe"
                                    : "Remover Membro"
                                }
                                className={cn(
                                  "p-2 rounded-xl transition-all",
                                  member.id === activeProfile?.id
                                    ? "text-amber-500 hover:bg-amber-500/10"
                                    : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
                                )}
                              >
                                {member.id === activeProfile?.id ? (
                                  <LogOut size={18} />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                              </button>
                            </>
                          ) : member.is_received ? (
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const user = (await supabase.auth.getUser())
                                      .data.user;
                                    const targetUserId =
                                      authUser?.id ||
                                      user?.id ||
                                      activeProfile?.id ||
                                      currentProfile?.id;
                                    if (!targetUserId)
                                      throw new Error(
                                        "Usuário não identificado",
                                      );

                                    const { error: profError } = await supabase
                                      .from("profiles")
                                      .update({
                                        admin_id: member.invited_by,
                                        is_active: true,
                                        updated_at: new Date().toISOString(),
                                      })
                                      .eq("id", targetUserId);
                                    if (profError) throw profError;
                                    const { error: invError } = await supabase
                                      .from("invitations")
                                      .update({ status: "accepted" })
                                      .eq("id", member.id);
                                    if (invError) throw invError;
                                    toast.success(
                                      "Convite aceito! Bem-vindo à equipe. O sistema será reiniciado em instantes...",
                                    );

                                    // Atualiza localmente e muda de aba
                                    setActiveSubTab("com-acesso");
                                    
                                    setTimeout(() => window.location.reload(), 2500);
                                  } catch (err) {
                                    toast.error("Erro ao aceitar convite.");
                                  }
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-primary text-white hover:bg-emerald-600 transition-all shadow-lg"
                              >
                                Aceitar Convite
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await supabase
                                      .from("invitations")
                                      .update({ status: "rejected" })
                                      .eq("id", member.id);
                                    toast.success("Convite recusado.");
                                    fetchData();
                                  } catch (err) {
                                    toast.error("Erro ao recusar convite.");
                                  }
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                              >
                                Recusar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    currentProfile?.role === "user" &&
                                    !currentProfile?.is_pro
                                  ) {
                                    toast.error(
                                      "Você não tem permissão. Assine o plano PRO.",
                                    );
                                    return;
                                  }
                                  handleDelete(member.id, member.is_invitation);
                                }}
                                className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    currentProfile?.role === "user" &&
                                    !currentProfile?.is_pro
                                  ) {
                                    toast.error(
                                      "Você não tem permissão. Assine o plano PRO.",
                                    );
                                    return;
                                  }

                                  try {
                                    setLoading(true);
                                    const { error } =
                                      await supabase.auth.signInWithOtp({
                                        email: member.email,
                                        options: {
                                          emailRedirectTo:
                                            window.location.origin,
                                        },
                                      });

                                    if (error) throw error;

                                    toast.success(
                                      "Convite reenviado com sucesso!",
                                    );
                                  } catch (err) {
                                    toast.error("Erro ao reenviar convite.");
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all"
                              >
                                Reenviar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-card w-full max-w-lg rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="relative p-10 pb-4">
              <div className="absolute top-8 right-8">
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition-all text-muted-foreground hover:text-foreground active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                    Convidar
                  </h3>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                    Novo Membro da Equipe
                  </p>
                </div>
              </div>
            </div>

            <form
              className="p-10 pt-0 space-y-8"
              onSubmit={async (e) => {
                e.preventDefault();
                if (loading) return;
                const formData = new FormData(e.currentTarget);
                const email = formData.get("email") as string;

                try {
                  setLoading(true);
                  const { error } = await supabase.from("invitations").insert({
                    email,
                    job_title: newMemberRole || "Membro", // Usando job_title para o cargo
                    status: "pending",
                    invited_by: currentProfile?.admin_id || currentProfile?.id,
                  });

                  if (error) throw error;

                  // Envia de fato o email usando Login com Magic Link do Supabase
                  await supabase.auth.signInWithOtp({
                    email,
                    options: {
                      emailRedirectTo: window.location.origin,
                    },
                  });

                  toast.success(
                    `Convite enviado! Peça para a pessoa acessar a conta dela e ir na aba Convites Pendentes para aceitar.`,
                  );
                  setIsAdding(false);

                  // Notificação do sistema:
                  supabase
                    .from("sys_notifications")
                    .insert({
                      title: "Novo Convite",
                      message: `${currentProfile?.full_name || "Alguém"} enviou um convite de ${newMemberRole || "Membro"} para ${email}`,
                      type: "invite",
                    })
                    .then();

                  fetchData();
                } catch (e) {
                  toast.error("Ocorreu um erro ao convidar o membro.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] pl-1">
                    Endereço de E-mail
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      name="email"
                      type="email"
                      placeholder="exemplo@servidor.com"
                      className="w-full bg-foreground/[0.03] border border-border/50 rounded-3xl pl-14 pr-6 py-5 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all font-semibold placeholder:text-muted-foreground/40"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 px-1 font-medium leading-relaxed italic">
                    * Enviaremos um link de confirmação para que o membro
                    complete o cadastro.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] pl-1">
                    Atribuição de Cargo
                  </label>
                  <RoleSelect
                    id="add-role"
                    value={newMemberRole}
                    onChange={(v) => {
                      setNewMemberRole(v);
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-5 rounded-3xl border border-border/50 font-black text-[10px] uppercase tracking-widest hover:bg-foreground/5 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[1.5] py-5 rounded-3xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(var(--primary-rgb),0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      "Processando..."
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Enviar Convite
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal (Based on Image 2) */}
      {isEditing && selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-card w-full max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar rounded-[2rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
            <div className="relative p-5 pb-1">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all text-muted-foreground hover:text-foreground active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                    Configurações
                  </h3>
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                    Perfil do Membro
                  </p>
                </div>
              </div>
            </div>

            <form
              className="p-5 pt-0 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const full_name = (formData.get("full_name") as string)?.trim();
                const birth_date = (
                  formData.get("birth_date") as string
                )?.trim();
                const nickname = (formData.get("nickname") as string)?.trim();

                try {
                  setIsSaving(true);
                  if (selectedMember.is_invitation) {
                    const { error } = await supabase
                      .from("invitations")
                      .update({ job_title: selectedMember.job_title })
                      .eq("id", selectedMember.id);

                    if (error) throw error;

                    setInvitations((prev) =>
                      prev.map((i) =>
                        i.id === selectedMember.id
                          ? { ...i, job_title: selectedMember.job_title }
                          : i,
                      ),
                    );
                  } else {
                    // Não chamaremos o RPC se ele altera o campo "role" de forma destrutiva 
                    // Em vez disso, atualizamos os dados localmente preservando os controles

                    // O update direto atualizará apenas as propriedades estéticas como Cargo (job_title)
                    const { error } = await supabase
                      .from("profiles")
                      .update({
                        full_name,
                        birth_date,
                        nickname,
                        job_title: selectedMember.job_title,
                        ...(editPreviewImage && {
                          avatar_url: editPreviewImage,
                        }),
                      })
                      .eq("id", selectedMember.id);

                    if (error) {
                      console.warn(
                        "Update de nome/foto restringido por RLS, mas cargo persistido.",
                      );
                    }

                    setMembers((prev) =>
                      prev.map((m) =>
                        m.id === selectedMember.id
                          ? {
                              ...m,
                              full_name,
                              birth_date,
                              nickname,
                              job_title: selectedMember.job_title,
                              ...(editPreviewImage && {
                                avatar_url: editPreviewImage,
                              }),
                            }
                          : m,
                      ),
                    );
                  }

                  toast.success("✅ Alterações salvas com sucesso!");
                  setIsEditing(false);
                  setEditPreviewImage(null);
                  fetchData();
                } catch (err: any) {
                  console.error("Erro ao salvar:", err);
                  toast.error(
                    "❌ Erro ao salvar: " +
                      (err?.message || "Tente novamente."),
                  );
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {/* Profile Pic Section Edit */}
              <div className="flex justify-center -mt-1 mb-1">
                <input
                  type="file"
                  id="edit-avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditPreviewImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div
                  className="relative group cursor-pointer"
                  onClick={() =>
                    document.getElementById("edit-avatar-upload")?.click()
                  }
                >
                  <div className="w-20 h-20 rounded-[1.5rem] bg-foreground/[0.03] border-4 border-card p-1 shadow-2xl transition-all group-hover:scale-105 active:scale-95 group-hover:shadow-primary/20">
                    <div className="w-full h-full rounded-[1rem] overflow-hidden bg-background flex items-center justify-center relative border border-border/50">
                      {editPreviewImage || selectedMember.avatar_url ? (
                        <img
                          src={editPreviewImage || selectedMember.avatar_url}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground/30" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Camera className="text-white w-5 h-5 opacity-80" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-card border border-border/50 rounded-xl flex items-center justify-center shadow-2xl text-primary">
                    <Camera size={14} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                    Nome completo
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    defaultValue={selectedMember.full_name}
                    className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <input
                      name="birth_date"
                      type="text"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      defaultValue={selectedMember.birth_date}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 8) {
                          if (value.length > 2 && value.length <= 4) {
                            value = value.replace(/^(\d{2})(\d)/, "$1/$2");
                          } else if (value.length > 4) {
                            value = value.replace(
                              /^(\d{2})(\d{2})(\d)/,
                              "$1/$2/$3",
                            );
                          }
                        }
                        e.target.value = value;
                      }}
                      className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                  Apelido
                </label>
                <input
                  name="nickname"
                  type="text"
                  defaultValue={selectedMember.nickname}
                  placeholder="Como o membro prefere ser chamado"
                  className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={
                    selectedMember.email && selectedMember.email !== "---"
                      ? selectedMember.email
                      : selectedMember.id === authUser?.id
                        ? authUser?.email
                        : ""
                  }
                  disabled
                  className="w-full bg-foreground/5 border border-border/60 rounded-2xl px-4 py-3 font-medium opacity-60 cursor-not-allowed text-muted-foreground text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                  Cargo
                </label>
                {selectedMember.email === "mateuslaureano740@gmail.com" ? (
                  <div className="w-full bg-foreground/5 border border-primary/30 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-not-allowed">
                    <span className="text-lg">🔒</span>
                    <div>
                      <span className="font-black text-primary text-sm uppercase tracking-widest">
                        Super Admin
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Este cargo é fixo e não pode ser alterado
                      </p>
                    </div>
                  </div>
                ) : (
                  <RoleSelect
                    id="edit-role"
                    value={selectedMember.job_title || ""}
                    onChange={(v) => {
                      setSelectedMember({ ...selectedMember, job_title: v });
                    }}
                  />
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-2xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-foreground/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(var(--primary-rgb),0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      Salvando...
                    </span>
                  ) : (
                    "Confirmar Alterações"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] border border-border shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 relative">
            <div className="p-10 text-center relative z-10">
              {/* Icon Container simplified - Larger */}
              <div className="mb-8">
                <div
                  className={cn(
                    "w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-4",
                    confirmModal.type === "danger"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  {confirmModal.type === "danger" ? (
                    <Trash2 size={36} />
                  ) : (
                    <LogOut size={36} />
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed px-4">
                  {confirmModal.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="w-full py-4 rounded-2xl bg-secondary text-secondary-foreground font-bold text-xs uppercase tracking-widest transition-all hover:bg-secondary/80 active:scale-95 border border-border"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg",
                    confirmModal.type === "danger"
                      ? "bg-red-500 shadow-red-500/20 hover:bg-red-600"
                      : "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600",
                  )}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
