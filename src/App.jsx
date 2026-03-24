import { useState, useEffect } from "react";

const SK_SUBMISSIONS = "blink-naming-v4-subs";
const SK_VOTES = "blink-naming-v4-votes";
const SK_TIMELINE = "blink-naming-v4-tl";
const SK_REVEAL = "blink-naming-v4-reveal";

const BB = "#0057FF";
const BD = "#0A1628";
const GOLD   = { key:"gold",   label:"Gold",   emoji:"🥇", pts:3, color:"#F5A623", bg:"#FFF8EC", border:"#F5A623" };
const SILVER = { key:"silver", label:"Silver", emoji:"🥈", pts:2, color:"#8A8A8A", bg:"#F5F5F5", border:"#9B9B9B" };
const BRONZE = { key:"bronze", label:"Bronze", emoji:"🥉", pts:1, color:"#C47A3A", bg:"#FDF3EC", border:"#C47A3A" };
const MEDALS = [GOLD, SILVER, BRONZE];

const pad = n => String(n).padStart(2,"0");
const fcd = ms => {
  if (ms<=0) return {str:"00:00:00",urgent:true};
  const t=Math.floor(ms/1000), h=Math.floor(t/3600), m=Math.floor((t%3600)/60), s=t%60;
  return {str:`${pad(h)}:${pad(m)}:${pad(s)}`,urgent:ms<3600000};
};

function Countdown({label,endsAt,color}) {
  const [rem,setRem]=useState(endsAt-Date.now());
  useEffect(()=>{const t=setInterval(()=>setRem(endsAt-Date.now()),1000);return()=>clearInterval(t);},[endsAt]);
  const {str,urgent}=fcd(rem);
  return (
    <div style={{background:urgent?"#FFF1F0":"#F0F4FF",border:`2px solid ${urgent?"#FF4444":color}`,borderRadius:14,padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24}}>
      <div>
        <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:urgent?"#CC0000":color,marginBottom:4}}>{label}</div>
        <div style={{fontSize:13,color:"#6B7A99"}}>{urgent?"⚠️ Closing soon!":"Time remaining"}</div>
      </div>
      <div style={{fontFamily:"monospace",fontSize:36,fontWeight:800,color:urgent?"#CC0000":BD,letterSpacing:"0.06em",animation:urgent?"pulse 1s infinite":"none"}}>{str}</div>
    </div>
  );
}

function DTpick({value,onChange,minTs}) {
  const toL = ts => {
    if(!ts) return "";
    const d=new Date(ts), p=n=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  return <input type="datetime-local" className="inp" value={toL(value)} min={toL(minTs||Date.now())} onChange={e=>onChange(e.target.value?new Date(e.target.value).getTime():null)} style={{maxWidth:260}}/>;
}

function DurPick({onChange}) {
  const [d,setD]=useState(0),[h,setH]=useState(24),[m,setM]=useState(0);
  useEffect(()=>onChange(((d*24+h)*60+m)*60*1000),[d,h,m]);
  const s={width:60,border:"1.5px solid #E0E6F0",borderRadius:8,padding:"7px 8px",fontSize:14,color:BD,outline:"none",textAlign:"center",fontFamily:"inherit",background:"white"};
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <input type="number" min={0} max={30} value={d} onChange={e=>setD(+e.target.value)} style={s}/>
      <span style={{fontSize:13,color:"#6B7A99"}}>days</span>
      <input type="number" min={0} max={23} value={h} onChange={e=>setH(+e.target.value)} style={s}/>
      <span style={{fontSize:13,color:"#6B7A99"}}>hours</span>
      <input type="number" min={0} max={59} value={m} onChange={e=>setM(+e.target.value)} style={s}/>
      <span style={{fontSize:13,color:"#6B7A99"}}>mins</span>
    </div>
  );
}

