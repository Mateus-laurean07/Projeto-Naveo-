import React from "react";
import { cn } from "../lib/utils";
import { useTheme } from "./ThemeProvider";

/**
 * TridentLogo - Máscara de Luminância (técnica definitiva)
 *
 * Como funciona:
 * - A imagem original (tridente dourado em fundo escuro) é usada como MÁSCARA
 * - mask-mode: luminance → pixels claros (tridente) = visível, pixels escuros (fundo) = transparente
 * - O div tem um backgroundColor sólido (preto ou branco)
 * - O container pai tem o fundo colorido (verde ou azul)
 *
 * Resultado:
 * - DARK:  tridente PRETO  visível com fundo VERDE do container → ✓
 * - LIGHT: tridente BRANCO visível com fundo AZUL  do container → ✓
 * - Sem quadrados, sem borrões, sem artefatos
 */
export const TridentLogo = ({ className }: { className?: string }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={cn("transition-all duration-300", className)}
      style={{
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
        WebkitMaskImage: "url('/netuno-logo.png')",
        maskImage: "url('/netuno-logo.png')",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskMode: "luminance",
        maskMode: "luminance",
      }}
    />
  );
};
