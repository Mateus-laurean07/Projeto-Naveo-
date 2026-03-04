import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  LayoutGrid,
  CalendarDays,
  AlignJustify,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

// Feriados Nacionais (Dinâmico para o ano atual e seguintes)
const getHolidays = (year: number) => ({
  [`${year}-01-01`]: "Confraternização Universal",
  [`${year}-02-17`]: "Carnaval (Exemplo)", // Datas móveis simplificadas
  [`${year}-04-03`]: "Sexta-feira Santa (Exemplo)",
  [`${year}-04-21`]: "Tiradentes",
  [`${year}-05-01`]: "Dia do Trabalhador",
  [`${year}-09-07`]: "Independência do Brasil",
  [`${year}-10-12`]: "Nossa Senhora Aparecida",
  [`${year}-11-02`]: "Finados",
  [`${year}-11-15`]: "Proclamação da República",
  [`${year}-12-25`]: "Natal",
});

type Task = {
  id: string;
  title: string;
  project: string;
  status: "Backlog" | "Em Andamento" | "Revisão" | "Concluído";
  priority: "Baixa" | "Média" | "Alta";
  due_date?: string | null;
};

export function Agenda({ profile }: { profile?: any }) {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showHolidays, setShowHolidays] = useState(true);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    fetchTasks();
    checkGoogleConnection();
  }, []);

  const checkGoogleConnection = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.provider_token) {
      setIsGoogleConnected(true);
      fetchGoogleEvents(session.provider_token);
    }
  };

  const handleConnectGoogle = async () => {
    // Inicia o fluxo de OAuth do Supabase com o escopo do Google Calendar
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Erro ao conectar Google:", error.message);
    }
  };

  const fetchGoogleEvents = async (token: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.items) {
        setGoogleEvents(data.items);
      }
    } catch (err) {
      console.error("Erro ao buscar eventos do Google:", err);
    }
  };

  const fetchTasks = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    setLoading(true);
    let query = supabase.from("tasks").select("*").not("due_date", "is", null);

    if (profile?.role !== "super_admin") {
      query = query.eq("user_id", userData.user.id);
    }

    const { data } = await query;

    if (data) setTasks(data);
    setLoading(false);
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Calendar Logic
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    if (day > 0 && day <= daysInMonth) return day;
    return null;
  });

  const monthNames = [
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
  const year = currentMonth.getFullYear();
  const monthName = monthNames[currentMonth.getMonth()];

  // Feriados do ano atual
  const holidaysList = getHolidays(year);

  // Helper para comparar datas desconsiderando timezone issues
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Encontrar eventos do dia selecionado
  const selectedDateStr = getDateString(selectedDate);
  const tasksForSelected = tasks.filter((t) => t.due_date === selectedDateStr);

  // Filtrar eventos do Google para o dia selecionado
  const googleEventsForSelected = googleEvents.filter((event) => {
    const eventDate = event.start?.dateTime
      ? event.start.dateTime.split("T")[0]
      : event.start?.date;
    return eventDate === selectedDateStr;
  });

  const holidayForSelected = holidaysList[selectedDateStr];

  // Estatisticas do mes atual
  const currentMonthStrPrefix = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const tasksInMonth = tasks.filter((t) =>
    t.due_date?.startsWith(currentMonthStrPrefix),
  );
  const highPriorityTasks = tasksInMonth.filter((t) => t.priority === "Alta");

  let holidaysInMonthCount = 0;
  if (showHolidays) {
    Object.keys(holidaysList).forEach((date) => {
      if (date.startsWith(currentMonthStrPrefix)) holidaysInMonthCount++;
    });
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Timeline de Projetos
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualização completa de todas as etapas e prazos
        </p>
      </div>

      <div
        className={cn(
          "flex bg-card border border-border/40 rounded-xl p-6 items-center justify-between",
          isGoogleConnected && "border-primary/20 bg-primary/5",
        )}
      >
        <div className="flex items-center space-x-4">
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
              isGoogleConnected
                ? "bg-primary text-black"
                : "bg-accent/10 text-foreground/50",
            )}
          >
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              Google Calendar
              {isGoogleConnected && (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isGoogleConnected
                ? "Sincronizado com sucesso"
                : "Conecte para sincronizar eventos"}
            </p>
          </div>
        </div>
        {!isGoogleConnected ? (
          <button
            onClick={handleConnectGoogle}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="text-black">Conectar</span>
          </button>
        ) : (
          <div className="text-xs font-bold text-primary uppercase tracking-wider bg-black/40 px-3 py-1.5 rounded-full">
            Conectado
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4">
            <div className="flex items-center bg-card border border-border/40 rounded-lg p-1">
              <button
                onClick={() => setView("month")}
                className={cn(
                  "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  view === "month"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Mês</span>
              </button>
              <button
                onClick={() => setView("week")}
                className={cn(
                  "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  view === "week"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Semana</span>
              </button>
              <button
                onClick={() => setView("day")}
                className={cn(
                  "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  view === "day"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                <AlignJustify className="w-4 h-4" />
                <span>Dia</span>
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-5 py-2 text-sm font-medium bg-card border border-border/40 hover:bg-muted/50 rounded-lg transition-colors"
            >
              Hoje
            </button>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground capitalize">
                {monthName} {year}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors bg-black/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors bg-black/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 pl-1">
              <div className="flex items-center space-x-2 text-sm text-accent font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Mostrar Feriados</span>
              </div>
              <button
                onClick={() => setShowHolidays(!showHolidays)}
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  showHolidays
                    ? "bg-accent border-accent border-2"
                    : "bg-muted border-border/40 border-2",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-[#121212] transition-transform absolute top-[2px]",
                    showHolidays
                      ? "translate-x-4 border-none"
                      : "translate-x-0.5 bg-foreground",
                  )}
                />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-4 text-center">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="text-sm font-medium text-muted-foreground pb-4"
                >
                  {day}
                </div>
              ))}

              {days.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-16" />;
                }

                const currentCellDate = new Date(
                  year,
                  currentMonth.getMonth(),
                  day,
                );
                const isSelected = isSameDay(currentCellDate, selectedDate);
                const dateStr = getDateString(currentCellDate);
                const hasHoliday = showHolidays && holidaysList[dateStr];
                const hasTask = tasks.some((t) => t.due_date === dateStr);

                return (
                  <div
                    key={idx}
                    className="h-16 flex items-start justify-center relative"
                  >
                    <div
                      onClick={() => setSelectedDate(currentCellDate)}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium relative group cursor-pointer transition-all",
                        isSelected
                          ? "bg-accent text-accent-foreground w-16 h-16 rounded-xl mt-[-12px] shadow-lg shadow-accent/20 scale-110 z-10"
                          : "text-foreground hover:bg-muted/30",
                      )}
                    >
                      {day}

                      {/* Dots indicators */}
                      <div
                        className={cn(
                          "absolute flex gap-1",
                          isSelected ? "bottom-2" : "bottom-1",
                        )}
                      >
                        {hasHoliday && (
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected
                                ? "bg-accent-foreground/50"
                                : "bg-accent",
                            )}
                          />
                        )}
                        {hasTask && (
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isSelected ? "bg-white" : "bg-emerald-500",
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border/40 rounded-xl p-6 min-h-[180px]">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">
                {selectedDate.getDate()} de{" "}
                {monthNames[selectedDate.getMonth()]}
              </h3>
            </div>

            <div className="space-y-3">
              {showHolidays && holidayForSelected && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-accent">
                      {holidayForSelected}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Feriado/Data Comemorativa
                    </p>
                  </div>
                </div>
              )}

              {tasksForSelected.length > 0 &&
                tasksForSelected.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/40"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        t.priority === "Alta"
                          ? "bg-red-500"
                          : t.priority === "Média"
                            ? "bg-amber-500"
                            : "bg-emerald-500",
                      )}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-foreground">
                        {t.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Projeto: {t.project}
                      </p>
                    </div>
                  </div>
                ))}

              {isGoogleConnected &&
                googleEventsForSelected.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <CalendarIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-white/90">
                        {event.summary}
                      </h4>
                      <p className="text-xs text-primary/60 mt-0.5 capitalize">
                        {event.start?.dateTime
                          ? new Date(event.start.dateTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "Dia inteiro"}{" "}
                        (Google)
                      </p>
                    </div>
                  </div>
                ))}

              {(!holidayForSelected || !showHolidays) &&
                tasksForSelected.length === 0 &&
                googleEventsForSelected.length === 0 && (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground/60 py-4">
                    Nenhum evento para esta data
                  </div>
                )}
            </div>
          </div>

          <div className="bg-card border border-border/40 rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-6">
              Resumo do Mês
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tarefas</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {tasksInMonth.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Alta Prioridade
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {highPriorityTasks.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Feriados</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {holidaysInMonthCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
