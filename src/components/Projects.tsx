import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  MoreVertical,
  Clock,
  MessageSquare,
  CheckCircle,
  X,
  User,
  Users,
  Search,
  Paperclip,
  Calendar as CalendarIcon,
  Edit3,
  Trash2,
  Archive,
  FileSpreadsheet,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListChecks,
  CheckSquare,
  AlertCircle,
  Info,
  FileText,
  Image as ImageIcon,
  Download,
  Pencil,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/utils";
import { toast } from "sonner";

type ProjectTask = {
  id: string;
  project_id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
  start_date?: string | null;
  description?: string | null;
  assigned_to?: string[];
  priority: "Normal" | "Média" | "Alta";
  created_at: string;
  attachments?: string[];
  cover_url?: string | null;
  checklist?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  comments_data?: {
    id: string;
    user: string;
    text: string;
    date: string;
    userId: string;
    avatar?: string;
  }[];
};

type Task = {
  id: string;
  title: string;
  project: string;
  status: "A fazer" | "Em Andamento" | "Revisão" | "Concluído";
  priority: "Baixa" | "Média" | "Alta";
  comments: number;
  comments_data?: {
    id: string;
    user: string;
    text: string;
    date: string;
    isMine: boolean;
    avatar?: string;
  }[];
  attachments?: string[];
  due_date?: string | null;
  assign_to?: string[];
  is_archived?: boolean;
  cover_url?: string;
  description?: string;
};

type Member = {
  id: string;
  full_name: string;
  avatar_url?: string;
};

