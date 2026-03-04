import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "../lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Escuro", icon: Moon },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">
          APARÊNCIA
        </h2>
        <p className="text-muted-foreground">
          Escolha o tema que melhor combina com seu estilo de trabalho.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "relative flex flex-col items-center gap-6 p-8 rounded-[32px] border-2 transition-all duration-500 group overflow-hidden",
              theme === t.id
                ? "border-accent bg-accent/5 shadow-2xl shadow-accent/10 scale-[1.02]"
                : "border-border/40 hover:border-accent/30 bg-card/40 hover:bg-card/60",
            )}
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div
              className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-lg",
                theme === t.id
                  ? "bg-accent text-foreground rotate-0 scale-110"
                  : "bg-card text-muted-foreground rotate-[-10deg] group-hover:rotate-0",
              )}
            >
              <t.icon
                size={36}
                className={theme === t.id ? "animate-pulse" : ""}
              />
            </div>

            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "text-lg font-black tracking-tight transition-colors",
                  theme === t.id
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground/80",
                )}
              >
                {t.label}
              </span>
              {theme === t.id && (
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest px-2 py-0.5 bg-accent/10 rounded-full">
                  Ativo
                </span>
              )}
            </div>

            {/* Selection indicator */}
            {theme === t.id && (
              <div className="absolute top-4 right-4 w-3 h-3 bg-accent rounded-full shadow-[0_0_10px_hsl(var(--accent))]" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-[32px] bg-accent/5 border border-accent/20 flex items-center gap-6 group">
        <div className="w-14 h-14 rounded-2xl bg-accent text-foreground flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
          <Monitor size={28} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-foreground">
            Sincronização Automática
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O sistema pode se adaptar automaticamente às configurações do seu
            sistema operacional para reduzir o cansaço visual.
          </p>
        </div>
      </div>
    </div>
  );
}
