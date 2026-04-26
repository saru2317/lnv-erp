import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }

const EMPTY_LINE = {
  itemCode:'', itemName:'', specification:'',
  qty:1, unit:'Nos', requiredBy:'',
  estimatedRate:'', purpose:'', remarks:''
}

export default function PRNew() {
  const nav = useNavigate()
  const [items,   setItems]   = useState([])
  const [saving,  setSaving]  = useState(false)
  const [prNo,    setPrNo]    = useState('PR-AUTO')
  const [lines,   setLines]   = useState([{...EMPTY_LINE}])
  const [hdr,     setHdr]     = useState({
    department:'', requestedBy:'', requestedByName:'',
    priority:'Normal', remarks:''
  })

  useEffect(()=>{
    // Load items from master
    mmApi.getItems().then(d=>setItems(d.data||[])).catch(()=>{})
    // Get next PR number
    fetch(`${BASE_URL}/mm/pr/next-no`,
      { headers:{ Authorization:`Bearer ${getToken()}` }})
      .then(r=>r.json())
      .then(d=>setPrNo(d.prNo||'PR-AUTO'))
      .catch(()=>{})
  },[])

  const updateLine = (i, field, val) =>
    setLines(prev=>prev.map((l,idx)=>idx===i?{...l,[field]:val}:l))

  const addLine = () => setLines(p=>[...p,{...EMPTY_LINE}])
  const delLine = i  => setLines(p=>p.filter((_,idx)=>idx!==i))

  const onItemSelect = (i, code) => {
    const item = items.find(it=>it.itemCode===code)
    updateLine(i,'itemCode',code)
    if (item) updateLine(i,'itemName',item.itemName)
  }

  const save = async (submit=false) => {
    if (!hdr.department) return toast.error('Department required!')
    if (!lines[0].itemName) return toast.error('Add at least one item!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/pr`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ ...hdr, lines }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Auto submit if requested
      if (submit) {
        const sRes = await fetch(`${BASE_URL}/mm/pr/${data.data.id}/submit`,
          { method:'POST', headers:authHdrs(), body:'{}' })
        const sData = await sRes.json()
        toast.success(sData.message)
      } else {
        toast.success(data.message)
      }
      nav('/mm/pr')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          New Purchase Indent <small>{prNo}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/mm/pr')}>✕ Cancel</button>
          <button className="btn btn-s sd-bsm"
            disabled={saving} onClick={()=>save(false)}>
            💾 Save Draft
          </button>
          <button className="btn btn-p sd-bsm"
            disabled={saving} onClick={()=>save(true)}>
            📤 Submit to HOD
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1px solid #E0D5E0', padding:16, marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#714B67',
          marginBottom:12, fontFamily:'Syne,sans-serif' }}>
          📋 Indent Header
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
          gap:12, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3,
              textTransform:'uppercase' }}>PR Number</label>
            <input style={{ ...inp, background:'#F8F9FA',
              color:'#714B67', fontWeight:700 }}
              value={prNo} readOnly />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3,
              textTransform:'uppercase' }}>Department *</label>
            <select style={{ ...inp, cursor:'pointer' }}
              value={hdr.department}
              onChange={e=>setHdr(p=>({...p,department:e.target.value}))}>
              <option value="">-- Select Department --</option>
              {['Production','Quality','Maintenance','Admin','Warehouse',
                'Accounts','HR','Sales','Purchase','IT'].map(d=>(
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3,
              textTransform:'uppercase' }}>Priority</label>
            <select style={{ ...inp, cursor:'pointer' }}
              value={hdr.priority}
              onChange={e=>setHdr(p=>({...p,priority:e.target.value}))}>
              {['Normal','Urgent','Low'].map(p=>(
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
          gap:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3,
              textTransform:'uppercase' }}>Requested By *</label>
            <input style={inp} value={hdr.requestedByName}
              onChange={e=>setHdr(p=>({...p,
                requestedByName:e.target.value,
                requestedBy:e.target.value}))}
              placeholder="HOD / Requestor name" />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3,
              textTransform:'uppercase' }}>PR Date</label>
            <input style={{ ...inp, background:'#F8F9FA' }}
              value={new Date().toLocaleDateString('en-IN')} readOnly />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3,
              textTransform:'uppercase' }}>Remarks</label>
            <input style={inp} value={hdr.remarks}
              onChange={e=>setHdr(p=>({...p,remarks:e.target.value}))}
              placeholder="Any notes..." />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1px solid #E0D5E0', overflow:'hidden',
        marginBottom:14 }}>
        <div style={{ background:'#F8F4F8', padding:'10px 16px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', borderBottom:'1px solid #E0D5E0' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#714B67' }}>
            📦 Items Required
          </span>
          <button onClick={addLine}
            style={{ padding:'4px 12px', background:'#714B67',
              color:'#fff', border:'none', borderRadius:5,
              fontSize:11, cursor:'pointer', fontWeight:600 }}>
            + Add Item
          </button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse',
            fontSize:12, minWidth:900 }}>
            <thead>
              <tr style={{ background:'#F8F4F8',
                borderBottom:'2px solid #E0D5E0' }}>
                {['#','Item','Specification','Qty','Unit',
                  'Required By','Est. Rate','Purpose',''].map(h=>(
                  <th key={h} style={{ padding:'8px 10px',
                    fontSize:10, fontWeight:700, color:'#6C757D',
                    textAlign:'left', textTransform:'uppercase',
                    letterSpacing:.3, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                  <td style={{ padding:'6px 10px', color:'#6C757D',
                    fontWeight:700, textAlign:'center',
                    width:30 }}>{i+1}</td>
                  <td style={{ padding:'4px 8px', minWidth:180 }}>
                    <select style={{ ...inp, fontSize:11,
                      marginBottom:3, cursor:'pointer' }}
                      value={l.itemCode}
                      onChange={e=>onItemSelect(i,e.target.value)}>
                      <option value="">-- Select Item --</option>
                      {items.map(it=>(
                        <option key={it.itemCode} value={it.itemCode}>
                          {it.itemName}
                        </option>
                      ))}
                    </select>
                    {!l.itemCode && (
                      <input style={{ ...inp, fontSize:11 }}
                        placeholder="Or type item name"
                        value={l.itemName}
                        onChange={e=>updateLine(i,'itemName',e.target.value)} />
                    )}
                  </td>
                  <td style={{ padding:'4px 8px', minWidth:120 }}>
                    <input style={{ ...inp, fontSize:11 }}
                      placeholder="Brand/spec/grade"
                      value={l.specification}
                      onChange={e=>updateLine(i,'specification',e.target.value)} />
                  </td>
                  <td style={{ padding:'4px 8px', width:70 }}>
                    <input type="number" style={{ ...inp, fontSize:11 }}
                      min={0} value={l.qty}
                      onChange={e=>updateLine(i,'qty',e.target.value)} />
                  </td>
                  <td style={{ padding:'4px 8px', width:80 }}>
                    <select style={{ ...inp, fontSize:11, cursor:'pointer' }}
                      value={l.unit}
                      onChange={e=>updateLine(i,'unit',e.target.value)}>
                      {['Nos','Kg','Ltr','Mtr','Box','Set','Pcs',
                        'MT','Roll','Pack'].map(u=>(
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding:'4px 8px', width:120 }}>
                    <input type="date" style={{ ...inp, fontSize:11 }}
                      value={l.requiredBy}
                      onChange={e=>updateLine(i,'requiredBy',e.target.value)} />
                  </td>
                  <td style={{ padding:'4px 8px', width:100 }}>
                    <input type="number" style={{ ...inp, fontSize:11 }}
                      placeholder="Est. rate"
                      value={l.estimatedRate}
                      onChange={e=>updateLine(i,'estimatedRate',e.target.value)} />
                  </td>
                  <td style={{ padding:'4px 8px', minWidth:140 }}>
                    <input style={{ ...inp, fontSize:11 }}
                      placeholder="Purpose / reason"
                      value={l.purpose}
                      onChange={e=>updateLine(i,'purpose',e.target.value)} />
                  </td>
                  <td style={{ padding:'4px 8px', width:40 }}>
                    {lines.length>1 && (
                      <button onClick={()=>delLine(i)}
                        style={{ background:'#DC3545', color:'#fff',
                          border:'none', borderRadius:4,
                          padding:'3px 7px', cursor:'pointer',
                          fontSize:12 }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div style={{ background:'#D1ECF1', padding:'10px 16px',
        borderRadius:8, fontSize:12, color:'#0C5460',
        border:'1px solid #BEE5EB' }}>
        💡 <strong>Save Draft</strong> → save and continue editing later &nbsp;|&nbsp;
        <strong>Submit to HOD</strong> → send for approval immediately
      </div>
    </div>
  )
}
