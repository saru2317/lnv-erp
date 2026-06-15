import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const MODULES = [
  { key:'MM', label:'Purchase',    icon:'📦', color:'#1565C0' },
  { key:'SD', label:'Sales',       icon:'🛒', color:'#2E7D32' },
  { key:'FI', label:'Finance',     icon:'💰', color:'#714B67' },
  { key:'PP', label:'Production',  icon:'⚙️',  color:'#E65100' },
  { key:'WM', label:'Warehouse',   icon:'🏭', color:'#1A5276' },
  { key:'HCM',label:'HR',          icon:'👥', color:'#6C3483' },
  { key:'QM', label:'Quality',     icon:'✅', color:'#117A65' },
]

const CONTROL_TYPES = [
  { key:'APPROVAL',         label:'Approval Workflow',  icon:'✋', desc:'Requires approval before proceeding' },
  { key:'LIMIT',            label:'Amount/Qty Limit',   icon:'🔢', desc:'Block/warn when value exceeds limit' },
  { key:'BLOCK',            label:'Hard Block',         icon:'🚫', desc:'Always block this transaction' },
  { key:'WARN',             label:'Warning Only',       icon:'⚠️',  desc:'Show warning but allow' },
  { key:'BUDGET',           label:'Budget Control',     icon:'💳', desc:'Check against budget allocation' },
  { key:'MIN_STOCK',        label:'Minimum Stock',      icon:'📦', desc:'Alert/block when stock is low' },
  { key:'CREDIT_LIMIT',     label:'Credit Limit',       icon:'💳', desc:'Block when customer credit exceeded' },
]

const SCREENS_BY_MODULE = {
  MM: ['Purchase Indent','Purchase Order','GRN','Vendor Invoice','Payment Request','Advance Request'],
  SD: ['Sales Quotation','Sales Order','Delivery Challan','Customer Invoice','Payment Receipt','Credit Note'],
  FI: ['Journal Entry','Payment Voucher','Receipt Voucher','Contra Voucher','Bank Reconciliation'],
  PP: ['Work Order','Material Issue','Production Entry','Work Order Complete'],
  WM: ['Stock Transfer','Goods Issue','Goods Receipt','Physical Inventory'],
  HCM: ['Leave Request','Overtime Request','Expense Claim','Payroll'],
  QM: ['Inspection','NCR','CAPA'],
}

const CONDITIONS = [
  { key:'GT',  label:'Greater than (>)'  },
  { key:'GTE', label:'Greater than or equal (≥)' },
  { key:'LT',  label:'Less than (<)'    },
  { key:'LTE', label:'Less than or equal (≤)' },
  { key:'EQ',  label:'Equal to (=)'     },
]

const ACTIONS = [
  { key:'BLOCK',            label:'🚫 Block transaction',          color:'#C62828' },
  { key:'WARN',             label:'⚠️ Warn but allow',              color:'#856404' },
  { key:'REQUIRE_APPROVAL', label:'✋ Send for approval',           color:'#1565C0' },
  { key:'NOTIFY',           label:'🔔 Notify only',                 color:'#714B67' },
]

const ROLES = ['SUPER_ADMIN','ADMIN','MANAGER','ACCOUNTS','SALES','PURCHASE','PRODUCTION','WAREHOUSE','HR','VIEWER']

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0', borderRadius:5, outline:'none', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase' }

const BLANK_RULE = {
  screen:'', transaction:'CREATE', ruleName:'', description:'',
  controlType:'REQUIRE_APPROVAL', conditionField:'amount', conditionOp:'GT',
  conditionValue:'', actionOnBreach:'REQUIRE_APPROVAL', actionMessage:'',
  approvalLevels:[], notifyRoles:[], bypassRoles:['ADMIN','SUPER_ADMIN'],
  roleLimits:[], isActive:true
}

