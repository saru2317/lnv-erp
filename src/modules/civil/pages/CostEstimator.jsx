import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtN = n => Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

const inp = { padding:'8px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:4,
  textTransform:'uppercase', letterSpacing:'0.5px' }

const STEPS = ['Client','Area','Specification','Site Conditions','Extras & Fees']

const AREA_TYPES = [
  { value:'BUILTUP',      label:'Built-up Area',  desc:'Carpet + Walls — most common' },
  { value:'CARPET',       label:'Carpet Area',    desc:'Actual usable area only' },
  { value:'SUPER_BUILTUP',label:'Super Built-up', desc:'Includes common areas' },
]

const FOUNDATION_TYPES = [
  { value:'NORMAL',   label:'Normal / Spread Footing', extra:0,  desc:'Regular soil — standard footing' },
  { value:'ISOLATED', label:'Isolated Footing',         extra:5,  desc:'Column loads on good soil' },
  { value:'RAFT',     label:'Raft Foundation',          extra:15, desc:'Soft/Black cotton soil' },
  { value:'PILE',     label:'Pile Foundation',          extra:30, desc:'Very weak soil / high loads' },
]

const SOIL_TYPES = [
  { value:'NORMAL',          label:'Normal / Red Soil',    extra:0  },
  { value:'BLACK_COTTON',    label:'Black Cotton Soil',    extra:10 },
  { value:'ROCKY',           label:'Rocky / Hard Rock',    extra:8  },
  { value:'HIGH_WATER_TABLE',label:'High Water Table',     extra:12 },
]

const LOCATIONS = [
  { value:'COIMBATORE', label:'Coimbatore',   extra:0   },
  { value:'CHENNAI',    label:'Chennai',      extra:15  },
  { value:'BANGALORE',  label:'Bangalore',    extra:20  },
  { value:'HYDERABAD',  label:'Hyderabad',    extra:18  },
  { value:'MUMBAI',     label:'Mumbai',       extra:35  },
  { value:'RURAL',      label:'Rural / Town', extra:-10 },
  { value:'HILL_AREA',  label:'Hill Area',    extra:25  },
]

const PROJECT_TYPES = ['Residential Villa','Apartment Building','Commercial Complex',
  'Industrial Building','Hospital','School / College','Shopping Mall','Warehouse','Mixed Use']

const MISC_ITEMS = [
  { key:'boundaryWall', label:'Boundary Wall',            extra:'boundaryWallRmt',  extraLabel:'Perimeter RMT (blank=auto)', ph:'e.g. 120' },
  { key:'waterSump',    label:'Underground Water Sump',    extra:'waterSumpLitres',  extraLabel:'Capacity (Litres)',          ph:'e.g. 10000' },
  { key:'septicTank',   label:'Septic Tank',               extra:null },
  { key:'borewell',     label:'Borewell (150ft)',           extra:null },
  { key:'parking',      label:'Car Parking',               extra:'parkingSqft',     extraLabel:'Parking Sq.Ft',             ph:'e.g. 500' },
  { key:'landscaping',  label:'Landscaping / Garden',      extra:'landscapingSqft', extraLabel:'Garden Sq.Ft',              ph:'e.g. 300' },
  { key:'generator',    label:'Generator Room (15KVA)',     extra:null },
  { key:'overheadTank', label:'Overhead Water Tank (1000L)',extra:null },
]

