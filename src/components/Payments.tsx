import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  FileText,
  CheckCircle2,
  FileCheck,
  Eye,
  Pencil,
  Trash2,
  User,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  PlusCircle,
  X,
  Filter,
  Calendar,
  ChevronDown,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { DatePicker } from "./DatePicker";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentRecord {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar?: string;
  plan_name: string;
  amount: number;
  status: "pago" | "inadimplente" | "pendente";
  payment_date: string;
  isAuto?: boolean;
}

const STATUS_CONFIG = {
  pago: {
    label: "Pago",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  inadimplente: {
    label: "Inadimplente",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  },
  pendente: {
    label: "Pendente",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  },
};

const PAGE_SIZE = 8;

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ─── Super Admin View ─────────────────────────────────────────────────────────
function AdminFinanceiro({ profile }: { profile?: any }) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Persistence State
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [filterPlan, setFilterPlan] = useState("todos");
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDate, setFilterDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("monthly");
  const [page, setPage] = useState(1);

  const navigateDate = (dir: "prev" | "next") => {
    const newDate = new Date(filterDate);
    newDate.setDate(newDate.getDate() + (dir === "next" ? 1 : -1));
    setFilterDate(newDate);
    setPage(1);
  };

  const isNextDisabled = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const fd = new Date(filterDate);
    fd.setHours(0, 0, 0, 0);
    return fd >= now;
  }, [filterDate]);

  useEffect(() => {
    fetchPayments();

    const plansSub = supabase
      .channel("public-plans-financial")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans" },
        () => {
          fetchPayments();
        },
      )
      .subscribe();

    const subsSub = supabase
      .channel("public-subs-financial")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        () => {
          fetchPayments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(plansSub);
      supabase.removeChannel(subsSub);
    };
  }, []);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setIsSaving(true);
    try {
      let isoDate = new Date().toISOString();
      if (editingPayment.payment_date.includes("/")) {
        const [d, m, y] = editingPayment.payment_date.split("/");
        isoDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toISOString();
      }
      const isVirtual = editingPayment.id.includes("-");
      const { error } = await supabase.from("payments").upsert({
        id: isVirtual ? undefined : (editingPayment.id || undefined),
        customer_id: editingPayment.client_id,
        plan_name: editingPayment.plan_name,
        amount: editingPayment.amount,
        status: editingPayment.status,
        payment_date: isoDate,
      });
      if (error) throw error;
      toast.success("Dados salvos!");
      setIsModalOpen(false);
      fetchPayments();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Excluir registro permanentemente?")) return;
    try {
      const isVirtual = id.includes("-");
      if (isVirtual) {
        // Para registros virtuais, "deletar" significa criar um registro real com status 'deleted'
        const record = payments.find(p => p.id === id);
        if (record) {
          const [d, m, y] = record.payment_date.split("/");
          const isoDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d)).toISOString();
          const { error } = await supabase.from("payments").insert({
            customer_id: record.client_id,
            plan_name: record.plan_name,
            amount: record.amount,
            status: "deleted",
            payment_date: isoDate,
          });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) throw error;
      }
      toast.success("Registro removido.");
      fetchPayments();
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  useEffect(() => {
    async function loadCustomers() {
      const { data } = await supabase.from("customers").select("id, name").order("name");
      if (data) setCustomers(data);
    }
    loadCustomers();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // 1. Planos
      const { data: dbPlans } = await supabase.from("plans").select("slug, name").order("sequence");
      setPlans(Array.from(new Set([...(dbPlans || []).map((p: any) => p.name), "Grátis", "Básico"])));

      // Identifica o dono primário (seja ele admin ou o próprio user)
      const ownerId = profile?.admin_id || profile?.id;

      // 2. Tabela real
      let paymentsQuery = supabase.from("payments").select("*, customer:customers(name)").order("payment_date", { ascending: false });
      if (profile?.role !== "super_admin" && ownerId) {
        paymentsQuery = paymentsQuery.eq("customer_id", ownerId);
      }
      const { data: real } = await paymentsQuery;
      
      const res: PaymentRecord[] = [];

      if (real) {
        real.forEach((p: any) => {
          if (p.status === "deleted") return; // Ignora registros deletados na exibição
          res.push({
            id: p.id,
            client_id: p.customer_id,
            client_name: p.customer?.name || "Cliente",
            plan_name: p.plan_name,
            amount: p.amount,
            status: p.status,
            payment_date: new Date(p.payment_date).toLocaleDateString("pt-BR"),
          });
        });
      }

      // 3. Fallback virtual (merged)
      let subsQuery = supabase.from("subscriptions").select("*, profiles(*), plans(*)");
      if (profile?.role !== "super_admin" && ownerId) {
        subsQuery = subsQuery.eq("user_id", ownerId);
      }
      const { data: subs } = await subsQuery;
      const now = new Date();
      if (subs) {
        for (const s of subs) {
          // Começamos do mês de criação da assinatura
          let cur = new Date(s.created_at);
          // Limitamos a geração de meses para não sobrecarregar
          let monthsCount = 0;
          
          while (cur <= now && monthsCount < 60) {
            const dateStr = cur.toLocaleDateString("pt-BR");
            
            // Verifica se já existe um registro REAL manual que substitui este mês automático
            const hasRealRecord = real?.some(r => r.customer_id === s.user_id && new Date(r.payment_date).toLocaleDateString("pt-BR") === dateStr);
            
            if (!hasRealRecord) {
              const isCurrentMonth = cur.getMonth() === now.getMonth() && cur.getFullYear() === now.getFullYear();
              
              // Lógica de Status Automática:
              // Se for o mês atual, segue o status da assinatura
              // Se for mês passado, assumimos como pago (histórico positivo)
              let autoStatus: PaymentRecord["status"] = "pago";
              if (isCurrentMonth) {
                if (s.status === "active") autoStatus = "pago";
                else if (s.status === "past_due" || s.status === "unpaid" || s.status === "overdue") autoStatus = "inadimplente";
                else autoStatus = "pendente";
              }

              res.push({
                id: `${s.id}-${cur.getTime()}`,
                client_id: (s as any).user_id,
                client_name: (s as any).profiles?.full_name || "Cliente",
                plan_name: (s as any).plans?.name || "Plano",
                amount: (s as any).plans?.price || 0,
                status: autoStatus,
                payment_date: dateStr,
                isAuto: true, // Nova flag para identificação visual
              });
            }
            cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
            monthsCount++;
          }
        }
      }
      setPayments(res.sort((a, b) => b.id.localeCompare(a.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtered ───────────────────────────────────────────────────────────────
  const filterPlanOptions = useMemo(() => {
    const activePlanNames = payments
      .map((p) => p.plan_name)
      .filter((p) => p && p !== "—");

    const allUniquePlans = Array.from(new Set([...plans, ...activePlanNames]));

    return [
      { value: "todos", label: "Todos os Planos" },
      ...allUniquePlans.map((p) => ({
        value: p,
        label: p === "Grátis" ? "Plano Grátis" : p,
      })),
    ];
  }, [plans, payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterPlan !== "todos" && p.plan_name !== filterPlan) return false;
      if (filterStatus !== "todos" && p.status !== filterStatus) return false;

      const parts = p.payment_date.split("/");
      if (parts.length === 3) {
        const pDay = parseInt(parts[0], 10);
        const pMonth = parseInt(parts[1], 10) - 1;
        const pYear = parseInt(parts[2], 10);

        if (viewMode === "daily") {
          if (
            pDay !== filterDate.getDate() ||
            pMonth !== filterDate.getMonth() ||
            pYear !== filterDate.getFullYear()
          ) {
            return false;
          }
        } else {
          // Monthly view logic: only match month and year
          if (
            pMonth !== filterDate.getMonth() ||
            pYear !== filterDate.getFullYear()
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [payments, filterPlan, filterStatus, filterDate, viewMode]);

  // ─── KPIs ───────────────────────────────────────────────────────────────────
  const totalRevenue = filtered
    .filter((p) => p.status === "pago")
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingRevenue = filtered
    .filter((p) => p.status === "pendente")
    .reduce((acc, p) => acc + p.amount, 0);
  const activeClients = filtered.filter((p) => p.status === "pago").length;
  const defaulters = filtered.filter((p) => p.status === "inadimplente").length;
  const pendingClients = filtered.filter((p) => p.status === "pendente").length;

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── Export CSV ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      "Cliente",
      "Plano",
      "Valor (R$)",
      "Status",
      "Data de Pagamento",
    ];
    const rows = filtered.map((p) => [
      p.client_name,
      p.plan_name,
      p.amount.toFixed(2).replace(".", ","),
      STATUS_CONFIG[p.status].label,
      p.payment_date,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${filterDate.getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
            Financeiro
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Painel de Vendas e Assinaturas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-foreground/90 transition-all border border-transparent"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between bg-card border border-border rounded-[1.25rem] p-3 flex-wrap gap-4 relative z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 pl-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground hidden sm:flex">
            <Filter size={12} className="opacity-80" />
            Filtros
          </div>

          <div className="relative border-r border-[#27282D] pr-4 z-50">
            <button
              onClick={() => setIsPlanDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-muted/40 border border-border hover:bg-muted/80 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-foreground transition-all"
            >
              <span className="truncate max-w-[130px] text-left">
                {filterPlan === "todos"
                  ? "Todos os Planos"
                  : filterPlanOptions.find((o) => o.value === filterPlan)
                      ?.label || filterPlan}
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  "opacity-50 transition-transform duration-200",
                  isPlanDropdownOpen && "rotate-180",
                )}
              />
            </button>

            {isPlanDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsPlanDropdownOpen(false)}
                />
                <div className="absolute top-[calc(100%+8px)] left-0 min-w-[200px] bg-card border border-border rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 p-1.5 flex flex-col gap-1">
                  {filterPlanOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterPlan(opt.value);
                        setPage(1);
                        setIsPlanDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-between",
                        filterPlan === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-[#27282D] hover:text-white",
                      )}
                    >
                      <span>{opt.label}</span>
                      {filterPlan === opt.value && (
                        <CheckCircle2
                          size={12}
                          className="opacity-80 shrink-0"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(["todos", "pago", "inadimplente", "pendente"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => {
                    setFilterStatus(s);
                    setPage(1);
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    filterStatus === s
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {s === "todos" ? "Todos" : STATUS_CONFIG[s].label}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 pr-1 sm:ml-auto">
          {/* Toggle Mensal/Diário */}
          <div className="flex bg-muted/30 border border-border p-1 rounded-xl">
             <button
               onClick={() => setViewMode("monthly")}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                 viewMode === "monthly" ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
               )}
             >
               Mensal
             </button>
             <button
               onClick={() => setViewMode("daily")}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                 viewMode === "daily" ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
               )}
             >
               Diário
             </button>
          </div>

          <div className="flex items-center bg-muted/30 border border-border rounded-xl shadow-sm transition-all focus-within:border-primary/50">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2.5 px-3 rounded-l-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="relative border-l border-r border-border bg-card h-full flex justify-center items-center h-[36px]">
              <DatePicker
                value={filterDate}
                onChange={(d) => {
                  setFilterDate(d);
                  setPage(1);
                }}
                maxDate={new Date()}
              />
            </div>
            <button
              onClick={() => navigateDate("next")}
              disabled={isNextDisabled}
              className="p-2.5 px-3 rounded-r-xl text-muted-foreground hover:text-white hover:bg-[#1A1C20] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Estilo Minimalista/Sleek */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
        {/* Card de Faturamento */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[1.5rem] p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1">
                Faturamento do Mês
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-muted-foreground/60">
                  R$
                </span>
                <p className="text-4xl font-black text-foreground">
                  {totalRevenue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(26,126,251,0.2)]">
              <TrendingUp className="text-primary-foreground w-6 h-6" />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <div className="bg-muted/20 border border-border/50 rounded-xl p-3 flex-1">
              <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">
                Recebido
              </p>
              <p className="text-sm font-black text-primary">
                R${" "}
                {totalRevenue.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="bg-muted/20 border border-border/50 rounded-xl p-3 flex-1">
              <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">
                Pendente
              </p>
              <p className="text-sm font-black text-muted-foreground">
                R${" "}
                {pendingRevenue.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Clientes Ativos */}
        <div className="bg-card border border-border rounded-[1.5rem] p-6 flex flex-col justify-center relative overflow-hidden shadow-sm">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary mb-4">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              Clientes Ativos
            </p>
            <p className="text-4xl font-black text-foreground">{activeClients}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">
                Inadimplentes
              </p>
              <p className="text-3xl font-black text-foreground">
                {defaulters}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20">
              <AlertTriangle size={18} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-1">
                Pendentes
              </p>
              <p className="text-3xl font-black text-foreground">
                {pendingClients}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
              <Clock size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-7 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
            Lista de Pagamentos
          </h3>
        </div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {[
                  "Cliente",
                  "Plano",
                  "Valor",
                  "Status",
                  "Data de Pagamento",
                  "Ações",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27282D]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-20 text-center text-muted-foreground/40 text-xs font-bold uppercase tracking-widest"
                  >
                    <FileCheck className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    Nenhum pagamento encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                paginated.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-[#1A1C20] transition-colors group cursor-default"
                  >
                    {/* Client */}
                    <td className="py-2.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#27282D] border border-white/5 flex items-center justify-center shrink-0">
                          {record.client_avatar ? (
                            <img
                              src={record.client_avatar}
                              className="w-full h-full object-cover"
                              alt={record.client_name}
                            />
                          ) : (
                            <User size={14} className="text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-bold text-xs text-foreground">
                          {record.client_name}
                        </span>
                      </div>
                    </td>
                    {/* Plan */}
                    <td className="py-2.5 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {record.plan_name}
                        </span>
                        {record.isAuto && (
                          <span className="text-[8px] font-black uppercase text-primary/40 tracking-wider">
                            Recorrência
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Amount */}
                    <td className="py-2.5 px-6">
                      <span className="font-bold text-xs text-foreground tracking-tight">
                        R${" "}
                        {record.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="py-2.5 px-6">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border",
                          STATUS_CONFIG[record.status].color,
                        )}
                      >
                        {STATUS_CONFIG[record.status].label}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="py-2.5 px-6 text-[11px] font-bold text-muted-foreground/80">
                      {record.payment_date}
                    </td>
                    {/* Actions */}
                    <td className="py-2.5 px-6">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#27282D] rounded-md transition-all"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                        {profile?.role === "super_admin" && (
                          <>
                            <button
                              onClick={() => {
                                setEditingPayment(record);
                                setIsModalOpen(true);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-[#27282D] rounded-md transition-all"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(record.id)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#27282D]">
          <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">
            Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
            {Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:bg-[#27282D] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={12} />
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-7 h-7 rounded-lg text-[11px] font-bold transition-all",
                  p === page
                    ? "bg-white text-black shadow-none"
                    : "text-muted-foreground hover:bg-[#27282D] hover:text-white",
                )}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:bg-[#27282D] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              Próximo
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0C0D11] border border-[#27282D] p-10 rounded-[2.5rem] shadow-2xl z-[101]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Dialog.Title className="text-xl font-black text-white uppercase">
                  {editingPayment?.id && !editingPayment.id.includes("-") ? "Editar Pagamento" : "Novo Pagamento"}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <X className="cursor-pointer text-muted-foreground hover:text-white" />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Cliente</label>
                <select
                  required
                  value={editingPayment?.client_id || ""}
                  onChange={(e) => {
                    const c = customers.find(x => x.id === e.target.value);
                    setEditingPayment(prev => prev ? { ...prev, client_id: e.target.value, client_name: c?.name || "" } : null);
                  }}
                  className="w-full bg-[#15161A] border border-[#27282D] rounded-xl px-4 py-3 text-white"
                >
                  <option value="">Selecione...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  value={editingPayment?.plan_name || ""}
                  onChange={(e) => setEditingPayment(prev => prev ? { ...prev, plan_name: e.target.value } : null)}
                  className="bg-[#15161A] border border-[#27282D] rounded-xl px-4 py-3 text-white"
                  placeholder="Plano"
                />
                <input
                  type="number"
                  required
                  value={editingPayment?.amount || 0}
                  onChange={(e) => setEditingPayment(prev => prev ? { ...prev, amount: parseFloat(e.target.value) } : null)}
                  className="bg-[#15161A] border border-[#27282D] rounded-xl px-4 py-3 text-white"
                  placeholder="Valor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={editingPayment?.status || "pago"}
                  onChange={(e) => setEditingPayment(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                  className="bg-[#15161A] border border-[#27282D] rounded-xl px-4 py-3 text-white"
                >
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="inadimplente">Inadimplente</option>
                </select>
                <DatePicker
                  value={editingPayment?.payment_date ? (editingPayment.payment_date.includes("/") ? new Date(editingPayment.payment_date.split("/").reverse().join("-")) : new Date(editingPayment.payment_date)) : new Date()}
                  onChange={(d) => setEditingPayment(prev => prev ? { ...prev, payment_date: d ? d.toLocaleDateString("pt-BR") : "" } : null)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={isSaving} className="flex-1 bg-primary text-black py-3 rounded-xl font-bold uppercase text-xs">
                  {isSaving ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ─── Regular User View (histórico pessoal) ─────────────────────────────────
function UserFinanceiro({ profile }: { profile?: any }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("customer_id", profile.id)
        .order("payment_date", { ascending: false });
      
      if (data) {
        setHistory(data.map(p => ({
          id: p.id.slice(0, 8).toUpperCase(),
          date: new Date(p.payment_date).toLocaleDateString("pt-BR"),
          plan: p.plan_name,
          amount: p.amount,
          status: p.status === 'pago' ? 'Pago' : 'Pendente'
        })));
      }
      setLoading(false);
    }
    fetchHistory();
  }, [profile]);

  return (
    <div className="space-y-10 w-full animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 uppercase">
              Histórico de Pagamentos
            </h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-80 mt-1">
              Acompanhe suas faturas e recibos
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-foreground/[0.01]">
                {["Fatura", "Data", "Plano", "Valor", "Status", "Recibo"].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-foreground/[0.03] transition-colors"
                >
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-black text-foreground tracking-wide">
                        #{invoice.id}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-sm font-medium text-muted-foreground">
                    {invoice.date}
                  </td>
                  <td className="py-5 px-8 text-sm font-medium text-muted-foreground">
                    {invoice.plan}
                  </td>
                  <td className="py-5 px-8">
                    <span className="text-sm font-black text-foreground tracking-tight">
                      R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-5 px-8">
                    <span className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border",
                      invoice.status === 'Pago' 
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                        : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                    )}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-5 px-8">
                    <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20">
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && history.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-20 text-center text-muted-foreground/40"
                  >
                    <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">
                      Nenhuma fatura encontrada.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function Payments({ profile }: { profile?: any }) {
  const isSuperAdmin = profile?.role === "super_admin" || profile?.role === "admin";
  return isSuperAdmin ? (
    <AdminFinanceiro profile={profile} />
  ) : (
    <UserFinanceiro profile={profile} />
  );
}
