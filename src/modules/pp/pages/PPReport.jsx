import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })
const fmtN = n => Number(n||0).toLocaleString('en-IN')

const todayStr = () => new Date().toISOString().slice(0,10)
const daysAgoStr = n => new Date(Date.now() - n*86400000).toISOString().slice(0,10)

const TABS = [
  { id:'summary',    label:'📊 Production Summary' },
  { id:'wo',         label:'📋 Work Order Report' },
  { id:'shift',      label:'🕐 Shift Production' },
  { id:'efficiency', label:'⚙️ Machine Efficiency (OEE)' },
  { id:'capacity',   label:'📈 Capacity Utilization' },
  { id:'operator',   label:'👷 Operator Productivity' },
  { id:'cost',       label:'💰 Production Cost' },
  { id:'delivery',   label:'🚚 On-Time Delivery (vs Customer Promise)' },
  { id:'scrap',      label:'🗑️ Scrap / Rejection Analysis' },
]

export default function PPReport() {
  const [tab, setTab] = useState('summary')
  const [from, setFrom] = useState(daysAgoStr(30))
  const [to, setTo] = useState(todayStr())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const requestIdRef = React.useRef(0)

  const load = useCallback(async () => {
    setLoading(true)
    const thisRequestId = ++requestIdRef.current
    const endpointMap = {
      summary:'production-summary', efficiency:'efficiency',
      capacity:'capacity', delivery:'on-time-delivery', scrap:'scrap-analysis',
      wo:'work-order', shift:'shift-production', operator:'operator-productivity', cost:'production-cost',
    }
    try {
      const r = await fetch(`${BASE_URL}/pp/reports/${endpointMap[tab]}?from=${from}&to=${to}`, { headers:hdr2() })
      const d = await r.json()
      // A slower, older request can resolve AFTER a newer one if the user
      // switches tabs quickly — without this check, its stale, wrong-shaped
      // data would overwrite the correct tab's state and crash the page.
      if (thisRequestId !== requestIdRef.current) return
      if (d.error) { toast.error(d.error); setData(null) }
      else setData(d.data)
    } catch {
      if (thisRequestId !== requestIdRef.current) return
      toast.error('Failed to load report'); setData(null)
    } finally {
      if (thisRequestId === requestIdRef.current) setLoading(false)
    }
  }, [tab, from, to])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Production Reports <small>Real data, no placeholders</small></div>
        <div className="fi-lv-actions" style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:11,color:'#888'}}>From</span>
          <input type='date' value={from} onChange={e=>setFrom(e.target.value)}
            style={{padding:'6px 8px',border:'1px solid #ddd',borderRadius:5,fontSize:12}} />
          <span style={{fontSize:11,color:'#888'}}>To</span>
          <input type='date' value={to} onChange={e=>setTo(e.target.value)}
            style={{padding:'6px 8px',border:'1px solid #ddd',borderRadius:5,fontSize:12}} />
        </div>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'7px 14px',border:'none',borderRadius:6,cursor:'pointer',
              fontSize:12,fontWeight:700,
              background:tab===t.id?'#714B67':'#F0EBF0', color:tab===t.id?'#fff':'#714B67'}}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{padding:60,textAlign:'center',color:'#aaa'}}>⏳ Loading real data...</div>
      ) : !data ? (
        <div style={{padding:60,textAlign:'center',color:'#aaa'}}>No data available for this period</div>
      ) : (
        <>
          {tab==='summary'    && <SummaryTab data={data} />}
          {tab==='wo'         && <WOReportTab data={data} />}
          {tab==='shift'      && <ShiftTab data={data} />}
          {tab==='efficiency' && <EfficiencyTab data={data} />}
          {tab==='capacity'   && <CapacityTab data={data} />}
          {tab==='operator'   && <OperatorTab data={data} />}
          {tab==='cost'       && <CostTab data={data} />}
          {tab==='delivery'   && <DeliveryTab data={data} />}
          {tab==='scrap'      && <ScrapTab data={data} />}
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'14px 16px',flex:1}}>
      <div style={{fontSize:11,color:'#888',marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:color||'#333'}}>{value}</div>
      {sub && <div style={{fontSize:10,color:'#888',marginTop:2}}>{sub}</div>}
    </div>
  )
}

