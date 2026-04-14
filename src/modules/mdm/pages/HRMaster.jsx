import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4,
  textTransform:'uppercase', letterSpacing:.4 }

// ── Helper — time to mins ─────────────────────────────────
function timeToMins(t) {
  if (!t) return 0
  const [h,m] = t.split(':').map(Number)
  return h*60+m
}
function minsToHHMM(m) {
  if (!m&&m!==0) return '—'
  const h = Math.floor(Math.abs(m)/60)
  const min = Math.abs(m)%60
  return `${h}h ${min>0?min+'m':''}`
}
function calcMins(start, end, breakMins, breakIncluded) {
  let total = timeToMins(end) - timeToMins(start)
  if (total < 0) total += 24*60
  const net = breakIncluded ? total - (parseInt(breakMins)||0) : total
  return { totalMins: total, netWorkMins: net }
}

// ── Toggle ─────────────────────────────────────────────────
function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div onClick={()=>onChange(!value)}
        style={{ width:42, height:22, borderRadius:11, cursor:'pointer', position:'relative',
          background:value?'#714B67':'#CCC', transition:'background .2s' }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, left:value?23:3, transition:'left .2s' }} />
      </div>
      {label && <span style={{ fontSize:12, color:value?'#714B67':'#6C757D', fontWeight:600 }}>{label}</span>}
    </div>
  )
}

