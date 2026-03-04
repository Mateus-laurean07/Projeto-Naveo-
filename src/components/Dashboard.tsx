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

const data = [
  { name: "Jan", receita: 4000, despesa: 2400 },
  { name: "Fev", receita: 3000, despesa: 1398 },
  { name: "Mar", receita: 9000, despesa: 5800 },
  { name: "Abr", receita: 2780, despesa: 3908 },
  { name: "Mai", receita: 8890, despesa: 4800 },
  { name: "Jun", receita: 12390, despesa: 3800 },
];

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

  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    let subLeads: any;
    let subTasks: any;

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const userId = data.user.id;
        fetchDashboardData(userId);

        // Inscrição em tempo real para leads
        subLeads = supabase
          .channel("dashboard-leads")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "leads",
              ...(isSuperAdmin ? {} : { filter: `user_id=eq.${userId}` }),
            },
            () => fetchDashboardData(userId),
          )
          .subscribe();

        // Inscrição em tempo real para tarefas
        subTasks = supabase
          .channel("dashboard-tasks")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tasks",
              ...(isSuperAdmin ? {} : { filter: `user_id=eq.${userId}` }),
            },
            () => fetchDashboardData(userId),
          )
          .subscribe();
      }
    });

    return () => {
      if (subLeads) supabase.removeChannel(subLeads);
      if (subTasks) supabase.removeChannel(subTasks);
    };
  }, [isSuperAdmin]);

  const fetchDashboardData = async (userId: string) => {
    try {
      let leadsQuery = supabase.from("leads").select("*");
      let tasksQuery = supabase.from("tasks").select("*");

      if (!isSuperAdmin) {
        leadsQuery = leadsQuery.eq("user_id", userId);
        tasksQuery = tasksQuery.eq("user_id", userId);
      }

      const { data: leadsData } = await leadsQuery.order("created_at", {
        ascending: false,
      });
      const { data: tasksData } = await tasksQuery.order("created_at", {
        ascending: false,
      });

      const leadsParams = leadsData || [];
      const tasksParams = tasksData || [];

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
      const clientesAtivos = leadsParams.filter(
        (l) => l.stage === "Fechado",
      ).length;
      const clientesInativos = leadsParams.filter(
        (l) => l.stage !== "Fechado",
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

      setRecentClients(leadsParams.slice(0, 5));
      setRecentProjects(tasksParams.slice(0, 5));
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
            Análise consolidada (Acesso Admin)
          </p>
        </div>
        <button
          onClick={() => setTab?.("projects")}
          className="bg-accent hover:bg-accent/80 text-foreground px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-[0_0_15px_hsl(var(--accent))/30] transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Novo Projeto
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Faturamento do mês",
            icon: DollarSign,
            value: formatCurrency(metrics.faturamento),
            valueColor: "text-emerald-500",
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
                            <Cell fill="#10b981" />
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
                  <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[9px] font-black text-emerald-500 uppercase">
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
              className="bg-card p-5 rounded-xl border border-border/60 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.iconBg} ${metric.iconColor} shadow-md shadow-accent/20 mb-4`}
                >
                  <metric.icon className="w-5 h-5" />
                </div>
                <h3
                  className={`text-3xl font-extrabold ${metric.valueColor} truncate`}
                >
                  {metric.value}
                </h3>
                <p className="text-sm font-semibold text-muted-foreground mt-2 mb-4">
                  {metric.title}
                </p>
              </div>
              {metric.footerText && (
                <div className="pt-4 border-t border-border/40 text-xs font-semibold text-muted-foreground/80 mt-auto truncate">
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
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
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
                    backgroundColor: "#1e1e24",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
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
                      {project.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-sm truncate">
                        {project.title}
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
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-sm flex items-center gap-2 truncate">
                        {client.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {client.company || "Pessoa Física"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-foreground/10 text-foreground/80">
                      {client.stage}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {new Date(client.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
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
