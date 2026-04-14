import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || "YOUR_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const C = {
  lavender:"#7B5EA7", lavenderDeep:"#5C3D8F", lavenderMid:"#9B7EC8",
  lavenderSoft:"#C4A8E0", lavenderMist:"#EDE6F5", lavenderGlow:"#F7F3FC",
  white:"#FFFFFF", offWhite:"#FAF8FD", petal:"#F2ECF9",
  ink:"#2A1F3D", inkMid:"#5A4A72", inkLight:"#8A7A9A",
  success:"#5BA87A", successLight:"#EBF7F1",
  warning:"#C97B2A", warningLight:"#FDF3E7",
  border:"#DDD3ED", borderLight:"#EDE6F5",
};

const VIEWS = { DASHBOARD:"dashboard", ORDERS:"orders", CUSTOMERS:"customers", ANALYTICS:"analytics", SETTINGS:"settings" };

const STATUS_CFG = {
  scheduled:   { label:"Scheduled",     bg:C.lavenderMist, color:C.lavender,  dot:"#9B7EC8" },
  received:    { label:"Received",      bg:"#FDF3E7",       color:C.warning,   dot:C.warning },
  in_cleaning: { label:"In Cleaning",   bg:"#EBF1FD",       color:"#3A6EC8",   dot:"#3A6EC8" },
  qc:          { label:"Quality Check", bg:"#FFF8E1",       color:"#B8860B",   dot:"#B8860B" },
  ready:       { label:"Ready",         bg:C.successLight,  color:C.success,   dot:C.success },
  completed:   { label:"Completed",     bg:C.lavenderMist,  color:C.inkLight,  dot:C.inkLight},
};
const NEXT_STATUS = { scheduled:"received", received:"in_cleaning", in_cleaning:"qc", qc:"ready" };
const NEXT_LABEL  = { scheduled:"Mark Received", received:"Start Cleaning", in_cleaning:"Send to QC", qc:"Mark Ready" };

const ALL_SERVICES = [
  { id:"dry_clean",   label:"Dry Clean"            },
  { id:"launder",     label:"Launder & Press"      },
  { id:"wash_fold",   label:"Wash & Fold"          },
  { id:"press_only",  label:"Press Only"           },
  { id:"alterations", label:"Repairs & Alterations"},
  { id:"bedding",     label:"Bedding & Linens"     },
  { id:"leather",     label:"Leather & Suede"      },
  { id:"pickup",      label:"Pickup & Delivery"    },
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.scheduled;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:c.bg, color:c.color, fontSize:11, fontFamily:"Georgia", whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, display:"inline-block" }} />
      {c.label}
    </span>
  );
}
function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ background:C.white, borderRadius:20, border:`1px solid ${C.borderLight}`, boxShadow:"0 2px 16px rgba(123,94,167,0.07)", ...style }}>{children}</div>;
}
function MetricCard({ icon, label, value, sub, subColor, accent }) {
  return (
    <Card style={{ padding:"22px 24px", flex:1, minWidth:140 }}>
      <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:26, color:accent||C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif", marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", marginBottom:3 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:subColor||C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>{sub}</div>}
    </Card>
  );
}
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:20, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, fontWeight:"normal" }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:3 }}>{sub}</div>}
    </div>
  );
}
function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:44, height:26, borderRadius:13, background:on?C.lavender:C.borderLight, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ width:20, height:20, borderRadius:"50%", background:C.white, position:"absolute", top:3, left:on?21:3, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );
}
function PrimaryBtn({ children, onClick, style, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding:"10px 18px", background:disabled?"#ccc":`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:12, fontSize:13, fontFamily:"Georgia", cursor:disabled?"not-allowed":"pointer", whiteSpace:"nowrap", ...style }}>{children}</button>;
}
function OutlineBtn({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding:"8px 16px", background:"transparent", color:C.lavender, border:`1px solid ${C.lavenderSoft}`, borderRadius:10, fontSize:12, fontFamily:"Georgia", cursor:"pointer", ...style }}>{children}</button>;
}
function FieldInput({ label, value, onChange, placeholder, type="text" }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <div style={{ fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:6 }}>{label}</div>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.offWhite }} />
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const signIn = async () => {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    onAuth(data.session);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg,${C.lavenderMist},#e8dff5)` }}>
      <div style={{ width:420, background:C.white, borderRadius:28, overflow:"hidden", boxShadow:`0 32px 80px rgba(91,61,143,0.18)` }}>
        <div style={{ background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, padding:"36px 40px 32px", textAlign:"center" }}>
          <div style={{ fontSize:36, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", color:C.white, letterSpacing:-0.5, marginBottom:6 }}>dry.</div>
          <div style={{ fontSize:12, color:`${C.white}75`, fontFamily:"Georgia" }}>Business Portal</div>
        </div>
        <div style={{ padding:"32px 40px" }}>
          <div style={{ fontSize:18, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:24 }}>Sign in to your dashboard</div>
          <FieldInput label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourbusiness.com" type="email" />
          <FieldInput label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" />
          {error && <div style={{ fontSize:12, color:"#c0392b", fontFamily:"Georgia", marginBottom:16, padding:"10px 14px", background:"#fdf0f0", borderRadius:10 }}>{error}</div>}
          <PrimaryBtn onClick={signIn} disabled={loading||!email||!password} style={{ width:"100%", padding:"14px", fontSize:14 }}>
            {loading ? "Signing in…" : "Sign In"}
          </PrimaryBtn>
          <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", textAlign:"center", marginTop:20, lineHeight:1.7 }}>
            Not listed on Dry. yet?{" "}
            <a href="/" style={{ color:C.lavender, textDecoration:"none" }}>Apply to join →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id:VIEWS.DASHBOARD, icon:"⌂",  label:"Dashboard" },
  { id:VIEWS.ORDERS,    icon:"📋", label:"Orders"    },
  { id:VIEWS.CUSTOMERS, icon:"👥", label:"Customers" },
  { id:VIEWS.ANALYTICS, icon:"📊", label:"Analytics" },
  { id:VIEWS.SETTINGS,  icon:"⚙️", label:"Settings"  },
];

