import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { db } from './firebase.js'
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

const ADMIN_EMAIL = 'chris.lee@blinkparametric.com';
const ALLOWED_DOMAIN = 'blinkparametric.com';
const SESSION_KEY = 'blink-naming-user';

// Expose real-time listener helpers for App.jsx
window.__blinkListeners = { onSnapshot, doc, db };

// ── Storage API (Firestore) ──────────────────────────────────────────────────
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

// ── Login wrapper ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Please enter your email address.'); return; }
    if (!trimmed.endsWith('@' + ALLOWED_DOMAIN)) {
      setError('Please use your @blinkparametric.com email address.');
      return;
    }
    setLoading(true);
    try {
      // Register/fetch user in Firestore
      const userRef = doc(db, 'blink-users', trimmed.replace(/\./g, '_').replace('@','_at_'));
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { email: trimmed, firstSeen: new Date().toISOString() });
      }
      sessionStorage.setItem(SESSION_KEY, trimmed);
      onLogin(trimmed);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0A1628', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif", padding:24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@700;800&display=swap');*{box-sizing:border-box;}`}</style>
      <div style={{ background:'white', borderRadius:20, padding:'48px 40px', maxWidth:440, width:'100%', boxShadow:'0 8px 48px rgba(0,0,0,0.24)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <div style={{ width:38, height:38, background:'#0057FF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontSize:18, fontWeight:800 }}>B</span>
          </div>
          <span style={{ fontSize:13, fontWeight:600, color:'#6B7A99', letterSpacing:'0.08em', textTransform:'uppercase' }}>Blink Parametric</span>
        </div>
        <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:28, fontWeight:800, color:'#0A1628', margin:'0 0 8px' }}>Name Our New Product 🔍</h1>
        <p style={{ color:'#6B7A99', fontSize:15, margin:'0 0 32px', lineHeight:1.5 }}>Enter your Blink email to join the naming competition.</p>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#4A5568', display:'block', marginBottom:6 }}>Work Email</label>
          <input
            type="email"
            placeholder="you@blinkparametric.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width:'100%', border:'1.5px solid #E0E6F0', borderRadius:10, padding:'12px 14px', fontSize:15, color:'#0A1628', outline:'none', fontFamily:'inherit' }}
            autoFocus
          />
        </div>
        {error && <div style={{ background:'#FEE2E2', color:'#991B1B', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:500, marginBottom:16 }}>{error}</div>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width:'100%', background:'#0057FF', color:'white', border:'none', borderRadius:10, padding:'13px', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in...' : 'Continue →'}
        </button>
        <p style={{ color:'#9CA3AF', fontSize:12, marginTop:16, textAlign:'center' }}>Only @blinkparametric.com addresses can access this.</p>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
function Root() {
  const [user, setUser] = React.useState(() => sessionStorage.getItem(SESSION_KEY) || null);
  const isAdmin = user === ADMIN_EMAIL;

  if (!user) return <LoginScreen onLogin={setUser} />;
  return <App currentUser={user} isAdmin={isAdmin} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
);
