import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

const SEV = { MINOR:{bg:'#D4EDDA',text:'#155724'}, MAJOR:{bg:'#FFF3CD',text:'#856404'}, CRITICAL:{bg:'#F8D7DA',text:'#721C24'} }
const STAGE_COLOR = { INCOMING:{bg:'#D1ECF1',text:'#0C5460'}, INPROCESS:{bg:'#FFF3CD',text:'#856404'},
  FINAL:{bg:'#D4EDDA',text:'#155724'}, OUTGOING:{bg:'#EDE0EA',text:'#714B67'}, DISPATCH:{bg:'#F8D7DA',text:'#721C24'} }

// ── Generic simple row form ────────────────────────────────
function SimpleForm({ title, fields, item, onSave, onCancel }) {
  const isEdit = !!item?.id
  const init = fields.reduce((a,f)=>({...a,[f.key]:item?.[f.key]??f.default??''}),{})
  const [form, setForm] = useState(init)
  const [saving, setSaving] = useState(false)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:520, overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
            {isEdit ? `Edit — ${item.code||item.name}` : `+ New ${title}`}
          </h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}{f.required?' *':''}</label>
              {f.type==='select' ? (
                <select value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, cursor:'pointer' }}>
                  {f.options.map(o=>typeof o==='string'?<option key={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type==='number' ? (
                <input type="number" value={form[f.key]||''} step={f.step||'any'} min={f.min||0}
                  onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inp} placeholder={f.placeholder||''} />
              ) : f.type==='textarea' ? (
                <textarea value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, minHeight:55, resize:'vertical' }} placeholder={f.placeholder||''} />
              ) : (
                <input value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, ...(f.mono&&{fontFamily:'DM Mono,monospace'}) }}
                  disabled={isEdit && f.isCode} placeholder={f.placeholder||''}
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
            const reqField = fields.find(f=>f.required && !form[f.key])
            if (reqField) return toast.error(`${reqField.label} required!`)
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