export default function CostEstimator() {
  const nav = useNavigate()
  const [step,      setStep]      = useState(0)
  const [specs,     setSpecs]     = useState([])
  const [estimates, setEstimates] = useState([])
  const [view,      setView]      = useState('new')
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [result,    setResult]    = useState(null)
  const [savedEstId,setSavedEstId]= useState(null)
  const [editingId, setEditingId] = useState(null) // null = creating new; set = editing this estimate

  const [form, setForm] = useState({
    clientName:'', clientPhone:'', clientEmail:'', projectLocation:'', projectType:'Residential Villa',
    builtupAreaSqft:'', areaType:'BUILTUP', floors:'1', basement:false,
    specId:'', customRate:'',
    foundationType:'NORMAL', soilType:'NORMAL', siteLevelExtra:'0', locationFactor:'COIMBATORE',
    boundaryWall:false, boundaryWallRmt:'', waterSump:false, waterSumpLitres:'',
    septicTank:false, borewell:false, parking:false, parkingSqft:'',
    landscaping:false, landscapingSqft:'', generator:false, overheadTank:false,
    architectFeesPct:'3', structuralFeesPct:'1', gstPct:'5', contingencyPct:'5', notes:'',
  })

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    fetch(`${BASE}/civil-ext/spec-master`,{headers:hdr2()}).then(r=>r.json()).then(d=>setSpecs(d.data||[])).catch(()=>{})
    fetch(`${BASE}/civil-ext/estimates`,  {headers:hdr2()}).then(r=>r.json()).then(d=>setEstimates(d.data||[])).catch(()=>{})
  },[])

  const selSpec = specs.find(s=>String(s.id)===String(form.specId))
  const selLoc  = LOCATIONS.find(l=>l.value===form.locationFactor)
  const selFnd  = FOUNDATION_TYPES.find(f=>f.value===form.foundationType)

  const canNext = () => {
    if (step===0) return form.clientName.trim()
    if (step===1) return form.builtupAreaSqft > 0
    if (step===2) return form.specId || form.customRate
    return true
  }

  const calculate = async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/estimates/calculate`,{method:'POST',headers:hdr(),body:JSON.stringify(form)})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      setResult(d.data); setView('result')
    } catch { toast.error('Calculation failed') }
    finally { setLoading(false) }
  }

  const loadForEdit = (e) => {
    if (e.projectId) return toast.error('This estimate has already been converted to a project and can\'t be edited.')
    setForm({
      clientName:e.clientName||'', clientPhone:e.clientPhone||'', clientEmail:e.clientEmail||'',
      projectLocation:e.projectLocation||'', projectType:e.projectType||'Residential Villa',
      builtupAreaSqft:String(e.builtupAreaSqft||''), areaType:e.areaType||'BUILTUP',
      floors:String(e.floors||'1'), basement:e.basement||false,
      specId:e.specId?String(e.specId):'', customRate:e.customRate?String(e.customRate):'',
      foundationType:e.foundationType||'NORMAL', soilType:e.soilType||'NORMAL',
      siteLevelExtra:String(e.siteLevelExtra||'0'), locationFactor:e.locationFactor||'COIMBATORE',
      boundaryWall:e.boundaryWall||false, boundaryWallRmt:'',
      waterSump:e.waterSump||false, waterSumpLitres:'',
      septicTank:e.septicTank||false, borewell:e.borewell||false,
      parking:e.parking||false, parkingSqft:'',
      landscaping:e.landscaping||false, landscapingSqft:'',
      generator:e.generator||false, overheadTank:e.overheadTank||false,
      architectFeesPct:String(e.architectFeesPct||'3'), structuralFeesPct:String(e.structuralFeesPct||'1'),
      gstPct:String(e.gstPct||'5'), contingencyPct:String(e.contingencyPct||'5'), notes:e.notes||'',
    })
    setEditingId(e.id)
    setSavedEstId(e.id)
    setResult(null)
    setStep(0)
    setView('new')
    toast(`Editing ${e.estimateNo} — recalculate and save to update`, {icon:'✏️'})
  }

  const cancelEdit = () => {
    setEditingId(null); setSavedEstId(null); setResult(null); setStep(0)
    setView('new')
    setForm({
      clientName:'', clientPhone:'', clientEmail:'', projectLocation:'', projectType:'Residential Villa',
      builtupAreaSqft:'', areaType:'BUILTUP', floors:'1', basement:false,
      specId:'', customRate:'',
      foundationType:'NORMAL', soilType:'NORMAL', siteLevelExtra:'0', locationFactor:'COIMBATORE',
      boundaryWall:false, boundaryWallRmt:'', waterSump:false, waterSumpLitres:'',
      septicTank:false, borewell:false, parking:false, parkingSqft:'',
      landscaping:false, landscapingSqft:'', generator:false, overheadTank:false,
      architectFeesPct:'3', structuralFeesPct:'1', gstPct:'5', contingencyPct:'5', notes:'',
    })
  }

  const deleteEstimate = async (e) => {
    if (e.projectId) return toast.error('Can\'t delete — already converted to a project.')
    if (!window.confirm(`Delete estimate ${e.estimateNo} for ${e.clientName}? This cannot be undone.`)) return
    try {
      const r = await fetch(`${BASE}/civil-ext/estimates/${e.id}`,{method:'DELETE',headers:hdr()})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message||'Deleted')
      setEstimates(prev=>prev.filter(x=>x.id!==e.id))
    } catch { toast.error('Delete failed') }
  }

  const saveEstimate = async () => {
    if (!form.clientName.trim()) return toast.error('Client name required')
    if (!result) return
    setSaving(true)
    try {
      const payload = { ...form, ...result, totalCost:result.grandTotal, grandTotal:result.grandTotal, baseCost:result.baseCost, extrasCost:result.extrasCost }
      const r = editingId
        ? await fetch(`${BASE}/civil-ext/estimates/${editingId}`,{method:'PATCH',headers:hdr(),body:JSON.stringify(payload)})
        : await fetch(`${BASE}/civil-ext/estimates`,{method:'POST',headers:hdr(),body:JSON.stringify(payload)})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingId ? `✅ ${d.data.estimateNo} updated!` : `✅ ${d.data.estimateNo} saved!`)
      setSavedEstId(d.data.id)
      setEstimates(prev => editingId ? prev.map(x=>x.id===d.data.id?d.data:x) : [d.data,...prev])
      if (editingId) setEditingId(null)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const handleDownloadWord = async () => {
    let estId = savedEstId
    if (!estId) { await saveEstimate(); return toast('Click Download Word again', {icon:'ℹ️'}) }
    try {
      const company = JSON.parse(localStorage.getItem('lnv_company')||'{}')
      const r = await fetch(`${BASE}/civil-ext/estimates/${estId}/download-word`,{
        headers:{...hdr2(),'x-company':JSON.stringify(company)}})
      if (!r.ok) return toast.error('Download failed')
      const blob = await r.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href=url
      a.download = `Estimate_${form.clientName||'Client'}.docx`
      a.click(); URL.revokeObjectURL(url)
      toast.success('✅ Downloaded!')
    } catch { toast.error('Download failed') }
  }

  const convertToProject = () => {
    localStorage.setItem('lnv_estimate_prefill', JSON.stringify({
      clientName:form.clientName, clientPhone:form.clientPhone,
      projectType:form.projectType, siteLocation:form.projectLocation,
      contractValue:result?.grandTotal,
      notes:`${selSpec?.specName||'Custom'} @ ${fmtC(result?.effectiveRate)}/sqft · ${form.builtupAreaSqft} sqft`
    }))
    nav('/civil/projects/new')
  }

  // ── STEP CONTENT ──
  const renderStep = () => {
    if (step===0) return (
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div style={{gridColumn:'1/-1'}}><label style={lbl}>Client / Owner Name *</label>
          <input defaultValue={form.clientName} onBlur={e=>set('clientName',e.target.value)}
            placeholder='e.g. Rajesh Builders Pvt Ltd' style={{...inp,fontSize:15}} /></div>
        <div><label style={lbl}>Phone</label>
          <input defaultValue={form.clientPhone} onBlur={e=>set('clientPhone',e.target.value)} placeholder='+91 99999 99999' style={inp} /></div>
        <div><label style={lbl}>Email</label>
          <input defaultValue={form.clientEmail} onBlur={e=>set('clientEmail',e.target.value)} placeholder='client@email.com' style={inp} /></div>
        <div><label style={lbl}>Project Location</label>
          <input defaultValue={form.projectLocation} onBlur={e=>set('projectLocation',e.target.value)} placeholder='e.g. Coimbatore' style={inp} /></div>
        <div><label style={lbl}>Project Type</label>
          <select value={form.projectType} onChange={e=>set('projectType',e.target.value)} style={inp}>
            {PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}
          </select></div>
      </div>
    )

    if (step===1) return (
      <div>
        <div style={{marginBottom:14}}>
          <label style={lbl}>Area Type *</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            {AREA_TYPES.map(a=>(
              <div key={a.value} onClick={()=>set('areaType',a.value)}
                style={{padding:'12px 14px',border:`2px solid ${form.areaType===a.value?'#6E2C00':'#ddd'}`,
                  borderRadius:8,cursor:'pointer',background:form.areaType===a.value?'#FDF2E9':'#fff'}}>
                <div style={{fontSize:13,fontWeight:700,color:form.areaType===a.value?'#6E2C00':'#555'}}>{a.label}</div>
                <div style={{fontSize:11,color:'#888',marginTop:3}}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <div><label style={lbl}>Area (Sq.Ft) *</label>
            <input type='number' defaultValue={form.builtupAreaSqft} onBlur={e=>set('builtupAreaSqft',e.target.value)}
              placeholder='e.g. 2500' style={{...inp,fontSize:18,fontWeight:700}} /></div>
          <div><label style={lbl}>Number of Floors</label>
            <select value={form.floors} onChange={e=>set('floors',e.target.value)} style={inp}>
              {['Ground Floor Only','G+1','G+2','G+3','G+4','G+5'].map((f,i)=>(
                <option key={i} value={i+1}>{f}</option>))}
            </select></div>
          <div style={{display:'flex',alignItems:'center',paddingTop:24}}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
              <input type='checkbox' checked={form.basement} onChange={e=>set('basement',e.target.checked)}
                style={{width:16,height:16,accentColor:'#6E2C00'}} />
              <span style={{fontWeight:600}}>Include Basement</span>
            </label>
          </div>
        </div>
      </div>
    )

    if (step===2) return (
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          {specs.map(spec=>(
            <div key={spec.id} onClick={()=>{set('specId',String(spec.id));set('customRate','')}}
              style={{padding:16,border:`2px solid ${String(form.specId)===String(spec.id)?spec.color:'#ddd'}`,
                borderRadius:10,cursor:'pointer',
                background:String(form.specId)===String(spec.id)?`${spec.color}11`:'#fff',
                boxShadow:String(form.specId)===String(spec.id)?`0 4px 12px ${spec.color}33`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div style={{fontSize:16,fontWeight:800,color:spec.color}}>{spec.specName}</div>
                <div style={{fontSize:18,fontWeight:700,color:spec.color}}>{fmtC(spec.ratePerSqft)}<span style={{fontSize:11,fontWeight:400}}>/sqft</span></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:11,color:'#777',marginBottom:8}}>
                <div>🧱 {spec.cementGrade}</div>
                <div>🔩 {spec.steelGrade}</div>
                <div>🏠 {spec.tilesSpec?.split(' ').slice(0,2).join(' ')}</div>
                <div>🎨 {spec.paintSpec?.split('(')[0]}</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                {[['Mat',spec.materialPct+'%','#6E2C00'],['Lab',spec.labourPct+'%','#1A5276'],['Ovh',spec.overheadPct+'%','#117A65']].map(([l,v,c])=>(
                  <span key={l} style={{padding:'2px 6px',background:`${c}22`,color:c,borderRadius:10,fontSize:10,fontWeight:700}}>{l}: {v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid #EEE',paddingTop:14}}>
          <label style={lbl}>Or Enter Custom Rate (₹/Sq.Ft)</label>
          <input type='number' defaultValue={form.customRate}
            onBlur={e=>{ set('customRate',e.target.value); if(e.target.value) set('specId','') }}
            placeholder='e.g. 2200' style={{...inp,width:180,fontSize:16,fontWeight:700}} />
        </div>
      </div>
    )

    if (step===3) return (
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div>
          <label style={lbl}>Foundation Type</label>
          <div style={{display:'grid',gap:8}}>
            {FOUNDATION_TYPES.map(f=>(
              <div key={f.value} onClick={()=>set('foundationType',f.value)}
                style={{padding:'10px 12px',border:`1.5px solid ${form.foundationType===f.value?'#6E2C00':'#ddd'}`,
                  borderRadius:7,cursor:'pointer',background:form.foundationType===f.value?'#FDF2E9':'#fff',
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:form.foundationType===f.value?'#6E2C00':'#555'}}>{f.label}</div>
                  <div style={{fontSize:11,color:'#888'}}>{f.desc}</div>
                </div>
                <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700,
                  background:f.extra>0?'#FDEDEC':'#E8F5E9',color:f.extra>0?'#C0392B':'#1E8449'}}>
                  {f.extra>0?`+${f.extra}%`:'Base'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label style={lbl}>Soil Type</label>
          <div style={{display:'grid',gap:8,marginBottom:14}}>
            {SOIL_TYPES.map(s=>(
              <div key={s.value} onClick={()=>set('soilType',s.value)}
                style={{padding:'10px 12px',border:`1.5px solid ${form.soilType===s.value?'#6E2C00':'#ddd'}`,
                  borderRadius:7,cursor:'pointer',background:form.soilType===s.value?'#FDF2E9':'#fff',
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:600,color:form.soilType===s.value?'#6E2C00':'#555'}}>{s.label}</div>
                <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700,
                  background:s.extra>0?'#FEF9E7':'#E8F5E9',color:s.extra>0?'#B8860B':'#1E8449'}}>
                  {s.extra>0?`+${s.extra}%`:'Normal'}
                </span>
              </div>
            ))}
          </div>
          <label style={lbl}>Location / City</label>
          <select value={form.locationFactor} onChange={e=>set('locationFactor',e.target.value)} style={inp}>
            {LOCATIONS.map(l=><option key={l.value} value={l.value}>
              {l.label} {l.extra>0?`(+${l.extra}%)`:l.extra<0?`(${l.extra}%)`:'(Base)'}
            </option>)}
          </select>
        </div>
      </div>
    )

    if (step===4) return (
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#117A65,#138D75)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700}}>
            🏗️ External / Misc Items
          </div>
          <div style={{padding:14,display:'grid',gap:10}}>
            {MISC_ITEMS.map(item=>(
              <div key={item.key} style={{borderBottom:'1px solid #F5F5F5',paddingBottom:8}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type='checkbox' checked={form[item.key]} onChange={e=>set(item.key,e.target.checked)}
                    style={{width:15,height:15,accentColor:'#117A65'}} />
                  <span style={{fontSize:13,fontWeight:600,color:form[item.key]?'#117A65':'#555'}}>{item.label}</span>
                </label>
                {form[item.key] && item.extra && (
                  <div style={{marginTop:6,paddingLeft:22}}>
                    <input type='number' defaultValue={form[item.extra]}
                      onBlur={e=>set(item.extra,e.target.value)}
                      placeholder={item.ph} style={{...inp,fontSize:12}} />
                    <div style={{fontSize:10,color:'#aaa',marginTop:2}}>{item.extraLabel}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden',marginBottom:12}}>
            <div style={{background:'linear-gradient(135deg,#1A5276,#21618C)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700}}>
              💼 Professional Fees
            </div>
            <div style={{padding:14,display:'grid',gap:12}}>
              <div><label style={lbl}>Architect Fees %</label>
                <input type='number' defaultValue={form.architectFeesPct} onBlur={e=>set('architectFeesPct',e.target.value)} placeholder='3' style={inp} />
                <div style={{fontSize:10,color:'#aaa',marginTop:2}}>Standard: 3-5% of construction cost</div>
              </div>
              <div><label style={lbl}>Structural Engineer Fees %</label>
                <input type='number' defaultValue={form.structuralFeesPct} onBlur={e=>set('structuralFeesPct',e.target.value)} placeholder='1' style={inp} />
                <div style={{fontSize:10,color:'#aaa',marginTop:2}}>Standard: 1-2% of construction cost</div>
              </div>
            </div>
          </div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden',marginBottom:12}}>
            <div style={{background:'linear-gradient(135deg,#B8860B,#D4AC0D)',color:'#fff',padding:'9px 16px',fontSize:12,fontWeight:700}}>
              ⚠️ Contingency & GST
            </div>
            <div style={{padding:14,display:'grid',gap:12}}>
              <div><label style={lbl}>Contingency %</label>
                <input type='number' defaultValue={form.contingencyPct} onBlur={e=>set('contingencyPct',e.target.value)} placeholder='5' style={inp} />
                <div style={{fontSize:10,color:'#aaa',marginTop:2}}>5-10% recommended for price escalation</div>
              </div>
              <div><label style={lbl}>GST % (if applicable)</label>
                <input type='number' defaultValue={form.gstPct} onBlur={e=>set('gstPct',e.target.value)} placeholder='5' style={inp} />
                <div style={{fontSize:10,color:'#aaa',marginTop:2}}>Under construction: 5% | Ready: 0%</div>
              </div>
            </div>
          </div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:14}}>
            <label style={lbl}>Notes / Special Requirements</label>
            <textarea defaultValue={form.notes} onBlur={e=>set('notes',e.target.value)}
              rows={3} placeholder='Any special notes...' style={{...inp,resize:'none'}} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'#F8F5F8',minHeight:'100vh',fontFamily:'DM Sans,sans-serif'}}>
      <style>{`@media print {
        body * { visibility:hidden; }
        #est-print, #est-print * { visibility:visible; }
        #est-print { position:fixed;left:0;top:0;width:100%;padding:20px; }
        .no-print { display:none !important; }
      }`}</style>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🧮 Construction Cost Estimator</div>
          <div style={{fontSize:11,color:'#aaa',paddingLeft:8,borderLeft:'1px solid #E8E0E8'}}>
            Complete estimation — Material + Labour + Extras
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {['new','list'].map(v=>(
            <button key={v} onClick={()=>{setView(v);if(v==='new'){setStep(0);setResult(null)}}}
              style={{padding:'6px 14px',background:view===v?'#6E2C00':'#fff',
                color:view===v?'#fff':'#555',border:'1px solid #ddd',borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:600}}>
              {v==='new'?'🧮 New Estimate':'📋 Saved Estimates'}
            </button>
          ))}
        </div>
      </div>

      {/* STEP WIZARD */}
      {view==='new' && (
        <div style={{maxWidth:900,margin:'0 auto'}}>
          {/* Step Bar */}
          <div style={{background:'#fff',borderRadius:10,padding:'12px 16px',marginBottom:14,
            border:'1px solid #E8E0E8',display:'flex',alignItems:'center'}}>
            {STEPS.map((s,i)=>(
              <React.Fragment key={s}>
                <div onClick={()=>i<step&&setStep(i)} style={{display:'flex',alignItems:'center',gap:8,cursor:i<step?'pointer':'default'}}>
                  <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',
                    justifyContent:'center',fontWeight:700,fontSize:12,
                    background:i<step?'#1E8449':i===step?'#6E2C00':'#F0F0F0',
                    color:i<=step?'#fff':'#999'}}>
                    {i<step?'✓':i+1}
                  </div>
                  <span style={{fontSize:12,fontWeight:i===step?700:400,color:i===step?'#6E2C00':i<step?'#1E8449':'#999'}}>{s}</span>
                </div>
                {i<STEPS.length-1 && <div style={{flex:1,height:2,margin:'0 8px',background:i<step?'#1E8449':'#F0F0F0'}}/>}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,padding:20,marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:800,color:'#6E2C00',marginBottom:16,
              paddingBottom:10,borderBottom:'2px solid #FDF2E9'}}>
              Step {step+1} of {STEPS.length}: {STEPS[step]}
            </div>
            {renderStep()}
          </div>

          {/* Nav */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
              style={{padding:'10px 20px',background:'#fff',border:'1px solid #ddd',borderRadius:6,
                cursor:step===0?'not-allowed':'pointer',fontWeight:600,color:step===0?'#ccc':'#555',opacity:step===0?0.5:1}}>
              ← Previous
            </button>
            <div style={{fontSize:12,color:'#888',textAlign:'center'}}>
              {form.clientName && <span style={{color:'#6E2C00',fontWeight:700}}>{form.clientName}</span>}
              {form.builtupAreaSqft && <span> · {Number(form.builtupAreaSqft).toLocaleString()} sqft</span>}
              {selSpec && <span> · {selSpec.specName}</span>}
            </div>
            {step<STEPS.length-1 ? (
              <button onClick={()=>{ if(!canNext()) return toast.error('Fill required fields'); setStep(s=>s+1) }}
                style={{padding:'10px 24px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>
                Next: {STEPS[step+1]} →
              </button>
            ) : (
              <button onClick={calculate} disabled={loading}
                style={{padding:'10px 28px',background:loading?'#aaa':'#1E8449',color:'#fff',
                  border:'none',borderRadius:6,cursor:'pointer',fontWeight:800,fontSize:14}}>
                {loading?'⏳ Calculating...':'🧮 Calculate Estimate'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULT */}
      {view==='result' && result && (
        <div id='est-print' style={{maxWidth:1000,margin:'0 auto'}}>

          {/* Grand Total Header */}
          <div style={{background:'linear-gradient(135deg,#4A1500,#6E2C00)',borderRadius:12,padding:24,marginBottom:14,color:'#fff'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16}}>
              <div style={{gridColumn:'1/3'}}>
                <div style={{fontSize:13,color:'#FDEBD0',marginBottom:4}}>GRAND TOTAL ESTIMATE</div>
                <div style={{fontSize:36,fontWeight:800}}>{fmtC(Number(result.grandTotal)||Number(result.baseCost)||(Number(result.materialCostTotal)+Number(result.labourCostTotal)+Number(result.overheadCost)))}</div>
                <div style={{fontSize:13,color:'#E8C9A0',marginTop:4}}>
                  {Number(form.builtupAreaSqft).toLocaleString()} Sq.Ft · {selSpec?.specName||'Custom'} · {result.estimatedMonths} months
                </div>
              </div>
              <div style={{textAlign:'center',background:'rgba(255,255,255,.1)',borderRadius:8,padding:14}}>
                <div style={{fontSize:11,color:'#FDEBD0'}}>Base Rate</div>
                <div style={{fontSize:16,fontWeight:700}}>{fmtC(result.baseRate)}/sqft</div>
                <div style={{fontSize:11,color:'#FDEBD0',marginTop:6}}>Effective Rate</div>
                <div style={{fontSize:18,fontWeight:700,color:'#FFD700'}}>{fmtC(result.effectiveRate)}/sqft</div>
              </div>
              <div style={{textAlign:'center',background:'rgba(255,255,255,.1)',borderRadius:8,padding:14}}>
                <div style={{fontSize:11,color:'#FDEBD0'}}>Construction</div>
                <div style={{fontSize:16,fontWeight:700}}>{fmtC(Number(result.baseCost||0))}</div>
                <div style={{fontSize:11,color:'#FDEBD0',marginTop:6}}>Extras & Fees</div>
                <div style={{fontSize:18,fontWeight:700,color:'#FFD700'}}>{fmtC(Number(result.extrasCost||0))}</div>
              </div>
            </div>
          </div>

          {/* Adjustments */}
          {(result.foundationExtra>0||result.soilExtra>0||result.locationExtra!==0) && (
            <div style={{background:'#FEF9E7',borderRadius:8,padding:'10px 16px',marginBottom:12,fontSize:12,color:'#B8860B',display:'flex',gap:16}}>
              <span style={{fontWeight:700}}>⚠️ Rate Adjustments:</span>
              {result.foundationExtra>0 && <span>Foundation +{result.foundationExtra}%</span>}
              {result.soilExtra>0 && <span>Soil +{result.soilExtra}%</span>}
              {result.locationExtra!==0 && <span>Location ({selLoc?.label}) {result.locationExtra>0?'+':''}{result.locationExtra}%</span>}
              <span style={{marginLeft:'auto'}}>Base {fmtC(Number(result.baseRate||0))} → Effective {fmtC(Number(result.effectiveRate||0))}/sqft</span>
            </div>
          )}

          {/* 3-way Split */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {(result.mainBreakdown||[]).map(b=>(
              <div key={b.label} style={{background:'#fff',border:`2px solid ${b.color}22`,borderRadius:10,padding:16,borderTop:`4px solid ${b.color}`}}>
                <div style={{fontSize:22,marginBottom:6}}>{b.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:b.color}}>{b.label}</div>
                <div style={{fontSize:22,fontWeight:800,color:b.color,margin:'4px 0'}}>{fmtC(Number(b.cost||0))}</div>
                <div style={{height:5,background:'#F0F0F0',borderRadius:3,overflow:'hidden',marginBottom:4}}>
                  <div style={{height:'100%',width:`${b.pct}%`,background:b.color,borderRadius:3}}/>
                </div>
                <div style={{fontSize:11,color:'#888'}}>{b.pct}% of construction cost</div>
              </div>
            ))}
          </div>

          {/* Material + Labour */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'#6E2C00',padding:'10px 16px',color:'#fff',fontSize:13,fontWeight:700}}>
                🧱 Material — {fmtC(Number(result.materialCostTotal||0))} ({result.materialPct}%)
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#FDF2E9'}}>
                  {['Material','Amount','Qty'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6E2C00'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {(result.materialBreakdown||[]).map((b,i)=>(
                    <tr key={b.label} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'8px 10px',fontWeight:600}}>{b.label}</td>
                      <td style={{padding:'8px 10px',fontWeight:700,color:b.color}}>{fmtC(Number(b.cost||0))}</td>
                      <td style={{padding:'8px 10px',color:'#888',fontSize:11}}>{b.qty}</td>
                    </tr>
                  ))}
                  <tr style={{background:'#6E2C00'}}><td style={{padding:'8px 10px',color:'#fff',fontWeight:700}}>Total</td><td style={{padding:'8px 10px',color:'#fff',fontWeight:800}}>{fmtC(Number(result.materialCostTotal||0))}</td><td/></tr>
                </tbody>
              </table>
            </div>
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'#1A5276',padding:'10px 16px',color:'#fff',fontSize:13,fontWeight:700}}>
                👷 Labour — {fmtC(Number(result.labourCostTotal||0))} ({result.labourPct}%)
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#EBF5FB'}}>
                  {['Trade','Amount','Man-Days'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'#1A5276'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {(result.labourBreakdown||[]).map((b,i)=>(
                    <tr key={b.label} style={{background:i%2===0?'#fff':'#EBF5FB',borderBottom:'1px solid #D6EAF8'}}>
                      <td style={{padding:'8px 10px',fontWeight:600}}>{b.label}</td>
                      <td style={{padding:'8px 10px',fontWeight:700,color:b.color}}>{fmtC(b.cost)}</td>
                      <td style={{padding:'8px 10px',color:'#888',fontSize:11}}>{b.days} days</td>
                    </tr>
                  ))}
                  <tr style={{background:'#1A5276'}}><td style={{padding:'8px 10px',color:'#fff',fontWeight:700}}>Total</td><td style={{padding:'8px 10px',color:'#fff',fontWeight:800}}>{fmtC(result.labourCostTotal)}</td><td style={{padding:'8px 10px',color:'#AED6F1',fontSize:11}}>{(result.labourBreakdown||[]).reduce((s,b)=>s+parseInt(b.days||0),0)} days</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Material Quantities */}
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden',marginBottom:14}}>
            <div style={{background:'#117A65',padding:'10px 16px',color:'#fff',fontSize:13,fontWeight:700}}>📦 Material Quantities</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
              {[['🏗️','Cement',`${fmtN(result.cementBags)} Bags`,'#6E2C00'],
                ['⛏️','Sand',`${fmtN(result.sandTon)} Ton`,'#B8860B'],
                ['🪨','Aggregate',`${fmtN(result.aggregateTon)} Ton`,'#117A65'],
                ['🔩','Steel',`${fmtN(result.steelKg)} Kg`,'#1A5276'],
                ['🖌️','Paint',`${fmtN(result.paintLitres)} Ltrs`,'#714B67'],
                ['🧱','Bricks',`${fmtN(result.bricksNos)} Nos`,'#D35400'],
                ['🏠','Flooring',`${fmtN(result.flooringSqft)} Sqft`,'#1E8449'],
                ['⏱️','Timeline',`${result.estimatedMonths} Months`,'#888']
              ].map(([icon,label,qty,color])=>(
                <div key={label} style={{padding:'12px 14px',borderRight:'1px solid #F0F0F0',borderBottom:'1px solid #F0F0F0',textAlign:'center'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                  <div style={{fontSize:11,color:'#888',marginBottom:4}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:700,color}}>{qty}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          {result.extrasCost>0 && (
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden',marginBottom:14}}>
              <div style={{background:'#2C3E50',padding:'10px 16px',color:'#fff',fontSize:13,fontWeight:700}}>📋 Extras & Fees</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <tbody>
                  {result.boundaryWallCost>0  && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Boundary Wall</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.boundaryWallCost)}</td></tr>}
                  {result.waterSumpCost>0     && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Water Sump</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.waterSumpCost)}</td></tr>}
                  {result.septicTankCost>0    && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Septic Tank</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.septicTankCost)}</td></tr>}
                  {result.borewellCost>0      && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Borewell</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.borewellCost)}</td></tr>}
                  {result.parkingCost>0       && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Car Parking</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.parkingCost)}</td></tr>}
                  {result.landscapingCost>0   && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Landscaping</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.landscapingCost)}</td></tr>}
                  {result.generatorCost>0     && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Generator Room</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.generatorCost)}</td></tr>}
                  {result.overheadTankCost>0  && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Overhead Tank</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#117A65'}}>{fmtC(result.overheadTankCost)}</td></tr>}
                  {result.architectFeesCost>0 && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Architect Fees ({result.architectFeesPct}%)</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#1A5276'}}>{fmtC(result.architectFeesCost)}</td></tr>}
                  {result.structuralFeesCost>0&& <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Structural Engineer Fees ({result.structuralFeesPct}%)</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#1A5276'}}>{fmtC(result.structuralFeesCost)}</td></tr>}
                  {result.contingencyCost>0   && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>Contingency ({result.contingencyPct}%)</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#B8860B'}}>{fmtC(result.contingencyCost)}</td></tr>}
                  {result.gstCost>0           && <tr style={{borderBottom:'1px solid #F0F0F0'}}><td style={{padding:'8px 16px'}}>GST ({result.gstPct}%)</td><td style={{padding:'8px 16px',textAlign:'right',fontWeight:700,color:'#C0392B'}}>{fmtC(result.gstCost)}</td></tr>}
                  <tr style={{background:'#2C3E50'}}><td style={{padding:'10px 16px',color:'#fff',fontWeight:700}}>Total Extras</td><td style={{padding:'10px 16px',textAlign:'right',color:'#fff',fontWeight:800,fontSize:14}}>{fmtC(result.extrasCost)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Grand Total */}
          <div style={{background:'linear-gradient(135deg,#1E8449,#27AE60)',borderRadius:10,padding:20,marginBottom:14,color:'#fff'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,textAlign:'center'}}>
              <div><div style={{fontSize:12,color:'#A9DFBF'}}>Construction</div><div style={{fontSize:20,fontWeight:700}}>{fmtC(Number(result.baseCost)||(Number(result.materialCostTotal)+Number(result.labourCostTotal)+Number(result.overheadCost)))}</div></div>
              <div style={{borderLeft:'1px solid rgba(255,255,255,.3)',borderRight:'1px solid rgba(255,255,255,.3)'}}>
                <div style={{fontSize:12,color:'#A9DFBF'}}>Extras & Fees</div><div style={{fontSize:20,fontWeight:700}}>+ {fmtC(Number(result.extrasCost||0))}</div>
              </div>
              <div><div style={{fontSize:12,color:'#A9DFBF'}}>GRAND TOTAL</div><div style={{fontSize:28,fontWeight:800}}>{fmtC(Number(result.grandTotal)||Number(result.baseCost)||(Number(result.materialCostTotal)+Number(result.labourCostTotal)+Number(result.overheadCost)))}</div></div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{background:'#F8F5F8',borderRadius:8,padding:12,marginBottom:14,fontSize:11,color:'#888',fontStyle:'italic'}}>
            ⚠️ This estimate is based on IS Code thumb rules. Actual cost varies based on drawings, soil test, market rates, site conditions and material quality. For planning purposes only.
          </div>

          {/* Actions */}
          <div className='no-print' style={{display:'flex',gap:10,justifyContent:'flex-end',marginBottom:20}}>
            <button onClick={cancelEdit} style={{padding:'9px 16px',background:'#fff',border:'1px solid #ddd',borderRadius:6,cursor:'pointer',fontWeight:600,color:'#555'}}>← New</button>
            <button onClick={saveEstimate} disabled={saving} style={{padding:'9px 16px',background:'#1A5276',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>{saving?'⏳...':'💾 Save'}</button>
            <button onClick={convertToProject} style={{padding:'9px 16px',background:'#1E8449',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>🏗️ Convert to Project</button>
            <button onClick={()=>window.print()} style={{padding:'9px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>🖨️ Print</button>
            <button onClick={handleDownloadWord} style={{padding:'9px 16px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>📄 Word</button>
          </div>
        </div>
      )}

      {/* LIST */}
      {view==='list' && (
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
          {estimates.length===0 ? (
            <div style={{padding:50,textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:12}}>🧮</div>
              <button onClick={cancelEdit} style={{padding:'9px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>Create First Estimate</button>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#6E2C00',color:'#fff'}}>
                {['Est. No','Client','Location','Area','Spec','Grand Total','Status','Date','Actions'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:600}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {estimates.map((e,i)=>{
                  const s={DRAFT:{bg:'#F5F5F5',color:'#666'},SENT:{bg:'#EBF5FB',color:'#1A5276'},APPROVED:{bg:'#E8F5E9',color:'#1E8449'}}[e.status]||{bg:'#F5F5F5',color:'#666'}
                  return (
                    <tr key={e.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:10,color:'#6E2C00',fontWeight:700}}>{e.estimateNo}</td>
                      <td style={{padding:'9px 12px',fontWeight:700}}>{e.clientName}</td>
                      <td style={{padding:'9px 12px',color:'#555',fontSize:11}}>{e.projectLocation||'—'}</td>
                      <td style={{padding:'9px 12px',fontWeight:700}}>{Number(e.builtupAreaSqft).toLocaleString()} sqft</td>
                      <td style={{padding:'9px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:`${e.spec?.color||'#6E2C00'}22`,color:e.spec?.color||'#6E2C00'}}>{e.spec?.specName||'Custom'}</span></td>
                      <td style={{padding:'9px 12px',fontWeight:700,color:'#1E8449',fontSize:13}}>{fmtC(e.grandTotal||e.totalCost)}</td>
                      <td style={{padding:'9px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:s.bg,color:s.color}}>{e.status}</span></td>
                      <td style={{padding:'9px 12px',fontSize:11,color:'#888'}}>{new Date(e.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                      <td style={{padding:'9px 12px'}}>
                        <div style={{display:'flex',gap:5}}>
                          {e.projectId ? (
                            <span title="Already converted to a project — figures are locked as that project's costing basis"
                              style={{padding:'3px 8px',background:'#EBF5FB',color:'#1A5276',borderRadius:4,fontSize:10,fontWeight:700}}>
                              🔒 In Project
                            </span>
                          ) : (
                            <>
                              <button onClick={()=>loadForEdit(e)}
                                style={{padding:'3px 8px',background:'#FEF9E7',color:'#B8860B',border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                                ✏️ Edit
                              </button>
                              <button onClick={()=>deleteEstimate(e)}
                                style={{padding:'3px 8px',background:'#FDEDEC',color:'#C0392B',border:'1px solid #F1948A',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                                🗑 Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
