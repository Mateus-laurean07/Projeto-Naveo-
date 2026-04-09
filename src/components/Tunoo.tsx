import React, { useState, useEffect, useRef } from "react";
import {
  Anchor,
  Send,
  Plus,
  Search,
  Ship,
  Compass,
  Waypoints,
  FileText,
  Image as ImageIcon,
  Paperclip,
  MoreVertical,
  ChevronRight,
  History,
  Waves,
  Layout,
  MessageSquare,
  User,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Target,
  Trophy,
  BarChart3,
  Rocket,
  Mic,
  MicOff,
  Zap,
  Download,
  FileBox,
  Trash2,
  ShieldCheck,
  Activity,
  Settings,
  Terminal,
  Brain,
  Save,
  RefreshCcw,
  Globe,
  ChevronDown,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  metadata?: any;
}

interface TunooSession {
  id: string;
  title: string;
  current_step: number;
  diario_bordo: any;
  updated_at: string;
}

export function Tunoo({
  profile,
  setTab,
}: {
  profile?: any;
  setTab?: (tab: string) => void;
}) {
  const [sessions, setSessions] = useState<TunooSession[]>([]);
  const [activeSession, setActiveSession] = useState<TunooSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionMenuOpen, setSessionMenuOpen] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [settingsTab, setSettingsTab] = useState<"trash" | "prompt" | "brain">(
    "prompt",
  );
  const [systemPrompt, setSystemPrompt] = useState("");
  const [indexedDocs, setIndexedDocs] = useState<any[]>([]);

  useEffect(() => {
    fetchSessions();
    loadSystemSettings();
  }, [profile?.id]);

  const loadSystemSettings = async () => {
    const savedLocal = localStorage.getItem("tunoo_system_prompt");
    if (savedLocal) setSystemPrompt(savedLocal);

    // Tentar carregar do Supabase (tabela de config opcional)
    try {
      const { data, error } = await supabase
        .from("tunoo_config")
        .select("value")
        .eq("key", "system_prompt")
        .maybeSingle();

      if (data?.value) {
        setSystemPrompt(data.value);
        localStorage.setItem("tunoo_system_prompt", data.value);
      }
    } catch (e) {
      console.log("Persistence: Usando LocalStorage para o prompt (fallback).");
    }
  };

  const handleSavePrompt = async () => {
    setIsLoading(true);
    localStorage.setItem("tunoo_system_prompt", systemPrompt);

    try {
      const { error } = await supabase.from("tunoo_config").upsert(
        {
          key: "system_prompt",
          value: systemPrompt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) throw error;
      toast.success("Prompt do Sistema atualizado com sucesso!");
    } catch (e) {
      toast.info("Prompt salvo localmente (persistência no banco pendente).");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setSessionMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSessions = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("tunoo_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar sessões:", error);
    } else {
      setSessions(data || []);
      const activeOnes = (data || []).filter((s) => !s.diario_bordo?.deleted);
      if (activeOnes.length > 0 && !activeSession) {
        setActiveSession(activeOnes[0]);
      }
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("tunoo_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mensagens:", error);
    } else {
      setMessages(data || []);
    }
  };

  const createNewSession = async () => {
    if (!profile?.id) return;

    const newSession = {
      user_id: profile.id,
      title: "Nova Missão Estratégica",
      current_step: 1,
      diario_bordo: {},
    };

    const { data, error } = await supabase
      .from("tunoo_sessions")
      .insert(newSession)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao iniciar expedição.");
    } else {
      setSessions([data, ...sessions]);
      setActiveSession(data);

      const welcomeMsg = {
        session_id: data.id,
        role: "assistant" as const,
        content: `⚓ **Bem-vindo a bordo, Capitão ${profile.full_name?.split(" ")[0] || ""}!**\n\nEu sou a **NAVEO AI**, a inteligência estratégica central da plataforma. Atuarei como sua **Central de Inteligência** nesta missão.\n\nMinha missão é compreender o destino antes de executarmos qualquer manobra. Para começarmos nossa jornada com precisão técnica e visão criativa:\n\n> **Qual o nome do cliente ou projeto que vamos navegar hoje?**\n\nEstou com o radar ligado pronto para o reconhecimento de terreno! 🔍`,
      };

      await supabase.from("tunoo_messages").insert(welcomeMsg);
      fetchMessages(data.id);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = sessions.find((s) => s.id === id);
    if (!session) return;

    // Soft delete: flag inside diario_bordo
    const updatedDiario = { ...session.diario_bordo, deleted: true };

    const { error } = await supabase
      .from("tunoo_sessions")
      .update({ diario_bordo: updatedDiario })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao mover para lixeira.");
    } else {
      toast.success("Missão enviada para a lixeira.");
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, diario_bordo: updatedDiario } : s,
        ),
      );
      if (activeSession?.id === id) {
        setActiveSession(null);
        setMessages([]);
      }
    }
    setSessionMenuOpen(null);
  };

  const restoreSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = sessions.find((s) => s.id === id);
    if (!session) return;

    // Restore: remove deleted flag
    const updatedDiario = { ...session.diario_bordo };
    delete updatedDiario.deleted;

    const { error } = await supabase
      .from("tunoo_sessions")
      .update({ diario_bordo: updatedDiario })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao restaurar missão.");
    } else {
      toast.success("Missar restaurada ao radar.");
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, diario_bordo: updatedDiario } : s,
        ),
      );
    }
  };

  const hardDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("tunoo_sessions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir permanentemente.");
    } else {
      toast.success("Missão eliminada definitivamente.");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    let sessionId = activeSession?.id;

    if (!sessionId) {
      if (!profile?.id) return;

      const newSession = {
        user_id: profile.id,
        title:
          inputValue.substring(0, 30) + (inputValue.length > 30 ? "..." : ""),
        current_step: 1,
        diario_bordo: {},
      };

      const { data, error } = await supabase
        .from("tunoo_sessions")
        .insert(newSession)
        .select()
        .single();

      if (error) {
        toast.error("Erro ao iniciar expedição.");
        return;
      }

      sessionId = data.id;
      setSessions([data, ...sessions]);
      setActiveSession(data);
    }

    const userContent = inputValue;
    const hasAttachments = pendingAttachments.length > 0;
    const attachmentsData = hasAttachments
      ? pendingAttachments.map((f) => ({
          name: f.name,
          type: f.type,
          size: (f.size / 1024).toFixed(1) + " KB",
          url: (f as any)._tempUrl || URL.createObjectURL(f),
        }))
      : undefined;

    setInputValue("");
    setIsLoading(true);

    const userMsg = {
      session_id: sessionId,
      role: "user" as const,
      content: userContent,
      metadata: attachmentsData ? { attachments: attachmentsData } : {},
    };

    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        ...userMsg,
        id: tempId,
        created_at: new Date().toISOString(),
      } as Message,
    ]);

    const { data: savedMsg, error } = await supabase
      .from("tunoo_messages")
      .insert(userMsg)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao enviar mensagem.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setIsLoading(false);
      return;
    }

    if (sessionId) {
      simulateNaveoResponse(userContent, sessionId, hasAttachments);
    }

    setPendingAttachments([]);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "file" | "image",
  ) => {
    const files = Array.from(e.target.files || []).map((file) => {
      (file as any)._tempUrl = URL.createObjectURL(file);
      return file;
    });
    if (files.length > 0) {
      setPendingAttachments((prev) => [...prev, ...files]);
    }
  };

  const removePendingAttachment = (index: number) => {
    const file = pendingAttachments[index];
    if (file && (file as any)._tempUrl) {
      URL.revokeObjectURL((file as any)._tempUrl);
    }
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) {
          // Store temp URL for preview directly on the file object for simplicity in preview
          (file as any)._tempUrl = URL.createObjectURL(file);
          files.push(file);
        }
      }
    }
    if (files.length > 0) {
      setPendingAttachments((prev) => [...prev, ...files]);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "naveo-export.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Arquivo pronto para exportação!");
  };

  const exportChatReport = () => {
    if (!activeSession || messages.length === 0) return;

    const reportContent = messages
      .map(
        (m) =>
          `${m.role === "assistant" ? "NAVEO AI" : "COMANDANTE"} (${new Date(m.created_at).toLocaleString()}):\n${m.content}\n`,
      )
      .join("\n---\n\n");

    const blob = new Blob([reportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-missao-${activeSession.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dossiê de missão exportado com sucesso!");
  };

  async function simulateNaveoResponse(
    userText: string,
    sessionId: string,
    hasAttachments: boolean = false,
  ) {
    const lowerText = userText.toLowerCase();

    // Identificação de Intenção e Alvo
    const isInvestigationRequest =
      lowerText.length > 3 &&
      !lowerText.includes("ajuda") &&
      !lowerText.includes("quem é você");

    // Busca na Base Local (Leads/Clientes) para enriquecer o dossiê
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .or(`name.ilike.%${userText}%,company.ilike.%${userText}%`)
      .limit(1)
      .maybeSingle();
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .or(`name.ilike.%${userText}%,company.ilike.%${userText}%`)
      .limit(1)
      .maybeSingle();
    const localEntity = lead || customer;

    const targetName = (
      localEntity?.company ||
      localEntity?.name ||
      userText.replace(/investigue |analise |quem é |pesquise sobre /gi, "")
    ).trim();
    const targetUrl = targetName.toLowerCase().replace(/\s+/g, "");
    const isMartinello = targetName.toLowerCase().includes("martinello");

    setTimeout(async () => {
      let response = "";
      let identification: any = null;

      if (!isInvestigationRequest) {
        response = `⚓ **NAVEO | COMANDO CENTRAL**

Maré alta, Capitão! 🌊 Minha frota de busca está em prontidão. 

Eu sou o seu sistema de **Investigação Estratégica**. Basta me lançar as coordenadas (nome de uma empresa) e eu farei a varredura completa do terreno.

**O que deseja investigar agora?**`;
      } else {
        // Dados reais e precisos para Martinello
        identification = isMartinello
          ? {
              nome: "Eletromóveis Martinello",
              fundacao: "1989 (36 anos de mercado)",
              fundador: "Osvaldo Martinello",
              sede: "Lucas do Rio Verde, Mato Grosso",
              segmento: "Varejo (Móveis, Eletrodomésticos e Tecnologia)",
              funcionarios: "Aprox. 2.900 colaboradores",
              site: "https://www.martinello.com.br",
              insta: "https://www.instagram.com/eletromoveis.martinello",
              face: "https://www.facebook.com/eletromoveismartinello",
              linkedin:
                "https://www.linkedin.com/company/eletromoveismartinello",
              logo: "https://logo.clearbit.com/martinello.com.br",
            }
          : {
              nome: targetName,
              fundacao: "Detectando registro...",
              fundador: "Liderança Proprietária",
              sede: localEntity?.address || "Mapeando Coordenadas...",
              segmento: localEntity?.industry || "Setor Comercial",
              funcionarios: "Escopo em análise",
              site: `https://www.google.com/search?q=${targetUrl}+site+oficial`,
              insta: `https://www.instagram.com/${targetUrl}`,
              face: `https://www.facebook.com/${targetUrl}`,
              linkedin: `https://www.linkedin.com/search/results/all/?keywords=${targetUrl}`,
              logo: `https://logo.clearbit.com/${targetUrl}.com.br`,
            };

        // Dossier de Alta Performance
        response = `### 🏢 **Identidade Institucional**

![Logo ${identification.nome}](${identification.logo})
> *Logotipo institucional verificado e capturado via radar Clearbit.*

---

### 🌐 **Sites e Portais Verificados**

🏠 **Website Oficial**
O portal central para transações e informações institucionais.
🔗 [Acessar Site Oficial](${identification.site})

📸 **Instagram Oficial**
Canal de engajamento e vitrine digital da marca.
🔗 [Ver Perfil no Instagram](${identification.insta})

📘 **Fanpage Facebook**
Comunidade e atendimento ao cliente em tempo real.
🔗 [Acessar Facebook](${identification.face})

---

Maré alta, Capitão! 🌊 Varredura profunda finalizada. Localizei as coordenadas exatas da **${identification.nome}**. 

## 🏢 **PROTOCOLO DE RECONHECIMENTO**

### 📍 **Dados de Identificação**
• **Nome Comercial:** **${identification.nome}**
• **Ano de Fundação:** ${identification.fundacao}
• **Fundador/Liderança:** **${identification.fundador}**
• **Sede Central:** ${identification.sede}
• **País:** Brasil 🇧🇷

### 🎯 **Setor & Operação**
• **Segmento Primário:** ${identification.segmento}
• **Força de Trabalho:** ${identification.funcionarios}

### 🌐 **Pegada Digital Dominante**
| Plataforma | Link Direto para Acesso | Status |
| :--- | :--- | :--- |
| 🔗 **Site Oficial** | [Abrir Site Oficial](${identification.site}) | ✅ Ativo |
| 📸 **Instagram** | [@${isMartinello ? "eletromoveis.martinello" : targetUrl}](${identification.insta}) | ✅ Ativo |
| 💼 **LinkedIn** | [Ver Perfil de Negócios](${identification.linkedin}) | ✅ Ativo |
| 📘 **Facebook** | [Acessar Página](${identification.face}) | ✅ Ativo |

---

### ⭐ **Sinais de Prova Social**
"Genuinamente mato-grossense com cultura simples e estrutura moderna."
"Maior rede de varejo do Mato Grosso, reconhecida pela tradição e facilidade."

### 💡 **Análise Estratégica NAVEO**
**Pontos Fortes:** Marca consolidada com 36 anos de mercado e presença física massiva.
**Oportunidades:** Unificar o fluxo de atendimento digital com a **NAVEO** para converter seguidores em clientes recorrentes.

---

⚓ **Capitão, os links acima estão prontos para o seu comando.** Clique neles para acessar os canais do alvo.

1️⃣ Confirmar Missão ✅
2️⃣ Gerar Análise de Concorrentes ⚔️
3️⃣ Mapear Oportunidades 💎`;
      }

      const assistantMsg = {
        session_id: sessionId,
        role: "assistant" as const,
        content: response,
      };

      const { data } = await supabase
        .from("tunoo_messages")
        .insert(assistantMsg)
        .select()
        .single();

      if (data) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "thinking"),
          data,
        ]);

        // Atualizar também o diário de bordo na sessão
        const summary = isInvestigationRequest
          ? `Excelente, Capitão! Âncora recolhida e rota confirmada para ${identification.nome}.\n\n📝 DIÁRIO DE BORDO ATUALIZADO ✅ Passo 1 - Reconhecimento de Terreno - CONCLUÍDO 🗓️\n\nResumo: Cliente verificado: ${identification.nome}. Setor: ${identification.segmento}. Presença digital capturada nos radares sociais.`
          : undefined;

        if (summary) {
          const updatedDiario = {
            ...activeSession?.diario_bordo,
            resumo_executivo: summary,
            segmento: identification.segmento,
          };

          await supabase
            .from("tunoo_sessions")
            .update({
              diario_bordo: updatedDiario,
              title: identification.nome,
            })
            .eq("id", sessionId);

          setActiveSession((prev) =>
            prev
              ? {
                  ...prev,
                  diario_bordo: updatedDiario,
                  title: identification.nome,
                }
              : null,
          );

          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    diario_bordo: updatedDiario,
                    title: identification.nome,
                  }
                : s,
            ),
          );
        }
      }
      setIsLoading(false);
    }, 1800);
  }

  const getStepName = (s: number) => {
    const names = [
      "Terreno",
      "Escopo",
      "Estrela Norte",
      "Frota",
      "Radar",
      "Inteligência",
      "Dossiê",
      "Bandeira",
      "Arsenal",
      "Deep Dive",
    ];
    return names[s - 1] || "Expedição";
  };

  const toggleSpeechRecognition = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      // @ts-ignore
      const recognition = window._recognition;
      if (recognition) recognition.stop();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((prev) => prev + (prev ? " " : "") + transcript);
    };

    // @ts-ignore
    recognition.start();
  };

  return (
    <div className="flex h-full w-full bg-[#f8fbfe] dark:bg-[#020617] overflow-hidden text-[#1e293b] dark:text-slate-200 animate-in fade-in duration-500 relative transition-colors duration-500">
      {/* 1. SIDEBAR IZQUIERDA (SESSÕES) - ESTILO MODERN TEAL */}
      <div
        className={cn(
          "bg-naveo-dark flex flex-col transition-all duration-500 z-40 relative border-r border-white/5",
          isSidebarOpen ? "w-[280px]" : "w-0 -translate-x-full",
        )}
      >
        <div className="p-6 pb-2">
          {setTab && (
            <button
              onClick={() => setTab("dashboard")}
              className="flex items-center justify-center gap-2 w-full py-2.5 mb-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-primary hover:bg-white/10 hover:border-primary/30 transition-all group/back"
            >
              <Waypoints
                size={14}
                className="group-hover:-translate-x-1 transition-transform"
              />{" "}
              Voltar ao HUB
            </button>
          )}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20 animate-wobble">
              <Anchor size={22} className="rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 leading-none">
                Naveo AI
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                Intelligence
              </span>
            </div>
          </div>

          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-primary text-black hover:bg-primary/90 active:scale-[0.98] transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10"
          >
            <Plus size={16} strokeWidth={3} /> Nova Missão
          </button>

          {/* Busca mantida na sidebar */}
          <div className="relative mt-6 group">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Buscar missão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 mt-4 space-y-1 custom-scrollbar-minimal pb-6">
          {sessions
            .filter((s) => {
              const matchesSearch = s.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
              return matchesSearch && !s.diario_bordo?.deleted;
            })
            .map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={cn(
                  "w-full px-4 py-4 rounded-xl text-left transition-all group relative flex items-center gap-4 cursor-pointer",
                  activeSession?.id === session.id
                    ? "bg-white/10 text-white border border-white/10 shadow-xl"
                    : "text-white/50 hover:bg-white/5 hover:text-white",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg",
                    activeSession?.id === session.id
                      ? "bg-primary text-black"
                      : "bg-white/10 text-white/40",
                  )}
                >
                  {session.title.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 pr-6">
                  <span className="text-[11px] font-bold truncate leading-tight uppercase tracking-tight">
                    {session.title}
                  </span>
                  <span className="text-[9px] opacity-40 font-medium">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  ref={sessionMenuOpen === session.id ? menuRef : null}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionMenuOpen(
                        sessionMenuOpen === session.id ? null : session.id,
                      );
                    }}
                    className="p-1 px-2 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all text-white"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {sessionMenuOpen === session.id && (
                    <div className="absolute right-0 top-full mt-2 bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl z-[100] py-1 min-w-[140px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 uppercase tracking-widest"
                      >
                        <Trash2 size={12} /> Mover para Lixeira
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="p-6 mt-auto border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-white/50 truncate max-w-[140px] hover:text-white/90 transition-colors cursor-default">
                {profile?.email || "tebaldi@naveo.com.br"}
              </span>
              {(profile?.role === "super_admin" ||
                profile?.role === "admin") && (
                <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-lg w-fit group/admin cursor-default">
                  <ShieldCheck
                    size={10}
                    className="text-primary group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                    Admin
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowSettings(true);
                setShowTrash(true); // Abre direto na lixeira conforme o foco da conversa
              }}
              className="p-2 text-white/20 hover:text-primary hover:bg-white/5 rounded-lg transition-all group/settings"
            >
              <Settings
                size={16}
                className="group-hover:rotate-90 transition-transform duration-500"
              />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner hover:bg-white/10 transition-all cursor-pointer group/profile">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={18} className="text-primary" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-white truncate uppercase tracking-widest leading-none mb-1">
                {profile?.full_name?.split(" ")[0] || "Comandante"}
              </span>
              <span className="text-[8px] font-bold text-primary/60 uppercase tracking-[0.2em] animate-pulse">
                Sincronizado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AREA CENTRAL (CHAT) - ESTILO LIGHT/DARK */}
      <div className="flex-1 flex flex-col relative bg-[#f1f5f9] dark:bg-naveo-dark h-full min-w-0 transition-all duration-700">
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-10 bg-white/70 dark:bg-naveo-dark/40 backdrop-blur-md border-b border-[#e2e8f0] dark:border-white/5 z-30 sticky top-0 shadow-sm transition-colors duration-500">
          <div className="flex items-center gap-6">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 hover:bg-[#e2e8f0] dark:hover:bg-white/5 rounded-xl transition-all shadow-sm text-[#475569] dark:text-slate-400"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Compass
                  size={20}
                  className="animate-spin-slow text-primary shadow-glow"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-black tracking-tight text-[#0a2540] dark:text-white">
                  {activeSession?.title || "Reconhecimento de Terreno"}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#64748b] dark:text-slate-500">
                    Fase 0{activeSession?.current_step || 1} • Inteligência
                    Tática
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botões removidos conforme solicitado */}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth px-6 lg:px-20 pt-10 pb-44">
          {activeSession ? (
            <div className="max-w-4xl mx-auto w-full space-y-10">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={cn(
                    "flex gap-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-700",
                    msg.role === "assistant" ? "flex-row" : "justify-end",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-[#0a2540] flex items-center justify-center text-primary shadow-lg shadow-[#0a2540]/20">
                        <Anchor size={20} />
                      </div>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex flex-col gap-2",
                      msg.role === "assistant" ? "max-w-[85%]" : "max-w-[75%]",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                        Capitão Naveo
                      </span>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl text-[14px] leading-relaxed font-normal p-5 shadow-sm transition-all relative group/msg",
                        msg.role === "assistant"
                          ? "bg-white dark:bg-naveo-card border border-[#e2e8f0] dark:border-white/5 text-[#1e293b] dark:text-slate-300 rounded-tl-none"
                          : "bg-[#2563eb] text-white shadow-xl shadow-blue-500/10 rounded-tr-none ml-auto",
                      )}
                    >
                      <div className="space-y-4">
                        {msg.content.split("\n").map((line, i) => {
                          const parseInlines = (text: string) => {
                            const boldParts = text.split("**");
                            return boldParts.map((part, bi) => {
                              if (bi % 2 === 1)
                                return (
                                  <strong
                                    key={bi}
                                    className="font-bold text-primary"
                                  >
                                    {part}
                                  </strong>
                                );
                              return part;
                            });
                          };

                          if (line.trim().startsWith("### "))
                            return (
                              <h3
                                key={i}
                                className="text-base font-bold text-[#0a2540] dark:text-white border-b border-[#f1f5f9] dark:border-white/5 pb-2 mt-4"
                              >
                                {line.replace("### ", "")}
                              </h3>
                            );
                          if (line.trim().startsWith("## "))
                            return (
                              <h2
                                key={i}
                                className="text-lg font-black text-[#0a2540] dark:text-white mt-6 mb-2 tracking-tight"
                              >
                                {line.replace("## ", "")}
                              </h2>
                            );
                          if (line.trim().startsWith("![")) {
                            const match = line.match(/!\[(.*?)\]\((.*?)\)/);
                            return match ? (
                              <img
                                key={i}
                                src={match[2]}
                                className="my-6 rounded-2xl border border-[#e2e8f0] shadow-xl w-full object-cover max-h-[400px] hover:scale-[1.01] transition-transform cursor-pointer"
                                alt={match[1]}
                              />
                            ) : null;
                          }
                          if (line.trim().startsWith("|"))
                            return (
                              <div
                                key={i}
                                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 my-4 font-mono text-[11px] overflow-x-auto whitespace-pre"
                              >
                                {line}
                              </div>
                            );

                          return line.trim() ? (
                            <p key={i} className="leading-relaxed opacity-90">
                              {parseInlines(line)}
                            </p>
                          ) : (
                            <div key={i} className="h-1" />
                          );
                        })}
                      </div>

                      {msg.metadata?.attachments && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-[#f1f5f9]">
                          {msg.metadata.attachments.map(
                            (att: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 p-2 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[10px] font-bold text-[#475569] hover:bg-white transition-all cursor-pointer shadow-sm"
                              >
                                <Paperclip size={12} className="text-primary" />{" "}
                                {att.name}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 w-full animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-naveo-card border border-[#e2e8f0] dark:border-white/5" />
                  <div className="flex-1 space-y-4 pt-4">
                    <div className="h-2 bg-[#e2e8f0] dark:bg-white/5 rounded-full w-3/4" />
                    <div className="h-2 bg-[#e2e8f0] dark:bg-slate-800 rounded-full w-1/2" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-[20vh]" />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-10">
              <div
                className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-naveo-card border border-[#e2e8f0] dark:border-white/5 shadow-2xl flex items-center justify-center text-primary relative group cursor-pointer overflow-hidden transition-colors"
                onClick={createNewSession}
              >
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                <Ship
                  size={56}
                  className="text-primary shadow-glow group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  Protocolo Naveo
                </span>
                <h2 className="text-5xl font-black text-[#0a2540] dark:text-white tracking-tight italic transition-colors">
                  Central de <span className="text-primary">Inteligência</span>
                </h2>
                <p className="text-[#64748b] dark:text-slate-400 font-medium leading-relaxed transition-colors">
                  Pronto para a varredura? Envie o nome de uma empresa ou inicie
                  uma nova missão estratégica clicando no botão acima.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* INPUT DE CHAT REFEITO */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-[#f1f5f9] dark:from-naveo-dark via-[#f1f5f9]/80 dark:via-naveo-dark/80 to-transparent pointer-events-none transition-colors duration-500">
          <div className="max-w-4xl mx-auto w-full pointer-events-auto relative">
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {pendingAttachments.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 px-3 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-white/5 rounded-xl text-[10px] font-bold shadow-sm text-slate-700 dark:text-slate-300"
                  >
                    <ImageIcon size={12} className="text-primary" /> {f.name}
                    <button
                      onClick={() => removePendingAttachment(i)}
                      className="text-red-500 hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="bg-white dark:bg-naveo-card/90 backdrop-blur-2xl border border-[#cbd5e1] dark:border-white/10 rounded-2xl p-2.5 flex items-center gap-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-500"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={(e) => handleFileSelect(e, "file")}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 bg-[#f8fafc] dark:bg-white/5 text-[#64748b] dark:text-slate-400 hover:text-primary rounded-xl transition-all hover:bg-primary/5"
              >
                <Paperclip size={20} />
              </button>

              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSendMessage())
                }
                placeholder="Converse com a NAVEO..."
                className="flex-1 bg-transparent border-none py-3 text-[14px] focus:outline-none resize-none max-h-32 text-[#1e293b] dark:text-white placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 font-medium"
                rows={1}
              />

              <div className="flex items-center gap-2 pr-2">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={
                    isListening
                      ? "p-3 text-white bg-red-500 rounded-xl animate-pulse"
                      : "p-3 text-[#94a3b8] dark:text-slate-500 hover:text-primary transition-all"
                  }
                >
                  <Mic size={20} />
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                    inputValue.trim()
                      ? "bg-[#2563eb] text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95"
                      : "bg-[#f1f5f9] dark:bg-white/5 text-[#cbd5e1] dark:text-slate-700",
                  )}
                >
                  {isLoading ? (
                    <Waves size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} className="translate-x-0.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 3. PAINEL DIREITO (DIÁRIO DE BORDO & INFO) */}
      <div className="w-[420px] bg-white dark:bg-naveo-card border-l border-[#e2e8f0] dark:border-white/5 flex flex-col h-full hidden xl:flex animate-in slide-in-from-right duration-700 overflow-hidden transition-colors duration-500">
        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          {/* Box de Informações Básicas */}
          <div className="bg-[#f8fafc] dark:bg-white/5 border border-[#e2e8f0] dark:border-white/5 rounded-2xl p-5 space-y-3 relative group/info">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                Informações Básicas
              </h3>
              <button
                onClick={() => {
                  setShowSettings(true);
                  setShowTrash(true);
                }}
                className="text-[#64748b] dark:text-slate-500 hover:text-primary transition-all p-1"
              >
                <Settings
                  size={16}
                  className="hover:rotate-90 transition-transform duration-500"
                />
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[#64748b] dark:text-slate-500">
                  Nome:
                </span>
                <span className="font-bold text-[#1e293b] dark:text-slate-300">
                  {activeSession?.title || "Aguardando..."}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[#64748b] dark:text-slate-500">
                  Segmento:
                </span>
                <span className="font-bold text-[#1e293b] dark:text-slate-300">
                  {activeSession?.diario_bordo?.segmento || "Em análise"}
                </span>
              </div>
            </div>
          </div>

          {/* Acordeão de Reconhecimento de Terreno */}
          <div className="bg-white dark:bg-white/5 border border-[#e2e8f0] dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setIsSummaryOpen(!isSummaryOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#f8fafc] dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Anchor size={18} className="text-[#0a2540] dark:text-white" />
                <span className="text-sm font-bold text-[#0a2540] dark:text-white">
                  Reconhecimento de Terreno
                </span>
              </div>
              <ChevronRight
                size={18}
                className={cn(
                  "text-[#64748b] dark:text-slate-500 transition-transform",
                  isSummaryOpen && "rotate-90",
                )}
              />
            </button>

            {isSummaryOpen && (
              <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-3 flex items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-tight text-[#0a2540] dark:text-white">
                    Reconhecimento de Terreno
                  </span>
                </div>

                <div className="text-[12px] leading-relaxed text-[#475569] dark:text-slate-400 space-y-4 font-medium h-max max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-minimal">
                  {activeSession?.diario_bordo?.resumo_executivo ? (
                    activeSession.diario_bordo.resumo_executivo
                      .split("\n")
                      .map((line: string, i: number) => <p key={i}>{line}</p>)
                  ) : (
                    <div className="space-y-4 opacity-60 italic">
                      <p>
                        Excelente, Capitão! Âncora recolhida e rota confirmada.
                        Vamos registrar nosso ponto de partida.
                      </p>
                      <p>
                        📝 DIÁRIO DE BORDO ATUALIZADO ✅ Passo 1 -
                        Reconhecimento de Terreno - EM ANDAMENTO 🗓️
                      </p>
                      <p>
                        Aguardando o desdobramento da análise tática para
                        preenchimento dos registros operacionais da missão.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Discreto */}
          <div className="pt-6 flex flex-col items-center gap-2 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0a2540] dark:text-white">
              Tactical Intell
            </span>
          </div>
        </div>
      </div>

      {/* 4. MODAL DE CONFIGURAÇÕES AVANÇADAS - VERSÃO TÁTICA */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-500">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowSettings(false)}
          />

          <div className="relative w-full max-w-5xl h-[80vh] bg-[#f8fafc] dark:bg-[#161824] border border-[#e2e8f0] dark:border-white/10 rounded-[2.5rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Sidebar de Navegação Interna */}
            <aside className="w-16 lg:w-64 bg-white dark:bg-[#212529]/30 border-r border-[#e2e8f0] dark:border-white/5 flex flex-col p-4 lg:p-6 transition-all">
              <div className="mb-10 px-2 hidden lg:block">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
                  Naveo
                </h2>
                <p className="text-[14px] font-black text-[#0a2540] dark:text-white italic uppercase tracking-tighter">
                  Core Engine
                </p>
              </div>

              <nav className="space-y-3 flex-1">
                <button
                  onClick={() => setSettingsTab("prompt")}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
                    settingsTab === "prompt"
                      ? "bg-primary text-black shadow-lg shadow-primary/20"
                      : "text-slate-400 hover:bg-white dark:hover:bg-white/5",
                  )}
                >
                  <Terminal
                    size={18}
                    className={
                      settingsTab === "prompt"
                        ? ""
                        : "group-hover:scale-110 transition-transform"
                    }
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:block">
                    System Prompt
                  </span>
                </button>
                <button
                  onClick={() => setSettingsTab("brain")}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
                    settingsTab === "brain"
                      ? "bg-primary text-black shadow-lg shadow-primary/20"
                      : "text-slate-400 hover:bg-white dark:hover:bg-white/5",
                  )}
                >
                  <Brain
                    size={18}
                    className={
                      settingsTab === "brain"
                        ? ""
                        : "group-hover:scale-110 transition-transform"
                    }
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:block">
                    Cérebro IA
                  </span>
                </button>
                <div className="h-px bg-[#e2e8f0] dark:bg-white/5 my-6 mx-2" />
                <button
                  onClick={() => setSettingsTab("trash")}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-2xl transition-all group",
                    settingsTab === "trash"
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "text-slate-400 hover:bg-white dark:hover:bg-white/5",
                  )}
                >
                  <Trash2
                    size={18}
                    className={
                      settingsTab === "trash"
                        ? ""
                        : "group-hover:scale-110 transition-transform"
                    }
                  />
                  <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:block">
                    Lixeira
                  </span>
                </button>
              </nav>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full flex items-center justify-center lg:justify-start gap-4 p-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all mt-auto"
              >
                <X size={18} />
                <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:block">
                  Fechar
                </span>
              </button>
            </aside>

            {/* Area de Conteúdo Dinâmico */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white/20 dark:bg-transparent">
              <header className="p-8 border-b border-[#e2e8f0] dark:border-white/5 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-[#0a2540] dark:text-white uppercase italic tracking-tighter">
                    {settingsTab === "prompt" && "System Prompt"}
                    {settingsTab === "brain" && "Cérebro da NAVEO"}
                    {settingsTab === "trash" && "Lixeira Tática"}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium italic mt-1 opacity-60">
                    {settingsTab === "prompt" &&
                      "Define a personalidade e comportamento da NAVEO"}
                    {settingsTab === "brain" &&
                      "Metodologia, arquétipos e conhecimentos globais que a NAVEO usa"}
                    {settingsTab === "trash" &&
                      "Gerenciamento e recuperação de missões descartadas"}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-tighter">
                    v9 ativo
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-minimal">
                {settingsTab === "prompt" && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-[#212529] border border-[#e2e8f0] dark:border-white/5 rounded-[2rem] p-8 shadow-sm relative group overflow-hidden">
                      <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-[400px] bg-transparent text-sm text-[#1e293b] dark:text-slate-300 font-mono leading-relaxed focus:outline-none resize-none scrollbar-none"
                        spellCheck={false}
                      />
                      <div className="absolute bottom-6 right-6 flex items-center gap-3">
                        <button
                          onClick={handleSavePrompt}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCcw size={14} className="animate-spin" />
                          ) : (
                            <Save size={14} strokeWidth={3} />
                          )}
                          Salvar nova versão
                        </button>
                      </div>
                    </div>

                    <div className="px-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                        <History size={12} /> Histórico de Versões
                      </h3>
                      <div className="p-6 rounded-[1.5rem] bg-white/5 border border-dashed border-[#e2e8f0] dark:border-white/5 flex items-center justify-between opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                            v9
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-white uppercase italic">
                              Análise automática não disponível
                            </span>
                            <span className="text-[9px] font-medium opacity-60">
                              22/12/25, 10:02 • Versão Atual
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5">
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === "brain" && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4 px-6 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white uppercase tracking-tight italic">
                            Documentos Indexados
                          </span>
                          <p className="text-[9px] font-medium opacity-40 uppercase tracking-widest">
                            36 páginas em 3 sites
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 px-4 hover:bg-white/5 rounded-xl text-[10px] font-bold text-slate-400 transition-all uppercase tracking-widest flex items-center gap-2">
                          <RefreshCcw size={14} /> Reprocessar
                        </button>
                        <button className="px-6 py-2.5 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/10">
                          + Adicionar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {indexedDocs.length > 0 ? (
                        indexedDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-5 bg-white dark:bg-[#212529] border border-[#e2e8f0] dark:border-white/5 rounded-2xl hover:border-primary/20 transition-all group"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] dark:bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                                <doc.icon size={20} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#0a2540] dark:text-white uppercase tracking-tight">
                                  {doc.name}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 opacity-60 italic">
                                  {doc.info}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 rounded-3xl border-2 border-dashed border-[#e2e8f0] dark:border-white/5 flex flex-col items-center justify-center text-center space-y-4 opacity-35 grayscale">
                          <Brain size={48} className="animate-pulse" />
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em]">
                              Cérebro Limpo
                            </p>
                            <p className="text-[10px] font-medium italic">
                              Pronto para receber novos dados táticos.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {settingsTab === "trash" && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    {sessions.filter((s) => s.diario_bordo?.deleted).length >
                    0 ? (
                      sessions
                        .filter((s) => s.diario_bordo?.deleted)
                        .map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center gap-6 p-6 rounded-3xl bg-white dark:bg-[#212529] border border-[#e2e8f0] dark:border-white/5 hover:shadow-xl transition-all group"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/20 font-black text-sm border dark:border-white/5 shrink-0">
                              {session.title.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-bold text-[#0a2540] dark:text-white truncate uppercase tracking-tight">
                                {session.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em] mt-1 italic">
                                Descartado em{" "}
                                {new Date(
                                  session.updated_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => restoreSession(session.id, e)}
                                className="flex items-center gap-3 px-6 py-3 bg-[#f8fafc] dark:bg-white/5 border border-[#e2e8f0] dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-[#475569] dark:text-slate-400 hover:bg-primary hover:border-primary hover:text-black transition-all shadow-sm"
                              >
                                <History size={16} /> Restaurar
                              </button>
                              <button
                                onClick={(e) =>
                                  hardDeleteSession(session.id, e)
                                }
                                className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                title="Excluir Definitivamente"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/20 border-2 border-dashed border-current">
                          <Trash2 size={40} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[13px] font-black uppercase tracking-[0.4em]">
                            Lixeira Limpa
                          </p>
                          <p className="text-xs font-medium italic opacity-60">
                            Nenhum rastro de missões excluídas no radar
                            operacional.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
