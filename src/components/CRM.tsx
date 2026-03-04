import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  MoreVertical,
  Calendar,
  Phone,
  Mail,
  X,
  Search,
  Edit3,
  Briefcase,
  DollarSign,
  Building,
  Tag,
  Archive,
  Trash2,
} from "lucide-react";
import {
  formatCurrency,
  formatCPFCNPJ,
  formatPhone,
  formatCEP,
} from "../lib/masks";
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

type Lead = {
  id: string;
  name: string;
  company: string;
  value: string;
  stage: "Novo Lead" | "Em Contato" | "Em Negociação" | "Fechado";
  tags: string[];
  notes?: string;
  email?: string;
  phone?: string;
  project_interest?: string;
};

const handleCurrencyFormat = (e: React.ChangeEvent<HTMLInputElement>) => {
  let val = e.target.value.replace(/\D/g, "");
  if (!val) {
    e.target.value = "";
    return;
  }
  val = (Number(val) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  e.target.value = val;
};

function NewLeadModal({ onAddLead }: { onAddLead: (l: Lead) => void }) {
  const [open, setOpen] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const nameInput = form.elements.namedItem(
      "name",
    ) as HTMLInputElement | null;
    const companyInput = form.elements.namedItem(
      "company",
    ) as HTMLInputElement | null;
    const valueInput = form.elements.namedItem(
      "value",
    ) as HTMLInputElement | null;
    const stageInput = form.elements.namedItem(
      "stage",
    ) as HTMLSelectElement | null;

    const name =
      (form.elements.namedItem("name") as HTMLInputElement)?.value ||
      "Novo Contato";
    const company =
      (form.elements.namedItem("company") as HTMLInputElement)?.value ||
      "Nova Empresa";
    const value =
      (form.elements.namedItem("value") as HTMLInputElement)?.value || "R$ 0";
    const stage =
      (form.elements.namedItem("stage") as HTMLSelectElement)?.value ||
      "Novo Lead";
    const email =
      (form.elements.namedItem("email") as HTMLInputElement)?.value || "";
    const phone =
      (form.elements.namedItem("phone") as HTMLInputElement)?.value || "";
    const notes =
      (form.elements.namedItem("notes") as HTMLTextAreaElement)?.value || "";
    const project_interest =
      (form.elements.namedItem("project_interest") as HTMLInputElement)
        ?.value || "";

    onAddLead({
      id: crypto.randomUUID(),
      name,
      company,
      value: value || "R$ 0",
      stage: stage as any,
      tags: ["Novo"],
      email,
      phone,
      notes,
      project_interest,
    } as any);
    setOpen(false);
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-primary text-primary-foreground hover:opacity-90 px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Nova Oportunidade
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border z-50 animate-fade-in-up flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-border/50 shrink-0">
            <Dialog.Title className="text-xl font-bold text-foreground">
              Nova Oportunidade
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors bg-foreground/5 p-2 rounded-full hover:bg-foreground/10">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form
              id="new-lead-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  Pipeline (opcional)
                </label>
                <select className="w-full bg-background border border-accent rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-accent appearance-none">
                  <option>Selecione um pipeline</option>
                  <option>Vendas B2B</option>
                  <option>Parcerias</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Nome do Cliente
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Ex: Ana Costa"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="cliente@email.com"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Telefone
                  </label>
                  <input
                    name="phone"
                    type="text"
                    placeholder="(00) 00000-0000"
                    onChange={(e) =>
                      (e.target.value = formatPhone(e.target.value))
                    }
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Empresa
                  </label>
                  <input
                    name="company"
                    type="text"
                    placeholder="Nome da empresa"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  CPF/CNPJ
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    onChange={(e) =>
                      (e.target.value = formatCPFCNPJ(e.target.value))
                    }
                    className="flex-1 bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    className="w-11 h-11 flex items-center justify-center bg-background border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  CEP
                </label>
                <input
                  type="text"
                  placeholder="00000-000"
                  onChange={(e) => (e.target.value = formatCEP(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Endereço
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, Avenida..."
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Número
                  </label>
                  <input
                    type="text"
                    placeholder="Nº"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Complemento
                  </label>
                  <input
                    type="text"
                    placeholder="Apto, Sala..."
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Bairro
                  </label>
                  <input
                    type="text"
                    placeholder="Bairro"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Estado
                  </label>
                  <input
                    type="text"
                    placeholder="UF"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  Projeto/Interesse
                </label>
                <input
                  name="project_interest"
                  type="text"
                  placeholder="Ex: Logo + Identidade Visual"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent mb-3"
                />
                <p className="text-xs text-muted-foreground mb-2">
                  Ou selecione serviços cadastrados:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-background border border-border text-foreground/80 text-xs px-3 py-1.5 rounded-full cursor-pointer hover:border-white/30 transition-colors">
                    E-commerce
                  </span>
                  <span className="bg-background border border-border text-foreground/80 text-xs px-3 py-1.5 rounded-full cursor-pointer hover:border-white/30 transition-colors">
                    Integração com APIs
                  </span>
                  <span className="bg-background border border-border text-foreground/80 text-xs px-3 py-1.5 rounded-full cursor-pointer hover:border-white/30 transition-colors">
                    Otimização SEO
                  </span>
                  <span className="bg-background border border-border text-foreground/80 text-xs px-3 py-1.5 rounded-full cursor-pointer hover:border-white/30 transition-colors">
                    Site Institucional
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  Valor Estimado
                </label>
                <input
                  name="value"
                  type="text"
                  placeholder="R$ 4.500,00"
                  onChange={(e) =>
                    (e.target.value = formatCurrency(e.target.value))
                  }
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Branding, Urgente"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                  Observações
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Notas sobre o lead"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-foreground focus:outline-none focus:border-accent resize-y"
                />
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-border/50 shrink-0 flex justify-end gap-3 bg-card rounded-b-2xl">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl font-medium text-foreground/80 hover:text-foreground bg-background border border-border hover:bg-foreground/5 transition-colors w-full sm:w-auto"
              >
                Cancelar
              </button>
            </Dialog.Close>
            <button
              form="new-lead-form"
              type="submit"
              className="bg-primary text-primary-foreground px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20 w-full sm:w-auto"
            >
              Criar Oportunidade
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const STAGES = ["Novo Lead", "Em Contato", "Em Negociação", "Fechado"] as const;

function LeadCard({
  lead,
  onEdit,
  onArchive,
  onDelete,
}: {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { lead },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 999 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(lead)}
      className={cn(
        "bg-background border p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:shadow-lg group",
        isDragging
          ? "opacity-50 border-accent shadow-xl scale-[1.02]"
          : "border-border/60 hover:border-accent/50 hover:-translate-y-1",
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-md">
            {lead.tags[0]}
          </span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
            {lead.value}
          </span>
        </div>
      </div>
      <h4 className="font-bold text-foreground group-hover:text-accent transition-colors">
        {lead.company}
      </h4>
      <p className="text-sm text-muted-foreground mt-0.5 mb-4">{lead.name}</p>

      <div
        className="flex gap-2 border-t border-border/50 pt-3"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button className="p-1.5 rounded bg-card hover:bg-accent hover:text-foreground text-muted-foreground transition-colors group/btn relative">
          <Mail className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded bg-card hover:bg-accent hover:text-foreground text-muted-foreground transition-colors relative">
          <Phone className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded bg-card hover:bg-sky-500 hover:text-foreground text-muted-foreground transition-colors ml-auto relative">
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function KanbanColumn({
  stage,
  leads,
  onEdit,
  onArchive,
  onDelete,
  onClearColumn,
}: {
  stage: string;
  leads: Lead[];
  onEdit: (l: Lead) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClearColumn: (stage: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div className="flex-1 min-w-[250px] max-w-[450px] bg-muted/40 rounded-2xl flex flex-col border border-border/50 shadow-sm max-h-full">
      <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full shadow-sm",
              stage === "Novo Lead"
                ? "bg-sky-500 shadow-sky-500/50"
                : stage === "Em Contato"
                  ? "bg-amber-500 shadow-amber-500/50"
                  : stage === "Em Negociação"
                    ? "bg-purple-500 shadow-purple-500/50"
                    : "bg-emerald-500 shadow-emerald-500/50",
            )}
          />
          <h3 className="font-semibold text-sm">{stage}</h3>
          <span className="ml-2 bg-background text-muted-foreground text-xs py-0.5 px-2 rounded-full font-medium border border-border/50">
            {leads.length}
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
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function EditLeadModal({
  lead,
  onClose,
  onSave,
  onDelete,
}: {
  lead: Lead | null;
  onClose: () => void;
  onSave: (l: Lead) => void;
  onDelete: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "notes">("info");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (lead) setNotes(lead.notes || "");
  }, [lead]);

  if (!lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    const form = e.target as HTMLFormElement;
    onSave({
      ...lead,
      name:
        (form.elements.namedItem("name") as HTMLInputElement)?.value ||
        lead.name,
      company:
        (form.elements.namedItem("company") as HTMLInputElement)?.value ||
        lead.company,
      value:
        (form.elements.namedItem("value") as HTMLInputElement)?.value ||
        lead.value,
      stage:
        ((form.elements.namedItem("stage") as HTMLSelectElement)
          ?.value as any) || lead.stage,
      notes,
    });
  };

  return (
    <Dialog.Root open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-card rounded-2xl shadow-2xl border border-border/50 z-50 animate-fade-in-up flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 pb-2 shrink-0">
            <Dialog.Title className="text-xl font-bold text-foreground tracking-wide">
              {lead.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-foreground/5">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex bg-background p-1 rounded-xl max-w-lg">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  activeTab === "info"
                    ? "text-foreground bg-foreground/5 border border-border/50 shadow-sm"
                    : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                Informações
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  activeTab === "notes"
                    ? "text-foreground bg-foreground/5 border border-border/50 shadow-sm"
                    : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                Anotações
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-background">
            <form
              id="edit-lead-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {activeTab === "info" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Nome do Cliente *
                      </label>
                      <input
                        name="name"
                        type="text"
                        defaultValue={lead.name}
                        className="w-full bg-card border border-border/50 rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        E-mail *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="email"
                          type="email"
                          defaultValue={lead.email || ""}
                          className="w-full bg-card border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Telefone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="phone"
                          type="text"
                          defaultValue={lead.phone || ""}
                          onChange={(e) =>
                            (e.target.value = formatPhone(e.target.value))
                          }
                          className="w-full bg-card border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Empresa
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="company"
                          type="text"
                          defaultValue={lead.company}
                          className="w-full bg-card border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Projeto/Interesse
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select className="w-full bg-card border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors appearance-none">
                          <option>Ex: Logo, Site, Social Media</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Valor Estimado
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          name="value"
                          type="text"
                          defaultValue={lead.value}
                          placeholder="R$ 0,00"
                          onChange={(e) =>
                            (e.target.value = formatCurrency(e.target.value))
                          }
                          className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-3 text-foreground focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Pipeline
                      </label>
                      <select className="w-full bg-card border border-border/50 rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors appearance-none">
                        <option>Pipeline Principal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Estágio
                      </label>
                      <select
                        name="stage"
                        defaultValue={lead.stage}
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
                </>
              ) : (
                <div className="h-full flex flex-col">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Anotações sobre o Lead
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações importantes deste lead..."
                    className="flex-1 w-full min-h-[300px] bg-card border border-border/50 rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-accent focus:bg-background transition-colors resize-none mb-4"
                  />
                </div>
              )}
            </form>
          </div>

          <div className="p-5 border-t border-border/50 shrink-0 flex justify-between items-center bg-card rounded-b-2xl">
            <button
              type="button"
              onClick={() => {
                onDelete(lead.id);
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground bg-transparent border border-border hover:bg-foreground/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                form="edit-lead-form"
                type="submit"
                className="bg-primary text-primary-foreground px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
              >
                Salvar
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CRM({ profile }: { profile?: any }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserAuth(data.user);
        fetchLeads(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const fetchLeads = async (userId: string) => {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (profile?.role !== "super_admin") {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar leads.");
    } else if (data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const handleCreateLead = async (newL: Lead) => {
    if (!userAuth) return;
    const { id, ...leadWithoutId } = newL;
    const dbLead = { ...leadWithoutId, user_id: userAuth.id };

    setLeads([newL, ...leads]);

    const { data, error } = await supabase
      .from("leads")
      .insert(dbLead)
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar lead: " + error.message);
      setLeads((prev) => prev.filter((l) => l.id !== newL.id));
    } else if (data) {
      toast.success("Lead criado com sucesso!");
      setLeads((prev) => prev.map((l) => (l.id === newL.id ? data : l)));
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    const previousLeads = [...leads];
    setLeads(leads.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    setEditingLead(null);
    const { error } = await supabase
      .from("leads")
      .update({
        name: updatedLead.name,
        company: updatedLead.company,
        value: updatedLead.value,
        stage: updatedLead.stage,
        tags: updatedLead.tags,
        notes: updatedLead.notes,
        email: updatedLead.email,
        phone: updatedLead.phone,
        project_interest: updatedLead.project_interest,
      })
      .eq("id", updatedLead.id);

    if (error) {
      toast.error("Erro ao atualizar lead: " + error.message);
      setLeads(previousLeads);
    } else {
      toast.success("Lead atualizado!");
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const currentActive = leads.find((l) => l.id === active.id);
    if (currentActive) {
      setActiveLead(currentActive);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (over && active.data.current?.lead) {
      const leadId = active.id;
      const newStage = over.id as Lead["stage"];

      setLeads((prevLeads) =>
        prevLeads.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)),
      );

      let leadToUpdate = leads.find((l) => l.id === leadId);
      if (leadToUpdate) {
        supabase
          .from("leads")
          .update({ stage: newStage })
          .eq("id", leadId)
          .then();
      }
    }
  };

  const handleArchive = async (id: string) => {
    const previous = [...leads];
    setLeads((prev) => prev.filter((l) => l.id !== id));
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao arquivar lead: " + error.message);
      setLeads(previous);
    } else {
      toast.success("Lead arquivado com sucesso!");
    }
  };

  const handleDelete = async (id: string) => {
    const previous = [...leads];
    setLeads((prev) => prev.filter((l) => l.id !== id));
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir lead: " + error.message);
      setLeads(previous);
    } else {
      toast.success("Lead excluído!");
    }
  };

  const handleClearColumn = async (stage: string) => {
    const toDelete = leads.filter((l) => l.stage === stage);
    if (toDelete.length === 0) return;
    const previous = [...leads];
    setLeads((prev) => prev.filter((l) => l.stage !== stage));
    const ids = toDelete.map((l) => l.id);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    if (error) {
      toast.error("Erro ao limpar coluna: " + error.message);
      setLeads(previous);
    } else {
      toast.success(`Coluna ${stage} limpa.`);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center bg-transparent mb-6 rounded-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e oportunidades arrastando os cards
          </p>
        </div>
        <NewLeadModal onAddLead={handleCreateLead} />
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
                leads={leads.filter((l) => l.stage === stage)}
                onEdit={setEditingLead}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onClearColumn={handleClearColumn}
              />
            ))}
          </div>
        )}
        <DragOverlay>
          {activeLead ? (
            <div className="w-80">
              <LeadCard
                lead={activeLead}
                onEdit={() => {}}
                onArchive={() => {}}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <EditLeadModal
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSave={(updatedLead) => {
          handleUpdateLead(updatedLead);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
