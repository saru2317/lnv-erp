import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 9px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const sel  = { ...inp }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const btnPrimary = { padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }
const btnSecondary = { padding:'6px 12px', background:'#fff', color:'#6E2C00', border:'1.5px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:11 }
const btnDanger = { padding:'4px 9px', background:'#fdecea', color:'#C0392B', border:'none', borderRadius:4, cursor:'pointer', fontSize:11 }

const CATEGORIES = ['TUITION','TRANSPORT','HOSTEL','LAB','LIBRARY','SPORTS','EXAM','ANNUAL','DEV']
const FREQUENCIES = ['MONTHLY','QUARTERLY','ANNUAL','ONE_TIME']
const emptyForm = { feeCode:'', feeName:'', category:'TUITION', frequency:'MONTHLY', isOptional:false, ledgerHead:'' }

export default function FeeType() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [feeTypes, setFeeTypes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId,setEditingId]= useState(null)
  const [form,     setForm]     = useState(emptyForm)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const load = () => {
    fetch(`${BASE}/edu/fee-types?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setFeeTypes(d.data||[]))
  }
  useEffect(() => { load() }, [instId])

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  const openEdit = (f) => {
    setForm({ feeCode:f.feeCode, feeName:f.feeName, category:f.category, frequency:f.frequency, isOptional:f.isOptional, ledgerHead:f.ledgerHead||'' })
    setEditingId(f.id); setShowForm(true)
  }
  const save = async () => {
    if (!form.feeName || (!editingId && !form.feeCode)) return toast.error('Fee Code and Name are required')
    try {
      const url = editingId ? `${BASE}/edu/fee-types/${editingId}` : `${BASE}/edu/fee-types`
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? form : { ...form, institutionId: instId }
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(body) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingId ? '✅ Fee Type updated' : '✅ Fee Type created')
      setShowForm(false); load()
    } catch { toast.error('Save failed') }
  }
  const toggleActive = async (f) => {
    await fetch(`${BASE}/edu/fee-types/${f.id}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive: !f.isActive }) })
    load()
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>💰 Fee Types</div>
        <button onClick={openNew} style={btnPrimary}>+ New Fee Type</button>
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={th}>Code</th><th style={th}>Name</th><th style={th}>Category</th>
            <th style={th}>Frequency</th><th style={th}>Optional</th><th style={th}>Status</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {feeTypes.map(f => (
              <tr key={f.id}>
                <td style={td}>{f.feeCode}</td>
                <td style={td}>{f.feeName}</td>
                <td style={td}>{f.category}</td>
                <td style={td}>{f.frequency}</td>
                <td style={td}>{f.isOptional ? 'Yes' : 'No'}</td>
                <td style={td}>
                  <span style={{color:f.isActive?'#1E8449':'#C0392B',fontWeight:700,fontSize:11}}>
                    {f.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={()=>openEdit(f)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>Edit</button>
                  <button onClick={()=>toggleActive(f)} style={btnDanger}>{f.isActive?'Deactivate':'Activate'}</button>
                </td>
              </tr>
            ))}
            {feeTypes.length===0 && <tr><td colSpan={7} style={{...td,textAlign:'center',color:'#aaa'}}>No fee types yet for this institution</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:400,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#6E2C00',marginBottom:14}}>
              {editingId ? 'Edit Fee Type' : 'New Fee Type'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {!editingId && (
                <div>
                  <label style={{fontSize:11,color:'#888'}}>Fee Code *</label>
                  <input value={form.feeCode} onChange={e=>setForm({...form,feeCode:e.target.value})} style={inp} />
                </div>
              )}
              <div>
                <label style={{fontSize:11,color:'#888'}}>Fee Name *</label>
                <input value={form.feeName} onChange={e=>setForm({...form,feeName:e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Category</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={sel}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Frequency</label>
                <select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})} style={sel}>
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Ledger Head (for accounting)</label>
                <input value={form.ledgerHead} onChange={e=>setForm({...form,ledgerHead:e.target.value})} style={inp} />
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type='checkbox' checked={form.isOptional} onChange={e=>setForm({...form,isOptional:e.target.checked})} />
                <label style={{fontSize:12}}>Optional (not compulsory for every student, e.g. Transport/Hostel)</label>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}>
              <button onClick={()=>setShowForm(false)} style={btnSecondary}>Cancel</button>
              <button onClick={save} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
