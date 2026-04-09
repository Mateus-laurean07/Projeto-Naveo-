import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Save,
  Check,
  Package,
  Circle,
  RotateCcw,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { formatCurrency } from "../lib/masks";
import { Checkout } from "./Checkout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  features: string[];
  benefits: string[];
  tags: string[];
  active: boolean;
  sequence: number;
}

// ─── Mock Data (idêntico à imagem de referência) ──────────────────────────────
const MOCK: Plan[] = [
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Básico",
    slug: "basic",
    description: "Para pequenos revendedores",
    price: 297.9,
    original_price: 497.9,
    features: [
      "50 máquinas",
      "1 usuários",
      "IA ilimitada",
      "Disparos ilimitados",
      "Suporte por E-mail",
    ],
    benefits: [
      "50 máquinas no estoque",
      "Vitrine pública",
      "WhatsApp conectado",
    ],
    tags: ["WhatsApp Chat", "CRM"],
    active: true,
    sequence: 1,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Profissional",
    slug: "professional",
    description: "Para revendedores em crescimento",
    price: 647.9,
    original_price: 847.9,
    features: [
      "200 máquinas",
      "2 usuários",
      "500 msg IA/mês",
      "1.000 disparos/mês",
      "Suporte por E-mail",
    ],
    benefits: [
      "200 máquinas no estoque",
      "Vitrine pública personalizada",
      "WhatsApp conectado",
    ],
    tags: ["WhatsApp Chat", "CRM", "Disparos"],
    active: true,
    sequence: 3,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Enterprise",
    slug: "enterprise",
    description: "Para grandes operações",
    price: 1200,
    original_price: 1597.9,
    features: [
      "Máquinas ilimitadas",
      "3 usuários",
      "1000 msg IA/mês",
      "Disparos ilimitados",
      "Suporte por WhatsApp",
    ],
    benefits: [
      "Máquinas ilimitadas",
      "Vitrine white-label",
      "Múltiplos WhatsApp",
    ],
    tags: [
      "WhatsApp Chat",
      "CRM",
      "Automações",
      "Disparos",
      "Leads",
      "Interesses",
      "Vitrine Full",
    ],
    active: true,
    sequence: 4,
  },
];

// Feature icons (simulating the icons from the reference image)
const FEATURE_ICONS = ["💻", "👤", "🤖", "📡", "🎧"];

