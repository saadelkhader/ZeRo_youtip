# ZeRo youtip

A minimalist, premium, anti-distraction web app that turns passive YouTube
consumption into active learning.

> **ZeRo** — semibold, primary · **youtip** — light, tertiary.

## Stack

- **Next.js 14** (App Router) · **TypeScript** (strict)
- **Tailwind CSS v3** + custom design system (`tailwind.config.ts`)
- **shadcn/ui** components (added manually, in `src/components/ui`)
- **Lucide React** icons
- **Zustand** for global state (player / vault / ui)
- **TanStack Query v5** for server state
- **Supabase** (`@supabase/ssr`) for auth + data
- **next-pwa** for installable PWA support
- **next-themes** for automatic dark mode

## Installation (5 étapes)

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Créer un projet Supabase** sur <https://supabase.com> (gratuit), puis
   récupérer dans _Project Settings → API_ : l'**URL** du projet et la clé
   **anon public**.

3. **Configurer les variables d'environnement**

   ```bash
   cp .env.local.example .env.local
   ```

   Puis remplir :

   ```
   NEXT_PUBLIC_SUPABASE_URL=...        # URL de ton projet Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # clé anon public
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Appliquer le schéma** : ouvre le _SQL Editor_ de Supabase, colle le contenu
   de [`supabase/schema.sql`](supabase/schema.sql) et exécute-le. Il crée les
   tables, la RLS, les policies et le trigger de création de profil.

   > Pour Google OAuth : active le provider Google dans _Authentication →
   > Providers_ et ajoute `…/auth/callback` aux _Redirect URLs_.

5. **Lancer l'app**

   ```bash
   npm run dev
   ```

   Ouvre <http://localhost:3000>.

> Tant que les clés Supabase sont absentes, l'auth est **désactivée
> automatiquement** (`src/lib/supabase/middleware.ts`) : l'UI reste navigable,
> les listes sont vides et les mutations ne font rien. Dès que les clés sont
> présentes, les utilisateurs non connectés sont redirigés vers `/login`.

## Design system

Defined as CSS variables in `src/app/globals.css` (light + `.dark`) and surfaced
as Tailwind tokens in `tailwind.config.ts`:

- **Colors** — `background`, `surface{,-secondary}`, `text-{primary,secondary,tertiary}`,
  `accent{,-hover}`, `success`, `warning`, `error`, `border-{light,strong}`.
- **Type** — Inter (sans) + JetBrains Mono (`font-mono`, for timestamps).
  Scale: `xs 12 · sm 13 · base 14 · md 15 · lg 17 · xl 20 · 2xl 24 · 3xl 30`.
  Weights: 400 / 500 / 600 only.
- **Spacing** — 4px system. **Radius** — `sm 4 · 8 · md 10 · lg 16 · xl 20 · 2xl 24 · full`.
- **Shadows** — `shadow-soft`, `shadow-card`, `shadow-elevated`.

## Structure

```
src/
├── app/
│   ├── (auth)/            login + register
│   ├── (dashboard)/       sidebar (desktop) + bottom nav (mobile) shell
│   │   ├── page.tsx       Home
│   │   ├── vaults/        list + [vaultId]
│   │   ├── queue · notes · actions · history · stats · settings
│   ├── player/[videoId]/  full-screen distraction-free player
│   ├── layout.tsx · globals.css
├── components/
│   ├── ui/                shadcn primitives
│   ├── layout/            Sidebar · BottomNav · Header · MiniPlayer · DailyQuota
│   ├── player/ · shared/
├── lib/
│   ├── supabase/          client · server · middleware
│   ├── stores/            playerStore · vaultStore · uiStore
│   ├── utils/             youtube · time · cn
│   └── types/             domain interfaces
└── middleware.ts
```

## Layout behavior

- **Desktop (≥ md / 768px):** fixed 240px sidebar, content offset `ml-60`,
  mini-player pinned to the bottom (72px), sidebar-offset.
- **Mobile (375px first):** full-width content, frosted bottom nav (60px) with
  4 tabs + a **More** drawer; mini-player floats just above the nav.

## Notes / placeholders

- The two PWA icons in `public/icons/` are solid-accent placeholders — replace
  with real artwork before shipping.
- Auth, data fetching, and persistence are stubbed (forms validate but don't yet
  call Supabase). Domain types and clients are in place to wire them up.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (PWA disabled in dev)
npm run start   # serve the production build
npm run lint    # eslint
```