export default function App() {
  const [tl,setTl]=useState(null);
  const [subs,setSubs]=useState([]);
  const [allV,setAllV]=useState([]);
  const [myV,setMyV]=useState({});
  const [vname,setVname]=useState("");
  const [form,setForm]=useState({name:"",who:"",why:""});
  const [subDone,setSubDone]=useState(false);
  const [voteDone,setVoteDone]=useState(false);
  const [admin,setAdmin]=useState(false);
  const [unlocked,setUnlocked]=useState(false);
  const [pass,setPass]=useState("");
  const [reveal,setReveal]=useState(false);
  const [toast,setToast]=useState(null);
  const [loading,setLoading]=useState(true);
  const [now,setNow]=useState(Date.now());
  const [sMode,setSMode]=useState("dur");
  const [vMode,setVMode]=useState("dur");
  const [sDur,setSDur]=useState(86400000);
  const [vDur,setVDur]=useState(86400000);
  const [sDl,setSDl]=useState(null);
  const [vDl,setVDl]=useState(null);

  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);

  useEffect(()=>{
    (async()=>{
      try {
        const a=await window.storage.get(SK_TIMELINE); if(a) setTl(JSON.parse(a.value));
        const b=await window.storage.get(SK_SUBMISSIONS); if(b) setSubs(JSON.parse(b.value));
        const c=await window.storage.get(SK_VOTES); if(c) setAllV(JSON.parse(c.value));
        const d=await window.storage.get(SK_REVEAL); if(d) setReveal(JSON.parse(d.value));
      } catch(e){}
      setLoading(false);
    })();
  },[]);

  const toast2 = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };
  const save = async (k,v) => { try { await window.storage.set(k,JSON.stringify(v)); } catch(e){} };

  const phase = !tl?"pending":now<tl.se?"submit":now<tl.ve?"vote":"results";

  const launch = async () => {
    const se = sMode==="dt"?sDl:Date.now()+sDur;
    const ve = vMode==="dt"?vDl:se+vDur;
    if(!se||!ve){ toast2("Set both deadlines","err"); return; }
    if(se<=Date.now()){ toast2("Submission deadline must be in the future","err"); return; }
    if(ve<=se){ toast2("Voting deadline must be after submissions","err"); return; }
    const t={se,ve}; setTl(t); await save(SK_TIMELINE,t); toast2("Launched! 🚀");
  };

  const reset = async () => {
    if(!window.confirm("Reset everything?")) return;
    setTl(null); setSubs([]); setAllV([]); setMyV({}); setVoteDone(false); setSubDone(false); setReveal(false);
    try { await window.storage.delete(SK_TIMELINE); await save(SK_SUBMISSIONS,[]); await save(SK_VOTES,[]); await save(SK_REVEAL,false); } catch(e){}
    toast2("Reset complete");
  };

  const toggleReveal = async () => {
    const n=!reveal; setReveal(n); await save(SK_REVEAL,n);
    toast2(n?"Authors now visible to everyone":"Authors hidden");
  };

  const submit = async () => {
    if(!form.name.trim()||!form.who.trim()||!form.why.trim()){ toast2("Fill in all fields","err"); return; }
    if(form.why.split(/\s+/).filter(Boolean).length>60){ toast2("Max 50 words please","err"); return; }
    const ns={id:Date.now(),...form};
    const u=[...subs,ns]; setSubs(u); await save(SK_SUBMISSIONS,u);
    setSubDone(true); toast2("Submitted! 🎉");
    setForm({name:"",who:"",why:""});
  };

  const medal = (sid,m) => {
    setMyV(p=>{
      const n={...p};
      Object.keys(n).forEach(k=>{ if(n[k]===m) delete n[k]; });
      if(p[sid]===m){ delete n[sid]; return n; }
      n[sid]=m; return n;
    });
  };

  const vote = async () => {
    if(!vname.trim()){ toast2("Enter your name","err"); return; }
    if(Object.keys(myV).length<3){ toast2("Assign all 3 medals","err"); return; }
    const e={voter:vname,votes:myV,ts:new Date().toISOString()};
    const u=[...allV,e]; setAllV(u); await save(SK_VOTES,u);
    setVoteDone(true); toast2("Votes recorded! 🏅");
  };

  const tally = subs.map(s=>{
    let total=0,g=0,sv=0,b=0;
    allV.forEach(v=>{
      if(v.votes[s.id]==="gold"){total+=3;g++;}
      if(v.votes[s.id]==="silver"){total+=2;sv++;}
      if(v.votes[s.id]==="bronze"){total+=1;b++;}
    });
    return {...s,total,g,sv,b};
  }).sort((a,z)=>z.total-a.total);

  const wc = form.why.split(/\s+/).filter(Boolean).length;

  const Tab=({active,onClick,children})=>(
    <button onClick={onClick} style={{padding:"6px 14px",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",fontFamily:"inherit",transition:"all 0.15s",background:active?"white":"transparent",color:active?BD:"#92400E"}}>{children}</button>
  );

  const Who=({who})=>reveal
    ?<div style={{fontSize:13,color:"#9CA3AF",marginBottom:8}}>by {who}</div>
    :<div style={{fontSize:13,color:"#CBD5E0",fontStyle:"italic",marginBottom:8}}>Author anonymous</div>;

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:BD,color:"white",fontFamily:"system-ui"}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⚡</div><div>Loading...</div></div></div>;

  return (
    <div style={{minHeight:"100vh",background:BD,fontFamily:"system-ui,sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;}
        input,textarea{font-family:inherit;}
        .card{background:white;border-radius:16px;padding:26px;box-shadow:0 4px 24px rgba(0,0,0,0.12);}
        .btn{border:none;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit;}
        .bp{background:${BB};color:white;}
        .bp:hover{background:#0046CC;transform:translateY(-1px);}
        .bg{background:transparent!important;color:${BB}!important;border:2px solid ${BB}!important;}
        .bg:hover{background:#F0F4FF!important;}
        .inp{width:100%;border:1.5px solid #E0E6F0;border-radius:10px;padding:11px 14px;font-size:15px;color:${BD};outline:none;transition:border 0.15s;background:white;}
        .inp:focus{border-color:${BB};}
        .mc{border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;border:2px solid transparent;transition:all 0.15s;white-space:nowrap;font-family:inherit;}
        .sc{transition:all 0.15s;}
        .sc:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(0,87,255,0.1)!important;}
        .toastEl{position:fixed;bottom:24px;right:24px;padding:14px 22px;border-radius:12px;font-weight:600;font-size:14px;z-index:1000;animation:su 0.3s ease;box-shadow:0 4px 16px rgba(0,0,0,0.15);}
        @keyframes su{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        .pp{padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;}
        input[type=datetime-local]{color-scheme:light;}
      `}</style>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#0A1628 0%,#0D2050 60%,#0A1628 100%)",padding:"28px 24px 36px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,background:BB,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:"white",fontSize:16,fontWeight:800}}>B</span>
              </div>
              <span style={{color:"rgba(255,255,255,0.4)",fontSize:12,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>Blink Parametric</span>
            </div>
            <button onClick={()=>setAdmin(!admin)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              {admin?"✕ Close":"⚙️ Admin"}
            </button>
          </div>
          <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(24px,5vw,38px)",fontWeight:700,color:"white",margin:"0 0 6px",lineHeight:1.15}}>Name Our New Product 🔍</h1>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:15,margin:"0 0 20px",lineHeight:1.5}}>
            We are retiring <span style={{color:"rgba(255,255,255,0.8)",fontWeight:600,textDecoration:"line-through"}}>CyberScan</span> and need a new name for our dark web monitoring product.
          </p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["pending","⏳ Not started"],["submit","✏️ Submissions open"],["vote","🗳️ Voting open"],["results","🏆 Results"]].map(([p,l])=>(
              <span key={p} className="pp" style={{background:phase===p?"white":"rgba(255,255,255,0.08)",color:phase===p?BD:"rgba(255,255,255,0.4)",fontWeight:phase===p?700:500}}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ADMIN */}
      {admin && (
        <div style={{background:"#FFFBEB",borderBottom:"2px solid #F5A623",padding:"20px 24px"}}>
          <div style={{maxWidth:720,margin:"0 auto"}}>
            <div style={{fontWeight:700,fontSize:14,color:"#92400E",marginBottom:16}}>⚙️ Admin Controls</div>
            {!unlocked ? (
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <input className="inp" type="password" placeholder="Admin password (leave blank to skip)" value={pass} onChange={e=>setPass(e.target.value)} style={{maxWidth:260,padding:"8px 12px",fontSize:14}}/>
                <button className="btn bp" style={{padding:"9px 20px",fontSize:14}} onClick={()=>setUnlocked(true)}>Unlock</button>
              </div>
            ) : (
              <div>
                {phase==="pending" && (
                  <div style={{background:"white",borderRadius:12,padding:22}}>
                    <div style={{fontWeight:700,fontSize:15,color:BD,marginBottom:20}}>Launch Competition</div>

                    <div style={{marginBottom:22,paddingBottom:22,borderBottom:"1px solid #F0F4F8"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:10}}>📝 Submissions close…</div>
                      <div style={{display:"flex",gap:4,marginBottom:14,background:"#FEF9EC",padding:4,borderRadius:9,width:"fit-content"}}>
                        <Tab active={sMode==="dur"} onClick={()=>setSMode("dur")}>After a duration</Tab>
                        <Tab active={sMode==="dt"}  onClick={()=>setSMode("dt")}>On a specific date</Tab>
                      </div>
                      {sMode==="dur"
                        ?<><DurPick onChange={setSDur}/><p style={{margin:"8px 0 0",fontSize:12,color:"#9CA3AF"}}>Countdown starts from the moment you launch</p></>
                        :<DTpick value={sDl} onChange={setSDl} minTs={Date.now()}/>
                      }
                    </div>

                    <div style={{marginBottom:22}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:10}}>🗳️ Voting closes…</div>
                      <div style={{display:"flex",gap:4,marginBottom:14,background:"#FEF9EC",padding:4,borderRadius:9,width:"fit-content"}}>
                        <Tab active={vMode==="dur"} onClick={()=>setVMode("dur")}>After a duration</Tab>
                        <Tab active={vMode==="dt"}  onClick={()=>setVMode("dt")}>On a specific date</Tab>
                      </div>
                      {vMode==="dur"
                        ?<><DurPick onChange={setVDur}/><p style={{margin:"8px 0 0",fontSize:12,color:"#9CA3AF"}}>Countdown starts from when submissions close</p></>
                        :<DTpick value={vDl} onChange={setVDl} minTs={sDl||Date.now()}/>
                      }
                    </div>

                    <button className="btn bp" onClick={launch}>🚀 Launch Now</button>
                  </div>
                )}

                {phase!=="pending" && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:13,color:"#92400E",fontWeight:600}}>{subs.length} submissions · {allV.length} voters</span>

                    <button onClick={toggleReveal} style={{background:reveal?"#FEF3C7":"white",border:`1.5px solid ${reveal?"#F5A623":"#D1D5DB"}`,color:reveal?"#92400E":"#4A5568",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                      {reveal?"🔓 Authors visible — click to hide":"🔒 Reveal authors to everyone"}
                    </button>

                    {phase==="submit" && <button className="btn bg" style={{fontSize:13,padding:"7px 16px"}} onClick={async()=>{const t={...tl,se:Date.now()-1};setTl(t);await save(SK_TIMELINE,t);toast2("Submissions closed — voting now open");}}>End submissions early</button>}
                    {phase==="vote"   && <button className="btn bg" style={{fontSize:13,padding:"7px 16px"}} onClick={async()=>{const t={...tl,ve:Date.now()-1};setTl(t);await save(SK_TIMELINE,t);toast2("Voting closed — results live");}}>End voting early</button>}

                    <button style={{marginLeft:"auto",background:"#FEE2E2",color:"#991B1B",border:"none",borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}} onClick={reset}>Reset all</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{maxWidth:720,margin:"0 auto",padding:"32px 24px 60px"}}>

        {phase==="pending" && (
          <div className="card" style={{textAlign:"center",padding:"60px 40px"}}>
            <div style={{fontSize:52,marginBottom:16}}>⏳</div>
            <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 10px",color:BD}}>Not Started Yet</h2>
            <p style={{color:"#6B7A99",fontSize:15,maxWidth:380,margin:"0 auto"}}>The naming competition has not launched yet. Check back soon or ask an admin to kick things off.</p>
          </div>
        )}

        {phase==="submit" && (
          <div>
            <Countdown label="Submissions close in" endsAt={tl.se} color={BB}/>
            <div style={{background:"linear-gradient(135deg,#EEF3FF,#F5F8FF)",border:"1.5px solid #C7D7FF",borderRadius:14,padding:"20px 24px",marginBottom:24}}>
              <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:BB,marginBottom:8}}>📋 Naming Brief</div>
              <p style={{margin:"0 0 10px",fontSize:14,color:"#2D3748",lineHeight:1.65}}>We are replacing <strong>CyberScan</strong> (trademarked in insurance) with a new name for our <strong>dark web monitoring product</strong>. The product lets users register their personal details, then automatically monitors the dark web and alerts them the moment their data surfaces anywhere it should not.</p>
              <p style={{margin:0,fontSize:14,color:"#2D3748",lineHeight:1.65}}>The best names will work as a <strong>Blink sub-brand</strong>, convey vigilance and instant alerting, and avoid generic cyber words like Shield, Guard, or Watch. Think: <em>we are watching the shadows so you do not have to.</em></p>
            </div>

            {!subDone ? (
              <div className="card" style={{marginBottom:24}}>
                <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700,color:BD}}>Submit a Name</h2>
                <p style={{color:"#6B7A99",margin:"0 0 20px",fontSize:14}}>What should we call it? Make your case. <span style={{color:"#D97706",fontWeight:600}}>Your name will be visible to admins and may be revealed to all voters.</span></p>
                <div style={{display:"flex",flexDirection:"column",gap:15}}>
                  <div>
                    <label style={{fontSize:13,fontWeight:600,color:"#4A5568",display:"block",marginBottom:6}}>Your Name</label>
                    <input className="inp" placeholder="e.g. Chris Walsh" value={form.who} onChange={e=>setForm(f=>({...f,who:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={{fontSize:13,fontWeight:600,color:"#4A5568",display:"block",marginBottom:6}}>Proposed Product Name</label>
                    <input className="inp" placeholder="e.g. Blink Sentinel" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={{fontSize:13,fontWeight:600,color:"#4A5568",display:"block",marginBottom:6}}>Why this name? <span style={{color:"#9CA3AF",fontWeight:400}}>(max 50 words)</span></label>
                    <textarea className="inp" rows={4} value={form.why} onChange={e=>setForm(f=>({...f,why:e.target.value}))} placeholder="What makes this a great fit for the product and the Blink brand?" style={{resize:"vertical"}}/>
                    <div style={{textAlign:"right",fontSize:12,color:wc>50?"#DC2626":"#9CA3AF",marginTop:4}}>{wc}/50 words</div>
                  </div>
                  <button className="btn bp" onClick={submit} style={{alignSelf:"flex-start"}}>Submit Name →</button>
                </div>
              </div>
            ) : (
              <div className="card" style={{marginBottom:24,textAlign:"center",padding:"40px 28px"}}>
                <div style={{fontSize:44,marginBottom:10}}>🎉</div>
                <h2 style={{margin:"0 0 8px",fontSize:20,color:BD}}>Name Submitted!</h2>
                <p style={{color:"#6B7A99",margin:"0 0 20px",fontSize:14}}>Voting opens once submissions close.</p>
                <button className="btn bg" onClick={()=>setSubDone(false)}>Submit Another</button>
              </div>
            )}

            {subs.length>0 && (
              <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"20px 24px",display:"flex",alignItems:"center",gap:20}}>
                <div style={{fontSize:48,fontWeight:800,color:"white",lineHeight:1,fontFamily:"Georgia,serif"}}>{subs.length}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:"white",marginBottom:3}}>{subs.length===1?"idea submitted":"ideas submitted"}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.45)"}}>Entries are hidden until voting opens so they don't influence each other</div>
                </div>
              </div>
            )}
          </div>
        )}

        {phase==="vote" && (
          <div>
            <Countdown label="Voting closes in" endsAt={tl.ve} color="#7C3AED"/>
            {!voteDone ? (
              <div>
                <div className="card" style={{marginBottom:20}}>
                  <h2 style={{margin:"0 0 6px",fontSize:20,fontWeight:700,color:BD}}>Cast Your Medals</h2>
                  <p style={{color:"#6B7A99",margin:"0 0 16px",fontSize:14}}>Give out one 🥇 Gold (3pts), one 🥈 Silver (2pts), and one 🥉 Bronze (1pt). Each medal can only go to one entry.</p>
                  <div>
                    <label style={{fontSize:13,fontWeight:600,color:"#4A5568",display:"block",marginBottom:6}}>Your Name</label>
                    <input className="inp" placeholder="Enter your name" value={vname} onChange={e=>setVname(e.target.value)} style={{maxWidth:280}}/>
                  </div>
                  <div style={{marginTop:14,fontSize:14,color:"#6B7A99"}}>
                    Medals assigned: <strong style={{color:BD}}>{Object.keys(myV).length}/3</strong>
                    {Object.keys(myV).length===3 && <span style={{color:"#16A34A",marginLeft:10,fontWeight:600}}>✓ Ready to submit</span>}
                  </div>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                  {subs.map(s=>{
                    const mm=myV[s.id];
                    const md=mm?MEDALS.find(m=>m.key===mm):null;
                    return (
                      <div key={s.id} className="card sc" style={{padding:"20px 22px",border:md?`2px solid ${md.border}`:"2px solid transparent"}}>
                        <div style={{fontSize:17,fontWeight:700,color:BB,marginBottom:2}}>{s.name}</div>
                        <Who who={s.who}/>
                        <div style={{fontSize:14,color:"#4A5568",marginBottom:14,lineHeight:1.55}}>{s.why}</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {MEDALS.map(m=>{
                            const isSel=mm===m.key;
                            const taken=Object.entries(myV).some(([id,v])=>v===m.key&&id!==String(s.id));
                            return (
                              <button key={m.key} className="mc" onClick={()=>!taken&&medal(s.id,m.key)}
                                style={{background:isSel?m.color:taken?"#F3F4F6":m.bg,color:isSel?"white":taken?"#D1D5DB":m.color,border:`2px solid ${isSel?m.color:taken?"#E5E7EB":m.border}`,cursor:taken?"not-allowed":"pointer"}}>
                                {m.emoji} {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="btn bp" onClick={vote} style={{width:"100%",padding:16,fontSize:16}}>Submit My Votes 🏅</button>
              </div>
            ) : (
              <div className="card" style={{textAlign:"center",padding:"56px 28px"}}>
                <div style={{fontSize:48,marginBottom:12}}>🏅</div>
                <h2 style={{margin:"0 0 8px",fontSize:22,color:BD}}>Votes recorded!</h2>
                <p style={{color:"#6B7A99",margin:"0 0 22px",fontSize:14}}>{allV.length} {allV.length===1?"person has":"people have"} voted so far.</p>
                <button className="btn bg" onClick={()=>{setVoteDone(false);setMyV({});setVname("");}}>Vote again (different person)</button>
              </div>
            )}
          </div>
        )}

        {phase==="results" && (
          <div>
            <div style={{marginBottom:24}}>
              <h2 style={{margin:"0 0 4px",fontSize:26,fontWeight:700,color:"white"}}>🏆 Results</h2>
              <p style={{color:"rgba(255,255,255,0.45)",margin:0,fontSize:14}}>{allV.length} {allV.length===1?"vote":"votes"} cast · {subs.length} entries</p>
            </div>
            {tally.length===0 ? (
              <div className="card" style={{textAlign:"center",padding:48}}>
                <div style={{fontSize:40,marginBottom:12}}>🗳️</div>
                <p style={{color:"#6B7A99"}}>No votes were cast.</p>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {tally.map((s,i)=>(
                  <div key={s.id} className="card" style={{padding:"22px 24px",border:i===0?`2px solid ${GOLD.color}`:i===1?`2px solid ${SILVER.color}`:i===2?`2px solid ${BRONZE.color}`:"2px solid transparent",position:"relative",overflow:"hidden"}}>
                    {i===0 && <div style={{position:"absolute",top:0,right:0,background:GOLD.color,color:"white",fontSize:11,fontWeight:700,padding:"4px 14px",borderBottomLeftRadius:10,letterSpacing:"0.05em"}}>WINNER</div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                          <span style={{fontSize:20,fontWeight:800,color:i===0?GOLD.color:i===1?SILVER.color:i===2?BRONZE.color:"#CBD5E0"}}>#{i+1}</span>
                          <span style={{fontSize:19,fontWeight:700,color:BB}}>{s.name}</span>
                        </div>
                        <Who who={s.who}/>
                        <div style={{fontSize:14,color:"#4A5568",lineHeight:1.55}}>{s.why}</div>
                        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                          {s.g>0  && <span style={{fontSize:12,background:GOLD.bg,  color:GOLD.color,  border:`1px solid ${GOLD.border}`,  borderRadius:6,padding:"3px 10px",fontWeight:600}}>🥇 ×{s.g}</span>}
                          {s.sv>0 && <span style={{fontSize:12,background:SILVER.bg,color:SILVER.color,border:`1px solid ${SILVER.border}`,borderRadius:6,padding:"3px 10px",fontWeight:600}}>🥈 ×{s.sv}</span>}
                          {s.b>0  && <span style={{fontSize:12,background:BRONZE.bg,color:BRONZE.color,border:`1px solid ${BRONZE.border}`,borderRadius:6,padding:"3px 10px",fontWeight:600}}>🥉 ×{s.b}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",minWidth:60}}>
                        <div style={{fontSize:36,fontWeight:800,color:i===0?GOLD.color:BD,lineHeight:1}}>{s.total}</div>
                        <div style={{fontSize:12,color:"#9CA3AF",fontWeight:500}}>points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <div className="toastEl" style={{background:toast.type==="err"?"#FEE2E2":"#DCFCE7",color:toast.type==="err"?"#991B1B":"#166534"}}>{toast.msg}</div>}
    </div>
  );
}
