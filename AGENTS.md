# AGENTS.md

## Source of truth

The current planning document contains the authoritative:
- guest counts per meal
- dietary constraints and which meals they apply to
- menu
- recipes
- quantities
- production schedule
- shopping list

Do not duplicate this project state in `AGENTS.md`. Guest counts, dates, menu items, dietary requirements, and other mutable event details belong in the planning document, not here.

When a change affects one of these areas, update all dependent sections in the planning document so it remains internally consistent.

## Principles

### Scale the whole buffet, not each dish

This is a sharing buffet. Never calculate one full serving of every dish for every dinner guest.

Reason about:
- total food volume
- the role of each dish
- expected popularity
- overlap with other dishes
- how filling each dish is

When a dish is added, removed, or materially changed, reassess quantities in the other dishes and adjust them when needed so the overall buffet remains correctly scaled.


### Treat headcounts and dietary constraints as first-class project state

Guest counts may differ between meals. Always use the headcount for the specific meal being planned rather than carrying one event-wide number through every recipe.

Dietary constraints must record:
- what the constraint is
- how many guests it affects
- which meals those guests attend

Do not silently reinterpret a stated allergy, intolerance, or food preference. Preserve the supplied constraint and flag ambiguity when it materially affects safe execution.

When guest counts or dietary constraints change, propagate the change through:
- recipe yields and buffet scaling
- alternative or compatible portions
- shopping quantities
- mise en place
- storage and labeling
- production schedule
- serving setup

For each affected guest, verify that there is a complete and practical meal available, not merely one technically compatible side dish.

For allergen-sensitive food, plan preparation, storage, utensils, labeling, and service to prevent unintended cross-contact where required. Do not assume that removing a visible ingredient is sufficient.

Prefer shared dishes that naturally satisfy multiple dietary constraints when that does not compromise the menu. Use separate special portions only where necessary.

### Optimize for execution

Prefer food and techniques that:
- scale well
- tolerate timing variation
- can be prepared ahead
- survive buffet service
- minimize last-minute work

A marginally better dish that creates significant à-la-minute work is usually a worse choice.

### Protect service-day capacity

Work backwards from service.

Push work to earlier days whenever quality and food safety allow it. The final hours should primarily consist of heating, cooking genuinely time-sensitive components, assembly, and plating.

Treat any other scheduled meal or kitchen commitment as unavailable production time.

### Consolidate prep

Actively identify shared prep across dishes:
- sauces and bases
- chopped aromatics
- grated cheese
- toasted nuts
- washed herbs
- dressings and marinades

Avoid performing equivalent work independently for different recipes.

When a shared base is split across dishes, document the split clearly and count the shared ingredients only once in aggregated shopping quantities.

### Keep components separate when appropriate

Do not mix components early merely because both can be prepared early.

Consider moisture, oxidation, texture, seasoning, and food safety.

Examples:
- bread separate from bruschetta topping
- dressing separate from leaves
- crunchy toppings separate from wet ingredients
- pasta toppings separate when early mixing would degrade texture

Always specify both when a component may be prepared and when it should be combined.

### Design for buffet eating

Evaluate dishes as they will actually be served.

Consider:
- bite size
- serving utensils
- ingredients falling to the bottom
- whether each serving gets the intended mix of components
- whether the food can be eaten comfortably from a plate, potentially while standing

Cut size should follow service context, not just traditional presentation.

### Preserve character

Do not automatically simplify unusual ingredients or combinations toward generic crowd-pleasing food.

A few distinctive elements are desirable when they improve identity and memorability without making execution fragile.

Push back during discussions on items that might create menu incoherence or doesn't add any meaningful character to the complete meal. Optimize the whole.

### Commit to decisions

Once a choice has been made, treat it as current until explicitly revisited.

Do not repeatedly reopen settled decisions or cycle through alternatives.

When a genuine problem is discovered:
1. identify it clearly
2. recommend one concrete correction
3. propagate that correction through the plan

### Prefer operational quantities

Recipes should include weights wherever useful, even when ingredients are also naturally counted.

For large-scale cooking, prefer quantities that can actually be measured, produced, stored, and purchased.

### Plan mise en place explicitly

For each dish, distinguish:
- prepare days ahead
- prepare day before
- prepare same day
- finish immediately before serving

Include storage conditions and whether components should remain separate.

### Maintain dependency consistency

Any menu or recipe change may affect:
- recipe yield
- quantities in other dishes
- total food weight and food-per-guest calculation
- shopping list
- production schedule
- staffing
- oven capacity
- cooling capacity
- storage
- serving logistics

Follow those dependencies through instead of editing one section in isolation.

After a meaningful menu, headcount, dietary, or quantity change, verify:
- guest count for each affected meal
- dietary coverage for each affected guest/group
- portion assumptions
- units
- recipe totals
- overall food totals
- shopping-list totals
- production-plan dependencies

Briefly state which totals and dependent sections were checked.

### Maintain the shopping list as derived data

The shopping list must be recalculated from the current recipes.

When recipes change:
1. update ingredient quantities
2. re-sum ingredients across all dishes
3. avoid double-counting shared bases
4. preserve the distinction between recipe requirement and practical purchase quantity

Do not hand-edit a shopping-list quantity without checking the recipes that produce it.

### Food safety overrides convenience

Be conservative with:
- cooling large batches
- raw poultry
- reheating
- cold holding
- buffet exposure

Never improve scheduling convenience by creating an unsafe food-handling plan.

## Repository operations

Create git commits without GPG signing:

`git -c commit.gpgsign=false commit`

## Shared shopping-list check-off state

The check-off state on `handleliste.html` is shared across devices. It lives in
the Cloudflare D1 database `handleliste` (table `checked`, schema in
`schema.sql`), exposed through the Pages Function `functions/api/checked.js`
under the same Pages project as the site (`mat-rix1-dev`, mat.rix1.dev).
The D1 binding `DB` is configured in `wrangler.jsonc`; `./deploy.sh` deploys
site and function together.

How it works:

- One row per item, keyed by `item_id` = the `id` field in
  `handleliste-data.js`. `checked` is 0/1, last write wins per item.
- API: `GET /api/checked` returns `{"checked": ["<id>", ...]}`;
  `POST /api/checked` with `{"id": "<id>", "checked": true|false}` upserts one
  row. The API is unauthenticated by design.
- The client treats the server as authoritative and localStorage as an offline
  cache with a persisted pending-retry queue. Toggles sync per item, never as a
  whole list, so a stale tab cannot overwrite other devices. It polls every
  20 s while visible and re-syncs on tab focus.

Reading or updating the state from the CLI (note `--remote`; without it you hit
a local dev copy, not production):

```
npx wrangler d1 execute handleliste --remote --command "SELECT * FROM checked"
npx wrangler d1 execute handleliste --remote --command "UPDATE checked SET checked = 1 WHERE item_id = '<id>'"
```

Consequences for editing `handleliste-data.js`:

- Item `id` values are the join key to the database. Keep an item's `id`
  stable when editing it; renaming an id silently drops its check-off state.
- Rows for removed ids are harmless orphans; delete them with the CLI if
  tidiness matters.
