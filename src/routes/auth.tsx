import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Input } from "@/components/v2/ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Painel V2 Digital" },
      { name: "description", content: "Acesso restrito ao painel de contatos da V2 Digital." },
      { property: "og:title", content: "Entrar — Painel V2 Digital" },
      { property: "og:description", content: "Acesso restrito ao painel de contatos da V2 Digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/leads" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/leads" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true); setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setMsg("E-mail ou senha incorretos.");
    setEnviando(false);
  }

  return (
    <main className="leads-auth">
      <h1 className="ds-h1">Painel de contatos</h1>
      <p className="ds-lead">Acesso restrito à V2 Digital.</p>
      <form onSubmit={enviar} className="leads-auth-form">
        <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />
        <Button type="submit" disabled={enviando}>Entrar</Button>
      </form>
      {msg && <p className="ds-body">{msg}</p>}
    </main>
  );
}
