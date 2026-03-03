import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Persistent storage via Netlify Blobs through serverless functions
window.storage = {
  get: async (key) => {
    try {
      const res = await fetch('/.netlify/functions/storage-get?key=' + encodeURIComponent(key));
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (e) { return null; }
  },
  set: async (key, value) => {
    try {
      const res = await fetch('/.netlify/functions/storage-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      return await res.json();
    } catch (e) { return null; }
  },
  delete: async (key) => {
    try {
      const res = await fetch('/.netlify/functions/storage-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      return await res.json();
    } catch (e) { return null; }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
