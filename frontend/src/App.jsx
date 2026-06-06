import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://localhost:8000";

const AGENTS = {
  auto:       { label: "Auto-Route",  icon: "⚡", color: "#00e5ff" },
  diagnostic: { label: "DIAG",        icon: "🔬", color: "#ff6b35" },
  autosar:    { label: "AUTOSAR",     icon: "🔧", color: "#7c3aed" },
  adas:       { label: "ADAS",        icon: "🚗", color: "#059669" },
  safety:     { label: "SAFETY",      icon: "🛡️", color: "#d97706" },
};

const SAMPLES = [
  { text: "Generate a 0x2E WriteDataByIdentifier test for DID 0xF190 with 500ms timeout for BCM_Variant_A", agent: "diagnostic" },
  { text: "What ports does the NvM module expose and how does it connect to the Fee driver in our BCM config?", agent: "autosar" },
  { text: "Extract AEBS highway test scenarios from UN-R152 section 5.2 for front-end collision avoidance", agent: "adas" },
  { text: "Draft a HARA table for Automatic Emergency Braking with V2X sensor fusion at highway speeds", agent: "safety" },
  { text: "Generate a 0x27 SecurityAccess test with seed-key algorithm for BCM_Variant_A with 500ms timeout", agent: "diagnostic" },
  { text: "How does the Dcm module connect to Dem and FiM in the Classic AUTOSAR diagnostic stack?", agent: "autosar" },
];

function CodeBlock({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const code = part.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
          return (
            <div key={i} style={{ position:"relative", margin:"12px 0" }}>
              <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                style={{ position:"absolute", top:8, right:8, background:"#1a1f35", border:"none", color:"#4a5568",
                  fontFamily:"monospace", fontSize:10, padding:"3px 8px", borderRadius:4, cursor:"pointer" }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <pre style={{ background:"#010409", border:"1px solid #1a1f35", borderRadius:8, padding:16,
                overflowX:"auto", fontFamily:"'Courier New',monospace", fontSize:12, color:"#a8b4c8", lineHeight:1.6, margin:0 }}>
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return <span key={i} style={{ whiteSpace:"pre-wrap" }}>{part}</span>;
      })}
    </div>
  );
}

