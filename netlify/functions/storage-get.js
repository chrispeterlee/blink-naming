const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) return { statusCode: 400, body: JSON.stringify({ error: "missing key" }) };
  try {
    const store = getStore("blink-naming");
    const value = await store.get(key);
    if (value === null) return { statusCode: 200, body: JSON.stringify(null) };
    return { statusCode: 200, body: JSON.stringify({ key, value }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