function Sidebar({ view, setView, business, onSignOut }) {
  return (
    <div style={{ width:220, background:`linear-gradient(180deg,${C.lavenderDeep},${C.lavender})`, display:"flex", flexDirection:"column", padding:"0 0 24px", flexShrink:0, height:"100vh" }}>
      <div style={{ padding:"32px 28px 24px" }}>
        <div style={{ fontSize:28, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic" }}>dry.</div>
        <div style={{ fontSize:10, color:`${C.white}70`, letterSpacing:2, textTransform:"uppercase", fontFamily:"Georgia", marginTop:2 }}>Business Portal</div>
      </div>
      {business && (
        <div style={{ margin:"0 16px 24px", background:`${C.white}15`, borderRadius:14, padding:"12px 16px" }}>
          <div style={{ fontSize:11, color:`${C.white}70`, fontFamily:"Georgia", marginBottom:3 }}>Your Location</div>
          <div style={{ fontSize:14, color:C.white, fontFamily:"Georgia" }}>{business.name}</div>
          <div style={{ fontSize:11, color:`${C.white}60`, fontFamily:"Georgia" }}>{business.address}</div>
          <div style={{ marginTop:8, display:"inline-flex", alignItems:"center", gap:6, background:`${C.white}15`, borderRadius:10, padding:"3px 10px" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:business.plan==="pro"?"#FFD700":C.lavenderSoft }} />
            <span style={{ fontSize:10, color:C.white, fontFamily:"Georgia", textTransform:"uppercase", letterSpacing:1 }}>{business.plan}</span>
          </div>
        </div>
      )}
      <div style={{ flex:1, padding:"0 12px" }}>
        {NAV.map(item => {
          const active = view===item.id;
          return (
            <div key={item.id} onClick={() => setView(item.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderRadius:14, marginBottom:4, cursor:"pointer", background:active?`${C.white}20`:"transparent" }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:14, color:active?C.white:`${C.white}75`, fontFamily:"Georgia" }}>{item.label}</span>
              {active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:C.white }} />}
            </div>
          );
        })}
      </div>
      <div style={{ margin:"0 16px" }}>
        <button onClick={onSignOut} style={{ width:"100%", padding:"11px", background:`${C.white}12`, border:`1px solid ${C.white}25`, borderRadius:12, color:`${C.white}80`, fontSize:13, fontFamily:"Georgia", cursor:"pointer" }}>Sign Out</button>
      </div>
    </div>
  );
}