function MasterSection({ title, icon, data, loading, columns, onAdd, onEdit, onDelete, emptyMsg }) {
  return (
    <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
      overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ padding:'12px 16px', background:'#F8F4F8', display:'flex',
        justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #E0D5E0' }}>
        <span style={{ fontWeight:700, fontSize:13, color:'#714B67' }}>{icon} {title} ({data.length})</span>
        <button onClick={onAdd} style={{ padding:'5px 14px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Add</button>
      </div>
      {loading ? <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      : data.length===0 ? <div style={{ padding:30, textAlign:'center', color:'#6C757D', fontSize:12 }}>{emptyMsg}</div>
      : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr>{columns.map(c=><th key={c.key} style={{ padding:'8px 12px', fontSize:10,
                fontWeight:700, color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                borderBottom:'1px solid #E0D5E0', letterSpacing:.4, whiteSpace:'nowrap' }}>{c.label}</th>)}
                <th style={{ padding:'8px 12px', fontSize:10, fontWeight:700, color:'#6C757D',
                  textAlign:'right', borderBottom:'1px solid #E0D5E0' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row,i)=>(
                <tr key={row.id} style={{ borderBottom:'1px solid #F0EEF0',
                  background:i%2===0?'#fff':'#FDFBFD' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                  {columns.map(c=>(
                    <td key={c.key} style={{ padding:'9px 12px', fontSize:12,
                      ...(c.mono&&{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}) }}>
                      {c.render ? c.render(row[c.key], row) : row[c.key]||'—'}
                    </td>
                  ))}
                  <td style={{ padding:'9px 12px', textAlign:'right' }}>
                    <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                      <button onClick={()=>onEdit(row)} style={{ padding:'3px 10px', background:'#714B67',
                        color:'#fff', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>Edit</button>
                      <button onClick={()=>onDelete(row.id)} style={{ padding:'3px 8px', background:'#fff',
                        color:'#DC3545', border:'1px solid #DC3545', borderRadius:4, fontSize:11, cursor:'pointer' }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function QualityMaster() {
  const [tab, setTab] = useState('insp-types')
  const [inspTypes, setInspTypes] = useState([])
  const [params,    setParams]    = useState([])
  const [defects,   setDefects]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [formConfig,setFormConfig]= useState(null) // { endpoint, fields, item, title }

  const fetch_ = useCallback(async (ep, setter) => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/quality-master/${ep}`, { headers:authHdrs() })
      const data = await res.json()
      if (res.ok) setter(data.data||[])
      else toast.error(data.error)
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{
    fetch_('inspection-types', setInspTypes)
    fetch_('parameters', setParams)
    fetch_('defect-codes', setDefects)
  }, [])

  const save_ = async (ep, setter, item, form) => {
    const isEdit = !!item?.id
    const url    = isEdit ? `${BASE_URL}/quality-master/${ep}/${item.id}` : `${BASE_URL}/quality-master/${ep}`
    const res    = await fetch(url, { method:isEdit?'PATCH':'POST', headers:authHdrs(), body:JSON.stringify(form) })
    const data   = await res.json()
    if (!res.ok) throw new Error(data.error)
    toast.success(isEdit?'Updated!':'Created!')
    setFormConfig(null)
    fetch_(ep, setter)
  }
  const del_ = async (ep, setter, id) => {
    if (!confirm('Delete this record?')) return
    await fetch(`${BASE_URL}/quality-master/${ep}/${id}`, { method:'DELETE', headers:authHdrs() })
    toast.success('Deleted!'); fetch_(ep, setter)
  }

  const TABS = [
    { id:'insp-types', label:'🔍 Inspection Types' },
    { id:'parameters', label:'📏 Quality Parameters' },
    { id:'defects',    label:'⚠️ Defect Codes' },
  ]

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Quality Masters
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            SAP: QM — Inspection Types · Parameters · Defect Codes
          </p>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Inspection Types', value:inspTypes.length, color:'#714B67', bg:'#EDE0EA' },
          { label:'Quality Params',   value:params.length,    color:'#0C5460', bg:'#D1ECF1' },
          { label:'Defect Codes',     value:defects.length,   color:'#856404', bg:'#FFF3CD' },
          { label:'Critical Defects', value:defects.filter(d=>d.severity==='CRITICAL').length, color:'#721C24', bg:'#F8D7DA' },
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

      {/* ── INSPECTION TYPES ── */}
      {tab==='insp-types' && (
        <MasterSection
          title="Inspection Types" icon="🔍" data={inspTypes} loading={loading}
          columns={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Name' },
            { key:'stage', label:'Stage', render:v=>{
              const c = STAGE_COLOR[v]||{}
              return <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11,
                fontWeight:700, background:c.bg||'#E0E0E0', color:c.text||'#555' }}>{v}</span>
            }},
            { key:'description', label:'Description' },
          ]}
          onAdd={()=>setFormConfig({ title:'Inspection Type', endpoint:'inspection-types', setter:setInspTypes,
            item:null, fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'IQC' },
              { key:'name', label:'Name', required:true, placeholder:'Incoming Quality Control' },
              { key:'stage', label:'Stage', type:'select', options:['INCOMING','INPROCESS','FINAL','OUTGOING','DISPATCH'] },
              { key:'description', label:'Description', type:'textarea' },
            ]})}
          onEdit={row=>setFormConfig({ title:'Inspection Type', endpoint:'inspection-types', setter:setInspTypes,
            item:row, fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true },
              { key:'name', label:'Name', required:true },
              { key:'stage', label:'Stage', type:'select', options:['INCOMING','INPROCESS','FINAL','OUTGOING','DISPATCH'] },
              { key:'description', label:'Description', type:'textarea' },
            ]})}
          onDelete={id=>del_('inspection-types',setInspTypes,id)}
          emptyMsg="No inspection types yet"
        />
      )}

      {/* ── QUALITY PARAMETERS ── */}
      {tab==='parameters' && (
        <MasterSection
          title="Quality Parameters" icon="📏" data={params} loading={loading}
          columns={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Parameter Name' },
            { key:'category', label:'Category' },
            { key:'uom', label:'UOM' },
            { key:'minValue', label:'Min', render:v=>v!=null?Number(v).toString():'—' },
            { key:'maxValue', label:'Max', render:v=>v!=null&&Number(v)>0?Number(v).toString():'—' },
            { key:'testMethod', label:'Test Method' },
          ]}
          onAdd={()=>setFormConfig({ title:'Quality Parameter', endpoint:'parameters', setter:setParams,
            item:null, fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'QP007' },
              { key:'name', label:'Parameter Name', required:true, placeholder:'Coating Thickness (DFT)' },
              { key:'category', label:'Category', type:'select', options:['Surface','Mechanical','Visual','Chemical','Dimensional','Corrosion'] },
              { key:'uom', label:'Unit of Measure', placeholder:'micron, mm, HRC, Grade...' },
              { key:'minValue', label:'Min Value', type:'number', step:'0.001' },
              { key:'maxValue', label:'Max Value (0=unlimited)', type:'number', step:'0.001' },
              { key:'testMethod', label:'Test Method', placeholder:'DFT Gauge, Vernier, Visual...' },
            ]})}
          onEdit={row=>setFormConfig({ title:'Quality Parameter', endpoint:'parameters', setter:setParams,
            item:row, fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true },
              { key:'name', label:'Parameter Name', required:true },
              { key:'category', label:'Category', type:'select', options:['Surface','Mechanical','Visual','Chemical','Dimensional','Corrosion'] },
              { key:'uom', label:'Unit of Measure' },
              { key:'minValue', label:'Min Value', type:'number', step:'0.001' },
              { key:'maxValue', label:'Max Value', type:'number', step:'0.001' },
              { key:'testMethod', label:'Test Method' },
            ]})}
          onDelete={id=>del_('parameters',setParams,id)}
          emptyMsg="No quality parameters yet"
        />
      )}

      {/* ── DEFECT CODES ── */}
      {tab==='defects' && (
        <MasterSection
          title="Defect Codes" icon="⚠️" data={defects} loading={loading}
          columns={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Defect Name' },
            { key:'category', label:'Category' },
            { key:'severity', label:'Severity', render:v=>{
              const c = SEV[v]||{}
              return <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11,
                fontWeight:700, background:c.bg||'#E0E0E0', color:c.text||'#555' }}>{v}</span>
            }},
          ]}
          onAdd={()=>setFormConfig({ title:'Defect Code', endpoint:'defect-codes', setter:setDefects,
            item:null, fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'DC011' },
              { key:'name', label:'Defect Name', required:true, placeholder:'Peeling / Flaking' },
              { key:'category', label:'Category', type:'select', options:['Surface','Visual','Dimensional','Cosmetic','Mechanical'] },
              { key:'severity', label:'Severity', type:'select', options:['MINOR','MAJOR','CRITICAL'] },
            ]})}
          onEdit={row=>setFormConfig({ title:'Defect Code', endpoint:'defect-codes', setter:setDefects,
            item:row, fields:[
              { key:'code', label:'Code', required:true, isCode:true, mono:true },
              { key:'name', label:'Defect Name', required:true },
              { key:'category', label:'Category', type:'select', options:['Surface','Visual','Dimensional','Cosmetic','Mechanical'] },
              { key:'severity', label:'Severity', type:'select', options:['MINOR','MAJOR','CRITICAL'] },
            ]})}
          onDelete={id=>del_('defect-codes',setDefects,id)}
          emptyMsg="No defect codes yet"
        />
      )}

      {formConfig && (
        <SimpleForm
          title={formConfig.title}
          fields={formConfig.fields}
          item={formConfig.item}
          onSave={form=>save_(formConfig.endpoint,formConfig.setter,formConfig.item,form)}
          onCancel={()=>setFormConfig(null)}
        />
      )}
    </div>
  )
}
