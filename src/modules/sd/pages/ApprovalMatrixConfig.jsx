// ═══════════════════════════════════════════════════════════════════
// LNV ERP — Config / ApprovalMatrixConfig.jsx
// Admin-configurable approval matrix: per docType + amount slab
// Define who approves what — Finance Head, GM, MD, Accounts, etc.
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const fmtC = n => n==null ? '∞' : '₹' + Number(n).toLocaleString('en-IN')

const DOC_TYPES = [
  { value:'INVOICE', label:'🧾 Sales Invoice',     color:'#714B67' },
  { value:'SO',      label:'📋 Sales Order',        color:'#1A5276' },
  { value:'PO',      label:'📦 Purchase Order',     color:'#196F3D' },
  { value:'PR',      label:'📝 Purchase Indent',    color:'#784212' },
  { value:'PV',      label:'💰 Payment Voucher',    color:'#6C3483' },
  { value:'GRN',     label:'🏭 Goods Receipt',      color:'#117A65' },
  { value:'DC',      label:'🚚 Delivery Challan',   color:'#1F618D' },
]

const ROLES = [
  { value:'ADMIN',      label:'Admin / MD'          },
  { value:'MANAGER',    label:'General Manager'      },
  { value:'ACCOUNTS',   label:'Accounts / Finance'   },
  { value:'SALES',      label:'Sales Manager'        },
  { value:'HR',         label:'HR Manager'           },
  { value:'OPERATIONS', label:'Operations Manager'   },
  { value:'PRODUCTION', label:'Production Manager'   },
]

const BLANK_LEVEL = { roleName:'', roles:[], anyUser:true, specificUserId:null }
const BLANK_RULE  = {
  docType:'INVOICE', description:'', amtFrom:0, amtTo:'',
  levels:[{ ...BLANK_LEVEL, roleName:'Finance Head', roles:['ACCOUNTS'] }]
}

const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase' }

