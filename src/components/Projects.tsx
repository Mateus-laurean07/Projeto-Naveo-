import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/utils";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  project: string;
  status: "Backlog" | "Em Andamento" | "Revisão" | "Concluído";
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
};

const STAGES = ["Backlog", "Em Andamento", "Revisão", "Concluído"] as const;

function TaskCard({
  task,
  onEdit,
  onArchive,
  onDelete,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = isDragging
    ? {
        opacity: 0.4,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(task)}
      className={cn(
        "bg-background border p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:shadow-lg group relative overflow-hidden",
        isDragging
          ? "opacity-50 border-accent shadow-xl scale-[1.02]"
          : "border-border/60 hover:border-accent/50 hover:-translate-y-1",
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-foreground/5 text-foreground/80">
            {task.project}
          </span>
          <span
            className={cn(
              "text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md",
              task.priority === "Alta"
                ? "bg-red-500/10 text-red-400"
                : task.priority === "Média"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-emerald-500/10 text-emerald-400",
            )}
          >
            {task.priority}
          </span>
        </div>
      </div>
      <h4 className="font-bold text-foreground group-hover:text-accent transition-colors">
        {task.title}
      </h4>

      <div
        className="flex gap-4 border-t border-border/50 pt-3 mt-4"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {task.due_date
              ? new Date(task.due_date + "T12:00:00").toLocaleDateString(
                  "pt-BR",
                  {
                    day: "2-digit",
                    month: "short",
                  },
                )
              : "Sem prazo"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>
            {task.comments_data
              ? task.comments_data.length
              : task.comments || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  stage,
  tasks,
  onEdit,
  onArchive,
  onDelete,
  onClearColumn,
}: {
  stage: string;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClearColumn: (stage: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex-1 min-w-[250px] max-w-[450px] bg-muted/40 rounded-2xl flex flex-col border border-border/50 shadow-sm max-h-full">
      <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full shadow-sm",
              stage === "Backlog"
                ? "bg-gray-500"
                : stage === "Em Andamento"
                  ? "bg-sky-500"
                  : stage === "Revisão"
                    ? "bg-amber-500"
                    : "bg-emerald-500",
            )}
          />
          <h3 className="font-semibold text-sm">{stage}</h3>
          <span className="ml-2 bg-background text-muted-foreground text-xs py-0.5 px-2 rounded-full font-medium border border-border/50">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-3 overflow-y-auto min-h-[500px] transition-colors rounded-b-2xl",
          isOver && "bg-accent/10 ring-2 ring-inset ring-accent/30",
        )}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function NewTaskModal({ onAddTask }: { onAddTask: (t: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ name: string; type: string }[]>([
    { name: "Otimização SEO", type: "WEB" },
    { name: "Integração com APIs", type: "WEB" },
  ]);
  const [newService, setNewService] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

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
    const priority =
      (form.elements.namedItem("priority") as HTMLSelectElement)?.value ||
      "Média";
    const project =
      (form.elements.namedItem("client") as HTMLSelectElement)?.value ||
      "Geral";

    onAddTask({
      id: crypto.randomUUID(),
      title: title || "Nova Tarefa",
      project: project,
      status: "Backlog",
      priority: priority as any,
      comments: 0,
      due_date: due_date || null,
    });
    setOpen(false);
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
            <Dialog.Title className="text-xl font-black text-foreground uppercase tracking-tighter">
              Nova Tarefa
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
              className="space-y-4"
            >
              {/* Título */}
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Título da Tarefa
                </label>
                <input
                  name="title"
                  type="text"
                  placeholder="Ex: Criar posts Instagram"
                  className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva os detalhes da tarefa"
                  className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 resize-none"
                />
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Cliente (opcional)
                </label>
                <div className="flex flex-col gap-2">
                  <select
                    name="client"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="w-full py-3 rounded-2xl border border-dashed border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                  >
                    <Plus size={16} /> Novo Cliente
                  </button>
                </div>
              </div>

              {/* Responsável e Prazo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                    Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Nome"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                    Prazo
                  </label>
                  <input
                    name="due_date"
                    type="date"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Serviços */}
              <div className="space-y-3">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Serviços (opcional)
                </label>
                <div className="relative group mb-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddService();
                        }
                      }}
                      placeholder="Buscar ou adicionar serviço..."
                      className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 pl-11 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                  {newService.trim() && (
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="px-4 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase rounded-2xl hover:opacity-90 transition-all active:scale-95"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
                <div className="space-y-1 bg-background/20 p-4 rounded-2xl border border-border/40 max-h-40 overflow-y-auto custom-scrollbar">
                  {services
                    .filter((s) =>
                      s.name.toLowerCase().includes(newService.toLowerCase()),
                    )
                    .map((svc) => (
                      <label
                        key={svc.name}
                        className="flex items-center gap-3 p-2 hover:bg-foreground/5 rounded-xl transition-colors cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(svc.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices([
                                ...selectedServices,
                                svc.name,
                              ]);
                            } else {
                              setSelectedServices(
                                selectedServices.filter((s) => s !== svc.name),
                              );
                            }
                          }}
                          className="w-4 h-4 rounded border-border/60 accent-primary"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">
                            {svc.name}
                          </span>
                          <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">
                            {svc.type}
                          </span>
                        </div>
                      </label>
                    ))}
                  {services.filter((s) =>
                    s.name.toLowerCase().includes(newService.toLowerCase()),
                  ).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhum serviço encontrado. Digite para adicionar.
                    </p>
                  )}
                </div>
              </div>

              {/* Prioridade e Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option>Baixa</option>
                    <option selected>Média</option>
                    <option>Alta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                    Tags
                  </label>
                  <input
                    name="tags"
                    type="text"
                    placeholder="design, urgente"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              {/* Anexos */}
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Anexos
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/webp,application/pdf"
                    onChange={(e) => {
                      // Se tivéssemos lógica de upload iria aqui. Por enquanto só exibe a seleção visual se quiser
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer hover:bg-foreground/5 transition-all group"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground transition-all group-hover:border-primary/50">
                      <Paperclip size={14} className="text-primary" /> Anexar
                      arquivo
                    </div>
                  </label>
                  <span className="text-[10px] text-muted-foreground/50 font-medium">
                    Imagens (WebP) e PDFs (máx 5MB)
                  </span>
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
              Criar Tarefa
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditTaskModal({
  task,
  onClose,
  onSave,
  onDelete,
  onSaveComment,
  onSaveAttachments,
  profile,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (t: Task) => void;
  onDelete: (id: string) => void;
  onSaveComment?: (taskId: string, newCommentData: any[]) => void;
  onSaveAttachments?: (taskId: string, newAttachments: string[]) => void;
  profile?: any;
}) {
  const [activeTab, setActiveTab] = React.useState<
    "details" | "comments" | "attachments"
  >("details");
  const [newComment, setNewComment] = React.useState("");
  const [localAttachments, setLocalAttachments] = React.useState<string[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeTab === "comments") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, task?.comments_data]);

  if (!task) return null;

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      id: crypto.randomUUID(),
      user: profile?.full_name || "Membro",
      text: newComment,
      date: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      userId: profile?.id, // ID único para identificar o autor
      avatar: profile?.avatar_url || "",
    };

    const updatedData = [...(task.comments_data || []), comment];

    // Optimistic local update via callback
    if (onSaveComment) {
      onSaveComment(task.id, updatedData);
    }

    setNewComment("");

    // Backend update without closing modal
    await supabase
      .from("tasks")
      .update({ comments_data: updatedData, comments: updatedData.length })
      .eq("id", task.id);

    // Enviar notificação global do comentário
    supabase
      .from("sys_notifications")
      .insert({
        title: "Nova Mensagem/Anotação",
        message: `${profile?.full_name || "Alguém"} comentou no projeto "${task.title}".`,
        type: "comment",
      })
      .then();
  };

  return (
    <Dialog.Root open={!!task} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 z-50 animate-fade-in-up flex flex-col max-h-[90vh]">
          <div className="flex flex-col p-6 pb-4 shrink-0 border-b border-border/50 relative gap-4">
            <div className="flex justify-between items-start">
              <Dialog.Title className="text-xl font-bold text-foreground pr-8">
                {task.title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-foreground/5 absolute top-5 right-5">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            {/* Navigational Tabs Style */}
            <div className="flex bg-muted/30 p-1.5 rounded-2xl mx-1 max-w-[420px] shadow-inner border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 relative",
                  activeTab === "details"
                    ? "text-primary bg-card border border-primary/20 shadow-lg scale-100"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 scale-95",
                )}
              >
                Detalhes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("comments")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 relative",
                  activeTab === "comments"
                    ? "text-primary bg-card border border-primary/20 shadow-lg scale-100"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 scale-95",
                )}
              >
                Chat / Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("attachments")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 relative",
                  activeTab === "attachments"
                    ? "text-primary bg-card border border-primary/20 shadow-lg scale-100"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 scale-95",
                )}
              >
                Anexos
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-background/30 rounded-b-2xl">
            {activeTab === "details" ? (
              <div className="p-5 custom-scrollbar">
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
                      project:
                        (form.elements.namedItem("project") as HTMLInputElement)
                          ?.value || task.project,
                      priority:
                        ((
                          form.elements.namedItem(
                            "priority",
                          ) as HTMLSelectElement
                        )?.value as any) || task.priority,
                      status:
                        ((
                          form.elements.namedItem("status") as HTMLSelectElement
                        )?.value as any) || task.status,
                      due_date:
                        (
                          form.elements.namedItem(
                            "due_date",
                          ) as HTMLInputElement
                        )?.value || task.due_date,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Título *
                    </label>
                    <input
                      name="title"
                      type="text"
                      defaultValue={task.title}
                      className="w-full bg-card border border-border/50 rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Prioridade
                      </label>
                      <select
                        name="priority"
                        defaultValue={task.priority}
                        className="w-full bg-card border border-border/50 rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors appearance-none"
                      >
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Status
                      </label>
                      <select
                        name="status"
                        defaultValue={task.status}
                        className="w-full bg-card border border-border/50 rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors appearance-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>
              </div>
            ) : activeTab === "comments" ? (
              <div className="flex flex-col h-full bg-background rounded-b-2xl overflow-hidden relative">
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "url('https://www.transparenttextures.com/patterns/cubes.png')",
                  }}
                />

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar z-10">
                  {!task.comments_data || task.comments_data.length === 0 ? (
                    <div className="flex mt-10 justify-center">
                      <span className="bg-background/80 text-muted-foreground text-xs px-4 py-1.5 rounded-full border border-border/50 shadow-sm backdrop-blur-md">
                        Nenhuma anotação ainda. Envie a primeira!
                      </span>
                    </div>
                  ) : (
                    task.comments_data.map((msg: any, idx) => {
                      const isMine = msg.userId === profile?.id;
                      return (
                        <div
                          key={msg.id || idx}
                          className={cn(
                            "flex w-full items-end gap-2",
                            isMine ? "justify-end" : "justify-start",
                          )}
                        >
                          {!isMine && (
                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-background border border-border/40 overflow-hidden shadow-sm mb-1">
                              {msg.avatar ? (
                                <img
                                  src={msg.avatar}
                                  className="w-full h-full object-cover"
                                  alt=""
                                />
                              ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm relative group",
                              isMine
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-card text-foreground border border-border/60 rounded-tl-sm",
                            )}
                          >
                            {!isMine && (
                              <div className="text-[11px] font-bold text-primary mb-1">
                                {msg.user}
                              </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </p>
                            <div
                              className={cn(
                                "text-[10px] text-right mt-1 opacity-60",
                                isMine
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {msg.date}
                            </div>
                          </div>
                          {isMine && (
                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-background border border-border/40 overflow-hidden shadow-sm mb-1">
                              {msg.avatar || profile?.avatar_url ? (
                                <img
                                  src={msg.avatar || profile?.avatar_url}
                                  className="w-full h-full object-cover"
                                  alt=""
                                />
                              ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 bg-card border-t border-border z-10 shrink-0">
                  <div className="flex gap-2 items-end">
                    <div className="flex bg-background border border-border rounded-xl flex-1 items-end relative overflow-hidden">
                      <input
                        type="file"
                        id="comment-attachment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            console.log(
                              "File attached:",
                              e.target.files[0].name,
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor="comment-attachment"
                        className="p-3 pl-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                      >
                        <Paperclip className="w-5 h-5" />
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment();
                          }
                        }}
                        placeholder="Mensagem ou anotação..."
                        className="flex-1 max-h-32 min-h-[44px] bg-transparent py-3 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none custom-scrollbar"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendComment}
                      disabled={!newComment.trim()}
                      className="w-11 h-11 shrink-0 bg-primary hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-primary-foreground transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        height="20"
                        width="20"
                        preserveAspectRatio="xMidYMid meet"
                        fill="currentColor"
                      >
                        <path d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === "attachments" ? (
              <div className="flex flex-col h-full bg-card/80 rounded-b-2xl overflow-hidden relative p-8 gap-6 justify-between flex-1 min-h-[400px]">
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50 rounded-2xl border border-border/40 p-4">
                  {!(task.attachments?.length || localAttachments.length) ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 opacity-70">
                      <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center border-2 border-dashed border-border/50">
                        <Paperclip
                          size={28}
                          className="text-muted-foreground/60"
                        />
                      </div>
                      <p className="text-sm font-semibold tracking-wide">
                        Nenhum anexo nesta tarefa
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(task.attachments || []).map((att: any, idx) => (
                        <div
                          key={idx}
                          className="bg-card rounded-2xl p-4 border border-border/60 flex flex-col items-center text-center gap-3 shadow-lg hover:border-primary/30 transition-all hover:scale-[1.02] group relative overflow-hidden"
                        >
                          {/* Botão de Excluir Anexo */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const updatedAttachments =
                                task.attachments?.filter((_, i) => i !== idx) ||
                                [];

                              // Atualização otimista
                              if (onSaveAttachments) {
                                onSaveAttachments(task.id, updatedAttachments);
                              }

                              // Persistência no Banco
                              await supabase
                                .from("tasks")
                                .update({ attachments: updatedAttachments })
                                .eq("id", task.id);

                              toast.info("Anexo removido do projeto");
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10"
                            title="Remover anexo"
                          >
                            <X size={14} />
                          </button>

                          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <FileSpreadsheet size={24} />
                          </div>
                          <span
                            className="text-xs font-bold text-foreground truncate w-full"
                            title={att}
                          >
                            {att}
                          </span>
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                            Arquivo
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-all shrink-0">
                  <input
                    type="file"
                    id="attachment-upload"
                    className="hidden"
                    multiple
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const newFiles = Array.from(e.target.files).map(
                          (f) => f.name,
                        );
                        const updatedAttachments = [
                          ...(task.attachments || []),
                          ...newFiles,
                        ];

                        // Atualização Otimista local
                        if (onSaveAttachments) {
                          onSaveAttachments(task.id, updatedAttachments);
                        }

                        // Persistência no Banco
                        await supabase
                          .from("tasks")
                          .update({ attachments: updatedAttachments })
                          .eq("id", task.id);

                        toast.success(
                          `${newFiles.length} arquivo(s) anexado(s) com sucesso!`,
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor="attachment-upload"
                    className="flex flex-col items-center cursor-pointer gap-3 w-full"
                  >
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                      <Plus size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-sm text-foreground uppercase tracking-widest">
                        Adicionar Anexos
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Clique aqui ou arraste seus arquivos
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          {activeTab === "details" && (
            <div className="p-4 border-t border-border/50 shrink-0 flex justify-between items-center bg-card rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground bg-transparent border border-border hover:bg-foreground/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  form="edit-task-form"
                  type="submit"
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Projects({ profile }: { profile?: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      resolveTeamAndFetch();
    }
    // Recarrega quando o admin_id mudar (carregamento assíncrono do perfil)
  }, [profile?.id, profile?.admin_id]);

  const resolveTeamAndFetch = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserAuth(user);

      // Se é membro (tem admin_id), usa o admin como dono dos dados
      let ownerId = profile?.id || user.id;
      if (profile?.admin_id) {
        ownerId = profile.admin_id;
      }
      setTeamOwnerId(ownerId);
      await fetchTasks(ownerId);
    } finally {
      setLoading(false);
    }
  };

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
          fetchTasks(teamOwnerId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamOwnerId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const fetchTasks = async (ownerId: string) => {
    let query = supabase.from("tasks").select("*");

    if (profile?.admin_id) {
      // Modo Equipe: Vê os projetos da equipe (onde user_id = admin_id)
      query = query.eq("user_id", profile.admin_id);
    } else {
      // Modo Independente: Vê os que possuem seu user_id ou que você criou
      query = query.or(`user_id.eq.${ownerId},created_by.eq.${ownerId}`);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) toast.error("Erro ao carregar projetos.");
    else if (data) setTasks(data);
  };

  const handleCreateTask = async (newT: Task) => {
    const ownerId = teamOwnerId || profile?.id;
    if (!ownerId) return;
    const { id, ...taskWithoutId } = newT;
    const dbTask = {
      ...taskWithoutId,
      user_id: ownerId,
      created_by: profile?.id,
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
      setTasks((prev) => prev.map((t) => (t.id === newT.id ? data : t)));

      // Envia notificação global
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
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);
    const { error } = await supabase
      .from("tasks")
      .update({
        title: updatedTask.title,
        project: updatedTask.project,
        status: updatedTask.status,
        priority: updatedTask.priority,
        due_date: updatedTask.due_date,
      })
      .eq("id", updatedTask.id);
    if (error) {
      toast.error("Erro ao atualizar projeto: " + error.message);
      setTasks(previousTasks);
    } else {
      toast.success("Projeto atualizado!");
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const currentActive = tasks.find((t) => t.id === active.id);
    if (currentActive) setActiveTask(currentActive);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (over && active.data.current?.task) {
      const taskId = active.id;
      const newStage = over.id as Task["status"];
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStage } : t)),
      );
      let taskToUpdate = tasks.find((t) => t.id === taskId);
      if (taskToUpdate)
        supabase
          .from("tasks")
          .update({ status: newStage })
          .eq("id", taskId)
          .then();
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

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center bg-transparent mb-6 rounded-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Projetos & Tarefas
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as entregas e movimente tarefas pelo Kanban
          </p>
        </div>
        <NewTaskModal onAddTask={handleCreateTask} />
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                tasks={tasks.filter((t) => t.status === stage)}
                onEdit={setEditingTask}
                onArchive={() => {}}
                onDelete={handleDelete}
                onClearColumn={() => {}}
              />
            ))}
          </div>
        )}
        <DragOverlay>
          {activeTask ? (
            <div className="w-80">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onArchive={() => {}}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <EditTaskModal
        task={editingTask}
        profile={profile}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
        onDelete={handleDelete}
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
        onSaveComment={(taskId, newComments) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    comments_data: newComments,
                    comments: newComments.length,
                  }
                : t,
            ),
          );
          if (editingTask && editingTask.id === taskId) {
            setEditingTask({
              ...editingTask,
              comments_data: newComments,
              comments: newComments.length,
            });
          }
        }}
      />
    </div>
  );
}
