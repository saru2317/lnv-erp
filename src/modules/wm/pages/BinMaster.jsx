// ════════════════════════════════════════════════════════════
// BinMaster.jsx — wired to warehouse locations from backend
// ════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const INIT_BIN = { code:'', zone:'', type:'Rack', warehouse:'', capacity:'', uom:'Nos', isActive:true }

export function BinMaster() {
  const [bins,    setBins]    = useState([])
  const [whs,     setWhs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState(INIT_BIN)
  const [show,    setShow]    = useState(false)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rB, rW] = await Promise.all([
        fetch(`${BASE_URL}/wm/bins`,       { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/warehouses`, { headers: hdr2() }),
      ])
      const [dB, dW] = await Promise.all([rB.json(), rW.json()])
      setBins(dB.data || [])
      setWhs(dW.data  || [])
    } catch { toast.error('Failed to load bins') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const openNew  = () => { setForm(INIT_BIN); setEditId(null); setShow(true) }
  const openEdit = b  => { setForm({...b}); setEditId(b.id); setShow(true) }
  const cancel   = () => { setShow(false); setForm(INIT_BIN); setEditId(null) }
  const fSet = k => e => setForm(f => ({...f,[k]:e.target.value}))

  const save = async () => {
    if (!form.code || !form.warehouse) return toast.error('Bin code and warehouse required')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/wm/bins/${editId}` : `${BASE_URL}/wm/bins`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(editId ? 'Bin updated' : 'Bin created')
      cancel(); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const shown = bins.filter(b =>
    !search || b.code?.toLowerCase().includes(search.toLowerCase()) || b.zone?.toLowerCase().includes(search.toLowerCase())
  )

  const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Bin / Location Master <small>Storage Location Configuration (LT01)</small></div>
        <div className="lv-acts">
          <input className="sd-search" placeholder="Search bin..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:180}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={openNew}>+ Add Bin</button>
        </div>
      </div>

      <table className="wm-data-table">
        <thead><tr>
          <th>Bin Code</th><th>Zone / Row</th><th>Type</th><th>Warehouse</th>
          <th>Capacity</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={7} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length === 0
            ? <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No bins configured. Click <strong>Add Bin</strong> to define storage locations.
              </td></tr>
            : shown.map((b, i) => (
              <tr key={b.id} style={{background: i%2===0?'#fff':'#FDFBFD', cursor:'pointer'}} onClick={()=>openEdit(b)}>
                <td><strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>{b.code}</strong></td>
                <td>{b.zone || '—'}</td>
                <td><span style={{background:'#EDE0EA',color:'#714B67',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:700}}>{b.type||'Rack'}</span></td>
                <td>{b.warehouse || '—'}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{b.capacity ? `${b.capacity} ${b.uom||''}` : '—'}</td>
                <td><span style={{background:b.isActive?'#D4EDDA':'#F8D7DA',color:b.isActive?'#155724':'#721C24',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600}}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span></td>
                <td onClick={e=>e.stopPropagation()}>
                  <button className="btn-xs" onClick={()=>openEdit(b)}>Edit</button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      {show && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:10,width:460,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.25)'}}>
            <div style={{background:'#714B67',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong style={{color:'#fff',fontFamily:'Syne,sans-serif',fontSize:15}}>{editId?'Edit Bin':'New Bin / Location'}</strong>
              <button onClick={cancel} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:20}}>&#x2715;</button>
            </div>
            <div style={{padding:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[['Bin Code *','code','e.g. BIN-A01'],['Zone / Row','zone','e.g. Row A, Zone 1'],['Type','type','Rack']].map(([l,k,ph]) => (
                <div key={k}>
                  <label style={{fontSize:10,fontWeight:700,color:'#495057',display:'block',marginBottom:4,textTransform:'uppercase'}}>{l}</label>
                  {k === 'type'
                    ? <select style={{...inp,cursor:'pointer'}} value={form[k]} onChange={fSet(k)}>
                        {['Rack','Shelf','Pallet','Cabinet','Bulk','Floor'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    : <input style={inp} value={form[k]||''} onChange={fSet(k)} placeholder={ph}/>
                  }
                </div>
              ))}
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#495057',display:'block',marginBottom:4,textTransform:'uppercase'}}>Warehouse *</label>
                <select style={{...inp,cursor:'pointer'}} value={form.warehouse} onChange={fSet('warehouse')}>
                  <option value="">-- Select --</option>
                  {whs.map(w=><option key={w.id} value={w.name||w.code}>{w.name||w.code}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#495057',display:'block',marginBottom:4,textTransform:'uppercase'}}>Capacity</label>
                <input style={inp} value={form.capacity||''} onChange={fSet('capacity')} placeholder="500"/>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#495057',display:'block',marginBottom:4,textTransform:'uppercase'}}>UOM</label>
                <select style={{...inp,cursor:'pointer'}} value={form.uom} onChange={fSet('uom')}>
                  {['Nos','Kg','Litre','Box','Pallet'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
                  <input type="checkbox" checked={!!form.isActive} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} style={{accentColor:'#714B67',width:15,height:15}}/>
                  Active
                </label>
              </div>
            </div>
            <div style={{padding:'12px 20px',borderTop:'1px solid #E0D5E0',display:'flex',justifyContent:'flex-end',gap:10,background:'#F8F7FA'}}>
              <button onClick={cancel} style={{padding:'8px 18px',background:'#fff',color:'#6C757D',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,cursor:'pointer'}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{padding:'8px 18px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                {saving?'Saving...':'Save Bin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BinMaster
