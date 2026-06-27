import React,{useState,useEffect,useRef}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtT=t=>t?t:'—'

export default function BusTracking(){
  const [routes,setRoutes]=useState([])
  const [selRoute,setSelRoute]=useState(null)
  const [loading,setLoading]=useState(true)
  const [tracking,setTracking]=useState(false)
  const [lastUpdate,setLastUpdate]=useState(null)
  const intervalRef=useRef(null)

  useEffect(()=>{
    fetch(`${BASE}/edu/bus-routes`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>{setRoutes(d.data||[]);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  const startTracking=()=>{
    setTracking(true)
    setLastUpdate(new Date())
    // Simulate GPS update every 30 seconds
    intervalRef.current=setInterval(()=>{
      setLastUpdate(new Date())
    },30000)
    toast.success('📍 Live tracking started!')
  }

  const stopTracking=()=>{
    setTracking(false)
    if(intervalRef.current)clearInterval(intervalRef.current)
    toast('Tracking stopped')
  }

  useEffect(()=>()=>{if(intervalRef.current)clearInterval(intervalRef.current)},[])

  const selRouteData=routes.find(r=>r.id===selRoute)

  // Simulated bus position for demo
  const busPosition=selRouteData?.stops?.[Math.floor(Date.now()/60000)%Math.max(selRouteData.stops.length,1)]

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📍 Live Bus Tracking</div>
          <div style={{fontSize:11,color:'#888'}}>{routes.length} routes configured</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {lastUpdate&&<span style={{fontSize:11,color:'#888'}}>Last update: {lastUpdate.toLocaleTimeString('en-IN')}</span>}
          {!tracking?(
            <button onClick={startTracking}
              style={{padding:'7px 16px',background:'#1E8449',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              ▶ Start Tracking
            </button>
          ):(
            <button onClick={stopTracking}
              style={{padding:'7px 16px',background:'#C0392B',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              ⏹ Stop Tracking
            </button>
          )}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:14}}>

        {/* Route List */}
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'#555',marginBottom:8}}>Select Route:</div>
          {loading?<div style={{textAlign:'center',padding:30,color:'#aaa'}}>⏳ Loading...</div>:
          routes.length===0?
            <div style={{textAlign:'center',padding:40,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
              <div style={{fontSize:36,marginBottom:8}}>🚌</div>
              <div style={{fontSize:13,color:'#888'}}>No bus routes configured</div>
              <div style={{fontSize:11,color:'#aaa',marginTop:4}}>Go to Bus Routes to add routes</div>
            </div>:
          <div style={{display:'grid',gap:8}}>
            {routes.map(r=>(
              <div key={r.id} onClick={()=>setSelRoute(r.id)}
                style={{background:'#fff',border:`2px solid ${selRoute===r.id?'#117A65':'#E8E0E8'}`,
                  borderRadius:8,padding:12,cursor:'pointer',
                  background:selRoute===r.id?'#E8F8F5':'#fff'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:13,fontWeight:700,color:selRoute===r.id?'#117A65':'#333'}}>
                    🚌 {r.routeNo}
                  </div>
                  {tracking&&selRoute===r.id&&(
                    <span style={{background:'#1E8449',color:'#fff',padding:'2px 8px',borderRadius:10,fontSize:9,fontWeight:700,animation:'pulse 1s infinite'}}>
                      LIVE
                    </span>
                  )}
                </div>
                <div style={{fontSize:12,color:'#555',marginBottom:4}}>{r.routeName}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:10,color:'#888'}}>
                  <span>🌅 {r.morningStart||'—'}</span>
                  <span>🌆 {r.afternoonStart||'—'}</span>
                  <span>📍 {r.stops?.length||0} stops</span>
                  <span>👨‍👩‍👦 {r.students?.length||0} students</span>
                </div>
              </div>
            ))}
          </div>}
        </div>

        {/* Map & Details */}
        <div>
          {selRouteData?(
            <div>
              {/* Map Placeholder */}
              <div style={{background:'#E8F5E9',border:'2px solid #1E8449',borderRadius:10,
                height:300,display:'flex',alignItems:'center',justifyContent:'center',
                marginBottom:14,position:'relative',overflow:'hidden'}}>
                {/* Simulated map with route line */}
                <svg width="100%" height="100%" style={{position:'absolute',top:0,left:0}}>
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#A9DFBF" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>
                  {/* Route line */}
                  <polyline points="50,250 150,200 250,150 350,120 450,100 550,80"
                    fill="none" stroke="#117A65" strokeWidth="3" strokeDasharray="8,4"/>
                  {/* Stop markers */}
                  {selRouteData.stops?.map((stop,i)=>{
                    const x=50+(i*100)
                    const y=250-(i*34)
                    return(
                      <g key={stop.id}>
                        <circle cx={x} cy={y} r="8" fill="#fff" stroke="#117A65" strokeWidth="2"/>
                        <circle cx={x} cy={y} r="4" fill="#117A65"/>
                        <text x={x} y={y-14} textAnchor="middle" fontSize="9" fill="#333" fontFamily="Arial">{stop.stopName}</text>
                      </g>
                    )
                  })}
                  {/* Bus icon (animated) */}
                  {tracking&&(
                    <g>
                      <circle cx="250" cy="150" r="14" fill="#6E2C00"/>
                      <text x="250" y="155" textAnchor="middle" fontSize="14">🚌</text>
                    </g>
                  )}
                </svg>
                {!tracking&&(
                  <div style={{textAlign:'center',zIndex:1,background:'rgba(255,255,255,.9)',
                    borderRadius:8,padding:'16px 24px'}}>
                    <div style={{fontSize:32,marginBottom:8}}>🗺️</div>
                    <div style={{fontSize:14,fontWeight:700,color:'#117A65',marginBottom:4}}>Route Map — {selRouteData.routeName}</div>
                    <div style={{fontSize:12,color:'#888',marginBottom:12}}>{selRouteData.stops?.length||0} stops · {selRouteData.totalKm||'—'} km</div>
                    <div style={{fontSize:11,color:'#888'}}>Click "Start Tracking" to see live bus location</div>
                  </div>
                )}
                {tracking&&(
                  <div style={{position:'absolute',top:10,right:10,background:'#1E8449',color:'#fff',
                    padding:'4px 12px',borderRadius:10,fontSize:11,fontWeight:700}}>
                    🔴 LIVE — Bus near {busPosition?.stopName||'En Route'}
                  </div>
                )}
              </div>

              {/* Stop Details */}
              <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
                <div style={{background:'#117A65',padding:'10px 16px',color:'#fff',fontSize:13,fontWeight:700,
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>📍 Route Stops — {selRouteData.routeName}</span>
                  <span style={{fontSize:11}}>Students: {selRouteData.students?.length||0}</span>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#E8F8F5'}}>
                    {['Stop','Stop Name','Morning Pickup','Afternoon Drop','Students','Fee/Month'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'#117A65'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(selRouteData.stops||[]).map((s,i)=>(
                      <tr key={s.id} style={{background:i%2===0?'#fff':'#F0FBF8',borderBottom:'1px solid #E8F5F0'}}>
                        <td style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#117A65'}}>{s.stopOrder}</td>
                        <td style={{padding:'8px 12px',fontWeight:600}}>{s.stopName}</td>
                        <td style={{padding:'8px 12px',color:'#555'}}>{fmtT(s.pickupTime)}</td>
                        <td style={{padding:'8px 12px',color:'#555'}}>{fmtT(s.dropTime)}</td>
                        <td style={{padding:'8px 12px',textAlign:'center',fontWeight:700,color:'#1E8449'}}>
                          {selRouteData.students?.filter(st=>st.busStopId===s.id).length||0}
                        </td>
                        <td style={{padding:'8px 12px',fontWeight:700,color:'#6E2C00'}}>
                          {s.feeAmount?`₹${Number(s.feeAmount).toLocaleString('en-IN')}`:'—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Parent Notification Panel */}
              <div style={{marginTop:14,background:'#FDF2E9',border:'1px solid #E8C9A0',borderRadius:8,padding:14}}>
                <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:10}}>📱 Parent Notification System</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[
                    {label:'Bus Started',msg:`${selRouteData.routeName} has started. ETA to first stop: 25 mins`,color:'#1A5276'},
                    {label:'Reached Stop',msg:`Bus reached ${selRouteData.stops?.[0]?.stopName||'Stop 1'}. Please be ready!`,color:'#117A65'},
                    {label:'Bus Delayed',msg:`${selRouteData.routeName} is delayed by 15 mins due to traffic`,color:'#B8860B'},
                    {label:'Trip Complete',msg:`All students dropped safely. ${selRouteData.routeName} trip completed`,color:'#1E8449'},
                  ].map(n=>(
                    <div key={n.label} style={{background:'#fff',borderRadius:6,padding:'10px 12px',border:`1px solid ${n.color}22`}}>
                      <div style={{fontSize:11,fontWeight:700,color:n.color,marginBottom:4}}>{n.label}</div>
                      <div style={{fontSize:11,color:'#555',marginBottom:8}}>{n.msg}</div>
                      <button onClick={()=>toast.success(`SMS sent to ${selRouteData.students?.length||0} parents!`)}
                        style={{padding:'4px 12px',background:n.color,color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                        📱 Send SMS
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ):(
            <div style={{textAlign:'center',padding:80,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
              <div style={{fontSize:60,marginBottom:16}}>🗺️</div>
              <div style={{fontSize:16,fontWeight:700,color:'#117A65',marginBottom:8}}>Select a Route to View</div>
              <div style={{fontSize:13,color:'#888'}}>Choose a bus route from the left panel to see the map and stop details</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  )
}
