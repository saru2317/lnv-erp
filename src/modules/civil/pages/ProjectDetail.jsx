import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_CFG = {
  PLANNING:  { bg:'#EBF5FB', color:'#1A5276', label:'Planning' },
  ACTIVE:    { bg:'#E8F5E9', color:'#1E8449', label:'Active' },
  ON_HOLD:   { bg:'#FEF9E7', color:'#B8860B', label:'On Hold' },
  COMPLETED: { bg:'#F0EBF0', color:'#714B67', label:'Completed' },
  CANCELLED: { bg:'#FDEDEC', color:'#C0392B', label:'Cancelled' },
}
const TABS = ['Overview','Houses','BOQ','DPR Log','Labour','Contractors','RA Bills','Materials','Specs & VO']

export default function ProjectDetail() {
  const { id }  = useParams()
  const nav     = useNavigate()
  const [proj,  setProj]  = useState(null)
  const [tab,   setTab]   = useState('Overview')
  const [boq,   setBOQ]   = useState([])
  const [dprs,  setDPRs]  = useState([])
  const [raBills,setRaBills]=useState([])
  const [specs, setSpecs] = useState([])
  const [vos,   setVOs]   = useState([])
  const [loading,setLoading]=useState(true)
  const [editStatus,setEditStatus]=useState(false)
  const [contractorWOs,setContractorWOs]=useState([])
  const [materials,    setMaterials]    =useState([])
  const [units,        setUnits]        =useState([])
  const [showUnitForm, setShowUnitForm] =useState(false)
  const [unitForm, setUnitForm] = useState({ unitNo:'', unitType:'', floorNo:'', builtUpArea:'', ownerName:'', ownerPhone:'', ownerEmail:'', totalContractValue:'', startDate:'', targetDate:'' })
  const [editingUnitId, setEditingUnitId] = useState(null) // null = creating new house; set = editing existing
  const [roomsFor, setRoomsFor] = useState(null)
  const [addonsFor, setAddonsFor] = useState(null) // room object, or null when add-ons modal closed
  const [detailFor, setDetailFor] = useState(null) // room object, or null when detail modal closed
  const [roomDetail, setRoomDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [addonCatalog, setAddonCatalog] = useState([])
  const [roomAddons, setRoomAddons] = useState([])
  const [addonPick, setAddonPick] = useState('')

  useEffect(() => {
    if (!addonsFor) return
    fetch(`${BASE}/civil/room-addon-master`, { headers:hdr2() }).then(r=>r.json()).then(d=>setAddonCatalog(d.data||[]))
    fetch(`${BASE}/civil/rooms/${addonsFor.id}/addons`, { headers:hdr2() }).then(r=>r.json()).then(d=>setRoomAddons(d.data||[]))
  }, [addonsFor])

  useEffect(() => {
    if (!detailFor) { setRoomDetail(null); return }
    setDetailLoading(true)
    fetch(`${BASE}/civil/rooms/${detailFor.id}/detail`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setRoomDetail(d.data||null))
      .catch(()=>setRoomDetail(null))
      .finally(()=>setDetailLoading(false))
  }, [detailFor])

  const addRoomAddon = async () => {
    if (!addonPick) return toast.error('Pick an add-on first')
    try {
      const r = await fetch(`${BASE}/civil/rooms/${addonsFor.id}/addons`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ addonCode: addonPick }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message||'Added')
      setAddonPick('')
      const fresh = await fetch(`${BASE}/civil/rooms/${addonsFor.id}/addons`, { headers:hdr2() }).then(r=>r.json())
      setRoomAddons(fresh.data||[])
      loadUnits()
    } catch { toast.error('Failed to add') }
  }

  const updateAddonProgress = async (addonId, progress) => {
    try {
      await fetch(`${BASE}/civil/room-addons/${addonId}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ progress }) })
      const fresh = await fetch(`${BASE}/civil/rooms/${addonsFor.id}/addons`, { headers:hdr2() }).then(r=>r.json())
      setRoomAddons(fresh.data||[])
    } catch { toast.error('Failed to update') }
  }

  const removeRoomAddon = async (addonId) => {
    try {
      await fetch(`${BASE}/civil/room-addons/${addonId}`, { method:'DELETE', headers:hdr2() })
      const fresh = await fetch(`${BASE}/civil/rooms/${addonsFor.id}/addons`, { headers:hdr2() }).then(r=>r.json())
      setRoomAddons(fresh.data||[])
      loadUnits()
      toast.success('Removed')
    } catch { toast.error('Failed to remove') }
  }
  const [roomForm, setRoomForm] = useState({ roomName:'', roomType:'OTHER', areaSqft:'' })

  const loadUnits = useCallback(async () => {
    const r = await fetch(`${BASE}/civil/units?projectId=${id}`, { headers:hdr2() }).then(r=>r.json())
    setUnits(r.data||[])
  }, [id])

  const getShareLink = async (u) => {
    try {
      const r = await fetch(`${BASE}/civil/units/${u.id}/share-link`, { headers:hdr2() })
      const d = await r.json()
      if (d.error) { toast.error(d.error); return null }
      return `${window.location.origin}/status/${d.data.token}`
    } catch { toast.error('Could not get link'); return null }
  }

  const copyLink = async (u) => {
    const link = await getShareLink(u)
    if (!link) return
    navigator.clipboard.writeText(link)
    toast.success(`✅ Link copied for ${u.unitNo}`)
  }

  const whatsappUpdate = async (u) => {
    const link = await getShareLink(u)
    if (!link) return
    if (!u.ownerPhone) { toast.error(`No phone number saved for ${u.unitNo} — add one first`); return }
    const message =
      `Hi ${u.ownerName||''}, here's the latest construction update for your house ${u.unitNo}:\n\n` +
      `Progress: ${u.progress}% complete\n\n` +
      `View live status anytime: ${link}`
    // Strip non-digits, same click-to-chat pattern as LNV POS — zero API cost
    const phone = u.ownerPhone.replace(/\D/g,'')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const load = useCallback(async () => {
    try {
      const [pr, bq, dp, ra, sp, vo, cwo, mat] = await Promise.all([
        fetch(`${BASE}/civil/projects/${id}`,        {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/boq/${id}`,             {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/dpr/${id}`,             {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/ra-bills/${id}`,        {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/specs/${id}`,           {headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/variation-orders/${id}`,{headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil-ext/contractor-wo?projectId=${id}`,{headers:hdr2()}).then(r=>r.json()),
        fetch(`${BASE}/civil/stock?projectId=${id}`,     {headers:hdr2()}).then(r=>r.json()),
      ])
      setProj(pr.data); setBOQ(bq.data||[]); setDPRs(dp.data||[])
      setRaBills(ra.data||[]); setSpecs(sp.data||[]); setVOs(vo.data||[])
      setContractorWOs(cwo.data||[]); setMaterials(mat.data||[])
      loadUnits()
    } catch(e){ toast.error('Load failed') }
    finally { setLoading(false) }
  },[id, loadUnits])

  useEffect(()=>{ load() },[load])

  const updateStatus = async (status) => {
    await fetch(`${BASE}/civil/projects/${id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status})})
    toast.success('Status updated'); setEditStatus(false); load()
  }

  const toDateInput = (d) => d ? new Date(d).toISOString().slice(0,10) : ''

  const editUnit = (u) => {
    setUnitForm({
      unitNo:u.unitNo||'', unitType:u.unitType||'', floorNo:u.floorNo||'',
      builtUpArea:u.builtUpArea?String(u.builtUpArea):'', ownerName:u.ownerName||'',
      ownerPhone:u.ownerPhone||'', ownerEmail:u.ownerEmail||'',
      totalContractValue:u.totalContractValue?String(u.totalContractValue):'',
      startDate:toDateInput(u.startDate), targetDate:toDateInput(u.targetDate),
    })
    setEditingUnitId(u.id)
    setShowUnitForm(true)
  }

  const saveUnit = async () => {
    if (!unitForm.unitNo) return toast.error('House/Unit No is required')
    try {
      const r = editingUnitId
        ? await fetch(`${BASE}/civil/units/${editingUnitId}`, { method:'PATCH', headers:hdr(), body: JSON.stringify(unitForm) })
        : await fetch(`${BASE}/civil/units`, { method:'POST', headers:hdr(), body: JSON.stringify({ ...unitForm, projectId:id }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingUnitId ? `✅ ${d.data.unitNo} updated` : `✅ ${d.data.unitNo} added`)
      setShowUnitForm(false)
      setEditingUnitId(null)
      setUnitForm({ unitNo:'', unitType:'', floorNo:'', builtUpArea:'', ownerName:'', ownerPhone:'', ownerEmail:'', totalContractValue:'', startDate:'', targetDate:'' })
      loadUnits()
    } catch { toast.error('Save failed') }
  }

  const addRoom = async () => {
    if (!roomForm.roomName) return toast.error('Room name required')
    try {
      const r = await fetch(`${BASE}/civil/rooms`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ ...roomForm, unitId: roomsFor.id }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('✅ Room added')
      await loadUnits()
      const fresh = await fetch(`${BASE}/civil/units?projectId=${id}`, { headers:hdr2() }).then(r=>r.json())
      setRoomsFor((fresh.data||[]).find(u=>u.id===roomsFor.id))
      setRoomForm({ roomName:'', roomType:'OTHER', areaSqft:'' })
    } catch { toast.error('Failed to add room') }
  }

  const removeRoom = async (roomId) => {
    try {
      await fetch(`${BASE}/civil/rooms/${roomId}`, { method:'DELETE', headers:hdr2() })
      const fresh = await fetch(`${BASE}/civil/units?projectId=${id}`, { headers:hdr2() }).then(r=>r.json())
      setUnits(fresh.data||[])
      setRoomsFor((fresh.data||[]).find(u=>u.id===roomsFor.id))
      toast.success('Room removed')
    } catch { toast.error('Failed to remove room') }
  }

  const updateRoomProgress = async (roomId, progress) => {
    try {
      const r = await fetch(`${BASE}/civil/rooms/${roomId}`, { method:'PATCH', headers:hdr(),
        body: JSON.stringify({ progress }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      const fresh = await fetch(`${BASE}/civil/units?projectId=${id}`, { headers:hdr2() }).then(r=>r.json())
      setUnits(fresh.data||[])
      setRoomsFor((fresh.data||[]).find(u=>u.id===roomsFor.id))
    } catch { toast.error('Failed to update progress') }
  }

  const updateRoomArea = async (roomId, areaSqft) => {
    try {
      const r = await fetch(`${BASE}/civil/rooms/${roomId}`, { method:'PATCH', headers:hdr(),
        body: JSON.stringify({ areaSqft }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      const fresh = await fetch(`${BASE}/civil/units?projectId=${id}`, { headers:hdr2() }).then(r=>r.json())
      setUnits(fresh.data||[])
      setRoomsFor((fresh.data||[]).find(u=>u.id===roomsFor.id))
    } catch { toast.error('Failed to update area') }
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading project...</div>
  if (!proj)   return <div style={{padding:40,textAlign:'center',color:'#C0392B'}}>❌ Project not found</div>

  const sc  = STATUS_CFG[proj.status]||STATUS_CFG.PLANNING
  const pct = proj.progress||0
  const boqTotal = boq.reduce((s,b)=>s+Number(b.amount||0),0)
  const boqDone  = boq.reduce((s,b)=>s+Number(b.doneAmt||0),0)
  const raBilled = raBills.filter(r=>r.status!=='DRAFT').reduce((s,r)=>s+Number(r.thisBillAmt||0),0)
  const voTotal  = vos.filter(v=>v.status==='APPROVED').reduce((s,v)=>s+Number(v.variationAmt||0),0)

  return (
    <div style={{background:'#F9F6F8',minHeight:'100vh',fontFamily:'DM Sans,Arial,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:20}}>
        <button onClick={()=>nav('/civil/projects')}
          style={{padding:'8px 14px',background:'#FDF2E9',border:'none',borderRadius:8,cursor:'pointer',color:'#6E2C00',fontWeight:700,marginTop:4}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <div style={{fontSize:20,fontWeight:800,color:'#6E2C00'}}>{proj.projectName}</div>
            {editStatus ? (
              <select onChange={e=>updateStatus(e.target.value)} defaultValue={proj.status}
                style={{padding:'3px 8px',borderRadius:6,border:'1px solid #ddd',fontSize:12}}>
                {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            ) : (
              <span onClick={()=>setEditStatus(true)} style={{padding:'3px 12px',borderRadius:12,fontSize:12,fontWeight:700,
                background:sc.bg,color:sc.color,cursor:'pointer'}}>{sc.label} ✏️</span>
            )}
          </div>
          <div style={{fontSize:12,color:'#888'}}>{proj.projectCode} · {proj.clientName} · {proj.siteLocation||'—'}</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>nav('/civil/dpr/new')}
            style={{padding:'8px 14px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + DPR Entry
          </button>
          <button onClick={()=>nav('/civil/indent')}
            style={{padding:'8px 14px',background:'#1A5276',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + Material Indent
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{background:'#fff',borderRadius:12,padding:16,marginBottom:16,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <div style={{fontSize:13,fontWeight:700,color:'#6E2C00'}}>Overall Progress</div>
          <div style={{fontSize:18,fontWeight:800,color:pct>=80?'#1E8449':pct>=50?'#B8860B':'#C0392B'}}>{pct}%</div>
        </div>
        <div style={{height:12,background:'#F0E8EC',borderRadius:6,overflow:'hidden',marginBottom:12}}>
          <div style={{height:'100%',width:`${pct}%`,borderRadius:6,
            background:pct>=80?'#1E8449':pct>=50?'#B8860B':'#6E2C00',transition:'width .5s'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
          {[
            ['Contract',  fmtC(proj.contractValue), '#1E8449'],
            ['BOQ Done',  fmtC(boqDone),            '#6E2C00'],
            ['RA Billed', fmtC(raBilled),           '#D35400'],
            ['Variation', fmtC(voTotal),             '#714B67'],
            ['Target',    fmtD(proj.targetDate),     '#1A5276'],
          ].map(([l,v,c])=>(
            <div key={l} style={{textAlign:'center',background:'#F9F6F8',borderRadius:8,padding:'8px 4px'}}>
              <div style={{fontSize:10,color:'#888'}}>{l}</div>
              <div style={{fontSize:13,fontWeight:700,color:c,marginTop:3}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:4,background:'#fff',borderRadius:10,padding:5,marginBottom:16,
        boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:'8px 16px',border:'none',borderRadius:7,cursor:'pointer',
              fontWeight:700,fontSize:12,whiteSpace:'nowrap',transition:'all .15s',
              background:tab===t?'#6E2C00':'transparent',
              color:tab===t?'#fff':'#888'}}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab==='Overview' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {[
            {title:'Project Info', items:[
              ['Project Code', proj.projectCode],['Type', proj.projectType],
              ['Start Date', fmtD(proj.startDate)],['Target Date', fmtD(proj.targetDate)],
              ['PM', proj.pm||'—'],['Status', sc.label],
            ]},
            {title:'Client Info', items:[
              ['Client Name', proj.clientName],['Phone', proj.clientPhone||'—'],
              ['GSTIN', proj.clientGstin||'—'],['Email', proj.clientEmail||'—'],
            ]},
            {title:'Site Info', items:[
              ['Location', proj.siteLocation||'—'],['City', proj.city||'—'],
              ['State', proj.state||'—'],['Area', proj.siteArea||'—'],
            ]},
            {title:'Team', items:[
              ['Supervisor', proj.supervisor||'—'],['Phone', proj.supervisorPhone||'—'],
              ['Engineer', proj.structuralEngineer||'—'],['Architect', proj.architect||'—'],
            ]},
          ].map(({title,items})=>(
            <div key={title} style={{background:'#fff',borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
              <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:14,
                paddingBottom:8,borderBottom:'2px solid #FDF2E9'}}>{title}</div>
              {items.map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',
                  padding:'7px 0',borderBottom:'1px solid #F9F6F8'}}>
                  <div style={{fontSize:12,color:'#888'}}>{k}</div>
                  <div style={{fontSize:12,fontWeight:600,color:'#2C3E50',textAlign:'right',maxWidth:'60%'}}>{v}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* HOUSES TAB */}
      {tab==='Houses' && (
        <div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button onClick={()=>{setEditingUnitId(null);setShowUnitForm(true)}}
              style={{padding:'8px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:12}}>
              + New House
            </button>
          </div>

          {units.length===0 ? (
            <div style={{padding:60,textAlign:'center',background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
              <div style={{fontSize:40,marginBottom:10}}>🏘️</div>
              <div style={{fontSize:14,fontWeight:700,color:'#6E2C00'}}>No houses added yet</div>
              <div style={{fontSize:12,color:'#888',marginTop:4}}>Only relevant for multi-unit projects (Apartment Building, Villa Complex, Row Houses)</div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
              {units.map(u => (
                <div key={u.id} style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',background:'#FDF2E9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:800,color:'#6E2C00',fontSize:14}}>{u.unitNo}</div>
                      <div style={{fontSize:11,color:'#888'}}>{u.unitType||'—'}{u.floorNo?` · Floor ${u.floorNo}`:''}</div>
                    </div>
                    <div style={{fontSize:20,fontWeight:800,color:'#1E8449'}}>{u.progress}%</div>
                  </div>
                  <div style={{padding:'8px 16px'}}>
                    <div style={{height:6,background:'#F0E8EC',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${u.progress}%`,background:'#1E8449',borderRadius:3}}/>
                    </div>
                  </div>
                  <div style={{padding:'10px 16px',fontSize:12,color:'#555'}}>
                    <div>👤 {u.ownerName||'—'} {u.ownerPhone?`(${u.ownerPhone})`:''}</div>
                    <div style={{marginTop:4}}>💰 {fmtC(u.totalContractValue)} contract value</div>
                    <div style={{marginTop:4,color:'#888'}}>🚪 {(u.rooms||[]).length} room(s) tracked</div>
                  </div>
                  <div style={{padding:'10px 16px',borderTop:'1px solid #F0F0F0',display:'flex',flexDirection:'column',gap:6}}>
                    <button onClick={()=>setRoomsFor(u)}
                      style={{width:'100%',padding:'7px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',
                        borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
                      🚪 Manage Rooms
                    </button>
                    <button onClick={()=>nav(`/civil/units/${u.id}/work-status`)}
                      style={{width:'100%',padding:'7px',background:'#0f172a',color:'#fff',border:'none',
                        borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
                      📊 Daily Work Status
                    </button>
                    <button onClick={()=>editUnit(u)}
                      style={{width:'100%',padding:'7px',background:'#FEF9E7',color:'#B8860B',border:'1.5px solid #F9E79F',
                        borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
                      ✏️ Edit Details &amp; Dates
                    </button>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>copyLink(u)}
                        style={{flex:1,padding:'6px',background:'#EBF5FB',color:'#1A5276',border:'none',
                          borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:11}}>
                        📋 Copy Link
                      </button>
                      <button onClick={()=>whatsappUpdate(u)}
                        style={{flex:1,padding:'6px',background:'#E8F5E9',color:'#1E8449',border:'none',
                          borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:11}}>
                        💬 WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New House modal */}
      {showUnitForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:420,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#6E2C00',marginBottom:14}}>{editingUnitId ? 'Edit House / Unit' : 'New House / Unit'}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>House/Unit No *</label>
                  <input value={unitForm.unitNo} onChange={e=>setUnitForm({...unitForm,unitNo:e.target.value})}
                    placeholder='A-101' style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Type</label>
                  <input value={unitForm.unitType} onChange={e=>setUnitForm({...unitForm,unitType:e.target.value})}
                    placeholder='2BHK / 3BHK / Villa' style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Floor</label>
                  <input value={unitForm.floorNo} onChange={e=>setUnitForm({...unitForm,floorNo:e.target.value})}
                    style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Built-up Area (sqft)</label>
                  <input value={unitForm.builtUpArea} onChange={e=>setUnitForm({...unitForm,builtUpArea:e.target.value})}
                    style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Owner Name</label>
                <input value={unitForm.ownerName} onChange={e=>setUnitForm({...unitForm,ownerName:e.target.value})}
                  style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Owner Phone</label>
                  <input value={unitForm.ownerPhone} onChange={e=>setUnitForm({...unitForm,ownerPhone:e.target.value})}
                    style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Owner Email</label>
                  <input value={unitForm.ownerEmail} onChange={e=>setUnitForm({...unitForm,ownerEmail:e.target.value})}
                    style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>This Owner's Contract Value (₹)</label>
                <input value={unitForm.totalContractValue} onChange={e=>setUnitForm({...unitForm,totalContractValue:e.target.value})}
                  style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>This House's Start Date</label>
                  <input type='date' value={unitForm.startDate} onChange={e=>setUnitForm({...unitForm,startDate:e.target.value})}
                    style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>This House's Target Date</label>
                  <input type='date' value={unitForm.targetDate} onChange={e=>setUnitForm({...unitForm,targetDate:e.target.value})}
                    style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,width:'100%',boxSizing:'border-box'}} />
                </div>
              </div>
              <div style={{fontSize:10,color:'#B8860B',background:'#FEF9E7',padding:'6px 10px',borderRadius:5}}>
                💡 Leave blank if this house follows the whole project's schedule — only set these if this specific house has its own handover promise (e.g. Block A by March, Block B by June).
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}>
              <button onClick={()=>{setShowUnitForm(false);setEditingUnitId(null)}}
                style={{padding:'6px 12px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>Cancel</button>
              <button onClick={saveUnit}
                style={{padding:'7px 16px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Rooms modal */}
      {roomsFor && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:520,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:800,color:'#6E2C00'}}>🚪 Rooms — {roomsFor.unitNo}</div>
              <button onClick={()=>setRoomsFor(null)}
                style={{padding:'4px 10px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>✕ Close</button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16,fontSize:12}}>
              <thead><tr style={{background:'#FDF2E9'}}>
                {['Room','Type','Area (sqft)','Progress','Add-ons',''].map(h=>(
                  <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,color:'#6E2C00'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(roomsFor.rooms||[]).map(r => (
                  <tr key={r.id} style={{borderBottom:'1px solid #F0F0F0'}}>
                    <td style={{padding:'7px 10px'}}>{r.roomName}</td>
                    <td style={{padding:'7px 10px'}}>{r.roomType}</td>
                    <td style={{padding:'7px 10px'}}>
                      <input type='number' min='0' defaultValue={r.areaSqft||''}
                        placeholder='—'
                        onBlur={e=>{
                          const v = e.target.value ? parseFloat(e.target.value) : null
                          if (v !== (r.areaSqft?Number(r.areaSqft):null)) updateRoomArea(r.id, v)
                        }}
                        style={{width:64,padding:'4px 6px',border:'1.5px solid #DDD',borderRadius:4,fontSize:12}} />
                    </td>
                    <td style={{padding:'7px 10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <input type='number' min='0' max='100' defaultValue={r.progress}
                          onBlur={e=>{
                            const v = Math.max(0,Math.min(100,parseInt(e.target.value)||0))
                            if (v !== r.progress) updateRoomProgress(r.id, v)
                          }}
                          style={{width:48,padding:'4px 6px',border:'1.5px solid #A9DFBF',borderRadius:4,
                            fontSize:12,fontWeight:700,color:'#1E8449',textAlign:'right'}} />
                        <span style={{color:'#1E8449',fontWeight:700,fontSize:12}}>%</span>
                      </div>
                    </td>
                    <td style={{padding:'7px 10px'}}>
                      <button onClick={()=>setAddonsFor(r)}
                        style={{padding:'4px 9px',background:'#FEF9E7',color:'#B8860B',border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>
                        🎨 Add-ons {(r.addons||[]).length>0?`(${r.addons.length})`:''}
                      </button>
                      {' '}
                      <button onClick={()=>setDetailFor(r)}
                        style={{padding:'4px 9px',background:'#EBF5FB',color:'#1A5276',border:'1px solid #AED6F1',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>
                        📊 Status
                      </button>
                    </td>
                    <td style={{padding:'7px 10px'}}>
                      <button onClick={()=>removeRoom(r.id)}
                        style={{padding:'4px 9px',background:'#fdecea',color:'#C0392B',border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>Remove</button>
                    </td>
                  </tr>
                ))}
                {(roomsFor.rooms||[]).length===0 && <tr><td colSpan={6} style={{padding:'12px',textAlign:'center',color:'#aaa'}}>No rooms yet</td></tr>}
              </tbody>
            </table>
            <div style={{background:'#FAF8FA',border:'1px solid #E8E0E8',borderRadius:6,padding:12}}>
              <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>+ Add Room</div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1.5fr 1fr',gap:8,marginBottom:8}}>
                <input placeholder='Room name (e.g. Kitchen)' value={roomForm.roomName}
                  onChange={e=>setRoomForm({...roomForm,roomName:e.target.value})}
                  style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12}} />
                <select value={roomForm.roomType} onChange={e=>setRoomForm({...roomForm,roomType:e.target.value})}
                  style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12}}>
                  {['LIVING','KITCHEN','BEDROOM','STUDY','POOJA','BATHROOM','BALCONY','OTHER'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <input placeholder='Area sqft' value={roomForm.areaSqft}
                  onChange={e=>setRoomForm({...roomForm,areaSqft:e.target.value})}
                  style={{padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12}} />
              </div>
              <button onClick={addRoom}
                style={{padding:'7px 16px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>+ Add Room</button>
            </div>
          </div>
        </div>
      )}

      {/* Room Add-ons modal — Modular Kitchen, False Ceiling, Wardrobe etc.
          Pure upgrades on top of base BOQ, cost auto-calculated from the
          room's own area, each tracked with its own progress. */}
      {addonsFor && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.45)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:480,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{fontSize:15,fontWeight:800,color:'#6E2C00'}}>🎨 Add-ons — {addonsFor.roomName}</div>
              <button onClick={()=>setAddonsFor(null)}
                style={{padding:'4px 10px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>✕ Close</button>
            </div>
            <div style={{fontSize:11,color:'#888',marginBottom:14}}>
              {addonsFor.areaSqft ? `${addonsFor.areaSqft} sqft` : '⚠️ No area set for this room — set it in the room table first, cost can\'t be calculated without it.'}
              {' '}· Upgrades on top of base construction, not replacements for it.
            </div>

            {roomAddons.length > 0 && (
              <div style={{marginBottom:16,display:'flex',flexDirection:'column',gap:8}}>
                {roomAddons.map(a => (
                  <div key={a.id} style={{background:'#FAF8FA',border:'1px solid #E8E0E8',borderRadius:6,padding:'10px 12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:'#333'}}>{a.addonMaster?.addonName} <span style={{fontSize:10,color:'#B8860B'}}>({a.addonMaster?.grade})</span></div>
                        <div style={{fontSize:10,color:'#888'}}>{a.qty} sqft × ₹{Number(a.rate).toLocaleString('en-IN')} = <b style={{color:'#1E8449'}}>₹{Number(a.amount).toLocaleString('en-IN')}</b></div>
                      </div>
                      <button onClick={()=>removeRoomAddon(a.id)}
                        style={{padding:'3px 8px',background:'#fdecea',color:'#C0392B',border:'none',borderRadius:4,cursor:'pointer',fontSize:10}}>Remove</button>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:10,color:'#888'}}>Progress</span>
                      <input type='number' min='0' max='100' defaultValue={a.progress}
                        onBlur={e=>{
                          const v = Math.max(0,Math.min(100,parseInt(e.target.value)||0))
                          if (v !== a.progress) updateAddonProgress(a.id, v)
                        }}
                        style={{width:44,padding:'3px 5px',border:'1.5px solid #A9DFBF',borderRadius:4,fontSize:11,fontWeight:700,color:'#1E8449',textAlign:'right'}} />
                      <span style={{fontSize:11,color:'#1E8449',fontWeight:700}}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{background:'#FAF8FA',border:'1px solid #E8E0E8',borderRadius:6,padding:12}}>
              <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>+ Add an upgrade</div>
              <div style={{display:'flex',gap:8}}>
                <select value={addonPick} onChange={e=>setAddonPick(e.target.value)}
                  style={{flex:1,padding:'7px 9px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12}}>
                  <option value=''>Select an upgrade...</option>
                  {Object.entries(addonCatalog.reduce((acc,c)=>{
                    if(!acc[c.addonName]) acc[c.addonName]=[]
                    acc[c.addonName].push(c)
                    return acc
                  },{})).map(([name,grades])=>(
                    <optgroup key={name} label={name}>
                      {grades.map(g=><option key={g.code} value={g.code}>{g.grade} — ₹{Number(g.ratePerSqft).toLocaleString('en-IN')}/sqft</option>)}
                    </optgroup>
                  ))}
                </select>
                <button onClick={addRoomAddon}
                  style={{padding:'7px 16px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Detail modal — activity breakdown + real today-vs-yesterday delta */}
      {detailFor && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={()=>setDetailFor(null)}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:640,maxHeight:'85vh',overflow:'auto'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:15,fontWeight:800,color:'#6E2C00'}}>📊 {detailFor.roomName} — Work Status</div>
              <button onClick={()=>setDetailFor(null)}
                style={{padding:'4px 10px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>✕ Close</button>
            </div>

            {detailLoading ? (
              <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
            ) : !roomDetail ? (
              <div style={{padding:40,textAlign:'center',color:'#aaa'}}>Could not load room detail.</div>
            ) : (
              <>
                <div style={{background:'#FDF2E9',borderRadius:8,padding:14,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:11,color:'#888'}}>{roomDetail.unitNo} · {roomDetail.projectName}</div>
                    <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginTop:2}}>{roomDetail.room.roomType} · {roomDetail.room.areaSqft||'—'} sqft</div>
                  </div>
                  <div style={{fontSize:24,fontWeight:900,color:'#1E8449'}}>{roomDetail.room.progress}%</div>
                </div>

                <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>Activities</div>
                {roomDetail.activities.length===0 ? (
                  <div style={{padding:20,textAlign:'center',color:'#aaa',background:'#FAF8FA',borderRadius:8,marginBottom:14}}>
                    No BOQ activities assigned to this room yet — add them via BOQ setup with this room selected.
                  </div>
                ) : (
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:16}}>
                    <thead>
                      <tr style={{background:'#FDF2E9'}}>
                        {['Activity','Description','Done %','Last Updated','Change'].map(h=>(
                          <th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,color:'#6E2C00',fontWeight:700}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roomDetail.activities.map(a=>(
                        <tr key={a.boqId} style={{borderBottom:'1px solid #F0F0F0'}}>
                          <td style={{padding:'7px 8px',fontWeight:700,color:'#6E2C00'}}>{a.activity}</td>
                          <td style={{padding:'7px 8px',color:'#555'}}>{a.description}</td>
                          <td style={{padding:'7px 8px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{width:50,height:6,background:'#F0E8EC',borderRadius:3,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${a.donePct}%`,background:'#1E8449',borderRadius:3}}/>
                              </div>
                              <span style={{fontWeight:700,color:'#1E8449'}}>{a.donePct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={{padding:'7px 8px',fontSize:11,color:'#888'}}>
                            {a.lastUpdated ? new Date(a.lastUpdated).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : 'Never'}
                          </td>
                          <td style={{padding:'7px 8px'}}>
                            {a.deltaPct!=null ? (
                              <span style={{fontWeight:700,color:a.deltaPct>0?'#1E8449':'#888'}}>
                                {a.deltaPct>0?'+':''}{a.deltaPct.toFixed(0)}% since {new Date(a.priorDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                              </span>
                            ) : a.lastUpdated ? (
                              <span style={{fontSize:11,color:'#aaa'}}>First entry</span>
                            ) : (
                              <span style={{fontSize:11,color:'#C0392B'}}>Not started</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {roomDetail.addons?.length>0 && (
                  <>
                    <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>Add-ons</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
                      {roomDetail.addons.map((a,i)=>(
                        <div key={i} style={{background:'#FEF9E7',border:'1px solid #F9E79F',borderRadius:6,padding:'6px 10px',fontSize:11}}>
                          {a.name} — <strong>{a.progress}%</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>
                  Workers on Site {roomDetail.lastDprDate && `(${new Date(roomDetail.lastDprDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})})`}
                </div>
                {roomDetail.lastDayLabour.length===0 ? (
                  <div style={{fontSize:11,color:'#aaa'}}>No DPR labour entries recorded yet.</div>
                ) : (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {roomDetail.lastDayLabour.filter(l=>parseFloat(l.count||0)>0).map((l,i)=>(
                      <div key={i} style={{background:'#EBF5FB',border:'1px solid #AED6F1',borderRadius:6,padding:'6px 10px',fontSize:11}}>
                        {l.trade}: <strong>{l.count}</strong>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{fontSize:10,color:'#aaa',marginTop:10}}>
                  Worker counts are project-wide for that day (site labour isn't tracked per room) — shown here for context.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOQ TAB */}
      {tab==='BOQ' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
          <div style={{padding:'14px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>📐 Bill of Quantities</div>
            <button onClick={()=>nav(`/civil/boq?projectId=${id}`)}
              style={{padding:'6px 14px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
              Edit BOQ
            </button>
          </div>
          {boq.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
              No BOQ items yet.
              <div style={{marginTop:12}}>
                <button onClick={()=>nav(`/civil/boq?projectId=${id}`)}
                  style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700}}>
                  + Add BOQ Items
                </button>
              </div>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['#','Activity','Description','Unit','Qty','Rate','Amount','Done %','Done Amt'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boq.map((b,i)=>(
                  <tr key={b.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'9px 12px',color:'#888',fontSize:11}}>{b.slNo}</td>
                    <td style={{padding:'9px 12px',fontWeight:700,color:'#6E2C00'}}>{b.activity}</td>
                    <td style={{padding:'9px 12px'}}>{b.description}</td>
                    <td style={{padding:'9px 12px',color:'#555'}}>{b.unit}</td>
                    <td style={{padding:'9px 12px',textAlign:'right'}}>{Number(b.quantity).toLocaleString('en-IN')}</td>
                    <td style={{padding:'9px 12px',textAlign:'right'}}>{fmtC(b.rate)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700}}>{fmtC(b.amount)}</td>
                    <td style={{padding:'9px 12px',textAlign:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <div style={{flex:1,height:6,background:'#F0E8EC',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${b.donePct||0}%`,background:'#1E8449',borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:'#1E8449',minWidth:30}}>{Number(b.donePct||0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{padding:'9px 12px',textAlign:'right',color:'#1E8449',fontWeight:700}}>{fmtC(b.doneAmt)}</td>
                  </tr>
                ))}
                <tr style={{background:'#FDF2E9',fontWeight:700}}>
                  <td colSpan={6} style={{padding:'10px 12px',color:'#6E2C00',fontSize:13}}>TOTAL</td>
                  <td style={{padding:'10px 12px',textAlign:'right',color:'#6E2C00',fontSize:13}}>{fmtC(boqTotal)}</td>
                  <td style={{padding:'10px 12px',textAlign:'center',color:'#1E8449'}}>
                    {boqTotal>0?Math.round(boqDone/boqTotal*100):0}%
                  </td>
                  <td style={{padding:'10px 12px',textAlign:'right',color:'#1E8449',fontSize:13}}>{fmtC(boqDone)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* DPR LOG TAB */}
      {tab==='DPR Log' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
          <div style={{padding:'14px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>📅 Daily Progress Reports</div>
            <button onClick={()=>nav('/civil/dpr/new')}
              style={{padding:'6px 14px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
              + New DPR
            </button>
          </div>
          {dprs.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>
              No DPR entries yet.
              <div style={{marginTop:12}}>
                <button onClick={()=>nav('/civil/dpr/new')}
                  style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700}}>
                  + First DPR Entry
                </button>
              </div>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['DPR No','Date','Supervisor','Weather','Issues','Remarks'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dprs.map((d,i)=>(
                  <tr key={d.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{d.dprNo}</td>
                    <td style={{padding:'9px 12px'}}>{fmtD(d.date)}</td>
                    <td style={{padding:'9px 12px',fontWeight:600}}>{d.supervisor}</td>
                    <td style={{padding:'9px 12px',color:'#555'}}>{d.weather}</td>
                    <td style={{padding:'9px 12px',color:d.issues?'#C0392B':'#888',fontSize:12}}>{d.issues||'No issues'}</td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:12,maxWidth:200,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.remarks||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* LABOUR TAB */}
      {tab==='Labour' && (
        <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,color:'#6E2C00'}}>👷 Labour Register</div>
            <button onClick={()=>nav('/civil/labour')}
              style={{padding:'7px 14px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:12}}>
              Mark Attendance
            </button>
          </div>
          <div style={{textAlign:'center',padding:40,color:'#aaa'}}>
            <div style={{fontSize:36,marginBottom:12}}>👷</div>
            View labour attendance for this project in Labour Register
          </div>
        </div>
      )}

      {/* RA BILLS TAB */}
      {tab==='RA Bills' && (
        <div style={{background:'#fff',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.06)',overflow:'hidden'}}>
          <div style={{padding:'14px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>💰 Running Account Bills</div>
            <button onClick={()=>nav(`/civil/ra-bills?projectId=${id}`)}
              style={{padding:'6px 14px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
              + Generate RA Bill
            </button>
          </div>
          {raBills.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No RA bills raised yet.</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  {['RA Bill No','Date','Running Total','This Bill','Less Retention','Net Payable','Status'].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {raBills.map((r,i)=>{
                  const stCfg = {DRAFT:{bg:'#F5F5F5',color:'#666'},SUBMITTED:{bg:'#EBF5FB',color:'#1A5276'},
                    APPROVED:{bg:'#E8F5E9',color:'#1E8449'},PAID:{bg:'#F0EBF0',color:'#714B67'}}
                  const s = stCfg[r.status]||stCfg.DRAFT
                  return (
                    <tr key={r.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{r.raBillNo}</td>
                      <td style={{padding:'9px 12px'}}>{fmtD(r.billDate)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right'}}>{fmtC(r.runningTotal)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#D35400'}}>{fmtC(r.thisBillAmt)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',color:'#C0392B'}}>- {fmtC(r.lessRetention)}</td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>{fmtC(r.netPayable)}</td>
                      <td style={{padding:'9px 12px'}}>
                        <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:s.bg,color:s.color}}>{r.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CONTRACTORS TAB */}
      {tab==='Contractors' && (
        <div style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 18px',background:'#6E2C00',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>🤝 Contractor Work Orders</div>
            <button onClick={()=>nav('/civil/contractor-wo')}
              style={{padding:'5px 12px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
              + New WO
            </button>
          </div>
          {contractorWOs.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No work orders for this project yet</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#FDF2E9'}}>
                {['WO No','Contractor','Activity','Rate','Est Qty','Est Amt','Logs','Status'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {contractorWOs.map((w,i)=>{
                  const isPaid=w.status==='CLOSED'
                  return(
                    <tr key={w.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:10,color:'#6E2C00',fontWeight:700}}>{w.woNo}</td>
                      <td style={{padding:'8px 12px',fontWeight:700}}>{w.contractorName}</td>
                      <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{w.activity}</td>
                      <td style={{padding:'8px 12px'}}>₹{Number(w.rate||0).toLocaleString('en-IN')}/{w.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right'}}>{Number(w.estimatedQty||0).toFixed(2)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>₹{Number(Number(w.estimatedQty||0)*Number(w.rate||0)).toLocaleString('en-IN')}</td>
                      <td style={{padding:'8px 12px',textAlign:'center'}}>
                        <span style={{padding:'2px 8px',background:'#EBF5FB',color:'#1A5276',borderRadius:10,fontSize:10,fontWeight:700}}>
                          {w._count?.dailyLogs||0} logs
                        </span>
                      </td>
                      <td style={{padding:'8px 12px'}}>
                        <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                          background:isPaid?'#F0EBF0':'#E8F5E9',color:isPaid?'#714B67':'#1E8449'}}>
                          {w.status||'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{background:'#FDF2E9',fontWeight:700}}>
                  <td colSpan={5} style={{padding:'8px 12px',color:'#6E2C00'}}>TOTAL ESTIMATED</td>
                  <td style={{padding:'8px 12px',textAlign:'right',color:'#1E8449'}}>
                    ₹{contractorWOs.reduce((s,w)=>s+Number(w.estimatedQty||0)*Number(w.rate||0),0).toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* MATERIALS TAB */}
      {tab==='Materials' && (
        <div style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 18px',background:'#117A65',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>📦 Site Material Stock</div>
            <button onClick={()=>nav('/civil/indent')}
              style={{padding:'5px 12px',background:'rgba(255,255,255,.2)',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
              + Material Indent
            </button>
          </div>
          {materials.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No material stock data for this project</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#E8F5F0'}}>
                {['Material','Category','Unit','Received','Issued','Balance','Value'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#117A65'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {materials.map((m,i)=>{
                  const balance=Number(m.receivedQty||0)-Number(m.issuedQty||0)
                  const isLow=balance<Number(m.minStock||0)
                  return(
                    <tr key={m.id} style={{background:isLow?'#FFF5F5':i%2===0?'#fff':'#F8FFF8',borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'8px 12px',fontWeight:700}}>{m.matName||m.itemName}</td>
                      <td style={{padding:'8px 12px',color:'#555',fontSize:11}}>{m.category||'—'}</td>
                      <td style={{padding:'8px 12px'}}>{m.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',color:'#1E8449',fontWeight:600}}>{Number(m.receivedQty||0).toFixed(2)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',color:'#D35400',fontWeight:600}}>{Number(m.issuedQty||0).toFixed(2)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:isLow?'#C0392B':'#1E8449'}}>
                        {balance.toFixed(2)} {isLow&&'⚠️'}
                      </td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#6E2C00'}}>
                        ₹{Number(m.value||0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SPECS & VO TAB */}
      {tab==='Specs & VO' && (
        <div style={{display:'grid',gap:16}}>
          {/* Specifications */}
          <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📋 Customer Specifications</div>
            {specs.length===0 ? (
              <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:13}}>No specifications added yet</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    {['Category','Item','Specification','Brand','Grade','Test Required'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specs.map((s,i)=>(
                    <tr key={s.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'8px 12px',fontWeight:700,color:'#6E2C00'}}>{s.category}</td>
                      <td style={{padding:'8px 12px',fontWeight:600}}>{s.item}</td>
                      <td style={{padding:'8px 12px'}}>{s.specification}</td>
                      <td style={{padding:'8px 12px',color:'#555'}}>{s.brand||'—'}</td>
                      <td style={{padding:'8px 12px',color:'#555'}}>{s.grade||'—'}</td>
                      <td style={{padding:'8px 12px',textAlign:'center',color:s.testRequired?'#C0392B':'#888'}}>
                        {s.testRequired?'✅ Required':'—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Variation Orders */}
          <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:14}}>📝 Variation Orders</div>
            {vos.length===0 ? (
              <div style={{textAlign:'center',padding:20,color:'#aaa',fontSize:13}}>No variation orders yet</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'#FDF2E9'}}>
                    {['VO No','Type','Description','Amount','Status'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vos.map((v,i)=>{
                    const vsCfg={PENDING:{bg:'#FEF9E7',color:'#B8860B'},APPROVED:{bg:'#E8F5E9',color:'#1E8449'},
                      REJECTED:{bg:'#FDEDEC',color:'#C0392B'}}
                    const vs=vsCfg[v.status]||vsCfg.PENDING
                    return (
                      <tr key={v.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                        <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:11,color:'#6E2C00',fontWeight:700}}>{v.voNo}</td>
                        <td style={{padding:'8px 12px',fontSize:12,color:'#555'}}>{v.voType?.replace('_',' ')}</td>
                        <td style={{padding:'8px 12px',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.description}</td>
                        <td style={{padding:'8px 12px',fontWeight:700,color:Number(v.variationAmt)>=0?'#1E8449':'#C0392B'}}>
                          {Number(v.variationAmt)>=0?'+':''}{fmtC(v.variationAmt)}
                        </td>
                        <td style={{padding:'8px 12px'}}>
                          <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:vs.bg,color:vs.color}}>{v.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
