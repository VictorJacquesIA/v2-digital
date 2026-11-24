// Configuração do Vite: plugins declarados aqui, sem pacote de configuração pronto.
// O Nitro só entra no build: na Vercel ele detecta a plataforma sozinho; fora dela gera um servidor Node.
// Nunca defina ssr.external nem resolve.external: o servidor é empacotado num arquivo só.
import { defineConfig, loadEnv, type PluginOption } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Arquivos de servidor nunca vão para o navegador.
      importProtection: { behavior: "error", client: { files: ["**/server/**"], specifiers: ["server-only"] } },
      // O servidor começa por src/server.ts (tratamento de erros do SSR).
      server: { entry: "server" },
    }),
  ];
  if (command === "build") plugins.push(nitro({ vercel: { functions: { maxDuration: 60 } } }));
  plugins.push(viteReact());

  // Variáveis VITE_* do .env disponíveis no navegador e no servidor.
  const define: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(loadEnv(mode, process.cwd(), "VITE_"))) {
    define[`import.meta.env.${chave}`] = JSON.stringify(valor);
  }

  return {
    plugins,
    define,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
