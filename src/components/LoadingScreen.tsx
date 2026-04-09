import React from "react";
import { cn } from "../lib/utils";
import { TridentLogo } from "./Logo";
import { useTheme } from "./ThemeProvider";

/**
 * LoadingScreen - Cinematic Premium Experience
 */
export function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center loading-bg-deep overflow-hidden">
      {/* Atmosfera Subaquática (Ciclone de energia teal) */}
      <div className="cyclone-container opacity-40">
        <div className="swirl-wave border-t border-primary/20"></div>
        <div className="swirl-wave border-r border-primary/10 animate-reverse"></div>

        {/* Partículas de Luz (Energia Netuno) */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="foam-particle bg-primary/40 blur-[2px]"
            style={
              {
                "--rot": `${i * 18}deg`,
                animationDelay: `${i * 0.15}s`,
                width: i % 2 === 0 ? "4px" : "2px",
                height: i % 2 === 0 ? "4px" : "2px",
              } as any
            }
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-12 z-20">
        {/* Logo do Tridente (Design Unificado & Sombra Premium) */}
        <div
          className={cn(
            "relative animate-bounce-slow flex items-center justify-center rounded-[4.5rem] shadow-2xl overflow-hidden",
            theme === "dark" ? "bg-primary shadow-primary/20" : "bg-[#1a7efb] shadow-blue-500/20"
          )}
          style={{ width: 256, height: 256 }}
        >
          <TridentLogo className="w-full h-full" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <h3 className={cn(
              "text-3xl font-black uppercase tracking-[1em] mb-2 translate-x-[0.5em]",
              theme === "dark"
                ? "text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                : "text-[#1a7efb] drop-shadow-[0_0_20px_rgba(26,126,251,0.4)]"
            )}>
              Naveo
            </h3>
            <div className={cn(
              "h-[1px] w-64 bg-gradient-to-r from-transparent to-transparent",
              theme === "dark" ? "via-primary/50" : "via-[#1a7efb]/50"
            )} />
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-ping", theme === "dark" ? "bg-primary" : "bg-[#1a7efb]")} />
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-[0.8em]",
              theme === "dark" ? "text-primary/60" : "text-[#1a7efb]/60"
            )}>
              Despertando a Inteligência
            </p>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-ping delay-300", theme === "dark" ? "bg-primary" : "bg-[#1a7efb]")} />
          </div>
        </div>
      </div>

      {/* Sombras de borda cinematográfica */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,1)] pointer-events-none" />
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