// ── Shift Form Modal ───────────────────────────────────────
function ShiftForm({ item, onSave, onCancel }) {
  const isEdit = !!item?.id
  const [form, setForm] = useState(item || {
    code:'', name:'', shiftType:'FIXED', applicableTo:'ALL',
    startTime:'08:00', endTime:'17:40',
    breakMins:40, breakIncluded:true,
    flexiCoreStart:'10:00', flexiCoreEnd:'16:00',
    flexiBandStart:'07:00', flexiBandEnd:'21:00',
    minDailyMins:510, minWeeklyMins:2550,
    weeklyCarryOver:false, permMonthlyHrs:4,
    permAllowedSlot:'SHIFT_START_END',
    otEligible:true, otStartAfterMins:30
  })
  const [saving, setSaving] = useState(false)

  const F = f => ({ value:form[f]??'', onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    style:inp, onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })

  // Auto-calculate mins when timing changes
  const { totalMins, netWorkMins } = calcMins(
    form.startTime, form.endTime, form.breakMins, form.breakIncluded)

  const save = async () => {
    if (!form.code||!form.name||!form.startTime||!form.endTime)
      return toast.error('Code, Name, Start & End Time required!')
    setSaving(true)
    try {
      const payload = { ...form,
        breakMins: parseInt(form.breakMins)||0,
        minDailyMins: form.minDailyMins?parseInt(form.minDailyMins):null,
        minWeeklyMins: form.minWeeklyMins?parseInt(form.minWeeklyMins):null,
        permMonthlyHrs: parseFloat(form.permMonthlyHrs)||4,
        otStartAfterMins: parseInt(form.otStartAfterMins)||30
      }
      const url    = isEdit?`${BASE_URL}/hr-master/shifts/${item.id}`:`${BASE_URL}/hr-master/shifts`
      const method = isEdit?'PATCH':'POST'
      const res    = await fetch(url,{method,headers:authHdrs(),body:JSON.stringify(payload)})
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit?'Shift updated!':'Shift created!')
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const isFlexiShift = form.shiftType === 'FLEXI'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:680, maxHeight:'92vh',
        overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
              {isEdit?`Edit — ${item.code}`:'+ New Shift'}
            </h3>
            <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
              Fixed shift or Flexi shift with core hours
            </p>
          </div>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:20, display:'flex', flexDirection:'column', gap:14 }}>

          {/* Basic info */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
            <div><label style={lbl}>Shift Code *</label>
              <input {...F('code')} placeholder="G" disabled={isEdit}
                style={{ ...inp, fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:16 }} /></div>
            <div><label style={lbl}>Shift Name *</label>
              <input {...F('name')} placeholder="General Shift" /></div>
          </div>

          {/* Shift Type */}
          <div>
            <label style={lbl}>Shift Type</label>
            <div style={{ display:'flex', gap:10 }}>
              {[['FIXED','⏰ Fixed Shift','Regular fixed start/end time'],
                ['FLEXI','🔀 Flexi Shift','Flexible timing with core hours']].map(([v,l,d])=>(
                <div key={v} onClick={()=>setForm(p=>({...p,shiftType:v}))}
                  style={{ flex:1, padding:'10px 14px', borderRadius:8, cursor:'pointer',
                    border: form.shiftType===v?'2px solid #714B67':'1px solid #E0D5E0',
                    background: form.shiftType===v?'#EDE0EA':'#fff' }}>
                  <div style={{ fontWeight:700, fontSize:13,
                    color:form.shiftType===v?'#714B67':'#1C1C1C' }}>{l}</div>
                  <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Applicable To */}
          <div>
            <label style={lbl}>Applicable To</label>
            <div style={{ display:'flex', gap:8 }}>
              {['ALL','STAFF','WORKER'].map(v=>(
                <div key={v} onClick={()=>setForm(p=>({...p,applicableTo:v}))}
                  style={{ padding:'6px 16px', borderRadius:20, cursor:'pointer', fontSize:12,
                    fontWeight:600,
                    border: form.applicableTo===v?'2px solid #714B67':'1px solid #E0D5E0',
                    background: form.applicableTo===v?'#714B67':'#fff',
                    color: form.applicableTo===v?'#fff':'#6C757D' }}>{v}</div>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div style={{ background:'#F8F4F8', borderRadius:8, padding:14,
            border:'1px solid #E0D5E0' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:12 }}>
              ⏰ Shift Timing
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
              <div><label style={lbl}>Start Time *</label>
                <input {...F('startTime')} type="time" /></div>
              <div><label style={lbl}>End Time *</label>
                <input {...F('endTime')} type="time" /></div>
              <div><label style={lbl}>Break / Lunch (mins)</label>
                <input type="number" value={form.breakMins||0} min="0" max="120"
                  onChange={e=>setForm(p=>({...p,breakMins:parseInt(e.target.value)||0}))}
                  style={inp}
                  onFocus={e=>e.target.style.borderColor='#714B67'}
                  onBlur={e=>e.target.style.borderColor='#E0D5E0'} /></div>
              <div><label style={lbl}>Break Included?</label>
                <Toggle value={form.breakIncluded}
                  onChange={v=>setForm(p=>({...p,breakIncluded:v}))}
                  label={form.breakIncluded?'Inclusive':'Exclusive'} /></div>
            </div>

            {/* Live calculation */}
            <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              gap:10 }}>
              {[
                ['Total Presence', `${minsToHHMM(totalMins)} (${totalMins} min)`, '#0C5460', '#D1ECF1'],
                ['Break',          `${form.breakMins||0} min`,                    '#856404', '#FFF3CD'],
                ['Net Duty Hrs',   `${minsToHHMM(netWorkMins)} (${netWorkMins} min)`, '#155724', '#D4EDDA'],
              ].map(([l,v,c,bg])=>(
                <div key={l} style={{ background:bg, borderRadius:6, padding:'8px 12px',
                  textAlign:'center' }}>
                  <div style={{ fontSize:10, color:c, fontWeight:700,
                    textTransform:'uppercase' }}>{l}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:c,
                    fontFamily:'Syne,sans-serif', marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Break explanation */}
            <div style={{ marginTop:8, fontSize:11, color:'#6C757D',
              background:'#fff', padding:'6px 10px', borderRadius:6 }}>
              {form.breakIncluded
                ? `✅ INCLUSIVE: Employee present ${minsToHHMM(totalMins)}, 
                   lunch within that time. Duty = ${minsToHHMM(netWorkMins)}`
                : `⚠️ EXCLUSIVE: Employee must complete ${minsToHHMM(netWorkMins)} duty 
                   PLUS ${form.breakMins||0} min lunch separately`}
            </div>
          </div>

          {/* FLEXI specific settings */}
          {isFlexiShift && (
            <div style={{ background:'#EDE0EA', borderRadius:8, padding:14,
              border:'1px solid #D4BFCF' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#714B67', marginBottom:12 }}>
                🔀 Flexi Shift Settings
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12,
                marginBottom:12 }}>
                <div><label style={lbl}>Core Hours Start</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input {...F('flexiCoreStart')} type="time" />
                    <span style={{ fontSize:10, color:'#714B67', whiteSpace:'nowrap' }}>Must present from</span>
                  </div>
                </div>
                <div><label style={lbl}>Core Hours End</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input {...F('flexiCoreEnd')} type="time" />
                    <span style={{ fontSize:10, color:'#714B67', whiteSpace:'nowrap' }}>Must present till</span>
                  </div>
                </div>
                <div><label style={lbl}>Band Start (Earliest IN)</label>
                  <input {...F('flexiBandStart')} type="time" /></div>
                <div><label style={lbl}>Band End (Latest OUT)</label>
                  <input {...F('flexiBandEnd')} type="time" /></div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12,
                marginBottom:12 }}>
                <div><label style={lbl}>Min Daily Duty (mins)</label>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="number" value={form.minDailyMins||510}
                      onChange={e=>setForm(p=>({...p,minDailyMins:parseInt(e.target.value)||0,
                        minWeeklyMins:(parseInt(e.target.value)||0)*5}))}
                      style={{ ...inp, width:90 }}
                      onFocus={e=>e.target.style.borderColor='#714B67'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    <span style={{ fontSize:11, color:'#6C757D' }}>
                      = {minsToHHMM(form.minDailyMins||510)}
                    </span>
                  </div>
                </div>
                <div><label style={lbl}>Min Weekly Duty (mins)</label>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="number" value={form.minWeeklyMins||2550}
                      onChange={e=>setForm(p=>({...p,minWeeklyMins:parseInt(e.target.value)||0}))}
                      style={{ ...inp, width:90 }}
                      onFocus={e=>e.target.style.borderColor='#714B67'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                    <span style={{ fontSize:11, color:'#6C757D' }}>
                      = {minsToHHMM(form.minWeeklyMins||2550)}
                    </span>
                  </div>
                </div>
                <div><label style={lbl}>Weekly Carry Over</label>
                  <Toggle value={form.weeklyCarryOver}
                    onChange={v=>setForm(p=>({...p,weeklyCarryOver:v}))}
                    label={form.weeklyCarryOver?'Yes — carry excess hrs':'No — daily strict'} />
                </div>
              </div>

              {/* Permission in flexi */}
              <div style={{ background:'#fff', borderRadius:6, padding:12,
                border:'1px solid #E0D5E0' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  marginBottom:10 }}>🕐 Permission Policy (Flexi)</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={lbl}>Monthly Permission Hours</label>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="number" value={form.permMonthlyHrs||4} step="0.5"
                        onChange={e=>setForm(p=>({...p,permMonthlyHrs:parseFloat(e.target.value)||4}))}
                        style={{ ...inp, width:80 }}
                        onFocus={e=>e.target.style.borderColor='#714B67'}
                        onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                      <span style={{ fontSize:11, color:'#6C757D' }}>hrs/month bank</span>
                    </div>
                  </div>
                  <div><label style={lbl}>Allowed Slot</label>
                    <select value={form.permAllowedSlot||'SHIFT_START_END'}
                      onChange={e=>setForm(p=>({...p,permAllowedSlot:e.target.value}))}
                      style={{ ...inp, cursor:'pointer' }}>
                      <option value="SHIFT_START">Shift Start only (Late IN)</option>
                      <option value="SHIFT_END">Shift End only (Early OUT)</option>
                      <option value="SHIFT_START_END">Shift Start & End (Both)</option>
                      <option value="ANYTIME">Anytime (except core hours)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Flexi logic explanation */}
              <div style={{ marginTop:10, background:'#F8F4F8', borderRadius:6,
                padding:'8px 12px', fontSize:11, color:'#6C757D', lineHeight:1.8 }}>
                📖 <strong>Flexi Logic:</strong> Employee can arrive between {form.flexiBandStart||'07:00'}–{form.flexiCoreStart||'10:00'}.
                Must be present {form.flexiCoreStart||'10:00'}–{form.flexiCoreEnd||'16:00'} (core hours).
                Must complete <strong>{minsToHHMM(form.minDailyMins||510)}</strong> net duty.
                {form.weeklyCarryOver && ' Weekly carry-over enabled — short days compensated by extra days.'}
              </div>
            </div>
          )}

          {/* OT Settings */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>OT Eligible</label>
              <Toggle value={form.otEligible}
                onChange={v=>setForm(p=>({...p,otEligible:v}))}
                label={form.otEligible?'Yes — OT applicable':'No OT for this shift'} />
            </div>
            {form.otEligible && (
              <div><label style={lbl}>Min OT Minutes to qualify</label>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <input type="number" value={form.otStartAfterMins||30}
                    onChange={e=>setForm(p=>({...p,otStartAfterMins:parseInt(e.target.value)||30}))}
                    style={{ ...inp, width:80 }}
                    onFocus={e=>e.target.style.borderColor='#714B67'}
                    onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                  <span style={{ fontSize:11, color:'#6C757D' }}>
                    mins extra = OT
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'#F8F7FA' }}>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            Net Duty: <strong>{minsToHHMM(netWorkMins)}</strong> |
            Total Presence: <strong>{minsToHHMM(totalMins)}</strong> |
            Break: <strong>{form.breakMins||0} min {form.breakIncluded?'(inclusive)':'(exclusive)'}</strong>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:6,
              fontSize:13, cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
                color:'#fff', border:'none', borderRadius:6, fontSize:13,
                fontWeight:700, cursor:'pointer' }}>
              {saving?'⏳ Saving...':'💾 Save Shift'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Generic Modal ──────────────────────────────────────────
function Modal({ title, fields, item, onSave, onCancel }) {
  const isEdit = !!item?.id
  const init = fields.reduce((a,f)=>({...a,[f.key]:item?.[f.key]??f.default??''}),{})
  const [form, setForm] = useState(init)
  const [saving, setSaving] = useState(false)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:500, overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px', display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
            fontSize:15, fontWeight:700 }}>
            {isEdit?`Edit — ${item.code||item.name}`:`+ New ${title}`}</h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12,
          maxHeight:480, overflowY:'auto' }}>
          {fields.map(f=>(
            <div key={f.key}>
              <label style={lbl}>{f.label}{f.required?' *':''}</label>
              {f.type==='select'?(
                <select value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, cursor:'pointer' }}>
                  {f.options.map(o=>typeof o==='object'?
                    <option key={o.value} value={o.value}>{o.label}</option>:
                    <option key={o}>{o}</option>)}
                </select>
              ):f.type==='number'?(
                <input type="number" value={form[f.key]||''} min={f.min||0}
                  onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={inp} placeholder={f.placeholder||''}
                  onFocus={e=>e.target.style.borderColor='#714B67'}
                  onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
              ):f.type==='checkbox'?(
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={!!form[f.key]}
                    onChange={e=>setForm(p=>({...p,[f.key]:e.target.checked}))}
                    style={{ width:16, height:16, cursor:'pointer', accentColor:'#714B67' }} />
                  <span style={{ fontSize:12, color:'#6C757D' }}>{f.checkLabel||''}</span>
                </div>
              ):(
                <input value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{ ...inp, ...(f.mono&&{fontFamily:'DM Mono,monospace'}) }}
                  disabled={isEdit&&f.isCode} placeholder={f.placeholder||''}
                  onFocus={e=>e.target.style.borderColor='#714B67'}
                  onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
              )}
            </div>
          ))}
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff',
            color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:6,
            fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button disabled={saving} onClick={async()=>{
            const req=fields.find(f=>f.required&&!form[f.key])
            if(req) return toast.error(`${req.label} required!`)
            setSaving(true)
            try { await onSave(form) } catch(e){ toast.error(e.message) } finally { setSaving(false) }
          }} style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
            color:'#fff', border:'none', borderRadius:6, fontSize:13,
            fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'💾 Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Table ──────────────────────────────────────────────────
