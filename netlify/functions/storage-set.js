import { getStore } from "@netlify/blobs";
export default async (req) => {
  try {
    const { key, value } = await req.json();
    if (!key) return new Response(JSON.stringify({ error: "missing key" }), { status: 400 });
    const store = getStore("blink-naming");
    await store.set(key, value);
    return new Response(JSON.stringify({ key, value }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
export const config = { path: "/api/storage-set" };
