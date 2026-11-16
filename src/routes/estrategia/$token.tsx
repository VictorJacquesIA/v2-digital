import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/v2/ui";
import { lerEstrategiaPublica } from "@/lib/leads.functions";
import { whatsappLink } from "@/lib/contact";

const q = (token: string) =>
  queryOptions({ queryKey: ["estrategia-publica", token], queryFn: () => lerEstrategiaPublica({ data: { token } }) });

export const Route = createFileRoute("/estrategia/$token")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.token)),
  head: () => ({
    meta: [
      { title: "Sua estratégia exclusiva — V2 Digital" },
      { name: "description", content: "Estratégia personalizada da V2 Digital para o seu negócio aparecer mais no Google." },
      { property: "og:title", content: "Sua estratégia exclusiva — V2 Digital" },
      { property: "og:description", content: "Estratégia personalizada da V2 Digital, disponível por 3 dias." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Pagina,
});

const BLOCOS = [
  { k: "raioX", t: "1. O raio-X atual" },
  { k: "mapa", t: "2. Como rankear melhor no Google" },
  { k: "ia", t: "3. Como otimizar para inteligência artificial" },
  { k: "plano", t: "4. O plano de ação da V2" },
] as const;

const fmt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function Pagina() {
  const { token } = Route.useParams();
  const { data: r } = useSuspenseQuery(q(token));

  if (!r || r.expirada || !r.estrategia) {
    return (
      <main className="leads-page">
        <span className="v2-overline site-overline">Estratégia V2 Digital</span>
        <h1 className="ds-h1">{r ? "Esta estratégia expirou." : "Link não encontrado."}</h1>
        <p className="ds-body">Entre em contato com a V2 para solicitar uma versão atualizada.</p>
        <div className="leads-acoes">
          <Button href={whatsappLink("Olá! Meu link de estratégia da V2 expirou, quero uma versão atualizada.")}>Falar com a V2 no WhatsApp</Button>
        </div>
      </main>
    );
  }

  const est = r.estrategia;
  return (
    <main className="leads-page">
      <span className="v2-overline site-overline">Estratégia exclusiva · válida por 3 dias</span>
      <h1 className="ds-h1">{r.nome}</h1>
      {r.expira && <p className="leads-sub">Disponível até {fmt(r.expira)}</p>}
      {BLOCOS.map((b) => (
        <section key={b.k} className="leads-bloco">
          <h2 className="leads-bloco-t">{b.t}</h2>
          <p className="leads-bloco-txt">{est[b.k]}</p>
        </section>
      ))}
      <div className="leads-acoes">
        <Button href={whatsappLink(`Olá! Vi a estratégia da ${r.nome} e quero executar com a V2.`)}>Quero executar essa estratégia com a V2</Button>
      </div>
    </main>
  );
}
