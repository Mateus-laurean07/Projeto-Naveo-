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
  status: "Ativo" | "Inativo" | "Em Negociação";
  company: string;
  since: string;
};

const customerSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().optional(),
  company: z.string().optional(),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

export function Customers({ profile }: { profile?: any }) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userAuth, setUserAuth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserAuth(data.user);
        fetchCustomers(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchCustomers = async (userId: string) => {
    setLoading(true);
    let query = supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (profile?.role !== "super_admin") query = query.eq("user_id", userId);
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
    if (!userAuth) return;
    const dbCustomer = { ...data, user_id: userAuth.id };
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert(dbCustomer)
      .select()
      .single();
    if (error) toast.error("Erro ao criar cliente: " + error.message);
    else if (newCustomer) {
      toast.success("Cliente criado com sucesso!");
      fetchCustomers(userAuth.id);
      setModalOpen(false);
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
      toast.success("Cliente excluído!");
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      setCustomerToDelete(null);
    }
    setIsDeleting(false);
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
            <Dialog.Root open={isModalOpen} onOpenChange={setModalOpen}>
              <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-primary/20 active:scale-95">
                  <UserPlus className="w-4 h-4" /> Novo Cliente
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 animate-fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/50 z-50">
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
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Nome *
                        </label>
                        <input
                          type="text"
                          {...register("name")}
                          className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          {...register("email")}
                          className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            Telefone
                          </label>
                          <input
                            type="text"
                            {...register("phone")}
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              e.target.value = formatted;
                              setValue("phone", formatted);
                            }}
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                            Empresa
                          </label>
                          <input
                            type="text"
                            {...register("company")}
                            className="w-full bg-card border border-border/50 rounded-xl py-2 px-4 text-sm text-foreground"
                          />
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
                      {isSubmitting ? "Criando..." : "Criar Cliente"}
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
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-full text-xs font-medium border border-accent/20 bg-accent/10 text-accent">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setCustomerToDelete(c);
                        }}
                        className="text-red-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
