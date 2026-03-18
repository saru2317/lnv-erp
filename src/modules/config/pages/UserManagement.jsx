import React, { useState } from 'react'

const AVATAR_COLORS = ['#714B67','#E06F39','#00A09D','#017E84','#8E44AD','#1A5276','#196F3D','#B03A37','#B7860B','#4A235A']

const MODULES_LIST = [
  {k:'sd',  icon:'📦', name:'Sales (SD)'},
  {k:'mm',  icon:'🛒', name:'Purchase (MM)'},
  {k:'wm',  icon:'🏗️', name:'Warehouse (WM)'},
  {k:'fi',  icon:'💰', name:'Finance (FI)'},
  {k:'pp',  icon:'⚙️', name:'Production (PP)'},
  {k:'qm',  icon:'🔬', name:'Quality (QM)'},
  {k:'pm',  icon:'🔧', name:'Maintenance (PM)'},
  {k:'hcm', icon:'👥', name:'HR (HCM)'},
  {k:'crm', icon:'🤝', name:'CRM'},
  {k:'config',icon:'🛠️',name:'Config'},
]

const PERMS_LIST = [
  {k:'view',   icon:'👁️', name:'View Records',    sub:'Read-only access'},
  {k:'create', icon:'➕', name:'Create Records',   sub:'Add new entries'},
  {k:'edit',   icon:'✏️', name:'Edit Records',     sub:'Modify existing'},
  {k:'delete', icon:'🗑️', name:'Delete Records',   sub:'Remove entries'},
  {k:'approve',icon:'✅', name:'Approve / Reject', sub:'Workflow approvals'},
  {k:'export', icon:'📤', name:'Export Data',      sub:'Excel / PDF export'},
  {k:'reports',icon:'📊', name:'View Reports',     sub:'MIS & analytics'},
  {k:'settings',icon:'⚙️',name:'System Settings', sub:'Config & setup'},
]

const ROLE_MODULES_DEF = {
  admin:      ['sd','mm','wm','fi','pp','qm','pm','hcm','crm','config'],
  manager:    ['pp','qm','pm','wm','mm'],
  accounts:   ['fi','sd','mm'],
  operations: ['pp','qm','pm'],
  hr:         ['hcm'],
  sales:      ['sd','crm'],
}
const ROLE_PERMS_DEF = {
  admin:      ['view','create','edit','delete','approve','export','reports','settings'],
  manager:    ['view','create','edit','approve','export','reports'],
  accounts:   ['view','create','edit','approve','export','reports'],
  operations: ['view','create','edit'],
  hr:         ['view','create','edit','approve','export'],
  sales:      ['view','create','edit','export'],
}
const ROLE_LABELS  = {admin:'👑 Super Admin',manager:'🏭 Plant Manager',accounts:'💰 Accounts',operations:'⚙️ Operations',hr:'👥 HR Manager',sales:'🤝 Sales Officer'}
const ROLE_COLORS  = {admin:'#714B67',manager:'#E06F39',accounts:'#00A09D',operations:'#017E84',hr:'#8E44AD',sales:'#015E63'}
const ROLE_BG      = {admin:'#F7F0F5',manager:'#FDF0EA',accounts:'#E6F7F7',operations:'#E6F4F5',hr:'#F4ECF7',sales:'#E6F4F5'}
const ROLE_DESC    = {admin:'Full system access — all modules and settings',manager:'Production, quality, maintenance oversight',accounts:'Finance, GST, payables & receivables',operations:'Production execution, QC, maintenance tasks',hr:'Employee management, payroll, leave approval',sales:'Sales orders, CRM leads and follow-ups'}
const DEPTS = ['Production','Quality','Accounts','HR','Sales','Warehouse','Maintenance','Administration','IT']

const INIT_USERS = [
  {id:1,fname:'Saravana',lname:'Kumar',  email:'admin@lnv.com',    mobile:'9944001001',dept:'Administration',desig:'System Administrator',uname:'admin',   role:'admin',     status:'active',  online:true, color:'#714B67',lastLogin:'Today 09:12 AM',   modules:ROLE_MODULES_DEF.admin,     perms:ROLE_PERMS_DEF.admin,     notes:''},
  {id:2,fname:'Ramesh',  lname:'P',      email:'manager@lnv.com',  mobile:'9944001002',dept:'Production',    desig:'Plant Manager',       uname:'manager', role:'manager',   status:'active',  online:true, color:'#E06F39',lastLogin:'Today 08:55 AM',   modules:ROLE_MODULES_DEF.manager,   perms:ROLE_PERMS_DEF.manager,   notes:''},
  {id:3,fname:'Priya',   lname:'S',      email:'accounts@lnv.com', mobile:'9944001003',dept:'Accounts',      desig:'Senior Accountant',   uname:'accounts',role:'accounts',  status:'active',  online:true, color:'#00A09D',lastLogin:'Today 09:00 AM',   modules:ROLE_MODULES_DEF.accounts,  perms:ROLE_PERMS_DEF.accounts,  notes:''},
  {id:4,fname:'Karthik', lname:'M',      email:'ops@lnv.com',      mobile:'9944001004',dept:'Production',    desig:'Machine Operator',    uname:'ops',     role:'operations',status:'active',  online:false,color:'#017E84',lastLogin:'Yesterday 06:30 PM',modules:ROLE_MODULES_DEF.operations,perms:ROLE_PERMS_DEF.operations,notes:''},
  {id:5,fname:'Kavitha', lname:'R',      email:'hr@lnv.com',       mobile:'9944001005',dept:'HR',            desig:'HR Manager',          uname:'hr',      role:'hr',        status:'active',  online:false,color:'#8E44AD',lastLogin:'Today 08:30 AM',   modules:ROLE_MODULES_DEF.hr,        perms:ROLE_PERMS_DEF.hr,        notes:''},
  {id:6,fname:'Vijay',   lname:'T',      email:'sales@lnv.com',    mobile:'9944001006',dept:'Sales',         desig:'Sales Executive',     uname:'sales',   role:'sales',     status:'active',  online:false,color:'#015E63',lastLogin:'Today 09:15 AM',   modules:ROLE_MODULES_DEF.sales,     perms:ROLE_PERMS_DEF.sales,     notes:''},
  {id:7,fname:'Murugan', lname:'S',      email:'murugan@lnv.com',  mobile:'9944001007',dept:'Quality',       desig:'QC Inspector',        uname:'murugan', role:'operations',status:'inactive',online:false,color:'#196F3D',lastLogin:'28 Feb 2026',       modules:['qm','pp'],                perms:['view','create'],        notes:'On leave'},
]

