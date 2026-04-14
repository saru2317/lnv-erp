import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif' }

const EXIT_TYPES    = ['Resignation','Retirement','Termination','Absconding','End of Contract']
const FNF_STATUSES  = ['Pending','Initiated','In Progress','Completed']
const NOTICE_STATUS = ['Serving','Served','Waived','Buyout','N/A']

const CHECKLIST_ITEMS = [
  'Resignation letter accepted',
  'Notice period tracked',
  'Exit interview done',
  'ID card returned',
  'Biometric deactivated',
  'Access cards cancelled',
  'Asset handover completed',
  'Pending claims settled',
  'PF transfer/withdrawal initiated',
  'Form 16 issued',
  'F&F settlement done',
  'Experience letter issued',
]

const FNF_COLOR = {
  'Pending':     '#856404',
  'Initiated':   '#0C5460',
  'In Progress': '#E06F39',
  'Completed':   '#155724',
}
const FNF_BG = {
  'Pending':     '#FFF3CD',
  'Initiated':   '#D1ECF1',
  'In Progress': '#FDE8D8',
  'Completed':   '#D4EDDA',
}

const TYPE_COLOR = {
  'Resignation':     '#E06F39',
  'Retirement':      '#2874A6',
  'Termination':     '#DC3545',
  'Absconding':      '#6C757D',
  'End of Contract': '#714B67',
}

