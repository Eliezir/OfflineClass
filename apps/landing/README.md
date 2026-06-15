# Landing page — OfflineClass

Marketing site do produto. App **React 19 + Vite + Tailwind v4 + shadcn/ui**, com
componentes do **[Magic UI](https://magicui.design/docs/components)** para animação
e efeitos. Estética inspirada no [Framer](https://www.framer.com/): superfícies
neutras profundas, um único acento violeta (a marca), sem gradientes “arco-íris”.
Dark-first com toggle (respeita `prefers-color-scheme`).

```bash
pnpm --filter @offlineclass/landing dev        # http://localhost:5173
pnpm --filter @offlineclass/landing build      # build de produção → landing/dist
pnpm --filter @offlineclass/landing typecheck  # tsc --noEmit
```

## Estrutura

```
src/
  App.tsx, main.tsx, index.css        # shell, entrypoint, tema (tokens shadcn)
  content/
    site.json   ← conteúdo da landing (hero, recursos, equipe, plataformas…)
    docs.json   ← documentação (mini-markdown), seção Docs
    index.ts    ← tipa e exporta o conteúdo
  components/
    ui/         # primitivos shadcn (button, card, badge, accordion)
    magicui/    # Particles, BlurFade, WordRotate, NumberTicker, Marquee,
                #   BentoGrid, BorderBeam, MagicCard, ShimmerButton, Safari,
                #   ScrollProgress, DotPattern, AnimatedGridPattern, AnimatedShinyText
    sections/   # Header, Hero, Features, HowItWorks, Examples, Download,
                #   Releases, Docs, Footer
  hooks/        # use-releases (GitHub API) + releases-context
  lib/          # cn() e renderer de mini-markdown
public/
  assets/       # logos, banners, thumbs dos exemplos
  tecnica/      # documentação técnica (página antiga) — copiada para dist/tecnica
```

## Como adaptar

- **Texto / recursos / equipe / plataformas:** `src/content/site.json`.
- **Documentação:** `src/content/docs.json`. Cada `body` aceita mini-markdown:
  `**negrito**`, `` `código` ``, `[link](url)`, listas `-`/`1.`, citações `>`, títulos `#`.
- **Tema:** tokens em `:root`/`.dark` de `src/index.css` (formato shadcn, OKLch).

## Download & Releases

Consomem a API pública do GitHub (`/repos/{owner}/{name}/releases`), configurada
em `site.json → repo`. Uma única requisição é compartilhada via `ReleasesProvider`.

- O instalador de cada SO é detectado por regex em `site.json → platforms[].match`
  (ex.: `\\.dmg$`, `\\.exe$`, `\\.AppImage$`).
- Sem releases publicados, mostra estado “em breve” — popula sozinho no primeiro release.

## Deploy

`.github/workflows/pages.yml` builda esta pasta e publica `landing/dist` no GitHub
Pages a cada push em **`develop`** que toque em `landing/**`. O `base: './'` do Vite
mantém os caminhos relativos, então funciona no subpath do Pages do projeto.
```
