 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app/page.js b/app/page.js
index ee76ae2a51d124025af5e060de901cea31de0425..f87c7bffdb5db238d861b3aef4c813de93b09d93 100644
--- a/app/page.js
+++ b/app/page.js
@@ -1,30 +1,30 @@
 "use client";
 import { useState, useEffect, useCallback } from "react";
 import dynamic from "next/dynamic";
 import { LayoutDashboard, CalendarDays, Users, Cpu, BarChart3, Bell, Menu, X, LogOut } from "lucide-react";
-import { getHotelConfig, getActiveHotelId, initializeRooms } from "../lib/db";
+import { getHotelConfig, getActiveHotelId, initializeRooms, getBookingsSync, setBookingStatus } from "../lib/db";
 
 const DashboardView = dynamic(() => import("../components/DashboardView"), { ssr: false });
 const ScannerView   = dynamic(() => import("../components/ScannerView"),   { ssr: false });
 const ReportsView   = dynamic(() => import("../components/ReportsView"),   { ssr: false });
 const SettingsView  = dynamic(() => import("../components/SettingsView"),  { ssr: false });
 const LoginScreen   = dynamic(() => import("../components/LoginScreen"),   { ssr: false });
 
 const NAV = [
   { id: "home",     Icon: LayoutDashboard, label: "Dashboard"  },
   { id: "scanner",  Icon: CalendarDays,    label: "Bookings"   },
   { id: "guests",   Icon: Users,           label: "Guests"     },
   { id: "reports",  Icon: Cpu,             label: "Operations" },
   { id: "settings", Icon: BarChart3,       label: "Reports"    },
 ];
 
 export default function App() {
   const [tab,      setTab]     = useState("home");
   const [user,     setUser]    = useState(null);
   const [hotel,    setHotel]   = useState(null);
   const [loading,  setLoading] = useState(true);
   const [alerts,   setAlerts]  = useState(0);
   const [menuOpen, setMenu]    = useState(false);
 
   useEffect(() => {
     try {
@@ -180,52 +180,63 @@ export default function App() {
             <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:14, marginBottom:16 }}>
               <p style={{ fontSize:12, fontWeight:600, color:"#fff", marginBottom:8 }}>🔗 Guest Booking Link</p>
               <p style={{ fontSize:11, fontFamily:"monospace", color:"rgba(255,255,255,0.3)", wordBreak:"break-all" }}>/booking/{hotelId}</p>
               <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`); setMenu(false); }} style={{ marginTop:10, width:"100%", padding:"8px", borderRadius:9, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                 Copy Link
               </button>
             </div>
             <div style={{ marginTop:"auto" }}>
               <button onClick={onLogout} style={{ width:"100%", padding:12, borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:600, color:"#f87171", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.18)", cursor:"pointer" }}>
                 <LogOut size={15}/> Hotel Switch / Logout
               </button>
             </div>
           </div>
         </div>
       )}
 
       {/* ══ MAIN CONTENT ════════════════════════════════════════════ */}
       <main style={{ flex:1, overflow:"hidden" }}>
         {tab==="home"    && <DashboardView hotelId={hotelId} hotel={hotel} user={user} onNavigate={setTab} onNewBooking={onNew}/>}
         {tab==="scanner" && <ScannerView   hotelId={hotelId} hotel={hotel} user={user} onSuccess={()=>{ onNew(); setTab("home"); }} onBack={()=>setTab("home")}/>}
         {tab==="reports" && <ReportsView   hotelId={hotelId} hotel={hotel} user={user}/>}
         {tab==="settings"&& <SettingsView  hotelId={hotelId} hotel={hotel} user={user} onLogout={onLogout}/>}
         {tab==="guests"  && (
           <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"16px 14px", gap:12 }}>
             <h2 style={{ fontWeight:900, fontSize:22, color:"#D4AF37", textShadow:"0 0 20px rgba(212,175,55,0.3)" }}>Guests</h2>
-            <div style={{ flex:1, background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center" }}>
-              <p style={{ fontSize:13, color:"rgba(255,255,255,0.2)" }}>Coming soon</p>
+            <div style={{ flex:1, overflow:"auto", background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:20, padding:12 }}>
+              {getBookingsSync(hotelId).length===0 ? <p style={{fontSize:13,color:"rgba(255,255,255,0.35)",textAlign:"center",marginTop:24}}>No guests yet</p> : getBookingsSync(hotelId).map((b)=>(
+                <div key={b.id} style={{padding:"12px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
+                  <div>
+                    <p style={{color:"#fff", fontWeight:700, fontSize:15}}>{b.guestName || "Guest"}</p>
+                    <p style={{color:"rgba(255,255,255,0.5)", fontSize:12}}>{b.roomId} • {new Date(b.createdAt).toLocaleDateString("en-IN")}</p>
+                  </div>
+                  <div style={{display:"flex", alignItems:"center", gap:8}}>
+                    <span style={{fontSize:11, padding:"5px 9px", borderRadius:999, background:"rgba(255,255,255,0.08)", color:"#D4AF37", textTransform:"capitalize"}}>{b.status}</span>
+                    {b.status==="pending" && <button onClick={()=>{ setBookingStatus(hotelId, b.id, "active"); }} style={{fontSize:11, padding:"7px 10px", borderRadius:8, border:"1px solid rgba(34,197,94,0.35)", background:"rgba(34,197,94,0.15)", color:"#4ade80", fontWeight:700}}>Approve</button>}
+                  </div>
+                </div>
+              ))}
             </div>
           </div>
         )}
       </main>
 
       {/* ══ BOTTOM NAV ══════════════════════════════════════════════ */}
       <nav style={{
         flexShrink: 0,
         background: "linear-gradient(180deg, rgba(6,8,15,0.98) 0%, rgba(4,5,12,0.99) 100%)",
         borderTop: "1px solid rgba(212,175,55,0.08)",
         boxShadow: "0 -4px 24px rgba(0,0,0,0.6)",
         paddingBottom: "env(safe-area-inset-bottom)"
       }}>
         <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", padding:"8px 6px 6px" }}>
           {NAV.map(({ id, Icon, label }) => {
             const active = tab === id;
             return (
               <button key={id} onClick={() => setTab(id)} style={{
                 display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                 padding: "6px 10px", borderRadius: 14, border: "none",
                 background: "transparent", cursor: "pointer",
                 position: "relative",
                 transition: "all 0.2s"
               }}>
                 {/* Active glow indicator */}
 
EOF
)