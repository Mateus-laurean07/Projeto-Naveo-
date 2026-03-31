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
    <div className="w-full max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-200 pb-12">
      {/* Header Profile Title */}
      <div className="flex items-center gap-6 mb-10 bg-card/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/40 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-background border-2 border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg shadow-primary/10 overflow-hidden font-black text-xl">
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
            Gerencie suas informações no Netuno
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div
              className="relative w-32 h-32 rounded-[2rem] bg-background border-2 border-primary/20 flex items-center justify-center overflow-hidden group cursor-pointer shadow-xl"
              onClick={handleAvatarClick}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="text-4xl font-black text-primary transition-transform duration-300 group-hover:scale-110">
                  {userInitials || <User size={40} />}
                </span>
              )}
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <Camera className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Foto de Perfil
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clique na imagem ou no botão para alterar seu avatar.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <button
                  onClick={handleAvatarClick}
                  className="bg-primary text-primary-foreground hover:opacity-90 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
                >
                  Fazer Upload
                </button>
                <div className="px-5 py-3 rounded-2xl border border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-background/50">
                  400x400px recomendado
                </div>
              </div>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Idioma */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Idioma</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                  Seleção do Sistema
                </p>
              </div>
            </div>
            <select
              name="language"
              value={profile.language}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full bg-background border border-border/40 rounded-xl px-4 py-3 text-foreground font-semibold focus:outline-none focus:border-accent transition-all duration-300 ${!isEditing ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <option value="pt-BR">Português BR</option>
              <option value="en-US">English US</option>
              <option value="es-ES">Español ES</option>
            </select>
          </div>

          {/* Email (Readonly) */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-sm flex items-center gap-4 group hover:border-primary/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 lime-glow">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-60">
                Email Principal (Conta)
              </p>
              <p className="font-black text-foreground truncate text-lg tracking-tight">
                {profile.email}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário Grid */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-accent"></span>
            Dados do Perfil
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Seu nome"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                name="companyName"
                value={profile.companyName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Sua empresa"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                Telefone *
              </label>
              <input
                type="text"
                name="phone"
                maxLength={15}
                value={profile.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="(00) 00000-0000"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                CPF/CNPJ *
              </label>
              <input
                type="text"
                name="document"
                maxLength={18}
                value={profile.document}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="00.000.000/0000-00"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                  Endereço *
                </label>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Rua, Avenida, etc"
                  className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                  Nº *
                </label>
                <input
                  type="text"
                  name="addressNumber"
                  value={profile.addressNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="123"
                  className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                Bairro
              </label>
              <input
                type="text"
                name="neighborhood"
                value={profile.neighborhood}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Bairro"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                Cidade *
              </label>
              <input
                type="text"
                name="city"
                value={profile.city}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Sua cidade"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                Estado *
              </label>
              <input
                type="text"
                name="state"
                value={profile.state}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Ex: SP"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                CEP *
              </label>
              <input
                type="text"
                name="zipCode"
                maxLength={9}
                value={profile.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="00000-000"
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-medium focus:outline-none focus:border-accent focus:bg-background transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="md:col-span-2 space-y-2 pb-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                País *
              </label>
              <select
                name="country"
                value={profile.country}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full bg-background/50 border border-border/60 rounded-xl px-4 py-3.5 text-foreground font-semibold focus:outline-none focus:border-accent transition-all duration-300 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <option value="BR">Brasil</option>
                <option value="US">Estados Unidos</option>
                <option value="PT">Portugal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Salvar Action */}
        <div className="pt-4 flex justify-end pb-12">
          {isEditing ? (
            <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/40 backdrop-blur-sm">
              <button
                onClick={() => {
                  setProfile(initialProfile);
                  setIsEditing(false);
                }}
                className="bg-transparent hover:bg-foreground/5 text-foreground/80 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground px-10 py-3.5 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-primary/20 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Perfil
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary px-10 py-4 rounded-[1.5rem] font-black flex items-center gap-3 transition-all border border-primary/20 shadow-xl shadow-primary/5 translate-y-0 hover:-translate-y-1 text-xs uppercase tracking-[0.2em]"
            >
              <Edit3 className="w-5 h-5" />
              Editar Meu Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
