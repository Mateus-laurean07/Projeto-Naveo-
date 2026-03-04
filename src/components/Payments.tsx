import React from "react";
import { Download, FileText, CheckCircle2, FileCheck } from "lucide-react";

export function Payments() {
  const invoiceHistory: any[] = [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Histórico de Pagamentos
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Acompanhe suas faturas e recibos da Netuno
        </p>
      </div>

      <div className="bg-background border border-border/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-background/50">
                <th className="py-5 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Fatura
                </th>
                <th className="py-5 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Data
                </th>
                <th className="py-5 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Plano
                </th>
                <th className="py-5 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Valor
                </th>
                <th className="py-5 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="py-5 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-right">
                  Recibo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoiceHistory.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#3B82F6]" />
                      <span className="font-semibold text-foreground tracking-wide">
                        {invoice.id}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-[15px] font-medium text-foreground/80">
                    {invoice.date}
                  </td>
                  <td className="py-5 px-6 text-[15px] font-medium text-foreground/80">
                    {invoice.plan}
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-[15px] font-bold text-foreground">
                      {invoice.amount}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      {invoice.status}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <button
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/10 rounded-xl transition-all inline-block hover:scale-110 active:scale-95"
                      title="Baixar PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {invoiceHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Nenhuma fatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
