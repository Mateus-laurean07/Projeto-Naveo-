import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle,
  X,
  Check,
  Paperclip,
  Edit3,
  User,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

type ReportItem = {
  id: string;
  title: string;
  status: "Novo" | "Em Andamento" | "Finalizado";
  description?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  attachments?: number;
};

export function Reports({ profile }: { profile?: any }) {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null);

  useEffect(() => {
    // Sempre tenta buscar — usa profile se disponível, caso contrário usa auth diretamente
    resolveTeamAndFetch();
    // Recarrega quando admin_id mudar
  }, [profile?.id, profile?.admin_id]);

  const resolveTeamAndFetch = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // admin_id do profile (banco) tem prioridade sobre auth metadata
      const adminId = profile?.admin_id || user.user_metadata?.admin_id;
      const ownerId = adminId || profile?.id || user.id;

      setTeamOwnerId(ownerId);
      await fetchReports(ownerId, adminId || null);
    } catch (e) {
      console.error("[Reports] Erro ao resolver equipe:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teamOwnerId) return;

    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
          filter: `user_id=eq.${teamOwnerId}`,
        },
        () => {
          fetchReports(teamOwnerId, profile?.admin_id || null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamOwnerId]);

  const fetchReports = async (ownerId: string, adminId: string | null) => {
    let query = supabase.from("reports").select("*");

    if (adminId) {
      // Modo Equipe: Vê os relatórios da equipe do gestor
      query = query.eq("user_id", adminId);
    } else {
      // Modo Independente: Vê os que possuem seu user_id ou que você criou
      query = query.or(`user_id.eq.${ownerId},created_by.eq.${ownerId}`);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("[Reports] Erro ao buscar:", error);
      toast.error("Erro ao carregar relatórios: " + error.message);
    } else if (data) {
      setItems(
        data.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          description: item.description,
          assigneeName: item.assignee_name,
          assigneeAvatar: item.assignee_avatar,
        })),
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamOwnerId) return;

    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    ).value;
    const assigneeName = (
      form.elements.namedItem("assignee") as HTMLInputElement
    ).value;

    if (title) {
      const { error } = await supabase.from("reports").insert({
        user_id: teamOwnerId,
        created_by: profile?.id,
        title,
        description,
        assignee_name: assigneeName || "Não Atribuído",
        assignee_avatar: assigneeName
          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
              assigneeName,
            )}&background=random`
          : "",
        status: "Novo",
      });

      if (error) {
        toast.error("Erro ao criar relatório.");
      } else {
        toast.success("Relatório criado!");
        setOpen(false);
        fetchReports(teamOwnerId, profile?.admin_id || null);
      }
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !teamOwnerId) return;

    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    ).value;
    const assigneeName = (
      form.elements.namedItem("assignee") as HTMLInputElement
    ).value;

    const { error } = await supabase
      .from("reports")
      .update({
        title,
        description,
        assignee_name: assigneeName || "Não Atribuído",
        assignee_avatar:
          assigneeName && assigneeName !== editingItem.assigneeName
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                assigneeName,
              )}&background=random`
            : editingItem.assigneeAvatar || "",
      })
      .eq("id", editingItem.id);

    if (error) {
      toast.error("Erro ao atualizar relatório.");
    } else {
      toast.success("Relatório atualizado!");
      setEditingItem(null);
      fetchReports(teamOwnerId, profile?.admin_id || null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!teamOwnerId) return;
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir relatório.");
    } else {
      toast.success("Relatório excluído!");
      fetchReports(teamOwnerId, profile?.admin_id || null);
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: ReportItem["status"],
  ) => {
    if (!teamOwnerId) return;
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status.");
    } else {
      fetchReports(teamOwnerId, profile?.admin_id || null);
    }
  };

  const renderColumn = (columnTitle: string, status: ReportItem["status"]) => {
    const columnItems = items.filter((i) => i.status === status);

    const getStatusStyles = () => {
      switch (status) {
        case "Novo":
          return {
            color: "#0ea5e9",
            badgeBg: "bg-[#0ea5e9]/10",
            badgeText: "text-[#0ea5e9]",
            glow: "shadow-[#0ea5e9]/30",
            border: "border-[#0ea5e9]/30",
            dot: "bg-[#0ea5e9]",
          };
        case "Em Andamento":
          return {
            color: "#f59e0b",
            badgeBg: "bg-[#f59e0b]/10",
            badgeText: "text-[#f59e0b]",
            glow: "shadow-[#f59e0b]/30",
            border: "border-[#f59e0b]/30",
            dot: "bg-[#f59e0b]",
          };
        case "Finalizado":
          return {
            color: "#10b981",
            badgeBg: "bg-[#10b981]/10",
            badgeText: "text-[#10b981]",
            glow: "shadow-[#10b981]/30",
            border: "border-[#10b981]/30",
            dot: "bg-[#10b981]",
          };
      }
    };

    const styles = getStatusStyles();

    return (
      <div className="flex-shrink-0 w-[360px] bg-background/80 backdrop-blur-2xl rounded-[2rem] flex flex-col border border-border/50 shadow-2xl relative pb-2 max-h-[70vh] lg:max-h-[calc(100vh-360px)] min-h-[400px] overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-1 opacity-70"
          style={{ backgroundColor: styles.color }}
        />

        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "w-3 h-3 rounded-full shadow-lg",
                styles.dot,
                styles.glow,
              )}
            />
            <h3 className="font-extrabold text-sm tracking-wide text-foreground uppercase">
              {columnTitle}
            </h3>
            <span className="ml-1 bg-foreground/10 text-foreground/80 text-xs py-1 px-3 rounded-full font-bold">
              {columnItems.length}
            </span>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5 overflow-y-auto custom-scrollbar min-h-0">
          {columnItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group p-6 rounded-3xl transition-all duration-300 flex flex-col gap-4 relative overflow-hidden cursor-default",
                status === "Finalizado"
                  ? "bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                  : "bg-card border-border shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
              )}
            >
              <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start gap-4">
                <h4
                  className={cn(
                    "font-bold text-base leading-tight",
                    status === "Finalizado"
                      ? "text-emerald-400"
                      : "text-foreground group-hover:text-accent transition-colors",
                  )}
                >
                  {item.title}
                </h4>

                <div className="flex-shrink-0 flex items-center gap-2">
                  {status === "Finalizado" ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Check className="w-3 h-3" /> Finalizado
                    </span>
                  ) : (
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors rounded-xl bg-muted"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {item.description && (
                <div className="relative z-10 bg-muted/50 p-3 rounded-xl border border-border/50 mt-1">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  {item.assigneeAvatar ? (
                    <div className="relative">
                      <img
                        src={item.assigneeAvatar}
                        alt={item.assigneeName}
                        className="w-8 h-8 rounded-full border-2 border-background shadow-md object-cover"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-emerald-500"></div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center border-2 border-background shadow-md">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Responsável
                    </span>
                    <span className="text-sm font-medium text-foreground/90">
                      {item.assigneeName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex gap-2 justify-between mt-4 pt-4 border-t border-border/50">
                <div className="flex flex-1 gap-2">
                  {status === "Novo" && (
                    <button
                      onClick={() =>
                        handleStatusChange(item.id, "Em Andamento")
                      }
                      className="flex-1 py-2 px-3 rounded-xl bg-[#f59e0b]/10 hover:bg-[#f59e0b] hover:text-foreground text-[#f59e0b] transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold"
                      title="Prosseguir para Em Andamento"
                    >
                      Prosseguir <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {status === "Em Andamento" && (
                    <button
                      onClick={() => handleStatusChange(item.id, "Finalizado")}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#10b981]/10 hover:bg-[#10b981] hover:text-foreground text-[#10b981] transition-all duration-300 flex items-center justify-center gap-2 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[#10b981]/40"
                      title="Marcar como Finalizado"
                    >
                      <CheckCircle className="w-4 h-4" /> Finalizar
                    </button>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-foreground text-red-500 transition-all duration-300 flex items-center justify-center border border-red-500/10 hover:border-red-500"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {columnItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed border-border/50 rounded-3xl bg-foreground/5">
              <span className="text-muted-foreground text-sm font-medium">
                Nenhum relatório
                <br />
                neste status
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const chartData = [
    {
      name: "A Fazer",
      value: items.filter((i) => i.status === "Novo").length,
      color: "#0ea5e9",
    },
    {
      name: "Em Andamento",
      value: items.filter((i) => i.status === "Em Andamento").length,
      color: "#f59e0b",
    },
    {
      name: "Finalizado",
      value: items.filter((i) => i.status === "Finalizado").length,
      color: "#10b981",
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 flex flex-col animate-fade-in-up pb-8 overflow-y-auto w-full h-full lg:h-[calc(100vh-80px)] custom-scrollbar">
      <div className="flex-shrink-0 relative overflow-hidden bg-card p-6 lg:p-10 rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="relative z-10 text-center lg:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              Operação Ágil
            </span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-foreground mb-4 uppercase">
            Central de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-400">
              Relatórios
            </span>
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base max-w-xl leading-relaxed font-medium">
            Gerencie o progresso e a performance de cada entrega em um quadro
            tático de alta visibilidade.
          </p>
        </div>

        <div className="relative z-10 flex-shrink-0">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className="group relative bg-primary text-primary-foreground px-8 py-4 rounded-2xl flex items-center gap-3 font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30 uppercase tracking-[0.15em] text-[11px]">
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                <span>Novo Relatório</span>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 animate-fade-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-border z-50 animate-fade-in-up flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-border/50 bg-gradient-to-r from-transparent to-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                      <Plus className="w-4 h-4 text-accent" />
                    </div>
                    <Dialog.Title className="text-xl font-extrabold text-foreground">
                      Criar Relatório
                    </Dialog.Title>
                  </div>
                  <Dialog.Close asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors bg-foreground/5 p-2 rounded-full hover:bg-foreground/10 hover:rotate-90 duration-200">
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Título / Assunto
                    </label>
                    <input
                      name="title"
                      type="text"
                      placeholder="Ex: Relatório Mensal"
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-accent"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="Detalhes do que deve ser feito"
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-accent resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Nome do Responsável
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        name="assignee"
                        type="text"
                        placeholder="Ex: Responsável"
                        className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Uma foto de perfil será gerada baseada no nome usando o
                      e-mail/sistema.
                    </p>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl font-medium text-foreground/80 bg-background border border-border hover:bg-foreground/5 transition-colors"
                      >
                        Cancelar
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      className="bg-accent hover:bg-accent/80 text-foreground px-8 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-accent/20"
                    >
                      Criar e Prosseguir
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <Dialog.Root
          open={!!editingItem}
          onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 animate-fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-border z-50 animate-fade-in-up flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-border/50 bg-gradient-to-r from-transparent to-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f59e0b]/20 flex items-center justify-center border border-[#f59e0b]/30">
                    <Edit3 className="w-4 h-4 text-[#f59e0b]" />
                  </div>
                  <Dialog.Title className="text-xl font-extrabold text-foreground">
                    Editar Relatório
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors bg-foreground/5 p-2 rounded-full hover:bg-foreground/10 hover:rotate-90 duration-200">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
              <form onSubmit={handleEditSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Título / Assunto
                  </label>
                  <input
                    name="title"
                    type="text"
                    defaultValue={editingItem?.title}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingItem?.description}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-accent resize-y"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Nome do Responsável
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      name="assignee"
                      type="text"
                      defaultValue={
                        editingItem?.assigneeName !== "Não Atribuído"
                          ? editingItem?.assigneeName
                          : ""
                      }
                      className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl font-medium text-foreground/80 bg-background border border-border hover:bg-foreground/5 transition-colors"
                    >
                      Cancelar
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="bg-accent hover:bg-accent/80 text-foreground px-8 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-accent/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="hidden lg:flex w-full bg-card backdrop-blur-xl rounded-[2rem] border border-border/50 p-6 lg:p-8 items-center gap-8 relative shadow-xl overflow-hidden min-h-[160px]">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-emerald-400/5 pointer-events-none" />

        <div className="w-[180px] h-[120px] relative shrink-0 border-r border-border/50 pr-8">
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="transparent"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 right-8 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-foreground leading-none">
                  {items.length}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-1">
                  Total
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm text-center border-2 border-dashed border-border/50 rounded-full bg-foreground/5">
              Nenhum
              <br />
              relatório
            </div>
          )}
        </div>

        <div className="flex-1 flex gap-6 h-full items-center">
          {chartData.length > 0 ? (
            chartData.map((data, index) => (
              <div
                key={index}
                className="flex-1 bg-background p-5 rounded-3xl border border-border/50 flex flex-col justify-center relative shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                style={{ borderBottom: `3px solid ${data.color}` }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{ backgroundColor: data.color }}
                />
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div
                    className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] opacity-80"
                    style={{ backgroundColor: data.color, color: data.color }}
                  />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    {data.name}
                  </span>
                </div>
                <span className="text-4xl font-extrabold tracking-tight text-foreground relative z-10 ml-1 drop-shadow-md">
                  {data.value}
                </span>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground font-medium bg-card/50 rounded-3xl border border-border/50 h-full min-h-[120px]">
              Crie o primeiro relatório para visualizar as métricas detalhadas
              de status.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 pb-4 overflow-x-auto custom-scrollbar w-full min-h-0">
        {renderColumn("A Fazer (Novo)", "Novo")}
        {renderColumn("Em Andamento", "Em Andamento")}
        {renderColumn("Finalizados", "Finalizado")}
      </div>
    </div>
  );
}
