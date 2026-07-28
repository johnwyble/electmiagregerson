import { getStore } from "@netlify/blobs";

// Shared store for yard-sign check-offs.
// Each placed location is stored as its own key (the location id, e.g. "loc-3"),
// so two volunteers checking different spots never overwrite each other.
export default async (req) => {
  const store = getStore("yard-signs");

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const placed = {};
    for (const b of blobs) placed[b.key] = true;
    return Response.json(placed, {
      headers: { "cache-control": "no-store" },
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    const { id, placed } = body || {};
    if (typeof id !== "string" || !/^loc-\d+$/.test(id)) {
      return new Response("Invalid id", { status: 400 });
    }
    if (placed) await store.set(id, "1");
    else await store.delete(id);
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/signs" };