const STAGES = ["A fazer", "Em Andamento", "Revisão", "Concluído"] as const;

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; icon?: any; color?: string }[];
  placeholder: string;
  label?: string;
  icon?: any;
}) {
  const selected = options.find((o) => o.value === value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
          {label}
        </label>
      )}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between group hover:border-primary/40">
            <div className="flex items-center gap-3">
              {selected?.icon ? (
                <selected.icon className={cn("w-4 h-4", selected.color)} />
              ) : Icon ? (
                <Icon className="w-4 h-4 text-muted-foreground" />
              ) : null}
              <span
                className={cn(
                  "text-sm font-medium",
                  !value && "text-muted-foreground/40",
                )}
              >
                {selected?.label || placeholder}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-[var(--radix-dropdown-menu-trigger-width)] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-2xl z-[60] animate-in fade-in zoom-in-95 duration-200"
            sideOffset={8}
          >
            {options.map((opt) => (
              <DropdownMenu.Item
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer outline-none transition-colors",
                  value === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/10 text-foreground",
                )}
              >
                {opt.icon && (
                  <opt.icon
                    className={cn(
                      "w-4 h-4",
                      value === opt.value
                        ? "text-primary-foreground"
                        : opt.color || "text-muted-foreground",
                    )}
                  />
                )}
                {opt.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
function ProjectTaskDetailModal({
  task,
  onClose,
  onUpdate,
  teamMembers,
  profile,
}: {
  task: ProjectTask | null;
  onClose: () => void;
  onUpdate: () => void;
  teamMembers: Member[];
  profile?: any;
}) {
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [task?.comments_data]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !task) return;

    const comment = {
      id: crypto.randomUUID(),
      user: profile?.full_name || "Membro",
      text: newComment,
      date: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      userId: profile?.id,
      avatar: profile?.avatar_url || "",
    };

    const updatedData = [...(task.comments_data || []), comment];
    const { error } = await supabase
      .from("project_tasks")
      .update({ comments_data: updatedData })
      .eq("id", task.id);

    if (error) {
      toast.error("Falha ao salvar comentário.");
    } else {
      setNewComment("");
      onUpdate();
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() || !task) return;

    const updatedData = (task.comments_data || []).map((msg: any) =>
      msg.id === commentId ? { ...msg, text: editingCommentText } : msg,
    );

    const { error } = await supabase
      .from("project_tasks")
      .update({ comments_data: updatedData })
      .eq("id", task.id);

    if (error) {
      toast.error("Falha ao editar comentário.");
    } else {
      setEditingCommentId(null);
      setEditingCommentText("");
      onUpdate();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;

    const updatedData = (task.comments_data || []).filter(
      (msg: any) => msg.id !== commentId,
    );

    const { error } = await supabase
      .from("project_tasks")
      .update({ comments_data: updatedData })
      .eq("id", task.id);

    if (error) {
      toast.error("Falha ao remover comentário.");
    } else {
      onUpdate();
    }
  };

  const handleUpdateChecklist = async (newChecklist: any[]) => {
    if (!task) return;
    const { error } = await supabase
      .from("project_tasks")
      .update({ checklist: newChecklist })
      .eq("id", task.id);

    if (error) {
      toast.error("Erro ao salvar checklist: " + error.message);
    } else {
      onUpdate();
    }
  };

  const handleAddChecklistItem = () => {
    const newList = [
      ...(task?.checklist || []),
      { id: crypto.randomUUID(), text: "", completed: false },
    ];
    handleUpdateChecklist(newList);
  };

  const handleToggleChecklistItem = (id: string) => {
    const newList = (task?.checklist || []).map((item: any) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    handleUpdateChecklist(newList);
  };

  const handleRemoveChecklistItem = (id: string) => {
    const newList = (task?.checklist || []).filter(
      (item: any) => item.id !== id,
    );
    handleUpdateChecklist(newList);
  };

  const handleEditChecklistItem = (id: string, text: string) => {
    const newList = (task?.checklist || []).map((item: any) =>
      item.id === id ? { ...item, text } : item,
    );
    handleUpdateChecklist(newList);
  };

  if (!task) return null;
  return (
    <Dialog.Root open={!!task} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/50 z-[120] animate-fade-in-up flex flex-col max-h-[85vh] transition-all overflow-hidden">
          <div className="p-6 border-b border-border/40 flex justify-between items-start">
            <div>
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-lg border",
                  task.priority === "Alta"
                    ? "bg-red-500/10 border-red-500/20 text-red-500"
                    : task.priority === "Média"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      : "bg-primary/10 border-primary/20 text-primary",
                )}
              >
                {task.priority === "Normal" ? "Baixa" : task.priority}
              </span>
              <Dialog.Title className="text-xl font-bold text-foreground mt-3">
                {task.title}
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors text-muted-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Status
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      task.completed ? "bg-primary" : "bg-amber-500",
                    )}
                  />
                  <span className="text-sm font-bold text-foreground">
                    {task.completed ? "Concluído" : "Pendente"}
                  </span>
                </div>
              </div>
              {task.due_date && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Prazo
                  </span>
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-sm font-bold">
                      {new Date(task.due_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border/20">
              <MemberSelect
                label="Responsáveis pela Tarefa"
                value={task.assigned_to || []}
                members={teamMembers}
                placeholder="Selecionar responsáveis..."
                onChange={async (newList) => {
                  const { error } = await supabase
                    .from("project_tasks")
                    .update({ assigned_to: newList })
                    .eq("id", task.id);
                  if (!error) {
                    toast.success("Responsáveis atualizados!");
                    onUpdate();
                  }
                }}
              />
            </div>

            <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold text-foreground">Checklist</h3>
                <button
                  onClick={handleAddChecklistItem}
                  className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center text-primary shadow-sm hover:bg-primary/5 transition-all bg-card active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>

              {task.checklist && task.checklist.length > 0 ? (
                <div className="space-y-2">
                  <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-primary transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          (task.checklist.filter((i: any) => i.completed)
                            .length /
                            task.checklist.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  {task.checklist.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 group/check"
                    >
                      <button
                        onClick={() => handleToggleChecklistItem(item.id)}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          item.completed
                            ? "bg-primary border-primary text-white"
                            : "border-border/60 hover:border-primary/50",
                        )}
                      >
                        {item.completed && <CheckSquare size={10} />}
                      </button>
                      <input
                        type="text"
                        value={item.text}
                        placeholder="Novo item..."
                        onChange={(e) =>
                          handleEditChecklistItem(item.id, e.target.value)
                        }
                        className={cn(
                          "flex-1 bg-transparent border-none py-1 text-xs focus:outline-none focus:ring-0 placeholder:text-muted-foreground/30 font-medium",
                          item.completed &&
                            "line-through text-muted-foreground/60",
                        )}
                      />
                      <button
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="opacity-0 group-hover/check:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={handleAddChecklistItem}
                  className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center py-4 border border-dashed border-border/40 rounded-2xl cursor-pointer hover:bg-muted/10 transition-all font-medium"
                >
                  Adicionar Checklist
                </div>
              )}
            </div>

            <div className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <FileText size={18} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                    Anotação
                  </h3>
                  <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                    Detalhes e observações da tarefa
                  </span>
                </div>
              </div>

              <textarea
                defaultValue={task.description || ""}
                placeholder="Adicione detalhes complementares..."
                className="w-full bg-background/50 border border-border/50 rounded-2xl p-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner leading-relaxed min-h-[120px]"
                onBlur={async (e) => {
                  const val = e.target.value;
                  if (val !== (task.description || "")) {
                    const { error } = await supabase
                      .from("project_tasks")
                      .update({ description: val })
                      .eq("id", task.id);
                    if (error) {
                      toast.error("Falha ao salvar anotação.");
                    } else {
                      onUpdate();
                      toast.success("Anotação atualizada!");
                    }
                  }
                }}
              />
            </div>

            <div className="space-y-6 pt-6 border-t border-border/20">
              <h3 className="text-sm font-black tracking-widest uppercase text-foreground/60 flex items-center gap-2">
                <MessageSquare size={14} className="text-primary" />
                Comentários
              </h3>

              <div className="flex bg-muted/10 border border-border/40 rounded-2xl p-2 gap-3 shadow-inner">
                <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={14} className="text-primary" />
                  )}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  placeholder="Escreva um comentário..."
                  className="flex-1 bg-transparent border-none py-2 px-1 text-sm focus:outline-none focus:ring-0 resize-none min-h-[36px] placeholder:text-muted-foreground/40 font-medium"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center active:scale-95 transition-all hover:bg-primary hover:text-white disabled:opacity-30 disabled:pointer-events-none self-end"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {!task.comments_data || task.comments_data.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest bg-muted/5 rounded-2xl border border-dashed border-border/40">
                    Nenhum comentário ainda
                  </div>
                ) : (
                  task.comments_data
                    .slice()
                    .reverse()
                    .map((msg: any) => (
                      <div key={msg.id} className="flex gap-4 group">
                        <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-background border border-border/50 flex items-center justify-center">
                          {msg.avatar ? (
                            <img
                              src={msg.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User
                              size={14}
                              className="text-muted-foreground/50"
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5 pt-0.5 rounded-2xl p-4 bg-muted/5 border border-border/40 group-hover:bg-muted/10 transition-all relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-black text-foreground">
                                {msg.user}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground/40">
                                {msg.date}
                              </span>
                            </div>

                            {msg.userId === profile?.id && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(msg.id);
                                    setEditingCommentText(msg.text);
                                  }}
                                  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(msg.id)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )}
                          </div>

                          {editingCommentId === msg.id ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) =>
                                  setEditingCommentText(e.target.value)
                                }
                                className="w-full bg-background border border-border/40 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[60px]"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-3 py-1 rounded-lg text-[10px] font-black uppercase text-muted-foreground hover:text-foreground"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleEditComment(msg.id)}
                                  className="px-4 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase shadow-lg shadow-primary/20"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border-t border-border/40 flex justify-end">
            <button
              onClick={async () => {
                const { error } = await supabase
                  .from("project_tasks")
                  .update({ completed: !task.completed })
                  .eq("id", task.id);
                if (!error) {
                  toast.success(
                    task.completed
                      ? "Marcado como pendente"
                      : "Marcado como concluído",
                  );
                  onUpdate();
                  onClose();
                }
              }}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg",
                task.completed
                  ? "bg-amber-500 text-white shadow-amber-500/20"
                  : "bg-primary text-white shadow-primary/20",
              )}
            >
              {task.completed ? <Clock size={14} /> : <CheckCircle size={14} />}
              {task.completed ? "Reabrir Tarefa" : "Concluir Tarefa"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MemberSelect({
  value,
  onChange,
  members,
  placeholder,
  label,
  multiple = true,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  members: Member[];
  placeholder: string;
  label?: string;
  multiple?: boolean;
}) {
  const toggleMember = (id: string) => {
    const currentId = String(id).trim().toLowerCase();
    const isSelected = value.some(
      (v) => String(v).trim().toLowerCase() === currentId,
    );

    if (isSelected) {
      onChange(
        value.filter((v) => String(v).trim().toLowerCase() !== currentId),
      );
    } else {
      if (multiple) {
        onChange([...value, id]);
      } else {
        onChange([id]);
      }
    }
  };

  const activeSelections = value.filter((id) => {
    const currentId = String(id).trim().toLowerCase();
    return members.some((m) => String(m.id).trim().toLowerCase() === currentId);
  });
  const selectedCount = activeSelections.length;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
          {label}
        </label>
      )}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between group hover:border-primary/40">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {selectedCount > 0 ? (
                  activeSelections.slice(0, 3).map((id) => {
                    const currentId = String(id).trim().toLowerCase();
                    const m = members.find(
                      (mem) =>
                        String(mem.id).trim().toLowerCase() === currentId,
                    );
                    return (
                      <div
                        key={id}
                        className="w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center border-2 border-card shadow-sm"
                      >
                        {m?.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={14} className="text-primary" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center border border-dashed border-border/50">
                    <User size={14} className="text-muted-foreground/30" />
                  </div>
                )}
                {selectedCount > 3 && (
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold border-2 border-card">
                    +{selectedCount - 3}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  selectedCount === 0 && "text-muted-foreground/40",
                )}
              >
                {selectedCount === 0
                  ? placeholder
                  : selectedCount === 1
                    ? members.find(
                        (m) =>
                          String(m.id).trim().toLowerCase() ===
                          String(activeSelections[0]).trim().toLowerCase(),
                      )?.full_name
                    : `${selectedCount} Responsáveis`}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-[var(--radix-dropdown-menu-trigger-width)] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-2xl z-[60] animate-in fade-in zoom-in-95 duration-200"
            sideOffset={8}
          >
            {members.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground italic">
                Nenhum membro encontrado
              </div>
            ) : (
              members.map((m) => {
                const currentMId = String(m.id).trim().toLowerCase();
                const isSelected = value.some(
                  (v) => String(v).trim().toLowerCase() === currentMId,
                );
                return (
                  <DropdownMenu.Item
                    key={m.id}
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => toggleMember(m.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer outline-none transition-colors mb-1 last:mb-0",
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-primary/10 text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-background/50 flex items-center justify-center border border-border/20 shadow-sm">
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      {m.full_name}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Plus size={10} className="text-white rotate-45" />
                      </div>
                    )}
                  </DropdownMenu.Item>
                );
              })
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

function TaskCard({
  task,
  onEdit,
  teamMembers,
  onUpdateCover,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  teamMembers: Member[];
  onUpdateCover?: (taskId: string, coverUrl: string) => void;
}) {
  const progressPercent = task.status === "Concluído" ? 100 : 0;
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingCover(true);

      const img = new Image();
      const objUrl = URL.createObjectURL(file);

      img.onload = async () => {
        URL.revokeObjectURL(objUrl);
        const canvas = document.createElement("canvas");
        const MAX_DIM = 800; // Reduz tamanho máximo para garantir compactação violenta
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) {
            h *= MAX_DIM / w;
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w *= MAX_DIM / h;
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, w, h);

        // Compactação extrema em webp para não estourar payload do Supabase (1MB) e salvar direto na tabela
        const compressedBase64 = canvas.toDataURL("image/webp", 0.6);

        // Armazena no array de attachments que já existe no banco de dados para driblar a ausência da coluna
        let newAtts = [...(task.attachments || [])];
        if (
          newAtts.length > 0 &&
          newAtts[0] &&
          newAtts[0].startsWith("data:image")
        ) {
          newAtts[0] = compressedBase64;
        } else {
          newAtts.unshift(compressedBase64);
        }

        try {
          const { error } = await supabase
            .from("tasks")
            .update({ attachments: newAtts })
            .eq("id", task.id);

          if (!error) {
            toast.success("Capa atualizada com sucesso!");
            if (onUpdateCover) onUpdateCover(task.id, compressedBase64);
          } else {
            toast.error("Erro no Banco: " + error.message);
          }
        } catch (err: any) {
          toast.error("Erro de conexão: " + err.message);
        } finally {
          setIsUploadingCover(false);
        }
      };

      img.onerror = () => {
        toast.error("Formato de imagem inválido");
        setIsUploadingCover(false);
      };

      img.src = objUrl;
    }
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className={cn(
        "bg-card border border-border/50 rounded-[2.5rem] cursor-pointer transition-all hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.1)] group relative overflow-hidden flex flex-col w-full hover:-translate-y-1.5 shadow-lg active:scale-[0.98]",
      )}
    >
      <div className="h-44 w-full relative bg-muted/20 overflow-hidden group/cover">
        {task.cover_url || (task.attachments && task.attachments.length > 0) ? (
          <img
            src={task.cover_url || task.attachments?.[0]}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 blur-[0px] group-hover:blur-[1px]"
            alt=""
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black group-hover:scale-110 transition-transform duration-500">
            <span className="text-primary font-black text-3xl tracking-tighter opacity-15 uppercase">
              Netuno
            </span>
            <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />

        <div
          className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-all bg-black/40 backdrop-blur-sm cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="bg-primary/90 hover:bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
            {isUploadingCover ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon size={16} />
            )}
            {isUploadingCover ? "Enviando..." : "Alterar Capa"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={isUploadingCover}
            />
          </label>
        </div>

        <div
          className={cn(
            "absolute top-4 right-5 px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all active:scale-95 z-30",
            task.status === "Concluído"
              ? "bg-emerald-500/90 text-white border-emerald-400/50"
              : task.status === "Revisão"
                ? "bg-amber-500/90 text-white border-amber-400/50"
                : task.status === "Em Andamento"
                  ? "bg-sky-500/90 text-white border-sky-400/50"
                  : "bg-slate-500/90 text-white border-slate-400/50",
          )}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-shadow-sm">
            {task.status}
          </span>
        </div>
      </div>

      <div className="p-8 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.25rem] bg-muted/30 border border-border/50 flex items-center justify-center shadow-inner overflow-hidden shrink-0 transition-all group-hover:border-primary/50 group-hover:shadow-primary/10">
            <div className="bg-primary/10 w-full h-full flex items-center justify-center">
              <Building2 className="text-primary w-7 h-7" />
            </div>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h4 className="font-black text-[12px] text-muted-foreground uppercase tracking-widest truncate">
              {task.project}
            </h4>
            <h3 className="text-xl font-black text-foreground leading-tight group-hover:text-primary transition-colors truncate">
              {task.title}
            </h3>
          </div>

          {task.assign_to && task.assign_to.length > 0 && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex -space-x-4">
                {task.assign_to.slice(0, 3).map((userId) => {
                  const m = teamMembers.find(
                    (mem) =>
                      String(mem.id).trim().toLowerCase() ===
                      String(userId).trim().toLowerCase(),
                  );
                  if (!m) return null;
                  return (
                    <div
                      key={userId}
                      className="w-10 h-10 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden shadow-lg transition-transform hover:translate-y-[-2px]"
                      title={m.full_name}
                    >
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={14} className="text-primary" />
                      )}
                    </div>
                  );
                })}
                {task.assign_to.length > 3 && (
                  <div className="w-10 h-10 rounded-full border-4 border-card bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black shadow-lg">
                    +{task.assign_to.length - 3}
                  </div>
                )}
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground opacity-60">
                Responsáveis
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground bg-muted/10 p-3 rounded-2xl border border-border/40">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span className="opacity-70">Início: 04 Abr, 2025</span>
            </div>
            <div className="bg-foreground/5 w-[1px] h-4" />
            <div className="flex items-center gap-2 text-blue-500">
              <Clock className="w-4 h-4" />
              <span>
                Fim:{" "}
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "--/--"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                Status de Entrega
              </span>
              <span className="text-[11px] font-black text-primary">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden p-[2px] border border-border/30">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTaskModal({
  onAddTask,
  teamMembers,
}: {
  onAddTask: (t: Task) => void;
  teamMembers: Member[];
}) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ name: string; type: string }[]>([
    { name: "Otimização SEO", type: "WEB" },
    { name: "Integração com APIs", type: "WEB" },
  ]);
  const [newService, setNewService] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("Média");
  const [selectedResponsible, setSelectedResponsible] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      supabase
        .from("customers")
        .select("id, name")
        .order("name")
        .then(({ data }) => {
          if (data) setClients(data);
        });
    }
  }, [open]);

  const handleAddService = () => {
    if (newService.trim()) {
      setServices([{ name: newService, type: "PERSONALIZADO" }, ...services]);
      setSelectedServices([...selectedServices, newService]);
      setNewService("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const due_date = (form.elements.namedItem("due_date") as HTMLInputElement)
      .value;

    const cover_url = (form.elements.namedItem("cover_url") as HTMLInputElement)
      ?.value;

    onAddTask({
      id: crypto.randomUUID(),
      title: title || "Nova Tarefa",
      project: selectedClient || "Geral",
      status: "A fazer",
      priority: selectedPriority as any,
      comments: 0,
      due_date: due_date || null,
      assign_to: selectedResponsible,
      is_archived: false,
      cover_url: cover_url || "",
    });
    setOpen(false);
    setSelectedClient("");
    setSelectedPriority("Média");
    setSelectedResponsible([]);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-primary text-primary-foreground hover:opacity-90 px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Novo Projeto
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-card rounded-3xl shadow-2xl border border-border/50 z-50 animate-fade-in-up flex flex-col max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-border/40 shrink-0">
            <Dialog.Title className="text-2xl font-black text-foreground uppercase tracking-tighter">
              Novo Projeto
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors bg-foreground/5 p-2 rounded-xl hover:bg-foreground/10">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form
              id="new-task-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Título do Projeto
                </label>
                <input
                  name="title"
                  type="text"
                  placeholder="Ex: Landing Page Nova"
                  className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 shadow-inner"
                  required
                />
              </div>

              <CustomSelect
                label="Cliente (opcional)"
                value={selectedClient}
                onChange={setSelectedClient}
                icon={User}
                placeholder="Selecione um cliente..."
                options={clients.map((c) => ({ label: c.name, value: c.name }))}
              />

              <MemberSelect
                label="Responsável da Equipe"
                value={selectedResponsible}
                onChange={setSelectedResponsible}
                members={teamMembers}
                placeholder="Selecione o responsável..."
                multiple={false}
              />

              <div className="grid grid-cols-2 gap-4">
                <CustomSelect
                  label="Prioridade"
                  value={selectedPriority}
                  onChange={setSelectedPriority}
                  placeholder="Prioridade"
                  options={[
                    {
                      label: "Baixa",
                      value: "Normal",
                      color: "text-emerald-500",
                    },
                    { label: "Média", value: "Média", color: "text-amber-500" },
                    { label: "Alta", value: "Alta", color: "text-red-500" },
                  ]}
                />
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                    Prazo
                  </label>
                  <input
                    name="due_date"
                    type="date"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark] shadow-inner"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 flex justify-end gap-3 bg-card/50 backdrop-blur-xl">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button
              form="new-task-form"
              type="submit"
              className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Criar Projeto
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TaskGroup({
  title,
  count,
  color,
  children,
  defaultOpen = false,
}: {
  title: string;
  count: number;
  color: "blue" | "red" | "emerald";
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group",
          color === "blue"
            ? "bg-blue-500/5 border-blue-500/20 text-blue-500 hover:border-blue-500/40"
            : color === "red"
              ? "bg-red-500/5 border-red-500/20 text-red-500 hover:border-red-500/40"
              : "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:border-emerald-500/40",
        )}
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={cn(
              "w-5 h-5 transition-transform duration-300",
              !isOpen && "-rotate-90",
            )}
          />
          <span className="font-black text-xs uppercase tracking-widest">
            {title}
          </span>
          <span className="bg-foreground/5 px-2 py-0.5 rounded-lg text-[10px] font-black border border-border/50">
            {count}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="space-y-3 pl-1 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

function EditTaskModal({
  task,
  onClose,
  onSave,
  onDelete,
  onArchive,
  onSaveAttachments,
  profile,
  teamMembers,
  onNavigateToTask,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (t: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, isArchived: boolean) => void;
  onSaveAttachments?: (taskId: string, newAttachments: string[]) => void;
  profile?: any;
  teamMembers: Member[];
  onNavigateToTask?: (taskId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "tasks">(
    "details",
  );
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [expandedPriorities, setExpandedPriorities] = useState<string[]>([]);
  const [selectedProjectTask, setSelectedProjectTask] =
    useState<ProjectTask | null>(null);
  const [editedStatus, setEditedStatus] = useState(task?.status || "Backlog");
  const [editedPriority, setEditedPriority] = useState(
    task?.priority || "Média",
  );
  const [editedAssignTo, setEditedAssignTo] = useState<string[]>(
    task?.assign_to || [],
  );
  const [editedDescription, setEditedDescription] = useState(
    task?.description || "",
  );
  const descriptionDirtyRef = React.useRef(false);

  useEffect(() => {
    if (task) {
      setEditedStatus(task.status);
      setEditedPriority(task.priority);
      setEditedAssignTo(task.assign_to || []);
      setEditedDescription(task.description || "");
      descriptionDirtyRef.current = false;
      if (activeTab === "tasks") {
        fetchProjectTasks();
      }
    }
  }, [task, activeTab]);

  const saveDescription = async () => {
    if (!task || !descriptionDirtyRef.current) return;
    descriptionDirtyRef.current = false;
    const { error } = await supabase
      .from("tasks")
      .update({ description: editedDescription })
      .eq("id", task.id);
    if (error) {
      toast.error("Erro banco: " + error.message);
    } else {
      onSave({ ...task, description: editedDescription });
      toast.success("Anotação salva!");
    }
  };

  const handleClose = () => {
    saveDescription();
    onClose();
  };

  const fetchProjectTasks = async () => {
    if (!task) return;
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", task.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjectTasks(data);
      if (selectedProjectTask) {
        const updatedTask = data.find(
          (t: any) => t.id === selectedProjectTask.id,
        );
        if (updatedTask) {
          setSelectedProjectTask(updatedTask);
        }
      }
    }
    setLoadingTasks(false);
  };

  if (!task) return null;

  return (
    <Dialog.Root open={!!task} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 z-50 animate-fade-in-up flex flex-col max-h-[90vh] transition-all duration-500">
          <div className="flex flex-col p-6 pb-4 shrink-0 border-b border-border/50 relative gap-4">
            <div className="flex justify-between items-start">
              <Dialog.Title className="text-xl font-bold text-foreground pr-8">
                {task.title}
              </Dialog.Title>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-foreground/5 absolute top-5 right-5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex bg-muted/30 p-1.5 rounded-2xl mx-1 max-w-[420px] shadow-inner border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                  activeTab === "details"
                    ? "text-primary bg-card border border-primary/20 shadow-lg"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5",
                )}
              >
                Detalhes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                  activeTab === "notes"
                    ? "text-primary bg-card border border-primary/20 shadow-lg"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5",
                )}
              >
                Anotação
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                  activeTab === "tasks"
                    ? "text-primary bg-card border border-primary/20 shadow-lg"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5",
                )}
              >
                Tarefas
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-background/30 rounded-b-2xl">
            {activeTab === "details" ? (
              <div className="p-6">
                <form
                  id="edit-task-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    onSave({
                      ...task,
                      title:
                        (form.elements.namedItem("title") as HTMLInputElement)
                          ?.value || task.title,
                      cover_url:
                        (
                          form.elements.namedItem(
                            "cover_url",
                          ) as HTMLInputElement
                        )?.value || task.cover_url,
                      status: editedStatus as any,
                      priority: editedPriority as any,
                      assign_to: editedAssignTo,
                      due_date:
                        (
                          form.elements.namedItem(
                            "due_date",
                          ) as HTMLInputElement
                        )?.value || task.due_date,
                    });
                  }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nome do Projeto
                    </label>
                    <input
                      name="title"
                      defaultValue={task.title}
                      className="w-full bg-card border border-border/50 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <CustomSelect
                      label="Status"
                      value={editedStatus}
                      onChange={(v) => setEditedStatus(v as any)}
                      placeholder="Status"
                      options={STAGES.map((s) => ({
                        label: s,
                        value: s,
                        color:
                          s === "Concluído"
                            ? "text-emerald-500"
                            : s === "Revisão"
                              ? "text-amber-500"
                              : s === "Em Andamento"
                                ? "text-sky-500"
                                : "text-slate-400",
                      }))}
                    />
                    <CustomSelect
                      label="Prioridade"
                      value={editedPriority}
                      onChange={(v) => setEditedPriority(v as any)}
                      placeholder="Prioridade"
                      options={[
                        {
                          label: "Baixa",
                          value: "Normal",
                          color: "text-emerald-500",
                        },
                        {
                          label: "Média",
                          value: "Média",
                          color: "text-amber-500",
                        },
                        { label: "Alta", value: "Alta", color: "text-red-500" },
                      ]}
                    />
                  </div>
                  <MemberSelect
                    label="Responsável da Equipe"
                    value={editedAssignTo}
                    onChange={setEditedAssignTo}
                    members={teamMembers}
                    placeholder="Selecione o responsável..."
                    multiple={false}
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Prazo Final
                    </label>
                    <input
                      name="due_date"
                      type="date"
                      defaultValue={task.due_date || ""}
                      className="w-full bg-card border border-border/50 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark] shadow-inner"
                    />
                  </div>
                </form>
              </div>
            ) : activeTab === "notes" ? (
              <div className="p-6 flex flex-col gap-6 h-full min-h-[400px]">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <FileText size={20} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                        Notas do Projeto
                      </h3>
                      <span className="text-[10px] text-muted-foreground/60 font-bold">
                        Registre informações importantes e observações aqui
                      </span>
                    </div>
                  </div>

                  <textarea
                    value={editedDescription}
                    onChange={(e) => {
                      setEditedDescription(e.target.value);
                      descriptionDirtyRef.current = true;
                    }}
                    placeholder="Adicione suas anotações aqui..."
                    className="flex-1 w-full bg-background/50 border border-border/50 rounded-[1.5rem] p-6 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner leading-relaxed min-h-[300px]"
                    onBlur={saveDescription}
                  />

                  <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl border border-primary/10">
                    <Info size={14} className="text-primary opacity-60" />
                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">
                      Salva automaticamente ao clicar fora ou fechar.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 h-full min-h-[400px] flex flex-col">
                <div className="bg-background/20 rounded-2xl border border-border/50 p-4 mb-4 flex justify-between items-center group">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    Lista de Tarefas do Projeto
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-lg border border-primary/20">
                      {projectTasks.length} TAREFAS
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-6">
                  {loadingTasks ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : projectTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 py-10 gap-4">
                      <ListChecks
                        size={48}
                        className="opacity-20 translate-y-2"
                      />
                      <span className="text-xs font-black uppercase tracking-widest">
                        Nenhuma tarefa encontrada neste projeto
                      </span>
                    </div>
                  ) : (
                    ["Alta", "Média", "Normal"].map((prio) => {
                      const filtered = projectTasks.filter(
                        (t) => t.priority === prio,
                      );
                      if (filtered.length === 0) return null;

                      const isExpanded = expandedPriorities.includes(prio);
                      const colorClasses =
                        prio === "Alta"
                          ? "border-red-500/20 text-red-500 bg-red-500/10 shadow-red-500/10"
                          : prio === "Média"
                            ? "border-amber-500/20 text-amber-500 bg-amber-500/10 shadow-amber-500/10"
                            : "border-emerald-500/20 text-emerald-500 bg-emerald-500/10 shadow-emerald-500/10";

                      return (
                        <div key={prio} className="space-y-3">
                          <button
                            onClick={() => {
                              setExpandedPriorities((prev) =>
                                isExpanded
                                  ? prev.filter((p) => p !== prio)
                                  : [...prev, prio],
                              );
                            }}
                            className={cn(
                              "w-full px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between transition-all active:scale-[0.98] hover:bg-white/5",
                              colorClasses,
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <ChevronDown
                                size={14}
                                className={cn(
                                  "transition-transform duration-300",
                                  !isExpanded && "-rotate-90 opacity-40",
                                )}
                              />
                              <span>{prio === "Normal" ? "Baixa" : prio}</span>
                            </div>
                            <span className="opacity-60">
                              {filtered.length}{" "}
                              {filtered.length === 1 ? "TAREFA" : "TAREFAS"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                              {filtered.map((t) => (
                                <div
                                  key={t.id}
                                  onClick={() => {
                                    if (onNavigateToTask) {
                                      onNavigateToTask(t.id);
                                    } else {
                                      setSelectedProjectTask(t);
                                    }
                                  }}
                                  className="bg-card/40 border border-border/40 p-3.5 rounded-xl flex items-center justify-between hover:bg-card/60 transition-all group backdrop-blur-md cursor-pointer border-l-4 border-l-primary/30"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        supabase
                                          .from("project_tasks")
                                          .update({ completed: !t.completed })
                                          .eq("id", t.id)
                                          .then(() => fetchProjectTasks());
                                      }}
                                      className={cn(
                                        "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                                        t.completed
                                          ? "bg-emerald-500 border-emerald-500 text-white"
                                          : "border-border/60 hover:border-primary",
                                      )}
                                    >
                                      {t.completed && <CheckCircle size={12} />}
                                    </div>
                                    <span
                                      className={cn(
                                        "text-xs font-bold",
                                        t.completed
                                          ? "line-through text-muted-foreground/60"
                                          : "text-foreground",
                                      )}
                                    >
                                      {t.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {t.due_date && (
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                        <Clock size={12} />
                                        {new Date(
                                          t.due_date,
                                        ).toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "short",
                                        })}
                                      </div>
                                    )}
                                    <ChevronRight
                                      size={14}
                                      className="text-muted-foreground/40"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <ProjectTaskDetailModal
                  task={selectedProjectTask}
                  onClose={() => setSelectedProjectTask(null)}
                  onUpdate={fetchProjectTasks}
                  teamMembers={teamMembers}
                  profile={profile}
                />
              </div>
            )}
          </div>

          {activeTab === "details" && (
            <div className="p-4 border-t border-border/50 flex justify-between items-center bg-card rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDelete(task.id);
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onArchive(task.id, !task.is_archived);
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-bold text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all flex items-center gap-2"
                >
                  <Archive size={16} />{" "}
                  {task.is_archived ? "Desarquivar" : "Arquivar"}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted/10 rounded-xl"
                >
                  Cancelar
                </button>
                {task.status === "Concluído" ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSave({ ...task, status: "A fazer" });
                      onClose();
                    }}
                    className="px-6 py-2.5 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <ListChecks size={16} /> Reativar Projeto
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSave({ ...task, status: "Concluído" });
                      onClose();
                    }}
                    className="px-6 py-2.5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Concluir Projeto
                  </button>
                )}
                <button
                  form="edit-task-form"
                  type="submit"
                  className="px-8 py-2.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  Salvar Projeto
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Projects({
  profile,
  onNavigateToTask,
  initialSearchTerm,
  onSearchCleared,
}: {
  profile?: any;
  onNavigateToTask?: (taskId: string) => void;
  initialSearchTerm?: string;
  onSearchCleared?: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null);
  const lastUpdateTimestamp = React.useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);

  const filteredTasks = tasks.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesText =
      t.title.toLowerCase().includes(q) || t.project.toLowerCase().includes(q);

    let matchesAssignee = false;
    if (Array.isArray(t.assign_to)) {
      matchesAssignee = t.assign_to.some((uid: string) => {
        const member = teamMembers.find((m) => m.id === uid);
        return member?.full_name?.toLowerCase().includes(q);
      });
    }

    return (
      (matchesText || matchesAssignee) &&
      (showArchived ? t.is_archived : !t.is_archived)
    );
  });

  const fetchTasks = async (ownerId: string) => {
    let query = supabase.from("tasks").select("*");

    if (profile?.admin_id) {
      query = query.eq("user_id", profile.admin_id);
    } else {
      query = query.or(`user_id.eq.${ownerId},created_by.eq.${ownerId}`);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) toast.error("Erro ao carregar projetos.");
    else if (data) {
      const normalized = data.map((t: any) => {
        let respArr: string[] = [];
        const raw = t.assign_to || t.assigned_to;
        if (Array.isArray(raw)) respArr = raw;
        else if (raw) respArr = [String(raw)];

        return {
          ...t,
          assign_to: respArr.filter((id) => id && id.length > 5),
        };
      });
      setTasks(normalized);
    }
  };

  const fetchTeamMembers = async (ownerId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .or(`id.eq.${ownerId},admin_id.eq.${ownerId}`)
      .eq("is_active", true);
    if (!error && data) {
      setTeamMembers(
        data.map((m) => ({
          id: m.id,
          full_name: m.full_name || "Membro",
          avatar_url: m.avatar_url,
        })),
      );
    }
  };

  const resolveTeamAndFetch = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserAuth(user);

      let ownerId = profile?.id || user.id;
      if (profile?.admin_id) {
        ownerId = profile.admin_id;
      }
      setTeamOwnerId(ownerId);
      await Promise.all([fetchTasks(ownerId), fetchTeamMembers(ownerId)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      resolveTeamAndFetch();
    }
  }, [profile?.id, profile?.admin_id]);

  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      // Opcional: limpar o termo no pai para não reaplicar se o usuário sair e voltar à aba
      onSearchCleared?.();
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    if (!teamOwnerId) return;

    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${teamOwnerId}`,
        },
        () => {
          // Proteção contra replica lag: se EU acabei de salvar, ignoro o primeiro evento de realtime
          // pois o banco de dados pode retornar dados antigos (lag de réplica)
          const now = Date.now();
          if (now - lastUpdateTimestamp.current > 5000) {
            setTimeout(() => {
              fetchTeamMembers(teamOwnerId);
              fetchTasks(teamOwnerId);
            }, 1000);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamOwnerId]);

  const handleCreateTask = async (newT: Task) => {
    const ownerId = teamOwnerId || profile?.id;
    if (!ownerId) return;
    // Remove "id", "cover_url" e "comments" que não existem como colunas (ou são geradas automaticamente) na tabela "tasks"
    const { id, cover_url, comments, ...taskWithoutId } = newT as any;
    const dbTask = {
      ...taskWithoutId,
      user_id: ownerId,
      created_by: profile?.id,
      assign_to:
        Array.isArray(newT.assign_to) && newT.assign_to.length > 0
          ? newT.assign_to[0]
          : typeof newT.assign_to === "string"
            ? newT.assign_to
            : null,
    };
    setTasks([newT, ...tasks]);
    const { data, error } = await supabase
      .from("tasks")
      .insert(dbTask)
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar projeto: " + error.message);
      setTasks((prev) => prev.filter((t) => t.id !== newT.id));
    } else if (data) {
      toast.success("Projeto criado!");
      const normalized = {
        ...data,
        assign_to: Array.isArray(data.assign_to)
          ? data.assign_to
          : data.assign_to
            ? [data.assign_to]
            : [],
      };
      setTasks((prev) => prev.map((t) => (t.id === newT.id ? normalized : t)));

      supabase
        .from("sys_notifications")
        .insert({
          title: "Novo Projeto",
          message: `${profile?.full_name || "Alguém"} acabou de criar o projeto: "${newT.title}"`,
          type: "project",
        })
        .then();
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const previousTasks = [...tasks];
    lastUpdateTimestamp.current = Date.now();
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);
    const dbValue =
      Array.isArray(updatedTask.assign_to) && updatedTask.assign_to.length > 0
        ? updatedTask.assign_to[0]
        : typeof updatedTask.assign_to === "string"
          ? updatedTask.assign_to
          : null;

    // Tenta atualizar a coluna principal (assign_to)
    const { data: updateResult, error } = await supabase
      .from("tasks")
      .update({
        title: updatedTask.title,
        project: updatedTask.project,
        status: updatedTask.status,
        priority: updatedTask.priority,
        due_date: updatedTask.due_date,
        assign_to: dbValue,
        description: updatedTask.description,
      })
      .eq("id", updatedTask.id)
      .select();

    if (error) {
      toast.error("Erro ao atualizar projeto: " + error.message);
      setTasks(previousTasks);
    } else {
      const savedRow = updateResult?.[0];
      if (savedRow) {
        const keys = Object.keys(savedRow).join(", ");
        console.log("Colunas encontradas:", keys);
        // Se assign_to não persistiu, talvez a coluna seja outra?
        if (savedRow.assign_to !== dbValue) {
          toast.warning(
            "Atenção: O responsável não foi gravado na coluna 'assign_to'.",
          );
        } else {
          toast.success("Projeto atualizado com sucesso!");
        }
      }

      if (teamOwnerId) {
        setTimeout(() => {
          fetchTeamMembers(teamOwnerId);
          fetchTasks(teamOwnerId);
        }, 800);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const previous = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir projeto: " + error.message);
      setTasks(previous);
    } else toast.success("Projeto excluído!");
  };

  const handleArchive = async (id: string, is_archived: boolean) => {
    const previousTasks = [...tasks];
    setTasks(tasks.map((t) => (t.id === id ? { ...t, is_archived } : t)));
    setEditingTask(null);
    const { error } = await supabase
      .from("tasks")
      .update({ is_archived })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar projeto: " + error.message);
      setTasks(previousTasks);
    } else {
      toast.success(is_archived ? "Projeto arquivado!" : "Projeto restaurado!");
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
            Gestão de Projetos
          </h1>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">
            Visualize o progresso e gerencie as demandas da equipe
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-2xl border border-border/40 shadow-inner">
            <button
              onClick={() => setShowArchived(false)}
              className={cn(
                "px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                !showArchived
                  ? "text-primary bg-card border border-primary/20 shadow-sm"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5",
              )}
            >
              Ativos
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={cn(
                "px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2",
                showArchived
                  ? "text-amber-500 bg-card border border-amber-500/20 shadow-sm"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5",
              )}
            >
              <Archive size={12} className="sm:w-3.5 sm:h-3.5" /> Arquivados
            </button>
          </div>
          <div className="relative group flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border/50 rounded-2xl py-2.5 sm:py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/40 shadow-xl"
            />
          </div>
          <NewTaskModal
            onAddTask={handleCreateTask}
            teamMembers={teamMembers}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20"></div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">
              Carregando
            </p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                teamMembers={teamMembers}
                onUpdateCover={(taskId, newCoverUrl) => {
                  setTasks((prev) =>
                    prev.map((t) => {
                      if (t.id === taskId) {
                        const atts = [...(t.attachments || [])];
                        if (
                          atts.length > 0 &&
                          atts[0] &&
                          atts[0].startsWith("data:image")
                        ) {
                          atts[0] = newCoverUrl;
                        } else {
                          atts.unshift(newCoverUrl);
                        }
                        return { ...t, attachments: atts };
                      }
                      return t;
                    }),
                  );
                  if (editingTask && editingTask.id === taskId) {
                    const atts = [...(editingTask.attachments || [])];
                    if (
                      atts.length > 0 &&
                      atts[0] &&
                      atts[0].startsWith("data:image")
                    ) {
                      atts[0] = newCoverUrl;
                    } else {
                      atts.unshift(newCoverUrl);
                    }
                    setEditingTask({ ...editingTask, attachments: atts });
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-card/50 rounded-[3rem] border border-dashed border-border/50">
            <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6 border border-border/50">
              <Briefcase size={32} className="text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground">
              Nenhum projeto
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm font-medium">
              {searchTerm
                ? "Tente buscar com outros termos."
                : "Comece criando o primeiro projeto!"}
            </p>
          </div>
        )}
      </div>

      <EditTaskModal
        task={editingTask}
        profile={profile}
        teamMembers={teamMembers}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onNavigateToTask={onNavigateToTask}
        onSaveAttachments={(taskId, newAttachments) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, attachments: newAttachments } : t,
            ),
          );
          if (editingTask && editingTask.id === taskId) {
            setEditingTask({ ...editingTask, attachments: newAttachments });
          }
        }}
      />
    </div>
  );
}
