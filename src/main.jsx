import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Real persistent storage via Netlify Blobs (through serverless functions)
window.storage = {
  get: async (key) => {
    const res = await fetch('/api/storage-get?key=' + encodeURIComponent(key));
    if (!res.ok) return null;
    return await res.json();
  },
  set: async (key, value) => {
    const res = await fetch('/api/storage-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    return await res.json();
  },
  delete: async (key) => {
    const res = await fetch('/api/storage-delete?key=' + encodeURIComponent(key), {
      method: 'DELETE'
    });
    return await res.json();
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
