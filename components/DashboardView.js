 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/components/DashboardView.js b/components/DashboardView.js
index ef0140b9043da0082b35f037e753074ef4ba2efa..0d6b7980561d5df269b40523b07b7bd8d8cbdb12 100644
--- a/components/DashboardView.js
+++ b/components/DashboardView.js
@@ -1,32 +1,32 @@
 "use client";
 import { useState, useEffect, useCallback } from "react";
 import { RefreshCw, ExternalLink, Check, Brain } from "lucide-react";
 import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
 import {
   getTodayStats, getRooms, getBookingById, checkoutBooking,
-  getTodayBookings, getWeeklyRevenue, initializeRooms
+  getTodayBookings, getWeeklyRevenue, initializeRooms, getBookings, reconcileRoomsFromBookings, setBookingStatus
 } from "../lib/db";
 
 function greeting() {
   const h = new Date().getHours();
   return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
 }
 
 /* ─── Hologram Building SVG ──────────────────────────── */
 function HologramBuilding() {
   return (
     <svg viewBox="0 0 160 180" style={{ width:130, height:150, filter:"drop-shadow(0 0 16px #008cff) drop-shadow(0 0 32px rgba(0,140,255,0.35))" }}>
       <ellipse cx="80" cy="160" rx="62" ry="10" fill="none" stroke="rgba(212,175,55,0.9)" strokeWidth="1.5"/>
       <ellipse cx="80" cy="160" rx="50" ry="7" fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="1"/>
       <ellipse cx="80" cy="160" rx="38" ry="5" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="0.7"/>
       <ellipse cx="80" cy="160" rx="62" ry="10" fill="rgba(212,175,55,0.05)"/>
       {/* Main isometric box */}
       <polygon points="80,18 122,48 122,148 80,168 38,148 38,48" fill="none" stroke="rgba(0,140,255,0.6)" strokeWidth="1.2"/>
       <polygon points="80,18 38,48 38,148 80,168" fill="rgba(0,50,110,0.12)" stroke="rgba(0,140,255,0.55)" strokeWidth="0.8"/>
       <polygon points="80,18 122,48 122,148 80,168" fill="rgba(0,70,140,0.08)" stroke="rgba(0,140,255,0.45)" strokeWidth="0.8"/>
       <polygon points="80,18 122,48 80,78 38,48" fill="rgba(0,90,180,0.18)" stroke="rgba(0,140,255,0.8)" strokeWidth="1.2"/>
       {/* Grid lines */}
       {[70,90,110,130].map(y=>(<line key={`l${y}`} x1="38" y1={y} x2="80" y2={y+20} stroke="rgba(0,140,255,0.25)" strokeWidth="0.5"/>))}
       {[70,90,110,130].map(y=>(<line key={`r${y}`} x1="80" y1={y+20} x2="122" y2={y} stroke="rgba(0,140,255,0.2)" strokeWidth="0.5"/>))}
       {/* Windows */}
       {[[48,78],[48,98],[48,118],[60,78],[60,98],[60,118],[72,78],[72,98],[72,118]].map(([x,y],i)=>(
@@ -86,52 +86,52 @@ function AiScanReactor({ onClick }) {
         <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.28em", color:"#60b8ff", textShadow:"0 0 8px #008cff", marginTop:3 }}>SCAN</p>
       </div>
     </button>
   );
 }
 
 /* ─── 3D Keycap ───────────────────────────────────────── */
 /* ── Dynamic grid sizing ──────────────────────────────────── */
 function getRoomGridLayout(totalRooms) {
   if (totalRooms <= 10)  return { cols:5,  gap:6, numSz:10, badgeSz:15, depth:7  };
   if (totalRooms <= 20)  return { cols:5,  gap:5, numSz:9,  badgeSz:13, depth:6  };
   if (totalRooms <= 32)  return { cols:8,  gap:4, numSz:8,  badgeSz:12, depth:5  };
   if (totalRooms <= 48)  return { cols:8,  gap:3, numSz:7,  badgeSz:11, depth:5  };
   if (totalRooms <= 64)  return { cols:10, gap:3, numSz:6,  badgeSz:10, depth:4  };
   if (totalRooms <= 80)  return { cols:10, gap:2, numSz:6,  badgeSz:9,  depth:4  };
   return                        { cols:10, gap:2, numSz:5,  badgeSz:8,  depth:3  };
 }
 
 /* ── Status config ────────────────────────────────────────── */
 function getRoomCfg(status) {
   return {
     occupied:    { face:"linear-gradient(160deg,#1d5c1d 0%,#0d360d 60%,#082208 100%)", right:"linear-gradient(180deg,#0d360d,#051405)", bottom:"#041004", glow:"#22c55e", glowA:"rgba(34,197,94,0.7)",  border:"rgba(34,197,94,0.8)",  badgeC:"#22c55e", numC:"#86efac",  label:"Occupied",    icon:"👤" },
     reserved:    { face:"linear-gradient(160deg,#4a3500 0%,#2e2000 60%,#1a1200 100%)", right:"linear-gradient(180deg,#2e2000,#100b00)", bottom:"#0c0800", glow:"#D4AF37", glowA:"rgba(212,175,55,0.7)", border:"rgba(212,175,55,0.8)", badgeC:"#D4AF37", numC:"#fde68a",  label:"Reserved",    icon:"📌" },
     cleaning:    { face:"linear-gradient(160deg,#1e1e5a 0%,#111138 60%,#08082a 100%)", right:"linear-gradient(180deg,#111138,#060618)", bottom:"#040412", glow:"#818cf8", glowA:"rgba(129,140,248,0.7)",border:"rgba(129,140,248,0.8)",badgeC:"#818cf8", numC:"#c7d2fe",  label:"Cleaning",    icon:"🧹" },
     out_of_order:{ face:"linear-gradient(160deg,#1a1a1e 0%,#111113 60%,#090909 100%)", right:"linear-gradient(180deg,#111113,#060606)", bottom:"#040404", glow:"#6b7280", glowA:"rgba(107,114,128,0.4)",border:"rgba(107,114,128,0.5)",badgeC:"#4b5563", numC:"#9ca3af",  label:"Out of Order", icon:"🔧" },
-    vacant:      { face:"linear-gradient(160deg,#0d3520 0%,#072212 60%,#041209 100%)", right:"linear-gradient(180deg,#072212,#021008)", bottom:"#020a05", glow:"#10b981", glowA:"rgba(16,185,129,0.7)", border:"rgba(16,185,129,0.8)", badgeC:"#10b981", numC:"#6ee7b7",  label:"Vacant",      icon:"" },
-  }[status] || { face:"linear-gradient(160deg,#0d3520,#072212,#041209)", right:"linear-gradient(180deg,#072212,#021008)", bottom:"#020a05", glow:"#10b981", glowA:"rgba(16,185,129,0.7)", border:"rgba(16,185,129,0.8)", badgeC:"#10b981", numC:"#6ee7b7", label:"Vacant", icon:"" };
+    vacant:      { face:"linear-gradient(160deg,#4a1010 0%,#2a0a0a 60%,#140404 100%)", right:"linear-gradient(180deg,#2a0a0a,#120303)", bottom:"#090202", glow:"#ef4444", glowA:"rgba(239,68,68,0.7)", border:"rgba(239,68,68,0.8)", badgeC:"#ef4444", numC:"#fca5a5",  label:"Vacant",      icon:"" },
+  }[status] || { face:"linear-gradient(160deg,#4a1010,#2a0a0a,#140404)", right:"linear-gradient(180deg,#2a0a0a,#120303)", bottom:"#090202", glow:"#ef4444", glowA:"rgba(239,68,68,0.7)", border:"rgba(239,68,68,0.8)", badgeC:"#ef4444", numC:"#fca5a5", label:"Vacant", icon:"" };
 }
 
 /* ── 3D Isometric Room Block ──────────────────────────────── */
 function RoomBlock({ room, onClick, layout }) {
   const cfg = getRoomCfg(room.status);
   const { numSz=9, badgeSz=13, depth=6 } = layout || {};
   const hasImg = room.imageUrl; // future: room.imageUrl
 
   return (
     <button
       onClick={()=>onClick(room)}
       style={{
         width:"100%", aspectRatio:"1/1.05",
         position:"relative", background:"transparent",
         border:"none", cursor:"pointer", padding:0,
         /* Isometric perspective tilt */
         transform:"perspective(400px) rotateX(20deg) rotateZ(0deg)",
         transformOrigin:"center 90%",
         transition:"transform 0.15s ease, filter 0.15s ease",
         filter:`drop-shadow(0 ${depth+2}px ${depth*2}px rgba(0,0,0,0.7)) drop-shadow(0 0 ${depth*2}px ${cfg.glowA})`,
       }}
       onTouchStart={e=>{ e.currentTarget.style.transform="perspective(400px) rotateX(24deg) scale(0.92)"; e.currentTarget.style.filter=`drop-shadow(0 2px 4px rgba(0,0,0,0.9)) drop-shadow(0 0 8px ${cfg.glowA})`; }}
       onTouchEnd={e=>{ e.currentTarget.style.transform="perspective(400px) rotateX(20deg)"; e.currentTarget.style.filter=`drop-shadow(0 ${depth+2}px ${depth*2}px rgba(0,0,0,0.7)) drop-shadow(0 0 ${depth*2}px ${cfg.glowA})`; }}
     >
       {/* ── Bottom depth face (shadow illusion) ── */}
@@ -222,92 +222,95 @@ function RoomBlock({ room, onClick, layout }) {
         </span>
       </div>
 
       {/* Outer ambient glow ring (very subtle) */}
       <div style={{
         position:"absolute", inset:-2, bottom:depth-2,
         borderRadius:"9px 9px 7px 7px",
         border:`1px solid ${cfg.border}`,
         opacity:0.4, pointerEvents:"none",
       }}/>
     </button>
   );
 }
 
 /* ─── Main ────────────────────────────────────────────── */
 export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewBooking }) {
   const [stats,      setStats]   = useState(null);
   const [rooms,      setRooms]   = useState([]);
   const [insight,    setInsight] = useState("Aaj ki demand analysis ho rahi hai...");
   const [iLoad,      setILoad]   = useState(false);
   const [selRoom,    setSelRoom] = useState(null);
   const [revData,    setRevData] = useState([]);
   const [refreshing, setRefresh] = useState(false);
   const [copied,     setCopied]  = useState(false);
 
-  const load = useCallback(() => {
+  const load = useCallback(async () => {
     if (!hotelId) return;
     initializeRooms(hotelId, hotel?.totalRooms || 20);
+    await getBookings(hotelId);
+    reconcileRoomsFromBookings(hotelId);
     setStats(getTodayStats(hotelId));
     setRooms(getRooms(hotelId));
     setRevData(getWeeklyRevenue(hotelId));
   }, [hotelId, hotel?.totalRooms]);
 
   useEffect(() => { load(); fetchInsight(); const iv=setInterval(load,30000); return ()=>clearInterval(iv); }, [load]);
 
   const fetchInsight = async () => {
     setILoad(true);
     try {
       const s = getTodayStats(hotelId);
       const r = await fetch("/api/groq",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({type:"ai_insight",stats:s,hotelName:hotel?.name}) });
       const d = await r.json();
       setInsight(d.insight || localInsight(s));
     } catch { setInsight(localInsight(getTodayStats(hotelId))); }
     setILoad(false);
   };
 
   const handleRefresh = async () => { setRefresh(true); load(); await fetchInsight(); setRefresh(false); };
   const copyLink = () => { navigator.clipboard?.writeText(`${window.location.origin}/booking/${hotelId}`).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); }); };
   const handleRoomClick = (room) => { const booking=room.currentBookingId?getBookingById(hotelId,room.currentBookingId):null; setSelRoom({...room,booking}); };
   const handleCheckout = async (bookingId) => { await checkoutBooking(hotelId,bookingId); load(); setSelRoom(null); if(navigator.vibrate)navigator.vibrate(50); };
 
   if (!stats) return <Skeleton/>;
 
   const pct = (Math.random()*20+5).toFixed(1);
   const byFloor={};
   rooms.forEach(r=>{ if(!byFloor[r.floor])byFloor[r.floor]=[]; byFloor[r.floor].push(r); });
   const floors=Object.keys(byFloor).map(Number).sort((a,b)=>b-a);
 
   const occupied  =rooms.filter(r=>r.status==="occupied").length;
   const vacant    =rooms.filter(r=>r.status==="vacant").length;
   const reserved  =rooms.filter(r=>r.status==="reserved").length;
   const cleaning  =rooms.filter(r=>r.status==="cleaning").length;
   const outOfOrder=rooms.filter(r=>r.status==="out_of_order").length;
   const total     =rooms.length;
 
   const todayBookings=getTodayBookings(hotelId);
-  const pendingCI=todayBookings.filter(b=>b.status==="active").length;
+  const pendingCI=todayBookings.filter(b=>b.status==="pending").length;
+  const approvedCI=todayBookings.filter(b=>b.status==="active").length;
 
   const Tip=({active,payload})=>active&&payload?.length?(<div style={{background:"rgba(0,0,0,0.92)",border:"1px solid rgba(212,175,55,0.4)",borderRadius:8,padding:"5px 9px"}}><p style={{color:"#D4AF37",fontSize:11,fontWeight:800}}>₹{payload[0].value.toLocaleString("en-IN")}</p></div>):null;
 
   const S=(p)=>({ background:"rgba(6,8,15,0.98)", border:"1px solid rgba(255,255,255,0.065)", borderRadius:14, padding:"12px 12px", boxShadow:"0 2px 18px rgba(0,0,0,0.5)", ...p });
 
   return (
     <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden",background:"#07090E"}}>
       <div className="scroll-y" style={{flex:1,paddingBottom:28}}>
 
         {/* ── AI RECEPTIONIST ── */}
         <div style={{padding:"12px 14px 0"}}>
           <div style={{background:"linear-gradient(135deg,rgba(8,12,22,0.98),rgba(4,6,14,0.98))",border:"1px solid rgba(0,140,255,0.18)",borderRadius:18,padding:"14px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 4px 28px rgba(0,140,255,0.07),inset 0 1px 0 rgba(255,255,255,0.04)"}}>
             {/* Avatar */}
             <div style={{position:"relative",flexShrink:0}}>
               {/* Spinning gradient ring */}
               <div style={{position:"absolute",inset:-9,borderRadius:"50%",background:"conic-gradient(from 0deg,rgba(212,175,55,0.9),rgba(0,140,255,0.7),rgba(212,175,55,0),rgba(0,140,255,0.6),rgba(212,175,55,0.9))",animation:"spinRingCW 3s linear infinite"}}>
                 <div style={{position:"absolute",inset:2,borderRadius:"50%",background:"#07090E"}}/>
               </div>
               <div style={{position:"absolute",inset:-3,borderRadius:"50%",border:"1.5px solid rgba(212,175,55,0.35)",boxShadow:"0 0 10px rgba(212,175,55,0.25)"}}/>
               {/* Face */}
               <div style={{width:58,height:58,borderRadius:"50%",overflow:"hidden",position:"relative",boxShadow:"0 0 18px rgba(0,140,255,0.3)"}}>
                 <svg viewBox="0 0 60 60" style={{width:58,height:58}}>
                   <defs>
                     <radialGradient id="sk" cx="50%" cy="35%" r="55%"><stop offset="0%" stopColor="#dba882"/><stop offset="100%" stopColor="#bf7a50"/></radialGradient>
                     <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#120600"/><stop offset="100%" stopColor="#060200"/></linearGradient>
@@ -427,59 +430,59 @@ export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewB
                         </div>
                       </div>
                     );
                   })}
                 </div>
 
                 {/* Legend */}
                 <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:14,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                   {[{c:"#22c55e",l:"Occupied",v:`${occupied}`},{c:"#D4AF37",l:"Reserved",v:`${reserved}`},{c:"#ef4444",l:"Vacant",v:`${vacant}`},{c:"#6b7280",l:"Out of Order",v:`${outOfOrder}`}].map(x=>(
                     <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
                       <div style={{width:7,height:7,borderRadius:"50%",background:x.c,boxShadow:`0 0 5px ${x.c}`}}/>
                       <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{x.l} ({x.v})</span>
                     </div>
                   ))}
                 </div>
               </div>
             );
           })()}
 
           {/* ── QUICK TILES + AI SCAN ── */}
           <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,marginBottom:12,alignItems:"center"}}>
             <div style={{display:"flex",flexDirection:"column",gap:8}}>
               <div style={S()}>
                 <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>👥</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Guest Check-in</p></div>
                 <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{pendingCI}</p>
