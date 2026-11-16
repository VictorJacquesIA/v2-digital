import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Sem restauração de rolagem: o site sempre abre no topo, mesmo após
    // recarregar estando na seção do diagnóstico. Os links de âncora
    // (#auditoria etc.) continuam rolando normalmente ao clicar.
    scrollRestoration: false,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  return router;
};
