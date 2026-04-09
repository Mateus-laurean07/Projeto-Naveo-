import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Target,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

// Gera os últimos 6 meses como estrutura base
function getLast6Months(): { name: string; key: string; receita: number }[] {
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      name: months[d.getMonth()],
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      receita: 0,
    });
  }
  return result;
}

export function Dashboard({
  setTab,
  profile,
}: {
  setTab?: (tab: string) => void;
  profile?: any;
}) {
  const [metrics, setMetrics] = useState({
    faturamento: 0,
    recebido: 0,
    pendente: 0,
    novosLeads: 0,
    projetosAtivos: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
  });

  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ name: string; key: string; receita: number }[]>(getLast6Months());

  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    let subLeads: any;
    let subTasks: any;
    let subCustomers: any;

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        // Usa o ownerId correto: admin_id se for membro, senão o próprio id
        const ownerId = profile?.admin_id || data.user.id;

        fetchDashboardData(data.user.id);

        // Inscrição em tempo real para leads (usando o ownerId da equipe)
        subLeads = supabase
          .channel("dashboard-leads")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "leads",
              ...(isSuperAdmin ? {} : { filter: `user_id=eq.${ownerId}` }),
            },
            () => fetchDashboardData(data.user.id),
          )
          .subscribe();

        // Inscrição em tempo real para tarefas (usando o ownerId da equipe)
        subTasks = supabase
          .channel("dashboard-tasks")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tasks",
              ...(isSuperAdmin ? {} : { filter: `user_id=eq.${ownerId}` }),
            },
            () => fetchDashboardData(data.user.id),
          )
          .subscribe();

        // Inscrição em tempo real para clientes (usando o ownerId da equipe)
        subCustomers = supabase
          .channel("dashboard-customers")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "customers",
              ...(isSuperAdmin ? {} : { filter: `user_id=eq.${ownerId}` }),
            },
            () => fetchDashboardData(data.user.id),
          )
          .subscribe();

        return () => {
          if (subLeads) supabase.removeChannel(subLeads);
          if (subTasks) supabase.removeChannel(subTasks);
          if (subCustomers) supabase.removeChannel(subCustomers);
        };
      }
    });
  }, [profile?.id, profile?.admin_id, isSuperAdmin]);

  const fetchDashboardData = async (userId: string) => {
    try {
      let leadsQuery = supabase.from("leads").select("*");
      let tasksQuery = supabase.from("tasks").select("*");
      let customersQuery = supabase.from("customers").select("*");

      // Se não for super admin, filtramos pelo dono do time
      if (!isSuperAdmin) {
        let ownerId = userId;
        if (profile?.admin_id) {
          ownerId = profile.admin_id;
          leadsQuery = leadsQuery.eq("user_id", ownerId);
          tasksQuery = tasksQuery.eq("user_id", ownerId);
          customersQuery = customersQuery.eq("user_id", ownerId);
        } else {
          // Modo Independente: Vê o que é seu (user_id) ou o que você criou
          leadsQuery = leadsQuery.or(
            `user_id.eq.${ownerId},created_by.eq.${ownerId}`,
          );
          tasksQuery = tasksQuery.or(
            `user_id.eq.${ownerId},created_by.eq.${ownerId}`,
          );
          customersQuery = customersQuery.or(
            `user_id.eq.${ownerId},created_by.eq.${ownerId}`,
          );
        }
      }

      // Calcula o intervalo dos últimos 6 meses
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const sixMonthsAgoISO = sixMonthsAgo.toISOString();

      const [
        { data: leadsData },
        { data: tasksData },
        { data: customersData },
        { data: closedLeadsData },
      ] = await Promise.all([
        leadsQuery.order("created_at", { ascending: false }),
        tasksQuery.order("created_at", { ascending: false }),
        customersQuery.order("created_at", { ascending: false }),
        // Busca leads fechados dos últimos 6 meses para o gráfico
        (() => {
          let q = supabase
            .from("leads")
            .select("value, created_at")
            .eq("stage", "Fechado")
            .gte("created_at", sixMonthsAgoISO);
          if (!isSuperAdmin) {
            const ownerId = profile?.admin_id || userId;
            q = q.eq("user_id", ownerId);
          }
          return q;
        })(),
      ]);

      const leadsParams = leadsData || [];
      const tasksParams = tasksData || [];
      const customersParams = customersData || [];

      let receivable = 0;
      let pending = 0;

      leadsParams.forEach((lead) => {
        const valStr = (lead.value || "0").replace(/\D/g, "");
        const val = parseInt(valStr) / 100;
        if (lead.stage === "Fechado") {
          receivable += val;
        } else {
          pending += val;
        }
      });

      const novosLeads = leadsParams.filter(
        (l) => l.stage === "Novo Lead",
      ).length;
      const clientesAtivos = customersParams.filter(
        (c) => (c as any).status !== "Inativo",
      ).length;
      const clientesInativos = customersParams.filter(
        (c) => (c as any).status === "Inativo",
      ).length;
      const projetosAtivos = tasksParams.filter(
        (t) => t.status !== "Concluído",
      ).length;

      setMetrics({
        faturamento: receivable + pending,
        recebido: receivable,
        pendente: pending,
        novosLeads,
        projetosAtivos,
        clientesAtivos,
        clientesInativos,
      });

      setRecentClients(customersParams.slice(0, 5));
      setRecentProjects(tasksParams.slice(0, 5));

      // Monta o gráfico com dados reais dos leads fechados
      const base = getLast6Months();
      (closedLeadsData || []).forEach((lead: any) => {
        const monthKey = lead.created_at?.substring(0, 7); // "YYYY-MM"
        const valStr = (lead.value || "0").replace(/\D/g, "");
        const val = parseInt(valStr) / 100;
        const slot = base.find((b) => b.key === monthKey);
        if (slot) slot.receita += val;
      });
      setChartData(base);
    } catch (e) {
      console.error("Erro ao carregar dados do dashboard");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="space-y-5 pb-5">
      <div className="flex justify-between items-center bg-transparent mb-5 rounded-xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">
            Métricas de desempenho e saúde do negócio
          </p>
        </div>
        <button
          onClick={() => setTab?.("projects")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Novo Projeto
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Faturamento do mês",
            icon: DollarSign,
            value: formatCurrency(metrics.faturamento),
            valueColor: "text-primary",
            iconBg: "bg-accent",
            iconColor: "text-white",
            footerText: `Recebido: ${formatCurrency(metrics.recebido)} | Pendente: ${formatCurrency(metrics.pendente)}`,
          },
          {
            title: "Novos leads",
            icon: Users,
            value: metrics.novosLeads.toString(),
            valueColor: "text-foreground",
            iconBg: "bg-accent",
            iconColor: "text-white",
            footerText: "Leads aguardando contato no CRM",
          },
          {
            title: "Projetos e Pipeline",
            icon: Target,
            value: metrics.projetosAtivos.toString(),
            valueColor: "text-foreground",
            iconBg: "bg-accent",
            iconColor: "text-white",
            footerText: "Tarefas/Projetos ativos em andamento",
          },
          {
            title: "Clientes Ativos / Inativos",
            icon: Users,
            value: `${metrics.clientesAtivos} / ${metrics.clientesInativos}`,
            valueColor: "text-foreground",
            iconBg: "bg-accent",
            iconColor: "text-white",
            footerText: "Taxa de retenção e clientes gerais",
          },
        ].map((metric, i) => {
          // Se for o último card (Clientes Ativos / Inativos), renderizamos o gráfico redondo
          if (i === 3) {
            const hasData =
              metrics.clientesAtivos + metrics.clientesInativos > 0;
            return (
              <div
                key={i}
                className="bg-card p-6 rounded-xl border border-border/60 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users className="w-12 h-12" />
                </div>

                <div className="w-full h-[100px] relative mb-2">
                  {hasData ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Ativos",
                                value: metrics.clientesAtivos,
                                color: "#10b981",
                              },
                              {
                                name: "Inativos",
                                value: metrics.clientesInativos,
                                color: "#ef4444",
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={45}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="transparent"
                          >
                            <Cell fill="#1a7efb" />
                            <Cell fill="#ef4444" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-foreground leading-none">
                          {metrics.clientesAtivos + metrics.clientesInativos}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold border-2 border-dashed border-border/40 rounded-full">
                      SEM DADOS
                    </div>
                  )}
                </div>

                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Clientes Ativos / Inativos
                </h4>

                <div className="flex gap-4 w-full">
                  <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-primary/5 border border-primary/10">
                    <span className="text-[9px] font-black text-primary uppercase">
                      Ativos
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {metrics.clientesAtivos}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="text-[9px] font-black text-red-500 uppercase">
                      Inativos
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {metrics.clientesInativos}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className="bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/40 shadow-xl flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 hover:translate-y-[-4px]"
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${metric.iconBg} ${metric.iconColor} shadow-lg shadow-primary/20 mb-6 group-hover:scale-110 transition-transform`}
                >
                  <metric.icon className="w-6 h-6" />
                </div>
                <h3
                  className={`text-4xl font-black tracking-tighter ${metric.valueColor} truncate drop-shadow-sm`}
                >
                  {metric.value}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-2 mb-4">
                  {metric.title}
                </p>
              </div>
              {metric.footerText && (
                <div className="pt-4 border-t border-border/10 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-auto truncate">
                  {metric.footerText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 grid-cols-12 mt-5">
        <div className="col-span-12 bg-card p-5 rounded-xl border border-border/60 shadow-sm flex flex-col relative w-full overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Análise Financeira Consolidada
              </h2>
              <p className="text-sm font-medium text-muted-foreground/80">
                Últimos 6 meses - Faturamento Total
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-accent" />
          </div>
          <div className="w-full h-[350px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorRe" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--accent))"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--accent))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={true}
                  stroke="currentColor"
                  className="opacity-10 dark:opacity-20"
                />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  itemStyle={{
                    color: "hsl(var(--primary))",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                  }}
                  labelStyle={{
                    color: "#fff",
                    fontWeight: "900",
                    marginBottom: "4px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRe)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 mt-5">
        {/* Projetos Recentes */}
        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Projetos Recentes
            </h3>
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Target className="w-4 h-4" />
            </div>
          </div>

          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-foreground/5 transition-colors cursor-pointer"
                  onClick={() => setTab?.("projects")}
                >
                  <div className="flex gap-4 items-center overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold shrink-0">
                      {(project.title || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-sm truncate">
                        {project.title || "Sem título"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {project.project || "Sem cliente vinculado"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-accent/10 text-accent">
                      {project.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {new Date(project.created_at).toLocaleDateString(
                        "pt-BR",
                        { day: "2-digit", month: "short" },
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-background/30 rounded-xl border border-border/30">
              <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mb-3 text-muted-foreground">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground/80">
                Nenhum projeto recente
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Comece criando tarefas para ver seus projetos aqui
              </p>
            </div>
          )}
        </div>

        {/* Clientes Recentes */}
        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Clientes Recentes
            </h3>
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Users className="w-4 h-4" />
            </div>
          </div>

          {recentClients.length > 0 ? (
            <div className="space-y-4">
              {recentClients.map((client, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-foreground/5 transition-colors cursor-pointer"
                  onClick={() => setTab?.("crm")}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold shrink-0">
                      {(client.name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-sm flex items-center gap-2 truncate">
                        {client.name || "Sem nome"}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {client.company || "Pessoa Física"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                        client.status === "Ativo"
                          ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_10px_rgba(26,126,251,0.1)]"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}
                    >
                      {client.status || "Ativo"}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {client.created_at
                        ? new Date(client.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )
                        : "Data N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-background/30 rounded-xl border border-border/30">
              <div className="w-12 h-12 bg-foreground/5 rounded-full flex items-center justify-center mb-3 text-muted-foreground">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground/80">
                Novo lead capturado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Os leads do CRM aparecerão aqui
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