export default function ControlsLimits() {
  const [activeModule, setActiveModule] = useState('MM')
  const [activeTab,    setActiveTab]    = useState('rules')
  const [groups,       setGroups]       = useState([])
  const [rules,        setRules]        = useState([])
  const [budgets,      setBudgets]      = useState([])
  const [minStocks,    setMinStocks]    = useState([])
  const [creditLimits, setCreditLimits] = useState([])
  const [loading,      setLoading]      = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [form,         setForm]         = useState({...BLANK_RULE})
  const [saving,       setSaving]       = useState(false)
  const [controlTypes, setControlTypes] = useState([])
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [typeForm,     setTypeForm]     = useState({ code:'', label:'', icon:'🔧', description:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const load = async () => {
    setLoading(true)
    try {
      // Load control types separately
      fetch(`${BASE}/admin/control-types`, { headers:hdr2() })
        .then(r=>r.json()).then(d=>setControlTypes(d.data||[])).catch(()=>{})

      const [gr, rr, br, mr, cr] = await Promise.all([
        fetch(`${BASE}/admin/control-groups?module=${activeModule}`, { headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
        fetch(`${BASE}/admin/control-rules?module=${activeModule}`,  { headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
        fetch(`${BASE}/admin/control-budgets?module=${activeModule}`,{ headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
        fetch(`${BASE}/admin/control-min-stock`,                      { headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
        fetch(`${BASE}/admin/control-credit-limits`,                  { headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
      ])
      setGroups(gr.data||[])
      setRules(rr.data||[])
      setBudgets(br.data||[])
      setMinStocks(mr.data||[])
      setCreditLimits(cr.data||[])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [activeModule])

  const openNew = () => {
    setEditId(null)
    setForm({ ...BLANK_RULE, screen: SCREENS_BY_MODULE[activeModule]?.[0]||'' })
    setShowForm(true)
  }

  const openEdit = (rule) => {
    setEditId(rule.id)
    setForm({
      ...rule,
      approvalLevels: Array.isArray(rule.approvalLevels) ? rule.approvalLevels : [],
      notifyRoles:    Array.isArray(rule.notifyRoles)    ? rule.notifyRoles    : [],
      bypassRoles:    Array.isArray(rule.bypassRoles)    ? rule.bypassRoles    : ['ADMIN','SUPER_ADMIN'],
      roleLimits:     Array.isArray(rule.roleLimits)     ? rule.roleLimits     : [],
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.ruleName) { toast.error('Rule name required'); return }
    setSaving(true)
    try {
      const url    = editId ? `${BASE}/admin/control-rules/${editId}` : `${BASE}/admin/control-rules`
      const method = editId ? 'PATCH' : 'POST'
      const payload = { ...form, module: activeModule }
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(editId ? 'Rule updated' : 'Rule created')
      setShowForm(false)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const toggleRule = async (rule) => {
    await fetch(`${BASE}/admin/control-rules/${rule.id}`, {
      method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive:!rule.isActive })
    })
    setRules(rs => rs.map(r => r.id===rule.id ? {...r,isActive:!r.isActive} : r))
    toast.success(`Rule ${rule.isActive?'disabled':'enabled'}`)
  }

  const addApprovalLevel = () => set('approvalLevels', [...(form.approvalLevels||[]),
    { level:(form.approvalLevels||[]).length+1, role:'MANAGER', minAmount:0, maxAmount:'' }])
  const updApprovalLevel = (i,k,v) => set('approvalLevels', (form.approvalLevels||[]).map((l,idx)=>idx===i?{...l,[k]:v}:l))
  const removeApprovalLevel = (i) => set('approvalLevels', (form.approvalLevels||[]).filter((_,idx)=>idx!==i))

  const addRoleLimit = () => set('roleLimits', [...(form.roleLimits||[]), { role:'PURCHASE', limit:50000 }])
  const updRoleLimit = (i,k,v) => set('roleLimits', (form.roleLimits||[]).map((l,idx)=>idx===i?{...l,[k]:v}:l))

  const ctypeInfo = CONTROL_TYPES.find(c=>c.key===form.controlType)
  const screenList = SCREENS_BY_MODULE[activeModule]||[]

  return (
    <div>
      {/* Header */}
      <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67',marginBottom:4}}>
        Controls & Limits
        <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>
          Dynamic business rules · Approval workflows · Threshold alerts
        </small>
      </div>
      <div style={{fontSize:11,color:'#6C757D',marginBottom:16}}>
        Configure transaction controls, approval hierarchies, budget limits, stock alerts and credit limits per module.
      </div>

      {/* Module tabs */}
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {MODULES.map(m=>(
          <button key={m.key} onClick={()=>setActiveModule(m.key)}
            style={{padding:'7px 16px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',
              border:`2px solid ${activeModule===m.key?m.color:'#E0D5E0'}`,
              background:activeModule===m.key?m.color:'#fff',
              color:activeModule===m.key?'#fff':'#6C757D'}}>
            {m.icon} {m.label}
            {rules.filter(r=>r.module===m.key&&r.isActive).length>0 &&
              <span style={{marginLeft:5,background:'rgba(255,255,255,.3)',padding:'1px 6px',borderRadius:10,fontSize:10}}>
                {rules.filter(r=>r.module===m.key&&r.isActive).length}
              </span>}
          </button>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{display:'flex',gap:4,marginBottom:14,padding:'4px 6px',background:'#F0EEEB',borderRadius:8,width:'fit-content'}}>
        {[
          ['rules',   '📋 Transaction Rules'],
          ['approval','✋ Approval Hierarchy'],
          ['budget',  '💳 Budget Controls'],
          ['stock',   '📦 Min Stock Alerts'],
          ['credit',  '💰 Credit Limits'],
          ['types',   '🔧 Control Types'],
        ].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveTab(k)}
            style={{padding:'6px 14px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',border:'none',
              background:activeTab===k?'#714B67':'transparent',color:activeTab===k?'#fff':'#6C757D'}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── TRANSACTION RULES TAB ── */}
      {activeTab==='rules' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:12,color:'#6C757D'}}>
              {rules.length} rules configured for {MODULES.find(m=>m.key===activeModule)?.label}
            </div>
            <button onClick={openNew}
              style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',
                borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Add Rule
            </button>
          </div>

          {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading…</div> :
          rules.length===0 ? (
            <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:32,marginBottom:8}}>🔒</div>
              <div style={{fontWeight:700}}>No rules configured for {MODULES.find(m=>m.key===activeModule)?.label}</div>
              <div style={{fontSize:12,marginTop:4}}>Add transaction controls, amount limits and approval workflows</div>
              <button onClick={openNew} style={{marginTop:14,padding:'8px 20px',background:'#714B67',color:'#fff',
                border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                + Add First Rule
              </button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {rules.map(rule=>{
                const ct = CONTROL_TYPES.find(c=>c.key===rule.controlType)
                const ac = ACTIONS.find(a=>a.key===rule.actionOnBreach)
                const approvalLevels = Array.isArray(rule.approvalLevels) ? rule.approvalLevels : []
                return (
                  <div key={rule.id} style={{background:'#fff',borderRadius:8,border:'1px solid #E0D5E0',
                    borderLeft:`4px solid ${rule.isActive?'#714B67':'#CCC'}`,overflow:'hidden',
                    opacity:rule.isActive?1:0.6}}>
                    <div style={{padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontWeight:700,fontSize:13}}>{rule.ruleName}</span>
                          <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,
                            background:'#EDE0EA',color:'#714B67'}}>{rule.screen}</span>
                          <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,
                            background:'#E3F2FD',color:'#1565C0'}}>{rule.transaction}</span>
                        </div>
                        <div style={{fontSize:11,color:'#6C757D',display:'flex',gap:12,flexWrap:'wrap'}}>
                          {rule.conditionField && (
                            <span>
                              📊 When <strong>{rule.conditionField}</strong> {CONDITIONS.find(c=>c.key===rule.conditionOp)?.label?.split('(')[0]} <strong>₹{parseFloat(rule.conditionValue||0).toLocaleString('en-IN')}</strong>
                            </span>
                          )}
                          <span style={{color:ac?.color,fontWeight:700}}>{ac?.label}</span>
                          {approvalLevels.length>0 && (
                            <span>→ {approvalLevels.length} approval level{approvalLevels.length>1?'s':''}: {approvalLevels.map(l=>l.role).join(' → ')}</span>
                          )}
                        </div>
                        {rule.description && <div style={{fontSize:11,color:'#6C757D',marginTop:3}}>{rule.description}</div>}
                      </div>
                      <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0,marginLeft:12}}>
                        <div onClick={()=>toggleRule(rule)}
                          style={{width:40,height:22,borderRadius:11,cursor:'pointer',position:'relative',
                            background:rule.isActive?'#714B67':'#CCC',transition:'background .2s'}}>
                          <div style={{position:'absolute',top:2,width:18,height:18,borderRadius:'50%',
                            background:'#fff',transition:'left .2s',left:rule.isActive?20:2}}/>
                        </div>
                        <button onClick={()=>openEdit(rule)}
                          style={{padding:'4px 10px',background:'#EDE0EA',color:'#714B67',border:'none',
                            borderRadius:5,fontSize:11,cursor:'pointer'}}>Edit</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── APPROVAL HIERARCHY TAB ── */}
      {activeTab==='approval' && (
        <div>
          <div style={{marginBottom:14,padding:14,background:'#E3F2FD',borderRadius:8,fontSize:12,color:'#1565C0'}}>
            ℹ️ Approval hierarchies are configured inside each Transaction Rule.
            Rules with <strong>REQUIRE_APPROVAL</strong> action will use the levels defined here.
          </div>
          {rules.filter(r=>r.actionOnBreach==='REQUIRE_APPROVAL').length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:28,marginBottom:8}}>✋</div>
              <div style={{fontWeight:700}}>No approval rules yet</div>
              <div style={{fontSize:12,marginTop:4}}>Add rules with "Send for Approval" action in Transaction Rules tab</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {rules.filter(r=>r.actionOnBreach==='REQUIRE_APPROVAL').map(rule=>{
                const levels = Array.isArray(rule.approvalLevels) ? rule.approvalLevels : []
                return (
                  <div key={rule.id} style={{background:'#fff',borderRadius:8,border:'1px solid #E0D5E0',overflow:'hidden'}}>
                    <div style={{padding:'10px 16px',background:'#1565C022',borderBottom:'1px solid #E0D5E0',
                      display:'flex',justifyContent:'space-between'}}>
                      <div style={{fontWeight:700,fontSize:13}}>{rule.ruleName}</div>
                      <span style={{fontSize:11,color:'#6C757D'}}>{rule.screen} · {rule.transaction}</span>
                    </div>
                    <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:0,flexWrap:'wrap'}}>
                      <div style={{padding:'8px 12px',background:'#F8F9FA',borderRadius:6,border:'1px solid #E0D5E0',
                        fontSize:11,fontWeight:700,color:'#6C757D',marginRight:8}}>
                        📝 Submitted
                      </div>
                      {levels.map((l,i)=>(
                        <React.Fragment key={i}>
                          <div style={{padding:'0 8px',color:'#1565C0',fontSize:18}}>→</div>
                          <div style={{padding:'8px 14px',background:'#E3F2FD',borderRadius:6,
                            border:'1px solid #90CAF9',textAlign:'center',minWidth:100}}>
                            <div style={{fontSize:10,color:'#6C757D',marginBottom:2}}>Level {l.level}</div>
                            <div style={{fontWeight:700,fontSize:12,color:'#1565C0'}}>{l.role}</div>
                            {l.maxAmount && <div style={{fontSize:9,color:'#6C757D'}}>up to ₹{parseFloat(l.maxAmount).toLocaleString('en-IN')}</div>}
                          </div>
                        </React.Fragment>
                      ))}
                      <div style={{padding:'0 8px',color:'#155724',fontSize:18}}>→</div>
                      <div style={{padding:'8px 12px',background:'#D4EDDA',borderRadius:6,border:'1px solid #A5D6A7',
                        fontSize:11,fontWeight:700,color:'#155724'}}>
                        ✅ Approved
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BUDGET CONTROLS TAB ── */}
      {activeTab==='budget' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <div style={{fontSize:12,color:'#6C757D'}}>{budgets.length} budget entries</div>
            <button onClick={()=>toast('Budget management coming soon')}
              style={{padding:'7px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Add Budget
            </button>
          </div>
          {budgets.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:28,marginBottom:8}}>💳</div>
              <div style={{fontWeight:700}}>No budgets configured</div>
              <div style={{fontSize:12,marginTop:4}}>Set annual/monthly purchase budgets to control overspending</div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── MIN STOCK TAB ── */}
      {activeTab==='stock' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <div style={{fontSize:12,color:'#6C757D'}}>{minStocks.length} items with stock alerts</div>
            <button onClick={()=>toast('Min stock management coming soon')}
              style={{padding:'7px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Add Stock Alert
            </button>
          </div>
          {minStocks.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:28,marginBottom:8}}>📦</div>
              <div style={{fontWeight:700}}>No minimum stock alerts configured</div>
              <div style={{fontSize:12,marginTop:4}}>Set minimum stock levels to get alerts when inventory runs low</div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── CREDIT LIMITS TAB ── */}
      {activeTab==='credit' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <div style={{fontSize:12,color:'#6C757D'}}>{creditLimits.length} customer credit limits</div>
            <button onClick={()=>toast('Credit limit management coming soon')}
              style={{padding:'7px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Add Credit Limit
            </button>
          </div>
          {creditLimits.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:28,marginBottom:8}}>💰</div>
              <div style={{fontWeight:700}}>No credit limits configured</div>
              <div style={{fontSize:12,marginTop:4}}>Set customer-wise credit limits to control outstanding receivables</div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── CONTROL TYPES TAB ── */}
      {activeTab==='types' && (
        <div>
          <div style={{background:'#E3F2FD',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#1565C0'}}>
            ℹ️ <strong>System types</strong> are built-in and cannot be deleted. You can add custom types for your specific business needs.
          </div>

          {/* System types — locked */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>
              🔒 System Defaults (cannot be modified)
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {(controlTypes||[]).filter(t=>t.isSystem).map(t=>(
                <div key={t.id} style={{background:'#F8F9FA',borderRadius:8,padding:'12px 14px',
                  border:'1px solid #E0D5E0',opacity:.9}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:20}}>{t.icon}</span>
                    <div style={{fontWeight:700,fontSize:12,color:'#1C1C1C'}}>{t.label}</div>
                    <span style={{marginLeft:'auto',fontSize:9,background:'#E3F2FD',color:'#1565C0',
                      padding:'1px 6px',borderRadius:3,fontWeight:700}}>SYSTEM</span>
                  </div>
                  <div style={{fontSize:10,color:'#6C757D'}}>{t.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom types */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',letterSpacing:.5}}>
                Custom Types ({(controlTypes||[]).filter(t=>!t.isSystem).length})
              </div>
              <button onClick={()=>setShowTypeForm(!showTypeForm)}
                style={{padding:'6px 14px',background:'#714B67',color:'#fff',border:'none',
                  borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                + Add Custom Type
              </button>
            </div>

            {showTypeForm && (
              <div style={{background:'#fff',border:'2px solid #714B67',borderRadius:8,padding:14,marginBottom:10}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr 2fr',gap:8,marginBottom:8}}>
                  <div>
                    <label style={lbl}>Code *</label>
                    <input value={typeForm.code} onChange={e=>setTypeForm(f=>({...f,code:e.target.value.toUpperCase()}))}
                      placeholder="MY_TYPE" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Label *</label>
                    <input value={typeForm.label} onChange={e=>setTypeForm(f=>({...f,label:e.target.value}))}
                      placeholder="e.g. MD Approval Required" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Icon (emoji)</label>
                    <input value={typeForm.icon} onChange={e=>setTypeForm(f=>({...f,icon:e.target.value}))}
                      placeholder="🔧" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Description</label>
                    <input value={typeForm.description} onChange={e=>setTypeForm(f=>({...f,description:e.target.value}))}
                      placeholder="When to use this type" style={inp} />
                  </div>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>setShowTypeForm(false)}
                    style={{padding:'6px 14px',borderRadius:5,border:'1px solid #ddd',background:'#fff',fontSize:12,cursor:'pointer'}}>Cancel</button>
                  <button onClick={async()=>{
                    if (!typeForm.code||!typeForm.label){toast.error('Code and label required');return}
                    setSaving(true)
                    try {
                      const r = await fetch(`${BASE}/admin/control-types`,{method:'POST',headers:hdr(),body:JSON.stringify(typeForm)})
                      const d = await r.json()
                      if (!r.ok) throw new Error(d.error)
                      toast.success(d.message)
                      setShowTypeForm(false)
                      setTypeForm({code:'',label:'',icon:'🔧',description:''})
                      const tr = await fetch(`${BASE}/admin/control-types`,{headers:hdr2()}).then(r=>r.json())
                      setControlTypes(tr.data||[])
                    } catch(e){toast.error(e.message)}
                    finally{setSaving(false)}
                  }} disabled={saving}
                    style={{padding:'6px 16px',borderRadius:5,border:'none',background:'#714B67',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                    {saving?'Saving…':'✓ Save Type'}
                  </button>
                </div>
              </div>
            )}

            {(controlTypes||[]).filter(t=>!t.isSystem).length===0 ? (
              <div style={{padding:30,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8,fontSize:12}}>
                No custom types yet — system defaults cover most scenarios
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                {(controlTypes||[]).filter(t=>!t.isSystem).map(t=>(
                  <div key={t.id} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
                    border:'2px solid #714B67',position:'relative'}}>
                    <button onClick={async()=>{
                      if (!window.confirm(`Delete "${t.label}"?`)) return
                      await fetch(`${BASE}/admin/control-types/${t.id}`,{method:'DELETE',headers:hdr2()})
                      setControlTypes(ct=>ct.filter(x=>x.id!==t.id))
                      toast.success(`"${t.label}" deleted`)
                    }} style={{position:'absolute',top:6,right:6,background:'none',border:'none',
                      color:'#C62828',cursor:'pointer',fontSize:14}}>✕</button>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:20}}>{t.icon}</span>
                      <div style={{fontWeight:700,fontSize:12,color:'#714B67'}}>{t.label}</div>
                    </div>
                    <code style={{fontSize:10,color:'#6C757D'}}>{t.code}</code>
                    {t.description && <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>{t.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD/EDIT RULE MODAL ── */}
      {showForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,
          display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:20,overflowY:'auto'}}>
          <div style={{background:'#fff',borderRadius:10,padding:24,width:800,
            boxShadow:'0 8px 32px rgba(0,0,0,.25)',margin:'0 auto 40px'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:16}}>
              {editId?'Edit':'Add'} Control Rule — {MODULES.find(m=>m.key===activeModule)?.label}
            </div>

            {/* What happens — simplified */}
            <div style={{marginBottom:14,padding:12,background:'#F8F4F8',borderRadius:8,border:'1px solid #E0D5E0'}}>
              <label style={{...lbl,marginBottom:6}}>What should happen when condition is met?</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                {ACTIONS.map(a=>(
                  <div key={a.key} onClick={()=>set('actionOnBreach',a.key)}
                    style={{padding:'10px',borderRadius:6,cursor:'pointer',textAlign:'center',
                      border:`2px solid ${form.actionOnBreach===a.key?a.color:'#E0D5E0'}`,
                      background:form.actionOnBreach===a.key?a.color+'15':'#fff',
                      transition:'all .15s'}}>
                    <div style={{fontSize:13,fontWeight:700,color:a.color}}>{a.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Type from DB */}
            <div style={{marginBottom:12}}>
              <label style={lbl}>Control Type</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(controlTypes||[]).filter(t=>t.isActive).map(t=>(
                  <div key={t.code} onClick={()=>set('controlType',t.code)}
                    style={{padding:'5px 12px',borderRadius:20,cursor:'pointer',fontSize:11,fontWeight:700,
                      border:`1.5px solid ${form.controlType===t.code?'#714B67':'#E0D5E0'}`,
                      background:form.controlType===t.code?'#EDE0EA':'#fff',
                      color:form.controlType===t.code?'#714B67':'#6C757D'}}>
                    {t.icon} {t.label}
                    {t.isSystem && <span style={{fontSize:9,color:'#6C757D',marginLeft:3}}>(default)</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Basic fields */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
              <div>
                <label style={lbl}>Screen / Transaction *</label>
                <select value={form.screen} onChange={e=>set('screen',e.target.value)} style={inp}>
                  <option value="">— Select Screen —</option>
                  {screenList.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Action</label>
                <select value={form.transaction} onChange={e=>set('transaction',e.target.value)} style={inp}>
                  {['CREATE','APPROVE','POST','CANCEL','MODIFY','DELETE'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Rule Name *</label>
                <input value={form.ruleName} onChange={e=>set('ruleName',e.target.value)}
                  placeholder="e.g. PO Amount Limit" style={inp} />
              </div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={lbl}>Description</label>
              <input value={form.description||''} onChange={e=>set('description',e.target.value)}
                placeholder="Explain this rule..." style={inp} />
            </div>

            {/* Condition */}
            <div style={{background:'#F8F9FA',borderRadius:8,padding:14,marginBottom:12,border:'1px solid #E0D5E0'}}>
              <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:10}}>
                📊 When this condition is met...
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div>
                  <label style={lbl}>Check Field</label>
                  <select value={form.conditionField} onChange={e=>set('conditionField',e.target.value)} style={inp}>
                    {['amount','qty','totalAmount','creditOutstanding','stockQty','budgetUsed','discountPct','daysOverdue'].map(f=>(
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Condition</label>
                  <select value={form.conditionOp} onChange={e=>set('conditionOp',e.target.value)} style={inp}>
                    {CONDITIONS.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Value</label>
                  <input type="number" value={form.conditionValue} onChange={e=>set('conditionValue',e.target.value)}
                    placeholder="e.g. 50000" style={inp} />
                </div>
              </div>
            </div>

            {/* Custom message */}
            <div style={{marginBottom:12}}>
              <label style={lbl}>Message shown to user (optional)</label>
              <input value={form.actionMessage||''} onChange={e=>set('actionMessage',e.target.value)}
                placeholder="e.g. PO amount exceeds your limit. Sent for Manager approval." style={inp} />
            </div>

            {/* Approval levels — show only for REQUIRE_APPROVAL */}
            {form.actionOnBreach==='REQUIRE_APPROVAL' && (
              <div style={{background:'#E3F2FD',borderRadius:8,padding:14,marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontWeight:700,fontSize:12,color:'#1565C0'}}>✋ Approval Levels</div>
                  <button onClick={addApprovalLevel}
                    style={{padding:'4px 10px',background:'#1565C0',color:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer'}}>
                    + Add Level
                  </button>
                </div>
                {(form.approvalLevels||[]).map((l,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr 1fr auto',gap:8,marginBottom:6,alignItems:'center'}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'#1565C0',color:'#fff',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
                      {l.level}
                    </div>
                    <select value={l.role} onChange={e=>updApprovalLevel(i,'role',e.target.value)} style={inp}>
                      {ROLES.map(r=><option key={r}>{r}</option>)}
                    </select>
                    <input type="number" value={l.minAmount||0} onChange={e=>updApprovalLevel(i,'minAmount',e.target.value)}
                      placeholder="Min amount" style={inp} />
                    <input type="number" value={l.maxAmount||''} onChange={e=>updApprovalLevel(i,'maxAmount',e.target.value)}
                      placeholder="Max amount (blank=unlimited)" style={inp} />
                    <button onClick={()=>removeApprovalLevel(i)}
                      style={{color:'#C62828',background:'none',border:'none',cursor:'pointer',fontSize:16}}>✕</button>
                  </div>
                ))}
                {(form.approvalLevels||[]).length===0 && (
                  <div style={{fontSize:11,color:'#6C757D'}}>No levels added. Click "+ Add Level" to define the approval chain.</div>
                )}
              </div>
            )}

            {/* Role limits */}
            <div style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontWeight:700,fontSize:12,color:'#714B67'}}>
                  🔑 Role-wise Limits
                  <span style={{fontSize:10,color:'#6C757D',fontWeight:400,marginLeft:6}}>Different limits per role</span>
                </div>
                <button onClick={addRoleLimit}
                  style={{padding:'4px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:4,fontSize:11,cursor:'pointer'}}>
                  + Add
                </button>
              </div>
              {(form.roleLimits||[]).map((l,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:8,marginBottom:6}}>
                  <select value={l.role} onChange={e=>updRoleLimit(i,'role',e.target.value)} style={inp}>
                    {ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                  <input type="number" value={l.limit||''} onChange={e=>updRoleLimit(i,'limit',parseFloat(e.target.value))}
                    placeholder="Limit amount" style={inp} />
                  <button onClick={()=>set('roleLimits',(form.roleLimits||[]).filter((_,idx)=>idx!==i))}
                    style={{color:'#C62828',background:'none',border:'none',cursor:'pointer',fontSize:16}}>✕</button>
                </div>
              ))}
            </div>

            {/* Notify roles */}
            <div style={{marginBottom:14}}>
              <label style={lbl}>Notify Roles (on breach)</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {ROLES.map(r=>(
                  <div key={r} onClick={()=>{
                    const nr = form.notifyRoles||[]
                    set('notifyRoles', nr.includes(r) ? nr.filter(x=>x!==r) : [...nr,r])
                  }} style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',
                    border:`1.5px solid ${(form.notifyRoles||[]).includes(r)?'#714B67':'#E0D5E0'}`,
                    background:(form.notifyRoles||[]).includes(r)?'#EDE0EA':'#fff',
                    color:(form.notifyRoles||[]).includes(r)?'#714B67':'#6C757D'}}>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',borderTop:'1px solid #F0EEEB',paddingTop:12}}>
              <button onClick={()=>setShowForm(false)}
                style={{padding:'8px 18px',borderRadius:6,border:'1px solid #E0D5E0',background:'#fff',fontSize:12,cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{padding:'8px 22px',borderRadius:6,border:'none',
                  background:'#714B67',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                {saving?'Saving…':'✓ Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
