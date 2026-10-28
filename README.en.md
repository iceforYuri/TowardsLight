<h1 align="center">TowardsLight</h1>

<p align="center">
  <img alt="Astro 5" src="https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white">
  <img alt="Node.js 22 recommended" src="https://img.shields.io/badge/Node.js-22%20recommended-25323D?logo=nodedotjs&logoColor=white">
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-blue">
</p>

<p align="center"><strong>An Astro publishing system that treats content boundaries, the Markdown compiler, and visual state as parts of one static build.</strong></p>

<p align="center"><a href="./README.md">简体中文</a> · <a href="./README.en.md">English</a></p>

![TowardsLight overview: light and dark home pages inside a profile-driven content space](public/poster/01-flat-hero.png)

## Why TowardsLight

TowardsLight separates personal content, rendering rules, and page presentation into three explicit layers: a profile determines what can be built, the Markdown pipeline determines how content becomes structure, and the interface layer determines how that structure and its state are read. The result is both a personal site template and a static publishing system that can evolve on its own terms.

| Area                            | Capabilities                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content and template**  | Separate profile directory · external / `personal/` / built-in showcase detection · empty-directory scaffold with site settings, first post, and CI · independent template and content maintenance |
| **Markdown rendering**    | KaTeX math · hand-drawn Mermaid with light/dark variants and a diagram/source toggle · callouts · image captions · dual-theme code highlighting and copy                                            |
| **Long-form reading**     | Reading-position progressive outline · current-section stroke · full mobile outline · reading progress · image lightbox with keyboard controls                                                      |
| **Theme and motion**      | Flash-free light/dark themes · state continuity across soft navigation · feathered hero wallpaper · linked Dock navigation motion · reduced-motion support                                          |
| **Image engineering**     | Article image asset pipeline optimization · WebP derivatives for large site images · missing-image placeholder and warning · cache isolation between profiles                                        |
| **Search and publishing** | Fuse.js full-text search · shortcut access and result reranking · site prefetch · slow-navigation feedback · RSS, sitemap, share cards, and structured data                                         |

## Interface

The four scenes below show the theme system, long-form reading, responsive composition, and content discovery.

| Theme / Light + Dark                                                                                                                                  | Reading / Room to Read                                                                                                                                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Light and dark home pages with one visual language](public/poster/02-flat-light-dark.png)Semantic tokens · light/dark themes · shared composition | ![Article typography, diagrams, and editor workflow](public/poster/03-editorial-collage.png)Article typography · hand-drawn diagrams · editor workflow |
| **Responsive / Made to Adapt**                                                                                                                  | **Discovery / Explore Your Space**                                                                                                                 |
| ![Link, code, desktop, and mobile views](public/poster/04-responsive-collage.png)Desktop · mobile · link directory · code reading                  | ![Chronological archive and tag discovery](public/poster/05-spacious-discovery.png)Chronological archive · tag aggregation · spatial discovery         |

## Quick start

Node.js 22 is recommended. Astro 5 also supports Node.js `18.20.8`, `20.3+`, and `22+`. Run these commands from the project root:

```bash
git clone https://github.com/iceforYuri/TowardsLight.git
cd TowardsLight
npm install
npm run dev       # http://localhost:4321
```

A production build performs type checking first, then writes the static site to `dist/`:

```bash
npm run build
npm run preview
```

The bundled `showcase` profile is used when no profile is specified and there is no valid `personal/site.ts` at the project root.

## Profiles

Posts, site settings, links, and images form one **profile directory**. The template reads it through `src/profiles/active` and maps site-level images through `public/images`. Resolution order:

1. The directory specified by `SITE_PROFILE_DIR`;
2. Root-level `personal/`, if it contains `site.ts`;
3. The bundled `src/profiles/showcase/` example.

`site.ts`, `links.ts`, and `posts/` are required; `images/` is optional. When the profile changes, the setup script rebuilds the directory links, validates the target, and clears Astro content caches if the target moved. One working copy serves one profile at a time; use a separate `git worktree` when two profiles need to run side by side.

### Create a profile from an empty directory

```powershell
npm run new-profile -- C:/path/to/my-blog-data
$env:SITE_PROFILE_DIR = 'C:/path/to/my-blog-data'
npm run dev
```

When the target is empty, `new-profile` creates a runnable profile with `site.ts`, `links.ts`, `posts/`, `images/`, a first draft, and a build-validation workflow based on the template repository. A profile placed at the project's `personal/` path is detected automatically and can be maintained as its own Git repository.

```text
my-blog-data/
├── site.ts      # site name, author, hero, default theme, page copy, category settings
├── links.ts     # link groups, tones, card styles, status, and home-page placement
├── posts/       # Markdown posts
│   └── image/   # post-level images referenced by relative path
└── images/      # optional: avatar, hero, page backgrounds, shared covers via /images/...
```

Restart a running dev server after switching profiles. Keeping content in a separate repository lets you update the template without merging private posts; any new profile fields introduced by a template update still need to be added to that profile.

## Markdown pipeline

