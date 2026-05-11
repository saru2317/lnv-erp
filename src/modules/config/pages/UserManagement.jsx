import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

// ── DATA ──────────────────────────────────────────────
const AVATAR_COLORS = ['#714B67','#E06F39','#00A09D','#017E84','#8E44AD','#1A5276','#196F3D','#B03A37','#B7860B','#4A235A']

const MODULES_LIST = [
  {k:'sd',   icon:'▸', name:'Sales (SD)'},
  {k:'mm',   icon:'▸', name:'Purchase (MM)'},
  {k:'wm',   icon:'▸', name:'Warehouse (WM)'},
  {k:'fi',   icon:'▸', name:'Finance (FI)'},
  {k:'pp',   icon:'▸', name:'Production (PP)'},
  {k:'qm',   icon:'▸', name:'Quality (QM)'},
  {k:'pm',   icon:'▸', name:'Maintenance (PM)'},
  {k:'hcm',  icon:'▸', name:'HR (HCM)'},
  {k:'crm',  icon:'▸', name:'CRM'},
  {k:'am',   icon:'▸', name:'Assets'},
  {k:'tm',   icon:'▸', name:'Transport'},
  {k:'vm',   icon:'🪪', name:'Visitor'},
  {k:'cn',   icon:'▸', name:'Canteen'},
  {k:'civil',icon:'▸', name:'Civil'},
  {k:'config',icon:'▸',name:'Config'},
  {k:'mdm',   icon:'▸', name:'MDM'},
]

const PERMS_LIST = [
  {k:'view',    icon:'▸', name:'View Records',    sub:'Read-only access'},
  {k:'create',  icon:'▸', name:'Create Records',   sub:'Add new entries'},
  {k:'edit',    icon:'▸', name:'Edit Records',     sub:'Modify existing'},
  {k:'delete',  icon:'▸', name:'Delete Records',   sub:'Remove entries'},
  {k:'approve', icon:'▸', name:'Approve / Reject', sub:'Workflow approvals'},
  {k:'export',  icon:'▸', name:'Export Data',       sub:'Excel / PDF export'},
  {k:'reports', icon:'▸', name:'View Reports',      sub:'MIS & analytics'},
  {k:'settings',icon:'▸', name:'System Settings',  sub:'Config & setup'},
]

const ROLE_MOD = {
  admin:      ['sd','mm','wm','fi','pp','qm','pm','hcm','crm','am','tm','vm','cn','civil','config'],
  manager:    ['pp','qm','pm','wm','mm'],
  accounts:   ['fi','sd','mm'],
  operations: ['pp','qm','pm'],
  hr:         ['hcm','cn','vm'],
  sales:      ['sd','crm'],
  viewer:     ['sd','pp','fi'],
}
const ROLE_PERM = {
  admin:      ['view','create','edit','delete','approve','export','reports','settings'],
  manager:    ['view','create','edit','approve','export','reports'],
  accounts:   ['view','create','edit','approve','export','reports'],
  operations: ['view','create','edit'],
  hr:         ['view','create','edit','approve','export'],
  sales:      ['view','create','edit','export'],
  viewer:     ['view'],
}
const ROLE_LABELS = {admin:' Super Admin',manager:' Plant Manager',accounts:' Accounts',operations:' Operations',hr:' HR Manager',sales:' Sales Officer',viewer:' Viewer'}
const ROLE_BG     = {admin:'#F7F0F5',manager:'#FDF0EA',accounts:'#E6F7F7',operations:'#E6F4F5',hr:'#F4ECF7',sales:'#E6F4F5',viewer:'#F5F5F5'}
const ROLE_CLR    = {admin:'#714B67',manager:'#E06F39',accounts:'#00A09D',operations:'#017E84',hr:'#8E44AD',sales:'#015E63',viewer:'#6C757D'}
const ROLE_DESC   = {admin:'Full system access — all modules and settings',manager:'Production, quality, maintenance oversight',accounts:'Finance, GST, payables & receivables',operations:'Production execution, QC, maintenance tasks',hr:'Employee management, payroll, leave approval',sales:'Sales orders, CRM leads and follow-ups',viewer:'Read-only access — no edit or approve rights'}
const DEPTS = ['Production','Quality','Accounts','HR','Sales','Warehouse','Maintenance','Administration','IT']

