import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Shield,
  Globe,
  Camera,
  Loader2,
  Save,
  Edit3,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Controls if user is viewing (Editar) or editing (Salvar)
  const [isEditing, setIsEditing] = useState(false);
  // Compare object to know if something changed
  const [initialProfile, setInitialProfile] = useState<any>(null);

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    companyName: "",
    phone: "",
    document: "", // CPF/CNPJ
    address: "",
    addressNumber: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "BR",
    avatarUrl: "",
    language: "pt-BR",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) return;

      setUserId(authData.user.id);

      // We know email from auth
      const email = authData.user.email || "";

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const loadedData = {
          fullName: data.full_name || "",
          email: email,
          companyName: data.company_name || "",
          phone: data.phone || "",
          document: data.document || "",
          address: data.address || "",
          addressNumber: data.address_number || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zip_code || "",
          country: data.country || "BR",
          avatarUrl: data.avatar_url || "",
          language: "pt-BR",
        };
        setProfile(loadedData);
        setInitialProfile(loadedData);

        // Check if anything is empty. If all is empty, we force editing state.
        const isEmpty =
          !loadedData.fullName && !loadedData.phone && !loadedData.document;
        if (isEmpty) setIsEditing(true);
      } else {
        setProfile((prev) => ({ ...prev, email }));
        setIsEditing(true); // new user, must edit
      }
    } catch (error) {
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      const updates = {
        id: userId,
        full_name: profile.fullName,
        company_name: profile.companyName,
        phone: profile.phone,
        document: profile.document,
        address: profile.address,
        address_number: profile.addressNumber,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zipCode,
        country: profile.country,
        avatar_url: profile.avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }
      toast.success("Perfil atualizado com sucesso!");
      setInitialProfile(profile);
      setIsEditing(false);

      // Forçar atualização do app para que a barra lateral e superior capturem o novo avatar do DB
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.message || "Erro ao atualizar o perfil. Verifique os dados.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Máscaras de formatação manual
  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 10)
      return v
        .replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
        .replace(/-$/, "");
    return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  };

  const maskDocument = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
      return v
        .replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4")
        .replace(/[\.\-]$/, "");
    } else {
      return v
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5")
        .replace(/[\.\/\-]$/, "");
    }
  };

  const maskZipCode = (v: string) => {
    v = v.replace(/\D/g, "");
    return v.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    let { name, value } = e.target;

    // Apply masks
    if (name === "phone") value = maskPhone(value);
    if (name === "document") value = maskDocument(value);
    if (name === "zipCode") value = maskZipCode(value);

    setProfile((prev) => ({ ...prev, [name]: value }));
    setIsEditing(true);
  };

  // Avatar upload logic (mocked visually because Storage needs to be setup, but we provide the UX)
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const userInitials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-200">
      {/* Header Profile Title */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-border/50">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/5 overflow-hidden font-black text-xl border border-primary/20">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              userInitials || <User className="w-8 h-8" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
              Meu Perfil
            </h1>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mt-1">
              Gerencie suas informações no Naveo
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-black text-foreground uppercase tracking-widest leading-none">Último Acesso</span>
            <span className="text-[10px] text-muted-foreground font-bold mt-1">Hoje às 10:45</span>
          </div>
          <div className="w-1 h-8 bg-border/40 rounded-full mx-2" />
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar: Profile Photo & Language */}
        <div className="xl:col-span-4 space-y-6">
          {/* Photo Card */}
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm flex flex-col items-center text-center">
            <div
              className="relative w-48 h-48 rounded-[3.5rem] bg-background border-4 border-card flex items-center justify-center overflow-hidden group cursor-pointer shadow-2xl mb-8 outline outline-1 outline-border/40"
              onClick={handleAvatarClick}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <span className="text-6xl font-black text-primary transition-transform duration-500 group-hover:scale-110">
                  {userInitials || <User size={60} />}
                </span>
              )}
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[4px]">
                <Camera className="w-10 h-10 text-white" />
              </div>
            </div>

            <h3 className="text-xl font-black text-foreground mb-1 uppercase tracking-tight">Foto de Exibição</h3>
            <p className="text-xs text-muted-foreground font-medium mb-8 max-w-[200px]">Formatos aceitos JPG, PNG e WEBP até 10MB.</p>
            
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleAvatarClick}
                className="w-full bg-foreground text-background hover:bg-primary hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
              >
                Alterar Foto
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Language / Account Info */}
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm">
             <div className="space-y-8">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 block pl-1">Idioma da Interface</label>
                   <div className="relative group">
                     <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                     <select
                        name="language"
                        value={profile.language}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full bg-background border border-border/50 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold appearance-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                     >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                     </select>
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 block pl-1">E-mail da Conta</label>
                   <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-border/40 flex items-center justify-between">
                      <span className="text-sm font-black text-foreground/70 truncate mr-2">{profile.email}</span>
                      <Shield className="w-4 h-4 text-primary shrink-0" />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Area: Form */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* General Information */}
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-10 pl-1 border-l-4 border-primary ml-1">Informações Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Nome Completo</label>
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Ex: João Silva"
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Nome da Empresa</label>
                <input
                  type="text"
                  name="companyName"
                  value={profile.companyName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Opcional"
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Telefone Principal</label>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Documento (CPF/CNPJ)</label>
                <input
                  type="text"
                  name="document"
                  value={profile.document}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="000.000.000-00"
                  maxLength={18}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Localization Information */}
          <div className="bg-card border border-border/50 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-10 pl-1 border-l-4 border-primary ml-1">Endereço e Faturamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-8">
              <div className="md:col-span-3 lg:col-span-4 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Endereço / Rua</label>
                <input
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-1 lg:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Número</label>
                <input
                  name="addressNumber"
                  value={profile.addressNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  maxLength={10}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Bairro</label>
                <input
                  name="neighborhood"
                  value={profile.neighborhood}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Cidade</label>
                <input
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-1 lg:col-span-1 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Estado</label>
                <input
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="UF"
                  maxLength={2}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-1 lg:col-span-1 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">CEP</label>
                <input
                  name="zipCode"
                  value={profile.zipCode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full bg-background border border-border/50 rounded-2xl p-5 text-[15px] font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-6 flex justify-end gap-4">
             {isEditing ? (
               <>
                 <button
                   onClick={() => {
                     setProfile(initialProfile);
                     setIsEditing(false);
                   }}
                   className="px-10 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-foreground/5 transition-all"
                 >
                   Descartar
                 </button>
                 <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-white px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                 >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                 </button>
               </>
             ) : (
               <button
                  onClick={() => setIsEditing(true)}
                  className="bg-foreground text-background hover:bg-primary hover:text-white px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"
               >
                  Editar Dados
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
