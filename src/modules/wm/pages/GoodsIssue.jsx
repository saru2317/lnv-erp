import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })
const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase' }

export default function GoodsIssue() {
  const nav = useNavigate()
  const [items,   setItems]   = useState([])
  const [saving,  setSaving]  = useState(false)
  const [giNo,    setGiNo]    = useState('Auto-generated')
  const [lines,   setLines]   = useState([
    { itemCode:'', itemName:'', availQty:0, qty:1, uom:'Nos', remarks:'' }
  ])
  const [form, setForm] = useState({
    issueTo: 'Production Floor',
    movType: '201 — GI for Production Order',
    reference: '',
    issueDate: new Date().toISOString().split('T')[0],
    issuedBy: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name||'Admin'
  })

  useEffect(()=>{
    fetch(`${BASE_URL}/wm/stock`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setItems(d.data||[])).catch(()=>{})
    fetch(`${BASE_URL}/wm/gi/next-no`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setGiNo(d.giNo||'GI-AUTO')).catch(()=>{})
  },[])

  const onItemChange = (i, code) => {
    const item = items.find(it=>it.itemCode===code)
    setLines(prev=>prev.map((l,idx)=>idx!==i?l:{
      ...l,
      itemCode:code,
      itemName:item?.itemName||'',
      availQty:parseFloat(item?.balanceQty||0),
      uom:item?.uom||'Nos'
    }))
  }

  const addLine = () => setLines(p=>[...p,
    { itemCode:'', itemName:'', availQty:0, qty:1, uom:'Nos', remarks:'' }])
  const delLine = i => setLines(p=>p.filter((_,idx)=>idx!==i))

  const post = async () => {
    const validLines = lines.filter(l=>l.itemCode&&l.qty>0)
    if (!validLines.length) return toast.error('Add at least one item!')
    // Check available qty
    for (const l of validLines) {
      if (parseFloat(l.qty)>parseFloat(l.availQty))
        return toast.error(`${l.itemName}: Issue qty exceeds available stock!`)
    }
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/gi`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ ...form, lines:validLines })})
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      nav('/wm/movement')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const sHdr = title => (
    <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
      padding:'8px 16px' }}>
      <span style={{ color:'#fff', fontSize:13, fontWeight:700,
        fontFamily:'Syne,sans-serif' }}>{title}</span>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column',
      height:'100%', overflow:'hidden' }}>
      {/* Sticky Header */}
      <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8', borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Goods Issue
            <small style={{ fontFamily:'DM Mono,monospace',
              color:'#714B67', marginLeft:8 }}>{giNo}</small>
            <small>MIGO · Issue to Production / Sales</small>
          </div>
          <div className="lv-acts">
            {/* Flow steps */}
            <div style={{ display:'flex', gap:0, marginRight:8 }}>
              {['Issue Entry','Stock Reduced','Cost Booked'].map((s,i)=>(
                <div key={s} style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ padding:'3px 10px', fontSize:10, fontWeight:700,
                    background:i===0?'#714B67':'#D4EDDA',
                    color:i===0?'#fff':'#155724',
                    borderRadius:i===0?'10px 0 0 10px':i===2?'0 10px 10px 0':'0' }}>
                    {s}
                  </span>
                  {i<2 && <span style={{ color:'#6C757D' }}>›</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/wm/stock')}>✕ Cancel</button>
            <button className="btn btn-p sd-bsm"
              disabled={saving} onClick={post}>
              {saving?'⏳ Posting...':'📤 Post Goods Issue'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 0',
        paddingBottom:40 }}>
        {/* Issue Details */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginBottom:14 }}>
          {sHdr('📋 Issue Details')}
          <div style={{ padding:16, background:'#fff' }}>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:12,
              marginBottom:12 }}>
              <div>
                <label style={lbl}>GI Number</label>
                <input style={{ ...inp, background:'#F8F4F8',
                  color:'#714B67', fontWeight:700,
                  fontFamily:'DM Mono,monospace' }}
                  value={giNo} readOnly />
              </div>
              <div>
                <label style={lbl}>Issue Date *</label>
                <input type="date" style={inp}
                  value={form.issueDate}
                  onChange={e=>setForm(f=>({...f,issueDate:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>Movement Type</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.movType}
                  onChange={e=>setForm(f=>({...f,movType:e.target.value}))}>
                  {['201 — GI for Production Order',
                    '261 — GI for Sales Order',
                    '551 — Scrapping',
                    '901 — Sample Issue'].map(m=>(
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Issue To</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.issueTo}
                  onChange={e=>setForm(f=>({...f,issueTo:e.target.value}))}>
                  {['Production Floor','Sales / Dispatch',
                    'QC Lab','Admin','Maintenance'].map(l=>(
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Reference (WO / SO)</label>
                <input style={inp} value={form.reference}
                  placeholder="WO-2026-001 / SO-2026-001"
                  onChange={e=>setForm(f=>({...f,reference:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>Issued By</label>
                <input style={{ ...inp, background:'#F8F9FA' }}
                  value={form.issuedBy} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden' }}>
          {sHdr('📦 Items to Issue')}
          <div style={{ padding:'10px 16px', background:'#fff',
            display:'flex', justifyContent:'flex-end' }}>
            <button onClick={addLine}
              style={{ padding:'4px 14px', background:'#714B67',
                color:'#fff', border:'none', borderRadius:5,
                fontSize:11, cursor:'pointer', fontWeight:600 }}>
              + Add Item
            </button>
          </div>
          <div style={{ overflowX:'auto', background:'#fff' }}>
            <table style={{ width:'100%', borderCollapse:'collapse',
              fontSize:12 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['#','Material','Available','Issue Qty','UOM','Remarks',''].map(h=>(
                    <th key={h} style={{ padding:'7px 10px', fontSize:10,
                      fontWeight:700, color:'#6C757D', textAlign:'left',
                      textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                    <td style={{ padding:'6px 10px', color:'#6C757D',
                      fontWeight:700, textAlign:'center' }}>{i+1}</td>
                    <td style={{ padding:'4px 6px', minWidth:180 }}>
                      <select style={{ width:'100%', padding:'5px 6px',
                        border:'1px solid #E0D5E0', borderRadius:4,
                        fontSize:11, cursor:'pointer' }}
                        value={l.itemCode}
                        onChange={e=>onItemChange(i,e.target.value)}>
                        <option value="">-- Select Item --</option>
                        {items.map(it=>(
                          <option key={it.itemCode} value={it.itemCode}>
                            {it.itemCode} — {it.itemName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding:'6px 10px', textAlign:'right',
                      fontWeight:700,
                      color:parseFloat(l.availQty||0)<=0?'#DC3545':'#155724',
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(l.availQty||0)} {l.uom}
                    </td>
                    <td style={{ padding:'4px 6px', width:80 }}>
                      <input type="number" min={0}
                        max={l.availQty}
                        style={{ width:'100%', padding:'5px 6px',
                          border:'1px solid #E0D5E0', borderRadius:4,
                          fontSize:11, textAlign:'right',
                          fontFamily:'DM Mono,monospace',
                          boxSizing:'border-box',
                          background:parseFloat(l.qty)>parseFloat(l.availQty)
                            ?'#FFF5F5':'#fff' }}
                        value={l.qty}
                        onChange={e=>setLines(prev=>prev.map((x,idx)=>
                          idx===i?{...x,qty:e.target.value}:x))} />
                    </td>
                    <td style={{ padding:'6px 10px',
                      textAlign:'center' }}>{l.uom}</td>
                    <td style={{ padding:'4px 6px', minWidth:120 }}>
                      <input style={{ width:'100%', padding:'5px 6px',
                        border:'1px solid #E0D5E0', borderRadius:4,
                        fontSize:11, boxSizing:'border-box' }}
                        placeholder="Notes..."
                        value={l.remarks}
                        onChange={e=>setLines(prev=>prev.map((x,idx)=>
                          idx===i?{...x,remarks:e.target.value}:x))} />
                    </td>
                    <td style={{ padding:'4px 6px', textAlign:'center' }}>
                      {lines.length>1 && (
                        <button onClick={()=>delLine(i)}
                          style={{ background:'#DC3545', color:'#fff',
                            border:'none', borderRadius:4, padding:'2px 7px',
                            cursor:'pointer', fontSize:11 }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
