import React, { useState, useEffect, useCallback } from "react";
import { TridentLogo } from "./Logo";
import { cn } from "../lib/utils";
import { useTheme } from "./ThemeProvider";

export function IdleScreen() {
  const { theme } = useTheme();
  const [isIdle, setIsIdle] = useState(false);
  const [showWaves, setShowWaves] = useState(false);
  const IDLE_TIMEOUT = 60000;

  const isDark = theme === "dark";

  const resetIdleTimer = useCallback(() => {
    if (isIdle) {
      setIsIdle(false);
      setShowWaves(false);
    }
  }, [isIdle]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleActivity = () => {
      resetIdleTimer();
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
    };
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((e) => document.addEventListener(e, handleActivity));
    timeoutId = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
    return () => {
      events.forEach((e) => document.removeEventListener(e, handleActivity));
      clearTimeout(timeoutId);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    if (isIdle) {
      const timer = setTimeout(() => setShowWaves(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isIdle]);

  if (!isIdle) return null;

  // Paleta de cores do tema
  const c = isDark
    ? {
        w1: "rgba(1,12,200,0.15)",
        w2: "rgba(1,50,250,0.25)",
        w3: "rgba(26,126,251,0.38)",
        foam: "rgba(120,200,255,0.55)",
        deep: "#020617",
        mid: "rgba(1,10,100,0.9)",
        surface: "rgba(26,126,251,0.3)",
        glow: "rgba(26,126,251,0.4)",
        text: "hsl(var(--primary))",
        shadow: "rgba(26,126,251,0.5)",
      }
    : {
        w1: "rgba(1,12,200,0.15)",
        w2: "rgba(26,126,251,0.28)",
        w3: "rgba(56,150,255,0.42)",
        foam: "rgba(180,220,255,0.65)",
        deep: "#010618",
        mid: "rgba(1,10,100,0.9)",
        surface: "rgba(26,126,251,0.4)",
        glow: "rgba(96,165,250,0.4)",
        text: "#1a7efb",
        shadow: "rgba(26,126,251,0.5)",
      };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-end overflow-hidden pointer-events-auto transition-all duration-1000",
        showWaves
          ? "bg-[#020617]/85 backdrop-blur-md"
          : "bg-transparent backdrop-blur-0",
      )}
      onClick={resetIdleTimer}
    >
      {/* Container principal que sobe */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[2500ms] ease-out flex flex-col justify-end",
          showWaves ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Logo flutuando acima das ondas */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 bottom-[30%] transition-all duration-[3000ms] ease-out flex flex-col items-center gap-8 z-50",
            showWaves
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-40 scale-50",
          )}
        >
          <div className="relative group">
            <div
              className="absolute -inset-20 rounded-full blur-[100px] animate-pulse"
              style={{
                background: isDark
                  ? "rgba(26,126,251,0.2)"
                  : "rgba(26,126,251,0.25)",
              }}
            />
            <div
              className={cn(
                "relative flex items-center justify-center rounded-[4rem] overflow-hidden shadow-2xl",
                isDark ? "bg-primary" : "bg-[#1a7efb]",
              )}
              style={{
                width: 280,
                height: 280,
                boxShadow: `0 0 60px ${c.glow}`,
              }}
            >
              <TridentLogo className="w-full h-full animate-bounce-slow" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <h1
              className="text-6xl font-black tracking-[-0.05em] uppercase"
              style={{ color: "#fff", textShadow: `0 0 30px ${c.shadow}` }}
            >
              NETUNO
            </h1>
            <div
              className="w-32 h-0.5 my-5"
              style={{
                background: `linear-gradient(to right, transparent, ${c.text}, transparent)`,
              }}
            />
            <p
              className="text-xs font-black uppercase tracking-[0.8em] animate-pulse"
              style={{ color: "rgba(26,126,251,0.5)" }}
            >
              Clique para continuar
            </p>
          </div>
        </div>

        {/* === SURF WAVE STACK === */}
        <div className="relative w-full h-[75vh] overflow-hidden">
          {/* ONDA 1 - Swell profundo */}
          <svg
            className="surf-wave-1 absolute bottom-0 w-full h-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,120 C180,140 360,80 540,100 C720,120 900,160 1080,130 C1260,100 1350,80 1440,90 L1440,200 L0,200 Z"
              style={{ fill: c.w1 }}
            />
          </svg>

          {/* ONDA 2 - Meio com swell */}
          <svg
            className="surf-wave-2 absolute bottom-0 w-full h-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,100 C120,70 240,130 400,90 C560,50 720,140 900,110 C1080,80 1260,130 1440,100 L1440,200 L0,200 Z"
              style={{ fill: c.w2 }}
            />
          </svg>

          {/* ONDA 3 - Primeiro plano, mais dinâmica */}
          <svg
            className="surf-wave-3 absolute bottom-0 w-full h-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,80 C200,40 300,130 500,70 C700,10 850,150 1050,80 C1250,10 1380,100 1440,70 L1440,200 L0,200 Z"
              style={{ fill: c.w3 }}
            />
          </svg>

          {/* ONDA SURF - A quebrante / foam (espuma de cima) */}
          <svg
            className="surf-wave-break absolute bottom-0 w-full h-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
          >
            {/* Corpo principal da onda de surf */}
            <path
              d="M0,55 C100,25 200,65 320,35 C440,5 560,75 700,40 C840,5 960,80 1100,45 C1240,10 1360,60 1440,45 L1440,200 L0,200 Z"
              style={{ fill: c.foam, opacity: 0.6 }}
            />
            {/* Crista da onda (foam line) */}
            <path
              d="M0,55 C100,25 200,65 320,35 C440,5 560,75 700,40 C840,5 960,80 1100,45 C1240,10 1360,60 1440,45"
              fill="none"
              stroke={c.foam}
              strokeWidth="3"
              opacity="0.8"
            />
          </svg>

          {/* SPRAY - Espuma extra nas cristas */}
          <svg
            className="surf-spray absolute bottom-0 w-full h-full"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,50 C80,20 160,55 280,28 C400,1 500,70 640,35 C780,0 900,75 1040,40 C1180,5 1320,55 1440,40 L1440,200 L0,200 Z"
              style={{ fill: "rgba(255,255,255,0.15)" }}
            />
          </svg>

          {/* OCEANO PROFUNDO */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[38vh]"
            style={{
              background: `linear-gradient(to top, ${c.deep}, ${c.mid}, ${c.surface})`,
            }}
          >
            {/* Brilho da superfície */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] blur-sm"
              style={{ background: c.glow }}
            />
            {/* Brilho interno */}
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 60%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ANIMAÇÕES CSS de Surf */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Swell lento de fundo */
        @keyframes surf-swell {
          0%   { transform: translateX(0) scaleY(1); }
          25%  { transform: translateX(-80px) scaleY(1.15); }
          50%  { transform: translateX(-160px) scaleY(0.9); }
          75%  { transform: translateX(-80px) scaleY(1.1); }
          100% { transform: translateX(0) scaleY(1); }
        }

        /* Onda média com curva */
        @keyframes surf-roll {
          0%   { transform: translateX(0) scaleY(1); }
          30%  { transform: translateX(-120px) scaleY(1.25); }
          60%  { transform: translateX(-200px) scaleY(0.85); }
          80%  { transform: translateX(-120px) scaleY(1.2); }
          100% { transform: translateX(0) scaleY(1); }
        }

        /* Onda de frente, rápida e agitada */
        @keyframes surf-break {
          0%   { transform: translateX(0)    scaleY(1)    skewX(0deg); }
          20%  { transform: translateX(-60px)  scaleY(1.4)  skewX(-2deg); }
          45%  { transform: translateX(-160px) scaleY(0.8)  skewX(1deg); }
          65%  { transform: translateX(-230px) scaleY(1.5)  skewX(-3deg); }
          80%  { transform: translateX(-170px) scaleY(0.9)  skewX(2deg); }
          100% { transform: translateX(0)    scaleY(1)    skewX(0deg); }
        }

        /* Onda quebrante */
        @keyframes surf-crash {
          0%   { transform: translateX(160px) scaleY(1.1); opacity: 0.6; }
          35%  { transform: translateX(0px)   scaleY(1.5); opacity: 0.8; }
          60%  { transform: translateX(-120px) scaleY(0.8); opacity: 0.5; }
          85%  { transform: translateX(-220px) scaleY(1.3); opacity: 0.7; }
          100% { transform: translateX(160px) scaleY(1.1); opacity: 0.6; }
        }

        /* Spray das cristas */
        @keyframes surf-spray {
          0%   { transform: translateX(200px) scaleY(0.8); opacity: 0.1; }
          30%  { transform: translateX(60px)  scaleY(1.3); opacity: 0.2; }
          55%  { transform: translateX(-80px) scaleY(0.7); opacity: 0.1; }
          80%  { transform: translateX(-200px) scaleY(1.2); opacity: 0.18; }
          100% { transform: translateX(200px) scaleY(0.8); opacity: 0.1; }
        }

        /* Aplicação das animações */
        .surf-wave-1   { animation: surf-swell  18s ease-in-out infinite; transform-origin: center bottom; }
        .surf-wave-2   { animation: surf-roll   12s ease-in-out infinite; transform-origin: center bottom; }
        .surf-wave-3   { animation: surf-break   8s ease-in-out infinite; transform-origin: center bottom; }
        .surf-wave-break { animation: surf-crash  6s ease-in-out infinite; transform-origin: center bottom; }
        .surf-spray    { animation: surf-spray   4s ease-in-out infinite; transform-origin: center bottom; }
      `,
        }}
      />
    </div>
  );
}
