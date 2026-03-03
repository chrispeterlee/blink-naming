const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const { key, value } = JSON.parse(event.body || "{}");
    if (!key) return { statusCode: 400, body: JSON.stringify({ error: "missing key" }) };
    const store = getStore("blink-naming");
    await store.set(key, value);
    return { statusCode: 200, body: JSON.stringify({ key, value }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