// ── New Exit Modal ─────────────────────────────────────────
function NewExitModal({ employees, onSave, onCancel }) {
  const [form, setForm] = useState({
    empCode:'', empName:'', department:'', exitType:'Resignation',
    resignationDate:'', lastWorkingDay:'', noticeStatus:'Serving',
    fnfStatus:'Pending', exitInterviewDone:false, remarks:''
  })
  const [saving, setSaving] = useState(false)

  const selEmp = employees.find(e=>e.empCode===form.empCode)
  useEffect(()=>{
    if (selEmp) setForm(p=>({...p,
      empName: selEmp.name,
      department: selEmp.department||''
    }))
  }, [form.empCode])

  const F = f => ({ value:form[f]||'', style:inp,
    onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })

  const save = async () => {
    if (!form.empCode)       return toast.error('Select employee!')
    if (!form.exitType)      return toast.error('Select exit type!')
    if (!form.lastWorkingDay)return toast.error('Last working day required!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/exit`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:640,
        maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#DC3545', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
            fontSize:15, fontWeight:700 }}>🚪 New Exit / Separation</h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:20,
          display:'flex', flexDirection:'column', gap:14 }}>

          {/* Employee select */}
          <div style={{ background:'#FFF3CD', padding:'10px 14px', borderRadius:8,
            border:'1px solid #FFEEBA', fontSize:12, color:'#856404' }}>
            ⚠️ Initiating exit will deactivate the employee immediately.
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Employee *
              </label>
              <select value={form.empCode} style={{ ...inp, cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,empCode:e.target.value}))}>
                <option value="">-- Select Employee --</option>
                {employees.map(e=>(
                  <option key={e.empCode} value={e.empCode}>
                    {e.empCode} — {e.name} ({e.department||''})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Exit Type *
              </label>
              <select value={form.exitType} style={{ ...inp, cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,exitType:e.target.value}))}>
                {EXIT_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Resignation / Effective Date
              </label>
              <input type="date" {...F('resignationDate')} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Last Working Day *
              </label>
              <input type="date" {...F('lastWorkingDay')} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Notice Period Status
              </label>
              <select value={form.noticeStatus} style={{ ...inp, cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,noticeStatus:e.target.value}))}>
                {NOTICE_STATUS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                F&F Status
              </label>
              <select value={form.fnfStatus} style={{ ...inp, cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,fnfStatus:e.target.value}))}>
                {FNF_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, height:38 }}>
                <input type="checkbox" checked={form.exitInterviewDone}
                  onChange={e=>setForm(p=>({...p,exitInterviewDone:e.target.checked}))}
                  style={{ width:18, height:18, accentColor:'#714B67', cursor:'pointer' }} />
                <label style={{ fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  Exit Interview Done
                </label>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:4, textTransform:'uppercase' }}>
              Remarks
            </label>
            <textarea {...F('remarks')} rows={2}
              style={{ ...inp, resize:'vertical' }}
              placeholder="Reason for exit, notes..." />
          </div>
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel}
            style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
              border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px', background:saving?'#999':'#DC3545',
              color:'#fff', border:'none', borderRadius:6, fontSize:13,
              fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'🚪 Initiate Exit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function ExitManagement() {
  const nav = useNavigate()
  const [exits,     setExits]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selExit,   setSelExit]   = useState(null)
  const [saving,    setSaving]    = useState(false)

  const fetchExits = useCallback(async () => {
    setLoading(true)
    try {
      const [exitRes, empRes] = await Promise.all([
        fetch(`${BASE_URL}/exit`, { headers:authHdrs2() }),
        fetch(`${BASE_URL}/employees`, { headers:authHdrs2() }),
      ])
      const exitData = await exitRes.json()
      const empData  = await empRes.json()
      setExits(exitData.data||[])
      setEmployees(empData.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchExits() }, [])

  // Parse checklist
  const getChecklist = exit => {
    if (!exit) return CHECKLIST_ITEMS.map(label=>({label,done:false}))
    try { return JSON.parse(exit.checklist||'[]') } catch {
      return CHECKLIST_ITEMS.map(label=>({label,done:false}))
    }
  }

  const updateChecklist = async (checks) => {
    if (!selExit) return
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/exit/${selExit.id}`,
        { method:'PATCH', headers:authHdrs(),
          body:JSON.stringify({ checklist: checks }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSelExit(prev => ({ ...prev, checklist: JSON.stringify(checks) }))
      // Update in list
      setExits(prev => prev.map(e => e.id===selExit.id
        ? { ...e, checklist:JSON.stringify(checks) } : e))
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const updateStatus = async (field, value) => {
    if (!selExit) return
    try {
      const res = await fetch(`${BASE_URL}/exit/${selExit.id}`,
        { method:'PATCH', headers:authHdrs(),
          body:JSON.stringify({ [field]: value }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Updated!')
      setSelExit(prev=>({...prev,[field]:value}))
      setExits(prev=>prev.map(e=>e.id===selExit.id?{...e,[field]:value}:e))
    } catch(e){ toast.error(e.message) }
  }

  const checklist = getChecklist(selExit)
  const doneCount = checklist.filter(c=>c.done).length

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Exit Management <small>F&F · Separation · Checklist</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm"
            style={{ background:'#DC3545', border:'none' }}
            onClick={()=>setShowModal(true)}>
            🚪 New Exit
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:16 }}>
        {[
          { label:'Total Exits',   value:exits.length,
            color:'#714B67', bg:'#EDE0EA' },
          { label:'In Progress',
            value:exits.filter(e=>e.fnfStatus!=='Completed').length,
            color:'#856404', bg:'#FFF3CD' },
          { label:'F&F Pending',
            value:exits.filter(e=>e.fnfStatus==='Pending').length,
            color:'#DC3545', bg:'#F8D7DA' },
          { label:'Completed',
            value:exits.filter(e=>e.fnfStatus==='Completed').length,
            color:'#155724', bg:'#D4EDDA' },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, borderRadius:8,
            padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600,
              textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color,
              fontFamily:'Syne,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap:16 }}>
        {/* Exit List */}
        <div>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
          ) : exits.length===0 ? (
            <div style={{ padding:60, textAlign:'center', color:'#6C757D',
              background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🚪</div>
              <div style={{ fontWeight:700 }}>No exit records</div>
              <div style={{ fontSize:12, marginTop:4 }}>
                Click "New Exit" to initiate separation
              </div>
            </div>
          ) : (
            <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
              overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['Exit ID','Employee','Dept','Type','Last Working Day',
                      'Notice','F&F Status','Actions'].map(h=>(
                      <th key={h} style={{ padding:'10px 12px', fontSize:10,
                        fontWeight:700, color:'#6C757D', textAlign:'left',
                        textTransform:'uppercase', letterSpacing:.4,
                        whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exits.map((e,i)=>(
                    <tr key={e.id} style={{
                      borderBottom:'1px solid #F0EEF0', cursor:'pointer',
                      background: selExit?.id===e.id?'#EDE0EA':i%2===0?'#fff':'#FDFBFD' }}
                      onClick={()=>setSelExit(e)}>
                      <td style={{ padding:'10px 12px',
                        fontFamily:'DM Mono,monospace', fontWeight:700,
                        color:'#714B67', fontSize:12 }}>{e.exitId}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{e.empName}</div>
                        <div style={{ fontSize:10, color:'#6C757D' }}>{e.empCode}</div>
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:12 }}>{e.department}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ fontWeight:700, fontSize:12,
                          color:TYPE_COLOR[e.exitType]||'#6C757D' }}>
                          {e.exitType}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px', fontWeight:700, fontSize:12 }}>
                        {e.lastWorkingDay
                          ? new Date(e.lastWorkingDay).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ fontSize:12, fontWeight:600,
                          color:e.noticeStatus==='Served'?'#155724':
                            e.noticeStatus==='N/A'?'#6C757D':'#856404' }}>
                          {e.noticeStatus}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:10,
                          fontSize:11, fontWeight:700,
                          background:FNF_BG[e.fnfStatus]||'#F0EEF0',
                          color:FNF_COLOR[e.fnfStatus]||'#6C757D' }}>
                          {e.fnfStatus}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <button className="btn-xs pri"
                          onClick={ev=>{ ev.stopPropagation(); setSelExit(e) }}>
                          Process F&F
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Checklist Panel */}
        <div>
          {selExit ? (
            <div style={{ background:'#fff', borderRadius:8,
              border:'1px solid #E0D5E0', overflow:'hidden',
              boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              {/* Panel header */}
              <div style={{ padding:'12px 16px', background:'#F8F4F8',
                borderBottom:'1px solid #E0D5E0' }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#1C1C1C' }}>
                  🚪 {selExit.empName}
                </div>
                <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
                  {selExit.exitId} · {selExit.exitType} ·
                  LWD: {selExit.lastWorkingDay
                    ? new Date(selExit.lastWorkingDay).toLocaleDateString('en-IN') : '—'}
                </div>
              </div>

              {/* Status updates */}
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #F0EEF0',
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#6C757D',
                    display:'block', marginBottom:3, textTransform:'uppercase' }}>
                    F&F Status
                  </label>
                  <select value={selExit.fnfStatus||'Pending'}
                    style={{ ...inp, fontSize:11 }}
                    onChange={e=>updateStatus('fnfStatus',e.target.value)}>
                    {FNF_STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:'#6C757D',
                    display:'block', marginBottom:3, textTransform:'uppercase' }}>
                    Notice Status
                  </label>
                  <select value={selExit.noticeStatus||'Serving'}
                    style={{ ...inp, fontSize:11 }}
                    onChange={e=>updateStatus('noticeStatus',e.target.value)}>
                    {NOTICE_STATUS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Checklist */}
              <div style={{ padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#714B67' }}>
                    Exit Checklist
                  </div>
                  <span style={{ fontSize:11, color:'#6C757D' }}>
                    {doneCount}/{checklist.length} done
                    {saving && ' · saving...'}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ background:'#F0EEF0', borderRadius:4,
                  height:7, marginBottom:12, overflow:'hidden' }}>
                  <div style={{ width:`${doneCount/checklist.length*100}%`,
                    height:'100%', borderRadius:4, background:'#28A745',
                    transition:'width .3s' }} />
                </div>

                {checklist.map((c,i)=>(
                  <div key={c.label} style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    padding:'7px 0', borderBottom:'1px solid #F0EEF0',
                    background:c.done?'#F0FFF8':'inherit',
                    borderRadius:c.done?'4px':'0',
                    paddingLeft:c.done?'6px':'0', transition:'all .2s' }}>
                    <input type="checkbox" checked={c.done}
                      onChange={()=>{
                        const updated = checklist.map((x,j)=>
                          j===i?{...x,done:!x.done}:x)
                        updateChecklist(updated)
                      }}
                      style={{ width:'16px', height:'16px',
                        accentColor:'#28A745', cursor:'pointer', flexShrink:0 }} />
                    <span style={{ fontSize:'12px', fontWeight:'600',
                      textDecoration:c.done?'line-through':'none',
                      color:c.done?'#6C757D':'#1C1C1C', flex:1 }}>
                      {c.label}
                    </span>
                    {c.done && <span style={{ color:'#28A745', fontSize:14 }}>✓</span>}
                  </div>
                ))}

                {doneCount===checklist.length && (
                  <div style={{ marginTop:12, background:'#D4EDDA',
                    padding:'10px 12px', borderRadius:8, textAlign:'center',
                    fontSize:13, fontWeight:700, color:'#155724' }}>
                    🎉 All exit formalities completed!
                    <div style={{ fontSize:11, fontWeight:400, marginTop:3 }}>
                      Mark F&F as Completed above
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding:40, textAlign:'center', color:'#6C757D',
              background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>👈</div>
              <div style={{ fontSize:12, fontWeight:600 }}>
                Select an exit record to view checklist
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewExitModal
          employees={employees}
          onSave={()=>{ setShowModal(false); fetchExits() }}
          onCancel={()=>setShowModal(false)} />
      )}
    </div>
  )
}
