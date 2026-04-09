import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

interface DatePickerProps {
  value: Date;
  onChange: (d: Date) => void;
  maxDate?: Date;
}

export function DatePicker({ value, onChange, maxDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const containerRef = useRef<HTMLDivElement>(null);

  // Maintain sync if value comes from outside correctly
  useEffect(() => {
    if (!isOpen) {
      setCurrentMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (maxDate && d > maxDate) return;
    onChange(d);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50 flex items-center justify-center h-full" ref={containerRef}>
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className="h-full px-4 flex items-center justify-center min-w-[124px] outline-none select-none group"
      >
        <span className="text-[12px] font-bold tracking-widest text-foreground group-hover:text-[#ccff00] transition-colors leading-[36px]">
          {`${value.getDate().toString().padStart(2, "0")}/${(value.getMonth() + 1).toString().padStart(2, "0")}/${value.getFullYear()}`}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-[280px] bg-[#0C0D11] border border-[#27282D] rounded-[1.25rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,1)] p-4 overflow-hidden animate-in fade-in slide-in-from-top-2 zoom-in-95 origin-top">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#27282D] text-muted-foreground hover:text-white transition-all bg-[#15161A] border border-[#1E1F24]">
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#27282D] text-muted-foreground hover:text-white transition-all bg-[#15161A] border border-[#1E1F24]">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-full">
                {d}
              </div>
            ))}
          </div>

          {/* Grid do Calendário */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full aspect-square" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              
              const isSelected = 
                date.getDate() === value.getDate() && 
                date.getMonth() === value.getMonth() && 
                date.getFullYear() === value.getFullYear();
                
              const today = new Date();
              const isToday = 
                day === today.getDate() && 
                currentMonth.getMonth() === today.getMonth() && 
                currentMonth.getFullYear() === today.getFullYear();
                
              const isDisabled = maxDate ? date > maxDate : false;
              
              return (
                <button
                  key={day}
                  disabled={isDisabled}
                  onClick={(e) => { e.preventDefault(); handleSelectDate(day); }}
                  className={cn(
                    "w-full aspect-square flex items-center justify-center rounded-xl text-[12px] font-bold transition-all relative overflow-hidden group/day",
                    isSelected 
                      ? "bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]" 
                      : isDisabled 
                        ? "text-muted-foreground/20 cursor-not-allowed border border-transparent" 
                        : "text-muted-foreground hover:bg-[#27282D] hover:text-white border border-transparent",
                    isToday && !isSelected && "border-[#27282D] text-white bg-[#15161A]"
                  )}
                >
                  <span className="relative z-10">{day}</span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#27282D] flex items-center justify-center">
             <button 
                onClick={(e) => {
                   e.preventDefault();
                   onChange(new Date());
                   setIsOpen(false);
                }}
                className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-[#ccff00] transition-colors"
             >
                 Ir para Hoje
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
