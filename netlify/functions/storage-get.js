import { getStore } from "@netlify/blobs";
export default async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return new Response(JSON.stringify({ error: "missing key" }), { status: 400 });
  try {
    const store = getStore("blink-naming");
    const value = await store.get(key);
    if (value === null) return new Response(JSON.stringify(null), { status: 200 });
    return new Response(JSON.stringify({ key, value }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
export const config = { path: "/api/storage-get" };
