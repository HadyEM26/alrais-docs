# Al Rais Platform Documentation

Public-facing documentation for the Al Rais travel platform, built with [Docusaurus 3](https://docusaurus.io/).

**Live site:** https://hadyem26.github.io/alrais-docs/

## Quick start

```bash
npm install
npm run start     # Dev server at http://localhost:3000
npm run build     # Production build to ./build
npm run serve     # Preview the production build locally
```

## Repository structure

```
docs/
  intro.md                         # Home — worldview essay (stub)
  glossary.md                      # 69-term travel & platform glossary
  platform/
    overview.md                    # Platform overview (stub)
    architecture.md                # Architecture with Mermaid diagrams
    reliability.md                 # Resilience patterns
  connectors/
    index.md                       # Supplier landscape summary
    flights/                       # Provesio (GDS), Duffel (NDC)
    hotels/                        # RateHawk, Hotelbeds, Duffel Stays
    activities/                    # Viator (activities + transfers)
  orchestration/
    curation-engine.md             # Scoring & ranking
    package-composition.md         # Bundle pricing pipeline
    saga-orchestrator.md           # Distributed booking transactions
    failure-isolation.md           # Circuit breakers & fan-out
  modules/
    admin-panel-wiring.md          # Admin API endpoints
    dynamic-packages-gaps.md       # Known gaps & DI stubs
    chatbot-integration.md         # Chatbot ↔ middleware surface
  industry/
    supplier-models.md             # Merchant vs agency (stub)
    pricing-models.md              # Net rate, markup, yield (stub)
    regional-intelligence.md       # GCC/MENA specifics (stub)
    jargon-decoded.md              # Industry jargon for newcomers (stub)
```

Pages marked **(stub)** have `draft: true` frontmatter and contain editorial prompts for human authors to expand.

## Deployment — GitHub Pages

Automatic deployment via GitHub Actions. Every push to `main` builds and deploys to GitHub Pages.

**Setup (one-time):**

1. Go to **Settings → Pages** in the GitHub repo
2. Under **Build and deployment → Source**, select **GitHub Actions**
3. Push to `main` — the workflow at `.github/workflows/deploy.yml` handles the rest

The site will be live at `https://hadyem26.github.io/alrais-docs/`.

**Custom domain (optional):**

To serve at `docs.alrais.com`:

1. In **Settings → Pages → Custom domain**, enter `docs.alrais.com`
2. Add a CNAME DNS record: `docs.alrais.com` → `hadyem26.github.io`
3. Update `docusaurus.config.ts`:
   ```ts
   url: 'https://docs.alrais.com',
   baseUrl: '/',
   ```
4. Push and redeploy

**Manual deploy (alternative):**

```bash
npm run build
npx docusaurus deploy   # Pushes to gh-pages branch
```

## Content conventions

- **Pass 1** pages are generated from the codebase and contain real technical content.
- **Pass 2** pages are stubs (`draft: true`) awaiting human editorial input. They include `:::note` admonitions listing what needs to be written.
- All connector pages follow a standard template: description, at-a-glance table, capabilities, endpoints, auth, normalizer mapping, rate limits, and integration notes.
- Travel industry terminology should use proper OTA/GDS jargon. See `docs/glossary.md` for canonical definitions.

## Built by

[Epicmetry FZCO](https://epicmetry.com) — Dubai
