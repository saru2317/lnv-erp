// ═══════════════════════════════════════════════════════════════════
// LNV ERP — Admin / BillingAdmin.jsx
// Internal billing for LNV ERP product clients
// Dashboard → Clients → Quotes → Subscriptions → Invoices
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:0})
const fmtD = s => s ? new Date(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const TIERS = { 1:'Starter', 2:'Professional', 3:'Enterprise' }
const STATUS_ST = {
  PROSPECT:  { bg:'#EDE0EA', c:'#714B67' },
  ACTIVE:    { bg:'#D4EDDA', c:'#155724' },
  INACTIVE:  { bg:'#E2E3E5', c:'#6C757D' },
  CHURNED:   { bg:'#F8D7DA', c:'#721C24' },
  DRAFT:     { bg:'#E2E3E5', c:'#6C757D' },
  SENT:      { bg:'#FFF3CD', c:'#856404' },
  ACCEPTED:  { bg:'#D4EDDA', c:'#155724' },
  REJECTED:  { bg:'#F8D7DA', c:'#721C24' },
  PENDING:   { bg:'#FFF3CD', c:'#856404' },
  PAID:      { bg:'#D4EDDA', c:'#155724' },
  OVERDUE:   { bg:'#F8D7DA', c:'#721C24' },
}

const Badge = ({ s }) => {
  const st = STATUS_ST[s] || STATUS_ST.DRAFT
  return <span style={{ background:st.bg, color:st.c, padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700 }}>{s}</span>
}

const MODULES = [
  // cost = your infra+support cost, monthly = selling price to client
  { id:'mdm',  name:'Master Data',      tier:1, monthly:500,  cost:150  },
  { id:'sd',   name:'Sales (SD)',        tier:1, monthly:1500, cost:400  },
  { id:'mm',   name:'Purchase (MM)',     tier:1, monthly:1500, cost:400  },
  { id:'wm',   name:'Warehouse (WM)',    tier:1, monthly:1000, cost:300  },
  { id:'fi',   name:'Finance (FI)',      tier:1, monthly:2000, cost:500  },
  { id:'pp',   name:'Production (PP)',   tier:2, monthly:2000, cost:600  },
  { id:'qm',   name:'Quality (QM)',      tier:2, monthly:1000, cost:300  },
  { id:'hcm',  name:'HR & Payroll',      tier:2, monthly:1500, cost:400  },
  { id:'crm',  name:'CRM',              tier:2, monthly:1000, cost:250  },
  { id:'tm',   name:'Transport',        tier:2, monthly:800,  cost:200  },
  { id:'am',   name:'Assets',           tier:2, monthly:800,  cost:200  },
  { id:'vm',   name:'Visitor',          tier:2, monthly:500,  cost:150  },
  { id:'cn',   name:'Canteen',          tier:2, monthly:500,  cost:150  },
  { id:'ai',   name:'LNV Claude AI',    tier:3, monthly:2000, cost:800  },
  { id:'einv', name:'e-Invoice',        tier:3, monthly:500,  cost:100  },
  { id:'iot',  name:'IoT Integration',  tier:3, monthly:1500, cost:500  },
]

const inp  = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl  = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase' }
const sec  = { background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, marginBottom:14, overflow:'hidden' }
const secH = { background:'linear-gradient(135deg,#1C1C1C,#333)', color:'#fff', padding:'10px 16px', fontSize:13, fontWeight:700 }
const secB = { padding:'16px' }

export default function BillingAdmin() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('lnv_user')||'{}')
  const isSuperAdmin = user?.role==='SUPER_ADMIN' || user?.email==='admin@lnverp.com'

  useEffect(()=>{
    if (!isSuperAdmin) { navigate('/admin'); }
  },[isSuperAdmin])

  if (!isSuperAdmin) return (
    <div style={{ padding:60, textAlign:'center', color:'#DC3545' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
      <div style={{ fontSize:18, fontWeight:700 }}>Super Admin Only</div>
      <div style={{ fontSize:13, color:'#6C757D', marginTop:8 }}>This section is restricted to LNV product administrators.</div>
    </div>
  )

  const [tab,        setTab]       = useState('dashboard')
  const [projects,   setProjects]  = useState([])
  const [amcs,       setAmcs]      = useState([])
  const [projModal,  setProjModal] = useState(false)
  const [amcModal,   setAmcModal]  = useState(false)
  const [editProj,   setEditProj]  = useState(null)
  const [editAmc,    setEditAmc]   = useState(null)
  const [projForm,   setProjForm]  = useState({ clientName:'', industry:'Injection Moulding', package:'Professional', startDate:'', goLiveDate:'', status:'Planning', health:'green', currentPhase:0, pm:'Saravanan', contactPerson:'', contractValue:'', location:'Coimbatore', notes:'' })
  const [amcForm,    setAmcForm]   = useState({ clientName:'', package:'Professional', startDate:'', endDate:'', amount:'', gstPct:18, notes:'' })
  const [dashboard,  setDashboard] = useState(null)
  const [clients,    setClients]   = useState([])
  const [quotes,     setQuotes]    = useState([])
  const [subs,       setSubs]      = useState([])
  const [loading,    setLoading]   = useState(false)
  const [modal,      setModal]     = useState(null)
  const [selClient,  setSelClient] = useState(null)
  const [quoteForm,  setQuoteForm] = useState({ tier:1, users:5, discount:0, gst:18, setup:25000, amc:20, modules:{} })

  const loadProjects = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/billing/projects`, { headers:hdr2() })
      const d = await r.json()
      setProjects(d.data || [])
    } catch {}
  }, [])

  const loadAmcs = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/billing/amc`, { headers:hdr2() })
      const d = await r.json()
      setAmcs(d.data || [])
    } catch {}
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [db, cl, qt, sb] = await Promise.all([
        fetch(`${BASE}/billing/dashboard`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/billing/clients`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/billing/quotes`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/billing/subscriptions`, { headers:hdr2() }).then(r=>r.json()),
      ])
      setDashboard(db.data)
      setClients(cl.data||[])
      setQuotes(qt.data||[])
      setSubs(sb.data||[])
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Quote calc
  const calcQuote = () => {
    const mods      = MODULES.filter(m => quoteForm.modules[m.id])
    const modAmt    = mods.reduce((s,m)=>s+m.monthly, 0)
    const totalCost = mods.reduce((s,m)=>s+m.cost, 0)
    const users     = parseInt(quoteForm.users||5)
    const extra     = Math.max(0, users-5) * 500
    const sub       = modAmt + extra
    const disc      = sub * parseFloat(quoteForm.discount||0) / 100
    const after     = sub - disc
    const gst       = after * parseFloat(quoteForm.gst||18) / 100
    const monthly   = after + gst
    const setup     = parseFloat(quoteForm.setup||0) * (1 + parseFloat(quoteForm.gst||18)/100)
    const annual    = monthly * 12 + setup
    const profit    = after - totalCost
    const margin    = after > 0 ? Math.round((profit/after)*100) : 0
    return { mods, modAmt, totalCost, extra, sub, disc, gst, monthly, setup, annual, profit, margin }
  }

  const loadTierModules = (tier) => {
    const mods = {}
    MODULES.forEach(m => { if (m.tier <= tier) mods[m.id] = true })
    setQuoteForm(f=>({...f, tier, modules:mods}))
  }

  const saveClient = async (data) => {
    try {
      const isEdit = data.id
      const r = await fetch(`${BASE}/billing/clients${isEdit?`/${data.id}`:''}`, {
        method: isEdit?'PATCH':'POST', headers:hdr(), body:JSON.stringify(data)
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(d.message||'Saved!')
      setModal(null); load()
    } catch(e) { toast.error(e.message) }
  }

  const saveQuote = async () => {
    if (!selClient) return toast.error('Select a client first!')
    const calc = calcQuote()
    if (!calc.mods.length) return toast.error('Select at least one module!')
    try {
      const r = await fetch(`${BASE}/billing/quotes`, {
        method:'POST', headers:hdr(),
        body: JSON.stringify({
          clientId:   selClient.id,
          tier:       quoteForm.tier,
          modules:    calc.mods.map(m=>m.id),
          users:      quoteForm.users,
          monthlyAmt: calc.modAmt + calc.extra,
          setupFee:   quoteForm.setup,
          discountPct:quoteForm.discount,
          gstPct:     quoteForm.gst,
          gstAmt:     calc.gst,
          totalMonthly: calc.monthly,
          annualValue:  calc.annual,
          amcPct:     quoteForm.amc,
        })
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(`${d.data.quoteNo} saved!`)
      setTab('quotes'); load()
    } catch(e) { toast.error(e.message) }
  }

  const updateQuoteStatus = async (id, status) => {
    try {
      const r = await fetch(`${BASE}/billing/quotes/${id}/status`, {
        method:'PATCH', headers:hdr(), body:JSON.stringify({ status })
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(status==='ACCEPTED'?'Quote accepted — subscription created!':'Status updated')
      load()
    } catch(e) { toast.error(e.message) }
  }

  const genInvoice = async (subId) => {
    try {
      const r = await fetch(`${BASE}/billing/subscriptions/${subId}/generate-invoice`, { method:'POST', headers:hdr() })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(d.message)
      load()
    } catch(e) { toast.error(e.message) }
  }

  const KPI = ({ label, value, sub, color='#2D3748' }) => (
    <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, padding:'14px 16px' }}>
      <div style={{ fontSize:11, color:'#6C757D', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color, fontFamily:'DM Mono,monospace' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>{sub}</div>}
    </div>
  )

  const calc = calcQuote()

  return (
    <div style={{ maxWidth:1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1C1C1C' }}>LNV ERP Billing</h2>
          <p style={{ margin:'3px 0 0', fontSize:12, color:'#6C757D' }}>Client subscription & invoice management</p>
        </div>
        <button onClick={()=>setModal({ type:'newClient' })}
          style={{ padding:'8px 18px', background:'#1C1C1C', color:'#fff', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
          + New Client
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:'2px solid #E8E0E8' }}>
        {[['dashboard','🏠 Dashboard'],['clients','👥 Clients'],['quote-builder','📝 Quote Builder'],['quotes','📋 Quotes'],['subscriptions','🔄 Subscriptions'],['projects','📌 Projects'],['amc','🔒 AMC Tracker']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:'8px 18px', border:'none', background:'transparent', fontWeight:700, fontSize:13, cursor:'pointer',
              color: tab===t?'#1C1C1C':'#6C757D', borderBottom:tab===t?'2px solid #1C1C1C':'2px solid transparent', marginBottom:-2 }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==='dashboard' && dashboard && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            <KPI label="Active Clients"    value={dashboard.activeClients} sub={`${dashboard.prospects} prospects`} color='#155724' />
            <KPI label="Monthly Revenue"   value={INR(dashboard.monthlyRevenue)} sub="From active subscriptions" color='#714B67' />
            <KPI label="Annual Revenue"    value={INR(dashboard.annualRevenue)} sub="Projected" color='#1F618D' />
            <KPI label="Pending Invoices"  value={INR(dashboard.pendingAmount)} sub={`${dashboard.pendingInvoices} invoices`} color='#856404' />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={sec}>
              <div style={secH}>Recent Clients</div>
              <div style={secB}>
                {clients.slice(0,5).map(c=>(
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #F0F0F0' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{c.companyName}</div>
                      <div style={{ fontSize:11, color:'#6C757D' }}>{c.clientCode} · T{c.tier} {TIERS[c.tier]}</div>
                    </div>
                    <Badge s={c.status} />
                  </div>
                ))}
              </div>
            </div>
            <div style={sec}>
              <div style={secH}>Open Quotes</div>
              <div style={secB}>
                {quotes.filter(q=>['DRAFT','SENT'].includes(q.status)).slice(0,5).map(q=>(
                  <div key={q.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #F0F0F0' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{q.quoteNo}</div>
                      <div style={{ fontSize:11, color:'#6C757D' }}>{q.client?.companyName} · {INR(q.totalMonthly)}/mo</div>
                    </div>
                    <Badge s={q.status} />
                  </div>
                ))}
                {quotes.filter(q=>['DRAFT','SENT'].includes(q.status)).length===0 && (
                  <div style={{ fontSize:12, color:'#CCC', padding:'8px 0' }}>No open quotes</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLIENTS ── */}
      {tab==='clients' && (
        <div style={sec}>
          <div style={secH}>All Clients ({clients.length})</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F9FA', borderBottom:'1px solid #E8E0E8' }}>
                {['Code','Company','Contact','Mobile','Tier','Quotes','Subs','Status',''].map(h=>(
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6C757D' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c=>(
                <tr key={c.id} style={{ borderBottom:'1px solid #F0F0F0' }}>
                  <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67' }}>{c.clientCode}</td>
                  <td style={{ padding:'8px 12px', fontWeight:600 }}>{c.companyName}</td>
                  <td style={{ padding:'8px 12px', color:'#6C757D' }}>{c.contactPerson||'—'}</td>
                  <td style={{ padding:'8px 12px', color:'#6C757D' }}>{c.mobile||'—'}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ background:'#EDE0EA', color:'#714B67', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700 }}>
                      T{c.tier} {TIERS[c.tier]}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px', textAlign:'center' }}>{c._count?.quotes||0}</td>
                  <td style={{ padding:'8px 12px', textAlign:'center' }}>{c._count?.subscriptions||0}</td>
                  <td style={{ padding:'8px 12px' }}><Badge s={c.status} /></td>
                  <td style={{ padding:'8px 12px' }}>
                    <button onClick={()=>setModal({ type:'editClient', data:c })}
                      style={{ padding:'3px 10px', background:'#F3EEF3', color:'#714B67', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, cursor:'pointer' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length===0 && (
                <tr><td colSpan={9} style={{ padding:'32px', textAlign:'center', color:'#CCC' }}>No clients yet. Add your first client!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── QUOTE BUILDER ── */}
      {tab==='quote-builder' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            {/* Client select */}
            <div style={sec}>
              <div style={secH}>Select Client</div>
              <div style={secB}>
                <select style={inp} value={selClient?.id||''} onChange={e=>{
                  const c = clients.find(x=>String(x.id)===e.target.value)
                  setSelClient(c||null)
                  if (c) loadTierModules(c.tier)
                }}>
                  <option value="">-- Select client --</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.clientCode} — {c.companyName}</option>)}
                </select>
              </div>
            </div>

            {/* Tier + modules */}
            <div style={sec}>
              <div style={secH}>Tier & Modules</div>
              <div style={secB}>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  {[1,2,3].map(t=>(
                    <button key={t} onClick={()=>loadTierModules(t)}
                      style={{ flex:1, padding:'7px', border:`2px solid ${quoteForm.tier===t?'#1C1C1C':'#E0E0E0'}`,
                        borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer',
                        background: quoteForm.tier===t?'#1C1C1C':'#fff',
                        color: quoteForm.tier===t?'#fff':'#6C757D' }}>
                      T{t} {TIERS[t]}
                    </button>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'20px 1fr 30px 80px 80px 60px', gap:6, padding:'4px 0', borderBottom:'1px solid #EEE', fontSize:10, fontWeight:700, color:'#6C757D' }}>
                  <span/><span>Module</span><span/><span style={{textAlign:'right'}}>Cost/mo</span><span style={{textAlign:'right'}}>Sell/mo</span><span style={{textAlign:'right',color:'#155724'}}>Margin</span>
                </div>
                {MODULES.map(m=>{
                  const margin = m.monthly > 0 ? Math.round(((m.monthly - m.cost)/m.monthly)*100) : 0
                  return (
                  <div key={m.id} style={{ display:'grid', gridTemplateColumns:'20px 1fr 30px 80px 80px 60px', gap:6, alignItems:'center', padding:'5px 0', borderBottom:'1px solid #F5F5F5' }}>
                    <input type="checkbox" checked={!!quoteForm.modules[m.id]}
                      onChange={e=>setQuoteForm(f=>({...f, modules:{...f.modules, [m.id]:e.target.checked}}))} />
                    <span style={{ fontSize:12 }}>{m.name}</span>
                    <span style={{ fontSize:9, background:`${m.tier<=1?'#CCE5FF':m.tier<=2?'#D4EDDA':'#FFF3CD'}`,
                      color:`${m.tier<=1?'#004085':m.tier<=2?'#155724':'#856404'}`, padding:'1px 4px', borderRadius:3, fontWeight:700, textAlign:'center' }}>T{m.tier}</span>
                    <input type="number" value={m.cost} min={0} step={50}
                      onChange={e=>{ m.cost=parseInt(e.target.value)||0; setQuoteForm(f=>({...f})) }}
                      style={{ fontSize:11, padding:'2px 4px', textAlign:'right', border:'1px solid #E0E0E0', borderRadius:3, fontFamily:'DM Mono,monospace', color:'#DC3545' }} />
                    <input type="number" value={m.monthly} min={0} step={100}
                      onChange={e=>{ m.monthly=parseInt(e.target.value)||0; setQuoteForm(f=>({...f})) }}
                      style={{ fontSize:11, padding:'2px 4px', textAlign:'right', border:'1px solid #E0E0E0', borderRadius:3, fontFamily:'DM Mono,monospace', color:'#155724' }} />
                    <span style={{ fontSize:10, fontWeight:700, textAlign:'right',
                      color: margin>=50?'#155724':margin>=30?'#856404':'#DC3545',
                      fontFamily:'DM Mono,monospace' }}>{margin}%</span>
                  </div>
                )})}
              </div>
            </div>
          </div>

          <div>
            {/* Pricing params */}
            <div style={sec}>
              <div style={secH}>Pricing Parameters</div>
              <div style={secB}>
                {[
                  ['Users',          'users',    'number', '5'],
                  ['Discount %',     'discount', 'number', '0'],
                  ['GST %',          'gst',      'number', '18'],
                  ['Setup Fee (₹)',  'setup',    'number', '25000'],
                  ['AMC % (yr 2)',   'amc',      'number', '20'],
                ].map(([label,key,type,ph])=>(
                  <div key={key} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, alignItems:'center', marginBottom:8 }}>
                    <label style={lbl}>{label}</label>
                    <input type={type} style={inp} value={quoteForm[key]||''}
                      onChange={e=>setQuoteForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} />
                  </div>
                ))}
              </div>
            </div>

            {/* Live quote preview */}
            <div style={sec}>
              <div style={secH}>Quote Summary</div>
              <div style={secB}>
                {[
                  ['Modules selected',   `${calc.mods.length} modules`],
                  ['Module charges',     INR(calc.modAmt)+'/mo'],
                  ['Your cost',          INR(calc.totalCost)+'/mo'],
                  ['Gross Profit',       INR(calc.profit)+'/mo'],
                  ['Margin %',           `${calc.margin}%`],
                  ['Extra users',        calc.extra>0?INR(calc.extra)+'/mo':'Included'],
                  ['Discount',           calc.disc>0?'-'+INR(calc.disc)+'/mo':'None'],
                  ['GST',                INR(calc.gst)+'/mo'],
                  ['Monthly Total',      INR(calc.monthly)+'/mo'],
                  ['Setup (incl GST)',   INR(calc.setup)+' one-time'],
                  ['Annual Value',       INR(calc.annual)],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F0F0F0', fontSize:13 }}>
                    <span style={{ color:'#6C757D' }}>{k}</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <button onClick={saveQuote}
                  style={{ width:'100%', padding:'10px', background:'#1C1C1C', color:'#fff',
                    border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer', marginTop:12 }}>
                  💾 Save Quote to DB
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUOTES LIST ── */}
      {tab==='quotes' && (
        <div style={sec}>
          <div style={secH}>All Quotes ({quotes.length})</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F9FA', borderBottom:'1px solid #E8E0E8' }}>
                {['Quote No','Client','Tier','Monthly','Annual','Valid Till','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6C757D' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map(q=>(
                <tr key={q.id} style={{ borderBottom:'1px solid #F0F0F0' }}>
                  <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67', fontWeight:700 }}>{q.quoteNo}</td>
                  <td style={{ padding:'8px 12px', fontWeight:600 }}>{q.client?.companyName}</td>
                  <td style={{ padding:'8px 12px' }}>T{q.tier} {TIERS[q.tier]}</td>
                  <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace' }}>{INR(q.totalMonthly)}</td>
                  <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace' }}>{INR(q.annualValue)}</td>
                  <td style={{ padding:'8px 12px', color:'#6C757D' }}>{fmtD(q.validTill)}</td>
                  <td style={{ padding:'8px 12px' }}><Badge s={q.status} /></td>
                  <td style={{ padding:'8px 12px', display:'flex', gap:4 }}>
                    {q.status==='DRAFT' && <button onClick={()=>updateQuoteStatus(q.id,'SENT')} style={{ padding:'3px 8px', background:'#FFF3CD', color:'#856404', border:'1px solid #FFEAA7', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>Send</button>}
                    {q.status==='SENT'  && <button onClick={()=>updateQuoteStatus(q.id,'ACCEPTED')} style={{ padding:'3px 8px', background:'#D4EDDA', color:'#155724', border:'1px solid #C3E6CB', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>Accept ✓</button>}
                    {q.status==='SENT'  && <button onClick={()=>updateQuoteStatus(q.id,'REJECTED')} style={{ padding:'3px 8px', background:'#F8D7DA', color:'#721C24', border:'1px solid #F5C6CB', borderRadius:4, fontSize:10, cursor:'pointer', fontWeight:700 }}>Reject</button>}
                  </td>
                </tr>
              ))}
              {quotes.length===0 && <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color:'#CCC' }}>No quotes yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {tab==='subscriptions' && (
        <div style={sec}>
          <div style={secH}>Active Subscriptions ({subs.length})</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#F8F9FA', borderBottom:'1px solid #E8E0E8' }}>
                {['Sub Code','Client','Tier','Monthly','Next Bill','Invoices','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6C757D' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map(s=>(
                <tr key={s.id} style={{ borderBottom:'1px solid #F0F0F0' }}>
                  <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67', fontWeight:700 }}>{s.subCode}</td>
                  <td style={{ padding:'8px 12px', fontWeight:600 }}>{s.client?.companyName}</td>
                  <td style={{ padding:'8px 12px' }}>T{s.tier}</td>
                  <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontWeight:700 }}>{INR(s.monthlyAmt)}</td>
                  <td style={{ padding:'8px 12px', color: new Date(s.nextBillDate)<new Date()?'#DC3545':'#6C757D' }}>{fmtD(s.nextBillDate)}</td>
                  <td style={{ padding:'8px 12px', textAlign:'center' }}>{s._count?.invoices||0}</td>
                  <td style={{ padding:'8px 12px' }}><Badge s={s.status} /></td>
                  <td style={{ padding:'8px 12px' }}>
                    <button onClick={()=>genInvoice(s.id)}
                      style={{ padding:'3px 10px', background:'#D4EDDA', color:'#155724', border:'1px solid #C3E6CB', borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:700 }}>
                      Gen Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {subs.length===0 && <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color:'#CCC' }}>No subscriptions yet. Accept a quote to create one.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Projects Tab ── */}
      {tab==='projects' && (
        <div style={sec}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={secH}>📌 Implementation Projects ({projects.length})</div>
            <button onClick={()=>{ setEditProj(null); setProjForm({ clientName:'', industry:'Injection Moulding', package:'Professional', startDate:new Date().toISOString().slice(0,10), goLiveDate:'', status:'Planning', health:'green', currentPhase:0, pm:'Saravanan', contactPerson:'', contractValue:'', location:'Coimbatore', notes:'' }); setProjModal(true) }}
              style={{ padding:'6px 16px', background:'#714B67', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:13 }}>+ New Project</button>
          </div>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
            {[['Total',projects.length,'#714B67'],['Active',projects.filter(p=>p.status==='Active').length,'#1E8449'],['Planning',projects.filter(p=>p.status==='Planning').length,'#1A5276'],['Completed',projects.filter(p=>p.status==='Completed').length,'#27AE60'],['Delayed',projects.filter(p=>p.status==='Delayed').length,'#C0392B']].map(([l,v,c])=>(
              <div key={l} style={{ background:'#fff', borderRadius:8, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,.06)', borderLeft:`3px solid ${c}` }}>
                <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:'#888' }}>{l}</div>
              </div>
            ))}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#714B67', color:'#fff' }}>
                {['Project Code','Customer','Industry','Package','Start','Go-Live','Phase','Progress','Status','Health','Value','Actions'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p,i)=>{
                const phases = typeof p.phases === 'string' ? JSON.parse(p.phases||'[]') : (p.phases||[])
                let done=0, total=0
                phases.forEach(ph=>(ph.tasks||[]).forEach(t=>{total++;if(t.done)done++}))
                const prog = total ? Math.round(done/total*100) : 0
                const dl = p.goLiveDate ? Math.ceil((new Date(p.goLiveDate)-new Date())/86400000) : null
                const phaseNames = ['Kickoff','Setup','Data Entry','Training','Go-Live','Hypercare','Done']
                const phaseColors = ['#714B67','#1A5276','#1E8449','#D35400','#C0392B','#27AE60','#95A5A6']
                const pi = parseInt(p.currentPhase||0)
                return (
                  <tr key={p.id} style={{ background:i%2===0?'#fff':'#F9F6F8', borderBottom:'1px solid #F0E8EC' }}>
                    <td style={{ padding:'9px 12px', fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67', fontWeight:700 }}>{p.projectCode}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{p.clientName}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>{p.industry||'—'}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>{p.package||'—'}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>{fmtD(p.startDate)}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>
                      {fmtD(p.goLiveDate)}
                      {dl!==null && <div style={{ fontSize:10, color:dl<0?'#C0392B':dl<7?'#B8860B':'#888' }}>{dl<0?Math.abs(dl)+' overdue':dl+' days'}</div>}
                    </td>
                    <td style={{ padding:'9px 12px', fontSize:11, fontWeight:600, color:phaseColors[pi] }}>{phaseNames[pi]}</td>
                    <td style={{ padding:'9px 12px', minWidth:80 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, height:6, background:'#E8E0EC', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:prog+'%', background:prog>=80?'#1E8449':prog>=40?'#B8860B':'#714B67', borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:11, color:'#888' }}>{prog}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'3px 9px', borderRadius:12, fontSize:11, fontWeight:600, background:{Planning:'#EBF5FB',Active:'#E8F5E9','On Hold':'#FEF9E7',Completed:'#F0EBF0',Delayed:'#FDEDEC'}[p.status]||'#f0f0f0', color:{Planning:'#1A5276',Active:'#1E8449','On Hold':'#B8860B',Completed:'#714B67',Delayed:'#C0392B'}[p.status]||'#333' }}>{p.status}</span>
                    </td>
                    <td style={{ padding:'9px 12px', textAlign:'center' }}>{{green:'🟢',yellow:'🟡',red:'🔴'}[p.health]||'⚪'}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600, color:'#1E8449' }}>{p.contractValue?'₹'+parseFloat(p.contractValue).toLocaleString('en-IN'):'—'}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={()=>{ setEditProj(p); setProjForm({ clientName:p.clientName, industry:p.industry||'', package:p.package||'Professional', startDate:p.startDate?p.startDate.slice(0,10):'', goLiveDate:p.goLiveDate?p.goLiveDate.slice(0,10):'', status:p.status, health:p.health, currentPhase:p.currentPhase||0, pm:p.pm||'', contactPerson:p.contactPerson||'', contractValue:p.contractValue||'', location:p.location||'', notes:p.notes||'' }); setProjModal(true) }}
                          style={{ padding:'3px 8px', background:'#EBF5FB', color:'#1A5276', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>✏️</button>
                        <button onClick={async()=>{ if(!confirm('Delete project?')) return; await fetch(`${BASE}/billing/projects/${p.id}`,{method:'DELETE',headers:hdr2()}); loadProjects() }}
                          style={{ padding:'3px 8px', background:'#FDEDEC', color:'#C0392B', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {projects.length===0 && <tr><td colSpan={12} style={{ padding:32, textAlign:'center', color:'#ccc' }}>No projects yet. Click + New Project to add.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AMC Tracker Tab ── */}
      {tab==='amc' && (
        <div style={sec}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={secH}>🔒 AMC Tracker ({amcs.length})</div>
            <button onClick={()=>{ setEditAmc(null); setAmcForm({ clientName:'', package:'Professional', startDate:new Date().toISOString().slice(0,10), endDate:'', amount:'', gstPct:18, notes:'' }); setAmcModal(true) }}
              style={{ padding:'6px 16px', background:'#714B67', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:13 }}>+ New AMC</button>
          </div>
          {/* AMC Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              ['Total AMCs', amcs.length, '#714B67'],
              ['Active', amcs.filter(a=>a.computedStatus==='ACTIVE').length, '#1E8449'],
              ['Expiring Soon (30 days)', amcs.filter(a=>a.daysLeft>=0&&a.daysLeft<=30).length, '#B8860B'],
              ['Expired', amcs.filter(a=>a.computedStatus==='EXPIRED').length, '#C0392B'],
            ].map(([l,v,c])=>(
              <div key={l} style={{ background:'#fff', borderRadius:8, padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,.06)', borderLeft:`3px solid ${c}` }}>
                <div style={{ fontSize:22, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:'#888' }}>{l}</div>
              </div>
            ))}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#714B67', color:'#fff' }}>
                {['AMC Code','Customer','Package','Start','End Date','Days Left','Amount','GST','Total','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {amcs.map((a,i)=>{
                const dl = a.daysLeft
                const expired = a.computedStatus==='EXPIRED'
                const expiring = !expired && dl>=0 && dl<=30
                return (
                  <tr key={a.id} style={{ background:expired?'#FFF5F5':expiring?'#FFFDE7':i%2===0?'#fff':'#F9F6F8', borderBottom:'1px solid #F0E8EC' }}>
                    <td style={{ padding:'9px 12px', fontFamily:'DM Mono,monospace', fontSize:11, color:'#714B67', fontWeight:700 }}>{a.amcCode}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{a.clientName}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>{a.package||'—'}</td>
                    <td style={{ padding:'9px 12px', fontSize:12 }}>{fmtD(a.startDate)}</td>
                    <td style={{ padding:'9px 12px', fontSize:12, fontWeight:600, color:expired?'#C0392B':expiring?'#B8860B':'#333' }}>{fmtD(a.endDate)}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center' }}>
                      {expired ? <span style={{ color:'#C0392B', fontWeight:700 }}>EXPIRED</span>
                        : expiring ? <span style={{ color:'#B8860B', fontWeight:700 }}>⚠️ {dl}d</span>
                        : <span style={{ color:'#1E8449' }}>{dl}d</span>}
                    </td>
                    <td style={{ padding:'9px 12px' }}>₹{parseFloat(a.amount||0).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'9px 12px' }}>₹{parseFloat(a.gstAmt||0).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:'#1E8449' }}>₹{parseFloat(a.totalAmount||0).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'3px 9px', borderRadius:12, fontSize:11, fontWeight:600, background:{ACTIVE:'#E8F5E9',EXPIRED:'#FDEDEC',RENEWED:'#EBF5FB',CANCELLED:'#E2E3E5'}[a.computedStatus]||'#f0f0f0', color:{ACTIVE:'#1E8449',EXPIRED:'#C0392B',RENEWED:'#1A5276',CANCELLED:'#6C757D'}[a.computedStatus]||'#333' }}>{a.computedStatus}</span>
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {expiring && <button onClick={async()=>{ const newEnd=new Date(a.endDate);newEnd.setFullYear(newEnd.getFullYear()+1);await fetch(`${BASE}/billing/amc/${a.id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status:'RENEWED',renewedDate:new Date().toISOString(),endDate:newEnd.toISOString()})});loadAmcs();toast.success('AMC Renewed for 1 year') }}
                          style={{ padding:'3px 8px', background:'#E8F5E9', color:'#1E8449', border:'none', borderRadius:4, fontSize:11, cursor:'pointer', fontWeight:700 }}>🔄 Renew</button>}
                        <button onClick={()=>{ setEditAmc(a); setAmcForm({ clientName:a.clientName, package:a.package||'', startDate:a.startDate?a.startDate.slice(0,10):'', endDate:a.endDate?a.endDate.slice(0,10):'', amount:a.amount, gstPct:18, notes:a.notes||'' }); setAmcModal(true) }}
                          style={{ padding:'3px 8px', background:'#EBF5FB', color:'#1A5276', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>✏️</button>
                        <button onClick={async()=>{ if(!confirm('Delete AMC?'))return; await fetch(`${BASE}/billing/amc/${a.id}`,{method:'DELETE',headers:hdr2()}); loadAmcs() }}
                          style={{ padding:'3px 8px', background:'#FDEDEC', color:'#C0392B', border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {amcs.length===0 && <tr><td colSpan={11} style={{ padding:32, textAlign:'center', color:'#ccc' }}>No AMC records yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Project Modal ── */}
      {projModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={()=>setProjModal(false)}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:620, maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:'0 0 16px', color:'#714B67' }}>{editProj?'✏️ Edit Project':'➕ New Project'}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['Customer Name *', 'clientName', 'text', 'e.g. Texmo Industries'],
                ['Industry', 'industry', 'text', 'Injection Moulding'],
                ['Package', 'package', 'select', ['Starter','Professional','Enterprise','Custom']],
                ['Status', 'status', 'select', ['Planning','Active','On Hold','Completed','Delayed']],
                ['Start Date', 'startDate', 'date', ''],
                ['Go-Live Date', 'goLiveDate', 'date', ''],
                ['Health', 'health', 'select', ['green','yellow','red']],
                ['Current Phase', 'currentPhase', 'select', ['0','1','2','3','4','5','6']],
                ['Project Manager', 'pm', 'text', 'Saravanan'],
                ['Customer Contact', 'contactPerson', 'text', 'Name — Phone'],
                ['Contract Value (₹)', 'contractValue', 'number', '150000'],
                ['Location', 'location', 'text', 'Coimbatore'],
              ].map(([label, key, type, extra])=>(
                <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#666' }}>{label}</label>
                  {type === 'select'
                    ? <select value={projForm[key]} onChange={e=>setProjForm(f=>({...f,[key]:e.target.value}))}
                        style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit' }}>
                        {(Array.isArray(extra)?extra:[]).map(o=><option key={o} value={o}>{key==='currentPhase'?['Kickoff','Setup','Data Entry','Training','Go-Live','Hypercare','Done'][parseInt(o)]:key==='health'?{green:'🟢 On Track',yellow:'🟡 At Risk',red:'🔴 Off Track'}[o]:o}</option>)}
                      </select>
                    : <input type={type} value={projForm[key]} placeholder={typeof extra==='string'?extra:''} onChange={e=>setProjForm(f=>({...f,[key]:e.target.value}))}
                        style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit' }} />
                  }
                </div>
              ))}
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#666' }}>Notes</label>
                <textarea value={projForm.notes} onChange={e=>setProjForm(f=>({...f,notes:e.target.value}))} rows={2}
                  style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={()=>setProjModal(false)} style={{ padding:'8px 18px', background:'#f0f0f0', border:'none', borderRadius:6, cursor:'pointer' }}>Cancel</button>
              <button onClick={async()=>{
                if(!projForm.clientName.trim()){toast.error('Customer name required');return}
                const url = editProj ? `${BASE}/billing/projects/${editProj.id}` : `${BASE}/billing/projects`
                const method = editProj ? 'PATCH' : 'POST'
                const r = await fetch(url,{method,headers:hdr(),body:JSON.stringify(projForm)})
                const d = await r.json()
                if(d.error){toast.error(d.error);return}
                toast.success(editProj?'Project updated':'Project created')
                setProjModal(false); loadProjects()
              }} style={{ padding:'8px 18px', background:'#714B67', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AMC Modal ── */}
      {amcModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={()=>setAmcModal(false)}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:520 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:'0 0 16px', color:'#714B67' }}>{editAmc?'✏️ Edit AMC':'➕ New AMC'}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['Customer Name *','clientName','text','e.g. Texmo Industries'],
                ['Package','package','select',['Starter','Professional','Enterprise']],
                ['Start Date *','startDate','date',''],
                ['End Date *','endDate','date',''],
                ['AMC Amount (₹) *','amount','number','24000'],
                ['GST %','gstPct','number','18'],
              ].map(([label,key,type,extra])=>(
                <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'#666' }}>{label}</label>
                  {type==='select'
                    ? <select value={amcForm[key]} onChange={e=>setAmcForm(f=>({...f,[key]:e.target.value}))} style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit' }}>
                        {(Array.isArray(extra)?extra:[]).map(o=><option key={o}>{o}</option>)}
                      </select>
                    : <input type={type} value={amcForm[key]} placeholder={typeof extra==='string'?extra:''} onChange={e=>setAmcForm(f=>({...f,[key]:e.target.value}))} style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit' }} />
                  }
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <div style={{ background:'#F9F6F8', padding:'10px 14px', borderRadius:8, fontSize:13 }}>
                  <strong>Total Amount (with GST):</strong>
                  <span style={{ float:'right', fontWeight:700, color:'#1E8449' }}>
                    ₹{(parseFloat(amcForm.amount||0) * (1 + parseFloat(amcForm.gstPct||18)/100)).toLocaleString('en-IN', {minimumFractionDigits:2})}
                  </span>
                </div>
              </div>
              <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#666' }}>Notes</label>
                <textarea value={amcForm.notes} onChange={e=>setAmcForm(f=>({...f,notes:e.target.value}))} rows={2}
                  style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:6, fontSize:13, fontFamily:'inherit' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={()=>setAmcModal(false)} style={{ padding:'8px 18px', background:'#f0f0f0', border:'none', borderRadius:6, cursor:'pointer' }}>Cancel</button>
              <button onClick={async()=>{
                if(!amcForm.clientName.trim()||!amcForm.startDate||!amcForm.endDate||!amcForm.amount){toast.error('Fill all required fields');return}
                const url = editAmc ? `${BASE}/billing/amc/${editAmc.id}` : `${BASE}/billing/amc`
                const method = editAmc ? 'PATCH' : 'POST'
                const r = await fetch(url,{method,headers:hdr(),body:JSON.stringify(amcForm)})
                const d = await r.json()
                if(d.error){toast.error(d.error);return}
                toast.success(editAmc?'AMC updated':'AMC created')
                setAmcModal(false); loadAmcs()
              }} style={{ padding:'8px 18px', background:'#714B67', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Modal ── */}
      {modal && ['newClient','editClient'].includes(modal.type) && (
        <ClientModal data={modal.data} onSave={saveClient} onClose={()=>setModal(null)} />
      )}
    </div>
  )
}

