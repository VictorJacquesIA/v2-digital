# Agent rules
- Visual styling comes from the migrated V2 tokens and `v2-*`/`ds-*` classes at the end of src/styles.css; reuse them instead of ad hoc colors, because they are the brand's source of truth.
- Brand images are regular files in src/assets/ds, imported directly (Vite returns the URL); icons are local SVGs in src/assets/icons.
- The public site is one page at `/` using in-page anchors for its sections; the brand guide is a rules source, not a page in the site. Keep new sections as anchor targets on that page instead of adding routes.
- Use the capture helper in the diagnostic gate to await a confirmed insert before unlocking; returned Data API errors must block access just like network failures.
- The private leads panel lives at /leads under _authenticated with /auth sign-in; admin access comes from public.user_roles (owner email granted by trigger), never from the client.
- Diagnostic leads are one row per WhatsApp (counter + last interaction; new cycle after 7 days) and store the Google report snapshot so the admin-only AI strategy never re-queries Google.
- Client strategy links: /estrategia/$token reads only via the SECURITY DEFINER estrategia_publica RPC (expires 3 days after generation); AI uses Gemini when GEMINI_API_KEY is set, else the Lovable gateway, so it runs outside Lovable hosting.
