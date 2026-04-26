import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function JVNew() {
  const nav  = useNavigate()
  const [jeNo,    setJeNo]    = useState('Auto-generated')
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0])
  const [narr,    setNarr]    = useState('')
  const [refType, setRefType] = useState('FI')
  const [refNo,   setRefNo]   = useState('')
  const [lines,   setLines]   = useState([
    { id:1, debitAcctCode:'', creditAcctCode:'', debit:'', credit:'', narration:'' },
    { id:2, debitAcctCode:'', creditAcctCode:'', debit:'', credit:'', narration:'' },
  ])
  const [accts,   setAccts]   = useState([])
  const [saving,  setSaving]  = useState(false)
  const [nid,     setNid]     = useState(3)

  useEffect(() => {
    fetch(`${BASE_URL}/fi/je/next-no`, { headers: hdr2() }).then(r=>r.json()).then(d=>setJeNo(d.jeNo||'JV-AUTO')).catch(()=>{})
    fetch(`${BASE_URL}/fi/coa`, { headers: hdr2() }).then(r=>r.json()).then(d=>setAccts(d.data||[])).catch(()=>{})
  }, [])

  const addLine = () => { setLines(l=>[...l,{id:nid,debitAcctCode:'',creditAcctCode:'',debit:'',credit:'',narration:''}]); setNid(n=>n+1) }
  const delLine = id => { if (lines.length <= 2) return; setLines(l=>l.filter(x=>x.id!==id)) }
  const updLine = (id,k,v) => setLines(l=>l.map(x=>x.id!==id?x:{...x,[k]:v}))

  const totalDr = lines.reduce((a,l)=>a+parseFloat(l.debit||0),0)
  const totalCr = lines.reduce((a,l)=>a+parseFloat(l.credit||0),0)
  const balanced = Math.abs(totalDr - totalCr) < 0.01

  const save = async () => {
    if (!narr)          return toast.error('Narration required')
    if (!balanced)      return toast.error(`JV not balanced — Dr: ${INR(totalDr)} ≠ Cr: ${INR(totalCr)}`)
    if (totalDr === 0)  return toast.error('Amount cannot be zero')
    const emptyLine = lines.find(l=>!l.debitAcctCode&&!l.creditAcctCode)
    if (emptyLine) return toast.error('All lines need an account code')
    setSaving(true)
    try {
      const user = JSON.parse(localStorage.getItem('lnv_user')||'{}')
      const res  = await fetch(`${BASE_URL}/fi/je`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ date, narration:narr, refType, refNo, postedById: user.id||1, lines })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.data.jeNo} posted!`)
      nav('/fi/jv')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const inp2 = { padding:'6px 8px', border:'1.5px solid #E0D5E0', borderRadius:4, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Journal Voucher <small>FB01 · Manual Journal Entry</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/jv')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving||!balanced} onClick={save}>
            {saving?'Posting...':'Post JV'}
          </button>
        </div>
      </div>

      {/* JV Header */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,padding:16,background:'#fff',marginBottom:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 2fr',gap:12}}>
          <div><label style={lbl}>JV No.</label><input style={{...inp,background:'#F8F4F8',color:'#714B67',fontWeight:700,fontFamily:'DM Mono,monospace'}} value={jeNo} readOnly/></div>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div>
            <label style={lbl}>Voucher Type</label>
            <select style={{...inp,cursor:'pointer'}} value={refType} onChange={e=>setRefType(e.target.value)}>
              {['FI','SD','MM','HCM','PP','WM','PM'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Ref No.</label><input style={inp} value={refNo} onChange={e=>setRefNo(e.target.value)} placeholder="Invoice / Doc No."/></div>
          <div><label style={lbl}>Narration *</label><input style={inp} value={narr} onChange={e=>setNarr(e.target.value)} placeholder="e.g. Salary payment — April 2026"/></div>
        </div>
      </div>

      {/* Journal Lines */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'}}>Debit / Credit Lines</span>
          <button onClick={addLine} style={{padding:'4px 12px',background:'rgba(255,255,255,.2)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',borderRadius:4,fontSize:12,cursor:'pointer',fontWeight:700}}>+ Add Line</button>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
              <th style={{padding:'7px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Debit Account</th>
              <th style={{padding:'7px 10px',fontSize:10,fontWeight:700,color:'var(--odoo-red)',textAlign:'right'}}>Debit (Dr)</th>
              <th style={{padding:'7px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Credit Account</th>
              <th style={{padding:'7px 10px',fontSize:10,fontWeight:700,color:'var(--odoo-green)',textAlign:'right'}}>Credit (Cr)</th>
              <th style={{padding:'7px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Line Narration</th>
              <th style={{width:30}}/>
            </tr>
          </thead>
          <tbody>
            {lines.map((l,i)=>(
              <tr key={l.id} style={{borderBottom:'1px solid #F0EEF0'}}>
                <td style={{padding:'6px 8px'}}>
                  <select style={{...inp2,cursor:'pointer'}} value={l.debitAcctCode} onChange={e=>updLine(l.id,'debitAcctCode',e.target.value)}>
                    <option value="">-- Select Account --</option>
                    {accts.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                  </select>
                </td>
                <td style={{padding:'6px 8px'}}>
                  <input type="number" step="0.01" style={{...inp2,textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-red)',borderColor:l.debit?'#DC3545':'#E0D5E0'}}
                    value={l.debit} onChange={e=>updLine(l.id,'debit',e.target.value)} placeholder="0.00"/>
                </td>
                <td style={{padding:'6px 8px'}}>
                  <select style={{...inp2,cursor:'pointer'}} value={l.creditAcctCode} onChange={e=>updLine(l.id,'creditAcctCode',e.target.value)}>
                    <option value="">-- Select Account --</option>
                    {accts.map(a=><option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                  </select>
                </td>
                <td style={{padding:'6px 8px'}}>
                  <input type="number" step="0.01" style={{...inp2,textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-green)',borderColor:l.credit?'#28A745':'#E0D5E0'}}
                    value={l.credit} onChange={e=>updLine(l.id,'credit',e.target.value)} placeholder="0.00"/>
                </td>
                <td style={{padding:'6px 8px'}}>
                  <input style={inp2} value={l.narration} onChange={e=>updLine(l.id,'narration',e.target.value)} placeholder="Line narration..."/>
                </td>
                <td style={{padding:'6px 4px'}}>
                  <button onClick={()=>delLine(l.id)} style={{background:'none',border:'none',color:'#DC3545',cursor:'pointer',fontSize:16}}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:balanced?'#D4EDDA':'#FFF3CD',borderTop:'2px solid #E0D5E0'}}>
              <td style={{padding:'8px 10px',fontWeight:800,color:balanced?'#155724':'#856404',fontSize:12}}>
                {balanced ? '✓ BALANCED' : '⚠ NOT BALANCED'}
              </td>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'var(--odoo-red)',fontSize:14}}>{INR(totalDr)}</td>
              <td/>
              <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'var(--odoo-green)',fontSize:14}}>{INR(totalCr)}</td>
              <td colSpan={2}/>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'8px 0 20px'}}>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/fi/jv')}>Cancel</button>
        <button className="btn btn-p sd-bsm" disabled={saving||!balanced} onClick={save}>
          {saving?'Posting...':'Post JV'}
        </button>
      </div>
    </div>
  )
}