const INIT_USERS = [
  {id:1, fname:'Admin',   lname:'Kumar',   email:'admin@lnvinfotech.com',   mobile:'+91 98001 00001', dept:'Administration', desig:'System Administrator', uname:'admin',      role:'admin',      status:'active',   online:true,  color:'#714B67', lastLogin:'Today 09:12 AM',  modules:ROLE_MOD.admin,      perms:ROLE_PERM.admin,      notes:'System super admin'},
  {id:2, fname:'Ramesh',  lname:'Kumar',   email:'ramesh@lnvinfotech.com',  mobile:'+91 98001 00002', dept:'Production',     desig:'Plant Manager',         uname:'manager',    role:'manager',    status:'active',   online:true,  color:'#E06F39', lastLogin:'Today 08:45 AM',  modules:ROLE_MOD.manager,    perms:ROLE_PERM.manager,    notes:''},
  {id:3, fname:'Priya',   lname:'Sharma',  email:'priya@lnvinfotech.com',   mobile:'+91 98001 00003', dept:'Accounts',       desig:'Senior Accountant',     uname:'accounts',   role:'accounts',   status:'active',   online:true,  color:'#00A09D', lastLogin:'Today 09:00 AM',  modules:ROLE_MOD.accounts,   perms:ROLE_PERM.accounts,   notes:''},
  {id:4, fname:'Suresh',  lname:'Kumar',   email:'suresh@lnvinfotech.com',  mobile:'+91 98001 00004', dept:'Production',     desig:'Machine Operator',      uname:'operations', role:'operations', status:'active',   online:false, color:'#017E84', lastLogin:'Yesterday 06:30 PM', modules:ROLE_MOD.operations, perms:ROLE_PERM.operations, notes:''},
  {id:5, fname:'Kavitha', lname:'Devi',    email:'kavitha@lnvinfotech.com', mobile:'+91 98001 00005', dept:'HR',             desig:'HR Manager',            uname:'hr',         role:'hr',         status:'active',   online:false, color:'#8E44AD', lastLogin:'Today 08:30 AM',  modules:ROLE_MOD.hr,         perms:ROLE_PERM.hr,         notes:''},
  {id:6, fname:'Raj',     lname:'Kumar',   email:'raj@lnvinfotech.com',     mobile:'+91 98001 00006', dept:'Sales',          desig:'Sales Executive',       uname:'sales',      role:'sales',      status:'active',   online:false, color:'#015E63', lastLogin:'Today 09:15 AM',  modules:ROLE_MOD.sales,      perms:ROLE_PERM.sales,      notes:''},
  {id:7, fname:'Muthu',   lname:'Krishnan',email:'muthu@lnvinfotech.com',   mobile:'+91 98001 00007', dept:'Quality',        desig:'QC Inspector',          uname:'muthu.qc',   role:'operations', status:'active',   online:false, color:'#196F3D', lastLogin:'Today 07:00 AM',  modules:['qm','pp'],         perms:['view','create','edit'], notes:'QC Team'},
  {id:8, fname:'Selvi',   lname:'Rajan',   email:'selvi@lnvinfotech.com',   mobile:'+91 98001 00008', dept:'Accounts',       desig:'Junior Accountant',     uname:'selvi.acc',  role:'accounts',   status:'active',   online:false, color:'#007A77', lastLogin:'28 Feb 2026',     modules:['fi'],              perms:['view','create'],    notes:''},
  {id:9, fname:'Arun',    lname:'Babu',    email:'arun@lnvinfotech.com',    mobile:'+91 98001 00009', dept:'Warehouse',      desig:'Store Keeper',          uname:'arun.wm',    role:'operations', status:'active',   online:false, color:'#1A5276', lastLogin:'28 Feb 2026',     modules:['wm','mm'],         perms:['view','create','edit'], notes:''},
  {id:10,fname:'Vijay',   lname:'Anand',   email:'vijay@lnvinfotech.com',   mobile:'+91 98001 00010', dept:'Sales',          desig:'Sales Executive',       uname:'vijay.sales',role:'sales',      status:'inactive', online:false, color:'#B85A2E', lastLogin:'15 Feb 2026',     modules:ROLE_MOD.sales,      perms:ROLE_PERM.sales,      notes:'On leave'},
  {id:11,fname:'Meena',   lname:'Priya',   email:'meena@lnvinfotech.com',   mobile:'+91 98001 00011', dept:'HR',             desig:'HR Executive',          uname:'meena.hr',   role:'hr',         status:'inactive', online:false, color:'#6C3483', lastLogin:'10 Feb 2026',     modules:['hcm'],             perms:['view'],             notes:'Relieved'},
  {id:12,fname:'Guest',   lname:'User',    email:'guest@lnvinfotech.com',   mobile:'',                dept:'',               desig:'Read-only Viewer',      uname:'guest',      role:'viewer',     status:'inactive', online:false, color:'#6C757D', lastLogin:'Never',           modules:ROLE_MOD.viewer,     perms:ROLE_PERM.viewer,     notes:'Demo guest account'},
]

const INIT_AUDIT = [
  {type:'add',   msg:'System initialized — Admin Kumar created',  meta:'Super Admin · All modules',          time:'01 Mar 2026 · 08:00 AM'},
  {type:'login', msg:'Admin Kumar logged in',                     meta:'IP: 192.168.1.10 · Chrome',          time:'01 Mar 2026 · 09:12 AM'},
  {type:'edit',  msg:'Muthu Krishnan role updated',               meta:'Operations → QC Operator',           time:'28 Feb 2026 · 04:30 PM'},
  {type:'perm',  msg:'Priya Sharma permissions updated',          meta:'Added: Export Data · Reports',       time:'27 Feb 2026 · 11:00 AM'},
]

const BLANK_FORM = {
  fname:'', lname:'', email:'', mobile:'', dept:'Production', desig:'',
  uname:'', pass:'', role:'operations', status:'active', notes:'',
  color: AVATAR_COLORS[0],
  modules: [...ROLE_MOD.operations],
  perms:   [...ROLE_PERM.operations],
}

// ── HELPERS ───────────────────────────────────────────
const initials = u => (u.fname[0] + u.lname[0]).toUpperCase()
const avStyle  = (color, size=34) => ({
  width:size, height:size, borderRadius:'50%', background:color,
  display:'flex', alignItems:'center', justifyContent:'center',
  fontSize: size > 40 ? 18 : 12, fontWeight:800, color:'#fff',
  fontFamily:'Syne,sans-serif', flexShrink:0,
})
const rolePill = role => ({
  display:'inline-flex', alignItems:'center', gap:4,
  padding:'3px 9px', borderRadius:8, fontSize:10, fontWeight:700,
  background: ROLE_BG[role]||'#F5F5F5', color: ROLE_CLR[role]||'#6C757D',
})
const dotStyle = u => ({
  width:7, height:7, borderRadius:'50%', flexShrink:0,
  background: u.online ? '#00E5B0' : u.status==='active' ? '#ADB5BD' : '#D9534F',
})
const statusLabel = u => u.online ? 'Online' : u.status==='active' ? 'Active' : 'Inactive'
const inputSt = err => ({
  padding:'9px 12px', background:'var(--odoo-bg)',
  border:`1.5px solid ${err ? '#D9534F' : 'var(--odoo-border)'}`,
  borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12,
  color:'var(--odoo-dark)', outline:'none', width:'100%',
})
const gBtn = {
  padding:'6px 12px', borderRadius:7, fontSize:11, fontWeight:600,
  cursor:'pointer', border:'none', background:'transparent', color:'var(--odoo-purple)',
}
const AUDIT_ICONS = {add:'',edit:'',del:'',login:'',perm:'',pass:''}
const AUDIT_BG    = {add:'#E6F7F7',edit:'#FDF0EA',del:'#FDEDEC',login:'#EDE0EA',perm:'#F4ECF7',pass:'#FEF8E6'}

// ── TOAST ─────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type='s') => {
    const id = Date.now()
    setToasts(t => [...t, {id, msg, type}])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  return {toasts, add}
}

