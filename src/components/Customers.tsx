import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Search,
  Plus,
  MoreVertical,
  Filter,
  FileSpreadsheet,
  UserPlus,
  X,
  AlertTriangle,
  Trash2,
  Eye,
  MapPin,
  Building2,
  Phone,
  Mail,
  Fingerprint,
  Pencil,
} from "lucide-react";
import { cn } from "../lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { formatPhone } from "../lib/masks";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Ativo" | "Inativo";
  company: string;
  since: string;
  document?: string;
  asaas_id?: string;
  cep?: string;
  address?: string;
  address_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

const customerSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().optional(),
  company: z.string().optional(),
  document: z.string().optional(),
  asaas_id: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().optional(),
  address_number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

export function Customers({ profile }: { profile?: any }) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserAuth(data.user);
        let ownerId = data.user.id;
        if (profile?.admin_id) {
          ownerId = profile.admin_id;
        }
        setTeamOwnerId(ownerId);
        fetchCustomers(ownerId);
      } else {
        setLoading(false);
      }
    });
  }, [profile?.id, profile?.admin_id]);

  useEffect(() => {
    if (!teamOwnerId) return;

    const channel = supabase
      .channel("customers-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
          filter: `user_id=eq.${teamOwnerId}`,
        },
        () => {
          fetchCustomers(teamOwnerId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamOwnerId]);

  const fetchCustomers = async (userId: string) => {
    setLoading(true);
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (profile?.role === "super_admin") {
      // Super admin vê tudo
    } else if (profile?.admin_id) {
      // Modo Equipe: Vê os clientes da equipe (onde user_id = admin_id)
      query = query.eq("user_id", profile.admin_id);
    } else {
      // Modo Independente: Vê os que possuem seu user_id ou que você criou
      query = query.or(`user_id.eq.${userId},created_by.eq.${userId}`);
    }
    const { data, error } = await query;
    if (error) toast.error("Erro ao carregar clientes.");
    else if (data) {
      setCustomers(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone || "",
          company: d.company || "",
          status: d.status || "Ativo",
          document: d.document || "",
          asaas_id: d.asaas_id || "",
          cep: d.cep || "",
          address: d.address || "",
          address_number: d.address_number || "",
          neighborhood: d.neighborhood || "",
          city: d.city || "",
          state: d.state || "",
          since: new Date(d.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        })),
      );
    }
    setLoading(false);
  };

  const handleCreateCustomer = async (data: CustomerFormValues) => {
    const ownerId = teamOwnerId || userAuth?.id;
    if (!ownerId) return;

    const dbCustomer = {
      ...data,
      user_id: ownerId,
      created_by: userAuth?.id,
    };
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert(dbCustomer)
      .select()
      .single();

    if (error) toast.error("Erro ao criar cliente: " + error.message);
    else if (newCustomer) {
      toast.success("Cliente criado com sucesso!");
      fetchCustomers(ownerId);
      setModalOpen(false);
    }
  };

  const handleUpdateCustomer = async (data: CustomerFormValues) => {
    if (!customerToEdit) return;
    const { error } = await supabase
      .from("customers")
      .update(data)
      .eq("id", customerToEdit.id);

    if (error) {
      toast.error("Erro ao atualizar cliente: " + error.message);
    } else {
      toast.success("Cliente atualizado com sucesso!");
      fetchCustomers(teamOwnerId || userAuth?.id);
      setCustomerToEdit(null);
      reset();
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete || !userAuth) return;
    setIsDeleting(true);
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerToDelete.id);
    if (error) toast.error("Erro ao excluir cliente: " + error.message);
    else {
      toast.success("Cliente exluído!");
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      setCustomerToDelete(null);
    }
    setIsDeleting(false);
  };

  const handleStatusChange = async (
    customerId: string,
    newStatus: "Ativo" | "Inativo",
  ) => {
    // Atualização otimista: muda no UI primeiro para ser instantâneo
    const oldCustomers = [...customers];
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c)),
    );

    const { error } = await supabase
      .from("customers")
      .update({ status: newStatus })
      .eq("id", customerId);

    if (error) {
      toast.error("Erro ao atualizar status.");
      // Se der erro, volta ao estado anterior
      setCustomers(oldCustomers);
    } else {
      toast.success(`Status alterado para ${newStatus}!`);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-xl relative overflow-hidden">
          <h3 className="text-muted-foreground font-medium mb-1">
            Total de Clientes
          </h3>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {customers.length}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Listagem de Clientes
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none"
              />
            </div>
            <Dialog.Root open={isModalOpen} onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) {
                reset();
              }
            }}>
              <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/20 active:scale-95">
                  <UserPlus className="w-4 h-4" /> Novo Cliente
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 animate-fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 z-50 max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border/50 flex justify-between items-center">
                    <Dialog.Title className="text-xl font-bold text-foreground">
                      Novo Cliente
                    </Dialog.Title>
                    <Dialog.Close>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Dialog.Close>
                  </div>
                  <div className="p-6">
                    <form
                      id="customer-form"
                      onSubmit={handleSubmit(handleCreateCustomer)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            Nome *
                          </label>
                          <input
                            type="text"
                            {...register("name")}
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                          {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            CPF ou CNPJ
                          </label>
                          <input
                            type="text"
                            {...register("document")}
                            placeholder="000.000.000-00"
                            onChange={(e) => {
                              const { formatCPFCNPJ } = require("../lib/masks");
                              const formatted = formatCPFCNPJ(e.target.value);
                              e.target.value = formatted;
                              setValue("document", formatted);
                            }}
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            E-mail *
                          </label>
                          <input
                            type="email"
                            {...register("email")}
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                          {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            Telefone
                          </label>
                          <input
                            type="text"
                            {...register("phone")}
                            placeholder="(00) 00000-0000"
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              e.target.value = formatted;
                              setValue("phone", formatted);
                            }}
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            Empresa / Razão Social
                          </label>
                          <input
                            type="text"
                            {...register("company")}
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            ID Asaas
                          </label>
                          <input
                            type="text"
                            {...register("asaas_id")}
                            placeholder="cus_..."
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/30">
                        <h4 className="text-sm font-bold text-foreground mb-4">Endereço</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              CEP
                            </label>
                            <input
                              type="text"
                              {...register("cep")}
                              placeholder="00000-000"
                              onChange={(e) => {
                                const { formatCEP } = require("../lib/masks");
                                const formatted = formatCEP(e.target.value);
                                e.target.value = formatted;
                                setValue("cep", formatted);
                              }}
                              className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Logradouro / Rua
                            </label>
                            <input
                              type="text"
                              {...register("address")}
                              className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Número
                            </label>
                            <input
                              type="text"
                              {...register("address_number")}
                              className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Bairro
                            </label>
                            <input
                              type="text"
                              {...register("neighborhood")}
                              className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Cidade
                            </label>
                            <input
                              type="text"
                              {...register("city")}
                              className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Estado
                            </label>
                            <input
                              type="text"
                              {...register("state")}
                              placeholder="EX: RS"
                              className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="p-6 border-t border-border/50 flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <button className="px-4 py-2 rounded-lg text-sm text-foreground border border-border">
                        Cancelar
                      </button>
                    </Dialog.Close>
                    <button
                      form="customer-form"
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                    >
                      {isSubmitting ? "Cadastrando..." : "Cadastrar"}
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background/50 border-b border-border/50">
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">
                  Nome
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">
                  Contato
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">
                  Empresa
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase">
                  Status
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground animate-pulse text-lg"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/50 hover:bg-foreground/5 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground text-sm uppercase tracking-tight">
                        {c.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {c.phone || "---"}
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {c.company || "---"}
                    </td>
                    <td className="py-4 px-6 inline-flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next =
                            c.status === "Ativo" ? "Inativo" : "Ativo";
                          handleStatusChange(c.id, next);
                        }}
                        className={`group relative min-w-[100px] h-8 px-4 rounded-full text-xs font-bold border transition-all duration-200 active:scale-95 flex items-center justify-center overflow-hidden ${
                          c.status === "Ativo"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400"
                        }`}
                      >
                        {/* Status Atual (Visível por padrão) */}
                        <span className="absolute transition-transform duration-300 group-hover:translate-y-[-150%]">
                          {c.status}
                        </span>

                        {/* Ação (Visível no Hover) */}
                        <span className="absolute translate-y-[150%] transition-transform duration-300 group-hover:translate-y-0 text-[10px] uppercase tracking-wider">
                          {c.status === "Ativo" ? "Desativar" : "Ativar"}
                        </span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {profile?.role === "super_admin" && (
                          <button
                            onClick={() => {
                              setCustomerToEdit(c);
                              reset({
                                name: c.name,
                                email: c.email,
                                phone: c.phone,
                                company: c.company,
                                document: c.document,
                                asaas_id: c.asaas_id,
                                cep: c.cep,
                                address: c.address,
                                address_number: c.address_number,
                                neighborhood: c.neighborhood,
                                city: c.city,
                                state: c.state,
                              });
                            }}
                            className="p-2 text-muted-foreground hover:text-blue-500 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCustomerToDelete(c);
                          }}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog.Root
        open={!!customerToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setCustomerToEdit(null);
            reset();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 z-50 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <Dialog.Title className="text-xl font-bold text-foreground">
                Editar Cliente
              </Dialog.Title>
              <Dialog.Close>
                <X className="w-4 h-4 text-muted-foreground" />
              </Dialog.Close>
            </div>
            <div className="p-6">
              <form
                id="edit-customer-form"
                onSubmit={handleSubmit(handleUpdateCustomer)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      CPF ou CNPJ
                    </label>
                    <input
                      type="text"
                      {...register("document")}
                      placeholder="000.000.000-00"
                      onChange={(e) => {
                        const { formatCPFCNPJ } = require("../lib/masks");
                        const formatted = formatCPFCNPJ(e.target.value);
                        e.target.value = formatted;
                        setValue("document", formatted);
                      }}
                      className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      {...register("phone")}
                      placeholder="(00) 00000-0000"
                      onChange={(e) => {
                        const { formatPhone } = require("../lib/masks");
                        const formatted = formatPhone(e.target.value);
                        e.target.value = formatted;
                        setValue("phone", formatted);
                      }}
                      className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Empresa / Razão Social
                    </label>
                    <input
                      type="text"
                      {...register("company")}
                      className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      ID Asaas
                    </label>
                    <input
                      type="text"
                      {...register("asaas_id")}
                      placeholder="cus_..."
                      className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <h4 className="text-sm font-bold text-foreground mb-4">Endereço</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        {...register("cep")}
                        placeholder="00000-000"
                        onChange={(e) => {
                          const { formatCEP } = require("../lib/masks");
                          const formatted = formatCEP(e.target.value);
                          e.target.value = formatted;
                          setValue("cep", formatted);
                        }}
                        className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Logradouro / Rua
                      </label>
                      <input
                        type="text"
                        {...register("address")}
                        className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        {...register("address_number")}
                        className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        {...register("neighborhood")}
                        className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        {...register("city")}
                        className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Estado
                      </label>
                      <input
                        type="text"
                        {...register("state")}
                        placeholder="EX: RS"
                        className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-border/50 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-lg text-sm text-foreground border border-border">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                form="edit-customer-form"
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 z-50 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <div>
                <Dialog.Title className="text-xl font-bold text-foreground">
                  Dados do cliente
                </Dialog.Title>
                <p className="text-xs text-muted-foreground">Informações detalhadas do cadastro</p>
              </div>
              <Dialog.Close>
                <X className="w-4 h-4 text-muted-foreground" />
              </Dialog.Close>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Seção Principal */}
              <div className="grid grid-cols-2 gap-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Razão Social / Nome</label>
                  <p className="text-sm font-bold text-foreground uppercase">{selectedCustomer?.company || selectedCustomer?.name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">CPF/CNPJ</label>
                  <p className="text-sm font-bold text-foreground">{selectedCustomer?.document || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Telefone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-primary/60" />
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.phone || "Não informado"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-primary/60" />
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">ID Asaas</label>
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-3 h-3 text-primary/60" />
                    <p className="text-sm font-medium text-foreground tracking-tight">{selectedCustomer?.asaas_id || "Não vinculado"}</p>
                  </div>
                </div>
              </div>

              {/* Seção Endereço */}
              <div className="pt-6 border-t border-border/30">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Endereço</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">CEP</label>
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.cep || "---"}</p>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Logradouro</label>
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.address || "---"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Número</label>
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.address_number || "---"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Bairro</label>
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.neighborhood || "---"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Cidade</label>
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.city || "---"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 block">Estado</label>
                    <p className="text-sm font-bold text-foreground">{selectedCustomer?.state || "---"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/50 flex justify-end">
              <Dialog.Close asChild>
                <button className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                  Fechar
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card rounded-2xl p-6 text-center z-50 border border-border/50">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Excluir Cliente
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Deseja realmente excluir <b>{customerToDelete?.name}</b>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-border text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-red-500 text-foreground font-bold text-sm"
              >
                Excluir
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
