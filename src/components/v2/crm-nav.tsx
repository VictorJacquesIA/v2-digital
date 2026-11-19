import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui";

// Novas telas do CRM entram aqui conforme ficam prontas
const ITENS = [
  { to: "/crm/funil", r: "Funil" },
  { to: "/crm/agenda", r: "Agenda" },
  { to: "/leads", r: "Contatos do diagnóstico" },
] as const;

export function useAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "").eq("role", "admin");
      return { ok: (data?.length ?? 0) > 0, email: u.user?.email ?? "" };
    },
  });
}

export function CrmNav() {
  return (
    <nav className="crm-nav" aria-label="Seções do CRM">
      {ITENS.map((i) => (
        <Link key={i.to} to={i.to} className="crm-nav-link" activeProps={{ className: "crm-nav-link crm-nav-on", "aria-current": "page" }}>
          {i.r}
        </Link>
      ))}
    </nav>
  );
}

/** Moldura das telas do CRM: título, navegação, sair e bloqueio para quem não é admin. */
export function CrmShell({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const admin = useAdmin();

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="crm-page">
      <header className="leads-top">
        <div>
          <span className="v2-overline site-overline">CRM</span>
          <h1 className="ds-h1">{titulo}</h1>
        </div>
        <div className="crm-top-acoes">
          {admin.data?.ok && acao}
          <Button variant="secondary" size="sm" onClick={sair}>Sair</Button>
        </div>
      </header>
      <CrmNav />
      {admin.isLoading && <p className="ds-body">Carregando…</p>}
      {admin.data && !admin.data.ok && <p className="ds-body">A conta {admin.data.email} não tem acesso a este painel.</p>}
      {admin.data?.ok && children}
    </main>
  );
}
