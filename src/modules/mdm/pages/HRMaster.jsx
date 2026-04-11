import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

function Modal({ title, fields, item, onSave, onCancel }) {
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
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12, maxHeight:480, overflowY:'auto' }}>
          {fields.map(f=>(
            <div key={f.key}>
              <label style={lbl}>{f.label}{f.required?' *':''}</label>
              {f.type==='select' ? (
                <select value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, cursor:'pointer' }}>
                  {f.options.map(o=>typeof o==='object'?<option key={o.value} value={o.value}>{o.label}</option>:<option key={o}>{o}</option>)}
                </select>
              ) : f.type==='number' ? (
                <input type="number" value={form[f.key]||''} min={f.min||0}
                  onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inp} placeholder={f.placeholder||''}
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
              ) : f.type==='checkbox' ? (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={!!form[f.key]}
                    onChange={e=>setForm(p=>({...p,[f.key]:e.target.checked}))}
                    style={{ width:16, height:16, cursor:'pointer', accentColor:'#714B67' }} />
                  <span style={{ fontSize:12, color:'#6C757D' }}>{f.checkLabel||''}</span>
                </div>
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

function Table({ cols, data, loading, onEdit, onDelete, empty }) {
  return (
    <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead style={{ background:'#F8F4F8' }}>
          <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
            {cols.map(c=><th key={c.key} style={{ padding:'10px 12px', fontSize:10, fontWeight:700,
              color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.4 }}>{c.label}</th>)}
            <th style={{ padding:'10px 12px', fontSize:10, fontWeight:700, color:'#6C757D', textAlign:'right', textTransform:'uppercase' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan={cols.length+1} style={{ padding:30, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</td></tr>
          : data.length===0 ? <tr><td colSpan={cols.length+1} style={{ padding:30, textAlign:'center', color:'#6C757D', fontSize:12 }}>{empty}</td></tr>
          : data.map((row,i)=>(
            <tr key={row.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}
              onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
              {cols.map(c=>(
                <td key={c.key} style={{ padding:'9px 12px', fontSize:12,
                  ...(c.mono&&{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}) }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key]!=null?String(row[c.key]):'—')}
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
  )
}

export default function HRMaster() {
  const [tab,    setTab]   = useState('dept')
  const [depts,  setDepts] = useState([])
  const [desigs, setDesigs]= useState([])
  const [grades, setGrades]= useState([])
  const [shifts, setShifts]= useState([])
  const [leaves, setLeaves]= useState([])
  const [loading,setLoading]=useState(false)
  const [modal,  setModal] = useState(null)

  const fetch_ = useCallback(async (ep, setter) => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/hr-master/${ep}`, { headers:authHdrs() })
      const d   = await res.json()
      if (res.ok) setter(d.data||[])
      else toast.error(d.error)
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{
    fetch_('departments',  setDepts)
    fetch_('designations', setDesigs)
    fetch_('grades',       setGrades)
    fetch_('shifts',       setShifts)
    fetch_('leave-types',  setLeaves)
  }, [])

  const save_ = async (ep, setter, item, form) => {
    const isEdit = !!item?.id
    const url  = isEdit?`${BASE_URL}/hr-master/${ep}/${item.id}`:`${BASE_URL}/hr-master/${ep}`
    const res  = await fetch(url,{method:isEdit?'PATCH':'POST',headers:authHdrs(),body:JSON.stringify(form)})
    const d    = await res.json()
    if (!res.ok) throw new Error(d.error)
    toast.success(isEdit?'Updated!':'Created!')
    setModal(null); fetch_(ep, setter)
  }
  const del_ = async (ep, setter, id) => {
    if (!confirm('Delete?')) return
    await fetch(`${BASE_URL}/hr-master/${ep}/${id}`,{method:'DELETE',headers:authHdrs()})
    toast.success('Deleted!'); fetch_(ep, setter)
  }

  const DEPT_FIELDS  = [
    { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'MFG' },
    { key:'name', label:'Department Name', required:true, placeholder:'Manufacturing' },
    { key:'headEmpCode', label:'HOD Employee Code', placeholder:'EMP-001' },
    { key:'costCenter', label:'Cost Center', placeholder:'CC-MFG' },
  ]
  const DESIG_FIELDS = [
    { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'TL' },
    { key:'name', label:'Designation Name', required:true, placeholder:'Team Lead' },
    { key:'grade', label:'Grade', placeholder:'G4' },
    { key:'department', label:'Department', type:'select', options:['', ...depts.map(d=>d.code)] },
  ]
  const GRADE_FIELDS = [
    { key:'code', label:'Grade Code', required:true, isCode:true, mono:true, placeholder:'G5' },
    { key:'name', label:'Grade Name', required:true, placeholder:'Senior Executive' },
    { key:'minSalary', label:'Min Salary (₹)', type:'number', placeholder:'40000' },
    { key:'maxSalary', label:'Max Salary (₹)', type:'number', placeholder:'60000' },
  ]
  const SHIFT_FIELDS = [
    { key:'code', label:'Shift Code', required:true, isCode:true, mono:true, placeholder:'D' },
    { key:'name', label:'Shift Name', required:true, placeholder:'Day Shift' },
    { key:'startTime', label:'Start Time', required:true, placeholder:'08:00' },
    { key:'endTime', label:'End Time', required:true, placeholder:'17:00' },
    { key:'breakMins', label:'Break (minutes)', type:'number', default:30 },
    { key:'totalMins', label:'Total Work Minutes', type:'number', default:480 },
  ]
  const LEAVE_FIELDS = [
    { key:'code', label:'Leave Code', required:true, isCode:true, mono:true, placeholder:'FL' },
    { key:'name', label:'Leave Type Name', required:true, placeholder:'Festival Leave' },
    { key:'daysPerYear', label:'Days Per Year', type:'number', default:0 },
    { key:'isPaid', label:'Paid Leave?', type:'checkbox', checkLabel:'Yes, this leave is paid', default:true },
    { key:'carryForward', label:'Carry Forward?', type:'checkbox', checkLabel:'Allow carry forward to next year', default:false },
    { key:'maxCarryDays', label:'Max Carry Forward Days', type:'number', default:0 },
  ]

  const TABS = [
    { id:'dept',   label:'🏢 Departments',  count:depts.length  },
    { id:'desig',  label:'👤 Designations', count:desigs.length },
    { id:'grades', label:'🏷️ Grades',       count:grades.length },
    { id:'shifts', label:'🕐 Shifts',        count:shifts.length },
    { id:'leaves', label:'🌴 Leave Types',   count:leaves.length },
  ]

  const addModal = (title, ep, setter, fields) =>
    setModal({ title, ep, setter, item:null, fields })
  const editModal = (title, ep, setter, fields, item) =>
    setModal({ title, ep, setter, item, fields })

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            HR Masters
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            SAP: HCM — Departments · Designations · Grades · Shifts · Leave Types
          </p>
        </div>
        <button onClick={()=>{
          const map = { dept:['departments',setDepts,DEPT_FIELDS,'Department'],
            desig:['designations',setDesigs,DESIG_FIELDS,'Designation'],
            grades:['grades',setGrades,GRADE_FIELDS,'Grade'],
            shifts:['shifts',setShifts,SHIFT_FIELDS,'Shift'],
            leaves:['leave-types',setLeaves,LEAVE_FIELDS,'Leave Type'] }
          const [ep,setter,fields,title] = map[tab]
          addModal(title,ep,setter,fields)
        }} style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + Add New</button>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Departments',  value:depts.length,  color:'#714B67', bg:'#EDE0EA' },
          { label:'Designations', value:desigs.length, color:'#0C5460', bg:'#D1ECF1' },
          { label:'Grades',       value:grades.length, color:'#856404', bg:'#FFF3CD' },
          { label:'Shifts',       value:shifts.length, color:'#155724', bg:'#D4EDDA' },
          { label:'Leave Types',  value:leaves.length, color:'#721C24', bg:'#F8D7DA' },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color, fontFamily:'Syne,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:'2px solid #E0D5E0', flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer',
              color:tab===t.id?'#714B67':'#6C757D',
              borderBottom:tab===t.id?'2px solid #714B67':'2px solid transparent', marginBottom:-2 }}>
            {t.label} <span style={{ fontSize:10, background:tab===t.id?'#EDE0EA':'#F0EEF0',
              color:tab===t.id?'#714B67':'#6C757D', padding:'1px 6px', borderRadius:10 }}>{t.count}</span>
          </div>
        ))}
      </div>

      {/* DEPARTMENTS */}
      {tab==='dept' && (
        <Table loading={loading} data={depts} empty="🏢 No departments — click '+ Add New'"
          cols={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Department Name' },
            { key:'headEmpCode', label:'HOD' },
            { key:'costCenter', label:'Cost Center' },
          ]}
          onEdit={row=>editModal('Department','departments',setDepts,DEPT_FIELDS,row)}
          onDelete={id=>del_('departments',setDepts,id)} />
      )}

      {/* DESIGNATIONS */}
      {tab==='desig' && (
        <Table loading={loading} data={desigs} empty="👤 No designations yet"
          cols={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Designation' },
            { key:'grade', label:'Grade', render:v=>v?<span style={{ padding:'2px 8px', borderRadius:10,
              fontSize:11, fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>{v}</span>:'—' },
            { key:'department', label:'Department' },
          ]}
          onEdit={row=>editModal('Designation','designations',setDesigs,DESIG_FIELDS,row)}
          onDelete={id=>del_('designations',setDesigs,id)} />
      )}

      {/* GRADES */}
      {tab==='grades' && (
        <Table loading={loading} data={grades} empty="🏷️ No grades yet"
          cols={[
            { key:'code', label:'Grade', mono:true },
            { key:'name', label:'Grade Name' },
            { key:'minSalary', label:'Min Salary (₹)',
              render:v=>v?`₹${Number(v).toLocaleString('en-IN')}`:'—' },
            { key:'maxSalary', label:'Max Salary (₹)',
              render:v=>v?`₹${Number(v).toLocaleString('en-IN')}`:'—' },
          ]}
          onEdit={row=>editModal('Grade','grades',setGrades,GRADE_FIELDS,row)}
          onDelete={id=>del_('grades',setGrades,id)} />
      )}

      {/* SHIFTS */}
      {tab==='shifts' && (
        <Table loading={loading} data={shifts} empty="🕐 No shifts yet"
          cols={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Shift Name' },
            { key:'startTime', label:'Start', render:v=><span style={{ fontFamily:'DM Mono,monospace' }}>{v}</span> },
            { key:'endTime', label:'End', render:v=><span style={{ fontFamily:'DM Mono,monospace' }}>{v}</span> },
            { key:'breakMins', label:'Break', render:v=>`${v} min` },
            { key:'totalMins', label:'Total', render:v=>{
              const h = Math.floor(v/60), m = v%60
              return `${h}h ${m>0?m+'m':''} (${v} min)`
            }},
          ]}
          onEdit={row=>editModal('Shift','shifts',setShifts,SHIFT_FIELDS,row)}
          onDelete={id=>del_('shifts',setShifts,id)} />
      )}

      {/* LEAVE TYPES */}
      {tab==='leaves' && (
        <Table loading={loading} data={leaves} empty="🌴 No leave types yet"
          cols={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Leave Type' },
            { key:'daysPerYear', label:'Days/Year' },
            { key:'isPaid', label:'Paid?', render:v=>(
              <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                background:v?'#D4EDDA':'#F8D7DA', color:v?'#155724':'#721C24' }}>
                {v?'Paid':'Unpaid'}
              </span>
            )},
            { key:'carryForward', label:'Carry Fwd?', render:(v,row)=>v?`Yes (max ${row.maxCarryDays}d)`:'No' },
          ]}
          onEdit={row=>editModal('Leave Type','leave-types',setLeaves,LEAVE_FIELDS,row)}
          onDelete={id=>del_('leave-types',setLeaves,id)} />
      )}

      {modal && <Modal title={modal.title} fields={modal.fields} item={modal.item}
        onSave={form=>save_(modal.ep,modal.setter,modal.item,form)}
        onCancel={()=>setModal(null)} />}
    </div>
  )
}