| Content                     | Current implementation                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Math**              | `remark-math` parsing; build-time `KaTeX 0.16.47` HTML; no formula runtime; pinned superscript, subscript, and overlap rules                                               |
| **Mermaid**           | Build-time Playwright Chromium rendering; serial light/dark SVGs; `handDrawn` style; fixed `handDrawnSeed`; diagram/source toggle; syntax and unavailable-browser fallback |
| **Callouts**          | `NOTE` / `TIP` / `IMPORTANT` / `WARNING` / `CAUTION`; custom titles; `+` / `-` native `<details>` initial state                                                |
| **Article images**    | Astro asset pipeline; `alt`-derived captions; two-layer remark + Vite guard; missing-image SVG placeholder; original-path warning                                            |
| **Code**              | Shiki light/dark tokens; original fence language badge; copy control; idempotent soft-navigation binding                                                                       |
| **Image interaction** | No third-party dependency; click / Enter / Space / ESC / backdrop close; scroll lock; focus return; failed-image protection; `prefers-reduced-motion`                        |

## Write a post

Create a `.md` file in the active profile's `posts/` directory:

```yaml
---
title: Post title
description: A short summary
pubDate: 2026-09-05
updatedDate: 2026-09-06         # optional
category: Frontend
tags: [Astro, Blogging]
draft: false                    # true keeps the post out of public builds and indexes
cover: /images/covers/wide.svg  # optional; image/my-post/cover.jpg also works
coverAlt: Cover description     # optional
coverPosition: center 30%       # optional crop focus
featured: false                 # optional home-page featured post
---
```

Put article images under `posts/image/<post-name>/` and reference them by relative path. Start a callout block with a type marker:

```md
> [!NOTE]+ Optional custom title
> This content is expanded by default.
```

The home page shows at most three `featured` posts. The recent list excludes only featured posts that are actually displayed, so additional featured posts fall back naturally in chronological order. The bundled “How to write a post on this blog” example covers the full workflow.

## Theme, navigation, and feedback

The light and dark themes combine the profile's `themeDefault` with a visitor's stored choice. Color, surface, border, and accent values run through semantic variables. An inline script chooses among `localStorage`, the profile default, and the operating-system preference before first paint. During View Transition navigation, the current theme, direction, and page type move into the next document so it does not reflash into another visual state.

The home wallpaper freezes through a sticky track; JavaScript only calculates the extra travel between the identity block and the main card instead of simulating `fixed` with frame-by-frame scroll events. All static pages use the `load` prefetch strategy and enter the cache after the current page finishes loading. The navigation progress bar appears only after 120ms, keeping quick transitions quiet. The Dock, wallpaper, feathered veil, and search layer occupy explicit z-index and transition layers, and reduced-motion mode keeps the complete layout and interaction path.

## Configure the site

| Surface                        | Location and responsibility                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Content identity**     | Profile `site.ts`; site name, author, hero, page copy, default theme, current status, and category presentation |
| **Link space**           | Profile `links.ts`; groups and tones, link status, links-page cards, and up to three home-page destinations     |
| **Visual tokens**        | `src/styles/global.css`; light/dark canvas, surfaces, text, borders, accents, shadows, and type scale           |
| **Build and deployment** | `siteUrl` in profile `site.ts`; `SITE_URL` / `SITE_BASE` environment overrides; base-aware links          |

For links, `featured` controls the larger card treatment on the links page while `home` controls home-page placement; they are independent. Restart the dev server after changing the active profile. The next startup log identifies profile-link changes and content-cache cleanup.

## Project structure

```text
src/
├── components/       page components, outline, lightbox, search, and theme controls
├── layouts/          page shell, theme initialization, and soft-navigation state
├── pages/            home, posts, archive, tags, categories, links, and content indexes
├── plugins/          Markdown, image, caption, and callout processors
├── profiles/         current-profile links and bundled showcase
├── scripts/          image, code-copy, and navigation enhancements
├── styles/           semantic tokens, typography, and View Transition styles
└── utils/            post ordering, URL, image derivatives, and reading statistics
```

Template code and profile content share a schema without sharing a version history. Routes organize compiled output, while image assets, link indexes, search results, and RSS are all derived from the active profile.

## Commands

| Command                                | Purpose                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                        | Resolve active profile · generate image derivatives · start development server |
| `npm run build`                      | `astro check` · production build · output `dist/`                          |
| `npm run preview`                    | Preview production build locally                                                 |
| `npm test`                           | Image-guard tests · callout tests                                               |
| `npm run check`                      | Astro check · TypeScript check                                                  |
| `npm run frontmatter:check`          | Validate active-profile post metadata                                            |
| `npm run new-profile -- <directory>` | Empty-directory profile scaffold · first post · build-validation workflow      |
| `npm run fonts`                      | Update self-hosted font assets                                                   |
| `npm run fonts:display`              | Regenerate display-font subsets                                                  |

## Deployment

Run `npm run build` and publish `dist/` to any static host. Put the production URL in the profile's `siteUrl`, or override it with `SITE_URL`; set `SITE_BASE` when deploying under a subpath. Canonical URLs, RSS, sitemap, internal links, and structured data all use the same URL configuration.

## Related project

- [TowardsLight_extension](https://github.com/iceforYuri/TowardsLight_extension): a VS Code sidebar for managing posts, categories, links, and site settings, with a real development-server preview.

## Icons and fonts

Icons are emitted as inline Lucide SVGs on demand. Body and UI fonts are self-hosted in `public/fonts/`: Playfair Display, Noto Serif SC, Noto Sans SC, Inter, and JetBrains Mono. The home and section headings use additional subsetted display fonts. Local alias family names and system fallbacks prevent unrelated same-name variable fonts from changing the intended weights.

## License

MIT
