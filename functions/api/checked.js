// Delt avkryssingstilstand for handlelisten, lagret i D1 (binding "DB", se wrangler.jsonc).
// GET  /api/checked            -> { "checked": ["item-id", ...] }
// POST /api/checked {id, checked} -> { "ok": true } (én rad per vare, siste skriving vinner)

export async function onRequestGet(context) {
  const { results } = await context.env.DB
    .prepare("SELECT item_id FROM checked WHERE checked = 1")
    .all();
  return Response.json(
    { checked: results.map(function (r) { return r.item_id; }) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (typeof body.id !== "string" || body.id.length === 0 || body.id.length > 200 ||
      typeof body.checked !== "boolean") {
    return Response.json({ error: "expected {id: string, checked: boolean}" }, { status: 400 });
  }
  await context.env.DB
    .prepare(
      "INSERT INTO checked (item_id, checked, updated_at) VALUES (?1, ?2, datetime('now')) " +
      "ON CONFLICT(item_id) DO UPDATE SET checked = ?2, updated_at = datetime('now')"
    )
    .bind(body.id, body.checked ? 1 : 0)
    .run();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