export default function ApprovalMatrixConfig() {
  const [rules,   setRules]   = useState([])
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')
  const [modal,   setModal]   = useState(null)  // null | 'new' | rule object (edit)
  const [form,    setForm]    = useState(BLANK_RULE)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    load()
    fetch(`${BASE}/users`, { headers:hdr2() }).then(r=>r.json())
      .then(d=>setUsers(d.data||d||[])).catch(()=>{})
  }, [])

  const load = () => {
    setLoading(true)
    fetch(`${BASE}/approval-matrix`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setRules(d.data||[]))
      .catch(()=>toast.error('Failed to load rules'))
      .finally(()=>setLoading(false))
  }

  const openNew  = () => { setForm({ ...BLANK_RULE, levels:[{ ...BLANK_LEVEL }] }); setModal('new') }
  const openEdit = (r) => {
    const levels = Array.isArray(r.levels) ? r.levels : JSON.parse(r.levels||'[]')
    setForm({ ...r, levels })
    setModal(r)
  }

  const sf = (k,v) => setForm(f=>({ ...f, [k]:v }))

  // Level helpers
  const addLevel = () => setForm(f=>({ ...f, levels:[...f.levels, { ...BLANK_LEVEL }] }))
  const delLevel = (i) => setForm(f=>({ ...f, levels:f.levels.filter((_,idx)=>idx!==i) }))
  const updLevel = (i,k,v) => setForm(f=>({
    ...f, levels:f.levels.map((l,idx)=>idx===i?{ ...l,[k]:v }:l)
  }))
  const toggleRole = (i, role) => {
    const cur = form.levels[i].roles||[]
    updLevel(i, 'roles', cur.includes(role) ? cur.filter(r=>r!==role) : [...cur, role])
  }

  const save = async () => {
    if (!form.docType) return toast.error('Select document type')
    if (!form.levels?.length) return toast.error('Add at least one approval level')
    if (form.levels.some(l=>!l.roleName||!l.roles?.length))
      return toast.error('Each level needs a name and at least one role')
    setSaving(true)
    try {
      const payload = {
        docType:     form.docType,
        description: form.description || null,
        amtFrom:     parseFloat(form.amtFrom||0),
        amtTo:       form.amtTo!==''&&form.amtTo!=null ? parseFloat(form.amtTo) : null,
        levels:      form.levels,
        isActive:    true,
      }
      const isEdit = modal && modal !== 'new'
      const url    = isEdit ? `${BASE}/approval-matrix/${modal.id}` : `${BASE}/approval-matrix`
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers:hdr(), body:JSON.stringify(payload) })
      const d      = await res.json()
      if (d.error) throw new Error(d.error)
      toast.success(d.message || 'Saved!')
      setModal(null); load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const deactivate = async (id, docNo) => {
    if (!window.confirm(`Deactivate this rule?`)) return
    try {
      await fetch(`${BASE}/approval-matrix/${id}`, { method:'DELETE', headers:hdr() })
      toast.success('Rule deactivated')
      load()
    } catch(e) { toast.error(e.message) }
  }

  const filtered = filter==='ALL' ? rules : rules.filter(r=>r.docType===filter)

  const docMeta = (type) => DOC_TYPES.find(d=>d.value===type) || { label:type, color:'#6C757D' }

  return (
    <div style={{ maxWidth:1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, color:'#714B67', fontSize:18, fontWeight:800 }}>
            🔐 Approval Matrix Configuration
          </h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#6C757D' }}>
            Define who approves which document based on type and amount — no hardcoded approvers
          </p>
        </div>
        <button onClick={openNew}
          style={{ padding:'9px 20px', background:'#714B67', color:'#fff',
            border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
          + Add Rule
        </button>
      </div>

      {/* Doc type filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {[{ value:'ALL', label:'All Types', color:'#6C757D' }, ...DOC_TYPES].map(dt=>(
          <button key={dt.value} onClick={()=>setFilter(dt.value)}
            style={{ padding:'5px 14px', borderRadius:16, fontSize:11, fontWeight:700,
              cursor:'pointer', border:'none',
              background: filter===dt.value ? dt.color : '#F0F0F0',
              color:       filter===dt.value ? '#fff'   : '#6C757D' }}>
            {dt.label}
          </button>
        ))}
      </div>

      {/* Rules list */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', border:'1px dashed #DDD', borderRadius:8 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
          <div style={{ fontWeight:700, marginBottom:6 }}>No approval rules configured</div>
          <div style={{ fontSize:12, marginBottom:16 }}>
            Without rules, all documents auto-approve. Add rules to enforce approval workflows.
          </div>
          <button onClick={openNew}
            style={{ padding:'8px 20px', background:'#714B67', color:'#fff',
              border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>
            + Add First Rule
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(rule => {
            const dm = docMeta(rule.docType)
            const levels = Array.isArray(rule.levels) ? rule.levels
              : JSON.parse(rule.levels||'[]')
            return (
              <div key={rule.id} style={{ background:'#fff', border:'1px solid #E8E0E8',
                borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', alignItems:'stretch' }}>
                  {/* Color bar */}
                  <div style={{ width:6, background:dm.color, flexShrink:0 }} />

                  <div style={{ flex:1, padding:'14px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <span style={{ background:dm.color+'15', color:dm.color,
                          border:`1px solid ${dm.color}40`,
                          padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:700 }}>
                          {dm.label}
                        </span>
                        <span style={{ fontFamily:'DM Mono,monospace', fontSize:12,
                          background:'#F8F5F8', padding:'3px 10px', borderRadius:4,
                          color:'#495057', fontWeight:600 }}>
                          {fmtC(rule.amtFrom)} – {fmtC(rule.amtTo)}
                        </span>
                        {rule.description && (
                          <span style={{ fontSize:12, color:'#6C757D' }}>{rule.description}</span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>openEdit(rule)}
                          style={{ padding:'4px 14px', background:'#F3EEF3', color:'#714B67',
                            border:'1px solid #E0D5E0', borderRadius:5, fontSize:11,
                            fontWeight:700, cursor:'pointer' }}>Edit</button>
                        <button onClick={()=>deactivate(rule.id)}
                          style={{ padding:'4px 12px', background:'#FFF5F5', color:'#DC3545',
                            border:'1px solid #F5C6CB', borderRadius:5, fontSize:11,
                            cursor:'pointer' }}>Remove</button>
                      </div>
                    </div>

                    {/* Approval levels flow */}
                    <div style={{ display:'flex', alignItems:'center', gap:6,
                      marginTop:12, flexWrap:'wrap' }}>
                      {levels.map((lv, i) => (
                        <React.Fragment key={i}>
                          <div style={{ background:'#F8F5F8', border:`1px solid ${dm.color}30`,
                            borderRadius:6, padding:'6px 12px', fontSize:11 }}>
                            <div style={{ fontWeight:700, color:dm.color, marginBottom:2 }}>
                              L{lv.level||i+1} — {lv.roleName}
                            </div>
                            <div style={{ color:'#6C757D', fontSize:10 }}>
                              {(lv.roles||[]).map(r=>ROLES.find(ro=>ro.value===r)?.label||r).join(' / ')}
                            </div>
                          </div>
                          {i < levels.length-1 && (
                            <div style={{ color:'#CCC', fontSize:16, fontWeight:700 }}>→</div>
                          )}
                        </React.Fragment>
                      ))}
                      <div style={{ color:'#28A745', fontSize:16, fontWeight:700 }}>→</div>
                      <div style={{ background:'#D4EDDA', border:'1px solid #C3E6CB',
                        borderRadius:6, padding:'6px 12px', fontSize:11, color:'#155724', fontWeight:700 }}>
                        ✓ Approved
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal: Add / Edit Rule ── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:680,
            maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* Modal Header */}
            <div style={{ background:'linear-gradient(135deg,#714B67,#8B5E7E)', color:'#fff',
              padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:800, fontSize:14 }}>
                {modal==='new' ? '+ New Approval Rule' : `Edit Rule — ${docMeta(form.docType).label}`}
              </div>
              <button onClick={()=>setModal(null)}
                style={{ background:'transparent', border:'none', color:'#fff',
                  fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>

            <div style={{ padding:20 }}>
              {/* Doc Type */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Document Type *</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {DOC_TYPES.map(dt=>(
                    <button key={dt.value} onClick={()=>sf('docType',dt.value)}
                      style={{ padding:'6px 14px', borderRadius:6, fontSize:11, fontWeight:700,
                        cursor:'pointer', border:`2px solid ${dt.color}`,
                        background: form.docType===dt.value ? dt.color : '#fff',
                        color:       form.docType===dt.value ? '#fff' : dt.color }}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Rule Description</label>
                <input style={inp} value={form.description||''} onChange={e=>sf('description',e.target.value)}
                  placeholder="e.g. Invoice above 5L needs Finance Head + MD" />
              </div>

              {/* Amount Slab */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={lbl}>Amount From (₹) *</label>
                  <input type="number" style={inp} value={form.amtFrom} min={0}
                    onChange={e=>sf('amtFrom',e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={lbl}>Amount To (₹) — leave blank for unlimited</label>
                  <input type="number" style={inp} value={form.amtTo||''} min={0}
                    onChange={e=>sf('amtTo',e.target.value)} placeholder="∞ unlimited" />
                </div>
              </div>

              {/* Approval Levels */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:10 }}>
                  <label style={{ ...lbl, marginBottom:0 }}>Approval Levels *</label>
                  <button onClick={addLevel}
                    style={{ padding:'4px 12px', background:'#714B67', color:'#fff',
                      border:'none', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    + Add Level
                  </button>
                </div>

                {form.levels.map((lv, i) => (
                  <div key={i} style={{ border:'1.5px solid #E8E0E8', borderRadius:8,
                    padding:'12px 14px', marginBottom:10, background:'#FAFAFA' }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', marginBottom:10 }}>
                      <div style={{ fontWeight:700, fontSize:12, color:'#714B67' }}>
                        Level {i+1} Approver
                      </div>
                      {form.levels.length > 1 && (
                        <button onClick={()=>delLevel(i)}
                          style={{ background:'#F8D7DA', color:'#721C24', border:'none',
                            borderRadius:4, padding:'2px 8px', cursor:'pointer', fontSize:11 }}>
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10 }}>
                      <div>
                        <label style={lbl}>Level Name / Role Title</label>
                        <input style={inp} value={lv.roleName||''}
                          onChange={e=>updLevel(i,'roleName',e.target.value)}
                          placeholder="e.g. Finance Head, GM, MD, Sales Manager..." />
                      </div>

                      <div>
                        <label style={lbl}>Who can approve? (select roles)</label>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {ROLES.map(role=>(
                            <button key={role.value} onClick={()=>toggleRole(i,role.value)}
                              style={{ padding:'5px 12px', borderRadius:16, fontSize:11,
                                fontWeight:600, cursor:'pointer', border:'1.5px solid',
                                borderColor: (lv.roles||[]).includes(role.value) ? '#714B67' : '#DDD',
                                background:  (lv.roles||[]).includes(role.value) ? '#714B67' : '#fff',
                                color:       (lv.roles||[]).includes(role.value) ? '#fff' : '#6C757D' }}>
                              {role.label}
                            </button>
                          ))}
                        </div>
                        {(lv.roles||[]).length===0 && (
                          <div style={{ fontSize:10, color:'#DC3545', marginTop:4 }}>
                            ⚠ Select at least one role
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={lbl}>Specific User (optional — leave blank for any user with above role)</label>
                        <select style={inp} value={lv.specificUserId||''}
                          onChange={e=>updLevel(i,'specificUserId',e.target.value||null)}>
                          <option value="">-- Any user with selected role --</option>
                          {users.filter(u=>u.isActive).map(u=>(
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role}) {u.designation?`— ${u.designation}`:''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Flow preview */}
                {form.levels.length > 0 && (
                  <div style={{ background:'#F3EEF3', borderRadius:6, padding:'10px 14px',
                    fontSize:11, color:'#714B67' }}>
                    <div style={{ fontWeight:700, marginBottom:6 }}>Flow Preview:</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ background:'#E2E3E5', padding:'3px 8px', borderRadius:4 }}>Submit</span>
                      {form.levels.map((lv,i)=>(
                        <React.Fragment key={i}>
                          <span>→</span>
                          <span style={{ background:'#EDE0EA', color:'#714B67',
                            padding:'3px 10px', borderRadius:4, fontWeight:600 }}>
                            L{i+1}: {lv.roleName||'?'}
                          </span>
                        </React.Fragment>
                      ))}
                      <span>→</span>
                      <span style={{ background:'#D4EDDA', color:'#155724',
                        padding:'3px 10px', borderRadius:4, fontWeight:700 }}>✓ Approved</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end',
                borderTop:'1px solid #F0F0F0', paddingTop:14 }}>
                <button onClick={()=>setModal(null)}
                  style={{ padding:'8px 20px', background:'#fff', border:'1px solid #DDD',
                    borderRadius:6, fontSize:13, cursor:'pointer', color:'#6C757D' }}>
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  style={{ padding:'8px 24px', background:'#714B67', color:'#fff',
                    border:'none', borderRadius:6, fontWeight:700, fontSize:13,
                    cursor:'pointer', opacity:saving?0.6:1 }}>
                  {saving ? 'Saving...' : modal==='new' ? '✓ Save Rule' : '✓ Update Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
