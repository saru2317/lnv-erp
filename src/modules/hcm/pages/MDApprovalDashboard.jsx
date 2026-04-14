import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const fmt  = n => Number(n||0).toLocaleString('en-IN')
const fmtC = n => '₹' + fmt(n)

const STATUS = {
  DRAFT:     { bg:'#F0EEF0', text:'#6C757D', icon:'✏️' },
  PENDING:   { bg:'#FFF3CD', text:'#856404', icon:'⏳' },
  APPROVED:  { bg:'#D1ECF1', text:'#0C5460', icon:'✅' },
  PROCESSED: { bg:'#D4EDDA', text:'#155724', icon:'🎉' },
  ARCHIVED:  { bg:'#E0E0E0', text:'#555',    icon:'📦' },
}

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4,
  textTransform:'uppercase', letterSpacing:.4 }

export default function MDApprovalDashboard() {
  const [policies,  setPolicies]  = useState([])
  const [selPolicy, setSelPolicy] = useState(null)
  const [proposals, setProposals] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [action,    setAction]    = useState(null) // {type: approve|reject|process}
  const [remarks,   setRemarks]   = useState('')
  const [processing,setProcessing]= useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/increment`, { headers:authHdrs() })
      const data = await res.json()
      if (res.ok) {
        setPolicies(data.data||[])
        // Auto-select first pending
        const pending = (data.data||[]).find(p=>p.status==='PENDING')
        setSelPolicy(pending || (data.data||[])[0])
      }
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchAll() }, [])

  // Fetch proposals when policy changes
  useEffect(()=>{
    if (!selPolicy) return
    fetch(`${BASE_URL}/increment/${selPolicy.id}/proposals`, { headers:authHdrs() })
      .then(r=>r.json()).then(d=>setProposals(d.data||[]))
  }, [selPolicy])

  const doAction = async () => {
    if (!selPolicy||!action) return
    if (action==='reject' && !remarks) return toast.error('Rejection reason required!')
    setProcessing(true)
    try {
      const res  = await fetch(`${BASE_URL}/increment/${selPolicy.id}/${action}`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify({ remarks }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setAction(null); setRemarks(''); fetchAll()
    } catch(e){ toast.error(e.message) } finally { setProcessing(false) }
  }

  // Summary calcs
  const totalCurrentCTC  = proposals.reduce((s,p)=>s+parseFloat(p.currentCTC||0),0)
  const totalNewCTC      = proposals.reduce((s,p)=>s+parseFloat(p.newCTC||0),0)
  const totalImpactMo    = totalNewCTC - totalCurrentCTC
  const totalImpactAnn   = totalImpactMo * 12
  const avgPct           = proposals.length > 0
    ? proposals.reduce((s,p)=>s+parseFloat(p.finalIncrementPct||0),0)/proposals.length : 0
  const overrideCount    = proposals.filter(p=>p.isOverridden).length
  const manualCount      = proposals.filter(p=>p.isManual).length

  // Grade-wise impact
  const gradeImpact = ['G1','G2','G3','G4','G5','G6','G7','G8'].map(g => {
    const gp = proposals.filter(p=>p.gradeCode===g)
    return { grade:g, count:gp.length,
      impact: gp.reduce((s,p)=>s+(parseFloat(p.newCTC)-parseFloat(p.currentCTC)),0),
      avgPct: gp.length>0?gp.reduce((s,p)=>s+parseFloat(p.finalIncrementPct||0),0)/gp.length:0 }
  }).filter(g=>g.count>0)

  const pendingPolicies  = policies.filter(p=>p.status==='PENDING')
  const approvedPolicies = policies.filter(p=>p.status==='APPROVED')

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            MD Approval Dashboard
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            Review increment proposals → Approve or Reject → Process to update CTCs
          </p>
        </div>
      </div>

      {/* Pending alerts */}
      {pendingPolicies.length > 0 && (
        <div style={{ background:'#FFF3CD', border:'1px solid #FFEEBA', borderRadius:8,
          padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>⏳</span>
          <div>
            <div style={{ fontWeight:700, color:'#856404', fontSize:13 }}>
              {pendingPolicies.length} Increment Policy pending your approval!
            </div>
            <div style={{ fontSize:11, color:'#856404', marginTop:2 }}>
              {pendingPolicies.map(p=>`${p.policyNo} — ${p.name}`).join(' | ')}
            </div>
          </div>
        </div>
      )}

      {approvedPolicies.length > 0 && (
        <div style={{ background:'#D1ECF1', border:'1px solid #BEE5EB', borderRadius:8,
          padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div>
            <div style={{ fontWeight:700, color:'#0C5460', fontSize:13 }}>
              {approvedPolicies.length} Policy approved — ready to process!
            </div>
            <div style={{ fontSize:11, color:'#0C5460', marginTop:2 }}>
              Click "Process Increments" to update all employee CTCs immediately.
            </div>
          </div>
        </div>
      )}

      {/* Policy selector */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        padding:14, marginBottom:16 }}>
        <label style={lbl}>Select Increment Policy</label>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {policies.map(p => {
            const sc = STATUS[p.status]||{}
            return (
              <div key={p.id} onClick={()=>setSelPolicy(p)}
                style={{ padding:'10px 16px', borderRadius:8, cursor:'pointer',
                  border: selPolicy?.id===p.id?'2px solid #714B67':'1px solid #E0D5E0',
                  background: selPolicy?.id===p.id?'#EDE0EA':'#fff',
                  minWidth:200 }}>
                <div style={{ fontFamily:'DM Mono,monospace', fontSize:11,
                  color:'#714B67', fontWeight:700 }}>{p.policyNo}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#1C1C1C', marginTop:2 }}>
                  {p.name}</div>
                <div style={{ display:'flex', gap:8, marginTop:6, alignItems:'center' }}>
                  <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
                    fontWeight:700, background:sc.bg, color:sc.text }}>
                    {sc.icon} {p.status}</span>
                  <span style={{ fontSize:11, color:'#6C757D' }}>{p.model}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selPolicy && proposals.length > 0 && (
        <>
          {/* MD Summary KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              { label:'Total Employees',    value:proposals.length,         color:'#714B67', bg:'#EDE0EA', big:true },
              { label:'Avg Increment',      value:avgPct.toFixed(1)+'%',    color:'#0C5460', bg:'#D1ECF1', big:false },
              { label:'Monthly CTC Impact', value:fmtC(totalImpactMo),     color:'#155724', bg:'#D4EDDA', big:false },
              { label:'Annual CTC Impact',  value:fmtC(totalImpactAnn),    color:'#856404', bg:'#FFF3CD', big:false },
            ].map(k=>(
              <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'14px 16px',
                border:`1px solid ${k.color}22` }}>
                <div style={{ fontSize:11, color:k.color, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
                <div style={{ fontSize:k.big?32:20, fontWeight:800, color:k.color,
                  fontFamily:'Syne,sans-serif', marginTop:4 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Grade-wise cost impact */}
          <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
            padding:16, marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:12 }}>
              📊 Grade-wise Cost Impact
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:`repeat(${gradeImpact.length},1fr)`, gap:10 }}>
              {gradeImpact.map(g=>(
                <div key={g.grade} style={{ background:'#F8F4F8', borderRadius:8,
                  padding:'10px 12px', border:'1px solid #E0D5E0', textAlign:'center' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#714B67',
                    fontFamily:'Syne,sans-serif' }}>{g.grade}</div>
                  <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
                    {g.count} employee{g.count>1?'s':''}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#155724', marginTop:4 }}>
                    {g.avgPct.toFixed(1)}% avg</div>
                  <div style={{ fontSize:11, color:'#0C5460', fontFamily:'DM Mono,monospace',
                    marginTop:2 }}>+{fmtC(g.impact)}/mo</div>
                </div>
              ))}
            </div>

            {/* Cost bar chart */}
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#6C757D',
                marginBottom:6, textTransform:'uppercase' }}>Monthly Impact Distribution</div>
              {gradeImpact.map(g=>{
                const pct = totalImpactMo > 0 ? (g.impact/totalImpactMo*100) : 0
                return (
                  <div key={g.grade} style={{ display:'flex', alignItems:'center',
                    gap:10, marginBottom:6 }}>
                    <span style={{ width:30, fontSize:11, fontWeight:700,
                      color:'#714B67', fontFamily:'DM Mono,monospace' }}>{g.grade}</span>
                    <div style={{ flex:1, background:'#F0EEF0', borderRadius:10, height:18,
                      overflow:'hidden', position:'relative' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background:'#714B67',
                        borderRadius:10, transition:'width .5s', minWidth: pct>0?4:0 }} />
                      <span style={{ position:'absolute', left:8, top:'50%',
                        transform:'translateY(-50%)', fontSize:10, color:'#fff',
                        fontWeight:700, display: pct>10?'block':'none' }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <span style={{ width:90, fontSize:11, fontFamily:'DM Mono,monospace',
                      color:'#155724', fontWeight:600, textAlign:'right' }}>
                      +{fmtC(g.impact)}/mo
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Before vs After */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              { label:'Current Total CTC/Month', value:fmtC(totalCurrentCTC), color:'#6C757D', bg:'#F0EEF0' },
              { label:'New Total CTC/Month',      value:fmtC(totalNewCTC),     color:'#155724', bg:'#D4EDDA' },
              { label:'Total Increment Cost/Month',value:'+'+fmtC(totalImpactMo), color:'#856404', bg:'#FFF3CD' },
            ].map(k=>(
              <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'14px 16px',
                border:`1px solid ${k.color}22`, textAlign:'center' }}>
                <div style={{ fontSize:11, color:k.color, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:k.color,
                  fontFamily:'Syne,sans-serif', marginTop:6 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Override summary */}
          {(overrideCount > 0 || manualCount > 0) && (
            <div style={{ background:'#fff', borderRadius:8, border:'1px solid #FFEEBA',
              padding:14, marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#856404', marginBottom:10 }}>
                ⚠️ Special Cases
              </div>
              <div style={{ display:'flex', gap:16 }}>
                {overrideCount > 0 && (
                  <div style={{ background:'#FFF3CD', padding:'8px 14px', borderRadius:6, fontSize:12 }}>
                    <span style={{ fontWeight:700, color:'#856404' }}>✏️ {overrideCount} Overridden</span>
                    <span style={{ color:'#6C757D', marginLeft:8 }}>
                      — HR manually changed increment %
                    </span>
                  </div>
                )}
                {manualCount > 0 && (
                  <div style={{ background:'#EDE0EA', padding:'8px 14px', borderRadius:6, fontSize:12 }}>
                    <span style={{ fontWeight:700, color:'#714B67' }}>📋 {manualCount} Manual</span>
                    <span style={{ color:'#6C757D', marginLeft:8 }}>
                      — G7/G8 MD decides individually
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Employee list compact */}
          <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
            overflow:'hidden', marginBottom:16 }}>
            <div style={{ padding:'10px 16px', background:'#F8F4F8',
              borderBottom:'1px solid #E0D5E0', fontWeight:700, fontSize:12, color:'#714B67' }}>
              📋 All Proposals — {proposals.length} Employees
            </div>
            <div style={{ maxHeight:280, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ position:'sticky', top:0, background:'#F8F4F8', zIndex:5 }}>
                  <tr style={{ borderBottom:'1px solid #E0D5E0' }}>
                    {['Employee','Grade','Incr %','Current CTC','New CTC','+Impact/Mo','Note'].map(h=>(
                      <th key={h} style={{ padding:'8px 12px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.3 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p,i)=>(
                    <tr key={p.empCode} style={{ borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'8px 12px' }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.empName}</div>
                        <div style={{ fontSize:10, color:'#6C757D',
                          fontFamily:'DM Mono,monospace' }}>{p.empCode}</div>
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                          fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                          {p.gradeCode}
                        </span>
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:800, fontSize:14,
                        color: p.isManual?'#856404':'#714B67',
                        fontFamily:'Syne,sans-serif' }}>
                        {p.isManual ? 'Manual' : `${parseFloat(p.finalIncrementPct).toFixed(1)}%`}
                      </td>
                      <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                        fontSize:12 }}>{fmtC(p.currentCTC)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                        fontSize:12, fontWeight:700 }}>{fmtC(p.newCTC)}</td>
                      <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                        fontSize:12, color:'#155724', fontWeight:600 }}>
                        {p.isManual ? '—' : '+'+fmtC(parseFloat(p.newCTC)-parseFloat(p.currentCTC))}
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        {p.isOverridden && (
                          <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
                            fontWeight:600, background:'#FFF3CD', color:'#856404' }}>
                            ✏️ Overridden
                          </span>
                        )}
                        {p.isManual && (
                          <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
                            fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                            📋 Manual
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MD Action buttons */}
          {selPolicy.status === 'PENDING' && (
            <div style={{ background:'#fff', borderRadius:8, border:'2px solid #714B67',
              padding:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#1C1C1C' }}>
                  MD Decision Required
                </div>
                <div style={{ fontSize:12, color:'#6C757D', marginTop:4 }}>
                  {proposals.length} employees | Avg {avgPct.toFixed(1)}% |
                  Annual cost impact: <strong style={{ color:'#155724' }}>{fmtC(totalImpactAnn)}</strong>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setAction('reject')}
                  style={{ padding:'10px 24px', background:'#fff', color:'#DC3545',
                    border:'2px solid #DC3545', borderRadius:6, fontSize:13,
                    fontWeight:700, cursor:'pointer' }}>
                  ❌ Reject
                </button>
                <button onClick={()=>setAction('approve')}
                  style={{ padding:'10px 24px', background:'#28A745', color:'#fff',
                    border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  ✅ Approve All
                </button>
              </div>
            </div>
          )}

          {selPolicy.status === 'APPROVED' && (
            <div style={{ background:'#D4EDDA', borderRadius:8, border:'2px solid #28A745',
              padding:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:'#155724' }}>
                  ✅ Approved — Ready to Process!
                </div>
                <div style={{ fontSize:12, color:'#155724', marginTop:4 }}>
                  Processing will update all {proposals.length} employee CTCs immediately.
                  Revision history will be saved. This cannot be undone.
                </div>
              </div>
              <button onClick={()=>setAction('process')}
                style={{ padding:'10px 28px', background:'#155724', color:'#fff',
                  border:'none', borderRadius:6, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                🚀 Process Increments Now
              </button>
            </div>
          )}

          {selPolicy.status === 'PROCESSED' && (
            <div style={{ background:'#D4EDDA', borderRadius:8, border:'1px solid #C3E6CB',
              padding:16, textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>🎉</div>
              <div style={{ fontWeight:700, fontSize:14, color:'#155724' }}>
                Increments Processed Successfully!
              </div>
              <div style={{ fontSize:12, color:'#155724', marginTop:4 }}>
                All {proposals.length} employee CTCs have been updated.
                Processed on: {selPolicy.processedAt
                  ? new Date(selPolicy.processedAt).toLocaleDateString('en-IN') : '—'}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {action && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:10000 }}>
          <div style={{ background:'#fff', borderRadius:10, width:500, overflow:'hidden',
            boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ padding:'14px 20px', display:'flex',
              justifyContent:'space-between', alignItems:'center',
              background: action==='reject'?'#DC3545':action==='process'?'#155724':'#28A745' }}>
              <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
                fontSize:15, fontWeight:700 }}>
                {action==='approve'?'✅ Approve Increment Policy':
                 action==='reject' ?'❌ Reject Policy':
                 '🚀 Process Increments'}
              </h3>
              <span onClick={()=>{setAction(null);setRemarks('')}}
                style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ background:'#F8F7FA', borderRadius:8, padding:12,
                marginBottom:14, fontSize:12, color:'#495057' }}>
                <strong>{selPolicy?.policyNo}</strong> — {selPolicy?.name}<br/>
                <span style={{ color:'#6C757D' }}>
                  {proposals.length} employees | Avg {avgPct.toFixed(1)}% |
                  Annual impact: {fmtC(totalImpactAnn)}
                </span>
              </div>
              {action==='process' && (
                <div style={{ background:'#FFF3CD', padding:'10px 12px', borderRadius:6,
                  fontSize:12, color:'#856404', marginBottom:14,
                  border:'1px solid #FFEEBA' }}>
                  ⚠️ This will immediately update all employee CTC records.
                  Revision history will be saved permanently. Cannot be undone.
                </div>
              )}
              <label style={lbl}>
                Remarks {action==='reject'?'*':'(optional)'}
              </label>
              <textarea value={remarks} onChange={e=>setRemarks(e.target.value)}
                style={{ ...inp, minHeight:80, resize:'vertical' }}
                placeholder={action==='reject'
                  ?'Reason for rejection — will be sent back to HR...'
                  :action==='approve'
                  ?'Approval remarks (optional)...'
                  :'Processing remarks...'} />
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
              <button onClick={()=>{setAction(null);setRemarks('')}}
                style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
                  border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>
                Cancel</button>
              <button onClick={doAction} disabled={processing}
                style={{ padding:'8px 28px', border:'none', borderRadius:6,
                  fontSize:13, fontWeight:700, cursor:'pointer', color:'#fff',
                  background: processing?'#999':
                    action==='reject'?'#DC3545':
                    action==='process'?'#155724':'#28A745' }}>
                {processing?'⏳ Processing...':
                  action==='approve'?'✅ Approve':
                  action==='reject' ?'❌ Reject':
                  '🚀 Process Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
