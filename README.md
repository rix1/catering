# catering

Planning site for an Italian sharing buffet: lunch for 45, dinner for 76 and
breakfast for 43, cooked over one weekend in August 2026. Live at
[mat.rix1.dev](https://mat.rix1.dev). The content is in Norwegian.

Four pages, all plain HTML with no build step:

- **Plan** (`index.html`): guest counts, dietary constraints, the menu and an
  hour-by-hour production schedule from Monday to Sunday breakfast.
- **Oppskrifter** (`oppskrifter.html`): recipes scaled for the buffet, with
  weights and a mise en place split into days-ahead, day-before, same-day and
  just-before-serving.
- **Handleliste** (`handleliste.html`): the shopping list, rendered from
  `handleliste-data.js`. It can be grouped by vendor or by meal, carries
  prices, and prints as an inventory sheet. Check-offs are shared across
  devices, so one person can tick items off in the store while another
  watches the list update at home.
- **Sjekkliste** (`sjekkliste.html`): a printable round checklist for the
  fridge, labelling and food-safety checks.

## How the shared check-off works

`functions/api/checked.js` is a Cloudflare Pages Function backed by a D1
database (schema in `schema.sql`). One row per item, last write wins per
item. The page treats the server as authoritative and keeps localStorage as an
offline cache with a retry queue, polling while visible. The endpoint is
unauthenticated by design: the list is for one party, and the worst case is
someone unticking the mozzarella.

## Deploying

```sh
./deploy.sh
```

The script copies the pages into `dist/`, content-hashes the assets, writes
cache headers and runs `wrangler pages deploy`. It needs a wrangler login and
a D1 database named `handleliste` bound as `DB` (see `wrangler.jsonc`).

## Planning with an agent

The plan was worked out together with Claude Code. `AGENTS.md` holds the
working principles it follows: scale the whole buffet rather than each dish,
treat headcounts and dietary constraints as first-class state, push work to
earlier days, keep components separate until service, and let food safety
override convenience. The planning document itself is the source of truth for
quantities and schedule, so the principles stay stable while the menu changes.