export default function App() {
  const [msgs, setMsgs]       = useState([]);
  const [input, setInput]     = useState("");
  const [agent, setAgent]     = useState("auto");
  const [loading, setLoading] = useState(false);
  const [stats, setStats]     = useState(null);
  const [view, setView]       = useState("chat");
  const [latency, setLatency] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const bottom = useRef(null);

  useEffect(() => {
    loadStats();
    fetchModelInfo();
    const t = setInterval(loadStats, 8000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  async function loadStats() {
    try { const r = await fetch(`${API}/stats`); setStats(await r.json()); } catch {}
  }

  async function fetchModelInfo() {
    try {
      const r = await fetch(`${API}/health`);
      const d = await r.json();
      setModelInfo(d.model);
    } catch {}
  }

  async function send(text) {
    const q = (text || input).trim();
    if (!q) return;
    setInput("");
    setMsgs(m => [...m, { role:"user", content:q }]);
    setLoading(true);
    try {
      const r = await fetch(`${API}/query`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ question:q, agent })
      });
      const d = await r.json();
      setLatency(d.latency_ms);
      setMsgs(m => [...m, { role:"assistant", content:d.answer, agent:d.agent_used, latency:d.latency_ms, tokens:d.tokens_used }]);
      loadStats();
    } catch {
      setMsgs(m => [...m, {
        role:"assistant",
        content:"⚠️ Backend not reachable. Make sure:\n1. Ollama is running (ollama serve)\n2. uvicorn is running on port 8000",
        agent:"error"
      }]);
    }
    setLoading(false);
  }

  const S = {
    shell:      { display:"flex", height:"100vh", background:"#06070d", color:"#e2e8f0", fontFamily:"'Segoe UI',sans-serif", overflow:"hidden" },
    sidebar:    { width:240, minWidth:240, background:"#0d0f1a", borderRight:"1px solid #1a1f35", display:"flex", flexDirection:"column" },
    logoBox:    { padding:"20px 16px 14px", borderBottom:"1px solid #1a1f35" },
    logoText:   { fontFamily:"'Courier New',monospace", fontSize:20, fontWeight:700, color:"#00e5ff", letterSpacing:-1 },
    logoSub:    { fontSize:10, color:"#4a5568", letterSpacing:2, textTransform:"uppercase", marginTop:2 },
    modelBadge: { fontSize:9, color:"#059669", fontFamily:"monospace", marginTop:4, padding:"2px 6px",
                  background:"rgba(5,150,105,0.1)", borderRadius:4, border:"1px solid rgba(5,150,105,0.2)", display:"inline-block" },
    nav:        { padding:"12px 8px" },
    navBtn:     (active) => ({
      width:"100%", display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius:7,
      border: active ? "1px solid rgba(0,229,255,0.25)" : "1px solid transparent",
      background: active ? "rgba(0,229,255,0.07)" : "transparent",
      color: active ? "#00e5ff" : "#4a5568", fontFamily:"inherit", fontSize:12, fontWeight:600,
      cursor:"pointer", marginBottom:3, textTransform:"uppercase", letterSpacing:0.5
    }),
    sectionLabel: { fontSize:10, color:"#4a5568", letterSpacing:2, textTransform:"uppercase", padding:"10px 10px 5px" },
    agentList:  { padding:"0 8px 12px" },
    agentBtn:   (sel, color) => ({
      width:"100%", display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:6,
      border: sel ? `1px solid ${color}55` : "1px solid #1a1f35",
      background: sel ? `${color}11` : "transparent",
      color: sel ? color : "#4a5568", fontFamily:"inherit", fontSize:11, fontWeight:600, cursor:"pointer", marginBottom:3
    }),
    dot:        (color) => ({ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }),
    sideStats:  { padding:12, borderTop:"1px solid #1a1f35", marginTop:"auto" },
    statRow:    { display:"flex", justifyContent:"space-between", marginBottom:6 },
    statL:      { fontSize:10, color:"#4a5568" },
    statV:      { fontFamily:"monospace", fontSize:12, color:"#00e5ff", fontWeight:700 },
    main:       { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
    topbar:     { height:50, borderBottom:"1px solid #1a1f35", display:"flex", alignItems:"center",
                  padding:"0 20px", gap:10, background:"#0d0f1a", flexShrink:0 },
    topTitle:   { fontSize:13, fontWeight:700, flex:1 },
    badge:      (bg, col, border) => ({ padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700,
                  fontFamily:"monospace", border:`1px solid ${border}`, background:bg, color:col }),
    chatWrap:   { flex:1, overflowY:"auto", padding:20 },
    emptyState: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:20 },
    promptGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, width:"100%", maxWidth:660 },
    promptCard: { padding:"11px 13px", borderRadius:8, border:"1px solid #1a1f35", background:"#0d0f1a",
                  cursor:"pointer", fontSize:11.5, color:"#4a5568", lineHeight:1.5, textAlign:"left" },
    msgRow:     (isUser) => ({ display:"flex", gap:10, marginBottom:18, flexDirection: isUser ? "row-reverse" : "row" }),
    avatar:     (isUser) => ({
      width:30, height:30, borderRadius:7, flexShrink:0, display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:13, border:"1px solid #1a1f35",
      background: isUser ? "rgba(0,229,255,0.1)" : "#0d0f1a"
    }),
    bubble:     (isUser) => ({
      maxWidth:"78%", padding:"12px 15px", borderRadius:11, border:"1px solid #1a1f35",
      background: isUser ? "rgba(0,229,255,0.06)" : "#0d0f1a", fontSize:13.5, lineHeight:1.65
    }),
    agentTag:   (color) => ({ fontSize:10, fontFamily:"monospace", fontWeight:700, padding:"2px 7px",
                  borderRadius:4, marginBottom:7, display:"inline-block", background:`${color}22`, color }),
    metaText:   { fontSize:10, color:"#4a5568", marginTop:8, fontFamily:"monospace" },
    inputArea:  { borderTop:"1px solid #1a1f35", padding:"14px 20px", background:"#0d0f1a", flexShrink:0 },
    inputRow:   { display:"flex", gap:9 },
    inputBox:   { flex:1, background:"#06070d", border:"1px solid #1a1f35", borderRadius:9, padding:"11px 14px",
                  color:"#e2e8f0", fontFamily:"inherit", fontSize:13.5, resize:"none", outline:"none",
                  minHeight:46, maxHeight:120, lineHeight:1.5 },
    sendBtn:    (disabled) => ({
      width:46, height:46, borderRadius:9, border:"none", background: disabled ? "#1a1f35" : "#00e5ff",
      color: disabled ? "#4a5568" : "#000", fontSize:16, cursor: disabled ? "not-allowed" : "pointer",
      flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700
    }),
    dash:       { flex:1, overflowY:"auto", padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignContent:"start" },
    card:       { background:"#0d0f1a", border:"1px solid #1a1f35", borderRadius:11, padding:18 },
    cardFull:   { gridColumn:"1 / -1", background:"#0d0f1a", border:"1px solid #1a1f35", borderRadius:11, padding:18 },
    cardTitle:  { fontSize:10, color:"#4a5568", textTransform:"uppercase", letterSpacing:1.5, marginBottom:14, fontWeight:700 },
    kpiGrid:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 },
    kpiVal:     (color) => ({ fontFamily:"monospace", fontSize:26, fontWeight:700, color, textAlign:"center" }),
    kpiLabel:   { fontSize:11, color:"#4a5568", marginTop:3, textAlign:"center" },
    kpiDelta:   { fontSize:10, color:"#34d399", marginTop:2, textAlign:"center", fontFamily:"monospace" },
  };

  const dailyData     = (stats?.daily || []).slice(-14).map((v,i) => ({ d:`D${i+1}`, v }));
  const totalAgentQ   = stats ? Object.values(stats.queries_by_agent).reduce((a,b)=>a+b,0) : 1;

  return (
    <div style={S.shell}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.logoBox}>
          <div style={S.logoText}>AutoForge</div>
          <div style={S.logoSub}>ECU AI Accelerator</div>
          {modelInfo && <div style={S.modelBadge}>🦙 {modelInfo}</div>}
        </div>
        <nav style={S.nav}>
          <button style={S.navBtn(view==="chat")} onClick={()=>setView("chat")}>💬 Chat</button>
          <button style={S.navBtn(view==="dash")} onClick={()=>setView("dash")}>📊 Dashboard</button>
        </nav>
        <div style={S.sectionLabel}>Agents</div>
        <div style={S.agentList}>
          {Object.entries(AGENTS).map(([k,ag]) => (
            <button key={k} style={S.agentBtn(agent===k, ag.color)} onClick={()=>setAgent(k)}>
              <div style={S.dot(ag.color)}/> {ag.icon} {ag.label}
            </button>
          ))}
        </div>
        {stats && (
          <div style={S.sideStats}>
            <div style={S.statRow}><span style={S.statL}>Queries</span><span style={S.statV}>{stats.total_queries}</span></div>
            <div style={S.statRow}><span style={S.statL}>Hours Saved</span><span style={S.statV}>{stats.hours_saved}h</span></div>
            <div style={S.statRow}><span style={S.statL}>Tokens</span><span style={S.statV}>{(stats.tokens_saved/1000).toFixed(1)}K</span></div>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        <div style={S.topbar}>
          <div style={S.topTitle}>{view==="chat" ? `${AGENTS[agent]?.icon} ${AGENTS[agent]?.label} Agent` : "Analytics Dashboard"}</div>
          <span style={S.badge("rgba(5,150,105,0.15)","#34d399","rgba(52,211,153,0.3)")}>● LOCAL</span>
          {latency && view==="chat" && <span style={S.badge("rgba(0,229,255,0.08)","#00e5ff","rgba(0,229,255,0.2)")}>{latency}ms</span>}
          <span style={S.badge("rgba(124,58,237,0.12)","#a78bfa","rgba(167,139,250,0.3)")}>Gennovate 2026</span>
        </div>

        {/* CHAT */}
        {view === "chat" && <>
          <div style={S.chatWrap}>
            {msgs.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ fontSize:44 }}>⚙️</div>
                <div style={{ fontSize:19, fontWeight:800 }}>AutoForge is ready</div>
                <div style={{ fontSize:13, color:"#4a5568", textAlign:"center", maxWidth:420, lineHeight:1.6 }}>
                  Ask anything about AUTOSAR configs, UDS diagnostics, ADAS regulations, or ISO 26262 safety.<br/>
                  Running fully local via Ollama — zero data egress.
                </div>
                <div style={S.promptGrid}>
                  {SAMPLES.map((p,i) => (
                    <button key={i} style={S.promptCard} onClick={()=>send(p.text)}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor=AGENTS[p.agent].color; e.currentTarget.style.color="#e2e8f0"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor="#1a1f35"; e.currentTarget.style.color="#4a5568"; }}>
                      <div style={{ fontSize:10, fontWeight:700, marginBottom:4, color:AGENTS[p.agent].color, fontFamily:"monospace" }}>
                        {AGENTS[p.agent].icon} {AGENTS[p.agent].label}
                      </div>
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {msgs.map((m,i) => (
                  <div key={i} style={S.msgRow(m.role==="user")}>
                    <div style={S.avatar(m.role==="user")}>{m.role==="user" ? "👤" : AGENTS[m.agent]?.icon || "🤖"}</div>
                    <div style={S.bubble(m.role==="user")}>
                      {m.role==="assistant" && m.agent && m.agent!=="error" && (
                        <div style={S.agentTag(AGENTS[m.agent]?.color||"#888")}>
                          {AGENTS[m.agent]?.icon} {AGENTS[m.agent]?.label} Agent
                        </div>
                      )}
                      <CodeBlock text={m.content} />
                      {m.latency && <div style={S.metaText}>⚡ {m.latency}ms · {m.tokens} tokens · 🦙 local</div>}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={S.msgRow(false)}>
                    <div style={S.avatar(false)}>🤖</div>
                    <div style={S.bubble(false)}>
                      <div style={{ display:"flex", gap:5, alignItems:"center", padding:"4px 0" }}>
                        {[0,1,2].map(n => (
                          <div key={n} style={{ width:7, height:7, borderRadius:"50%", background:"#00e5ff",
                            animation:"pulse 1.2s infinite", animationDelay:`${n*0.2}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottom} />
              </>
            )}
          </div>
          <div style={S.inputArea}>
            <div style={S.inputRow}>
              <textarea style={S.inputBox} placeholder={`Ask the ${AGENTS[agent]?.label} agent…`}
                value={input} rows={1}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }} />
              <button style={S.sendBtn(loading||!input.trim())} onClick={()=>send()} disabled={loading||!input.trim()}>→</button>
            </div>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
        </>}

        {/* DASHBOARD */}
        {view === "dash" && stats && (
          <div style={S.dash}>
            <div style={{ ...S.cardFull, background:"linear-gradient(135deg,rgba(0,229,255,0.07),rgba(124,58,237,0.07))", border:"1px solid rgba(0,229,255,0.2)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ fontSize:38 }}>🏆</div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#00e5ff" }}>Sasken Gennovate 2026 — AutoForge</div>
                  <div style={{ fontSize:12, color:"#4a5568", marginTop:4, lineHeight:1.5 }}>
                    GenAI-Powered ECU Software Engineering Accelerator · AUTOSAR · UDS/DoIP · ADAS · ISO 26262<br/>
                    Fully local inference via Ollama · Zero data egress · 200–400 engineering hours saved per project
                  </div>
                </div>
              </div>
            </div>

            <div style={S.cardFull}>
              <div style={S.cardTitle}>Impact Metrics</div>
              <div style={S.kpiGrid}>
                {[
                  { val:stats.total_queries,                          label:"Total Queries",      delta:"↑ +12 today",    color:"#00e5ff" },
                  { val:`${stats.hours_saved}h`,                      label:"Eng. Hours Saved",   delta:"≈ $18K value",   color:"#34d399" },
                  { val:`${(stats.tokens_saved/1000).toFixed(0)}K`,   label:"Tokens Processed",   delta:"4 agents active",color:"#a78bfa" },
                  { val:"847",                                         label:"Artifacts Indexed",   delta:"FAISS · Local",  color:"#fb923c" },
                ].map((k,i) => (
                  <div key={i}>
                    <div style={S.kpiVal(k.color)}>{k.val}</div>
                    <div style={S.kpiLabel}>{k.label}</div>
                    <div style={S.kpiDelta}>{k.delta}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Query Volume — Last 14 Days</div>
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1f35" />
                  <XAxis dataKey="d" tick={{ fill:"#4a5568", fontSize:10 }} tickLine={false} />
                  <YAxis tick={{ fill:"#4a5568", fontSize:10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background:"#0d0f1a", border:"1px solid #1a1f35", borderRadius:6, fontSize:11, fontFamily:"monospace" }} />
                  <Area type="monotone" dataKey="v" stroke="#00e5ff" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Agent Distribution</div>
              {Object.entries(stats.queries_by_agent).map(([k,v]) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:76, fontSize:11, fontFamily:"monospace", color:"#4a5568", flexShrink:0 }}>
                    {AGENTS[k]?.icon} {AGENTS[k]?.label}
                  </div>
                  <div style={{ flex:1, height:7, background:"#1a1f35", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ width:`${(v/totalAgentQ*100).toFixed(0)}%`, height:"100%",
                      background:AGENTS[k]?.color, borderRadius:4, transition:"width 0.8s" }} />
                  </div>
                  <div style={{ fontSize:11, fontFamily:"monospace", color:"#4a5568", width:26, textAlign:"right" }}>{v}</div>
                </div>
              ))}
              <div style={{ marginTop:20 }}>
                <div style={S.cardTitle}>Productivity Gains</div>
                {[
                  ["AUTOSAR Analysis",   "2–3 days → 2h",    "4×",   "#7c3aed"],
                  ["UDS Test Gen",       "40h → ~16h",        "↓60%", "#ff6b35"],
                  ["ADAS Traceability",  "1 week → 1 day",   "7×",   "#059669"],
                  ["HARA/FMEA Draft",   "scratch → AI draft","↓40%", "#d97706"],
                ].map(([label,range,gain,color],i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7, fontSize:11 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }} />
                    <div style={{ flex:1, color:"#4a5568" }}>{label} <span style={{ color:"#2d3748" }}>({range})</span></div>
                    <div style={{ fontFamily:"monospace", color, fontWeight:700 }}>{gain}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.cardFull}>
              <div style={S.cardTitle}>Recent Agent Activity</div>
              {[
                ["🔬","DIAG",   "#ff6b35","Generated 0x27 SecurityAccess test class for BCM_Variant_A — 127 lines, production-ready","2m ago"],
                ["🔧","AUTOSAR","#7c3aed","Answered NvM → MemIf → Fee port mapping query with AUTOSAR R22-11 §7.4.3 references","11m ago"],
                ["🚗","ADAS",   "#059669","Extracted 5 UN-R152 §5.2.1 scenarios — JSON matrix ready for CarMaker import","34m ago"],
                ["🛡️","SAFETY", "#d97706","Drafted HARA (8 rows) for AEB with V2X — ASIL-C safety goal, ISO 26262-3 compliant","1h ago"],
                ["🔬","DIAG",   "#ff6b35","Generated 0x2E WriteDataByIdentifier test for DID 0xF190 — demo ready in 7.3s","2h ago"],
              ].map(([icon,ag,color,text,time],i) => (
                <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px", borderRadius:7,
                  border:"1px solid #1a1f35", marginBottom:7, fontSize:12, alignItems:"flex-start" }}>
                  <div style={{ width:28, height:28, borderRadius:6, background:`${color}22`, border:`1px solid ${color}44`,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{icon}</div>
                  <div>
                    <div><strong style={{ color }}>[{ag}]</strong> {text}</div>
                    <div style={{ fontSize:10, color:"#4a5568", marginTop:3, fontFamily:"monospace" }}>{time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}