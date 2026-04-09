import React, { useState, useEffect } from "react";
import {
  CreditCard,
  QrCode,
  Shield,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  features: string[];
}

const MOCK_PLANS: Plan[] = [
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Básico",
    slug: "basic",
    price: 297.9,
    features: ["50 máquinas", "1 usuários", "IA ilimitada", "Disparos ilimitados", "Suporte por E-mail"],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Profissional",
    slug: "professional",
    price: 647.9,
    features: ["200 máquinas", "2 usuários", "500 msg IA/mês", "1.000 disparos/mês", "Suporte por E-mail"],
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Enterprise",
    slug: "enterprise",
    price: 1200,
    features: ["Máquinas ilimitadas", "3 usuários", "1000 msg IA/mês", "Disparos ilimitados", "Suporte por WhatsApp"],
  },
];

export function Checkout({ initialPlanId, onBack }: { initialPlanId?: string, onBack?: () => void }) {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId || MOCK_PLANS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix">("credit");
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length > 0) return parts.join(" ");
    return value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) return v.substring(0, 2) + "/" + v.substring(2, 4);
    return v;
  };

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from("plans")
          .select("*")
          .eq("active", true)
          .order("sequence");
        
        if (error) throw error;

        if (data && data.length > 0) {
          setPlans(data);
          // Se o plano inicial estiver na lista real, mantém. Senão pega o primeiro.
          if (initialPlanId && data.find(p => p.id === initialPlanId)) {
            setSelectedPlanId(initialPlanId);
          } else {
            setSelectedPlanId(data[0].id);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar planos reais, usando MOCK:", e);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, [initialPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado!");
        return;
      }

      // 1. Determina o Owner (se for membro de time, usa o admin_id)
      const ownerId = user.user_metadata?.admin_id || user.id;

      if (!selectedPlan) {
        toast.error("Plano não selecionado!");
        return;
      }

      // 2. Salva a Assinatura
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: ownerId,
        plan_id: selectedPlan.id,
        status: "active",
        created_at: new Date().toISOString(),
        renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
      });

      if (error) throw error;

      toast.success("Assinatura confirmada com sucesso!");
      if (onBack) setTimeout(onBack, 1500);
    } catch (e: any) {
      toast.error("Erro ao processar assinatura: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedPlan) return null;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300 pb-12">
      {onBack && (
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest mb-8 flex items-center gap-2"
        >
          &larr; Voltar
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left Side: Form */}
        <div className="lg:col-span-3 space-y-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">
              Assinar o Naveo
            </h1>
            <p className="text-muted-foreground font-medium">
              Escolha seu plano e a forma de pagamento ideal para o seu negócio.
            </p>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 block">
              Plano Selecionado
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center",
                    selectedPlanId === plan.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                      : "border-border/50 bg-card hover:border-primary/30 text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider mb-2",
                      selectedPlanId === plan.id ? "text-primary" : "",
                    )}
                  >
                    {plan.name}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        "text-xl font-black",
                        selectedPlanId === plan.id ? "text-foreground" : "",
                      )}
                    >
                      R$ {plan.price}
                    </span>
                    <span className="text-[10px] uppercase">/mês</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 mb-4 block">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod("credit")}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all",
                  paymentMethod === "credit"
                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/20"
                    : "border-border/50 bg-card text-muted-foreground hover:border-primary/30",
                )}
              >
                <CreditCard size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Cartão de Crédito
                </span>
              </button>
              <button
                onClick={() => setPaymentMethod("pix")}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all",
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/20"
                    : "border-border/50 bg-card text-muted-foreground hover:border-primary/30",
                )}
              >
                <QrCode size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  PIX
                </span>
              </button>
            </div>
          </div>

          {/* Credit Card Form */}
          {paymentMethod === "credit" && (
            <div className="bg-card border border-border/50 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground inline-block">
                  Nome no cartão
                </label>
                <input
                  type="text"
                  placeholder="NOME SOBRENOME"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                  className="w-full bg-background border border-border/50 rounded-xl px-5 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground inline-block">
                  Número do cartão
                </label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardData.number}
                  onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                  className="w-full bg-background border border-border/50 rounded-xl px-5 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground inline-block">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                    className="w-full bg-background border border-border/50 rounded-xl px-5 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground inline-block">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="000"
                    maxLength={3}
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "") })}
                    className="w-full bg-background border border-border/50 rounded-xl px-5 py-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2 text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest">
                <Lock size={12} />
                Dados criptografados com TLS 1.3 - PCI DSS Compliant
              </div>
            </div>
          )}

          {paymentMethod === "pix" && (
            <div className="bg-card border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <QrCode size={48} className="text-primary opacity-50 mb-2" />
              <p className="text-muted-foreground font-medium text-sm max-w-sm">
                Ao confirmar, geraremos um QR Code exclusivo para pagamento via
                PIX. A liberação será imediata após o pagamento.
              </p>
            </div>
          )}

          <button
            onClick={handleSubscribe}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-primary/40 shadow-primary/20"
          >
            Confirmar Assinatura <ArrowRight size={18} />
          </button>
        </div>

        {/* Right Side: Summary Card */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-2xl sticky top-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">
              Plano Selecionado
            </span>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-3xl font-black text-foreground">
                {selectedPlan.name}
              </h2>
              <div className="text-right">
                <span className="text-2xl font-black text-foreground block leading-none">
                  R$ {selectedPlan.price}
                </span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                  por mês
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-8 pb-8 border-b border-border/50">
              O plano perfeito para impulsionar seus resultados no mercado.
            </p>

            <div className="space-y-4 mb-8">
              {selectedPlan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground/80">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-4 mb-6">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Cobrança mensal</span>
                <span className="text-foreground">
                  R${" "}
                  {selectedPlan.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Contrato</span>
                <span className="text-foreground">Mensal / Sem Fidelidade</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Status Atual</span>
                <span className="text-primary">Cancelado / Novo</span>
              </div>
              <div className="border-t border-border/50 pt-4 mt-4 flex items-center justify-between">
                <span className="font-black text-foreground">Total hoje</span>
                <span className="text-lg font-black text-primary">
                  R${" "}
                  {selectedPlan.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-[#27282D]">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                <Shield size={12} /> SSL Seguro
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                <Lock size={12} /> PCI DSS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
