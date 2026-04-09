import React, { useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')


const INIT = { code:'', name:'', glAccount:'', description:'', active:true }

const SAMPLE = [
  { id:1, code:'ROH',  name:'Raw Material (ROH)',        glAccount:'1010001', active:true  },
  { id:2, code:'HALB', name:'Semi Finished (HALB)',       glAccount:'1010002', active:true  },
  { id:3, code:'FERT', name:'Finished Product (FERT)',    glAccount:'1010003', active:true  },
  { id:4, code:'VERP', name:'Packing Material (VERP)',    glAccount:'1010004', active:true  },
  { id:5, code:'HIBE', name:'Operating Supplies (HIBE)',  glAccount:'1010005', active:true  },
  { id:6, code:'DIEN', name:'Services (DIEN)',            glAccount:'1010006', active:true  },
  { id:7, code:'NLAG', name:'Non-Stock Material (NLAG)',  glAccount:'1010007', active:false },
]

export default function MaterialTypeMaster() {
  const [rows, setRows]     = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [form, setForm]     = useState(INIT)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')


  // ── Fetch from backend ──────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true); setError('')
      const res  = await fetch(`${BASE_URL}/mdm/material-type`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setRows(data.data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const filtered = rows.filter(r =>
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const openNew  = () => { setForm(INIT); setEditId(null); setShowForm(true) }
  const openEdit = (r) => { setForm({...r}); setEditId(r.id); setShowForm(true) }
  const cancel   = () => { setShowForm(false); setForm(INIT); setEditId(null) }
  const save = async () => {
    if (!form.code||!form.name) { alert('Code and Name required!'); return }
    setSaving(true)
    try {
      const url = editId ? `${BASE_URL}/mdm/material-type/${editId}` : `${BASE_URL}/mdm/material-type`
      const res = await fetch(url, {
        method: editId?'PATCH':'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` },
        body: JSON.stringify({...form, code: form.code.toUpperCase()}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      if (editId) setRows(rows.map(r => r.id===editId ? data.data : r))
      else        setRows([...rows, data.data])
      cancel()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  const inp = (field) => ({
    value: form[field]??'',
    onChange: e=>setForm(f=>({...f,[field]:e.target.value})),
    style:{ width:'100%', padding:'8px 10px', border:'1.5px solid #E0D5E0',
      borderRadius:5, fontSize:13, fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' },
    onFocus: e=>e.target.style.borderColor='#714B67',
    onBlur:  e=>e.target.style.borderColor='#E0D5E0',
  })

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Material Type Master
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            MDM › Material Type &nbsp;|&nbsp; SAP-style material classification
          </p>
        </div>
        <button onClick={openNew} style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + New Material Type
        </button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0', borderRadius:5,
            fontSize:13, width:220, fontFamily:'DM Sans,sans-serif', outline:'none' }} />
        <span style={{ fontSize:12, color:'#6C757D', marginLeft:'auto', alignSelf:'center' }}>
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
              {['Material Type','Name','GL Account','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700,
                  color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r,i)=>(
              <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}
                onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:700, color:'#714B67', fontFamily:'DM Mono,monospace' }}>{r.code}</td>
                <td style={{ padding:'10px 14px', fontSize:13, fontWeight:600 }}>{r.name}</td>
                <td style={{ padding:'10px 14px', fontSize:12, color:'#6C757D', fontFamily:'DM Mono,monospace' }}>{r.glAccount||'—'}</td>
                <td style={{ padding:'10px 14px' }}>
                  <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11, fontWeight:600,
                    background:r.active?'#D4EDDA':'#F8D7DA', color:r.active?'#155724':'#721C24' }}>
                    {r.active?'Active':'Inactive'}
                  </span>
                </td>
                <td style={{ padding:'10px 14px' }}>
                  <button onClick={()=>openEdit(r)} style={{ padding:'4px 12px', background:'#714B67',
                    color:'#fff', border:'none', borderRadius:4, fontSize:12, cursor:'pointer' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10, width:440,
            boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>
            <div style={{ background:'#714B67', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ color:'#fff', fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, margin:0 }}>
                {editId?'Edit Material Type':'New Material Type'}
              </h3>
              <span onClick={cancel} style={{ color:'rgba(255,255,255,.7)', cursor:'pointer', fontSize:18 }}>✕</span>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>Type Code *</label>
                  <input {...inp('code')} placeholder="e.g. ROH" maxLength={10}/>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>GL Account</label>
                  <input {...inp('glAccount')} placeholder="e.g. 1010001"/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>Material Type Name *</label>
                <input {...inp('name')} placeholder="e.g. Raw Material"/>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#1C1C1C', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 }}>Description</label>
                <input {...inp('description')} placeholder="Optional"/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type='checkbox' checked={form.active}
                  onChange={e=>setForm(f=>({...f,active:e.target.checked}))}
                  style={{ accentColor:'#714B67', width:15, height:15 }}/>
                <label style={{ fontSize:13, color:'#1C1C1C' }}>Active</label>
              </div>
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
              <button onClick={cancel} style={{ padding:'8px 18px', background:'#fff', color:'#6C757D',
                border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={save} style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:5, fontSize:13, fontWeight:700, cursor:'pointer' }}>{saving ? '⏳ Saving...' : '💾 Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