function SummaryTab({ data }) {
  const { rows = [], totals = {planned:0,produced:0,rejected:0,scrap:0}, avgEff = 0, woCount = 0 } = data || {}
  if (woCount === 0) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No Work Orders in this period</div>
  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16}}>
        <KpiCard label="Total Produced" value={`${fmtN(totals.produced)} units`} sub={`${woCount} work orders`} color="#714B67" />
        <KpiCard label="Avg Efficiency" value={`${avgEff}%`} sub="Target: 90%" color={avgEff>=90?'#1E8449':'#C0392B'} />
        <KpiCard label="Total Rejected" value={`${fmtN(totals.rejected)} units`} sub={totals.planned>0?`${(totals.rejected/totals.planned*100).toFixed(1)}% of planned`:''} color="#C0392B" />
        <KpiCard label="Total Scrap" value={`${fmtN(totals.scrap)} units`} color="#B8860B" />
      </div>
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#FAF8FA'}}>
            {['WO','Product','Planned','Produced','Rejected','Scrap','Efficiency','Status'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.woNo} style={{borderTop:'1px solid #F0EBF0'}}>
                <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{r.woNo}</td>
                <td style={{padding:'8px 12px'}}>{r.itemName}</td>
                <td style={{padding:'8px 12px'}}>{fmtN(r.planned)} {r.uom}</td>
                <td style={{padding:'8px 12px',fontWeight:700,color:'#1E8449'}}>{fmtN(r.produced)} {r.uom}</td>
                <td style={{padding:'8px 12px',color:'#C0392B'}}>{fmtN(r.rejected)}</td>
                <td style={{padding:'8px 12px',color:'#B8860B'}}>{fmtN(r.scrap)}</td>
                <td style={{padding:'8px 12px',fontWeight:700,color:r.eff>=90?'#1E8449':r.eff>=75?'#B8860B':'#C0392B'}}>{r.eff}%</td>
                <td style={{padding:'8px 12px'}}><span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'#F0EBF0',color:'#714B67',fontWeight:700}}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EfficiencyTab({ data }) {
  const rows = data || []
  if (!rows.length) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No Production Entries logged in this period yet — OEE needs real entries to calculate from.</div>
  return (
    <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{background:'#FAF8FA'}}>
          {['Work Center','Availability','Performance','Quality','OEE','Entries'].map(h=>(
            <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.wcId} style={{borderTop:'1px solid #F0EBF0'}}>
              <td style={{padding:'8px 12px',fontWeight:700}}>{r.wcId} — {r.name}</td>
              <td style={{padding:'8px 12px'}}>{r.availability}%</td>
              <td style={{padding:'8px 12px'}}>{r.performance}%</td>
              <td style={{padding:'8px 12px'}}>{r.quality}%</td>
              <td style={{padding:'8px 12px',fontWeight:800,color:r.oee>=85?'#1E8449':r.oee>=60?'#B8860B':'#C0392B'}}>{r.oee}%</td>
              <td style={{padding:'8px 12px',color:'#888'}}>{r.entries}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{padding:'10px 16px',background:'#FEF9E7',fontSize:11,color:'#B8860B'}}>
        💡 OEE = Availability × Performance × Quality. World-class benchmark is 85%+.
      </div>
    </div>
  )
}

