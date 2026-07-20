import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const REF_STYLE = {
  SUBCONTRACT_OUT:    { bg:'#FFF3CD', color:'#856404', label:'Sent Out',       icon:'📤' },
  SUBCONTRACT_RETURN: { bg:'#F8D7DA', color:'#721C24', label:'Unproc. Return', icon:'↩️' },
  SUBCONTRACT_GR:      { bg:'#D4EDDA', color:'#155724', label:'Processed Return', icon:'📥' },
}

export default function SubcontractList() {
  const nav = useNavigate()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      // Movement endpoint filters by a single refType — pull all three
      // subcontract-related types in parallel rather than fetching the
      // whole unfiltered log (which caps at 1000 rows and could push
      // older subcontract entries out on a busy system).
      const types = ['SUBCONTRACT_OUT','SUBCONTRACT_RETURN','SUBCONTRACT_GR']
      const results = await Promise.all(types.map(t =>
        fetch(`${BASE_URL}/wm/movement?refType=${t}`,
          { headers:{ Authorization:`Bearer ${getToken()}` }})
          .then(r=>r.json()).then(d=>d.data||[]).catch(()=>[])
      ))
      setRows(results.flat().sort((a,b)=>new Date(b.transDate)-new Date(a.transDate)))
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ fetch_() },[fetch_])

  // ── Outstanding-at-vendor summary — grouped by item + vendor.
  // Sent (OUT) minus Unprocessed Returns minus Processed Receipts (GR)
  // = what's still physically sitting at the vendor right now.
  const summary = {}
  for (const m of rows) {
    const key = `${m.itemCode||m.itemName}__${m.vendorName||'—'}`
    if (!summary[key]) summary[key] = {
      itemCode:m.itemCode, itemName:m.itemName, vendorName:m.vendorName||'—',
      uom:m.uom, sent:0, returned:0, received:0,
    }
    const qty = parseFloat(m.qty||0)
    if (m.refType==='SUBCONTRACT_OUT')    summary[key].sent     += qty
    if (m.refType==='SUBCONTRACT_RETURN') summary[key].returned += qty
    if (m.refType==='SUBCONTRACT_GR')     summary[key].received += qty
  }
  const summaryRows = Object.values(summary).map(s => ({
    ...s, outstanding: Math.max(0, s.sent - s.returned - s.received)
  }))

  const filtered = rows.filter(m =>
    !search ||
    m.refNo?.toLowerCase().includes(search.toLowerCase()) ||
    m.itemName?.toLowerCase().includes(search.toLowerCase()) ||
    m.vendorName?.toLowerCase().includes(search.toLowerCase()))

  const totalOutstanding = summaryRows.reduce((a,s)=>a+s.outstanding,0)
  const vendorsEngaged = new Set(summaryRows.map(s=>s.vendorName)).size
  const closedLines = summaryRows.filter(s=>s.outstanding===0 && s.sent>0).length

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Subcontracting <small>Outside Processing · Material Out/In Tracker</small>
        </div>
        <div className="lv-acts">
          <input placeholder="Search doc, item, vendor..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12, width:180 }} />
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/wm/subcontract/new')}>
            + Send Out / Return
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          { l:'Lines Currently At Vendor', v:summaryRows.filter(s=>s.outstanding>0).length, c:'#856404', bg:'#FFF3CD' },
          { l:'Total Outstanding Qty',     v:totalOutstanding.toFixed(2), c:'#856404', bg:'#FFF3CD' },
          { l:'Vendors Engaged',           v:vendorsEngaged, c:'#714B67', bg:'#EDE0EA' },
          { l:'Closed Lines',              v:closedLines, c:'#155724', bg:'#D4EDDA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg, borderRadius:8, padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c, fontWeight:700, textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c, fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : (
      <>
        {/* Outstanding-at-vendor summary */}
        <div style={{ fontSize:13, fontWeight:700, color:'#714B67', margin:'4px 0 8px' }}>
          Outstanding at Vendor
        </div>
        {summaryRows.length===0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#6C757D',
            background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0', marginBottom:20 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🔧</div>
            <div style={{ fontWeight:700 }}>No subcontract activity yet</div>
            <button className="btn btn-p sd-bsm" style={{ marginTop:12 }}
              onClick={()=>nav('/wm/subcontract/new')}>+ Send Material Out</button>
          </div>
        ) : (
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:24 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['Item','Vendor','Sent','Returned','Received','Outstanding','Status'].map(h=>(
                    <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                      color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((s,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>
                      {s.itemCode?`${s.itemCode} — `:''}{s.itemName}
                    </td>
                    <td style={{ padding:'8px 10px' }}>{s.vendorName}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{s.sent.toFixed(2)} {s.uom}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{s.returned.toFixed(2)}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{s.received.toFixed(2)}</td>
                    <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace', fontWeight:700,
                      color:s.outstanding>0?'#856404':'#155724' }}>{s.outstanding.toFixed(2)}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'3px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                        background:s.outstanding>0?'#FFF3CD':'#D4EDDA',
                        color:s.outstanding>0?'#856404':'#155724' }}>
                        {s.outstanding>0?'At Vendor':'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transaction history */}
        <div style={{ fontSize:13, fontWeight:700, color:'#714B67', margin:'4px 0 8px' }}>
          Transaction History
        </div>
        {filtered.length===0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#6C757D',
            background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>No transactions</div>
        ) : (
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['Type','Ref No.','Item','Vendor','Qty','Date','Remarks'].map(h=>(
                    <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                      color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m,i)=>{
                  const st = REF_STYLE[m.refType]||{ bg:'#E9ECEF', color:'#6C757D', label:m.refType, icon:'•' }
                  return (
                    <tr key={m.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'8px 10px' }}>
                        <span style={{ padding:'3px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                          background:st.bg, color:st.color }}>{st.icon} {st.label}</span>
                      </td>
                      <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace', color:'#714B67' }}>{m.refNo}</td>
                      <td style={{ padding:'8px 10px', fontWeight:600 }}>{m.itemCode?`${m.itemCode} — `:''}{m.itemName}</td>
                      <td style={{ padding:'8px 10px' }}>{m.vendorName||'—'}</td>
                      <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{parseFloat(m.qty).toFixed(2)} {m.uom}</td>
                      <td style={{ padding:'8px 10px', fontSize:11, color:'#6C757D' }}>{new Date(m.transDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding:'8px 10px', fontSize:11, color:'#6C757D' }}>{m.remarks||'—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
      )}
    </div>
  )
}