// ─── Component ────────────────────────────────────────────────────────────────
export function Plans({
  profile,
  setActiveTab,
}: {
  profile?: any;
  setActiveTab?: (tab: string) => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("sequence", { ascending: true });

      if (error) throw error;

      const dbPlans: Plan[] = data || [];

      // Mesclar: os 4 planos MOCK sempre aparecem (como base),
      // mas se o banco já tiver uma versão do mesmo slug, usa a do banco.
      // Planos extras do banco que não estão no MOCK também aparecem.
      const merged: Plan[] = MOCK.map((mock) => {
        const dbVersion = dbPlans.find((p) => p.slug === mock.slug);
        return dbVersion ?? mock;
      });

      // Adiciona quaisquer planos do banco que não existem no MOCK
      const mockSlugs = new Set(MOCK.map((m) => m.slug));
      const extras = dbPlans.filter((p) => !mockSlugs.has(p.slug));

      setPlans([...merged, ...extras].sort((a, b) => a.sequence - b.sequence));
    } catch (err: any) {
      console.error("Erro ao carregar planos:", err);
      setPlans(MOCK);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const priceRaw = (fd.get("price") as string).replace(/[^\d]/g, "");
    const price = parseFloat(priceRaw) / 100;

    const originalPriceRaw =
      (fd.get("original_price") as string)?.replace(/[^\d]/g, "") || "";
    const original_price = originalPriceRaw
      ? parseFloat(originalPriceRaw) / 100
      : null;

    const payload: Plan = {
      id: editingPlan ? editingPlan.id : crypto.randomUUID(),
      name: fd.get("name") as string,
      slug: fd.get("slug") as string,
      description: fd.get("description") as string,
      price: isNaN(price) ? 0 : price,
      original_price,
      features: (fd.get("features") as string)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      benefits: (fd.get("benefits") as string)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: (fd.get("tags") as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sequence: editingPlan ? editingPlan.sequence : plans.length + 1,
      active: editingPlan ? editingPlan.active : true, // Preserva status ao editar, ou True ao criar
    };

    const { error } = await supabase
      .from("plans")
      .upsert(payload);

    if (error) {
      toast.error("Erro ao salvar plano: " + error.message);
    } else {
      toast.success(editingPlan ? "Plano atualizado!" : "Plano criado!");
      fetchPlans();
      setIsModalOpen(false);
    }
  };

  const toggleStatus = async (id: string, active: boolean) => {
    const newStatus = !active;
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;

    const { error } = await supabase
      .from("plans")
      .upsert({ ...plan, active: newStatus });

    if (error) {
      toast.error("Erro ao alterar status: " + error.message);
    } else {
      setPlans((p) =>
        p.map((x) => (x.id === id ? { ...x, active: newStatus } : x)),
      );
      toast.success(newStatus ? "Vitrine: Plano visível!" : "Vitrine: Plano ocultado!");
    }
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    const { error } = await supabase.from("plans").delete().eq("id", planToDelete.id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      setPlans((p) => p.filter((x) => x.id !== planToDelete.id));
      toast.success("Plano excluído!");
    }
    setPlanToDelete(null);
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (checkoutPlanId) {
    return <Checkout initialPlanId={checkoutPlanId} onBack={() => setCheckoutPlanId(null)} />;
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight">
              Planos
            </h1>
            <p className="text-muted-foreground text-xs font-medium">
              Gerencie os planos de assinatura
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPlans}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all text-xs font-bold uppercase tracking-widest"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Atualizar
            </button>
            <button
              onClick={() => {
                setEditingPlan(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Novo Plano
            </button>
          </div>
        )}
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans
          .filter((p) => (isSuperAdmin ? true : p.active))
          .map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "bg-card border border-border/30 rounded-[1.75rem] flex flex-col overflow-hidden group transition-all duration-300 hover:shadow-xl hover:border-border/60",
                !plan.active && "opacity-50",
              )}
            >
              {/* Card Top */}
              <div className="p-7 pb-5 flex-1">
                {/* Name + Edit */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[22px] font-black text-foreground leading-tight truncate">
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground/50 font-bold uppercase tracking-wider mt-0.5 truncate">
                      {plan.slug}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => toggleStatus(plan.id, plan.active)}
                        className={cn(
                          "relative w-7 h-[14px] rounded-full transition-all duration-300",
                          plan.active
                            ? "bg-primary shadow-sm shadow-primary/30"
                            : "bg-foreground/15"
                        )}
                        title={plan.active ? "Desativar Plano" : "Ativar Plano"}
                      >
                        <span
                          className={cn(
                            "absolute top-[2px] w-[10px] h-[10px] bg-white rounded-full shadow transition-all duration-300",
                            plan.active ? "left-[16px]" : "left-[2px]"
                          )}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-muted-foreground/40 hover:text-primary transition-colors"
                        title="Editar Plano"
                      >
                         <Edit size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground text-[13px] font-medium leading-snug mt-4 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-5">
                  {plan.original_price && (
                    <p className="text-muted-foreground/40 text-[12px] font-bold line-through mb-0.5">
                      R${" "}
                      {Number(plan.original_price).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[15px] font-black text-foreground">
                        R$
                      </span>
                      <span className="text-[36px] font-black text-foreground tracking-tight leading-none">
                        {Number(plan.price).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {plan.tags.includes("Lançamento") && (
                      <span className="px-3 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest">
                        Lançamento
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                    /mês
                  </span>
                </div>

                {/* Features list (with emoji icons) */}
                <div className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="text-[14px] w-5 text-center opacity-60">
                        {FEATURE_ICONS[i] ?? "•"}
                      </span>
                      <span className="text-[12px] font-semibold text-foreground/70">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tags pills */}
                {plan.tags.filter((t) => t !== "Lançamento").length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5 border-t border-border/20 pt-5">
                    {plan.tags
                      .filter((t) => t !== "Lançamento")
                      .slice(0, 4)
                      .map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-lg bg-foreground/5 border border-border/30 text-[10px] font-bold text-muted-foreground flex items-center gap-1.5"
                        >
                          <Circle className="w-1.5 h-1.5 fill-primary/50 text-transparent" />
                          {t}
                        </span>
                      ))}
                    {plan.tags.filter((t) => t !== "Lançamento").length > 4 && (
                      <span className="px-2.5 py-1 rounded-lg bg-foreground/5 border border-border/30 text-[10px] font-bold text-muted-foreground">
                        +
                        {plan.tags.filter((t) => t !== "Lançamento").length - 4}{" "}
                        mais...
                      </span>
                    )}
                  </div>
                )}

                {/* Benefits checklist */}
                <div className="space-y-2">
                  {plan.benefits.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex items-center gap-2 opacity-60">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-[11px] font-medium text-muted-foreground lowercase">
                        {b}
                      </span>
                    </div>
                  ))}
                  {plan.benefits.length > 3 && (
                    <p className="text-[10px] text-muted-foreground/50 font-bold pl-5">
                      +{plan.benefits.length - 3} mais...
                    </p>
                  )}
                </div>
              </div>

              {/* ── Card Footer ── */}
              <div className="px-5 py-5 border-t border-border/20 bg-foreground/[0.015] flex items-center justify-between gap-3">
                <button
                  onClick={() => setCheckoutPlanId(plan.id)}
                  className="flex-1 w-full bg-primary/10 hover:bg-primary text-primary hover:text-black py-3 px-2 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest transition-all text-center shadow-lg hover:shadow-primary/20 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  Assinar Plano
                </button>

                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlanToDelete(plan)}
                      className="p-0 w-[42px] h-[42px] flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* ── Modal ── */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border/10 rounded-[2.5rem] shadow-2xl z-[101] p-12 overflow-y-auto max-h-[90vh] outline-none">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <div>
                <Dialog.Title className="text-2xl font-black text-foreground tracking-tight uppercase">
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground text-sm">
                  Configure os detalhes e precificação
                </Dialog.Description>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Nome
                  </label>
                  <input
                    name="name"
                    required
                    defaultValue={editingPlan?.name}
                    className="bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Slug
                  </label>
                  <input
                    name="slug"
                    required
                    defaultValue={editingPlan?.slug}
                    className="bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Preço (R$)
                  </label>
                  <input
                    name="price"
                    required
                    placeholder="R$ 0,00"
                    defaultValue={
                      editingPlan
                        ? formatCurrency((editingPlan.price * 100).toString())
                        : ""
                    }
                    onChange={(e) =>
                      (e.target.value = formatCurrency(e.target.value))
                    }
                    className="bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Preço Original
                  </label>
                  <input
                    name="original_price"
                    placeholder="R$ 0,00"
                    defaultValue={
                      editingPlan?.original_price
                        ? formatCurrency(
                            (editingPlan.original_price * 100).toString(),
                          )
                        : ""
                    }
                    onChange={(e) =>
                      (e.target.value = formatCurrency(e.target.value))
                    }
                    className="bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Tags (vírgula – ex: Lançamento, CRM, Disparos)
                </label>
                <input
                  name="tags"
                  defaultValue={editingPlan?.tags?.join(", ")}
                  className="bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Descrição
                </label>
                <textarea
                  name="description"
                  defaultValue={editingPlan?.description}
                  rows={2}
                  className="bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-medium outline-none resize-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Features (1 por linha)
                  </label>
                  <textarea
                    name="features"
                    defaultValue={editingPlan?.features?.join("\n")}
                    rows={4}
                    className="bg-background border border-border/50 rounded-xl px-4 py-3 text-xs font-bold outline-none resize-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Benefícios (1 por linha)
                  </label>
                  <textarea
                    name="benefits"
                    defaultValue={editingPlan?.benefits?.join("\n")}
                    rows={4}
                    className="bg-background border border-border/50 rounded-xl px-4 py-3 text-xs font-medium outline-none resize-none focus:border-primary/50 transition-all italic"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex-1 bg-foreground/5 hover:bg-foreground/10 py-4 rounded-xl text-muted-foreground font-black uppercase text-xs tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="flex-[2] bg-primary hover:bg-primary/90 py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                >
                  <Save size={16} />
                  Salvar Plano
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Delete Confirmation Modal ── */}
      <Dialog.Root open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#15161A] border border-red-500/20 rounded-[2rem] shadow-[0_0_50px_rgba(239,68,68,0.15)] z-[111] p-8 text-center outline-none animate-in fade-in zoom-in-95">
             <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
             </div>
             
             <Dialog.Title className="text-2xl font-black text-white mb-2">Reflita Novamente</Dialog.Title>
             <Dialog.Description className="text-sm font-medium text-muted-foreground mb-8">
               Tem certeza que deseja apagar o plano <strong className="text-white">"{planToDelete?.name}"</strong>? Esta ação é irreversível e excluirá todo histórico deste pacote.
             </Dialog.Description>
             
             <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all"
                >
                  Sim, Eliminar Plano
                </button>
                <button
                  onClick={() => setPlanToDelete(null)}
                  className="w-full bg-[#0C0D11] border border-[#27282D] hover:bg-[#27282D] text-muted-foreground font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Cancelar e Voltar
                </button>
             </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
