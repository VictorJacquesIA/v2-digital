# V2 Digital — site e CRM

Site público da V2 Digital (diagnóstico gratuito do Google Meu Negócio) e área privada com painel de leads e CRM.

- **Stack:** TanStack Start (React 19) + Vite, Tailwind 4, Supabase (banco e login).
- **Hospedagem:** Vercel, publicada a partir do GitHub.
- **Banco:** migrações em `drizzle/migrations`; `supabase/setup.sql` junta todas, em ordem, para um projeto novo.

## Rodar local

```bash
bun install
bun run dev
```

Copie `.env.example` para `.env` e preencha as variáveis (Supabase, `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`).

## Testes e build

```bash
bun run test
bun run build
```