const INIT_AUDIT = [
  {type:'login',msg:'System initialized — Admin logged in',   meta:'Super Admin · All modules',  color:'#714B67',time:'11 Mar 2026 · 09:05 AM'},
  {type:'edit', msg:'Ramesh P role updated',                  meta:'Operations → Plant Manager', color:'#E06F39',time:'10 Mar 2026 · 04:30 PM'},
  {type:'perm', msg:'Priya S permissions updated',            meta:'Added: Export · Reports',    color:'#8E44AD',time:'09 Mar 2026 · 11:00 AM'},
]

const blankForm = () => ({
  fname:'',lname:'',email:'',mobile:'',dept:'Production',desig:'',
  uname:'',pass:'',role:'operations',status:'active',
  color:AVATAR_COLORS[0],
  modules:[...ROLE_MODULES_DEF.operations],
  perms:[...ROLE_PERMS_DEF.operations],
  notes:''
})

/* ── tiny helpers ── */
const init   = u => (u.fname[0]+u.lname[0]).toUpperCase()
const toggle = (arr,k) => arr.includes(k) ? arr.filter(x=>x!==k) : [...arr,k]

const rolePillStyle = role => ({
  display:'inline-flex',alignItems:'center',gap:'4px',
  padding:'3px 9px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',
  background:ROLE_BG[role]||'#F5F5F5', color:ROLE_COLORS[role]||'#555'
})
const toggleStyle = on => ({
  width:'36px',height:'20px',borderRadius:'20px',cursor:'pointer',flexShrink:0,
  position:'relative',transition:'all .2s',background:on?'var(--odoo-purple)':'#CCC'
})
const knobStyle = on => ({
  position:'absolute',top:'3px',left:on?'19px':'3px',
  width:'14px',height:'14px',borderRadius:'50%',background:'#fff',
  transition:'all .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'
})
const actBtnStyle = v => {
  const m={view:['#E6F4F5','#017E84'],edit:['#EDE0EA','#714B67'],perm:['#F4ECF7','#8E44AD'],del:['#FDEDEC','#D9534F']}
  const [bg,c]=m[v]||['#F5F5F5','#555']
  return {width:'26px',height:'26px',borderRadius:'6px',display:'flex',alignItems:'center',
    justifyContent:'center',cursor:'pointer',fontSize:'12px',border:`1px solid ${bg}`,background:bg,color:c,transition:'all .15s'}
}