function ClientModal({ data, onSave, onClose }) {
  const [form, setForm] = useState(data || { status:'PROSPECT', tier:1, industry:'Injection Moulding' })
  const sf = (k,v) => setForm(f=>({...f,[k]:v}))
  const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
  const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:12, width:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ background:'linear-gradient(135deg,#1C1C1C,#333)', color:'#fff', padding:'14px 20px', display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontWeight:800, fontSize:14 }}>{data?.id ? 'Edit Client' : 'New Client'}</span>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div><label style={lbl}>Company Name *</label><input style={inp} value={form.companyName||''} onChange={e=>sf('companyName',e.target.value)} /></div>
            <div><label style={lbl}>Contact Person</label><input style={inp} value={form.contactPerson||''} onChange={e=>sf('contactPerson',e.target.value)} /></div>
            <div><label style={lbl}>Email</label><input type="email" style={inp} value={form.email||''} onChange={e=>sf('email',e.target.value)} /></div>
            <div><label style={lbl}>Mobile</label><input style={inp} value={form.mobile||''} onChange={e=>sf('mobile',e.target.value)} /></div>
            <div><label style={lbl}>GSTIN</label><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.gstin||''} onChange={e=>sf('gstin',e.target.value)} /></div>
            <div><label style={lbl}>Industry</label>
              <select style={inp} value={form.industry||''} onChange={e=>sf('industry',e.target.value)}>
                {['Injection Moulding','Surface Treatment','Textile','Food & Beverage','Trading','Engineering','Pharma','Construction','General Manufacturing'].map(i=><option key={i}>{i}</option>)}
              </select>
            </div>
            <div><label style={lbl}>City</label><input style={inp} value={form.city||''} onChange={e=>sf('city',e.target.value)} /></div>
            <div><label style={lbl}>State</label><input style={inp} value={form.state||''} onChange={e=>sf('state',e.target.value)} placeholder="Tamil Nadu" /></div>
            <div><label style={lbl}>Tier</label>
              <select style={inp} value={form.tier} onChange={e=>sf('tier',+e.target.value)}>
                <option value={1}>Tier 1 — Starter</option>
                <option value={2}>Tier 2 — Professional</option>
                <option value={3}>Tier 3 — Enterprise</option>
              </select>
            </div>
            <div><label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={e=>sf('status',e.target.value)}>
                {['PROSPECT','ACTIVE','INACTIVE','CHURNED'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={form.notes||''} onChange={e=>sf('notes',e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'8px 20px', background:'#fff', border:'1px solid #DDD', borderRadius:6, fontSize:13, cursor:'pointer', color:'#6C757D' }}>Cancel</button>
            <button onClick={()=>onSave(form)} style={{ padding:'8px 24px', background:'#1C1C1C', color:'#fff', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
              {data?.id ? '✓ Update' : '✓ Create Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