// ── MAIN ──────────────────────────────────────────────
export default function UserManagement() {
  const [users,      setUsers]      = useState(INIT_USERS)

  // ── Backend API load ─────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/users`, { headers: hdr2() })
      if (!r.ok) return // keep static data if API not ready
      const d = await r.json()
      const arr = d.data || d
      if (Array.isArray(arr) && arr.length > 0) setUsers(arr)
    } catch {} // silent fallback to INIT_USERS
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])
  const [audit,      setAudit]      = useState(INIT_AUDIT)
  const [view,       setView]       = useState('table')
  const [fStatus,    setFStatus]    = useState('all')
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [form,       setForm]       = useState({...BLANK_FORM})
  const [errors,     setErrors]     = useState({})
  // Modals
  const [deleteId,   setDeleteId]   = useState(null)
  const [permUser,   setPermUser]   = useState(null)
  const [permMods,   setPermMods]   = useState([])
  const [permPerms,  setPermPerms]  = useState([])
  const [showAudit,  setShowAudit]  = useState(false)
  const [showRoles,  setShowRoles]  = useState(false)
  const {toasts, add: toast} = useToast()

  const stats = {
    total:    users.length,
    active:   users.filter(u => u.status==='active').length,
    online:   users.filter(u => u.online).length,
    inactive: users.filter(u => u.status==='inactive').length,
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const ms = !q || `${u.fname} ${u.lname}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.uname.toLowerCase().includes(q)
    const mst = fStatus==='all' || (fStatus==='active'&&u.status==='active') || (fStatus==='inactive'&&u.status==='inactive') || (fStatus==='online'&&u.online)
    const mr = !roleFilter || u.role===roleFilter
    return ms && mst && mr
  })

  const addAudit = (type, msg, meta) => {
    const now = new Date()
    const time = now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
    setAudit(a => [{type, msg, meta, time}, ...a])
  }

  // ── DRAWER ──
  const openAdd = () => { setEditId(null); setForm({...BLANK_FORM}); setErrors({}); setDrawerOpen(true) }
  const openEdit = u => { setEditId(u.id); setForm({...u, pass:''}); setErrors({}); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setEditId(null) }

  const fc = (k, v) => setForm(f => {
    const upd = {...f, [k]: v}
    if (k==='role') { upd.modules=[...ROLE_MOD[v]||[]]; upd.perms=[...ROLE_PERM[v]||[]] }
    return upd
  })
  const toggleMod  = k => setForm(f => ({...f, modules: f.modules.includes(k) ? f.modules.filter(m=>m!==k) : [...f.modules,k]}))
  const togglePerm = k => setForm(f => ({...f, perms:   f.perms.includes(k)   ? f.perms.filter(p=>p!==k)  : [...f.perms,k]}))
  const setAllMods = v => setForm(f => ({...f, modules: v ? MODULES_LIST.map(m=>m.k) : []}))

  const saveUser = async () => {
    const e = {}
    if (!form.fname.trim()) e.fname = true
    if (!form.lname.trim()) e.lname = true
    if (!form.email.trim()) e.email = true
    if (!form.uname.trim()) e.uname = true
    if (Object.keys(e).length) { setErrors(e); toast('Please fill all required fields','w'); return }
    // Try backend first
    try {
      const payload = {
        name:`${form.fname} ${form.lname}`.trim(), email:form.email,
        username:form.uname, mobile:form.mobile||null, role:form.role,
        dept:form.dept||null, designation:form.desig||null,
        moduleAccess:form.modules||[], isActive:form.status!=='inactive',
        ...(form.pass?{password:form.pass}:{}),
      }
      const url    = editId ? `${BASE_URL}/users/${editId}` : `${BASE_URL}/users`
      const method = editId ? 'PATCH' : 'POST'
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error||'Failed')
      toast(`${form.fname} ${form.lname} ${editId?'updated':'created'}!`,'s')
      addAudit(editId?'edit':'add',`${editId?'Updated':'New'}: ${form.fname} ${form.lname}`,`Role: ${ROLE_LABELS[form.role]}`)
      loadUsers(); closeDrawer(); return
    } catch(err) { console.warn('Backend:', err.message) }
    // Fallback local state
    if (editId) {
      setUsers(us => us.map(u => u.id===editId ? {...u, ...form, id:editId} : u))
      toast(`${form.fname} ${form.lname} updated successfully!`, 's')
      addAudit('edit', `Updated user ${form.fname} ${form.lname}`, `Role: ${ROLE_LABELS[form.role]}`)
    } else {
      setUsers(us => [{...form, id:Date.now(), online:false, lastLogin:'Never'}, ...us])
      toast(`User ${form.fname} ${form.lname} created!`, 's')
      addAudit('add', `New user: ${form.fname} ${form.lname}`, `Role: ${ROLE_LABELS[form.role]}`)
    }
    closeDrawer()
  }

  // ── DELETE ──
  const confirmDelete = async () => {
    const u = users.find(x=>x.id===deleteId)
    try {
      await fetch(`${BASE_URL}/users/${deleteId}`,{method:'DELETE',headers:hdr2()})
      toast(`${u?.fname} ${u?.lname} deleted`,'w')
      loadUsers()
    } catch {
      if(u) { setUsers(us=>us.filter(x=>x.id!==deleteId)); toast(`${u.fname} ${u.lname} deleted`,'w') }
    }
    addAudit('del',`Deleted ${u?.fname} ${u?.lname}`,`@${u?.uname}`)
    setDeleteId(null)
  }

  // ── PERMS ──
  const openPerms = u => { setPermUser(u); setPermMods([...u.modules]); setPermPerms([...u.perms]) }
  const savePerms = () => {
    setUsers(us => us.map(u => u.id===permUser.id ? {...u, modules:permMods, perms:permPerms} : u))
    addAudit('perm', `Permissions updated: ${permUser.fname} ${permUser.lname}`, `${permMods.length} modules · ${permPerms.length} permissions`)
    toast(`Permissions saved for ${permUser.fname} ${permUser.lname}`, 's')
    setPermUser(null)
  }

  return (
    <div style={{padding:20, minHeight:'100%', background:'var(--odoo-bg)'}}>
      {/* PAGE HEADER */}
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20}}>
        <div>
          <h1 style={{fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'var(--odoo-dark)', marginBottom:4}}> User Control</h1>
          <p style={{fontSize:12, color:'var(--odoo-muted)'}}>Manage users, assign roles, and configure module-level permissions for LNV ERP</p>
        </div>
        <div style={{display:'flex', gap:8}}>
          <BtnSec onClick={()=>setShowAudit(true)}>Audit Log</BtnSec>
          <BtnSec onClick={()=>setShowRoles(true)}> Role Manager</BtnSec>
          <BtnPri onClick={openAdd}>＋ Add New User</BtnPri>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20}}>
        {[
          {label:'Total Users',       val:stats.total,    icon:'👤', clr:'var(--odoo-purple)', f:'all'},
          {label:'Active Users',      val:stats.active,   icon:'👤', clr:'var(--odoo-green)',  f:'active'},
          {label:'Online Now',        val:stats.online,   icon:'🟢', clr:'var(--odoo-orange)', f:'online'},
          {label:'Inactive / Locked', val:stats.inactive, icon:'▸', clr:'var(--odoo-red)',    f:'inactive'},
          {label:'Roles Defined',     val:6,              icon:'🔐', clr:'#8E44AD',            f:null},
        ].map((s,i) => (
          <div key={i} onClick={()=>s.f&&setFStatus(s.f)}
            style={{background:'#fff', borderRadius:12, padding:'16px 18px',
              border:`1px solid var(--odoo-border)`, borderTop:`3px solid ${s.clr}`,
              boxShadow:'0 2px 8px rgba(113,75,103,.08)', position:'relative', overflow:'hidden',
              cursor:s.f?'pointer':'default', transition:'all .2s'}}
            onMouseEnter={e=>{if(s.f)e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>e.currentTarget.style.transform=''}>
            <div style={{position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:30, opacity:.08}}>{s.icon}</div>
            <div style={{fontSize:10, fontWeight:700, color:'var(--odoo-muted)', textTransform:'uppercase', letterSpacing:.5, marginBottom:7}}>{s.label}</div>
            <div style={{fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'var(--odoo-dark)', lineHeight:1, marginBottom:4}}>{s.val}</div>
            <div style={{fontSize:11, color:'var(--odoo-muted)'}}>{s.f==='all'?'All registered':s.f==='active'?'Currently enabled':s.f==='online'?'Logged in today':s.f==='inactive'?'Access suspended':'Admin · Manager · Ops · HR · Sales'}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14,
        background:'#fff', border:'1px solid var(--odoo-border)', borderRadius:10,
        padding:'10px 14px', boxShadow:'0 2px 8px rgba(113,75,103,.08)'}}>
        <div style={{position:'relative', flex:1, maxWidth:300}}>
          <span style={{position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#ADB5BD'}}></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, role..."
            style={{width:'100%', padding:'8px 12px 8px 34px', background:'var(--odoo-bg)',
              border:'1.5px solid var(--odoo-border)', borderRadius:8,
              fontFamily:'DM Sans,sans-serif', fontSize:12, color:'var(--odoo-dark)', outline:'none'}} />
        </div>
        {[{k:'all',label:`All (${stats.total})`},{k:'active',label:`Active (${stats.active})`},{k:'inactive',label:`Inactive (${stats.inactive})`},{k:'online',label:`Online (${stats.online})`}].map(f=>(
          <button key={f.k} onClick={()=>setFStatus(f.k)}
            style={{padding:'7px 12px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer',
              border:'1.5px solid', transition:'all .15s',
              borderColor: fStatus===f.k ? 'var(--odoo-purple)' : 'var(--odoo-border)',
              color:       fStatus===f.k ? 'var(--odoo-purple)' : 'var(--odoo-muted)',
              background:  fStatus===f.k ? '#F7F0F5' : '#fff'}}>{f.label}</button>
        ))}
        <div style={{flex:1}} />
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
          style={{padding:'7px 10px', border:'1.5px solid var(--odoo-border)', borderRadius:7,
            fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:600,
            color:'var(--odoo-dark)', background:'#fff', outline:'none', cursor:'pointer'}}>
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{display:'flex', gap:3, background:'var(--odoo-bg)', padding:3, borderRadius:7, border:'1px solid var(--odoo-border)'}}>
          {[['table',''],['grid','⊞']].map(([v,ico])=>(
            <div key={v} onClick={()=>setView(v)}
              style={{width:30, height:28, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', fontSize:13, transition:'all .15s',
                background: view===v ? '#fff' : 'transparent',
                color:      view===v ? 'var(--odoo-purple)' : '#ADB5BD',
                boxShadow:  view===v ? '0 2px 6px rgba(113,75,103,.1)' : 'none'}}>{ico}</div>
          ))}
        </div>
      </div>

      {/* USER LIST */}
      {filtered.length===0 ? (
        <div style={{textAlign:'center', padding:'50px 20px'}}>
          <div style={{fontSize:48, opacity:.25, marginBottom:12}}></div>
          <div style={{fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'var(--odoo-muted)', marginBottom:6}}>No users found</div>
          <div style={{fontSize:12, color:'#ADB5BD'}}>Try adjusting your search or filters</div>
        </div>
      ) : view==='table' ? (
        <TableView users={filtered} total={users.length}
          onEdit={openEdit} onDelete={setDeleteId} onPerms={openPerms} />
      ) : (
        <GridView users={filtered}
          onEdit={openEdit} onDelete={setDeleteId} onPerms={openPerms} />
      )}

      {/* ── DRAWER OVERLAY ── */}
      {drawerOpen && <div onClick={closeDrawer} style={{position:'fixed', inset:0, background:'rgba(26,26,46,.4)', zIndex:1000, backdropFilter:'blur(2px)'}} />}

      {/* ── ADD/EDIT DRAWER ── */}
      <div style={{position:'fixed', top:0, right:0, height:'100vh', width:520,
        background:'#fff', zIndex:1001, display:'flex', flexDirection:'column',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform .3s cubic-bezier(.4,0,.2,1)',
        boxShadow:'-8px 0 40px rgba(113,75,103,.15)'}}>
        {/* Header */}
        <div style={{padding:'18px 22px', borderBottom:'1px solid var(--odoo-border)',
          display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FBF7FA'}}>
          <h3 style={{fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, color:'var(--odoo-dark)'}}>
            {editId ? ` Edit User — ${form.fname} ${form.lname}` : ' Add New User'}
          </h3>
          <span onClick={closeDrawer} style={{cursor:'pointer', fontSize:20, color:'var(--odoo-muted)', padding:'4px 8px', borderRadius:6}}></span>
        </div>
        {/* Body */}
        <div style={{flex:1, overflowY:'auto', padding:22}}>
          {/* Avatar Picker */}
          <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:18, background:'var(--odoo-bg)', borderRadius:10, padding:14}}>
            <div style={{...avStyle(form.color, 56), border:'3px solid #fff', boxShadow:'0 3px 14px rgba(0,0,0,.12)'}}>
              {((form.fname[0]||'?')).toUpperCase()}{((form.lname[0]||'')).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:12, fontWeight:600, color:'var(--odoo-dark)', marginBottom:6}}>Profile Avatar Color</p>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {AVATAR_COLORS.map(c=>(
                  <div key={c} onClick={()=>fc('color',c)}
                    style={{width:22, height:22, borderRadius:'50%', background:c, cursor:'pointer',
                      border: form.color===c ? '2px solid #1A1A2E' : '2px solid transparent',
                      transform: form.color===c ? 'scale(1.2)' : 'scale(1)', transition:'all .15s'}} />
                ))}
              </div>
            </div>
          </div>

          <FSec title=" Basic Information">
            <FRow>
              <FG label="First Name *" err={errors.fname}><input value={form.fname} onChange={e=>fc('fname',e.target.value)} placeholder="e.g. Ramesh" style={inputSt(errors.fname)} /></FG>
              <FG label="Last Name *"  err={errors.lname}><input value={form.lname} onChange={e=>fc('lname',e.target.value)} placeholder="e.g. Kumar"  style={inputSt(errors.lname)} /></FG>
            </FRow>
            <FRow>
              <FG label="Email ID *" err={errors.email}><input type="email" value={form.email} onChange={e=>fc('email',e.target.value)} placeholder="ramesh@lnvinfotech.com" style={inputSt(errors.email)} /></FG>
              <FG label="Mobile No."><input value={form.mobile} onChange={e=>fc('mobile',e.target.value)} placeholder="+91 98765 43210" style={inputSt()} /></FG>
            </FRow>
            <FRow>
              <FG label="Department">
                <select value={form.dept} onChange={e=>fc('dept',e.target.value)} style={inputSt()}>{DEPTS.map(d=><option key={d}>{d}</option>)}</select>
              </FG>
              <FG label="Designation"><input value={form.desig} onChange={e=>fc('desig',e.target.value)} placeholder="e.g. Senior Executive" style={inputSt()} /></FG>
            </FRow>
          </FSec>

          <FSec title=" Login Credentials">
            <FRow>
              <FG label="Username *" err={errors.uname} hint="Lowercase, no spaces">
                <input value={form.uname} onChange={e=>fc('uname',e.target.value)} placeholder="ramesh.kumar" style={inputSt(errors.uname)} />
              </FG>
              <FG label="Password *"><input type="password" value={form.pass} onChange={e=>fc('pass',e.target.value)} placeholder="Min 8 characters" style={inputSt()} /></FG>
            </FRow>
            <FRow>
              <FG label="Role *">
                <select value={form.role} onChange={e=>fc('role',e.target.value)} style={inputSt()}>
                  {Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </FG>
              <FG label="Status">
                <select value={form.status} onChange={e=>fc('status',e.target.value)} style={inputSt()}>
                  <option value="active">Active</option>
                  <option value="inactive"> Inactive</option>
                </select>
              </FG>
            </FRow>
          </FSec>

          <FSec title=" Module Access" extra={
            <div style={{display:'flex', gap:6, marginLeft:'auto'}}>
              <button onClick={()=>setAllMods(true)}  style={gBtn}>Select All</button>
              <button onClick={()=>setAllMods(false)} style={gBtn}>Clear All</button>
            </div>
          }>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6}}>
              {MODULES_LIST.map(m=>{
                const on=form.modules.includes(m.k)
                return (
                  <div key={m.k} onClick={()=>toggleMod(m.k)}
                    style={{background:on?'#EDE0EA':'var(--odoo-bg)',
                      border:`1.5px solid ${on?'var(--odoo-purple)':'var(--odoo-border)'}`,
                      borderRadius:8, padding:'8px 10px', cursor:'pointer', transition:'all .15s',
                      display:'flex', alignItems:'center', gap:7}}>
                    <span style={{fontSize:16}}>{m.icon}</span>
                    <div style={{fontSize:10, fontWeight:700, color:on?'var(--odoo-purple)':'var(--odoo-muted)'}}>{m.name}</div>
                    <div style={{width:14, height:14, borderRadius:'50%', marginLeft:'auto',
                      border:`2px solid ${on?'var(--odoo-purple)':'var(--odoo-border)'}`,
                      background:on?'var(--odoo-purple)':'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:8, color:'#fff', fontWeight:700}}>{on?'':''}</div>
                  </div>
                )
              })}
            </div>
          </FSec>

          <FSec title=" Feature Permissions">
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
              {PERMS_LIST.map(p=>{
                const on=form.perms.includes(p.k)
                return (
                  <div key={p.k} style={{display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'var(--odoo-bg)', border:'1px solid var(--odoo-border)', borderRadius:8, padding:'8px 11px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:7}}>
                      <span style={{fontSize:14}}>{p.icon}</span>
                      <div>
                        <div style={{fontSize:11, fontWeight:600, color:'var(--odoo-dark)'}}>{p.name}</div>
                        <div style={{fontSize:9, color:'#ADB5BD'}}>{p.sub}</div>
                      </div>
                    </div>
                    <Toggle on={on} onToggle={()=>togglePerm(p.k)} />
                  </div>
                )
              })}
            </div>
          </FSec>

          <FSec title=" Notes">
            <textarea value={form.notes} onChange={e=>fc('notes',e.target.value)}
              placeholder="Any notes about this user..."
              style={{...inputSt(), resize:'vertical', minHeight:70}} />
          </FSec>
        </div>
        {/* Footer */}
        <div style={{padding:'16px 22px', borderTop:'1px solid var(--odoo-border)',
          display:'flex', gap:10, justifyContent:'flex-end', background:'#FBF7FA'}}>
          <button onClick={closeDrawer} style={gBtn}>Cancel</button>
          <button onClick={()=>{setForm({...BLANK_FORM});setErrors({})}} style={{...gBtn, color:'var(--odoo-muted)'}}> Reset</button>
          <BtnPri onClick={saveUser}>{editId ? 'Update User' : 'Save User'}</BtnPri>
        </div>
      </div>

      {/* PERMISSIONS MODAL */}
      {permUser && (
        <Modal onClose={()=>setPermUser(null)} width={640}>
          <div style={{background:'linear-gradient(135deg,var(--odoo-purple),#875A7B)',
            padding:'18px 22px', borderRadius:'14px 14px 0 0',
            display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <h3 style={{fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800, color:'#fff'}}>
               Permissions — {permUser.fname} {permUser.lname}
            </h3>
            <span onClick={()=>setPermUser(null)} style={{cursor:'pointer', fontSize:18, color:'rgba(255,255,255,.7)', padding:'4px 8px'}}></span>
          </div>
          <div style={{padding:22, overflowY:'auto', maxHeight:'calc(90vh - 120px)'}}>
            {/* User row */}
            <div style={{display:'flex', alignItems:'center', gap:12, background:'#FBF7FA', borderRadius:10, padding:14, marginBottom:18}}>
              <div style={avStyle(permUser.color, 44)}>{initials(permUser)}</div>
              <div>
                <div style={{fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:800, color:'var(--odoo-dark)', marginBottom:4}}>{permUser.fname} {permUser.lname}</div>
                <span style={rolePill(permUser.role)}>{ROLE_LABELS[permUser.role]}</span>
              </div>
              <div style={{marginLeft:'auto'}}>
                <button onClick={()=>{setPermMods([...ROLE_MOD[permUser.role]||[]]);setPermPerms([...ROLE_PERM[permUser.role]||[]]);toast('Role defaults applied','i')}}
                  style={{...gBtn, border:'1px solid var(--odoo-border)', padding:'4px 10px', fontSize:10}}>↺ Reset to Role Defaults</button>
              </div>
            </div>
            {/* Module access */}
            <div style={{fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'var(--odoo-purple)', textTransform:'uppercase', letterSpacing:.5, marginBottom:10}}>Module Access</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:18}}>
              {MODULES_LIST.map(m=>{
                const on=permMods.includes(m.k)
                return (
                  <div key={m.k} onClick={()=>setPermMods(p=>on?p.filter(x=>x!==m.k):[...p,m.k])}
                    style={{background:on?'#EDE0EA':'var(--odoo-bg)',
                      border:`1.5px solid ${on?'var(--odoo-purple)':'var(--odoo-border)'}`,
                      borderRadius:8, padding:8, textAlign:'center', cursor:'pointer', transition:'all .15s'}}>
                    <div style={{fontSize:18, marginBottom:3}}>{m.icon}</div>
                    <div style={{fontSize:9, fontWeight:700, color:on?'var(--odoo-purple)':'var(--odoo-muted)'}}>{m.name}</div>
                  </div>
                )
              })}
            </div>
            {/* Feature perms */}
            <div style={{fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'var(--odoo-purple)', textTransform:'uppercase', letterSpacing:.5, marginBottom:10}}> Feature Permissions</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:7}}>
              {PERMS_LIST.map(p=>{
                const on=permPerms.includes(p.k)
                return (
                  <div key={p.k} style={{display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'var(--odoo-bg)', border:'1px solid var(--odoo-border)', borderRadius:8, padding:'8px 11px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:7}}>
                      <span style={{fontSize:14}}>{p.icon}</span>
                      <div>
                        <div style={{fontSize:11, fontWeight:600, color:'var(--odoo-dark)'}}>{p.name}</div>
                        <div style={{fontSize:9, color:'#ADB5BD'}}>{p.sub}</div>
                      </div>
                    </div>
                    <Toggle on={on} onToggle={()=>setPermPerms(pp=>on?pp.filter(x=>x!==p.k):[...pp,p.k])} />
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{padding:'14px 22px', borderTop:'1px solid var(--odoo-border)',
            display:'flex', gap:10, justifyContent:'flex-end', background:'#FBF7FA',
            borderRadius:'0 0 14px 14px'}}>
            <button onClick={()=>setPermUser(null)} style={gBtn}>Cancel</button>
            <BtnPri onClick={savePerms}>Save Permissions</BtnPri>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <Modal onClose={()=>setDeleteId(null)} width={340}>
          <div style={{padding:28, textAlign:'center'}}>
            <div style={{fontSize:46, marginBottom:12}}></div>
            <div style={{fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'var(--odoo-dark)', marginBottom:8}}>Delete User?</div>
            <div style={{fontSize:12, color:'var(--odoo-muted)', marginBottom:20, lineHeight:1.6}}>
              {(()=>{const u=users.find(x=>x.id===deleteId); return u ? `Delete ${u.fname} ${u.lname} (@${u.uname})? This cannot be undone.` : ''})()}
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'center'}}>
              <button onClick={confirmDelete} style={{padding:'8px 18px', borderRadius:8, background:'var(--odoo-red)', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer'}}>Yes, Delete</button>
              <button onClick={()=>setDeleteId(null)} style={{padding:'8px 18px', borderRadius:8, background:'#fff', color:'var(--odoo-purple)', border:'1px solid var(--odoo-border)', fontSize:12, fontWeight:600, cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* AUDIT LOG */}
      {showAudit && (
        <Modal onClose={()=>setShowAudit(false)} width={680}>
          <div style={{padding:'18px 22px', borderBottom:'1px solid var(--odoo-border)',
            display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FBF7FA'}}>
            <h3 style={{fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800}}>User Activity Audit Log</h3>
            <span onClick={()=>setShowAudit(false)} style={{cursor:'pointer', fontSize:18, color:'var(--odoo-muted)', padding:'4px 8px'}}></span>
          </div>
          <div style={{overflowY:'auto', padding:20, maxHeight:'70vh'}}>
            {audit.map((a,i)=>(
              <div key={i} style={{display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0',
                borderBottom: i<audit.length-1 ? '1px solid var(--odoo-border)' : 'none'}}>
                <div style={{width:28, height:28, borderRadius:8, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:12, flexShrink:0,
                  background:AUDIT_BG[a.type]||'var(--odoo-bg)'}}>{AUDIT_ICONS[a.type]||''}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11, fontWeight:600, color:'var(--odoo-dark)'}}>{a.msg}</div>
                  <div style={{fontSize:10, color:'var(--odoo-muted)', marginTop:2}}>{a.meta}</div>
                </div>
                <div style={{fontSize:10, color:'#ADB5BD', fontFamily:'DM Mono,monospace', whiteSpace:'nowrap'}}>{a.time}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ROLE MANAGER */}
      {showRoles && (
        <Modal onClose={()=>setShowRoles(false)} width={700}>
          <div style={{background:'linear-gradient(135deg,var(--odoo-purple),#875A7B)',
            padding:'18px 22px', borderRadius:'14px 14px 0 0',
            display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <h3 style={{fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800, color:'#fff'}}> Role Manager</h3>
            <span onClick={()=>setShowRoles(false)} style={{cursor:'pointer', fontSize:18, color:'rgba(255,255,255,.7)', padding:'4px 8px'}}></span>
          </div>
          <div style={{overflowY:'auto', padding:20, maxHeight:'70vh'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
              {Object.entries(ROLE_LABELS).map(([k,v])=>{
                const mods=ROLE_MOD[k]||[], perms=ROLE_PERM[k]||[], uc=users.filter(u=>u.role===k).length
                return (
                  <div key={k} style={{background:ROLE_BG[k]||'#F5F5F5',
                    border:`1.5px solid ${ROLE_CLR[k]}33`, borderRadius:10, padding:14, transition:'all .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform=''}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                      <div style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:800, color:ROLE_CLR[k]}}>{v}</div>
                      <div style={{fontSize:10, fontWeight:700, background:ROLE_CLR[k], color:'#fff', padding:'2px 8px', borderRadius:8}}>{uc} users</div>
                    </div>
                    <div style={{fontSize:11, color:'var(--odoo-muted)', marginBottom:10, lineHeight:1.5}}>{ROLE_DESC[k]}</div>
                    <div style={{display:'flex', gap:8, fontSize:10, fontWeight:600, marginBottom:8}}>
                      <span style={{background:'rgba(255,255,255,.6)', padding:'2px 7px', borderRadius:5}}>{mods.length} modules</span>
                      <span style={{background:'rgba(255,255,255,.6)', padding:'2px 7px', borderRadius:5}}> {perms.length} permissions</span>
                    </div>
                    <div style={{display:'flex', flexWrap:'wrap', gap:3}}>
                      {mods.slice(0,6).map(m=>{const mod=MODULES_LIST.find(x=>x.k===m); return mod?<span key={m} style={{fontSize:9, background:'rgba(255,255,255,.5)', padding:'1px 5px', borderRadius:4}}>{mod.icon} {mod.name}</span>:null})}
                      {mods.length>6 && <span style={{fontSize:9, background:'rgba(255,255,255,.5)', padding:'1px 5px', borderRadius:4}}>+{mods.length-6}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{background:'#FBF7FA', border:'1px solid var(--odoo-border)', borderRadius:10, padding:14, fontSize:12, color:'var(--odoo-muted)'}}>
               <strong style={{color:'var(--odoo-purple)'}}>Role defaults</strong> apply when creating a new user. Customize individual permissions via the <strong> Permissions</strong> button on any user row.
            </div>
          </div>
        </Modal>
      )}

      {/* TOASTS */}
      <div style={{position:'fixed', bottom:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:7}}>
        {toasts.map(t=>(
          <div key={t.id} style={{display:'flex', alignItems:'center', gap:9, padding:'10px 16px',
            borderRadius:9, fontSize:12, fontWeight:500, minWidth:220, color:'#fff',
            boxShadow:'0 8px 40px rgba(113,75,103,.18)',
            background: t.type==='s'?'linear-gradient(135deg,#007A77,#00A09D)':
                        t.type==='w'?'linear-gradient(135deg,#B85A2E,#E06F39)':
                        t.type==='e'?'linear-gradient(135deg,#B03A37,#D9534F)':
                                     'linear-gradient(135deg,#714B67,#875A7B)',
            animation:'slideIn .35s cubic-bezier(.34,1.56,.64,1)'}}>
            <span>{{s:'',w:'',e:'',i:'ℹ'}[t.type]}</span><span>{t.msg}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  )
}

// ── TABLE VIEW ────────────────────────────────────────
function TableView({ users, total, onEdit, onDelete, onPerms }) {
  return (
    <div style={{background:'#fff', border:'1px solid var(--odoo-border)', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(113,75,103,.08)'}}>
      <div style={{display:'grid', gridTemplateColumns:'40px 2fr 1.5fr 1fr 1fr 1.2fr 1fr 210px',
        padding:'10px 16px', background:'#FBF7FA', borderBottom:'2px solid var(--odoo-border)'}}>
        {['','User','Email','Role','Status','Last Login','Dept','Actions'].map((h,i)=>(
          <span key={i} style={{fontSize:10, fontWeight:700, color:'var(--odoo-muted)', textTransform:'uppercase', letterSpacing:.5}}>{h}</span>
        ))}
      </div>
      {users.map((u,i)=>(
        <div key={u.id} onClick={()=>onEdit(u)}
          style={{display:'grid', gridTemplateColumns:'40px 2fr 1.5fr 1fr 1fr 1.2fr 1fr 210px',
            padding:'11px 16px', borderBottom:i<users.length-1?'1px solid var(--odoo-border)':'none',
            alignItems:'center', cursor:'pointer', transition:'background .12s'}}
          onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={{width:16, height:16, borderRadius:4, border:'2px solid var(--odoo-border)'}} onClick={e=>e.stopPropagation()} />
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={avStyle(u.color)}>{initials(u)}</div>
            <div>
              <div style={{fontSize:12, fontWeight:700, color:'var(--odoo-dark)'}}>{u.fname} {u.lname}</div>
              <div style={{fontSize:10, color:'var(--odoo-muted)'}}>@{u.uname}</div>
            </div>
          </div>
          <div style={{fontSize:11, color:'var(--odoo-muted)'}}>{u.email}</div>
          <div><span style={rolePill(u.role)}>{ROLE_LABELS[u.role]}</span></div>
          <div style={{display:'flex', alignItems:'center', gap:5}}>
            <div style={dotStyle(u)} />
            <span style={{fontSize:11, color:'var(--odoo-muted)'}}>{statusLabel(u)}</span>
          </div>
          <div style={{fontSize:11, color:'var(--odoo-muted)', fontFamily:'DM Mono,monospace'}}>{u.lastLogin}</div>
          <div><span style={{fontSize:10, fontWeight:600, color:'var(--odoo-muted)', background:'var(--odoo-bg)', padding:'2px 7px', borderRadius:6, border:'1px solid var(--odoo-border)'}}>{u.dept||'—'}</span></div>
          <div style={{display:'flex', gap:5}} onClick={e=>e.stopPropagation()}>
            {[
              {ico:'View', hb:'#E6F4F5',hc:'#017E84',fn:()=>onEdit(u)},
              {ico:'Edit', hb:'#EDE0EA',hc:'#714B67',fn:()=>onEdit(u)},
              {ico:'Perms',hb:'#F4ECF7',hc:'#8E44AD',fn:()=>onPerms(u)},
              {ico:'Del',  hb:'#FDEDEC',hc:'#DC3545',fn:()=>onDelete(u.id)},
            ].map((b,bi)=>(
              <div key={bi} onClick={b.fn}
                style={{minWidth:46, height:24, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', fontSize:12, border:'1px solid var(--odoo-border)', background:b.hb, color:b.hc, fontWeight:700, fontSize:10, padding:'0 6px', transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.opacity='0.8'}}
                onMouseLeave={e=>{e.currentTarget.style.opacity='1'}}>
                {b.ico}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--odoo-border)', background:'#FBF7FA'}}>
        <div style={{fontSize:11, color:'var(--odoo-muted)'}}>Showing <strong>{users.length}</strong> of <strong>{total}</strong> users</div>
        <div style={{display:'flex', gap:4}}>
          {['‹','1','›'].map((p,i)=>(
            <div key={i} style={{width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:11, fontWeight:600, border:'1px solid var(--odoo-border)',
              background:p==='1'?'var(--odoo-purple)':'#fff', color:p==='1'?'#fff':'var(--odoo-dark)'}}>{p}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── GRID VIEW ─────────────────────────────────────────
function GridView({ users, onEdit, onDelete, onPerms }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
      {users.map(u=>(
        <div key={u.id} style={{background:'#fff', borderRadius:12, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 2px 8px rgba(113,75,103,.08)', cursor:'pointer', transition:'all .2s'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 20px rgba(113,75,103,.12)'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(113,75,103,.08)'}}>
          <div style={{height:60, background:`linear-gradient(135deg,${u.color},${u.color}cc)`, position:'relative'}}>
            <div style={{...avStyle(u.color,52), position:'absolute', bottom:-26, left:16, border:'3px solid #fff', boxShadow:'0 3px 10px rgba(0,0,0,.15)'}}>{initials(u)}</div>
            <div style={{position:'absolute', top:8, right:10}}><div style={{...dotStyle(u), width:9, height:9}} /></div>
          </div>
          <div style={{padding:'34px 16px 14px'}}>
            <div style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:800, color:'var(--odoo-dark)', marginBottom:2}}>{u.fname} {u.lname}</div>
            <div style={{marginBottom:8}}><span style={rolePill(u.role)}>{ROLE_LABELS[u.role]}</span></div>
            <div style={{display:'flex', flexDirection:'column', gap:3, marginBottom:10}}>
              {[` ${u.email}`,` ${u.dept||'—'} · ${u.desig||'—'}`,` ${u.lastLogin}`].map((r,i)=>(
                <div key={i} style={{fontSize:10, color:'var(--odoo-muted)'}}>{r}</div>
              ))}
            </div>
            <div style={{display:'flex', flexWrap:'wrap', gap:3, marginBottom:10}}>
              {u.modules.slice(0,5).map(mk=>{const mod=MODULES_LIST.find(m=>m.k===mk); return mod?<span key={mk} style={{fontSize:9, fontWeight:600, background:'var(--odoo-bg)', border:'1px solid var(--odoo-border)', borderRadius:5, padding:'2px 5px', color:'var(--odoo-muted)'}}>{mod.icon} {mod.name}</span>:null})}
              {u.modules.length>5 && <span style={{fontSize:9, fontWeight:600, background:'var(--odoo-bg)', border:'1px solid var(--odoo-border)', borderRadius:5, padding:'2px 5px', color:'var(--odoo-muted)'}}>+{u.modules.length-5} more</span>}
            </div>
            <div style={{display:'flex', gap:6, paddingTop:10, borderTop:'1px solid var(--odoo-border)'}}>
              <button onClick={()=>onEdit(u)}    style={{flex:1, padding:'4px 8px', borderRadius:6, fontSize:10, fontWeight:700, border:'1px solid var(--odoo-border)', background:'#fff', color:'var(--odoo-dark)', cursor:'pointer'}}>Edit</button>
              <button onClick={()=>onPerms(u)}   style={{flex:1, padding:'4px 8px', borderRadius:6, fontSize:10, fontWeight:700, border:'1px solid var(--odoo-border)', background:'#fff', color:'var(--odoo-dark)', cursor:'pointer'}}> Perms</button>
              <button onClick={()=>onDelete(u.id)} style={{padding:'4px 8px', borderRadius:6, fontSize:10, fontWeight:700, border:'1px solid #FDEDEC', background:'#FDEDEC', color:'var(--odoo-red)', cursor:'pointer'}}></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── SMALL COMPONENTS ──────────────────────────────────
function Modal({ children, onClose, width=500 }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{position:'fixed', inset:0, background:'rgba(26,26,46,.55)', zIndex:1002,
        display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)'}}>
      <div style={{background:'#fff', borderRadius:14, width, maxWidth:'100%', maxHeight:'90vh',
        overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 8px 40px rgba(113,75,103,.18)', animation:'popIn .25s ease'}}>
        {children}
      </div>
      <style>{`@keyframes popIn{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}

function FSec({ title, children, extra }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'var(--odoo-purple)',
        textTransform:'uppercase', letterSpacing:.6, marginBottom:12,
        display:'flex', alignItems:'center', gap:6}}>
        <span>{title}</span>{extra}
        <span style={{flex:1, height:1, background:'var(--odoo-border)', display:'block'}} />
      </div>
      {children}
    </div>
  )
}

