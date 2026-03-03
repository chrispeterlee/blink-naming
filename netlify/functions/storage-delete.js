const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const { key } = JSON.parse(event.body || "{}");
    if (!key) return { statusCode: 400, body: JSON.stringify({ error: "missing key" }) };
    const store = getStore("blink-naming");
    await store.delete(key);
    return { statusCode: 200, body: JSON.stringify({ key, deleted: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
