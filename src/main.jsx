import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { db } from './firebase.js'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'

window.storage = {
  get: async (key) => {
    try {
      const snap = await getDoc(doc(db, 'blink-naming', key));
      if (!snap.exists()) return null;
      return { key, value: snap.data().value };
    } catch (e) { console.error('storage.get', e); return null; }
  },
  set: async (key, value) => {
    try {
      await setDoc(doc(db, 'blink-naming', key), { value });
      return { key, value };
    } catch (e) { console.error('storage.set', e); return null; }
  },
  delete: async (key) => {
    try {
      await deleteDoc(doc(db, 'blink-naming', key));
      return { key, deleted: true };
    } catch (e) { console.error('storage.delete', e); return null; }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)