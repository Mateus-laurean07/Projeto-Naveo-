import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MoreVertical,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  GripHorizontal,
  FolderKanban,
  CheckCircle2,
  ListChecks,
  User,
  X,
  AlignLeft,
  Trash2,
  ArrowLeft,
  MoreHorizontal,
  Play,
  CheckSquare,
  MessageSquare,
  History,
  Info,
  ChevronDown,
  Search,
  FileText,
  Paperclip,
  Download,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/utils";
import { toast } from "sonner";

// Definindo os possíveis status para a tarefa
const COLUMNS = [
  {
    id: "A fazer",
    title: "A Fazer",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
  {
    id: "Em andamento",
    title: "Em Andamento",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    id: "Revisão",
    title: "Revisão",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    id: "Concluído",
    title: "Concluído",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

function SortableTaskCard({
  task,
  teamMembers,
  onClick,
  onDelete,
}: {
  task: any;
  teamMembers: any[];
  onClick?: () => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "Task", task } });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-40 bg-card border-2 border-primary border-dashed rounded-[1.5rem] p-5 h-[120px]"
      />
    );
  }

  const isOverdue =
    !task.completed && task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-card border border-border/50 rounded-[1.5rem] p-5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-lg transition-all group flex flex-col gap-3 relative overflow-hidden",
        task.completed && "opacity-70",
      )}
    >
      {task.completed && (
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {task.priority && (
              <span
                className={cn(
                  "text-[8px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md border shrink-0",
                  task.priority === "Alta"
                    ? "bg-red-500/10 border-red-500/20 text-red-500"
                    : task.priority === "Média"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                )}
              >
                {task.priority === "Normal" ? "Baixa" : task.priority}
              </span>
            )}
            {task.project && (
              <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest truncate flex items-center gap-1">
                <FolderKanban size={10} />
                {task.project.title}
              </span>
            )}
            {Array.isArray(task.tags) &&
              task.tags.map((tag: any) => {
                const tagColor =
                  PRESET_COLORS.find((c) => c.id === tag.color) ||
                  PRESET_COLORS[0];
                return (
                  <span
                    key={tag.id || tag.text}
                    className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                      tagColor.text,
                      tagColor.lightBg,
                      tagColor.border,
                    )}
                  >
                    {tag.text}
                  </span>
                );
              })}
          </div>
          <h4
            className={cn(
              "text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors",
              task.completed && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </h4>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/40 hover:text-foreground p-1.5 rounded-xl hover:bg-foreground/5 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              onClick={(e) => e.stopPropagation()}
              className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-2xl min-w-[140px] z-[100] animate-in fade-in zoom-in-95"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors outline-none uppercase tracking-widest"
              >
                <Trash2 size={14} /> Excluir Tarefa
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
                isOverdue
                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                  : "bg-muted/30 border-border/50 text-muted-foreground",
              )}
            >
              <Clock size={10} />
              {new Date(task.due_date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </div>
          )}

          {Array.isArray(task.comments_data) &&
            task.comments_data.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border bg-muted/30 border-border/50 text-muted-foreground relative">
                <MessageSquare size={10} />
                {task.comments_data.length}
                {(() => {
                  const seenData = JSON.parse(
                    localStorage.getItem("@Naveo:comments_seen") || "{}",
                  );
                  const lastSeenCount = seenData[task.id] || 0;
                  if (task.comments_data.length > lastSeenCount) {
                    return (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-card rounded-full shadow-sm" />
                    );
                  }
                  return null;
                })()}
              </div>
            )}
        </div>

        {task.assigned_to && task.assigned_to.length > 0 && (
          <div className="flex -space-x-2">
            {task.assigned_to.map((userId: string) => {
              const member = teamMembers.find(
                (m) =>
                  String(m.id).trim().toLowerCase() ===
                  String(userId).trim().toLowerCase(),
              );
              return (
                <div
                  key={userId}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden ring-1 ring-black/5 shadow-sm",
                    !member && "opacity-50 grayscale",
                  )}
                  title={member?.full_name || `ID: ${userId}`}
                >
                  {member?.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                      <User size={10} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";

function TaskColumn({
  column,
  tasks,
  teamMembers,
  onTaskClick,
  onDeleteHook,
}: {
  column: (typeof COLUMNS)[0];
  tasks: any[];
  teamMembers: any[];
  onTaskClick: (task: any) => void;
  onDeleteHook: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col flex-1 min-w-[300px] h-full bg-muted/10 rounded-[2rem] border border-border/40 overflow-hidden"
    >
      <div
        className={cn(
          "p-5 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-10",
          column.bg,
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]",
              column.color,
              `bg-current`,
            )}
          />
          <h3 className="font-black text-sm uppercase tracking-widest text-foreground truncate shadow-sm">
            {column.title}
          </h3>
        </div>
        <span className="text-[10px] font-black bg-background border border-border/50 px-2 py-0.5 rounded-lg opacity-80">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[150px]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteHook}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center gap-2 justify-center h-full text-muted-foreground/30 py-10 pointer-events-none">
            <ListChecks size={24} className="opacity-50" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Solte aqui
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  icon: Icon,
}: any) {
  const selected = options.find((o: any) => o.value === value);
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
          {label}
        </label>
      )}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between group hover:border-primary/40"
          >
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
            className="w-[var(--radix-dropdown-menu-trigger-width)] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-2xl z-[150] animate-in fade-in zoom-in-95 duration-200"
            sideOffset={8}
          >
            {options.map((opt: any) => (
              <DropdownMenu.Item
                key={opt.value}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(opt.value);
                }}
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

function NewTaskModal({
  onAddTask,
  availableProjects,
}: {
  onAddTask: (t: any) => void;
  availableProjects: any[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("Normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const start_date = (
      form.elements.namedItem("start_date") as HTMLInputElement
    ).value;
    const due_date = (form.elements.namedItem("due_date") as HTMLInputElement)
      .value;

    if (!selectedProject) {
      toast.error("Por favor, selecione um projeto.");
      return;
    }

    onAddTask({
      title,
      project_id: selectedProject,
      priority: selectedPriority,
      start_date: start_date || null,
      due_date: due_date || null,
    });
    setOpen(false);
    setSelectedProject("");
    setSelectedPriority("Normal");
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-primary text-primary-foreground hover:opacity-90 px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-md z-[110] animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-card rounded-3xl shadow-2xl border border-border/50 z-[120] animate-fade-in-up flex flex-col max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-border/40 shrink-0">
            <Dialog.Title className="text-2xl font-black text-foreground uppercase tracking-tighter">
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
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Título da Tarefa
                </label>
                <input
                  name="title"
                  type="text"
                  placeholder="Ex: Criar design system"
                  className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 shadow-inner"
                  required
                />
              </div>

              <CustomSelect
                label="Projeto"
                value={selectedProject}
                onChange={setSelectedProject}
                placeholder="Selecione um projeto..."
                options={availableProjects.map((p) => ({
                  label: p.title,
                  value: p.id,
                }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Data de Início
                  </label>
                  <input
                    name="start_date"
                    type="date"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark] shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-foreground uppercase tracking-widest opacity-70">
                  Prazo de Entrega
                </label>
                <input
                  name="due_date"
                  type="date"
                  className="w-full bg-background/50 border border-border/50 rounded-2xl py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark] shadow-inner"
                />
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

export const PRESET_COLORS = [
  // Vermelhos e Rosas
  {
    id: "red",
    bg: "bg-red-500",
    text: "text-red-500",
    lightBg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  {
    id: "rose",
    bg: "bg-rose-500",
    text: "text-rose-500",
    lightBg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  {
    id: "pink",
    bg: "bg-pink-500",
    text: "text-pink-500",
    lightBg: "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  {
    id: "fuchsia",
    bg: "bg-fuchsia-500",
    text: "text-fuchsia-500",
    lightBg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
  },
  {
    id: "purple",
    bg: "bg-purple-500",
    text: "text-purple-500",
    lightBg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  {
    id: "violet",
    bg: "bg-violet-600",
    text: "text-violet-600",
    lightBg: "bg-violet-600/10",
    border: "border-violet-600/30",
  },

  // Azuis
  {
    id: "indigo",
    bg: "bg-indigo-600",
    text: "text-indigo-600",
    lightBg: "bg-indigo-600/10",
    border: "border-indigo-600/30",
  },
  {
    id: "blue",
    bg: "bg-blue-500",
    text: "text-blue-500",
    lightBg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  {
    id: "sky",
    bg: "bg-sky-500",
    text: "text-sky-500",
    lightBg: "bg-sky-500/10",
    border: "border-sky-500/30",
  },
  {
    id: "cyan",
    bg: "bg-cyan-500",
    text: "text-cyan-500",
    lightBg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },

  // Verdes e Teals
  {
    id: "teal",
    bg: "bg-teal-500",
    text: "text-teal-500",
    lightBg: "bg-teal-500/10",
    border: "border-teal-500/30",
  },
  {
    id: "emerald",
    bg: "bg-emerald-500",
    text: "text-emerald-500",
    lightBg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    id: "green",
    bg: "bg-green-600",
    text: "text-green-600",
    lightBg: "bg-green-600/10",
    border: "border-green-600/30",
  },
  {
    id: "lime",
    bg: "bg-lime-500",
    text: "text-lime-500",
    lightBg: "bg-lime-500/10",
    border: "border-lime-500/30",
  },

  // Amarelos, Laranjas e Marrons
  {
    id: "yellow",
    bg: "bg-yellow-400",
    text: "text-yellow-600",
    lightBg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
  },
  {
    id: "amber",
    bg: "bg-amber-500",
    text: "text-amber-500",
    lightBg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    id: "orange",
    bg: "bg-orange-500",
    text: "text-orange-500",
    lightBg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  {
    id: "brown",
    bg: "bg-amber-700",
    text: "text-amber-700",
    lightBg: "bg-amber-700/10",
    border: "border-amber-700/30",
  },

  // Neutros e Pretos/Cinzas
  {
    id: "stone",
    bg: "bg-stone-500",
    text: "text-stone-500",
    lightBg: "bg-stone-500/10",
    border: "border-stone-500/30",
  },
  {
    id: "slate",
    bg: "bg-slate-500",
    text: "text-slate-500",
    lightBg: "bg-slate-500/10",
    border: "border-slate-500/30",
  },
  {
    id: "zinc",
    bg: "bg-zinc-700",
    text: "text-zinc-700",
    lightBg: "bg-zinc-700/10",
    border: "border-zinc-700/30",
  },
];

export const DEFAULT_TAGS = [
  { id: "def-1", text: "Aprovado", color: "green" },
  { id: "def-2", text: "Em Análise", color: "yellow" },
  { id: "def-3", text: "Urgente", color: "pink" },
  { id: "def-4", text: "Aguardando", color: "orange" },
  { id: "def-5", text: "Revisão", color: "purple" },
  { id: "def-6", text: "Prioridade Alta", color: "orange" },
];

function TagsManager({
  task,
  availableTags,
  onUpdateTags,
  onDeleteGlobalTag,
}: {
  task: any;
  availableTags: any[];
  onUpdateTags: (tags: any[]) => void;
  onDeleteGlobalTag?: (tag: any) => void;
}) {
  const [newTagText, setNewTagText] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const taskTags = Array.isArray(task?.tags) ? task.tags : [];

  const handleCreate = () => {
    if (!newTagText.trim()) return;
    const newTag = {
      id: crypto.randomUUID(),
      text: newTagText.trim(),
      color: selectedColor.id,
    };
    onUpdateTags([...taskTags, newTag]);
    setNewTagText("");
  };

  const toggleTag = (tag: any) => {
    const isSelected = taskTags.some(
      (t: any) => t.id === tag.id || t.text === tag.text,
    );
    if (isSelected) {
      onUpdateTags(
        taskTags.filter((t: any) => t.id !== tag.id && t.text !== tag.text),
      );
    } else {
      onUpdateTags([...taskTags, tag]);
    }
  };

  const removeTag = (tagToRemove: any) => {
    onUpdateTags(
      taskTags.filter(
        (t: any) => t.id !== tagToRemove.id && t.text !== tagToRemove.text,
      ),
    );
  };

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-5 shadow-sm space-y-5">
      <h3 className="text-sm font-bold text-foreground">Tags</h3>

      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newTagText}
            onChange={(e) => setNewTagText(e.target.value)}
            placeholder="Criar tag"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            className="flex-1 bg-background/50 border border-border/50 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
          />
          <button
            onClick={handleCreate}
            disabled={!newTagText.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          >
            Criar
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedColor(c)}
              className={cn(
                "w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center border-2",
                c.bg,
                selectedColor.id === c.id
                  ? "border-foreground/20 ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  : "border-transparent",
              )}
            >
              {selectedColor.id === c.id && (
                <CheckCircle2 size={14} className="text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 mt-2">
        <span className="text-xs font-medium text-muted-foreground">
          Selecione as tags que deseja adicionar
        </span>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="w-full bg-background/50 border border-border/50 rounded-xl py-2.5 px-4 text-sm flex items-center justify-between hover:border-primary/40 transition-all text-muted-foreground">
              <span className="truncate">
                {taskTags.length === 0
                  ? "Selecione uma ou mais"
                  : `${taskTags.length} selecionada(s)`}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="w-[var(--radix-dropdown-menu-trigger-width)] bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl max-h-[220px] overflow-y-auto p-1.5 shadow-2xl z-[100] animate-in"
              align="start"
            >
              {availableTags.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground text-center">
                  Nenhuma tag criada
                </div>
              ) : (
                availableTags.map((tag) => {
                  const isSelected = taskTags.some(
                    (t: any) => t.id === tag.id || t.text === tag.text,
                  );
                  const tagColor =
                    PRESET_COLORS.find((c) => c.id === tag.color) ||
                    PRESET_COLORS[0];
                  return (
                    <DropdownMenu.Item
                      key={tag.id || tag.text}
                      onSelect={(e) => {
                        e.preventDefault();
                        toggleTag(tag);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-muted/50 outline-none transition-colors group/tagitem"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-sm",
                            tagColor.bg,
                          )}
                        />
                        <span className="truncate">{tag.text}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <CheckCircle2 size={16} className="text-primary" />
                        )}
                        {onDeleteGlobalTag && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDeleteGlobalTag(tag);
                            }}
                            className="opacity-0 group-hover/tagitem:opacity-100 hover:text-red-500 transition-all p-1"
                            title="Excluir tag"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </DropdownMenu.Item>
                  );
                })
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="pt-2 space-y-3">
        <h4 className="text-[13px] font-bold text-foreground">
          Tags selecionadas
        </h4>
        <div className="flex flex-wrap gap-2 bg-background/30 p-4 rounded-2xl border border-border/30 min-h-[60px]">
          {taskTags.length === 0 ? (
            <span className="text-[11px] text-muted-foreground italic flex w-full items-center justify-center h-full">
              Nenhuma tag
            </span>
          ) : (
            taskTags.map((tag: any) => {
              const tagColor =
                PRESET_COLORS.find((c) => c.id === tag.color) ||
                PRESET_COLORS[0];
              return (
                <div
                  key={tag.id || tag.text}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                    tagColor.text,
                    tagColor.lightBg,
                    tagColor.border,
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full bg-current")} />
                  <span>{tag.text}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 opacity-60 hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function Tasks({
  profile,
  initialTaskId,
  onTaskOpened,
}: {
  profile?: any;
  initialTaskId?: string | null;
  onTaskOpened?: () => void;
}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSelectTask = (task: any) => {
    setSelectedTask(task);
    if (task) {
      updateCommentSeen(task.id, task.comments_data?.length || 0);
    }
  };
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "calendar">(
    "kanban",
  );
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedFilterDate, setSelectedFilterDate] = useState<string | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPriorities, setExpandedPriorities] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const filteredTasks = tasks.filter((t) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();

    if (t.title?.toLowerCase().includes(q)) return true;
    if (t.project?.title?.toLowerCase().includes(q)) return true;
    if (
      Array.isArray(t.tags) &&
      t.tags.some((tag: any) => tag.text.toLowerCase().includes(q))
    )
      return true;

    if (Array.isArray(t.assigned_to)) {
      if (
        t.assigned_to.some((uid: string) => {
          const m = teamMembers.find((mem) => mem.id === uid);
          return (
            m?.full_name?.toLowerCase().includes(q) ||
            m?.nickname?.toLowerCase().includes(q)
          );
        })
      )
        return true;
    }

    return false;
  });

  const tasksByDate = useMemo(() => {
    const map: Record<string, { all: any[] }> = {};
    filteredTasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = { all: [] };
        map[t.due_date].all.push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTask?.comments_data]);

  useEffect(() => {
    if (initialTaskId && tasks.length > 0) {
      const task = tasks.find((t) => t.id === initialTaskId);
      if (task) {
        setSelectedTask(task);
        updateCommentSeen(task.id, task.comments_data?.length || 0);
        if (onTaskOpened) onTaskOpened();
      } else {
        supabase
          .from("project_tasks")
          .select("*, project:project_id(title)")
          .eq("id", initialTaskId)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedTask(data);
              updateCommentSeen(data.id, data.comments_data?.length || 0);
              if (onTaskOpened) onTaskOpened();
            }
          });
      }
    }
  }, [initialTaskId, tasks]);

  const updateCommentSeen = (taskId: string, count: number) => {
    try {
      const seenData = JSON.parse(
        localStorage.getItem("@Naveo:comments_seen") || "{}",
      );
      seenData[taskId] = count;
      localStorage.setItem("@Naveo:comments_seen", JSON.stringify(seenData));
    } catch (e) {}
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Team Members
      const ownerId = profile?.admin_id || profile?.id;
      if (ownerId) {
        const { data: teamData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .or(`id.eq.${ownerId},admin_id.eq.${ownerId}`);
        // Removido filtro de is_active para garantir que responsáveis apareçam mesmo inativos
        if (teamData) setTeamMembers(teamData);
      }

      // Fetch projects for modal and filtering
      let projQuery = supabase
        .from("tasks")
        .select("id, title")
        .is("is_archived", false);
      if (profile?.admin_id) {
        projQuery = projQuery.eq("user_id", profile.admin_id);
      } else {
        projQuery = projQuery.or(
          `user_id.eq.${profile?.id},created_by.eq.${profile?.id}`,
        );
      }
      const { data: projData } = await projQuery;
      if (projData) setAvailableProjects(projData);

      const projectIds = projData?.map((p) => p.id) || [];

      if (projectIds.length === 0) {
        setTasks([]);
        return;
      }

      // Fetch Tasks and join with project title, filtering ONLY by owned projects
      const { data, error } = await supabase
        .from("project_tasks")
        .select("*, project:project_id(title)")
        .in("project_id", projectIds)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Normaliza o status das tarefas que possam estar NULL ou inválidas
      const validTasks =
        data?.map((t) => ({
          ...t,
          status: COLUMNS.some((c) => c.id === t.status)
            ? t.status
            : t.completed
              ? "Concluído"
              : "A fazer",
          assigned_to: Array.isArray(t.assigned_to)
            ? t.assigned_to
            : t.assigned_to
              ? [t.assigned_to]
              : [],
        })) || [];

      setTasks(validTasks);

      const tagsMap = new Map();
      const deletedTagsRaw = localStorage.getItem("@Naveo:deleted_tags");
      const deletedTags = deletedTagsRaw ? JSON.parse(deletedTagsRaw) : [];

      DEFAULT_TAGS.forEach((tag) => {
        if (!deletedTags.includes(tag.text)) tagsMap.set(tag.text, tag);
      });

      try {
        const local = localStorage.getItem("@Naveo:custom_tags");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            parsed.forEach((t: any) => {
              if (!deletedTags.includes(t.text)) tagsMap.set(t.text, t);
            });
          }
        }
      } catch (e) {}

      validTasks.forEach((t) => {
        if (Array.isArray(t.tags)) {
          t.tags.forEach((tag: any) => {
            if (!deletedTags.includes(tag.text) && !tagsMap.has(tag.text))
              tagsMap.set(tag.text, tag);
          });
        }
      });
      setAvailableTags(Array.from(tagsMap.values()));
    } catch (error: any) {
      toast.error("Erro ao carregar tarefas: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewTask = async (taskData: any) => {
    const ownerId = profile?.admin_id || profile?.id;
    if (!ownerId) return;

    const { data: newT, error } = await supabase
      .from("project_tasks")
      .insert([
        {
          ...taskData,
          status: "A fazer",
          completed: false,
        },
      ])
      .select("*, project:project_id(title)")
      .single();

    if (error) {
      toast.error("Erro ao criar tarefa: " + error.message);
    } else if (newT) {
      setTasks((prev) => [newT, ...prev]);
      toast.success("Tarefa criada com sucesso!");
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Se dropou na própria posição
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    if (!isActiveTask) return;

    const activeIndex = tasks.findIndex((t) => t.id === activeId);
    let overIndex = tasks.findIndex((t) => t.id === overId);

    // Se não achou na lista overIndex (ex: dropou numa lista vazia, vamos tratar isso depois)
    // dnd-kit resolve overId para a coluna se usarmos um hook de droppable column,
    // mas aqui estamos apenas reordenando na lista geral baseado na task over.

    // Vamos prever mudanças de coluna baseados no item "over"
    let newStatus = tasks[activeIndex].status;

    if (overIndex !== -1) {
      newStatus = tasks[overIndex].status;
    } else {
      // Se overId bate com algum COLUMNS.id (caso tenhamos Droppable nas colunas)
      const col = COLUMNS.find((c) => c.id === overId);
      if (col) newStatus = col.id;
    }

    setTasks((prev) => {
      let next = [...prev];
      const taskToMove = next[activeIndex];
      taskToMove.status = newStatus;

      // Update completed state based on status
      taskToMove.completed = newStatus === "Concluído";

      if (overIndex !== -1) {
        next = arrayMove(next, activeIndex, overIndex);
      }

      // Re-apply order indexes
      next = next.map((t, idx) => ({ ...t, order_index: idx }));

      // Save to Supabase (we do this asynchronously for smooth UX)
      saveTaskOrder(taskToMove.id, newStatus, taskToMove.completed, next);

      return next;
    });
  };

  const saveTaskOrder = async (
    taskId: string,
    newStatus: string,
    completed: boolean,
    updatedTasks: any[],
  ) => {
    try {
      // Update the specific task's status and completion
      await supabase
        .from("project_tasks")
        .update({ status: newStatus, completed: completed })
        .eq("id", taskId);

      // (Optional) Update all order_indexes to keep it clean. For scale, you might only update what's necessary.
      // But let's keep it simple and just rely on the specific status update.
    } catch (e) {
      console.error("Falha ao salvar", e);
    }
  };

  const requestDeleteTask = (id: string) => {
    setIsDeleteDialogOpen(id);
  };

  const confirmDeleteTask = async () => {
    if (!isDeleteDialogOpen) return;
    try {
      await supabase
        .from("project_tasks")
        .delete()
        .eq("id", isDeleteDialogOpen);
      setTasks((prev) => prev.filter((t) => t.id !== isDeleteDialogOpen));
      if (selectedTask?.id === isDeleteDialogOpen) setSelectedTask(null);
      toast.success("Tarefa excluída com sucesso.");
    } catch (e) {
      toast.error("Erro ao excluir tarefa.");
    } finally {
      setIsDeleteDialogOpen(null);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

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

    const updatedData = [...(selectedTask.comments_data || []), comment];

    // Atualiza locamente na hora pra dar sensação realtime ao user
    const updatedTask = { ...selectedTask, comments_data: updatedData };
    setSelectedTask(updatedTask);
    updateCommentSeen(updatedTask.id, updatedData.length);
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)),
    );

    setNewComment("");

    const { error } = await supabase
      .from("project_tasks")
      .update({ comments_data: updatedData })
      .eq("id", selectedTask.id);

    if (error) toast.error("Falha ao salvar comentário: " + error.message);
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentText.trim() || !selectedTask) return;

    const updatedData = selectedTask.comments_data.map((msg: any) =>
      msg.id === commentId ? { ...msg, text: editingCommentText } : msg,
    );

    const updatedTask = { ...selectedTask, comments_data: updatedData };
    setSelectedTask(updatedTask);
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)),
    );

    setEditingCommentId(null);
    setEditingCommentText("");

    const { error } = await supabase
      .from("project_tasks")
      .update({ comments_data: updatedData })
      .eq("id", selectedTask.id);

    if (error) toast.error("Falha ao editar comentário.");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTask) return;

    const updatedData = selectedTask.comments_data.filter(
      (msg: any) => msg.id !== commentId,
    );

    const updatedTask = { ...selectedTask, comments_data: updatedData };
    setSelectedTask(updatedTask);
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)),
    );

    const { error } = await supabase
      .from("project_tasks")
      .update({ comments_data: updatedData })
      .eq("id", selectedTask.id);

    if (error) toast.error("Falha ao remover comentário.");
  };

  const toggleAssignee = async (userId: string) => {
    if (!selectedTask) return;
    const currentList = selectedTask.assigned_to || [];
    let newList = [];
    const normalizedUserId = String(userId).trim().toLowerCase();

    if (
      currentList.some(
        (id: string) => String(id).trim().toLowerCase() === normalizedUserId,
      )
    ) {
      newList = currentList.filter(
        (id: string) => String(id).trim().toLowerCase() !== normalizedUserId,
      );
    } else {
      newList = [...currentList, userId];
    }

    const updatedTask = { ...selectedTask, assigned_to: newList };
    setSelectedTask(updatedTask);
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)),
    );

    const { error } = await supabase
      .from("project_tasks")
      .update({ assigned_to: newList })
      .eq("id", selectedTask.id);
    if (error) toast.error("Falha ao atualizar responsável: " + error.message);
  };

  const handleUpdateChecklist = async (newChecklist: any[]) => {
    if (!selectedTask) return;
    const updatedTask = { ...selectedTask, checklist: newChecklist };
    setSelectedTask(updatedTask);
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? updatedTask : t)),
    );

    const { error } = await supabase
      .from("project_tasks")
      .update({ checklist: newChecklist })
      .eq("id", selectedTask.id);
    if (error) toast.error("Erro ao salvar checklist: " + error.message);
  };

  const handleAddChecklistItem = () => {
    const newList = [
      ...(selectedTask?.checklist || []),
      { id: crypto.randomUUID(), text: "", completed: false },
    ];
    handleUpdateChecklist(newList);
  };

  const handleToggleChecklistItem = (id: string) => {
    const newList = (selectedTask?.checklist || []).map((item: any) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    handleUpdateChecklist(newList);
  };

  const handleRemoveChecklistItem = (id: string) => {
    const newList = (selectedTask?.checklist || []).filter(
      (item: any) => item.id !== id,
    );
    handleUpdateChecklist(newList);
  };

  const handleEditChecklistItem = (id: string, text: string) => {
    const newList = (selectedTask?.checklist || []).map((item: any) =>
      item.id === id ? { ...item, text } : item,
    );
    handleUpdateChecklist(newList);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
          Carregando Tarefas...
        </p>
      </div>
    );
  }

  if (selectedTask) {
    return (
      <div className="flex flex-col h-full bg-background/50 rounded-[2rem] border border-border/40 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header TaskDetail */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background border border-border/50 px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-muted/10 transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {selectedTask.project?.title || "Tarefa Avulsa"}
              </span>
              <MoreHorizontal size={14} className="text-muted-foreground/50" />
            </div>
            <div className="flex items-center gap-2 bg-background border border-border/50 px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                CARD-{selectedTask.id.substring(0, 4).toUpperCase()}
              </span>
              <div className="w-3 h-3 rounded bg-primary/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary rounded-sm shadow-glow" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-foreground/5 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-2xl min-w-[140px] z-[100] animate-in fade-in"
                  align="end"
                  sideOffset={5}
                >
                  <DropdownMenu.Item
                    onClick={() => requestDeleteTask(selectedTask.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors outline-none uppercase tracking-widest"
                  >
                    <Trash2 size={14} /> Excluir Tarefa
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <div className="w-[1px] h-4 bg-border mx-1" />
            <button
              onClick={async () => {
                // Tenta salvar alterações pendentes antes de sair
                if (selectedTask) {
                  const newTitle = titleRef.current?.value.trim() || selectedTask.title;
                  const newDesc = descRef.current?.value.trim() || (selectedTask.description || "");

                  if (newTitle !== selectedTask.title || newDesc !== (selectedTask.description || "")) {
                    await supabase
                      .from("project_tasks")
                      .update({ title: newTitle, description: newDesc })
                      .eq("id", selectedTask.id);
                  }
                }
                setSelectedTask(null);
              }}
              className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-foreground/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content TaskDetail */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Main Left Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 flex flex-col gap-8 bg-background/30 border-r border-border/40">
            <input
              ref={titleRef}
              type="text"
              defaultValue={selectedTask.title}
              onBlur={async (e) => {
                const newTitle = e.target.value.trim();
                if (newTitle && newTitle !== selectedTask.title) {
                  const { error } = await supabase
                    .from("project_tasks")
                    .update({ title: newTitle })
                    .eq("id", selectedTask.id);
                  if (error) {
                    toast.error("Falha ao atualizar título: " + error.message);
                    return;
                  }
                  const updatedTask = { ...selectedTask, title: newTitle };
                  setSelectedTask(updatedTask);
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === selectedTask.id ? updatedTask : t,
                    ),
                  );
                  toast.success("Título atualizado.");
                }
              }}
              className="text-4xl lg:text-5xl font-black text-foreground bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/20 resize-none w-full tracking-tighter"
            />

            <div className="space-y-4">
              <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                Descrição
              </h3>
              <textarea
                ref={descRef}
                defaultValue={selectedTask.description || ""}
                placeholder="Adicione mais detalhes a esta tarefa..."
                onBlur={async (e) => {
                  const newDesc = e.target.value.trim();
                  if (newDesc !== (selectedTask.description || "")) {
                    const { error } = await supabase
                      .from("project_tasks")
                      .update({ description: newDesc })
                      .eq("id", selectedTask.id);
                    if (error) {
                      toast.error(
                        "Falha ao atualizar descrição: " + error.message,
                      );
                      return;
                    }
                    const updatedTask = {
                      ...selectedTask,
                      description: newDesc,
                    };
                    setSelectedTask(updatedTask);
                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === selectedTask.id ? updatedTask : t,
                      ),
                    );
                    toast.success("Descrição atualizada.");
                  }
                }}
                className="w-full min-h-[160px] bg-card border border-border/40 rounded-3xl p-6 text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-sm placeholder:text-muted-foreground/30"
              />
            </div>

            <div className="mt-8 pt-8 border-t border-border/40 space-y-6">
              <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                Comentários
              </h3>
              <div className="flex bg-card/50 border border-border/50 rounded-3xl p-2 gap-3 shadow-inner">
                <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-primary" />
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
                  placeholder="Adicione um comentário... (Pressione Enter para enviar)"
                  className="flex-1 bg-transparent border-none py-2.5 px-2 text-sm focus:outline-none focus:ring-0 resize-none min-h-[40px] placeholder:text-muted-foreground/40 font-medium"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                  className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-primary hover:text-white disabled:opacity-30 disabled:pointer-events-none mt-auto"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {!selectedTask.comments_data ||
                selectedTask.comments_data.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest bg-muted/10 rounded-3xl border border-dashed border-border/50">
                    Nenhum comentário
                  </div>
                ) : (
                  selectedTask.comments_data
                    .slice()
                    .reverse()
                    .map((msg: any) => (
                      <div key={msg.id} className="flex gap-4 group">
                        <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-background border border-border/50 flex items-center justify-center">
                          {msg.avatar ? (
                            <img
                              src={msg.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User
                              size={16}
                              className="text-muted-foreground/50"
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5 pt-1 rounded-2xl p-4 bg-muted/10 border border-border/40 group-hover:bg-muted/20 transition-all relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-black text-foreground">
                                {msg.user}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground/50">
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
                                  title="Editar"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(msg.id)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )}
                          </div>

                          {editingCommentId === msg.id ? (
                            <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) =>
                                  setEditingCommentText(e.target.value)
                                }
                                className="w-full bg-background border border-border/40 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[80px]"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleEditComment(msg.id)}
                                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
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

          {/* Right Sidebar Area */}
          <div className="w-[340px] shrink-0 bg-background/50 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <h2 className="text-xl font-black text-foreground tracking-tighter">
              Detalhes
            </h2>

            <div className="bg-card/40 p-8 rounded-[2.5rem] border border-border/40 space-y-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <h4 className="text-xl font-black tracking-tight z-10 relative">
                Prazos
              </h4>

              <div className="grid grid-cols-1 gap-8 z-10 relative">
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center border border-border/50 shadow-sm transition-transform group-hover/item:scale-105">
                      <CalendarIcon className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                        Início
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                        Quando começar? <Info className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  <input
                    type="date"
                    defaultValue={selectedTask.start_date || ""}
                    onBlur={async (e) => {
                      const val = e.target.value || null;
                      if (val !== (selectedTask.start_date || null)) {
                        const { error } = await supabase
                          .from("project_tasks")
                          .update({ start_date: val })
                          .eq("id", selectedTask.id);
                        if (error) {
                          toast.error("Falha ao atualizar data.");
                          return;
                        }
                        const updatedTask = {
                          ...selectedTask,
                          start_date: val,
                        };
                        setSelectedTask(updatedTask);
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === selectedTask.id ? updatedTask : t,
                          ),
                        );
                        toast.success("Data atualizada.");
                      }
                    }}
                    className="bg-muted/30 border border-border/50 rounded-xl px-4 py-2 text-right font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center border border-border/50 shadow-sm transition-transform group-hover/item:scale-105">
                      <AlertCircle
                        className={cn(
                          "w-6 h-6",
                          selectedTask.priority === "Alta"
                            ? "text-red-500"
                            : selectedTask.priority === "Média"
                              ? "text-amber-500"
                              : "text-emerald-500",
                        )}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                        Prioridade
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">
                        Nível de urgência
                      </span>
                    </div>
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className={cn(
                          "bg-muted/30 border border-border/50 rounded-xl px-4 py-2 min-w-[120px] flex items-center justify-between transition-all hover:bg-muted/40",
                          selectedTask.priority === "Urgente"
                            ? "text-purple-600"
                            : selectedTask.priority === "Alta"
                              ? "text-red-500"
                              : selectedTask.priority === "Média"
                                ? "text-amber-500"
                                : "text-emerald-500",
                        )}
                      >
                        <span className="text-sm font-bold capitalize">
                          {selectedTask.priority === "Normal"
                            ? "Baixa"
                            : selectedTask.priority}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-1.5 z-[100] min-w-[160px] animate-in fade-in zoom-in-95">
                        {[
                          {
                            label: "Baixa",
                            value: "Normal",
                            color: "text-emerald-500",
                            bg: "hover:bg-emerald-500/10",
                          },
                          {
                            label: "Média",
                            value: "Média",
                            color: "text-amber-500",
                            bg: "hover:bg-amber-500/10",
                          },
                          {
                            label: "Alta",
                            value: "Alta",
                            color: "text-red-500",
                            bg: "hover:bg-red-500/10",
                          },
                        ].map((opt) => (
                          <DropdownMenu.Item
                            key={opt.value}
                            onSelect={async () => {
                              if (selectedTask.priority === opt.value) return;
                              try {
                                const { error } = await supabase
                                  .from("project_tasks")
                                  .update({ priority: opt.value })
                                  .eq("id", selectedTask.id);
                                if (error) {
                                  toast.error(
                                    "Falha ao atualizar prioridade: " +
                                      error.message,
                                  );
                                  return;
                                }

                                const updatedTask = {
                                  ...selectedTask,
                                  priority: opt.value,
                                };
                                setSelectedTask(updatedTask);
                                setTasks((prev) =>
                                  prev.map((t) =>
                                    t.id === selectedTask.id ? updatedTask : t,
                                  ),
                                );
                                toast.success("Prioridade atualizada!");
                              } catch (err: any) {
                                toast.error("Erro inesperado: " + err.message);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer outline-none transition-all font-bold text-xs uppercase tracking-widest",
                              opt.bg,
                              opt.color,
                            )}
                          >
                            <AlertCircle size={14} />
                            {opt.label}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>

                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center border border-border/50 shadow-sm transition-transform group-hover/item:scale-105">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                        Entrega
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">
                        Data de vencimento
                      </span>
                    </div>
                  </div>
                  <input
                    type="date"
                    defaultValue={selectedTask.due_date || ""}
                    onBlur={async (e) => {
                      const val = e.target.value || null;
                      if (val !== (selectedTask.due_date || null)) {
                        const { error } = await supabase
                          .from("project_tasks")
                          .update({ due_date: val })
                          .eq("id", selectedTask.id);
                        if (error) {
                          toast.error("Falha ao atualizar data.");
                          return;
                        }
                        const updatedTask = { ...selectedTask, due_date: val };
                        setSelectedTask(updatedTask);
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === selectedTask.id ? updatedTask : t,
                          ),
                        );
                        toast.success("Data atualizada.");
                      }
                    }}
                    className="bg-muted/30 border border-border/50 rounded-xl px-4 py-2 text-right font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-foreground">
                  Responsáveis
                </h3>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <div className="w-6 h-6 rounded-full border border-border/50 flex flex-col items-center justify-center text-primary shadow-sm hover:bg-primary/5 transition-all cursor-pointer bg-card">
                      <Plus size={14} />
                    </div>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 shadow-2xl min-w-[200px] z-[100] animate-in"
                      align="end"
                    >
                      {teamMembers.length === 0 ? (
                        <DropdownMenu.Item className="px-3 py-2 text-xs text-muted-foreground">
                          Nenhum membro encontrado
                        </DropdownMenu.Item>
                      ) : (
                        teamMembers.map((m) => {
                          const isAssigned = (
                            selectedTask.assigned_to || []
                          ).some(
                            (id: string) =>
                              String(id).trim().toLowerCase() ===
                              String(m.id).trim().toLowerCase(),
                          );
                          return (
                            <DropdownMenu.Item
                              key={m.id}
                              onClick={(e) => {
                                e.preventDefault();
                                toggleAssignee(m.id);
                              }}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors outline-none"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                                  {m.avatar_url ? (
                                    <img
                                      src={m.avatar_url}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-[10px] font-bold text-primary">
                                      {m.full_name?.substring(0, 2)}
                                    </div>
                                  )}
                                </div>
                                <span className="truncate">{m.full_name}</span>
                              </div>
                              {isAssigned && (
                                <CheckCircle2
                                  size={14}
                                  className="text-primary shrink-0"
                                />
                              )}
                            </DropdownMenu.Item>
                          );
                        })
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              {selectedTask.assigned_to &&
              selectedTask.assigned_to.length > 0 ? (
                <div className="flex gap-2 flex-col">
                  {selectedTask.assigned_to.map((userId: string) => {
                    const member = teamMembers.find(
                      (m) =>
                        String(m.id).trim().toLowerCase() ===
                        String(userId).trim().toLowerCase(),
                    );
                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-3 bg-muted/20 border border-border/40 rounded-2xl p-2 cursor-pointer hover:border-primary/30 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-lg shadow-blue-500/20 overflow-hidden shrink-0">
                          {member?.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            member?.full_name?.substring(0, 2) || (
                              <User size={14} />
                            )
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
                          <span className="text-[12px] font-bold truncate shrink-1">
                            {member?.full_name ||
                              `ID: ${userId.substring(0, 8)}...`}
                          </span>
                          <button
                            onClick={() => toggleAssignee(userId)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center py-4 border border-dashed border-border/40 rounded-2xl">
                  Nenhum responsável
                </div>
              )}
            </div>

            <div className="bg-card border border-border/40 rounded-[2rem] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold text-foreground">Checklist</h3>
                <button
                  onClick={handleAddChecklistItem}
                  className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center text-primary shadow-sm hover:bg-primary/5 transition-all bg-card active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>

              {selectedTask.checklist && selectedTask.checklist.length > 0 ? (
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-primary transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          (selectedTask.checklist.filter((i: any) => i.completed)
                            .length /
                            selectedTask.checklist.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  {selectedTask.checklist.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 group/check"
                    >
                      <button
                        onClick={() => handleToggleChecklistItem(item.id)}
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                          item.completed
                            ? "bg-primary border-primary text-white"
                            : "border-border/60 hover:border-primary/50",
                        )}
                      >
                        {item.completed && <CheckCircle2 size={12} />}
                      </button>
                      <input
                        type="text"
                        value={item.text}
                        placeholder="Novo item de verificação..."
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
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={handleAddChecklistItem}
                  className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center py-4 border border-dashed border-border/40 rounded-2xl cursor-pointer hover:bg-muted/10 transition-all"
                >
                  Adicionar Checklist
                </div>
              )}
            </div>

            <div className="bg-card border border-border/40 rounded-[2rem] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-foreground">Anexos</h3>
                <label className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center text-primary shadow-sm hover:bg-primary/5 transition-all cursor-pointer bg-card group relative active:scale-95">
                  {isUploadingAttachment ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus
                        size={18}
                        className="group-hover:rotate-90 transition-transform duration-300"
                      />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setIsUploadingAttachment(true);

                            // Lógica de compressão senalizada (Senior Level)
                            if (file.type.startsWith("image/")) {
                              const img = new Image();
                              const objUrl = URL.createObjectURL(file);

                              img.onload = async () => {
                                URL.revokeObjectURL(objUrl);
                                const canvas = document.createElement("canvas");
                                const MAX_DIM = 1200;
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

                                const compressedBase64 = canvas.toDataURL(
                                  "image/webp",
                                  0.6,
                                );
                                const updatedAttachments = [
                                  ...(selectedTask.attachments || []),
                                  compressedBase64,
                                ];

                                const { error } = await supabase
                                  .from("project_tasks")
                                  .update({ attachments: updatedAttachments })
                                  .eq("id", selectedTask.id);

                                if (!error) {
                                  setSelectedTask({
                                    ...selectedTask,
                                    attachments: updatedAttachments,
                                  });
                                  setTasks(
                                    tasks.map((t: any) =>
                                      t.id === selectedTask.id
                                        ? {
                                            ...t,
                                            attachments: updatedAttachments,
                                          }
                                        : t,
                                    ),
                                  );
                                  toast.success("Imagem compactada e anexada!");
                                } else {
                                  toast.error("Erro ao salvar: " + error.message);
                                }
                                setIsUploadingAttachment(false);
                              };

                              img.onerror = () => {
                                toast.error("Formato de imagem inválido");
                                setIsUploadingAttachment(false);
                              };
                              img.src = objUrl;
                            } else {
                              // Arquivos não-imagem: base64 puro (limitado)
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const base64String = reader.result as string;
                                const updatedAttachments = [
                                  ...(selectedTask.attachments || []),
                                  base64String,
                                ];
                                const { error } = await supabase
                                  .from("project_tasks")
                                  .update({ attachments: updatedAttachments })
                                  .eq("id", selectedTask.id);
                                if (!error) {
                                  setSelectedTask({
                                    ...selectedTask,
                                    attachments: updatedAttachments,
                                  });
                                  setTasks(
                                    tasks.map((t: any) =>
                                      t.id === selectedTask.id
                                        ? {
                                            ...t,
                                            attachments: updatedAttachments,
                                          }
                                        : t,
                                    ),
                                  );
                                  toast.success("Arquivo anexado!");
                                }
                                setIsUploadingAttachment(false);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </>
                  )}
                </label>
              </div>

              {selectedTask.attachments &&
                selectedTask.attachments.length > 0 && (
                  <div className="space-y-2">
                    {selectedTask.attachments.map(
                      (att: string, idx: number) => {
                        const isImage =
                          att.startsWith("data:image/") ||
                          att.startsWith("blob:") ||
                          /\.(jpg|jpeg|png|gif|webp)/i.test(att);
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-4 bg-[#0a0a0c]/40 border border-border/10 rounded-2xl p-4 group/item hover:border-primary/20 transition-all shadow-sm"
                          >
                            <div
                              className="w-16 h-16 rounded-xl bg-muted/20 flex items-center justify-center text-primary shrink-0 overflow-hidden border border-border/20 shadow-md cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                              onClick={() => window.open(att, "_blank")}
                            >
                              {isImage ? (
                                <img
                                  src={att}
                                  className="w-full h-full object-cover transition-transform group-hover/item:scale-110"
                                  alt="Anexo"
                                />
                              ) : (
                                <FileText size={24} className="opacity-40" />
                              )}
                            </div>

                            <div className="flex-1 flex flex-col gap-2 min-w-0 pt-0.5">
                              <span
                                className="text-[14px] font-black truncate text-foreground/90 tracking-tight cursor-pointer hover:text-primary transition-all"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = att;
                                  link.download = att.startsWith("data:")
                                    ? "anexo"
                                    : att.split("/").pop() || "download";
                                  link.click();
                                }}
                              >
                                {att.startsWith("data:")
                                  ? `Anexo_${idx + 1}`
                                  : att.split("/").pop()?.split("?")[0] || att}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pt-1">
                              <button
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = att;
                                  link.download = att.startsWith("data:")
                                    ? "anexo"
                                    : att.split("/").pop() || "download";
                                  link.click();
                                }}
                                className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all hover:scale-110 active:scale-90"
                                title="Baixar"
                              >
                                <Download size={18} />
                              </button>
                              <button
                                onClick={async () => {
                                  const updated =
                                    selectedTask.attachments.filter(
                                      (_: any, i: number) => i !== idx,
                                    );
                                  const { error } = await supabase
                                    .from("project_tasks")
                                    .update({ attachments: updated })
                                    .eq("id", selectedTask.id);
                                  if (!error) {
                                    setSelectedTask({
                                      ...selectedTask,
                                      attachments: updated,
                                    });
                                    setTasks(
                                      tasks.map((t: any) =>
                                        t.id === selectedTask.id
                                          ? { ...t, attachments: updated }
                                          : t,
                                      ),
                                    );
                                    toast.success("Removido.");
                                  }
                                }}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all hover:scale-110 active:scale-90"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
            </div>

            <TagsManager
              task={selectedTask}
              availableTags={availableTags}
              onDeleteGlobalTag={async (tagToDelete) => {
                const deletedRaw = localStorage.getItem("@Naveo:deleted_tags");
                const deletedList = deletedRaw ? JSON.parse(deletedRaw) : [];
                if (!deletedList.includes(tagToDelete.text)) {
                  deletedList.push(tagToDelete.text);
                  localStorage.setItem(
                    "@Naveo:deleted_tags",
                    JSON.stringify(deletedList),
                  );
                }

                const local = localStorage.getItem("@Naveo:custom_tags");
                if (local) {
                  const parsed = JSON.parse(local);
                  const filtered = parsed.filter(
                    (t: any) =>
                      t.id !== tagToDelete.id && t.text !== tagToDelete.text,
                  );
                  localStorage.setItem(
                    "@Naveo:custom_tags",
                    JSON.stringify(filtered),
                  );
                }

                setAvailableTags((prev) =>
                  prev.filter(
                    (t) =>
                      t.id !== tagToDelete.id && t.text !== tagToDelete.text,
                  ),
                );

                const tasksToUpdate = tasks.filter(
                  (t) =>
                    Array.isArray(t.tags) &&
                    t.tags.some(
                      (tg: any) =>
                        tg.id === tagToDelete.id ||
                        tg.text === tagToDelete.text,
                    ),
                );
                if (tasksToUpdate.length > 0) {
                  await Promise.all(
                    tasksToUpdate.map((t) => {
                      const newTaskTags = t.tags.filter(
                        (tg: any) =>
                          tg.id !== tagToDelete.id &&
                          tg.text !== tagToDelete.text,
                      );
                      return supabase
                        .from("project_tasks")
                        .update({ tags: newTaskTags })
                        .eq("id", t.id);
                    }),
                  );
                  setTasks((prev) =>
                    prev.map((t) => {
                      if (
                        t.tags &&
                        t.tags.some(
                          (tg: any) =>
                            tg.id === tagToDelete.id ||
                            tg.text === tagToDelete.text,
                        )
                      ) {
                        return {
                          ...t,
                          tags: t.tags.filter(
                            (tg: any) =>
                              tg.id !== tagToDelete.id &&
                              tg.text !== tagToDelete.text,
                          ),
                        };
                      }
                      return t;
                    }),
                  );
                  if (
                    selectedTask?.tags?.some(
                      (tg: any) =>
                        tg.id === tagToDelete.id ||
                        tg.text === tagToDelete.text,
                    )
                  ) {
                    setSelectedTask((prev: any) => ({
                      ...prev,
                      tags: prev.tags.filter(
                        (tg: any) =>
                          tg.id !== tagToDelete.id &&
                          tg.text !== tagToDelete.text,
                      ),
                    }));
                  }
                }
                toast.success(
                  `Tag "${tagToDelete.text}" apagada de todas as tarefas!`,
                );
              }}
              onUpdateTags={async (newTags) => {
                try {
                  const { error } = await supabase
                    .from("project_tasks")
                    .update({ tags: newTags })
                    .eq("id", selectedTask.id);
                  if (error) {
                    toast.error(
                      "Por favor certifique-se que adicionou a coluna 'tags' como JSONB na tabela 'project_tasks' no Supabase.",
                    );
                    return;
                  }

                  const updatedTask = { ...selectedTask, tags: newTags };
                  setSelectedTask(updatedTask);
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === selectedTask.id ? updatedTask : t,
                    ),
                  );

                  setAvailableTags((prev) => {
                    const map = new Map(prev.map((p) => [p.text, p]));
                    newTags.forEach((nt) => {
                      if (!map.has(nt.text)) map.set(nt.text, nt);
                    });
                    const updated = Array.from(map.values());
                    localStorage.setItem(
                      "@Naveo:custom_tags",
                      JSON.stringify(updated),
                    );
                    return updated;
                  });
                } catch (e) {
                  toast.error("Erro inesperado.");
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/40 p-6 rounded-[2rem] border border-border/40 backdrop-blur-xl shrink-0 z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter shadow-sm">
            Fluxo de Tarefas
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 flex items-center gap-2">
            <FolderKanban size={12} className="text-primary" /> Visualização
            Geral da Equipe
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Buscar tarefa ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border/40 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold tracking-widest text-foreground placeholder:text-muted-foreground/50 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-[1.25rem] border border-border/40 backdrop-blur-md shadow-inner w-full sm:w-auto justify-center">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === "kanban"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
              )}
            >
              <FolderKanban size={16} /> Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === "list"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
              )}
            >
              <ListChecks size={16} /> Lista
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === "calendar"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
              )}
            >
              <CalendarIcon size={16} /> Calendário
            </button>
          </div>

          <NewTaskModal
            availableProjects={availableProjects}
            onAddTask={handleCreateNewTask}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        {viewMode === "kanban" ? (
          <div className="h-full overflow-x-auto custom-scrollbar pb-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 h-full min-w-max">
                {COLUMNS.map((col) => (
                  <TaskColumn
                    key={col.id}
                    column={col}
                    tasks={filteredTasks.filter((t) => t.status === col.id)}
                    teamMembers={teamMembers}
                    onTaskClick={handleSelectTask}
                    onDeleteHook={requestDeleteTask}
                  />
                ))}
              </div>

              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: "0.4" } },
                  }),
                }}
              >
                {activeTask ? (
                  <SortableTaskCard
                    task={activeTask}
                    teamMembers={teamMembers}
                    onDelete={requestDeleteTask}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : viewMode === "list" ? (
          <div className="h-full overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-20">
            {["Alta", "Média", "Normal"].map((priority) => {
              const priorityTasks = filteredTasks.filter(
                (t) => t.priority === priority,
              );
              if (priorityTasks.length === 0) return null;

              const colorClasses =
                priority === "Alta"
                  ? "border-red-500 shadow-red-500/10 text-red-500 bg-red-500/10"
                  : priority === "Média"
                    ? "border-amber-500 shadow-amber-500/10 text-amber-500 bg-amber-500/10"
                    : "border-emerald-500 shadow-emerald-500/10 text-emerald-500 bg-emerald-500/10";

              const isExpanded = expandedPriorities.includes(priority);
              const priorityLabel = priority === "Normal" ? "Baixa" : priority;

              return (
                <div
                  key={priority}
                  className="space-y-4 animate-in fade-in duration-500"
                >
                  <button
                    onClick={() => {
                      setExpandedPriorities((prev) =>
                        prev.includes(priority)
                          ? prev.filter((p) => p !== priority)
                          : [...prev, priority],
                      );
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-[2rem] border-2 shadow-xl backdrop-blur-md transition-all active:scale-[0.99]",
                      colorClasses,
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <ChevronDown
                        size={20}
                        className={cn(
                          "transition-transform duration-500",
                          !isExpanded && "-rotate-90 opacity-40",
                        )}
                      />
                      <h2 className="text-sm font-black uppercase tracking-[0.2em]">
                        {priorityLabel}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase opacity-60 px-3 py-1 rounded-full border border-current/20">
                        {priorityTasks.length} TAREFAS
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2 animate-in slide-in-from-top-4 duration-500">
                      {priorityTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleSelectTask(task)}
                          className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-[1.5rem] p-5 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group shadow-sm"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/20 px-2 py-1 rounded-lg">
                                CARD-{task.id.substring(0, 4)}
                              </span>
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  COLUMNS.find(
                                    (c) => c.id === task.status,
                                  )?.color.replace("text-", "bg-"),
                                )}
                              />
                            </div>
                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                              {task.title}
                            </h4>
                            {Array.isArray(task.tags) &&
                              task.tags.length > 0 && (
                                <div className="flex gap-1 items-center flex-wrap mt-2">
                                  {task.tags.map((tag: any) => {
                                    const tagColor =
                                      PRESET_COLORS.find(
                                        (c) => c.id === tag.color,
                                      ) || PRESET_COLORS[0];
                                    return (
                                      <span
                                        key={tag.id || tag.text}
                                        className={cn(
                                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                                          tagColor.text,
                                          tagColor.lightBg,
                                          tagColor.border,
                                        )}
                                      >
                                        {tag.text}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/20">
                              <span className="text-[10px] font-bold text-muted-foreground/50 truncate max-w-[120px]">
                                {task.project?.title || "Avulsa"}
                              </span>
                              <div className="flex items-center gap-3">
                                {Array.isArray(task.comments_data) &&
                                  task.comments_data.length > 0 && (
                                    <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground/60 relative">
                                      <MessageSquare
                                        size={12}
                                        className="opacity-40"
                                      />
                                      {task.comments_data.length}
                                      {(() => {
                                        const seenData = JSON.parse(
                                          localStorage.getItem(
                                            "@Naveo:comments_seen",
                                          ) || "{}",
                                        );
                                        const lastSeenCount =
                                          seenData[task.id] || 0;
                                        if (
                                          task.comments_data.length >
                                          lastSeenCount
                                        ) {
                                          return (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 border border-card rounded-full" />
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                <div className="flex -space-x-2">
                                  {task.assigned_to
                                    ?.slice(0, 3)
                                    .map((uid: string) => {
                                      const m = teamMembers.find(
                                        (mem) => mem.id === uid,
                                      );
                                      return (
                                        <div
                                          key={uid}
                                          className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden"
                                        >
                                          {m?.avatar_url ? (
                                            <img
                                              src={m.avatar_url}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <User size={10} />
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header do Calendário */}
            <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 shadow-xl">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">
                  {currentMonth.toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    Cronograma de Prazos
                  </span>
                  <div className="flex items-center gap-3 border-l border-border/40 pl-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[8px] font-black uppercase text-muted-foreground/40">
                        Data de Entrega
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Hoje
                </button>
                <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                    className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid do Calendário */}
            <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
              {/* Dias da Semana */}
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div
                  key={d}
                  className="py-4 text-center border-b border-border/20"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                    {d}
                  </span>
                </div>
              ))}

              {/* Dias do Mês */}
              <div className="col-span-7 grid grid-cols-7 h-full min-h-0">
                {calendarDays.map((day, i) => {
                  const dateStr = day ? day.toISOString().split("T")[0] : "";
                  const data = day ? tasksByDate[dateStr] : null;
                  const isToday =
                    day && new Date().toISOString().split("T")[0] === dateStr;

                  return (
                    <div
                      key={day ? dateStr : `empty-${i}`}
                      className={cn(
                        "min-h-[100px] border-r border-b border-border/20 p-2 transition-colors hover:bg-foreground/[0.02] flex flex-col gap-1.5",
                        (i + 1) % 7 === 0 && "border-r-0",
                      )}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between p-1">
                            <span
                              className={cn(
                                "text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-lg",
                                isToday
                                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                                  : "text-muted-foreground/60",
                              )}
                            >
                              {day.getDate()}
                            </span>
                            {data && (
                              <span className="text-[8px] font-black text-muted-foreground/30 px-1.5 py-0.5 rounded-md bg-muted/10 border border-border/20">
                                {data.all.length}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar-thin space-y-1 pr-1">
                            {data?.all.slice(0, 3).map((task) => {
                              return (
                                <button
                                  key={task.id}
                                  onClick={() => handleSelectTask(task)}
                                  className="w-full text-left p-1.5 rounded-lg bg-card/60 border border-border/40 hover:border-primary/40 hover:shadow-md transition-all group flex items-center gap-2"
                                >
                                  <div className="w-1 h-3 rounded-full shrink-0 bg-amber-500" />
                                  <span className="text-[9px] font-bold text-foreground/80 truncate group-hover:text-primary transition-colors">
                                    {task.title}
                                  </span>
                                </button>
                              );
                            })}
                            {data && data.all.length > 3 && (
                              <button
                                onClick={() => {
                                  setSelectedFilterDate(dateStr);
                                  setViewMode("list");
                                }}
                                className="w-full text-center py-1 text-[8px] font-black uppercase text-primary/60 hover:text-primary transition-colors"
                              >
                                +{data.all.length - 3} mais
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Task Confirmation Modal */}
      <Dialog.Root
        open={!!isDeleteDialogOpen}
        onOpenChange={(open) => !open && setIsDeleteDialogOpen(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-md z-[110] animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border/50 z-[120] animate-in zoom-in-95 slide-in-from-bottom-4 flex flex-col overflow-hidden p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <Dialog.Title className="text-xl font-black text-foreground uppercase tracking-tight">
                Excluir Tarefa?
              </Dialog.Title>
              <Dialog.Description className="text-sm font-medium text-muted-foreground/80 leading-relaxed max-w-[280px]">
                Esta ação não pode ser desfeita. A tarefa e todos os seus dados
                serão removidos permanentemente do sistema.
              </Dialog.Description>
            </div>

            <div className="flex gap-4 mt-8">
              <Dialog.Close asChild>
                <button className="flex-1 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-muted-foreground bg-muted/30 hover:bg-muted/50 border border-border/40 transition-all">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                onClick={confirmDeleteTask}
                className="flex-1 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all"
              >
                Excluir Tarefa
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
