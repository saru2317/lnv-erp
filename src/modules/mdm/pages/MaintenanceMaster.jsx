import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

function EqForm({ item, onSave, onCancel }) {
  const isEdit = !!item?.id
  const BLANK  = { code:'', name:'', category:'Machine', make:'', model:'', serialNo:'',
    purchaseDate:'', location:'', department:'', maintenanceFreq:'Monthly' }
  const [form, setForm] = useState(item ? {...item,
    purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : ''
  } : BLANK)
  const [saving, setSaving] = useState(false)
  const F = f => ({ value:form[f]??'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    style:inp, onFocus:e=>e.target.style.borderColor='#714B67', onBlur:e=>e.target.style.borderColor='#E0D5E0' })
  const save = async () => {
    if (!form.code||!form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url = isEdit?`${BASE_URL}/maintenance-master/equipment/${item.id}`:`${BASE_URL}/maintenance-master/equipment`
      const res = await fetch(url,{method:isEdit?'PATCH':'POST',headers:authHdrs(),body:JSON.stringify(form)})
      const d   = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(isEdit?'Updated!':'Equipment created!')
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'80%', maxWidth:780,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
            {isEdit?`Edit — ${item.code}`:'+ New Equipment'}
          </h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr', gap:12 }}>
            <div><label style={lbl}>Code *</label>
              <input {...F('code')} placeholder="EQ-001" disabled={isEdit}
                style={{ ...inp, fontFamily:'DM Mono,monospace' }} /></div>
            <div><label style={lbl}>Equipment Name *</label>
              <input {...F('name')} placeholder="Ring Frame Machine 01" /></div>
            <div><label style={lbl}>Category</label>
              <select {...F('category')} style={{ ...inp, cursor:'pointer' }}>
                {['Machine','Vehicle','Utility','Building','Instrument','IT Equipment'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Make / Brand</label><input {...F('make')} placeholder="Lakshmi Machine Works" /></div>
            <div><label style={lbl}>Model</label><input {...F('model')} placeholder="LRJ 9/80S" /></div>
            <div><label style={lbl}>Serial Number</label>
              <input {...F('serialNo')} placeholder="LMW-2019-0341" style={{ ...inp, fontFamily:'DM Mono,monospace' }} /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Purchase Date</label>
              <input {...F('purchaseDate')} type="date" /></div>
            <div><label style={lbl}>Location</label><input {...F('location')} placeholder="Shop Floor — Bay 1" /></div>
            <div><label style={lbl}>Department</label>
              <select {...F('department')} style={{ ...inp, cursor:'pointer' }}>
                {['PROD','MAINT','QC','STORE','ADMIN','IT'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Maint. Frequency</label>
              <select {...F('maintenanceFreq')} style={{ ...inp, cursor:'pointer' }}>
                {['Daily','Weekly','Fortnightly','Monthly','Quarterly','Half-yearly','Annual'].map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
            border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
              color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'💾 Save Equipment'}</button>
        </div>
      </div>
    </div>
  )
}

function SimpleModal({ title, fields, item, onSave, onCancel }) {
  const isEdit = !!item?.id
  const init = fields.reduce((a,f)=>({...a,[f.key]:item?.[f.key]??f.default??''}),{})
  const [form, setForm] = useState(init)
  const [saving, setSaving] = useState(false)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:500, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
            {isEdit?`Edit — ${item.code||item.name}`:`+ New ${title}`}</h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          {fields.map(f=>(
            <div key={f.key}>
              <label style={lbl}>{f.label}{f.required?' *':''}</label>
              {f.type==='select' ? (
                <select value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, cursor:'pointer' }}>
                  {f.options.map(o=><option key={o}>{o}</option>)}
                </select>
              ) : f.type==='number' ? (
                <input type="number" value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={inp} placeholder={f.placeholder||''}
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
              ) : f.type==='textarea' ? (
                <textarea value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, minHeight:55, resize:'vertical' }} placeholder={f.placeholder||''} />
              ) : (
                <input value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, ...(f.mono&&{fontFamily:'DM Mono,monospace'}) }}
                  disabled={isEdit&&f.isCode} placeholder={f.placeholder||''}
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
              )}
            </div>
          ))}
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
            border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button disabled={saving} onClick={async()=>{
            const req = fields.find(f=>f.required&&!form[f.key])
            if (req) return toast.error(`${req.label} required!`)
            setSaving(true)
            try { await onSave(form) } catch(e){ toast.error(e.message) } finally { setSaving(false) }
          }} style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
            color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'💾 Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MaintenanceMaster() {
  const [tab,       setTab]      = useState('equipment')
  const [equipment, setEquipment]= useState([])
  const [mTypes,    setMTypes]   = useState([])
  const [spares,    setSpares]   = useState([])
  const [loading,   setLoading]  = useState(false)
  const [showEqForm,setShowEqForm]=useState(false)
  const [editEq,    setEditEq]   = useState(null)
  const [modal,     setModal]    = useState(null)

  const fetch_ = useCallback(async (ep, setter) => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/maintenance-master/${ep}`, { headers:authHdrs() })
      const d   = await res.json()
      if (res.ok) setter(d.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{
    fetch_('equipment', setEquipment)
    fetch_('types', setMTypes)
    fetch_('spares', setSpares)
  }, [])

  const save_ = async (ep, setter, item, form) => {
    const isEdit = !!item?.id
    const url  = isEdit?`${BASE_URL}/maintenance-master/${ep}/${item.id}`:`${BASE_URL}/maintenance-master/${ep}`
    const res  = await fetch(url,{method:isEdit?'PATCH':'POST',headers:authHdrs(),body:JSON.stringify(form)})
    const d    = await res.json()
    if (!res.ok) throw new Error(d.error)
    toast.success(isEdit?'Updated!':'Created!')
    setModal(null); fetch_(ep, setter)
  }
  const del_ = async (ep, setter, id) => {
    if (!confirm('Delete?')) return
    await fetch(`${BASE_URL}/maintenance-master/${ep}/${id}`,{method:'DELETE',headers:authHdrs()})
    toast.success('Deleted!'); fetch_(ep, setter)
  }

  const TABS = [
    { id:'equipment', label:'🔩 Equipment Master' },
    { id:'maint-types',label:'🛠️ Maintenance Types' },
    { id:'spares',    label:'⚙️ Spare Parts' },
  ]
  const CAT_COLOR = { Machine:{bg:'#D1ECF1',text:'#0C5460'}, Vehicle:{bg:'#FFF3CD',text:'#856404'},
    Utility:{bg:'#D4EDDA',text:'#155724'}, Building:{bg:'#EDE0EA',text:'#714B67'} }

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Maintenance Masters
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            SAP: PM — Equipment · Maintenance Types · Spare Parts
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {tab==='equipment' && (
            <button onClick={()=>{setEditEq(null);setShowEqForm(true)}}
              style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              + New Equipment</button>
          )}
          {tab==='maint-types' && (
            <button onClick={()=>setModal({title:'Maintenance Type',ep:'types',setter:setMTypes,item:null,fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'OHM' },
              { key:'name', label:'Name', required:true, placeholder:'Overhaul Maintenance' },
              { key:'category', label:'Category', type:'select', options:['Planned','Unplanned','Contract'] },
              { key:'description', label:'Description', type:'textarea' },
            ]})}
              style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              + New Type</button>
          )}
          {tab==='spares' && (
            <button onClick={()=>setModal({title:'Spare Part',ep:'spares',setter:setSpares,item:null,fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'SP-101' },
              { key:'name', label:'Part Name', required:true, placeholder:'Belt V-Type A56' },
              { key:'category', label:'Category', type:'select', options:['Electrical','Mechanical','Hydraulic','Pneumatic','Consumable','Instrument'] },
              { key:'uom', label:'UOM', placeholder:'Nos, Mtrs, Ltr' },
              { key:'minStock', label:'Min Stock', type:'number' },
              { key:'currentStock', label:'Current Stock', type:'number' },
              { key:'unitCost', label:'Unit Cost (₹)', type:'number' },
              { key:'supplier', label:'Supplier', placeholder:'Supplier name' },
            ]})}
              style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
                border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              + New Spare Part</button>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Equipment',     value:equipment.length,            color:'#714B67', bg:'#EDE0EA' },
          { label:'Maint. Types',  value:mTypes.length,               color:'#0C5460', bg:'#D1ECF1' },
          { label:'Spare Parts',   value:spares.length,               color:'#856404', bg:'#FFF3CD' },
          { label:'Low Stock',     value:spares.filter(s=>s.currentStock!=null&&s.minStock!=null&&Number(s.currentStock)<=Number(s.minStock)).length,
                                                                        color:'#721C24', bg:'#F8D7DA' },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color, fontFamily:'Syne,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'2px solid #E0D5E0' }}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'8px 18px', fontSize:12, fontWeight:600, cursor:'pointer',
              color:tab===t.id?'#714B67':'#6C757D',
              borderBottom:tab===t.id?'2px solid #714B67':'2px solid transparent', marginBottom:-2 }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* EQUIPMENT */}
      {tab==='equipment' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Code','Name','Category','Make','Location','Dept','Maint.Freq','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipment.map((r,i)=>{
                const cc = CAT_COLOR[r.category]||{}
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                    <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67', fontSize:12 }}>{r.code}</td>
                    <td style={{ padding:'10px 12px', fontWeight:600, fontSize:13 }}>{r.name}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11,
                        fontWeight:700, background:cc.bg||'#E0E0E0', color:cc.text||'#555' }}>
                        {r.category||'—'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'#6C757D' }}>{r.make||'—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{r.location||'—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{r.department||'—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{r.maintenanceFreq||'—'}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>{setEditEq(r);setShowEqForm(true)}}
                          style={{ padding:'3px 10px', background:'#714B67', color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>Edit</button>
                        <button onClick={()=>del_('equipment',setEquipment,r.id)}
                          style={{ padding:'3px 8px', background:'#fff', color:'#DC3545', border:'1px solid #DC3545', borderRadius:4, fontSize:11, cursor:'pointer' }}>×</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {equipment.length===0&&!loading&&(
                <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
                  🔩 No equipment yet — click "+ New Equipment"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MAINT TYPES */}
      {tab==='maint-types' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Code','Name','Category','Description','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mTypes.map((r,i)=>(
                <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                  <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67', fontSize:12 }}>{r.code}</td>
                  <td style={{ padding:'10px 12px', fontWeight:600 }}>{r.name}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:600,
                      background:r.category==='Planned'?'#D4EDDA':r.category==='Unplanned'?'#F8D7DA':'#D1ECF1',
                      color:r.category==='Planned'?'#155724':r.category==='Unplanned'?'#721C24':'#0C5460' }}>
                      {r.category||'—'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:12, color:'#6C757D' }}>{r.description||'—'}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>setModal({title:'Maintenance Type',ep:'types',setter:setMTypes,item:r,fields:[
                        { key:'code', label:'Code', required:true, isCode:true, mono:true },
                        { key:'name', label:'Name', required:true },
                        { key:'category', label:'Category', type:'select', options:['Planned','Unplanned','Contract'] },
                        { key:'description', label:'Description', type:'textarea' },
                      ]})}
                        style={{ padding:'3px 10px', background:'#714B67', color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>Edit</button>
                      <button onClick={()=>del_('types',setMTypes,r.id)}
                        style={{ padding:'3px 8px', background:'#fff', color:'#DC3545', border:'1px solid #DC3545', borderRadius:4, fontSize:11, cursor:'pointer' }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
              {mTypes.length===0&&!loading&&(
                <tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>🛠️ No maintenance types yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SPARES */}
      {tab==='spares' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Code','Part Name','Category','UOM','Min Stock','Current Stock','Unit Cost','Supplier','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spares.map((r,i)=>{
                const isLow = r.currentStock!=null&&r.minStock!=null&&Number(r.currentStock)<=Number(r.minStock)
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0', background:isLow?'#FFF8F8':i%2===0?'#fff':'#FDFBFD' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                    onMouseLeave={e=>e.currentTarget.style.background=isLow?'#FFF8F8':i%2===0?'#fff':'#FDFBFD'}>
                    <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67', fontSize:12 }}>{r.code}</td>
                    <td style={{ padding:'10px 12px', fontWeight:600 }}>{r.name}</td>
                    <td style={{ padding:'10px 12px', fontSize:12, color:'#6C757D' }}>{r.category||'—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{r.uom||'—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{r.minStock!=null?Number(r.minStock):'—'}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontWeight:700, color:isLow?'#DC3545':'#155724', fontSize:13 }}>
                        {r.currentStock!=null?Number(r.currentStock):'—'}{isLow?' ⚠️':''}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{r.unitCost?`₹${Number(r.unitCost).toLocaleString('en-IN')}`:'—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{r.supplier||'—'}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>setModal({title:'Spare Part',ep:'spares',setter:setSpares,item:r,fields:[
                          { key:'code', label:'Code', required:true, isCode:true, mono:true },
                          { key:'name', label:'Part Name', required:true },
                          { key:'category', label:'Category', type:'select', options:['Electrical','Mechanical','Hydraulic','Pneumatic','Consumable','Instrument'] },
                          { key:'uom', label:'UOM' }, { key:'minStock', label:'Min Stock', type:'number' },
                          { key:'currentStock', label:'Current Stock', type:'number' }, { key:'unitCost', label:'Unit Cost', type:'number' },
                          { key:'supplier', label:'Supplier' },
                        ]})}
                          style={{ padding:'3px 10px', background:'#714B67', color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>Edit</button>
                        <button onClick={()=>del_('spares',setSpares,r.id)}
                          style={{ padding:'3px 8px', background:'#fff', color:'#DC3545', border:'1px solid #DC3545', borderRadius:4, fontSize:11, cursor:'pointer' }}>×</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {spares.length===0&&!loading&&(
                <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⚙️ No spare parts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEqForm && <EqForm item={editEq}
        onSave={()=>{setShowEqForm(false);setEditEq(null);fetch_('equipment',setEquipment)}}
        onCancel={()=>{setShowEqForm(false);setEditEq(null)}} />}

      {modal && <SimpleModal title={modal.title} fields={modal.fields} item={modal.item}
        onSave={form=>save_(modal.ep,modal.setter,modal.item,form)}
        onCancel={()=>setModal(null)} />}
    </div>
  )
}
