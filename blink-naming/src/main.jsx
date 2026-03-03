import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Temporary in-memory storage shim (replaces Claude's window.storage)
// Data won't persist on refresh — replace with Netlify Blobs for production
window.storage = {
  _data: {},
  get: async (k) => {
    const v = window.storage._data[k]
    return v !== undefined ? { value: v } : null
  },
  set: async (k, v) => {
    window.storage._data[k] = v
    return { key: k, value: v }
  },
  delete: async (k) => {
    delete window.storage._data[k]
    return { key: k, deleted: true }
  },
  list: async (prefix) => {
    const keys = Object.keys(window.storage._data)
      .filter(k => !prefix || k.startsWith(prefix))
    return { keys }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
