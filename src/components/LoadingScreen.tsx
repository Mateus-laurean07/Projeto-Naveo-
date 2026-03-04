import React from "react";
import { cn } from "../lib/utils";

const TridentLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn(className)}>
    <defs>
      <linearGradient id="trident-fill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
    </defs>

    {/* Corpo Unificado do Tridente (High Detail) */}
    <g fill="#000" stroke="url(#trident-fill)" strokeWidth="0.2">
      {/* Lâmina Central */}
      <path d="M12 1L13.8 7L12 8.5L10.2 7L12 1Z" />

      {/* Lâminas Laterais e Cabeça (Forma integrada) */}
      <path d="M12 9.5C12 9.5 13.5 10 15 10C16.5 10 18.5 8.5 19.5 4.5L16 9C15.5 10 14.5 11 12.5 11.5L11.5 11.5C9.5 11 8.5 10 8 9L4.5 4.5C5.5 8.5 7.5 10 9 10C10.5 10 12 9.5 12 9.5Z" />

      {/* Ornamentos de Transição */}
      <circle cx="12" cy="11.5" r="1.5" className="animate-pulse-inner" />
    </g>

    {/* Cabo Integrado (Solid Black with Gold edge) */}
    <rect
      x="11.5"
      y="11.8"
      width="1"
      height="11"
      rx="0.3"
      fill="#000"
      stroke="url(#trident-fill)"
      strokeWidth="0.1"
    />

    {/* Detalhes de Aço no Cabo */}
    <rect
      x="11.3"
      y="14"
      width="1.4"
      height="0.4"
      rx="0.1"
      fill="url(#trident-fill)"
    />
    <rect
      x="11.3"
      y="18"
      width="1.4"
      height="0.4"
      rx="0.1"
      fill="url(#trident-fill)"
    />
  </svg>
);

/**
 * LoadingScreen - Cinematic Premium Experience
 */
export function LoadingScreen() {
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
        <div className="relative animate-bounce-slow trident-premium-glow">
          <TridentLogo className="w-56 h-56" />

          {/* Pulsação de Energia atrás do Tridente */}
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px] animate-pulse pointer-events-none" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <h3 className="text-2xl font-black uppercase tracking-[1em] text-white/90 mb-2 translate-x-[0.5em]">
              Netuno
            </h3>
            <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-1 h-1 bg-primary rounded-full animate-ping" />
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.5em]">
              Despertando o Oceano
            </p>
            <span className="w-1 h-1 bg-primary rounded-full animate-ping delay-300" />
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