function Table({ cols, data, loading, onEdit, onDelete, empty }) {
  return (
    <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead style={{ background:'#F8F4F8' }}>
          <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
            {cols.map(c=><th key={c.key} style={{ padding:'10px 12px', fontSize:10,
              fontWeight:700, color:'#6C757D', textAlign:'left',
              textTransform:'uppercase', letterSpacing:.4 }}>{c.label}</th>)}
            <th style={{ padding:'10px 12px', fontSize:10, fontWeight:700,
              color:'#6C757D', textAlign:'right', textTransform:'uppercase' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {loading?<tr><td colSpan={cols.length+1} style={{ padding:30,
            textAlign:'center', color:'#6C757D' }}>⏳ Loading...</td></tr>
          :data.length===0?<tr><td colSpan={cols.length+1} style={{ padding:30,
            textAlign:'center', color:'#6C757D', fontSize:12 }}>{empty}</td></tr>
          :data.map((row,i)=>(
            <tr key={row.id} style={{ borderBottom:'1px solid #F0EEF0',
              background:i%2===0?'#fff':'#FDFBFD' }}
              onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
              {cols.map(c=>(
                <td key={c.key} style={{ padding:'9px 12px', fontSize:12,
                  ...(c.mono&&{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}) }}>
                  {c.render?c.render(row[c.key],row):(row[c.key]!=null?String(row[c.key]):'—')}
                </td>
              ))}
              <td style={{ padding:'9px 12px', textAlign:'right' }}>
                <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                  <button onClick={()=>onEdit(row)} style={{ padding:'3px 10px',
                    background:'#714B67', color:'#fff', border:'none', borderRadius:4,
                    fontSize:11, cursor:'pointer' }}>Edit</button>
                  <button onClick={()=>onDelete(row.id)} style={{ padding:'3px 8px',
                    background:'#fff', color:'#DC3545', border:'1px solid #DC3545',
                    borderRadius:4, fontSize:11, cursor:'pointer' }}>×</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function HRMaster() {
  const [tab,    setTab]   = useState('dept')
  const [depts,  setDepts] = useState([])
  const [desigs, setDesigs]= useState([])
  const [grades, setGrades]= useState([])
  const [shifts, setShifts]= useState([])
  const [leaves, setLeaves]= useState([])
  const [loading,setLoading]=useState(false)
  const [modal,  setModal] = useState(null)
  const [shiftForm,setShiftForm]=useState(null) // null | 'new' | shift object

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

  const TABS = [
    { id:'dept',   label:'🏢 Departments',  count:depts.length  },
    { id:'desig',  label:'👤 Designations', count:desigs.length },
    { id:'grades', label:'🏷️ Grades',        count:grades.length },
    { id:'shifts', label:'🕐 Shifts',         count:shifts.length },
    { id:'leaves', label:'🌴 Leave Types',    count:leaves.length },
  ]

  const DEPT_FIELDS = [
    { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'MFG' },
    { key:'name', label:'Department Name', required:true, placeholder:'Manufacturing' },
    { key:'headEmpCode', label:'HOD Employee Code', placeholder:'EMP-001' },
    { key:'costCenter', label:'Cost Center', placeholder:'CC-MFG' },
  ]
  const DESIG_FIELDS = [
    { key:'code', label:'Code', required:true, isCode:true, mono:true, placeholder:'TL' },
    { key:'name', label:'Designation Name', required:true, placeholder:'Team Lead' },
    { key:'grade', label:'Grade', placeholder:'G4' },
    { key:'department', label:'Department', type:'select',
      options:['', ...depts.map(d=>d.code)] },
  ]
  const GRADE_FIELDS = [
    { key:'code', label:'Grade Code', required:true, isCode:true, mono:true, placeholder:'G5' },
    { key:'name', label:'Grade Name', required:true, placeholder:'Senior Executive' },
    { key:'minSalary', label:'Min Salary (₹)', type:'number', placeholder:'40000' },
    { key:'maxSalary', label:'Max Salary (₹)', type:'number', placeholder:'60000' },
  ]
  const LEAVE_FIELDS = [
    { key:'code', label:'Leave Code', required:true, isCode:true, mono:true, placeholder:'FL' },
    { key:'name', label:'Leave Type Name', required:true, placeholder:'Festival Leave' },
    { key:'daysPerYear', label:'Days Per Year', type:'number', default:0 },
    { key:'isPaid', label:'Paid Leave?', type:'checkbox',
      checkLabel:'Yes, this leave is paid', default:true },
    { key:'carryForward', label:'Carry Forward?', type:'checkbox',
      checkLabel:'Allow carry forward to next year', default:false },
    { key:'maxCarryDays', label:'Max Carry Forward Days', type:'number', default:0 },
  ]

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800,
            color:'#1C1C1C', margin:0 }}>HR Masters</h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            SAP: HCM — Departments · Designations · Grades · Shifts · Leave Types
          </p>
        </div>
        <button onClick={()=>{
          if (tab==='shifts') { setShiftForm('new'); return }
          const map = {
            dept:['departments',setDepts,DEPT_FIELDS,'Department'],
            desig:['designations',setDesigs,DESIG_FIELDS,'Designation'],
            grades:['grades',setGrades,GRADE_FIELDS,'Grade'],
            leaves:['leave-types',setLeaves,LEAVE_FIELDS,'Leave Type']
          }
          if (map[tab]) {
            const [ep,setter,fields,title] = map[tab]
            setModal({title,ep,setter,item:null,fields})
          }
        }} style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
          border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + Add New
        </button>
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
          <div key={k.label} style={{ background:k.bg, borderRadius:8, padding:'12px 16px',
            border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600,
              textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color,
              fontFamily:'Syne,sans-serif' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:16,
        borderBottom:'2px solid #E0D5E0', flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'8px 16px', fontSize:12, fontWeight:600, cursor:'pointer',
              color:tab===t.id?'#714B67':'#6C757D',
              borderBottom:tab===t.id?'2px solid #714B67':'2px solid transparent',
              marginBottom:-2 }}>
            {t.label}&nbsp;
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10,
              background:tab===t.id?'#EDE0EA':'#F0EEF0',
              color:tab===t.id?'#714B67':'#6C757D' }}>{t.count}</span>
          </div>
        ))}
      </div>

      {/* DEPARTMENTS */}
      {tab==='dept' && (
        <Table loading={loading} data={depts} empty="🏢 No departments"
          cols={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Department Name' },
            { key:'headEmpCode', label:'HOD' },
            { key:'costCenter', label:'Cost Center' },
          ]}
          onEdit={row=>setModal({title:'Department',ep:'departments',setter:setDepts,
            item:row,fields:DEPT_FIELDS})}
          onDelete={id=>del_('departments',setDepts,id)} />
      )}

      {/* DESIGNATIONS */}
      {tab==='desig' && (
        <Table loading={loading} data={desigs} empty="👤 No designations"
          cols={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Designation' },
            { key:'grade', label:'Grade', render:v=>v?<span style={{ padding:'2px 8px',
              borderRadius:10, fontSize:11, fontWeight:600, background:'#EDE0EA',
              color:'#714B67' }}>{v}</span>:'—' },
            { key:'department', label:'Department' },
          ]}
          onEdit={row=>setModal({title:'Designation',ep:'designations',setter:setDesigs,
            item:row,fields:DESIG_FIELDS})}
          onDelete={id=>del_('designations',setDesigs,id)} />
      )}

      {/* GRADES */}
      {tab==='grades' && (
        <Table loading={loading} data={grades} empty="🏷️ No grades"
          cols={[
            { key:'code', label:'Grade', mono:true },
            { key:'name', label:'Grade Name' },
            { key:'minSalary', label:'Min Salary',
              render:v=>v?`₹${Number(v).toLocaleString('en-IN')}`:'—' },
            { key:'maxSalary', label:'Max Salary',
              render:v=>v?`₹${Number(v).toLocaleString('en-IN')}`:'—' },
          ]}
          onEdit={row=>setModal({title:'Grade',ep:'grades',setter:setGrades,
            item:row,fields:GRADE_FIELDS})}
          onDelete={id=>del_('grades',setGrades,id)} />
      )}

      {/* SHIFTS — Special table with flexi details */}
      {tab==='shifts' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Code','Shift Name','Type','For','Timing','Break','Net Duty','OT','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                    letterSpacing:.4, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((s,i)=>(
                <tr key={s.id} style={{ borderBottom:'1px solid #F0EEF0',
                  background: s.shiftType==='FLEXI'?'#F8F4F8':i%2===0?'#fff':'#FDFBFD' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                  onMouseLeave={e=>e.currentTarget.style.background=
                    s.shiftType==='FLEXI'?'#F8F4F8':i%2===0?'#fff':'#FDFBFD'}>
                  <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace',
                    fontWeight:700, color:'#714B67', fontSize:13 }}>{s.code}</td>
                  <td style={{ padding:'10px 12px', fontWeight:600, fontSize:13 }}>{s.name}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11,
                      fontWeight:700,
                      background: s.shiftType==='FLEXI'?'#EDE0EA':'#D1ECF1',
                      color: s.shiftType==='FLEXI'?'#714B67':'#0C5460' }}>
                      {s.shiftType==='FLEXI'?'🔀 Flexi':'⏰ Fixed'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:11, color:'#6C757D' }}>
                    {s.applicableTo||'ALL'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12,
                    fontFamily:'DM Mono,monospace' }}>
                    {s.shiftType==='FLEXI'
                      ? `${s.flexiCoreStart}–${s.flexiCoreEnd} core`
                      : `${s.startTime}–${s.endTime}`}
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>
                    {s.breakMins} min
                    <span style={{ fontSize:10, color:'#6C757D', marginLeft:4 }}>
                      ({s.breakIncluded?'incl.':'excl.'})
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:12, fontWeight:700,
                    color:'#155724' }}>
                    {minsToHHMM(s.netWorkMins)}
                    {s.shiftType==='FLEXI' && (
                      <div style={{ fontSize:10, color:'#6C757D' }}>
                        Weekly: {minsToHHMM(s.minWeeklyMins)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                      fontWeight:600,
                      background: s.otEligible?'#D4EDDA':'#F0EEF0',
                      color: s.otEligible?'#155724':'#6C757D' }}>
                      {s.otEligible?'OT Yes':'No OT'}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>setShiftForm(s)}
                        style={{ padding:'3px 10px', background:'#714B67', color:'#fff',
                          border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>
                        Edit</button>
                      <button onClick={()=>del_('shifts',setShifts,s.id)}
                        style={{ padding:'3px 8px', background:'#fff', color:'#DC3545',
                          border:'1px solid #DC3545', borderRadius:4, fontSize:11,
                          cursor:'pointer' }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
              {shifts.length===0&&!loading&&(
                <tr><td colSpan={9} style={{ padding:40, textAlign:'center',
                  color:'#6C757D' }}>🕐 No shifts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LEAVE TYPES */}
      {tab==='leaves' && (
        <Table loading={loading} data={leaves} empty="🌴 No leave types"
          cols={[
            { key:'code', label:'Code', mono:true },
            { key:'name', label:'Leave Type' },
            { key:'daysPerYear', label:'Days/Year' },
            { key:'isPaid', label:'Paid?', render:v=>(
              <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                fontWeight:600, background:v?'#D4EDDA':'#F8D7DA',
                color:v?'#155724':'#721C24' }}>
                {v?'Paid':'Unpaid'}
              </span>
            )},
            { key:'carryForward', label:'Carry Fwd?',
              render:(v,row)=>v?`Yes (max ${row.maxCarryDays}d)`:'No' },
          ]}
          onEdit={row=>setModal({title:'Leave Type',ep:'leave-types',setter:setLeaves,
            item:row,fields:LEAVE_FIELDS})}
          onDelete={id=>del_('leave-types',setLeaves,id)} />
      )}

      {/* Shift Form Modal */}
      {shiftForm && (
        <ShiftForm
          item={shiftForm==='new'?null:shiftForm}
          onSave={()=>{ setShiftForm(null); fetch_('shifts',setShifts) }}
          onCancel={()=>setShiftForm(null)} />
      )}

      {/* Generic Modal */}
      {modal && (
        <Modal title={modal.title} fields={modal.fields} item={modal.item}
          onSave={form=>save_(modal.ep,modal.setter,modal.item,form)}
          onCancel={()=>setModal(null)} />
      )}
    </div>
  )
}
