# CipherStack (VYROTHON)

**Live Demo:** [https://vyrothon-nine.vercel.app/](https://vyrothon-nine.vercel.app/)

Browser app for **cascade encryption**: build a **sequential pipeline** of configurable cipher nodes, run **encrypt** or **decrypt**, inspect **intermediate steps**, and verify **encrypt → decrypt** round-trip. Each distinct pipeline layout has a **Chain DNA** fingerprint (SHA-256 over ordered cipher ids and configs).

## Features (submission checklist)

| Requirement | Where |
|-------------|--------|
| ≥ **3 configurable** cipher **types** | Caesar, Vigenère, XOR, **Rail fence** (4 total) |
| ≥ **3 nodes** to run | Enforced in pipeline engine + UI badge |
| Add / configure / **reorder** (drag) / remove | Pipeline panel + `@dnd-kit` |
| Encrypt + decrypt + **round-trip verify** | Direction tabs + **Verify round-trip** |
| **Intermediate** input/output per hop | Hop-by-hop trace cards |
| **Chain DNA** | Hero + updates on stack change |
| **Import/export** pipeline JSON | Lab tools: Copy JSON / Load JSON |
| **Presets** | Starter, 4-node, XOR lead, Rail mix |

**Phase 2 UX:** drag-and-drop reorder (`@dnd-kit`), live **flow strip**, gradient hero + DNA card, **hop-by-hop trace** cards with per-field copy, **Ctrl/Cmd+Enter** to run, encrypt/decrypt visual mode, reduced-motion–safe step animations.

**Phase 3 Lab tools:** **presets** (one-click stacks), **Copy JSON** / **Load JSON** for snapshots (new instance ids on import).

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8** (dev server, production bundle)
- No backend — crypto runs entirely in the client

## Requirements

- **Node.js** 20+ (LTS recommended)
- **npm** 10+

## Run locally

```bash
git clone <your-repo-url>
cd vyrothon
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build & preview

```bash
npm run build
npm run preview
```

`preview` serves the contents of `dist/` for a production-like check before deploy.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm run lint`, and `npm run build` on push/PR to `main`/`master`.

## Deploy

Build output is the `dist/` folder after `npm run build`.

| Platform | Suggested setup |
|----------|------------------|
| **Vercel** | Framework preset: Vite — or Root Directory `.`, Build `npm run build`, Output `dist`. `vercel.json` in this repo sets SPA fallback. |
| **Netlify** | Build command `npm run build`, publish directory `dist`. Use `netlify.toml` from this repo. |
| **Cloudflare Pages** | Build `npm run build`, output `dist`. |

## Encoding & chaining rules

- **Caesar** and **Vigenère** only shift **Latin letters** (`A–Z` / `a–z`); other characters pass through unchanged.
- **XOR** encodes input as **UTF-8**, XORs with a repeating key, and outputs a **lowercase hex string**. Decrypt expects that same hex format (empty string round-trips as empty).
- **Rail fence** permutes the full string (any Unicode) using a zigzag with **N ≥ 2** rails.

Keep this in mind when demoing: after XOR, the “text” is often hex; decrypt mode must paste the **exact** final ciphertext from encrypt.

## Snapshot JSON shape

Export produces pretty-printed JSON like:

```json
{
  "version": 1,
  "cipherStack": {
    "nodes": [
      { "cipherId": "caesar", "config": { "shift": 3 } },
      { "cipherId": "vigenere", "config": { "keyword": "hack" } },
      { "cipherId": "xor", "config": { "key": "ab" } }
    ]
  }
}
```

`cipherId` must match a registered cipher; `config` must pass that cipher’s validation.

## Project layout

| Path | Purpose |
|------|---------|
| `src/cipherstack/` | Ciphers, registry, pipeline, DNA, snapshots, presets |
| `src/components/` | `PipelineWorkbench`, `NodeConfigForm`, `SortableNodeCard`, styles |

Adding a new cipher: implement `CipherDefinition` (encrypt + decrypt + `validateConfig`), register it in `src/cipherstack/ciphers/index.ts`, and extend `NodeConfigForm` with fields for its config.

## Judge demo (about 60 seconds)

1. Show **Chain DNA** changing when nodes or configs change.
2. Open **Lab tools** — apply a **preset** or **Copy JSON** to show shareable config.
3. **Encrypt** default plaintext — walk **Hop-by-hop trace**.
4. **Copy** final ciphertext, switch to **Decrypt**, paste, **Run pipeline** — output matches original message.
5. **Verify round-trip** — **PASS**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |

## License

MIT — see [LICENSE](LICENSE).
