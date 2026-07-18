import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerPortalServiceWorker, registerPortalManifest } from './portalPwa'

const BASE = import.meta.env.VITE_API_URL || '/api'
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN')
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const fmtDT = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'
const DAYS = ['','Mon','Tue','Wed','Thu','Fri','Sat']

const STATUS_STYLE = {
  PENDING: { bg:'#FDEDEC', color:'#C0392B' }, PARTIAL: { bg:'#FEF9E7', color:'#B8860B' },
  PAID:    { bg:'#E8F5E9', color:'#1E8449' }, WAIVED:  { bg:'#F0F0F0', color:'#888' },
}

const TABS = [
  { key:'fees',       label:'💰 Fees' },
  { key:'timetable',  label:'📅 Timetable' },
  { key:'notices',    label:'📢 Notices' },
  { key:'attendance', label:'✅ Attendance' },
  { key:'transport',  label:'🚌 Transport' },
  { key:'library',    label:'📚 Library' },
]

function authHeader() {
  return { Authorization:`Bearer ${localStorage.getItem('portal_token')}` }
}

export default function PortalFees() {
  const nav = useNavigate()
  const [children,   setChildren]   = useState([])
  const [selChildId, setSelChildId] = useState(localStorage.getItem('portal_selected_child') || '')
  const [tab,        setTab]        = useState('fees')
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const requestIdRef = React.useRef(0)

  useEffect(() => { registerPortalServiceWorker(); return registerPortalManifest() }, [])

  useEffect(() => {
    const token = localStorage.getItem('portal_token')
    if (!token) { nav('/portal/login'); return }
    const stored = JSON.parse(localStorage.getItem('portal_children') || '[]')
    setChildren(stored)
    if (!selChildId && stored[0]) setSelChildId(String(stored[0].id))
  }, [nav])

  useEffect(() => {
    if (!selChildId) return
    localStorage.setItem('portal_selected_child', selChildId)
    loadTab()
  }, [selChildId, tab])

  const loadTab = async () => {
    // If the user switches tabs again before this request finishes, a stale
    // response for the OLD tab (e.g. Timetable's array shape) must never be
    // applied while a DIFFERENT tab (e.g. Attendance, expecting {records:[]})
    // is now selected — that's exactly what caused the "reading 'slice' of
    // undefined" crash. Each request gets an id; only the most recent one's
    // response is ever allowed to call setData/setError.
    const myRequestId = ++requestIdRef.current
    setLoading(true); setError(null); setData(null)
    try {
      const endpoint = { fees:'fee-status', timetable:'timetable', notices:'notices',
        attendance:'attendance', transport:'transport', library:'library' }[tab]
      const r = await fetch(`${BASE}/portal/${endpoint}?studentId=${selChildId}`, { headers:authHeader() })
      const d = await r.json()
      if (myRequestId !== requestIdRef.current) return // a newer tab switch has already happened — discard
      if (d.error) { setError(d.error); return }
      setData(d.data)
    } catch {
      if (myRequestId === requestIdRef.current) setError('Could not load — check your connection')
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_children')
    localStorage.removeItem('portal_selected_child')
    nav('/portal/login')
  }

  const selChild = children.find(c => String(c.id) === selChildId)

  return (
    <div style={{minHeight:'100vh',background:'#FAF8FA',fontFamily:'DM Sans,sans-serif',paddingBottom:30}}>
      <div style={{background:'#6E2C00',color:'#fff',padding:'16px 16px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>🎓 Parent Portal</div>
          <button onClick={logout} style={{padding:'6px 14px',background:'rgba(255,255,255,0.15)',
            color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700}}>Logout</button>
        </div>

        {/* Child switcher — only shows as tabs if more than one child */}
        {children.length > 1 ? (
          <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:12}}>
            {children.map(c => (
              <button key={c.id} onClick={()=>setSelChildId(String(c.id))}
                style={{padding:'8px 14px',borderRadius:'8px 8px 0 0',border:'none',cursor:'pointer',
                  whiteSpace:'nowrap',fontSize:12,fontWeight:700,
                  background:String(c.id)===selChildId?'#FAF8FA':'rgba(255,255,255,0.15)',
                  color:String(c.id)===selChildId?'#6E2C00':'#fff'}}>
                {c.name.split(' ')[0]} {c.className ? `· ${c.className}${c.sectionName?'-'+c.sectionName:''}` : ''}
              </button>
            ))}
          </div>
        ) : (
          <div style={{paddingBottom:12,fontSize:13,opacity:0.9}}>
            {selChild?.name} — {selChild?.admissionNo}
          </div>
        )}
      </div>

      <div style={{maxWidth:520,margin:'0 auto',padding:16}}>
        {/* Tab bar */}
        <div style={{display:'flex',gap:4,overflowX:'auto',marginBottom:14,background:'#fff',
          borderRadius:10,padding:6,boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{flex:'1 0 auto',padding:'8px 10px',border:'none',borderRadius:7,cursor:'pointer',
                fontSize:11,fontWeight:700,whiteSpace:'nowrap',
                background:tab===t.key?'#6E2C00':'transparent',color:tab===t.key?'#fff':'#888'}}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>}
        {error && !loading && (
          <div style={{textAlign:'center',padding:30,background:'#fff',borderRadius:12,color:'#C0392B',fontSize:13}}>{error}</div>
        )}

        {!loading && !error && data && tab === 'fees' && <FeesTab data={data} />}
        {!loading && !error && data && tab === 'timetable' && <TimetableTab data={data} />}
        {!loading && !error && data && tab === 'notices' && <NoticesTab data={data} />}
        {!loading && !error && data && tab === 'attendance' && <AttendanceTab data={data} />}
        {!loading && !error && tab === 'transport' && <TransportTab data={data} />}
        {!loading && !error && data && tab === 'library' && <LibraryTab data={data} />}
      </div>
    </div>
  )
}

function Card({ children }) {
  return <div style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 6px rgba(0,0,0,.06)',marginBottom:14}}>{children}</div>
}

function FeesTab({ data }) {
  const demands = data?.demands || []
  const totals = data?.totals || { totalDemand:0, totalPaid:0, totalDue:0 }
  const student = data?.student
  const institution = data?.institution

  const printReceipt = (txn, demand) => {
    const html = `<!DOCTYPE html><html><head><title>Receipt ${txn.receiptNo}</title>
<style>
  body{font-family:Arial,sans-serif;margin:24px;font-size:12px;color:#333}
  .header{text-align:center;border-bottom:3px solid #6E2C00;padding-bottom:12px;margin-bottom:20px}
  .inst-name{font-size:18px;font-weight:900;color:#6E2C00}
  .inst-sub{font-size:11px;color:#888;margin-top:2px}
  .title{font-size:15px;font-weight:800;color:#333;margin-top:10px;text-decoration:underline}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
  .info-box{border:1px solid #ddd;border-radius:5px;padding:10px}
  .info-box label{font-size:9px;color:#888;text-transform:uppercase;font-weight:700;display:block;margin-bottom:3px}
  .info-box span{font-size:13px;font-weight:700;color:#333}
  .amount-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
  .net-row{display:flex;justify-content:space-between;padding:10px 12px;background:#E8F5E9;border-radius:6px;margin-top:6px}
  .sign-box{margin-top:40px;text-align:right;font-size:11px}
  .footer{text-align:center;margin-top:20px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
  @media print{.no-print{display:none}}
</style></head><body>
<div class="no-print" style="margin-bottom:12px">
  <button onclick="window.print()" style="padding:7px 16px;background:#6E2C00;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700">🖨️ Print / Save PDF</button>
  <button onclick="window.close()" style="padding:7px 16px;background:#f0f0f0;border:none;border-radius:4px;cursor:pointer;margin-left:8px">✕ Close</button>
</div>
<div class="header">
  <div class="inst-name">${institution?.name || 'LNV Educational Institution'}</div>
  <div class="inst-sub">${[institution?.address, institution?.city].filter(Boolean).join(', ')}${institution?.phone ? ' · '+institution.phone : ''}</div>
  <div class="title">FEE RECEIPT</div>
</div>
<div class="info-grid">
  <div class="info-box"><label>Receipt No.</label><span>${txn.receiptNo}</span></div>
  <div class="info-box"><label>Date</label><span>${fmtD(txn.paymentDate)}</span></div>
  <div class="info-box"><label>Student Name</label><span>${student?.name||'—'}</span></div>
  <div class="info-box"><label>Admission No.</label><span>${student?.admissionNo||'—'}</span></div>
  <div class="info-box"><label>Class / Section</label><span>${student?.className||'—'} ${student?.sectionName?'- '+student.sectionName:''}</span></div>
  <div class="info-box"><label>Payment Mode</label><span>${txn.paymentMode}${txn.transactionRef?' ('+txn.transactionRef+')':''}</span></div>
</div>
<div style="max-width:420px">
  <div class="amount-row"><span>${demand?.feeTypeName || 'Fee'} Amount</span><strong>${fmtC(txn.amount)}</strong></div>
  ${Number(txn.lateFee)>0 ? `<div class="amount-row"><span>Late Fee</span><strong style="color:#C0392B">${fmtC(txn.lateFee)}</strong></div>` : ''}
  <div class="net-row"><strong style="font-size:14px;color:#1E8449">TOTAL PAID</strong><strong style="font-size:18px;color:#1E8449">${fmtC(txn.totalPaid)}</strong></div>
</div>
${txn.remarks ? `<div style="margin-top:14px;font-size:11px;color:#888">Remarks: ${txn.remarks}</div>` : ''}
<div class="sign-box">Collected By: ${txn.collectedBy || '—'}<br/><br/>Authorized Signatory</div>
<div class="footer">This is a system-generated receipt. Generated: ${new Date().toLocaleDateString('en-IN')}</div>
</body></html>`
    const w = window.open('', '_blank', 'width=700,height=650')
    w.document.write(html); w.document.close()
  }
  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
        <div style={{background:'#fff',borderRadius:10,padding:'12px 8px',textAlign:'center',boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:10,color:'#888',fontWeight:700}}>TOTAL FEES</div>
          <div style={{fontSize:15,fontWeight:800}}>{fmtC(totals.totalDemand)}</div>
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:'12px 8px',textAlign:'center',boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:10,color:'#1E8449',fontWeight:700}}>PAID</div>
          <div style={{fontSize:15,fontWeight:800,color:'#1E8449'}}>{fmtC(totals.totalPaid)}</div>
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:'12px 8px',textAlign:'center',boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
          <div style={{fontSize:10,color:totals.totalDue>0?'#C0392B':'#888',fontWeight:700}}>DUE</div>
          <div style={{fontSize:15,fontWeight:800,color:totals.totalDue>0?'#C0392B':'#888'}}>{fmtC(totals.totalDue)}</div>
        </div>
      </div>
      <Card>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Fee Details</div>
        {demands.length===0 ? <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:13}}>No fee records found</div> : demands.map(d => {
          const s = STATUS_STYLE[d.status] || STATUS_STYLE.PENDING
          return (
            <div key={d.id} style={{padding:'12px 0',borderBottom:'1px solid #F5F0F2'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>{d.feeTypeName}</div>
                  <div style={{fontSize:11,color:'#888'}}>Due: {fmtD(d.dueDate)}</div>
                </div>
                <div style={{padding:'3px 10px',borderRadius:12,background:s.bg,color:s.color,fontSize:10,fontWeight:700}}>{d.status}</div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:12}}>
                <span style={{color:'#888'}}>Amount: {fmtC(d.netAmount)}</span>
                <span style={{color:'#1E8449'}}>Paid: {fmtC(d.paidAmount)}</span>
                {Number(d.balanceAmount)>0 && <span style={{color:'#C0392B',fontWeight:700}}>Due: {fmtC(d.balanceAmount)}</span>}
              </div>
              {(d.transactions||[]).length > 0 && (
                <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed #E8E0E8'}}>
                  {d.transactions.map(txn => (
                    <div key={txn.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',fontSize:11}}>
                      <div>
                        <span style={{color:'#888'}}>{fmtD(txn.paymentDate)}</span>
                        <span style={{marginLeft:8,fontFamily:'monospace',color:'#6E2C00'}}>{txn.receiptNo}</span>
                        <span style={{marginLeft:8,fontWeight:700}}>{fmtC(txn.totalPaid)}</span>
                      </div>
                      <button onClick={()=>printReceipt(txn, d)}
                        style={{padding:'3px 10px',background:'#EBF5FB',color:'#1A5276',border:'none',
                          borderRadius:5,cursor:'pointer',fontSize:10,fontWeight:700}}>
                        🧾 Receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </Card>
      <div style={{textAlign:'center',fontSize:11,color:'#aaa'}}>💳 Online payment is coming soon. For now, please pay fees at the college office.</div>
    </>
  )
}

function TimetableTab({ data }) {
  const periods = Array.isArray(data) ? data : []
  const byDay = {}
  periods.forEach(p => { if (!byDay[p.dayOfWeek]) byDay[p.dayOfWeek] = []; byDay[p.dayOfWeek].push(p) })
  const days = Object.keys(byDay).map(Number).sort((a,b)=>a-b)
  if (days.length === 0) return <Card><div style={{textAlign:'center',color:'#aaa',fontSize:13}}>No timetable available yet</div></Card>
  return days.map(d => (
    <Card key={d}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:'#6E2C00'}}>{DAYS[d]}</div>
      {byDay[d].sort((a,b)=>a.periodNo-b.periodNo).map(p => (
        <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F5F0F2',fontSize:12}}>
          <div>
            <span style={{fontWeight:700,marginRight:8}}>P{p.periodNo}</span>
            {p.periodType==='REGULAR' ? (p.subjectName||'—') : p.periodType}
          </div>
          <div style={{color:'#888',fontSize:11}}>{p.startTime}–{p.endTime}{p.staff?.name?` · ${p.staff.name}`:''}</div>
        </div>
      ))}
    </Card>
  ))
}

function NoticesTab({ data }) {
  const notices = Array.isArray(data) ? data : []
  if (notices.length===0) return <Card><div style={{textAlign:'center',color:'#aaa',fontSize:13}}>No notices right now</div></Card>
  return notices.map(n => {
    const isConcern = n.type === 'CONCERN'
    return (
      <div key={n.id} style={{background:isConcern?'#FEF5F4':'#fff',borderRadius:12,padding:16,
        boxShadow:'0 1px 6px rgba(0,0,0,.06)',marginBottom:14,
        border:isConcern?'1.5px solid #F1948A':'none'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <div style={{fontSize:13,fontWeight:700,color:isConcern?'#C0392B':'#333'}}>
            {isConcern ? '⚠️ ' : ''}{n.title}
          </div>
          <div style={{fontSize:10,color:'#888'}}>{fmtDT(n.publishDate)}</div>
        </div>
        <div style={{fontSize:12,color:isConcern?'#943126':'#555',lineHeight:1.5}}>{n.content}</div>
      </div>
    )
  })
}

function AttendanceTab({ data }) {
  const records = data?.records || []
  const pctColor = data?.percentage>=90?'#1E8449':data?.percentage>=75?'#B8860B':'#C0392B'
  return (
    <>
      <Card>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:36,fontWeight:900,color:data?.percentage!=null?pctColor:'#888'}}>
            {data?.percentage!=null ? `${data.percentage}%` : '—'}
          </div>
          <div style={{fontSize:12,color:'#888'}}>{data?.presentDays||0} of {data?.totalDays||0} days present (last {data?.totalDays||0} records)</div>
        </div>
      </Card>
      <Card>
        <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Recent Days</div>
        {records.length===0 ? <div style={{textAlign:'center',color:'#aaa',fontSize:12}}>No attendance records yet</div> : records.slice(0,15).map(r => (
          <div key={r.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F5F0F2',fontSize:12}}>
            <span>{fmtD(r.date)}</span>
            <span style={{fontWeight:700,color:r.status==='PRESENT'?'#1E8449':'#C0392B'}}>{r.status}</span>
          </div>
        ))}
      </Card>
    </>
  )
}

function TransportTab({ data }) {
  if (!data) return <Card><div style={{textAlign:'center',color:'#aaa',fontSize:13}}>No bus route assigned</div></Card>
  return (
    <Card>
      <div style={{fontSize:14,fontWeight:800,color:'#6E2C00',marginBottom:4}}>🚌 {data.routeName}</div>
      <div style={{fontSize:11,color:'#888',marginBottom:12}}>{data.routeNo}{data.vehicleNo?` · ${data.vehicleNo}`:''}</div>
      {data.myStop && (
        <div style={{background:'#FAF8FA',borderRadius:8,padding:12,marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700}}>📍 {data.myStop.stopName}</div>
          <div style={{fontSize:11,color:'#888',marginTop:4}}>Pickup: {data.myStop.pickupTime||'—'} · Drop: {data.myStop.dropTime||'—'}</div>
        </div>
      )}
      <div style={{fontSize:11,color:'#888'}}>Route timing: Morning {data.morningStart||'—'} · Afternoon {data.afternoonStart||'—'}</div>
    </Card>
  )
}

function LibraryTab({ data }) {
  if (!data) return <Card><div style={{textAlign:'center',color:'#aaa',fontSize:13}}>No library card issued yet</div></Card>
  const current = data.current || []
  return (
    <>
      <Card>
        <div style={{fontSize:12,color:'#888'}}>Card No: <b>{data.cardNo}</b> · Limit: {data.issueLimit} books</div>
      </Card>
      <Card>
        <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Currently Issued</div>
        {current.length===0 ? <div style={{textAlign:'center',color:'#aaa',fontSize:12}}>No books currently issued</div> : current.map(i => (
          <div key={i.id} style={{padding:'8px 0',borderBottom:'1px solid #F5F0F2'}}>
            <div style={{fontSize:12,fontWeight:700}}>{i.book.title}</div>
            <div style={{fontSize:11,color:i.status==='OVERDUE'?'#C0392B':'#888'}}>Due: {fmtD(i.dueDate)} {i.status==='OVERDUE' ? '· Overdue' : ''}</div>
          </div>
        ))}
      </Card>
    </>
  )
}