function CapacityTab({ data }) {
  const rows = data || []
  if (!rows.length) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No work centers configured yet</div>
  return (
    <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{background:'#FAF8FA'}}>
          {['Work Center','Available Hrs','Consumed Hrs','Utilization','Status'].map(h=>(
            <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.wcId} style={{borderTop:'1px solid #F0EBF0'}}>
              <td style={{padding:'8px 12px',fontWeight:700}}>{r.wcId} — {r.name}</td>
              <td style={{padding:'8px 12px'}}>{r.availableHrs} hrs</td>
              <td style={{padding:'8px 12px'}}>{r.consumedHrs} hrs</td>
              <td style={{padding:'8px 12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:80,height:8,background:'#F0EEF0',borderRadius:4,overflow:'hidden'}}>
                    <div style={{width:`${Math.min(r.utilPct,100)}%`,height:'100%',
                      background:r.utilPct>=85?'#1E8449':r.utilPct>=50?'#B8860B':'#C0392B'}}/>
                  </div>
                  <span style={{fontWeight:700}}>{r.utilPct}%</span>
                </div>
              </td>
              <td style={{padding:'8px 12px'}}>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,fontWeight:700,
                  background:r.status==='High'?'#E8F5E9':r.status==='Idle'?'#FDEDEC':'#FEF9E7',
                  color:r.status==='High'?'#1E8449':r.status==='Idle'?'#C0392B':'#B8860B'}}>{r.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeliveryTab({ data }) {
  const { rows = [], onTime = 0, late = 0, total = 0, onTimePct = 0, avgDelay = 0 } = data || {}
  if (total === 0) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
    No completed Work Orders linked to a Sales Order with a delivery date in this period.
    <div style={{fontSize:11,marginTop:6}}>This measures against what was actually promised to the customer — Work Orders built for stock, with no linked Sales Order, aren't included since there's no customer promise to measure against.</div>
  </div>
  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16}}>
        <KpiCard label="On-Time Delivery" value={`${onTimePct}%`} sub={`${onTime} of ${total} orders — vs customer's promised date`} color={onTimePct>=85?'#1E8449':'#C0392B'} />
        <KpiCard label="Late Deliveries" value={late} color={late>0?'#C0392B':'#1E8449'} />
        <KpiCard label="Avg Delay (late orders)" value={late>0?`${avgDelay} days`:'—'} color="#B8860B" />
      </div>
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#FAF8FA'}}>
            {['WO','SO','Customer','Product','Promised','Delivered','Variance','Status'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.woNo} style={{borderTop:'1px solid #F0EBF0'}}>
                <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{r.woNo}</td>
                <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#888'}}>{r.soNo}</td>
                <td style={{padding:'8px 12px'}}>{r.customerName || '—'}</td>
                <td style={{padding:'8px 12px'}}>{r.itemName}</td>
                <td style={{padding:'8px 12px'}}>{new Date(r.promisedDate).toLocaleDateString('en-IN')}</td>
                <td style={{padding:'8px 12px'}}>{new Date(r.actualEnd).toLocaleDateString('en-IN')}</td>
                <td style={{padding:'8px 12px',color:r.daysVariance>0?'#C0392B':'#1E8449'}}>
                  {r.daysVariance<=0 ? (r.daysVariance===0?'On time':`${Math.abs(r.daysVariance)}d early`) : `+${r.daysVariance}d late`}
                </td>
                <td style={{padding:'8px 12px'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,fontWeight:700,
                    background:r.status==='Late'?'#FDEDEC':'#E8F5E9',
                    color:r.status==='Late'?'#C0392B':'#1E8449'}}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WOReportTab({ data }) {
  const rows = data || []
  if (!rows.length) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No Work Orders in this period</div>
  return (
    <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{background:'#FAF8FA'}}>
          {['WO No','Customer','Product','Planned','Produced','Balance','Start','End','Total Hrs','Status'].map(h=>(
            <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.woNo} style={{borderTop:'1px solid #F0EBF0'}}>
              <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{r.woNo}</td>
              <td style={{padding:'8px 12px'}}>{r.customerName}</td>
              <td style={{padding:'8px 12px'}}>{r.itemName}</td>
              <td style={{padding:'8px 12px'}}>{fmtN(r.planned)} {r.uom}</td>
              <td style={{padding:'8px 12px',fontWeight:700,color:'#1E8449'}}>{fmtN(r.produced)}</td>
              <td style={{padding:'8px 12px',color:r.balance>0?'#B8860B':'#888'}}>{fmtN(r.balance)}</td>
              <td style={{padding:'8px 12px',fontSize:11,color:'#888'}}>{r.actualStart?new Date(r.actualStart).toLocaleDateString('en-IN'):'—'}</td>
              <td style={{padding:'8px 12px',fontSize:11,color:'#888'}}>{r.actualEnd?new Date(r.actualEnd).toLocaleDateString('en-IN'):'—'}</td>
              <td style={{padding:'8px 12px'}}>{r.totalHrs!=null?`${r.totalHrs}h`:'—'}</td>
              <td style={{padding:'8px 12px'}}><span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'#F0EBF0',color:'#714B67',fontWeight:700}}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ShiftTab({ data }) {
  const rows = data || []
  if (!rows.length) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No Production Entries logged in this period</div>
  return (
    <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{background:'#FAF8FA'}}>
          {['Shift','Planned Qty','Actual Qty','Efficiency','Entries'].map(h=>(
            <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.shift} style={{borderTop:'1px solid #F0EBF0'}}>
              <td style={{padding:'8px 12px',fontWeight:700}}>Shift {r.shift}</td>
              <td style={{padding:'8px 12px'}}>{fmtN(r.planned)}</td>
              <td style={{padding:'8px 12px',fontWeight:700,color:'#1E8449'}}>{fmtN(r.actual)}</td>
              <td style={{padding:'8px 12px',fontWeight:700,color:r.efficiency>=85?'#1E8449':r.efficiency>=60?'#B8860B':'#C0392B'}}>{r.efficiency}%</td>
              <td style={{padding:'8px 12px',color:'#888'}}>{r.entries}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OperatorTab({ data }) {
  const rows = data || []
  if (!rows.length) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No Production Entries with an operator logged in this period</div>
  return (
    <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
        <thead><tr style={{background:'#FAF8FA'}}>
          {['Employee','Qty Produced','Hours','Productivity/Hr'].map(h=>(
            <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.operator} style={{borderTop:'1px solid #F0EBF0'}}>
              <td style={{padding:'8px 12px',fontWeight:700}}>{r.operator}</td>
              <td style={{padding:'8px 12px',color:'#1E8449',fontWeight:700}}>{fmtN(r.qtyProduced)}</td>
              <td style={{padding:'8px 12px'}}>{r.hours}h</td>
              <td style={{padding:'8px 12px',fontWeight:700,color:'#714B67'}}>{fmtN(r.productivityPerHr)}/hr</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CostTab({ data }) {
  const { rows = [], totals = {material:0,labour:0,electricity:0,consumables:0,overhead:0,total:0} } = data || {}
  if (!rows.length) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No Work Orders in this period</div>
  return (
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        <KpiCard label="Material Cost" value={`₹${fmtN(totals.material)}`} color="#1A5276" />
        <KpiCard label="Labour Cost" value={`₹${fmtN(totals.labour)}`} color="#B8860B" />
        <KpiCard label="Electricity Cost" value={`₹${fmtN(totals.electricity)}`} color="#D68910" />
        <KpiCard label="Consumables Cost" value={`₹${fmtN(totals.consumables)}`} color="#8E44AD" />
        <KpiCard label="Overhead Cost" value={`₹${fmtN(totals.overhead)}`} color="#714B67" />
        <KpiCard label="Total Cost" value={`₹${fmtN(totals.total)}`} color="#1E8449" />
      </div>
      <div style={{fontSize:11,color:'#1E8449',background:'#E8F5E9',padding:'8px 12px',borderRadius:6,marginBottom:12}}>
        ✓ Electricity and Consumables are now real, rate-based costs — set per work center under Work Center Master (Power Rate / Consumables Rate), not estimated.
      </div>
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#FAF8FA'}}>
            {['WO','Product','Material','Labour','Electricity','Consumables','Overhead','Total','Cost/Piece'].map(h=>(
              <th key={h} style={{padding:'8px 12px',textAlign:'left'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.woNo} style={{borderTop:'1px solid #F0EBF0'}}>
                <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{r.woNo}</td>
                <td style={{padding:'8px 12px'}}>{r.itemName}</td>
                <td style={{padding:'8px 12px'}}>₹{fmtN(r.material)}</td>
                <td style={{padding:'8px 12px'}}>₹{fmtN(r.labour)}</td>
                <td style={{padding:'8px 12px'}}>₹{fmtN(r.electricity)}</td>
                <td style={{padding:'8px 12px'}}>₹{fmtN(r.consumables)}</td>
                <td style={{padding:'8px 12px'}}>₹{fmtN(r.overhead)}</td>
                <td style={{padding:'8px 12px',fontWeight:700,color:'#1E8449'}}>₹{fmtN(r.total)}</td>
                <td style={{padding:'8px 12px'}}>₹{r.costPerPiece}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ScrapTab({ data }) {
  const { totalRejected = 0, byReason = [], byProduct = [] } = data || {}
  if (!totalRejected) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No rejections logged in this period — genuinely good news, or Production Entries haven't been logged yet</div>
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
        <div style={{fontWeight:700,color:'#714B67',marginBottom:12}}>By Reason ({fmtN(totalRejected)} total rejected)</div>
        {byReason.map(r=>(
          <div key={r.reason} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:12}}>
              <span>{r.reason}</span><span style={{fontWeight:700}}>{fmtN(r.qty)} ({r.pct}%)</span>
            </div>
            <div style={{height:8,background:'#F0EEF0',borderRadius:4,overflow:'hidden'}}>
              <div style={{width:`${r.pct}%`,height:'100%',background:'#C0392B'}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
        <div style={{fontWeight:700,color:'#714B67',marginBottom:12}}>By Product</div>
        {byProduct.map(r=>(
          <div key={r.product} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:12}}>
              <span>{r.product}</span><span style={{fontWeight:700}}>{fmtN(r.qty)} ({r.pct}%)</span>
            </div>
            <div style={{height:8,background:'#F0EEF0',borderRadius:4,overflow:'hidden'}}>
              <div style={{width:`${r.pct}%`,height:'100%',background:'#B8860B'}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