function TopBar({ title, sub, business }) {
  const now = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  return (
    <div style={{ padding:"22px 32px 18px", background:C.white, borderBottom:`1px solid ${C.borderLight}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
      <div>
        <div style={{ fontSize:22, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, fontWeight:"normal" }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:12, color:C.ink, fontFamily:"Georgia" }}>{now}</div>
          <div style={{ fontSize:11, color:business?.is_active?C.lavender:C.warning, fontFamily:"Georgia", fontStyle:"italic" }}>
            {business?.is_active ? "● Active" : "● Inactive"}
          </div>
        </div>
        <div style={{ width:40, height:40, borderRadius:"50%", background:C.lavenderMist, border:`2px solid ${C.lavenderSoft}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:C.lavender, fontFamily:"Georgia" }}>
          {business?.name?.charAt(0)||"B"}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ setView, orders, business }) {
  const ready    = orders.filter(o=>o.status==="ready").length;
  const active   = orders.filter(o=>["in_cleaning","qc"].includes(o.status)).length;
  const incoming = orders.filter(o=>["scheduled","received"].includes(o.status)).length;
  const todayRev = orders.reduce((s,o)=>s+(parseFloat(o.total)||0),0);
  const hangDryOrders = orders.filter(o=>o.services?.some(s=>s.hangDry)).length;

  const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weeklyMap = {}; DAYS_SHORT.forEach(d=>weeklyMap[d]=0);
  orders.forEach(o=>{const d=DAYS_SHORT[new Date(o.created_at).getDay()];weeklyMap[d]=(weeklyMap[d]||0)+(parseFloat(o.total)||0);});
  const weekly = DAYS_SHORT.map(d=>({day:d,revenue:weeklyMap[d]}));
  const weekMax = Math.max(...weekly.map(d=>d.revenue),1);
  const todayDay = DAYS_SHORT[new Date().getDay()];

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title={`Good morning, ${business?.name?.split(" ")[0]||"there"}!`} sub="Here is everything happening at your location today." />

      {ready>0 && (
        <div style={{ background:C.successLight, border:`1.5px solid ${C.success}`, borderRadius:16, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, color:C.success, fontFamily:"Georgia" }}>{ready} order{ready>1?"s are":" is"} ready for pickup — customers notified</div>
          </div>
          <OutlineBtn onClick={()=>setView(VIEWS.ORDERS)} style={{ borderColor:C.success, color:C.success }}>View</OutlineBtn>
        </div>
      )}
      {hangDryOrders>0 && (
        <div style={{ background:"#EDF4FF", border:"1.5px solid #A0BEF0", borderRadius:16, padding:"12px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
          <span>💧</span>
          <div style={{ fontSize:13, color:"#3A6EC8", fontFamily:"Georgia" }}>{hangDryOrders} order{hangDryOrders>1?"s":""}  with hang dry — air dry only, no heat</div>
        </div>
      )}

      <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        <MetricCard icon="📦" label="Orders Today"     value={orders.length}              sub={`${active} in process`}   accent={C.lavenderDeep} />
        <MetricCard icon="✅" label="Ready for Pickup" value={ready}                       sub="Customers notified"        accent={C.success}  subColor={C.success} />
        <MetricCard icon="⏳" label="Incoming"         value={incoming}                    sub="Scheduled drop-offs"       accent={C.warning}  subColor={C.warning} />
        <MetricCard icon="💰" label="Revenue Today"    value={`$${todayRev.toFixed(0)}`}   sub="From today's orders"       accent={C.lavenderDeep} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20 }}>
        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>Today's Orders</div>
            <OutlineBtn onClick={()=>setView(VIEWS.ORDERS)}>See All</OutlineBtn>
          </div>
          {orders.length===0 && <div style={{ padding:"28px 24px", textAlign:"center", color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>No orders yet today.</div>}
          {orders.slice(0,5).map((o,i)=>(
            <div key={o.id} style={{ padding:"13px 24px", borderBottom:i<Math.min(4,orders.length-1)?`1px solid ${C.borderLight}`:"none", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", marginBottom:2 }}>{o.customer_name||"Customer"}</div>
                <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.garments_summary}</span>
                  {o.services?.some(s=>s.hangDry) && <span style={{ fontSize:9, color:"#3A6EC8", background:"#EDF4FF", padding:"1px 5px", borderRadius:6, flexShrink:0 }}>💧</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                {o.rush && <span style={{ fontSize:10, color:C.warning, background:C.warningLight, padding:"2px 7px", borderRadius:8, fontFamily:"Georgia" }}>RUSH</span>}
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ padding:"18px 24px 14px", borderBottom:`1px solid ${C.borderLight}` }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink }}>This Week's Revenue</div>
          </div>
          <div style={{ padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", height:130, gap:6 }}>
              {weekly.map(d=>{
                const isToday=d.day===todayDay;
                const h=Math.round((d.revenue/weekMax)*110);
                return (
                  <div key={d.day} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                    <div style={{ fontSize:10, color:isToday?C.lavender:C.inkLight, fontFamily:"Georgia" }}>{d.revenue>0?`$${d.revenue.toFixed(0)}`:""}</div>
                    <div style={{ width:"100%", height:Math.max(h,4), borderRadius:"6px 6px 0 0", background:isToday?`linear-gradient(180deg,${C.lavender},${C.lavenderDeep})`:C.lavenderMist }} />
                    <div style={{ fontSize:11, color:isToday?C.lavender:C.inkLight, fontFamily:"Georgia" }}>{d.day}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Orders View ──────────────────────────────────────────────────────────────
function OrdersView({ orders, onAdvanceStatus }) {
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState(null);
  const filters = ["all","scheduled","received","in_cleaning","qc","ready"];
  const filtered = filter==="all" ? orders : orders.filter(o=>o.status===filter);

  const advance = async (e, order) => {
    e.stopPropagation();
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await onAdvanceStatus(order.id, next);
    setToast(`${order.customer_name||"Customer"} → ${next.replace("_"," ")}`);
    setTimeout(()=>setToast(null),3000);
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto", position:"relative" }}>
      {toast && <div style={{ position:"fixed", top:24, right:24, background:C.success, color:C.white, padding:"12px 20px", borderRadius:14, fontSize:13, fontFamily:"Georgia", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", zIndex:999 }}>✅ {toast}</div>}
      <SectionHeader title="Today's Orders" sub="Tap any order to expand, then advance its status" />
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {filters.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"8px 16px", borderRadius:20, border:`1.5px solid ${filter===f?C.lavender:C.border}`, background:filter===f?C.lavenderMist:C.white, color:filter===f?C.lavender:C.inkLight, fontSize:12, fontFamily:"Georgia", cursor:"pointer" }}>
            {f==="all"?`All (${orders.length})`:`${STATUS_CFG[f]?.label} (${orders.filter(o=>o.status===f).length})`}
          </button>
        ))}
      </div>
      {filtered.length===0 && <div style={{ textAlign:"center", padding:"60px 20px", color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>No orders in this status.</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.map(o=>(
          <Card key={o.id} onClick={()=>setSelected(selected===o.id?null:o.id)} style={{ padding:"20px 24px", cursor:"pointer", border:selected===o.id?`1.5px solid ${C.lavender}`:`1px solid ${C.borderLight}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <div style={{ fontSize:16, color:C.ink, fontFamily:"Palatino Linotype,Georgia,serif" }}>{o.customer_name||"Customer"}</div>
                  {o.rush && <span style={{ fontSize:10, color:C.warning, background:C.warningLight, padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>⚡ RUSH</span>}
                  {o.services?.some(s=>s.hangDry) && <span style={{ fontSize:10, color:"#3A6EC8", background:"#EDF4FF", padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>💧 HANG DRY</span>}
                  {o.is_quick_drop && <span style={{ fontSize:10, color:C.lavender, background:C.lavenderMist, padding:"3px 8px", borderRadius:10, fontFamily:"Georgia" }}>⚡ QUICK DROP</span>}
                </div>
                <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia", marginBottom:5 }}>{o.garments_summary}</div>
                <div style={{ display:"flex", gap:16, fontSize:12, color:C.inkLight, fontFamily:"Georgia", flexWrap:"wrap" }}>
                  <span>${o.total}</span>
                  <span style={{ color:C.lavenderMid }}>{o.id}</span>
                  {o.scheduled_time && <span>{o.scheduled_time}</span>}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10, flexShrink:0 }}>
                <StatusBadge status={o.status} />
                {NEXT_STATUS[o.status] && <PrimaryBtn onClick={e=>advance(e,o)} style={{ fontSize:12, padding:"8px 14px" }}>{NEXT_LABEL[o.status]} →</PrimaryBtn>}
              </div>
            </div>
            {selected===o.id && (
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.borderLight}` }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[["Order ID",o.id],["Scheduled",o.scheduled_date?`${o.scheduled_date} ${o.scheduled_time||""}`:"Walk-in"],["Total",`$${o.total}`],["Rush",o.rush?"Yes":"No"],["Hang Dry",o.services?.some(s=>s.hangDry)?"Yes — air dry only":"No"],["Quick Drop",o.is_quick_drop?"Yes":"No"]].map(([k,v])=>(
                    <div key={k} style={{ background:C.offWhite, borderRadius:12, padding:"12px 14px" }}>
                      <div style={{ fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia", marginBottom:4 }}>{k}</div>
                      <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{v}</div>
                    </div>
                  ))}
                </div>
                {o.special_notes && (
                  <div style={{ marginTop:12, padding:"12px 14px", background:"#FDF3E7", borderRadius:12, fontSize:13, color:C.inkMid, fontFamily:"Georgia", fontStyle:"italic" }}>📝 {o.special_notes}</div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Customers View ───────────────────────────────────────────────────────────
function CustomersView({ orders }) {
  const [search, setSearch] = useState("");
  const custMap = {};
  orders.forEach(o=>{
    const id=o.user_id||o.customer_name||"anon";
    if (!custMap[id]) custMap[id]={ name:o.customer_name||"Customer", visits:0, spent:0, lastVisit:o.created_at };
    custMap[id].visits++;
    custMap[id].spent+=parseFloat(o.total)||0;
    if (new Date(o.created_at)>new Date(custMap[id].lastVisit)) custMap[id].lastVisit=o.created_at;
  });
  const customers = Object.values(custMap).filter(c=>c.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.spent-a.spent);
  const tag = c => c.visits>=10?"VIP":c.visits>=3?"Regular":"New";

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title="Your Customers" sub="Everyone who has ordered through your Dry location" />
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name…" style={{ width:"100%", padding:"13px 18px", borderRadius:14, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.white, marginBottom:20 }} />
      <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
        {[["👥","Customers",customers.length,"All time"],["⭐","VIP",customers.filter(c=>tag(c)==="VIP").length,"10+ visits"],["🔁","Return Rate",`${customers.length?Math.round(customers.filter(c=>c.visits>1).length/customers.length*100):0}%`,"Repeat"],["💰","Avg Spend",`$${customers.length?(customers.reduce((s,c)=>s+c.spent,0)/customers.length).toFixed(0):0}`,"Per customer"]].map(([icon,label,val,sub])=>(
          <Card key={label} style={{ flex:1, minWidth:130, padding:"18px 20px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:22, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{val}</div>
            <div style={{ fontSize:12, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
            <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>{sub}</div>
          </Card>
        ))}
      </div>
      {customers.length===0?(
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic" }}>No customer data yet. Orders populate this table automatically.</div>
      ):(
        <Card>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", padding:"11px 24px", borderBottom:`1px solid ${C.borderLight}`, gap:8 }}>
            {["Customer","Visits","Spent","Last Visit","Status"].map(h=>(
              <div key={h} style={{ fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia" }}>{h}</div>
            ))}
          </div>
          {customers.map((c,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", padding:"15px 24px", borderBottom:i<customers.length-1?`1px solid ${C.borderLight}`:"none", gap:8, alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:C.lavenderMist, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.lavender, fontFamily:"Georgia", flexShrink:0 }}>{c.name.charAt(0)}</div>
                <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{c.name}</div>
              </div>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{c.visits}</div>
              <div style={{ fontSize:13, color:C.lavenderDeep, fontFamily:"Georgia" }}>${c.spent.toFixed(0)}</div>
              <div style={{ fontSize:13, color:C.inkMid, fontFamily:"Georgia" }}>{new Date(c.lastVisit).toLocaleDateString()}</div>
              <span style={{ fontSize:11, padding:"4px 10px", borderRadius:20, fontFamily:"Georgia", display:"inline-block", color:tag(c)==="VIP"?C.lavender:tag(c)==="Regular"?C.success:C.inkLight, background:tag(c)==="VIP"?C.lavenderMist:tag(c)==="Regular"?C.successLight:C.offWhite }}>{tag(c)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────
function AnalyticsView({ orders }) {
  const totalRevenue = orders.reduce((s,o)=>s+(parseFloat(o.total)||0),0);
  const avgOrder = orders.length?(totalRevenue/orders.length).toFixed(2):"0";
  const hangDryPct = orders.length?Math.round(orders.filter(o=>o.services?.some(s=>s.hangDry)).length/orders.length*100):0;
  const rushPct = orders.length?Math.round(orders.filter(o=>o.rush).length/orders.length*100):0;

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title="Analytics & Insights" sub="Performance data from your orders on the Dry platform" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {[["💰","Total Revenue",`$${totalRevenue.toFixed(0)}`,`${orders.length} orders`],["📦","Total Orders",orders.length,"All time"],["⭐","Avg. Order Value",`$${avgOrder}`,"Per transaction"],["💧","Hang Dry Rate",`${hangDryPct}%`,"Of laundry orders"]].map(([icon,label,val,sub])=>(
          <Card key={label} style={{ padding:"20px 22px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:24, color:C.lavenderDeep, fontFamily:"Palatino Linotype,Georgia,serif" }}>{val}</div>
            <div style={{ fontSize:12, color:C.ink, fontFamily:"Georgia", marginTop:2 }}>{label}</div>
            <div style={{ fontSize:11, color:C.success, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{sub}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:16 }}>Order Breakdown</div>
          {[["Rush Orders",`${rushPct}%`],["Hang Dry Requests",`${hangDryPct}%`],["Quick Drop",`${orders.length?Math.round(orders.filter(o=>o.is_quick_drop).length/orders.length*100):0}%`],["Completed",`${orders.length?Math.round(orders.filter(o=>o.status==="completed").length/orders.length*100):0}%`]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.borderLight}` }}>
              <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{k}</div>
              <div style={{ fontSize:14, color:C.lavender, fontFamily:"Georgia" }}>{v}</div>
            </div>
          ))}
        </Card>
        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:16 }}>Status Distribution</div>
          {Object.entries(STATUS_CFG).map(([status,cfg])=>{
            const cnt=orders.filter(o=>o.status===status).length;
            const pct=orders.length?Math.round(cnt/orders.length*100):0;
            return (
              <div key={status} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{cfg.label}</div>
                  <div style={{ fontSize:13, color:C.lavender, fontFamily:"Georgia" }}>{cnt}</div>
                </div>
                <div style={{ height:6, background:C.lavenderMist, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:cfg.dot, borderRadius:3 }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
      {orders.length===0 && <div style={{ textAlign:"center", padding:"40px 20px", color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:24 }}>Analytics populate as orders come through your location.</div>}
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
function SettingsView({ business, onSave }) {
  const [form, setForm] = useState({ name:business?.name||"", address:business?.address||"", phone:business?.phone||"", email:business?.email||"", bio:business?.bio||"" });
  const [services, setServices] = useState(business?.services||[]);
  const [features, setFeatures] = useState({ nontoxic:business?.feature_nontoxic||false, express:business?.feature_express||false, luxury:business?.feature_luxury||false, pickup:business?.feature_pickup||false });
  const [hours, setHours] = useState(DAYS.reduce((acc,d)=>({...acc,[d]:{open:business?.hours?.[d]?.open||"7:00 AM",close:business?.hours?.[d]?.close||"7:00 PM"}}),{}));
  const [notify, setNotify] = useState({ ready:true, dropoff:true, pickup:true, hangDry:true });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const toggleSvc = id => setServices(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);

  const save = async () => {
    setSaving(true);
    await onSave({ name:form.name, address:form.address, phone:form.phone, email:form.email, bio:form.bio, services, feature_nontoxic:features.nontoxic, feature_express:features.express, feature_luxury:features.luxury, feature_pickup:features.pickup, hours });
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false),2500);
  };

  return (
    <div style={{ padding:"28px 32px", overflowY:"auto" }}>
      <SectionHeader title="Settings" sub="Changes save instantly and update your live consumer listing" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:20 }}>Business Information</div>
          {[["Business Name","name"],["Address","address"],["Phone","phone"],["Email","email"]].map(([label,key])=>(
            <FieldInput key={key} label={label} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} />
          ))}
          <div style={{ marginBottom:6, fontSize:10, letterSpacing:1.2, color:C.inkLight, textTransform:"uppercase", fontFamily:"Georgia" }}>Bio / Description</div>
          <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={4} placeholder="Tell customers about your business…" style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"Georgia", color:C.ink, outline:"none", boxSizing:"border-box", background:C.offWhite, resize:"vertical" }} />
        </Card>

        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:20 }}>Business Hours</div>
          {DAYS.map(day=>(
            <div key={day} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia", width:90 }}>{day}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input value={hours[day]?.open||""} onChange={e=>setHours(h=>({...h,[day]:{...h[day],open:e.target.value}}))} style={{ width:78, padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, fontFamily:"Georgia", color:C.ink, outline:"none", background:C.offWhite }} />
                <span style={{ fontSize:12, color:C.inkLight }}>to</span>
                <input value={hours[day]?.close||""} onChange={e=>setHours(h=>({...h,[day]:{...h[day],close:e.target.value}}))} style={{ width:78, padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, fontFamily:"Georgia", color:C.ink, outline:"none", background:C.offWhite }} />
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding:"24px" }}>
          <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:6 }}>Services Offered</div>
          <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:16 }}>Toggled-off services appear greyed out on your consumer listing.</div>
          {ALL_SERVICES.map(s=>(
            <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer" }} onClick={()=>toggleSvc(s.id)}>
              <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{s.label}</div>
              <Toggle on={services.includes(s.id)} onToggle={()=>toggleSvc(s.id)} />
            </div>
          ))}
        </Card>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <Card style={{ padding:"24px" }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:6 }}>Special Features</div>
            <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:16 }}>Feature badges appear on your listing and in consumer search filters.</div>
            {[["nontoxic","🌿 Non-Toxic Chemicals","GreenEarth or similar solvents"],["express","⚡ Express Same-Day","Drop-offs before 10am ready same day"],["luxury","✨ Luxury Garments","Couture and designer care"],["pickup","🚗 Pickup & Delivery","You offer pickup service"]].map(([key,label,desc])=>(
              <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                <div>
                  <div style={{ fontSize:13, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
                  <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:2 }}>{desc}</div>
                </div>
                <Toggle on={features[key]} onToggle={()=>setFeatures(f=>({...f,[key]:!f[key]}))} />
              </div>
            ))}
          </Card>

          <Card style={{ padding:"24px" }}>
            <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:16 }}>Your Dry Plan</div>
            <div style={{ background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, borderRadius:16, padding:"20px", marginBottom:16 }}>
              <div style={{ fontSize:10, letterSpacing:2, color:`${C.white}80`, textTransform:"uppercase", fontFamily:"Georgia" }}>Current Plan</div>
              <div style={{ fontSize:20, color:C.white, fontFamily:"Palatino Linotype,Georgia,serif", marginTop:4, textTransform:"capitalize" }}>
                {business?.plan||"Basic"} — ${business?.plan==="pro"?"299":"149"}/month
              </div>
            </div>
            {business?.plan!=="pro" && (
              <button style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:12, fontSize:14, fontFamily:"Georgia", cursor:"pointer" }}>
                Upgrade to Pro — $299/month
              </button>
            )}
            {business?.plan==="pro" && (
              <div style={{ fontSize:13, color:C.success, fontFamily:"Georgia" }}>✓ Priority listing · ✓ Advanced analytics · ✓ Customer insights</div>
            )}
          </Card>
        </div>
      </div>

      <Card style={{ padding:"24px", marginBottom:20 }}>
        <div style={{ fontSize:16, fontFamily:"Palatino Linotype,Georgia,serif", color:C.ink, marginBottom:4 }}>Customer Notifications</div>
        <div style={{ fontSize:12, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginBottom:20 }}>Sent automatically — no action needed</div>
        {[["Order Received","Sent when you mark an order received","ready"],["Order Ready for Pickup","Sent when you mark ready","dropoff"],["Pickup Reminder","Sent if uncollected for 24+ hours","pickup"],["Hang Dry Alert","Sent to staff on hang dry orders","hangDry"]].map(([label,desc,key])=>(
          <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${C.borderLight}` }}>
            <div>
              <div style={{ fontSize:14, color:C.ink, fontFamily:"Georgia" }}>{label}</div>
              <div style={{ fontSize:11, color:C.inkLight, fontFamily:"Georgia", fontStyle:"italic", marginTop:3 }}>{desc}</div>
            </div>
            <Toggle on={notify[key]} onToggle={()=>setNotify(n=>({...n,[key]:!n[key]}))} />
          </div>
        ))}
      </Card>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={save} disabled={saving} style={{ padding:"14px 40px", background:saved?C.success:saving?"#ccc":`linear-gradient(135deg,${C.lavenderDeep},${C.lavender})`, color:C.white, border:"none", borderRadius:14, fontSize:15, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", cursor:saving?"not-allowed":"pointer", transition:"background 0.3s" }}>
          {saved?"✓ Saved!":saving?"Saving…":"Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
const META = {
  [VIEWS.DASHBOARD]: { title:"Dashboard",  sub:"Your business at a glance"                },
  [VIEWS.ORDERS]:    { title:"Orders",      sub:"Today's drop-offs and active orders"       },
  [VIEWS.CUSTOMERS]: { title:"Customers",   sub:"Who is coming through your door"           },
  [VIEWS.ANALYTICS]: { title:"Analytics",   sub:"Revenue, trends, and performance insights" },
  [VIEWS.SETTINGS]:  { title:"Settings",    sub:"Changes update your live consumer listing" },
};

export default function App() {
  const [session,     setSession]     = useState(null);
  const [business,    setBusiness]    = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [view,        setView]        = useState(VIEWS.DASHBOARD);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setAuthLoading(false);});
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,session)=>{
      setSession(session);
      if (!session){setBusiness(null);setOrders([]);}
    });
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if (!session?.user?.email) return;
    supabase.from("businesses").select("*").eq("owner_email",session.user.email).single()
      .then(({data})=>{if(data)setBusiness(data);});
  },[session]);

  useEffect(()=>{
    if (!business?.id) return;
    const today = new Date().toISOString().split("T")[0];
    const load = async ()=>{
      const {data} = await supabase.from("business_orders").select("*").eq("business_id",business.id).gte("created_at",`${today}T00:00:00`).order("created_at",{ascending:false});
      if(data) setOrders(data);
    };
    load();
    const channel = supabase.channel(`biz-${business.id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"orders",filter:`business_id=eq.${business.id}`},()=>load())
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[business?.id]);

  const advanceStatus = useCallback(async (orderId, toStatus)=>{
    const {data} = await supabase.from("orders").update({status:toStatus}).eq("id",orderId).select().single();
    if(data) setOrders(prev=>prev.map(o=>o.id===orderId?{...o,...data}:o));
  },[]);

  // Settings save: writes to Supabase → consumer app sees changes via realtime
  const saveSettings = useCallback(async (updates)=>{
    if(!business?.id) return;
    const {data} = await supabase.from("businesses").update(updates).eq("id",business.id).select().single();
    if(data) setBusiness(data);
  },[business?.id]);

  const signOut = async ()=>{ await supabase.auth.signOut(); setSession(null); };

  if (authLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg,${C.lavenderMist},#e8dff5)` }}>
      <div style={{ fontSize:32, fontFamily:"Palatino Linotype,Georgia,serif", fontStyle:"italic", color:C.lavender }}>dry.</div>
    </div>
  );

  if (!session) return <AuthScreen onAuth={setSession} />;

  const meta = META[view];
  return (
    <div style={{ display:"flex", height:"100vh", background:C.offWhite, overflow:"hidden" }}>
      <Sidebar view={view} setView={setView} business={business} onSignOut={signOut} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <TopBar title={meta.title} sub={meta.sub} business={business} />
        <div style={{ flex:1, overflowY:"auto", background:C.offWhite }}>
          {view===VIEWS.DASHBOARD && <DashboardView  setView={setView}   orders={orders}  business={business} />}
          {view===VIEWS.ORDERS    && <OrdersView     orders={orders}     onAdvanceStatus={advanceStatus} />}
          {view===VIEWS.CUSTOMERS && <CustomersView  orders={orders} />}
          {view===VIEWS.ANALYTICS && <AnalyticsView  orders={orders} />}
          {view===VIEWS.SETTINGS  && <SettingsView   business={business} onSave={saveSettings} />}
        </div>
      </div>
    </div>
  );
}