/* ── Toast ── */
function useToast(){
  const [list,setList]=useState([])
  const show=(msg,type='s')=>{
    const id=Date.now()
    setList(l=>[...l,{id,msg,type}])
    setTimeout(()=>setList(l=>l.filter(x=>x.id!==id)),3500)
  }
  return {list,show}
}
function Toasts({list}){
  const bgs={s:'linear-gradient(135deg,#007A77,#00A09D)',w:'linear-gradient(135deg,#B85A2E,#E06F39)',e:'linear-gradient(135deg,#B03A37,#D9534F)',i:'linear-gradient(135deg,#714B67,#875A7B)'}
  const icons={s:'✅',w:'⚠️',e:'❌',i:'ℹ️'}
  return(
    <div style={{position:'fixed',bottom:'20px',right:'20px',zIndex:9999,display:'flex',flexDirection:'column',gap:'7px',pointerEvents:'none'}}>
      {list.map(t=>(
        <div key={t.id} style={{display:'flex',alignItems:'center',gap:'9px',padding:'10px 16px',borderRadius:'9px',
          fontSize:'12px',fontWeight:'500',boxShadow:'0 8px 30px rgba(0,0,0,.2)',minWidth:'220px',color:'#fff',
          background:bgs[t.type]||bgs.s}}>
          <span>{icons[t.type]||'✅'}</span><span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Section title bar ── */
const SectionTitle = ({children}) => (
  <div style={{fontFamily:'Syne,sans-serif',fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)',
    textTransform:'uppercase',letterSpacing:'.6px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
    {children}
    <div style={{flex:1,height:'1px',background:'var(--odoo-border)'}}/>
  </div>
)

/* ── Overlay ── */
const Overlay = ({onClick}) => (
  <div onClick={onClick} style={{position:'fixed',inset:0,background:'rgba(26,26,46,.55)',zIndex:1000,backdropFilter:'blur(4px)'}}/>
)

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
export default function UserManagement(){
  const [users,    setUsers]    = useState(INIT_USERS)
  const [audit,    setAudit]    = useState(INIT_AUDIT)
  const [view,     setView]     = useState('table')
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [roleF,    setRoleF]    = useState('')
  const [drawer,   setDrawer]   = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(blankForm())
  const [deleteId, setDeleteId] = useState(null)
  const [permUser, setPermUser] = useState(null)
  const [permMods, setPermMods] = useState([])
  const [permPs,   setPermPs]   = useState([])
  const [showAudit,setShowAudit]= useState(false)
  const [showRoles,setShowRoles]= useState(false)
  const {list:toasts,show:toast} = useToast()

  const sf = (k,v) => setForm(f=>({...f,[k]:v}))
  const onRoleChange = r => { sf('role',r); sf('modules',[...ROLE_MODULES_DEF[r]||[]]); sf('perms',[...ROLE_PERMS_DEF[r]||[]]) }

  const pushAudit = (type,msg,meta,color='#714B67') => {
    const now=new Date()
    const time=now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · '+now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
    setAudit(a=>[{type,msg,meta,color,time},...a])
  }

  /* filtered list */
  const filtered = users.filter(u=>{
    const ms=!search||(u.fname+' '+u.lname).toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase())||u.uname.toLowerCase().includes(search.toLowerCase())
    const mf=filter==='all'||(filter==='active'&&u.status==='active')||(filter==='inactive'&&u.status==='inactive')||(filter==='online'&&u.online)
    const mr=!roleF||u.role===roleF
    return ms&&mf&&mr
  })

  /* counts */
  const total    = users.length
  const cActive  = users.filter(u=>u.status==='active').length
  const cOnline  = users.filter(u=>u.online).length
  const cInactive= users.filter(u=>u.status==='inactive').length

  /* save user */
  const handleSave = () => {
    if(!form.fname||!form.lname||!form.email||!form.uname){toast('Fill all required fields','w');return}
    if(editId){
      setUsers(u=>u.map(x=>x.id===editId?{...x,...form}:x))
      pushAudit('edit',`Updated user ${form.fname} ${form.lname}`,`Role: ${ROLE_LABELS[form.role]}`,ROLE_COLORS[form.role])
      toast(`✅ ${form.fname} ${form.lname} updated!`,'s')
    } else {
      const nu={id:Date.now(),...form,online:false,lastLogin:'Never'}
      setUsers(u=>[nu,...u])
      pushAudit('add',`New user: ${form.fname} ${form.lname}`,`Role: ${ROLE_LABELS[form.role]}`,ROLE_COLORS[form.role])
      toast(`✅ ${form.fname} ${form.lname} created!`,'s')
    }
    setDrawer(false);setEditId(null)
  }

  const openAdd  = () => { setEditId(null);setForm(blankForm());setDrawer(true) }
  const openEdit = u  => { setEditId(u.id);setForm({...u,pass:''});setDrawer(true) }

  const doDelete = () => {
    const u=users.find(x=>x.id===deleteId)
    if(u){setUsers(us=>us.filter(x=>x.id!==deleteId));pushAudit('del',`Deleted ${u.fname} ${u.lname}`,`@${u.uname}`,'#B03A37');toast(`🗑️ ${u.fname} deleted`,'w')}
    setDeleteId(null)
  }

  /* permissions */
  const openPerms = u => { setPermUser(u);setPermMods([...u.modules]);setPermPs([...u.perms]) }
  const savePerms = () => {
    setUsers(us=>us.map(u=>u.id===permUser.id?{...u,modules:permMods,perms:permPs}:u))
    pushAudit('perm',`Permissions updated: ${permUser.fname} ${permUser.lname}`,`${permMods.length} mods · ${permPs.length} perms`,'#8E44AD')
    toast(`✅ Permissions saved`,'s')
    setPermUser(null)
  }

  /* ── render ── */
  return (
    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'13px'}}>

      {/* PAGE HEADER */}
      <div className="fi-lv-hdr">
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-text)'}}>👥 User Control</div>
          <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginTop:'2px'}}>Manage users, roles and module-level permissions</div>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s btn-s" onClick={()=>setShowAudit(true)}>📋 Audit Log</button>
          <button className="btn btn-s btn-s" onClick={()=>setShowRoles(true)}>🔐 Role Manager</button>
          <button className="btn btn-p btn-s" onClick={openAdd}>＋ Add New User</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[
          {l:'Total Users',    v:total,    c:'var(--odoo-purple)',i:'👥',f:'all'},
          {l:'Active Users',   v:cActive,  c:'var(--odoo-green)', i:'✅',f:'active'},
          {l:'Online Now',     v:cOnline,  c:'var(--odoo-orange)',i:'🟢',f:'online'},
          {l:'Inactive/Locked',v:cInactive,c:'var(--odoo-red)',   i:'🔒',f:'inactive'},
          {l:'Roles Defined',  v:Object.keys(ROLE_LABELS).length,c:'#8E44AD',i:'🔐',f:null},
        ].map((k,i)=>(
          <div key={k.l} onClick={()=>k.f&&setFilter(k.f)} style={{background:'#fff',borderRadius:'12px',padding:'16px 18px',
            border:'1px solid var(--odoo-border)',boxShadow:'0 2px 8px rgba(113,75,103,.07)',
            borderTop:`3px solid ${k.c}`,position:'relative',overflow:'hidden',cursor:k.f?'pointer':'default',transition:'all .2s'}}
            onMouseEnter={e=>{if(k.f)e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>e.currentTarget.style.transform=''}>
            <div style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'30px',opacity:.08}}>{k.i}</div>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'6px'}}>{k.l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'26px',fontWeight:'800',lineHeight:1,marginBottom:'3px',color:'var(--odoo-text)'}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',background:'#fff',
        border:'1px solid var(--odoo-border)',borderRadius:'10px',padding:'10px 14px',boxShadow:'0 2px 8px rgba(113,75,103,.05)'}}>
        {/* search */}
        <div style={{position:'relative',flex:1,maxWidth:'280px'}}>
          <span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'#ADB5BD'}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, email, username…"
            style={{width:'100%',padding:'7px 12px 7px 32px',background:'var(--odoo-bg)',border:'1.5px solid var(--odoo-border)',borderRadius:'8px',fontFamily:'DM Sans,sans-serif',fontSize:'12px',outline:'none'}}/>
        </div>
        {/* filter btns */}
        {[['all',`All (${total})`],['active',`Active (${cActive})`],['inactive',`Inactive (${cInactive})`],['online',`Online (${cOnline})`]].map(([f,l])=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:'7px 12px',borderRadius:'7px',fontSize:'11px',fontWeight:'600',cursor:'pointer',
            border:`1.5px solid ${filter===f?'var(--odoo-purple)':'var(--odoo-border)'}`,
            background:filter===f?'#EDE0EA':'#fff',color:filter===f?'var(--odoo-purple)':'var(--odoo-gray)',transition:'all .15s'}}>{l}</button>
        ))}
        <div style={{flex:1}}/>
        {/* role filter */}
        <select value={roleF} onChange={e=>setRoleF(e.target.value)}
          style={{padding:'7px 10px',border:'1.5px solid var(--odoo-border)',borderRadius:'7px',fontFamily:'DM Sans,sans-serif',fontSize:'11px',fontWeight:'600',outline:'none',cursor:'pointer',background:'#fff'}}>
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k,l])=><option key={k} value={k}>{l}</option>)}
        </select>
        {/* view toggle */}
        <div style={{display:'flex',gap:'3px',background:'var(--odoo-bg)',padding:'3px',borderRadius:'7px',border:'1px solid var(--odoo-border)'}}>
          {[['table','☰'],['grid','⊞']].map(([v,ic])=>(
            <div key={v} onClick={()=>setView(v)} style={{width:'30px',height:'28px',borderRadius:'5px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'14px',
              background:view===v?'#fff':'transparent',color:view===v?'var(--odoo-purple)':'var(--odoo-gray)',boxShadow:view===v?'0 1px 4px rgba(0,0,0,.1)':'none',transition:'all .15s'}}>{ic}</div>
          ))}
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {view==='table' && (
        <div style={{background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:'12px',overflow:'hidden',boxShadow:'0 2px 8px rgba(113,75,103,.06)'}}>
          <div style={{display:'grid',gridTemplateColumns:'40px 2fr 1.5fr 1fr 1fr 1.2fr 1fr 100px',padding:'10px 16px',background:'#FBF7FA',borderBottom:'2px solid var(--odoo-border)'}}>
            {['','User','Email','Role','Status','Last Login','Dept','Actions'].map(h=>(
              <span key={h} style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</span>
            ))}
          </div>

          {filtered.length===0
            ? <div style={{textAlign:'center',padding:'50px',color:'var(--odoo-gray)'}}>
                <div style={{fontSize:'40px',opacity:.2,marginBottom:'10px'}}>👥</div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700'}}>No users found</div>
              </div>
            : filtered.map(u=>(
              <div key={u.id} style={{display:'grid',gridTemplateColumns:'40px 2fr 1.5fr 1fr 1fr 1.2fr 1fr 100px',
                padding:'11px 16px',borderBottom:'1px solid var(--odoo-border)',alignItems:'center',
                transition:'background .12s',cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                onClick={()=>openEdit(u)}>
                {/* checkbox */}
                <div style={{width:'16px',height:'16px',borderRadius:'4px',border:'2px solid var(--odoo-border)',cursor:'pointer'}} onClick={e=>e.stopPropagation()}/>
                {/* user */}
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'34px',height:'34px',borderRadius:'50%',background:u.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'800',flexShrink:0,fontFamily:'Syne,sans-serif'}}>{init(u)}</div>
                  <div>
                    <div style={{fontSize:'12px',fontWeight:'700',color:'var(--odoo-text)'}}>{u.fname} {u.lname}</div>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>@{u.uname}</div>
                  </div>
                </div>
                {/* email */}
                <div style={{fontSize:'11px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                {/* role */}
                <div><span style={rolePillStyle(u.role)}>{ROLE_LABELS[u.role]}</span></div>
                {/* status */}
                <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:'600'}}>
                  <div style={{width:'7px',height:'7px',borderRadius:'50%',flexShrink:0,
                    background:u.online?'#00E5B0':u.status==='active'?'#ADB5BD':'var(--odoo-red)'}}/>
                  {u.online?'Online':u.status==='active'?'Active':'Inactive'}
                </div>
                {/* last login */}
                <div style={{fontSize:'11px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{u.lastLogin}</div>
                {/* dept */}
                <div><span style={{fontSize:'10px',fontWeight:'600',color:'var(--odoo-gray)',background:'var(--odoo-bg)',padding:'2px 7px',borderRadius:'6px',border:'1px solid var(--odoo-border)'}}>{u.dept||'—'}</span></div>
                {/* actions */}
                <div style={{display:'flex',gap:'4px'}} onClick={e=>e.stopPropagation()}>
                  <div style={actBtnStyle('view')} title="View"   onClick={()=>openEdit(u)}>👁️</div>
                  <div style={actBtnStyle('edit')} title="Edit"   onClick={()=>openEdit(u)}>✏️</div>
                  <div style={actBtnStyle('perm')} title="Permissions" onClick={()=>openPerms(u)}>🔐</div>
                  <div style={actBtnStyle('del')}  title="Delete" onClick={()=>setDeleteId(u.id)}>🗑️</div>
                </div>
              </div>
            ))
          }

          {/* pagination */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderTop:'1px solid var(--odoo-border)',background:'#FBF7FA'}}>
            <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users</div>
            <div style={{display:'flex',gap:'4px'}}>
              {['‹','1','›'].map(b=>(
                <div key={b} style={{width:'28px',height:'28px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',
                  cursor:'pointer',fontSize:'11px',fontWeight:'600',border:'1px solid var(--odoo-border)',
                  background:b==='1'?'var(--odoo-purple)':'#fff',color:b==='1'?'#fff':'var(--odoo-gray)'}}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {view==='grid' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:'12px'}}>
          {filtered.map(u=>(
            <div key={u.id} style={{background:'#fff',borderRadius:'12px',border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 2px 8px rgba(113,75,103,.07)',transition:'all .2s',cursor:'pointer'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(113,75,103,.14)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(113,75,103,.07)'}}>
              {/* banner */}
              <div style={{height:'60px',background:`linear-gradient(135deg,${u.color},${u.color}BB)`,position:'relative'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'50%',background:u.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:'800',color:'#fff',fontFamily:'Syne,sans-serif',border:'3px solid #fff',position:'absolute',bottom:'-26px',left:'16px',boxShadow:'0 3px 10px rgba(0,0,0,.15)'}}>{init(u)}</div>
                <div style={{position:'absolute',top:'9px',right:'11px',width:'9px',height:'9px',borderRadius:'50%',background:u.online?'#00E5B0':u.status==='active'?'#ADB5BD':'var(--odoo-red)'}}/>
              </div>
              <div style={{padding:'32px 16px 14px'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:'13px',fontWeight:'800',marginBottom:'2px'}}>{u.fname} {u.lname}</div>
                <div style={{marginBottom:'9px'}}><span style={rolePillStyle(u.role)}>{ROLE_LABELS[u.role]}</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:'3px',marginBottom:'9px'}}>
                  {[`📧 ${u.email}`,`🏢 ${u.dept||'—'} · ${u.desig||'—'}`,`🕐 ${u.lastLogin}`].map(r=>(
                    <div key={r} style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{r}</div>
                  ))}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'3px',marginBottom:'10px'}}>
                  {u.modules.slice(0,4).map(mk=>{const m=MODULES_LIST.find(x=>x.k===mk);return m?<span key={mk} style={{fontSize:'9px',fontWeight:'600',background:'var(--odoo-bg)',border:'1px solid var(--odoo-border)',borderRadius:'5px',padding:'2px 5px',color:'var(--odoo-gray)'}}>{m.icon} {m.name}</span>:null})}
                  {u.modules.length>4&&<span style={{fontSize:'9px',background:'var(--odoo-bg)',border:'1px solid var(--odoo-border)',borderRadius:'5px',padding:'2px 5px',color:'var(--odoo-gray)'}}>+{u.modules.length-4}</span>}
                </div>
                <div style={{display:'flex',gap:'6px',paddingTop:'10px',borderTop:'1px solid var(--odoo-border)'}}>
                  <button className="btn btn-s" style={{fontSize:'10px',padding:'3px 8px',flex:1}} onClick={()=>openEdit(u)}>✏️ Edit</button>
                  <button className="btn btn-s" style={{fontSize:'10px',padding:'3px 8px',flex:1}} onClick={()=>openPerms(u)}>🔐 Perms</button>
                  <button onClick={()=>setDeleteId(u.id)} style={{padding:'3px 8px',border:'none',background:'#FDEDEC',color:'#D9534F',borderRadius:'6px',fontSize:'10px',fontWeight:'700',cursor:'pointer'}}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ DRAWER OVERLAY ══ */}
      {drawer && <Overlay onClick={()=>setDrawer(false)}/>}

      {/* ══ ADD/EDIT DRAWER ══ */}
      <div style={{position:'fixed',top:0,right:0,height:'100vh',width:'520px',background:'#fff',zIndex:1001,
        transform:drawer?'translateX(0)':'translateX(100%)',transition:'transform .3s cubic-bezier(.4,0,.2,1)',
        boxShadow:'-8px 0 40px rgba(113,75,103,.18)',display:'flex',flexDirection:'column'}}>
        {/* header */}
        <div style={{padding:'18px 22px',borderBottom:'1px solid var(--odoo-border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#FBF7FA'}}>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:'16px',fontWeight:'800'}}>{editId?'✏️ Edit User':'➕ Add New User'}</div>
          <span onClick={()=>setDrawer(false)} style={{cursor:'pointer',fontSize:'20px',color:'var(--odoo-gray)',padding:'4px 8px',borderRadius:'6px'}}>✕</span>
        </div>
        {/* body */}
        <div style={{flex:1,overflowY:'auto',padding:'20px'}}>

          {/* avatar picker */}
          <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'18px',background:'var(--odoo-bg)',borderRadius:'10px',padding:'14px'}}>
            <div style={{width:'56px',height:'56px',borderRadius:'50%',background:form.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:'800',color:'#fff',fontFamily:'Syne,sans-serif',border:'3px solid #fff',boxShadow:'0 3px 14px rgba(0,0,0,.12)',flexShrink:0,transition:'all .2s'}}>
              {((form.fname[0]||'A')+(form.lname[0]||'K')).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:'600',marginBottom:'8px'}}>Avatar Color</div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {AVATAR_COLORS.map(c=>(
                  <div key={c} onClick={()=>sf('color',c)} style={{width:'22px',height:'22px',borderRadius:'50%',background:c,cursor:'pointer',
                    border:`2px solid ${form.color===c?'var(--odoo-text)':'transparent'}`,
                    transform:form.color===c?'scale(1.25)':'scale(1)',transition:'all .15s'}}/>
                ))}
              </div>
            </div>
          </div>

          {/* basic info */}
          <div style={{marginBottom:'18px'}}>
            <SectionTitle>👤 Basic Information</SectionTitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              {[['First Name *','fname','text'],['Last Name *','lname','text'],['Email *','email','email'],['Mobile','mobile','text']].map(([l,k,t])=>(
                <Fg key={k} label={l}><input type={t} value={form[k]} onChange={e=>sf(k,e.target.value)} style={inputSt}/></Fg>
              ))}
              <Fg label="Department">
                <select value={form.dept} onChange={e=>sf('dept',e.target.value)} style={inputSt}>
                  {DEPTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </Fg>
              <Fg label="Designation"><input value={form.desig} onChange={e=>sf('desig',e.target.value)} style={inputSt}/></Fg>
            </div>
          </div>

          {/* credentials */}
          <div style={{marginBottom:'18px'}}>
            <SectionTitle>🔑 Login Credentials</SectionTitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <Fg label="Username *"><input value={form.uname} onChange={e=>sf('uname',e.target.value.toLowerCase().replace(/\s/g,''))} style={{...inputSt,fontFamily:'DM Mono,monospace'}}/></Fg>
              <Fg label={`Password${!editId?' *':''}`}><input type="password" value={form.pass} onChange={e=>sf('pass',e.target.value)} placeholder={editId?'Leave blank to keep':'Min 8 chars'} style={inputSt}/></Fg>
              <Fg label="Role *">
                <select value={form.role} onChange={e=>onRoleChange(e.target.value)} style={inputSt}>
                  {Object.entries(ROLE_LABELS).map(([k,l])=><option key={k} value={k}>{l}</option>)}
                </select>
              </Fg>
              <Fg label="Status">
                <select value={form.status} onChange={e=>sf('status',e.target.value)} style={inputSt}>
                  <option value="active">✅ Active</option><option value="inactive">🔒 Inactive</option>
                </select>
              </Fg>
            </div>
          </div>

          {/* module access */}
          <div style={{marginBottom:'18px'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
              📦 Module Access
              <div style={{flex:1,height:'1px',background:'var(--odoo-border)'}}/>
              <button onClick={()=>sf('modules',MODULES_LIST.map(m=>m.k))} style={{fontSize:'10px',padding:'2px 8px',border:'none',background:'transparent',color:'var(--odoo-purple)',cursor:'pointer',fontWeight:'700'}}>All</button>
              <button onClick={()=>sf('modules',[])} style={{fontSize:'10px',padding:'2px 8px',border:'none',background:'transparent',color:'var(--odoo-gray)',cursor:'pointer',fontWeight:'700'}}>Clear</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
              {MODULES_LIST.map(m=>{
                const on=form.modules.includes(m.k)
                return(
                  <div key={m.k} onClick={()=>sf('modules',toggle(form.modules,m.k))}
                    style={{background:on?'#EDE0EA':'var(--odoo-bg)',border:`1.5px solid ${on?'var(--odoo-purple)':'var(--odoo-border)'}`,borderRadius:'8px',padding:'8px 10px',cursor:'pointer',transition:'all .15s',display:'flex',alignItems:'center',gap:'7px'}}>
                    <span style={{fontSize:'16px'}}>{m.icon}</span>
                    <div style={{flex:1,fontSize:'10px',fontWeight:'700',color:on?'var(--odoo-purple)':'var(--odoo-gray)'}}>{m.name}</div>
                    <div style={{width:'14px',height:'14px',borderRadius:'50%',border:`2px solid ${on?'var(--odoo-purple)':'var(--odoo-border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'8px',background:on?'var(--odoo-purple)':'transparent',color:'#fff',flexShrink:0}}>{on&&'✓'}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* feature permissions */}
          <div style={{marginBottom:'18px'}}>
            <SectionTitle>🔐 Feature Permissions</SectionTitle>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
              {PERMS_LIST.map(p=>{
                const on=form.perms.includes(p.k)
                return(
                  <div key={p.k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--odoo-bg)',border:'1px solid var(--odoo-border)',borderRadius:'8px',padding:'8px 11px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                      <span style={{fontSize:'14px'}}>{p.icon}</span>
                      <div><div style={{fontSize:'11px',fontWeight:'600'}}>{p.name}</div><div style={{fontSize:'9px',color:'var(--odoo-gray)'}}>{p.sub}</div></div>
                    </div>
                    <div style={toggleStyle(on)} onClick={()=>sf('perms',toggle(form.perms,p.k))}><div style={knobStyle(on)}/></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* notes */}
          <div>
            <SectionTitle>📝 Notes</SectionTitle>
            <textarea value={form.notes} onChange={e=>sf('notes',e.target.value)} rows={3} placeholder="Any notes about this user…"
              style={{...inputSt,width:'100%',resize:'vertical'}}/>
          </div>
        </div>
        {/* footer */}
        <div style={{padding:'16px 22px',borderTop:'1px solid var(--odoo-border)',display:'flex',gap:'10px',justifyContent:'flex-end',background:'#FBF7FA'}}>
          <button onClick={()=>setDrawer(false)} style={{padding:'8px 14px',border:'none',background:'transparent',color:'var(--odoo-gray)',cursor:'pointer',fontWeight:'600',fontSize:'12px'}}>Cancel</button>
          <button className="btn btn-s" style={{fontSize:'12px'}} onClick={()=>setForm(blankForm())}>🔄 Reset</button>
          <button className="btn btn-p btn-s" onClick={handleSave}>💾 {editId?'Update User':'Save User'}</button>
        </div>
      </div>

      {/* ══ PERMISSIONS MODAL ══ */}
      {permUser&&(
        <div style={{position:'fixed',inset:0,background:'rgba(26,26,46,.55)',zIndex:1002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',backdropFilter:'blur(4px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setPermUser(null)}}>
          <div style={{background:'#fff',borderRadius:'14px',width:'640px',maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(113,75,103,.2)'}}>
            <div style={{padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg,var(--odoo-purple),#875A7B)',borderRadius:'14px 14px 0 0'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'15px',fontWeight:'800',color:'#fff'}}>🔐 Permissions — {permUser.fname} {permUser.lname}</div>
              <span onClick={()=>setPermUser(null)} style={{cursor:'pointer',fontSize:'18px',color:'rgba(255,255,255,.7)',padding:'4px 8px'}}>✕</span>
            </div>
            <div style={{overflowY:'auto',padding:'20px',flex:1}}>
              {/* user strip */}
              <div style={{display:'flex',alignItems:'center',gap:'12px',background:'#FBF7FA',borderRadius:'10px',padding:'14px',marginBottom:'18px'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'50%',background:permUser.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'800',color:'#fff',fontFamily:'Syne,sans-serif'}}>{init(permUser)}</div>
                <div><div style={{fontFamily:'Syne,sans-serif',fontSize:'14px',fontWeight:'800'}}>{permUser.fname} {permUser.lname}</div><span style={rolePillStyle(permUser.role)}>{ROLE_LABELS[permUser.role]}</span></div>
                <button className="btn btn-s" style={{marginLeft:'auto',fontSize:'11px',padding:'4px 10px'}} onClick={()=>{setPermMods([...(ROLE_MODULES_DEF[permUser.role]||[])]);setPermPs([...(ROLE_PERMS_DEF[permUser.role]||[])]);toast('Role defaults applied','i')}}>↺ Reset to Defaults</button>
              </div>
              {/* modules */}
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'10px'}}>📦 Module Access</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px',marginBottom:'18px'}}>
                {MODULES_LIST.map(m=>{
                  const on=permMods.includes(m.k)
                  return(
                    <div key={m.k} onClick={()=>setPermMods(toggle(permMods,m.k))}
                      style={{background:on?'#EDE0EA':'var(--odoo-bg)',border:`1.5px solid ${on?'var(--odoo-purple)':'var(--odoo-border)'}`,borderRadius:'8px',padding:'8px',textAlign:'center',cursor:'pointer',transition:'all .15s'}}>
                      <div style={{fontSize:'18px',marginBottom:'3px'}}>{m.icon}</div>
                      <div style={{fontSize:'9px',fontWeight:'700',color:on?'var(--odoo-purple)':'var(--odoo-gray)'}}>{m.name}</div>
                    </div>
                  )
                })}
              </div>
              {/* perms */}
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'10px'}}>🔐 Feature Permissions</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>
                {PERMS_LIST.map(p=>{
                  const on=permPs.includes(p.k)
                  return(
                    <div key={p.k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--odoo-bg)',border:'1px solid var(--odoo-border)',borderRadius:'8px',padding:'8px 11px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                        <span style={{fontSize:'14px'}}>{p.icon}</span>
                        <div><div style={{fontSize:'11px',fontWeight:'600'}}>{p.name}</div><div style={{fontSize:'9px',color:'var(--odoo-gray)'}}>{p.sub}</div></div>
                      </div>
                      <div style={toggleStyle(on)} onClick={()=>setPermPs(toggle(permPs,p.k))}><div style={knobStyle(on)}/></div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{padding:'14px 22px',borderTop:'1px solid var(--odoo-border)',display:'flex',gap:'10px',justifyContent:'flex-end',background:'#FBF7FA',borderRadius:'0 0 14px 14px'}}>
              <button onClick={()=>setPermUser(null)} style={{padding:'8px 14px',border:'none',background:'transparent',color:'var(--odoo-gray)',cursor:'pointer',fontWeight:'600',fontSize:'12px'}}>Cancel</button>
              <button className="btn btn-p btn-s" onClick={savePerms}>💾 Save Permissions</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM DELETE ══ */}
      {deleteId&&(
        <div style={{position:'fixed',inset:0,background:'rgba(26,26,46,.55)',zIndex:1002,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setDeleteId(null)}}>
          <div style={{background:'#fff',borderRadius:'14px',padding:'28px',textAlign:'center',width:'340px',boxShadow:'0 8px 40px rgba(113,75,103,.2)'}}>
            <div style={{fontSize:'46px',marginBottom:'12px'}}>🗑️</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'18px',fontWeight:'800',marginBottom:'8px'}}>Delete User?</div>
            <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginBottom:'20px',lineHeight:'1.6'}}>
              Delete <strong>{users.find(u=>u.id===deleteId)?.fname} {users.find(u=>u.id===deleteId)?.lname}</strong>? This cannot be undone.
            </div>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button onClick={doDelete} style={{padding:'8px 18px',borderRadius:'8px',background:'var(--odoo-red)',color:'#fff',border:'none',cursor:'pointer',fontWeight:'700',fontSize:'12px'}}>Yes, Delete</button>
              <button className="btn btn-s" style={{fontSize:'12px'}} onClick={()=>setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ AUDIT LOG ══ */}
      {showAudit&&(
        <div style={{position:'fixed',inset:0,background:'rgba(26,26,46,.55)',zIndex:1002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',backdropFilter:'blur(4px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowAudit(false)}}>
          <div style={{background:'#fff',borderRadius:'14px',width:'640px',maxHeight:'85vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(113,75,103,.2)'}}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid var(--odoo-border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#FBF7FA',borderRadius:'14px 14px 0 0'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'15px',fontWeight:'800'}}>📋 User Activity Audit Log</div>
              <span onClick={()=>setShowAudit(false)} style={{cursor:'pointer',fontSize:'18px',color:'var(--odoo-gray)'}}>✕</span>
            </div>
            <div style={{overflowY:'auto',padding:'20px',display:'flex',flexDirection:'column',gap:'2px'}}>
              {audit.map((a,i)=>{
                const icons={add:'➕',edit:'✏️',del:'🗑️',login:'🔑',perm:'🔐'}
                const bgs  ={add:'#E6F7F7',edit:'#FDF0EA',del:'#FDEDEC',login:'#F7F0F5',perm:'#F4ECF7'}
                return(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'10px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                    <div style={{width:'28px',height:'28px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',flexShrink:0,background:bgs[a.type]||'#F5F5F5'}}>{icons[a.type]||'📋'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'11px',fontWeight:'600'}}>{a.msg}</div>
                      <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginTop:'2px'}}>{a.meta}</div>
                    </div>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace',whiteSpace:'nowrap'}}>{a.time}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ ROLE MANAGER ══ */}
      {showRoles&&(
        <div style={{position:'fixed',inset:0,background:'rgba(26,26,46,.55)',zIndex:1002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',backdropFilter:'blur(4px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setShowRoles(false)}}>
          <div style={{background:'#fff',borderRadius:'14px',width:'700px',maxHeight:'88vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(113,75,103,.2)'}}>
            <div style={{padding:'18px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'linear-gradient(135deg,var(--odoo-purple),#875A7B)',borderRadius:'14px 14px 0 0'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'15px',fontWeight:'800',color:'#fff'}}>🔐 Role Manager</div>
              <span onClick={()=>setShowRoles(false)} style={{cursor:'pointer',fontSize:'18px',color:'rgba(255,255,255,.7)'}}>✕</span>
            </div>
            <div style={{overflowY:'auto',padding:'20px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                {Object.entries(ROLE_LABELS).map(([k,l])=>{
                  const mods=ROLE_MODULES_DEF[k]||[]; const perms=ROLE_PERMS_DEF[k]||[]
                  const cnt=users.filter(u=>u.role===k).length
                  return(
                    <div key={k} style={{background:ROLE_BG[k]||'#F5F5F5',border:`1.5px solid ${ROLE_COLORS[k]}33`,borderRadius:'10px',padding:'14px',transition:'all .15s',cursor:'default'}}
                      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                      onMouseLeave={e=>e.currentTarget.style.transform=''}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                        <div style={{fontFamily:'Syne,sans-serif',fontSize:'13px',fontWeight:'800',color:ROLE_COLORS[k]}}>{l}</div>
                        <div style={{fontSize:'10px',fontWeight:'700',background:ROLE_COLORS[k],color:'#fff',padding:'2px 8px',borderRadius:'8px'}}>{cnt} users</div>
                      </div>
                      <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'8px',lineHeight:'1.5'}}>{ROLE_DESC[k]}</div>
                      <div style={{display:'flex',gap:'8px',fontSize:'10px',fontWeight:'600',marginBottom:'8px'}}>
                        <span style={{background:'rgba(255,255,255,.6)',padding:'2px 7px',borderRadius:'5px'}}>📦 {mods.length} modules</span>
                        <span style={{background:'rgba(255,255,255,.6)',padding:'2px 7px',borderRadius:'5px'}}>🔐 {perms.length} perms</span>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'3px'}}>
                        {mods.slice(0,5).map(mk=>{const m=MODULES_LIST.find(x=>x.k===mk);return m?<span key={mk} style={{fontSize:'9px',background:'rgba(255,255,255,.5)',padding:'1px 5px',borderRadius:'4px'}}>{m.icon} {m.name}</span>:null})}
                        {mods.length>5&&<span style={{fontSize:'9px',background:'rgba(255,255,255,.5)',padding:'1px 5px',borderRadius:'4px'}}>+{mods.length-5}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{background:'#FBF7FA',border:'1px solid var(--odoo-border)',borderRadius:'10px',padding:'12px 14px',fontSize:'12px',color:'var(--odoo-gray)'}}>
                💡 <strong style={{color:'var(--odoo-purple)'}}>Role defaults</strong> apply automatically when creating a new user. Individual permissions can be customised using the <strong>🔐 Perms</strong> button.
              </div>
            </div>
          </div>
        </div>
      )}

      <Toasts list={toasts}/>
    </div>
  )
}

/* ── input style ── */
const inputSt = {
  padding:'8px 12px',background:'var(--odoo-bg)',border:'1.5px solid var(--odoo-border)',
  borderRadius:'8px',fontFamily:'DM Sans,sans-serif',fontSize:'12px',outline:'none',width:'100%'
}

/* ── Fg field group ── */
function Fg({label,children}){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
      <label style={{fontSize:'10px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.4px',color:'var(--odoo-text)'}}>{label}</label>
      {children}
    </div>
  )
}
