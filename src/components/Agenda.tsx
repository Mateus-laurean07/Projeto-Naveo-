import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  LayoutGrid,
  CalendarDays,
  AlignJustify,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

// Feriados Nacionais Fixos
const getHolidays = (year: number) => ({
  [`${year}-01-01`]: "Confraternização Universal",
  [`${year}-04-21`]: "Tiradentes",
  [`${year}-05-01`]: "Dia do Trabalhador",
  [`${year}-09-07`]: "Independência do Brasil",
  [`${year}-10-12`]: "Nossa Senhora Aparecida",
  [`${year}-11-02`]: "Finados",
  [`${year}-11-15`]: "Proclamação da República",
  [`${year}-11-20`]: "Dia Nacional de Zumbi e da Consciência Negra",
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

export function Agenda({ 
  profile, 
  onNavigateToProject 
}: { 
  profile?: any;
  onNavigateToProject?: (searchTerm: string) => void;
}) {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showHolidays, setShowHolidays] = useState(true);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  useEffect(() => {
    resolveTeam();
  }, [profile?.id, profile?.admin_id]);

  const resolveTeam = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let ownerId = profile?.id || user.id;
    if (profile?.admin_id) {
      ownerId = profile.admin_id;
    }
    setTeamOwnerId(ownerId);
    fetchTasks(ownerId);
  };

  useEffect(() => {
    if (!teamOwnerId) return;

    const channel = supabase
      .channel("agenda-realtime")
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

  const fetchTasks = async (ownerId: string) => {
    setLoading(true);
    let query = supabase.from("tasks").select("*").not("due_date", "is", null);

    if (profile?.admin_id) {
      query = query.eq("user_id", profile.admin_id);
    } else {
      query = query.or(`user_id.eq.${ownerId},created_by.eq.${ownerId}`);
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
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

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
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const year = currentMonth.getFullYear();
  const monthName = monthNames[currentMonth.getMonth()];
  const holidaysList = getHolidays(year);

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

  const selectedDateStr = getDateString(selectedDate);
  const tasksForSelected = tasks.filter((t) => t.due_date === selectedDateStr);
  const holidayForSelected = holidaysList[selectedDateStr];

  const upcomingTasks = [...tasks]
    .filter(
      (t) => t.due_date && t.due_date >= today.toISOString().split("T")[0],
    )
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
    .slice(0, 3);

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase leading-none">
          Agenda{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Netuno
          </span>
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-2">
          Visualização completa de todas as etapas e prazos da sua missão
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-foreground capitalize tracking-tighter">
                {monthName} <span className="text-primary">{year}</span>
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToToday}
                  className="px-4 h-10 flex items-center justify-center rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-border/40 text-[10px] font-black uppercase tracking-widest"
                >
                  Hoje
                </button>
                <button
                  onClick={prevMonth}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-border/40"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-border/40"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 pl-1">
              <div className="flex items-center space-x-2 text-[10px] text-primary font-black uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                <span>Mostrar Feriados Nacionais</span>
              </div>
              <button
                onClick={() => setShowHolidays(!showHolidays)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative overflow-hidden",
                  showHolidays
                    ? "bg-primary shadow-lg shadow-primary/20"
                    : "bg-muted border border-border/40",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full transition-transform absolute top-1",
                    showHolidays
                      ? "translate-x-7 bg-primary-foreground"
                      : "translate-x-1 bg-muted-foreground",
                  )}
                />
              </button>
            </div>

            <div className="grid grid-cols-7 border-t border-l border-border/40 rounded-sm overflow-hidden min-h-[500px]">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest py-4 text-center border-r border-b border-border/40 bg-muted/5 shadow-inner"
                >
                  {day}
                </div>
              ))}

              {days.map((day, idx) => {
                if (!day) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="min-h-[100px] border-r border-b border-border/40 bg-muted/5 opacity-40" 
                    />
                  );
                }

                const currentCellDate = new Date(
                  year,
                  currentMonth.getMonth(),
                  day,
                );
                const isSelected = isSameDay(currentCellDate, selectedDate);
                const isCurrentDay = isSameDay(currentCellDate, today);
                const dateStr = getDateString(currentCellDate);
                const hasHoliday = showHolidays && holidaysList[dateStr];
                const dayTasks = tasks.filter((t) => t.due_date === dateStr);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(currentCellDate)}
                    className={cn(
                      "min-h-[100px] flex flex-col items-stretch p-2 relative border-r border-b border-border/40 cursor-pointer transition-all hover:bg-primary/5",
                      isSelected ? "bg-primary/[0.07] ring-1 ring-inset ring-primary/30 z-10" : "bg-card/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span
                        className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110"
                            : isCurrentDay
                              ? "bg-primary/20 text-primary"
                              : "text-foreground/70",
                        )}
                      >
                        {day}
                      </span>
                      {hasHoliday && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" 
                          title={holidaysList[dateStr]}
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 overflow-hidden mt-auto">
                      {dayTasks.slice(0, 3).map((t, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 w-full rounded-full shrink-0",
                            t.priority === "Alta"
                              ? "bg-red-500"
                              : t.priority === "Média"
                                ? "bg-amber-500"
                                : "bg-primary"
                          )}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[8px] font-black text-muted-foreground/60 text-center uppercase tracking-tighter">
                          +{dayTasks.length - 3}
                        </span>
                      )}
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
                {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </h3>
            </div>

            <div className="space-y-3">
              {showHolidays && holidayForSelected && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-accent">{holidayForSelected}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Feriado Nacional</p>
                  </div>
                </div>
              )}

              {tasksForSelected.length > 0 ? (
                tasksForSelected.map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigateToProject?.(t.title)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl bg-background/50 border-l-4 transition-all hover:bg-background/80 cursor-pointer active:scale-[0.98]",
                      t.priority === "Alta"
                        ? "border-l-red-500 bg-red-500/5 shadow-sm"
                        : t.priority === "Média"
                          ? "border-l-amber-500 bg-amber-500/5 shadow-sm"
                          : "border-l-primary bg-primary/5 shadow-sm",
                    )}
                  >
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full mt-1 shrink-0",
                      t.priority === "Alta" ? "bg-red-500" : t.priority === "Média" ? "bg-amber-500" : "bg-primary"
                    )} />
                    <div>
                      <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{t.title}</h4>
                      <p className="text-[10px] font-black uppercase text-muted-foreground/60 mt-1">Projeto: {t.project}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground/60 text-center py-4">
                  Nenhum evento para esta data
                </div>
              )}
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Próximos Compromissos
            </h3>

            <div className="space-y-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((t, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onNavigateToProject?.(t.title)}
                    className="group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">
                        {t.due_date?.split("-").reverse().slice(0, 2).join("/")}
                      </span>
                      <span className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded-md uppercase",
                        t.priority === "Alta" ? "bg-red-500/10 text-red-500" : t.priority === "Média" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                      )}>
                        {t.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {t.title}
                    </h4>
                    <div className="w-full h-[1px] bg-border/40 mt-3 group-last:hidden" />
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma tarefa futura</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