-                <p style={{fontSize:11,color:"#D4AF37",fontWeight:700,marginTop:2}}>Pending</p>
+                <p style={{fontSize:11,color:"#D4AF37",fontWeight:700,marginTop:2}}>Pending Approval</p>
               </div>
               <div style={S()}>
                 <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>🧹</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Housekeeping</p></div>
                 <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{cleaning}</p>
                 <p style={{fontSize:11,color:"#818cf8",fontWeight:700,marginTop:2}}>Rooms</p>
               </div>
             </div>
-            <AiScanReactor onClick={fetchInsight}/>
+            <AiScanReactor onClick={()=>{ if(navigator.vibrate)navigator.vibrate(30); onNavigate?.("scanner"); }}/>
             <div style={{display:"flex",flexDirection:"column",gap:8}}>
               <div style={S()}>
                 <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>🔧</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Maintenance</p></div>
                 <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{outOfOrder}</p>
                 <p style={{fontSize:11,color:"#008cff",fontWeight:700,marginTop:2}}>Pending</p>
               </div>
               <div style={S()}>
                 <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><span style={{fontSize:13}}>⭐</span><p style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Reviews</p></div>
                 <p style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>4.8</p>
                 <p style={{fontSize:11,color:"#D4AF37",fontWeight:700,marginTop:2}}>Rating</p>
               </div>
             </div>
           </div>
 
           {/* ── AI INSIGHTS + HOLOGRAM ── */}
           <div style={{background:"linear-gradient(135deg,rgba(0,18,45,0.55),rgba(0,8,22,0.65))",border:"1px solid rgba(0,140,255,0.18)",borderRadius:20,padding:"16px",marginBottom:12,position:"relative",overflow:"hidden",boxShadow:"0 4px 28px rgba(0,140,255,0.05),inset 0 1px 0 rgba(0,140,255,0.07)"}}>
             <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"linear-gradient(rgba(0,140,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(0,140,255,0.8) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>
             <div style={{display:"flex",alignItems:"flex-start",position:"relative"}}>
               <div style={{flex:1}}>
                 <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                   <div style={{width:30,height:30,borderRadius:10,background:"rgba(0,140,255,0.1)",border:"1px solid rgba(0,140,255,0.22)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                     <Brain size={13} style={{color:"#60b8ff"}}/>
                   </div>
                   <p style={{fontSize:11,fontWeight:900,color:"#60b8ff",letterSpacing:"0.13em",textShadow:"0 0 10px rgba(0,140,255,0.5)"}}>AI INSIGHTS</p>
                 </div>
@@ -493,51 +496,51 @@ export default function DashboardView({ hotelId, hotel, user, onNavigate, onNewB
                 <button onClick={fetchInsight} style={{padding:"7px 15px",borderRadius:10,background:"transparent",border:"1px solid rgba(212,175,55,0.45)",color:"#D4AF37",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:"0.04em",boxShadow:"0 0 10px rgba(212,175,55,0.12)"}}>
                   View Insights
                 </button>
               </div>
               <div style={{flexShrink:0,marginRight:-10,marginBottom:-10}}>
                 <HologramBuilding/>
               </div>
             </div>
           </div>
 
           {/* ── BOOKING LINK ── */}
           <button onClick={copyLink} style={{width:"100%",background:"rgba(6,8,15,0.9)",border:"1px solid rgba(212,175,55,0.1)",borderRadius:13,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,cursor:"pointer"}}>
             <div style={{display:"flex",alignItems:"center",gap:8}}>
               <ExternalLink size={11} style={{color:"#D4AF37"}}/>
               <span style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.22)"}}>/booking/{hotelId}</span>
             </div>
             <span style={{fontSize:11,fontWeight:700,color:"#D4AF37",display:"flex",alignItems:"center",gap:4}}>
               {copied?<><Check size={10}/>Copied!</>:"Share Link"}
             </span>
           </button>
 
           {/* ── CHECK-INS ── */}
           <div style={{background:"rgba(6,8,15,0.98)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:20,overflow:"hidden"}}>
             <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderBottom:"1px solid rgba(255,255,255,0.045)"}}>
               <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase"}}>Aaj Ke Check-ins</p>
-              <span style={{fontSize:11,fontWeight:700,color:"#D4AF37"}}>{todayBookings.filter(b=>b.status==="active").length} active</span>
+              <span style={{fontSize:11,fontWeight:700,color:"#D4AF37"}}>{approvedCI} approved</span>
             </div>
             {todayBookings.length===0?(
               <div style={{padding:"28px 16px",textAlign:"center"}}>
                 <p style={{fontSize:26,marginBottom:8}}>🌙</p>
                 <p style={{fontSize:13,color:"rgba(255,255,255,0.18)"}}>Aaj koi check-in nahi hua</p>
               </div>
             ):todayBookings.slice(0,5).map((b,idx)=>(
               <div key={b.id} style={{padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:idx<Math.min(4,todayBookings.length-1)?"1px solid rgba(255,255,255,0.038)":"none"}}>
                 <div style={{flex:1,minWidth:0}}>
                   <p style={{fontSize:13,color:"#fff",fontWeight:700,marginBottom:2}}>{b.guestName}</p>
                   <p style={{fontSize:10,color:"rgba(255,255,255,0.28)"}}>Room {b.roomId} · {b.nights} raat · {b.paymentMode}</p>
                 </div>
                 <p style={{fontSize:14,fontWeight:800,color:"#D4AF37",textShadow:"0 0 10px rgba(212,175,55,0.35)",flexShrink:0}}>₹{Number(b.totalAmount||0).toLocaleString("en-IN")}</p>
               </div>
             ))}
           </div>
         </div>
       </div>
 
       {/* ── ROOM DETAIL MODAL ── */}
       {selRoom&&(()=>{
         const cfg = getRoomCfg(selRoom.status);
         const imgs = selRoom.images || (selRoom.imageUrl ? [selRoom.imageUrl] : []);
         return (
           <div style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}} onClick={()=>setSelRoom(null)}>
 
EOF
)