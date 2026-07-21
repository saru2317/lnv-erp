import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

export default function DCReconciliation() {
  const [tab, setTab] = useState('labour') // 'labour' | 'joborder'
  const [labourRows, setLabourRows] = useState([])
  const [joRows, setJoRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lr, jr] = await Promise.all([
        fetch(`${BASE_URL}/wm/reports/labour-dc-reconciliation`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE_URL}/wm/reports/job-order-dc-reconciliation`, { headers:hdr2() }).then(r=>r.json()),
      ])
      setLabourRows(lr.data||[])
      setJoRows(jr.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ load() },[load])

  const filtLabour = labourRows.filter(r=>!search ||
    r.loNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    r.itemName?.toLowerCase().includes(search.toLowerCase()))

  const filtJo = joRows.filter(r=>!search ||
    r.jcNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    r.itemName?.toLowerCase().includes(search.toLowerCase()))

  const labourPendingCount = labourRows.filter(r=>r.pendingQty>0.001).length
  const joFlaggedCount = joRows.filter(r=>r.flagged).length
  const joUnbalanced = joRows.filter(r=>Math.abs(r.balanceQty)>0.001).length

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>DC Reconciliation</div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            {tab==='labour' ? 'Commercial side — agreed (Labour Order) vs actually dispatched' : 'Production side — received vs consumed vs dispatched, per Job Card'}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setTab('labour')}
            style={{padding:'7px 14px',background:tab==='labour'?'#714B67':'#fff',color:tab==='labour'?'#fff':'#6C757D',
              border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Labour DC</button>
          <button onClick={()=>setTab('joborder')}
            style={{padding:'7px 14px',background:tab==='joborder'?'#714B67':'#fff',color:tab==='joborder'?'#fff':'#6C757D',
              border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Job Order DC</button>
        </div>
      </div>

      {tab==='labour' ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
          {[
            { l:'Order Lines', v:labourRows.length, c:'#714B67', bg:'#EDE0EA' },
            { l:'Pending Dispatch', v:labourPendingCount, c:'#856404', bg:'#FFF3CD' },
            { l:'Fully Dispatched', v:labourRows.length-labourPendingCount, c:'#155724', bg:'#D4EDDA' },
          ].map(k=>(
            <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'10px 14px',border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
              <div style={{fontSize:15,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
              <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
          {[
            { l:'Job Cards', v:joRows.length, c:'#714B67', bg:'#EDE0EA' },
            { l:'Balance Unaccounted', v:joUnbalanced, c:'#856404', bg:'#FFF3CD' },
            { l:'Flagged (Dispatched but Short)', v:joFlaggedCount, c:'#721C24', bg:'#F8D7DA' },
          ].map(k=>(
            <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'10px 14px',border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
              <div style={{fontSize:15,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
              <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search order/job no, customer, item..."
          style={{padding:'7px 12px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none',width:260}} />
        <span style={{marginLeft:'auto',fontSize:11,color:'#6C757D'}}>
          {tab==='labour'?filtLabour.length:filtJo.length} of {tab==='labour'?labourRows.length:joRows.length} records
        </span>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>⏳ Loading...</div>
      ) : tab==='labour' ? (
        filtLabour.length===0 ? (
          <div style={{padding:40,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0'}}>No Labour Order lines yet.</div>
        ) : (
          <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead style={{background:'#F8F4F8'}}>
                <tr style={{borderBottom:'2px solid #E0D5E0'}}>
                  {['LO No','Customer','Item','Ordered','Dispatched','Pending','Job Cards','DCs','Status'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtLabour.map((r,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:'#714B67',fontWeight:600}}>{r.loNo}</td>
                    <td style={{padding:'8px 10px'}}>{r.customerName}</td>
                    <td style={{padding:'8px 10px',fontWeight:600}}>{r.itemCode?`${r.itemCode} — `:''}{r.itemName}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{r.orderedQty.toFixed(2)} {r.uom}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{r.dispatchedQty.toFixed(2)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',fontWeight:700,color:r.pendingQty>0.001?'#856404':'#155724'}}>{r.pendingQty.toFixed(2)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{r.jobCardCount}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{r.dcCount}</td>
                    <td style={{padding:'8px 10px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:r.pendingQty>0.001?'#FFF3CD':'#D4EDDA', color:r.pendingQty>0.001?'#856404':'#155724'}}>
                        {r.pendingQty>0.001?'Pending':'Complete'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        filtJo.length===0 ? (
          <div style={{padding:40,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0'}}>No Job Cards yet.</div>
        ) : (
          <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead style={{background:'#F8F4F8'}}>
                <tr style={{borderBottom:'2px solid #E0D5E0'}}>
                  {['JC No','Customer','Item','Received','Processed','Rejected','Dispatched','Balance','Status'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtJo.map((r,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #F0EEF0',background:r.flagged?'#FFF5F5':(i%2===0?'#fff':'#FDFBFD')}}>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:'#714B67',fontWeight:600}}>{r.jcNo}{r.flagged && ' ⚠️'}</td>
                    <td style={{padding:'8px 10px'}}>{r.customerName}</td>
                    <td style={{padding:'8px 10px',fontWeight:600}}>{r.itemCode?`${r.itemCode} — `:''}{r.itemName}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{r.receivedQty.toFixed(2)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{r.processedQty.toFixed(2)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:r.rejectedQty>0?'#DC3545':'inherit'}}>{r.rejectedQty.toFixed(2)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{r.dispatchedQty.toFixed(2)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',fontWeight:700,color:Math.abs(r.balanceQty)>0.001?'#856404':'#155724'}}>{r.balanceQty.toFixed(2)}</td>
                    <td style={{padding:'8px 10px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:r.flagged?'#F8D7DA':'#E9ECEF', color:r.flagged?'#721C24':'#6C757D'}}>
                        {r.status?.replace('_',' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <div style={{marginTop:12,fontSize:10,color:'#6C757D'}}>
        {tab==='labour'
          ? 'Pending = ordered qty not yet covered by any Job Work DC against a Job Card traced back to this order.'
          : '⚠️ flagged = Job Card marked DISPATCHED but received/dispatched quantities don\'t reconcile — worth checking before it\'s forgotten.'}
      </div>
    </div>
  )
}