function FRow({ children }) {
  return <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>{children}</div>
}

function FG({ label, children, hint, err }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:4}}>
      <label style={{fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.4, color:err?'#D9534F':'var(--odoo-dark)'}}>{label}</label>
      {children}
      {hint && <div style={{fontSize:10, color:'#ADB5BD', marginTop:2}}>{hint}</div>}
    </div>
  )
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{width:36, height:20, background:on?'var(--odoo-purple)':'#CED4DA',
      borderRadius:20, cursor:'pointer', position:'relative', transition:'all .2s', flexShrink:0}}>
      <div style={{width:14, height:14, background:'#fff', borderRadius:'50%', boxShadow:'0 1px 4px rgba(0,0,0,.2)',
        position:'absolute', top:3, left:on?19:3, transition:'left .2s'}} />
    </div>
  )
}

function BtnPri({ children, onClick }) {
  return (
    <button onClick={onClick}
      style={{padding:'8px 16px', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600,
        cursor:'pointer', background:'var(--odoo-purple)', color:'#fff', border:'1px solid var(--odoo-purple)',
        boxShadow:'0 3px 10px rgba(113,75,103,.25)', transition:'all .2s', display:'inline-flex', alignItems:'center', gap:6}}
      onMouseEnter={e=>{e.currentTarget.style.background='#875A7B';e.currentTarget.style.transform='translateY(-1px)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='var(--odoo-purple)';e.currentTarget.style.transform=''}}>
      {children}
    </button>
  )
}

function BtnSec({ children, onClick }) {
  return (
    <button onClick={onClick}
      style={{padding:'8px 16px', borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600,
        cursor:'pointer', background:'#fff', color:'var(--odoo-purple)', border:'1px solid var(--odoo-border)',
        transition:'all .2s', display:'inline-flex', alignItems:'center', gap:6}}
      onMouseEnter={e=>{e.currentTarget.style.background='#F7F0F5';e.currentTarget.style.transform='translateY(-1px)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.transform=''}}>
      {children}
    </button>
  )
}
