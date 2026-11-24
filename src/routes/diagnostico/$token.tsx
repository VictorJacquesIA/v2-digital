import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/v2/ui";
import { Relatorio } from "@/components/v2/simulador";
import { lerDiagnosticoPublico } from "@/lib/simulador.functions";
import { whatsappLink } from "@/lib/contact";

const q = (token: string) =>
  queryOptions({ queryKey: ["diagnostico-publico", token], queryFn: () => lerDiagnosticoPublico({ data: { token } }) });

export const Route = createFileRoute("/diagnostico/$token")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(q(params.token)),
  head: () => ({
    meta: [
      { title: "Diagnóstico rápido do seu perfil no Google — V2 Digital" },
      { name: "description", content: "Diagnóstico rápido do perfil no Google, feito pela V2 Digital." },
      { property: "og:title", content: "Diagnóstico rápido do seu perfil no Google — V2 Digital" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { token } = Route.useParams();
  const { data } = useSuspenseQuery(q(token));

  if (!data) {
    return (
      <main className="leads-page">
        <span className="v2-overline site-overline">Diagnóstico V2 Digital</span>
        <h1 className="ds-h1">Link não encontrado.</h1>
        <p className="ds-body">Faça um diagnóstico novo no site ou fale com a V2.</p>
        <div className="leads-acoes">
          <Button href="/#auditoria">Fazer o diagnóstico rápido grátis</Button>
          <Button variant="secondary" href={whatsappLink("Olá! Meu link de diagnóstico da V2 não abriu.")}>Falar com a V2 no WhatsApp</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="leads-page diag-publico">
      <div className="diag-publico-topo sim-nao-imprimir">
        <a className="v2-header-link" href="/">← V2 Digital</a>
        <Button variant="secondary" size="sm" type="button" onClick={() => window.print()}>
          Salvar em PDF
        </Button>
      </div>
      <Relatorio r={data.relatorio} />
      <p className="diag-publico-rodape">
        Diagnóstico rápido gerado pela V2 Digital com dados públicos do Google. Ele mostra uma primeira noção do perfil; a análise completa é feita junto com você.
      </p>
    </main>
  );
}
