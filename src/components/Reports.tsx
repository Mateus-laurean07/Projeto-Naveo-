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
    if (!teamOwnerId) {
      toast.error("Erro: Equipe não identificada. Recarregue a página.");
      return;
    }

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
        console.error("Erro ao criar:", error);
        toast.error("Erro ao criar relatório: " + error.message);
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
            color: "#1a7efb",
            badgeBg: "bg-[#1a7efb]/10",
            badgeText: "text-[#1a7efb]",
            glow: "shadow-[#1a7efb]/30",
            border: "border-[#1a7efb]/30",
            dot: "bg-[#1a7efb]",
          };
      }
    };

    const styles = getStatusStyles();

    return (
      <div className="flex-shrink-0 w-full sm:w-[320px] lg:w-[360px] bg-background/80 backdrop-blur-2xl rounded-[2rem] flex flex-col border border-border/50 shadow-2xl relative pb-2 max-h-[70vh] lg:max-h-[calc(100vh-360px)] min-h-[400px] overflow-hidden">
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
                "group p-6 rounded-[2rem] transition-all duration-300 flex flex-col gap-4 relative overflow-hidden cursor-default",
                status === "Finalizado"
                  ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5"
                  : "bg-card border-border shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
              )}
            >
              <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start gap-4">
                <h4
                  className={cn(
                    "font-extrabold text-base leading-tight uppercase tracking-tighter",
                    status === "Finalizado"
                      ? "text-primary"
                      : "text-foreground group-hover:text-primary transition-colors",
                  )}
                >
                  {item.title}
                </h4>

                <div className="flex-shrink-0 flex items-center gap-2">
                  {status === "Finalizado" ? (
                    <span className="text-[10px] uppercase font-black tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-primary/20">
                      <Check className="w-3.5 h-3.5 shadow-sm" /> Missão
                      Cumprida
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
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-primary"></div>
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
                    <>
                      <button
                        onClick={() => handleStatusChange(item.id, "Novo")}
                        className="flex-[0.5] py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-all duration-300 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                        title="Voltar para Novo"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(item.id, "Finalizado")
                        }
                        className="flex-1 py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition-all duration-300 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/5 hover:shadow-primary/30"
                        title="Marcar como Finalizado"
                      >
                        <CheckCircle className="w-4 h-4" /> Finalizar
                      </button>
                    </>
                  )}
                  {status === "Finalizado" && (
                    <button
                      onClick={() =>
                        handleStatusChange(item.id, "Em Andamento")
                      }
                      className="flex-1 py-2 px-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground transition-all duration-300 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                      title="Voltar para Em Andamento"
                    >
                      Voltar para Andamento
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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 flex flex-col animate-fade-in-up pb-8 overflow-y-auto w-full h-full lg:h-[calc(100vh-80px)] custom-scrollbar">
      <div className="flex-shrink-0 relative overflow-hidden bg-card p-4 sm:p-6 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col gap-6 sm:gap-8">
        <div className="absolute pointer-events-none top-0 right-0 w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute pointer-events-none bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
              Relatórios{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Netuno
              </span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-2">
              Análise detalhada e acompanhamento de metas em tempo real
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:scale-105 active:scale-95 rounded-xl transition-all shadow-xl shadow-primary/20 w-fit"
          >
            <Plus className="w-4 h-4" /> Novo Relatório
          </button>
        </div>

        <Dialog.Root open={open} onOpenChange={setOpen}>
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

      <div className="flex-1 flex gap-6 pb-4 overflow-x-auto custom-scrollbar w-full h-[600px] lg:h-[calc(100vh-380px)] min-h-0">
        {renderColumn("A Fazer (Novo)", "Novo")}
        {renderColumn("Em Andamento", "Em Andamento")}
        {renderColumn("Finalizados", "Finalizado")}
      </div>
    </div>
  );
}
