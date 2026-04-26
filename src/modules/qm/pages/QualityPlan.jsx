import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

const USAGE_OPTS   = ['01 - General','02 - Goods Receipt','03 - Goods Issue','04 - Production','05 - Delivery','06 - Customer Return','07 - Subcontracting']
const STATUS_OPTS  = ['Active','Inactive','Released','Locked']
const PLANT_OPTS   = ['LNVM01 - Ranipet Plant','LNVM02 - Chennai Plant']
const INSP_TYPES   = ['01 - GR from Vendor','02 - GR from Production','03 - Goods Issue','04 - In-Process','05 - Final Inspection','06 - Customer Return','07 - Audit','08 - Repeat','89 - Manual']
const CTRL_KEYS    = ['QM01 - Inspection w/ Results','QM02 - Inspection w/o Results','QM03 - Visual Inspection','QM04 - Destructive Test','QM05 - Statistical']
const SAMPLE_PROCS = ['Manual 100%','AQL 0.65','AQL 1.0','AQL 1.5','AQL 2.5','AQL 4.0','Skip Lot L1','Skip Lot L2','Statistical (ANSI Z1.4)']
const CHAR_CATS    = ['Quantitative','Qualitative']
const UOM_OPTS     = ['mm','cm','m','kg','g','mg','%','Ne','CSP','IPI','U%','°C','°F','pH','cP','g/tex','g/m','km','ppm','NTU','lux','—']
const INSP_SCOPES  = ['100%','Sampling','Skip Lot','None']
const AQL_VALS     = ['0.065','0.1','0.15','0.25','0.4','0.65','1.0','1.5','2.5','4.0','6.5','10.0']
const AQL_TABLE    = [['2–8','2','0','1'],['9–15','3','0','1'],['16–25','5','0','1'],['26–50','8','0','1'],['51–90','13','1','2'],['91–150','20','1','2'],['151–280','32','2','3'],['281–500','50','3','4'],['501–1200','80','5','6'],['1201–3200','125','7','8']]

const EMPTY_CHAR = { charNo:'',shortText:'',category:'Quantitative',targetVal:'',lowerLimit:'',upperLimit:'',uom:'Ne',method:'',sampleProc:'AQL 1.5',sampleSize:'',resultReq:true,destruct:false,docReq:true,qualAccept:'',qualReject:'',controlKey:'QM01 - Inspection w/ Results' }
const EMPTY_OP   = { opNo:'',workCenter:'',controlKey:'QM01 - Inspection w/ Results',shortText:'',inspScope:'100%',chars:[] }
const EMPTY_PLAN = { planNo:'',revision:'00',plant:'LNVM01 - Ranipet Plant',material:'',materialDesc:'',usage:'02 - Goods Receipt',inspType:'01 - GR from Vendor',status:'Active',validFrom:'',validTo:'',lotSizeFrom:'1',lotSizeTo:'99999',inspInterval:'',inspIntervalUnit:'Days',aql:'1.5',sampleProc:'AQL 1.5',inspScope:'Sampling',description:'',longText:'',operations:[],plannerGroup:'QC',changeDoc:true,dynMod:false,dynModRule:'',skipLotAllowed:false }

const nextOpNo   = ops  => !ops.length ? '0010'  : String(Math.max(...ops.map(o=>parseInt(o.opNo)||0))+10).padStart(4,'0')
const nextCharNo = chars=> !chars.length? '0001' : String(Math.max(...chars.map(c=>parseInt(c.charNo)||0))+1).padStart(4,'0')

// ── Sub-components ─────────────────────────────────────────────────────────
const SectionTitle = ({children,style={}}) => (
  <div style={{fontSize:'11px',fontWeight:'800',color:'var(--odoo-purple)',letterSpacing:'0.5px',textTransform:'uppercase',borderBottom:'2px solid var(--odoo-purple)',paddingBottom:'4px',marginBottom:'10px',marginTop:'4px',...style}}>{children}</div>
)
const FieldRow = ({label,children}) => (
  <div style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'8px'}}>
    <div style={{width:'140px',flexShrink:0,fontSize:'11px',fontWeight:'700',color:'#6C757D',paddingTop:'6px',textAlign:'right'}}>{label}</div>
    <div style={{flex:1}}>{children}</div>
  </div>
)
const Modal = ({title,children,onClose,wide}) => (
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{background:'#fff',borderRadius:'10px',padding:'24px',width:wide?'800px':'480px',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.22)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <strong style={{color:'var(--odoo-purple)',fontSize:'14px'}}>{title}</strong>
        <button style={{background:'none',border:'none',fontSize:'18px',cursor:'pointer',color:'#666'}} onClick={onClose}>&#x2715;</button>
      </div>
      {children}
    </div>
  </div>
)
const Flag = ({color,bg,title,label}) => (
  <span title={title} style={{background:bg,color,padding:'1px 5px',borderRadius:'3px',fontSize:'10px',fontWeight:'800'}}>{label}</span>
)

// ── Seed data ──────────────────────────────────────────────────────────────
const SEED_PLANS = [
  { id:'QP-001',planNo:'QP-001',revision:'00',plant:'LNVM01 - Ranipet Plant',material:'Ring Yarn (30s / 40s)',materialDesc:'Combed Ring Spun Yarn',usage:'04 - Production',inspType:'05 - Final Inspection',status:'Active',validFrom:'2025-01-01',validTo:'2099-12-31',lotSizeFrom:'1',lotSizeTo:'99999',aql:'1.5',sampleProc:'AQL 1.5',inspScope:'Sampling',plannerGroup:'QC',changeDoc:true,dynMod:false,skipLotAllowed:false,description:'Final inspection plan for ring yarn',
    operations:[
      { opNo:'0010',workCenter:'QC-LAB',controlKey:'QM01 - Inspection w/ Results',shortText:'Physical Testing',inspScope:'100%',
        chars:[
          {charNo:'0001',shortText:'Count (Ne)',category:'Quantitative',targetVal:'30',lowerLimit:'29.5',upperLimit:'30.5',uom:'Ne',sampleProc:'AQL 1.5',sampleSize:'5 bobbins',method:'Wrapreel 120m',resultReq:true,docReq:true,destruct:false,qualAccept:'',qualReject:''},
          {charNo:'0002',shortText:'Tensile Strength (CSP)',category:'Quantitative',targetVal:'2200',lowerLimit:'2100',upperLimit:'',uom:'CSP',sampleProc:'AQL 1.5',sampleSize:'20 readings',method:'Lea Strength Tester',resultReq:true,docReq:true,destruct:true,qualAccept:'',qualReject:''},
          {charNo:'0003',shortText:'Unevenness U%',category:'Quantitative',targetVal:'',lowerLimit:'',upperLimit:'12',uom:'U%',sampleProc:'AQL 1.5',sampleSize:'400m/bobbin',method:'Uster Tester',resultReq:true,docReq:true,destruct:false,qualAccept:'',qualReject:''},
        ]},
      { opNo:'0020',workCenter:'QC-LINE',controlKey:'QM03 - Visual Inspection',shortText:'Visual & Appearance',inspScope:'Sampling',
        chars:[
          {charNo:'0001',shortText:'Surface Defects',category:'Qualitative',targetVal:'',lowerLimit:'',upperLimit:'',uom:'',sampleProc:'Manual 100%',sampleSize:'All bobbins',method:'Visual',resultReq:true,docReq:false,destruct:false,qualAccept:'PASS',qualReject:'FAIL'},
        ]},
    ]},
  { id:'QP-002',planNo:'QP-002',revision:'00',plant:'LNVM01 - Ranipet Plant',material:'Cotton Bale (Incoming)',materialDesc:'Raw Cotton',usage:'02 - Goods Receipt',inspType:'01 - GR from Vendor',status:'Active',validFrom:'2025-01-01',validTo:'2099-12-31',lotSizeFrom:'1',lotSizeTo:'500',aql:'2.5',sampleProc:'AQL 2.5',inspScope:'Sampling',plannerGroup:'QC',changeDoc:true,dynMod:false,skipLotAllowed:false,description:'Incoming QC for cotton bales',
    operations:[
      { opNo:'0010',workCenter:'QC-RM',controlKey:'QM01 - Inspection w/ Results',shortText:'Fibre Testing',inspScope:'Sampling',
        chars:[
          {charNo:'0001',shortText:'Fibre Length (mm)',category:'Quantitative',targetVal:'28',lowerLimit:'27',upperLimit:'',uom:'mm',sampleProc:'AQL 2.5',sampleSize:'3 bales',method:'HVI / AFIS',resultReq:true,docReq:true,destruct:false,qualAccept:'',qualReject:''},
          {charNo:'0002',shortText:'Micronaire Value',category:'Quantitative',targetVal:'4.2',lowerLimit:'3.8',upperLimit:'4.9',uom:'—',sampleProc:'AQL 2.5',sampleSize:'3 bales',method:'Micronaire Tester',resultReq:true,docReq:true,destruct:false,qualAccept:'',qualReject:''},
          {charNo:'0003',shortText:'Trash Content %',category:'Quantitative',targetVal:'',lowerLimit:'',upperLimit:'3',uom:'%',sampleProc:'AQL 2.5',sampleSize:'3 bales',method:'Trash Analyser',resultReq:true,docReq:true,destruct:false,qualAccept:'',qualReject:''},
        ]},
    ]},
]

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function QualityPlan() {
  const [view,       setView]      = useState('list')
  const [plans,      setPlans]     = useState([])
  const [loading,    setLoading]   = useState(true)
  const [form,       setForm]      = useState(EMPTY_PLAN)
  const [tab,        setTab]       = useState('general')
  const [selOpIdx,   setSelOp]     = useState(null)
  const [saving,     setSaving]    = useState(false)
  const [search,     setSearch]    = useState('')
  const [filter,     setFilter]    = useState('All')
  const [opModal,    setOpModal]   = useState(false)
  const [opForm,     setOpForm]    = useState(EMPTY_OP)
  const [editOpIdx,  setEditOpIdx] = useState(null)
  const [charModal,  setCharModal] = useState(false)
  const [charForm,   setCharForm]  = useState(EMPTY_CHAR)
  const [editCharIdx,setEditCharIdx]=useState(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/qm/quality-plan`,{headers:{Authorization:`Bearer ${getToken()}`}})
      const data = await res.json()
      setPlans(data.data?.length ? data.data : SEED_PLANS)
    } catch { setPlans(SEED_PLANS) }
    finally  { setLoading(false) }
  },[])
  useEffect(()=>{ loadPlans() },[loadPlans])

  const fSet = (k,v) => setForm(f=>({...f,[k]:v}))

  const openNew = () => {
    const nextNo = `QP-${String(plans.length+1).padStart(3,'0')}`
    setForm({...EMPTY_PLAN,planNo:nextNo,validFrom:new Date().toISOString().slice(0,10),validTo:'2099-12-31'})
    setTab('general'); setSelOp(null); setView('form')
  }
  const openEdit = p => { setForm({...EMPTY_PLAN,...p}); setTab('general'); setSelOp(null); setView('form') }

  // ── Operations ──
  const openAddOp  = () => { setOpForm({...EMPTY_OP,opNo:nextOpNo(form.operations)}); setEditOpIdx(null); setOpModal(true) }
  const openEditOp = idx=> { setOpForm({...form.operations[idx]}); setEditOpIdx(idx); setOpModal(true) }
  const deleteOp   = idx=> { fSet('operations',form.operations.filter((_,i)=>i!==idx)); if(selOpIdx===idx) setSelOp(null) }
  const saveOp = () => {
    if(!opForm.opNo||!opForm.workCenter) return toast.error('Op No & Work Center required')
    const ops=[...form.operations]
    if(editOpIdx!==null) ops[editOpIdx]={...ops[editOpIdx],...opForm}
    else ops.push({...opForm,chars:[]})
    fSet('operations',ops.sort((a,b)=>parseInt(a.opNo)-parseInt(b.opNo)))
    setOpModal(false); toast.success(editOpIdx!==null?'Operation updated':'Operation added')
  }

  // ── Characteristics ──
  const selectedOp  = selOpIdx!==null ? form.operations[selOpIdx] : null
  const openAddChar = () => {
    if(selOpIdx===null) return toast.error('Select an operation first')
    setCharForm({...EMPTY_CHAR,charNo:nextCharNo(selectedOp.chars||[])}); setEditCharIdx(null); setCharModal(true)
  }
  const openEditChar= cIdx => { setCharForm({...selectedOp.chars[cIdx]}); setEditCharIdx(cIdx); setCharModal(true) }
  const deleteChar  = cIdx => {
    const ops=[...form.operations]
    ops[selOpIdx].chars=ops[selOpIdx].chars.filter((_,i)=>i!==cIdx)
    fSet('operations',ops)
  }
  const saveChar = () => {
    if(!charForm.shortText) return toast.error('Characteristic description required')
    const ops=[...form.operations]
    const chars=[...(ops[selOpIdx].chars||[])]
    if(editCharIdx!==null) chars[editCharIdx]=charForm
    else chars.push(charForm)
    ops[selOpIdx]={...ops[selOpIdx],chars}
    fSet('operations',ops); setCharModal(false)
    toast.success(editCharIdx!==null?'Updated':'Characteristic added')
  }

  // ── Save plan ──
  const savePlan = async () => {
    if(!form.material) return toast.error('Material is required')
    setSaving(true)
    try {
      const method=form.id?'PUT':'POST'
      const url=form.id?`${BASE_URL}/qm/quality-plan/${form.id}`:`${BASE_URL}/qm/quality-plan`
      try {
        const res=await fetch(url,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${getToken()}`},body:JSON.stringify(form)})
        if(res.ok){ toast.success('Saved to DB'); loadPlans(); setView('list'); return }
      } catch {}
      if(form.id) setPlans(p=>p.map(x=>x.id===form.id?{...form}:x))
      else        setPlans(p=>[{...form,id:form.planNo},...p])
      toast.success('Quality Plan saved (local)'); setView('list')
    } finally { setSaving(false) }
  }

  const totalChars = form.operations.reduce((a,o)=>a+(o.chars?.length||0),0)
  const shown = plans.filter(p=>{
    const ms=filter==='All'||p.status===filter
    const mt=!search||p.planNo?.toLowerCase().includes(search.toLowerCase())||p.material?.toLowerCase().includes(search.toLowerCase())
    return ms&&mt
  })

  // ─────────────────── LIST VIEW ────────────────────────────────────────────
  if(view==='list') return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Quality Plans <small>QP01 / CA01 — Inspection Plans</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Plan No. / Material..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:220}}/>
          <button className="btn btn-p sd-bsm" onClick={openNew}>New Quality Plan</button>
        </div>
      </div>
      <div className="pp-chips">
        {['All',...STATUS_OPTS].map(s=>(
          <div key={s} className={`pp-chip${filter===s?' on':''}`} onClick={()=>setFilter(s)}>
            {s} <span>{s==='All'?plans.length:plans.filter(p=>p.status===s).length}</span>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr>
          <th>Plan No.</th><th>Rev</th><th>Material / Product</th><th>Plant</th>
          <th>Usage</th><th>Insp. Type</th><th>AQL</th><th>Ops</th><th>Chars</th>
          <th>Valid From</th><th>Valid To</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={13} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length===0
            ? <tr><td colSpan={13} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No plans found</td></tr>
            : shown.map(p=>(
            <tr key={p.id||p.planNo} style={{cursor:'pointer'}} onClick={()=>openEdit(p)}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{p.planNo}</strong></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',textAlign:'center'}}>{p.revision||'00'}</td>
              <td>
                <div style={{fontWeight:'700',fontSize:'12px'}}>{p.material}</div>
                <div style={{fontSize:'11px',color:'#6C757D'}}>{p.materialDesc}</div>
              </td>
              <td style={{fontSize:'11px'}}>{(p.plant||'').split(' - ')[0]}</td>
              <td style={{fontSize:'11px'}}>{(p.usage||'').split(' - ')[0]}</td>
              <td style={{fontSize:'11px'}}>{(p.inspType||'').split(' - ')[0]}</td>
              <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',fontWeight:'700',color:'var(--odoo-blue)'}}>{p.aql||'—'}</span></td>
              <td style={{textAlign:'center'}}>
                <span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>
                  {(p.operations||[]).length}
                </span>
              </td>
              <td style={{textAlign:'center'}}>
                <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>
                  {(p.operations||[]).reduce((a,o)=>a+(o.chars?.length||0),0)}
                </span>
              </td>
              <td style={{fontSize:'11px'}}>{p.validFrom}</td>
              <td style={{fontSize:'11px'}}>{p.validTo}</td>
              <td><span className={`badge ${p.status==='Active'||p.status==='Released'?'badge-pass':'badge-wip'}`}>{p.status}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <button className="btn-xs" onClick={()=>openEdit(p)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // ─────────────────── FORM VIEW ────────────────────────────────────────────
  const TABS = [
    {id:'general',    label:'General Data'},
    {id:'header',     label:'Header / Lot Size'},
    {id:'operations', label:`Operations (${form.operations.length})`},
    {id:'chars',      label:`Characteristics (${totalChars})`},
    {id:'sampling',   label:'Sampling / AQL'},
    {id:'admin',      label:'Administrative'},
  ]

  return (
    <div>
      {/* Form header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          {form.id?`Quality Plan: ${form.planNo}`:'New Quality Plan'}
          <small style={{marginLeft:8,color:'var(--odoo-gray)',fontSize:'12px'}}>
            {form.material||'— No material —'} | Rev {form.revision||'00'}
          </small>
        </div>
        <div className="fi-lv-actions">
          <span style={{fontSize:'11px',color:'#6C757D',marginRight:8}}>
            {form.operations.length} ops &middot; {totalChars} chars
          </span>
          <button className="btn btn-s sd-bsm" onClick={()=>setView('list')}>&#8592; Back</button>
          <button className="btn btn-p sd-bsm" onClick={savePlan} disabled={saving}>
            {saving?'Saving...':'Save Plan'}
          </button>
        </div>
      </div>

      {/* Status strip */}
      <div style={{background:'#FDF8FC',border:'1px solid var(--odoo-border)',borderRadius:'6px',padding:'8px 16px',marginBottom:'12px',display:'flex',gap:'24px',alignItems:'center',flexWrap:'wrap'}}>
        {[
          ['PLAN NO', <span style={{fontFamily:'DM Mono,monospace',fontSize:'13px',fontWeight:'700',color:'var(--odoo-purple)'}}>{form.planNo}</span>],
          ['REVISION', <span style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>Rev {form.revision||'00'}</span>],
          ['USAGE', <span style={{fontSize:'12px'}}>{form.usage}</span>],
          ['INSP TYPE', <span style={{fontSize:'12px'}}>{form.inspType}</span>],
          ['VALID', <span style={{fontSize:'12px'}}>{form.validFrom} &#8594; {form.validTo}</span>],
          ['AQL', <span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-blue)'}}>{form.aql}</span>],
        ].map(([l,v])=>(
          <div key={l} style={{display:'flex',gap:'6px',alignItems:'center'}}>
            <span style={{fontSize:'10px',fontWeight:'800',color:'#6C757D'}}>{l}:</span>
            {v}
          </div>
        ))}
        <div style={{marginLeft:'auto'}}>
          <select style={{border:'none',background:'transparent',fontSize:'12px',fontWeight:'700',color:'var(--odoo-purple)',cursor:'pointer'}} value={form.status} onChange={e=>fSet('status',e.target.value)}>
            {STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,borderBottom:'2px solid var(--odoo-border)',marginBottom:0}}>
        {TABS.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 16px',cursor:'pointer',fontSize:'12px',fontWeight:'700',
            color:tab===t.id?'var(--odoo-purple)':'#6C757D',
            borderBottom:tab===t.id?'3px solid var(--odoo-purple)':'3px solid transparent',
            marginBottom:'-2px',whiteSpace:'nowrap',
            background:tab===t.id?'#FDF8FC':'transparent',
          }}>{t.label}</div>
        ))}
      </div>

      <div style={{border:'1px solid var(--odoo-border)',borderTop:'none',borderRadius:'0 0 8px 8px',padding:'20px',background:'#fff',minHeight:400}}>

        {/* ── GENERAL DATA ── */}
        {tab==='general' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px'}}>
            <div>
              <SectionTitle>Plan Identification</SectionTitle>
              <FieldRow label="Plan Number"><input className="sd-inp" value={form.planNo} onChange={e=>fSet('planNo',e.target.value)}/></FieldRow>
              <FieldRow label="Revision"><input className="sd-inp" style={{width:80}} value={form.revision} onChange={e=>fSet('revision',e.target.value)} placeholder="00"/></FieldRow>
              <FieldRow label="Description"><input className="sd-inp" value={form.description} onChange={e=>fSet('description',e.target.value)} placeholder="Plan description"/></FieldRow>
              <SectionTitle style={{marginTop:16}}>Material</SectionTitle>
              <FieldRow label="Material *"><input className="sd-inp" value={form.material} onChange={e=>fSet('material',e.target.value)} placeholder="e.g. Ring Yarn (30s)"/></FieldRow>
              <FieldRow label="Material Desc."><input className="sd-inp" value={form.materialDesc} onChange={e=>fSet('materialDesc',e.target.value)} placeholder="Short description"/></FieldRow>
              <FieldRow label="Plant">
                <select className="sd-inp" value={form.plant} onChange={e=>fSet('plant',e.target.value)}>
                  {PLANT_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Planner Group"><input className="sd-inp" style={{width:120}} value={form.plannerGroup} onChange={e=>fSet('plannerGroup',e.target.value)} placeholder="QC"/></FieldRow>
            </div>
            <div>
              <SectionTitle>Inspection Assignment</SectionTitle>
              <FieldRow label="Usage">
                <select className="sd-inp" value={form.usage} onChange={e=>fSet('usage',e.target.value)}>
                  {USAGE_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Inspection Type">
                <select className="sd-inp" value={form.inspType} onChange={e=>fSet('inspType',e.target.value)}>
                  {INSP_TYPES.map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Status">
                <select className="sd-inp" value={form.status} onChange={e=>fSet('status',e.target.value)}>
                  {STATUS_OPTS.map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Valid From"><input className="sd-inp" type="date" value={form.validFrom} onChange={e=>fSet('validFrom',e.target.value)}/></FieldRow>
              <FieldRow label="Valid To"><input className="sd-inp" type="date" value={form.validTo} onChange={e=>fSet('validTo',e.target.value)}/></FieldRow>
              <SectionTitle style={{marginTop:16}}>Long Text</SectionTitle>
              <textarea className="sd-inp" rows={4} value={form.longText} onChange={e=>fSet('longText',e.target.value)} placeholder="Detailed inspection instructions, notes, references..." style={{width:'100%',resize:'vertical'}}/>
            </div>
          </div>
        )}

        {/* ── HEADER / LOT SIZE ── */}
        {tab==='header' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
            <div>
              <SectionTitle>Lot Size Range</SectionTitle>
              <FieldRow label="Lot Size From"><input className="sd-inp" style={{width:120}} value={form.lotSizeFrom} onChange={e=>fSet('lotSizeFrom',e.target.value)} placeholder="1"/></FieldRow>
              <FieldRow label="Lot Size To"><input className="sd-inp" style={{width:120}} value={form.lotSizeTo} onChange={e=>fSet('lotSizeTo',e.target.value)} placeholder="99999"/></FieldRow>
              <SectionTitle style={{marginTop:16}}>Inspection Interval</SectionTitle>
              <FieldRow label="Interval Value"><input className="sd-inp" style={{width:100}} value={form.inspInterval} onChange={e=>fSet('inspInterval',e.target.value)} placeholder="30"/></FieldRow>
              <FieldRow label="Interval Unit">
                <select className="sd-inp" style={{width:120}} value={form.inspIntervalUnit} onChange={e=>fSet('inspIntervalUnit',e.target.value)}>
                  {['Days','Weeks','Months','Batches','WOs'].map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
            </div>
            <div>
              <SectionTitle>Dynamic Modification</SectionTitle>
              <FieldRow label="Dynamic Mod.">
                <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:'13px'}}>
                  <input type="checkbox" checked={form.dynMod} onChange={e=>fSet('dynMod',e.target.checked)}/>
                  Enable Dynamic Modification
                </label>
              </FieldRow>
              {form.dynMod && <FieldRow label="Dyn. Mod. Rule"><input className="sd-inp" value={form.dynModRule} onChange={e=>fSet('dynModRule',e.target.value)} placeholder="e.g. DM-01"/></FieldRow>}
              <FieldRow label="Skip Lot">
                <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:'13px'}}>
                  <input type="checkbox" checked={form.skipLotAllowed} onChange={e=>fSet('skipLotAllowed',e.target.checked)}/>
                  Allow Skip Lots
                </label>
              </FieldRow>
              <SectionTitle style={{marginTop:16}}>Change Document</SectionTitle>
              <FieldRow label="Change Doc">
                <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:'13px'}}>
                  <input type="checkbox" checked={form.changeDoc} onChange={e=>fSet('changeDoc',e.target.checked)}/>
                  Record change documents
                </label>
              </FieldRow>
            </div>
          </div>
        )}

        {/* ── OPERATIONS ── */}
        {tab==='operations' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <strong style={{fontSize:'13px',color:'var(--odoo-purple)'}}>
                Inspection Operations
                <span style={{fontWeight:'400',fontSize:'12px',color:'#6C757D',marginLeft:8}}>
                  (click row &#8594; manage characteristics)
                </span>
              </strong>
              <button className="btn btn-p sd-bsm" onClick={openAddOp}>+ Add Operation</button>
            </div>
            <table className="fi-data-table">
              <thead><tr>
                <th style={{width:70}}>Op No.</th>
                <th>Work Center</th><th>Control Key</th><th>Short Text</th>
                <th>Insp. Scope</th><th style={{width:60}}>Chars</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {form.operations.length===0
                  ? <tr><td colSpan={7} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No operations yet — click Add Operation</td></tr>
                  : form.operations.map((op,idx)=>(
                  <tr key={idx} style={{cursor:'pointer',background:selOpIdx===idx?'#EDE0EA':'inherit'}}
                    onClick={()=>{setSelOp(idx);setTab('chars')}}>
                    <td><strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>{op.opNo}</strong></td>
                    <td style={{fontWeight:'600'}}>{op.workCenter}</td>
                    <td style={{fontSize:'11px'}}>{op.controlKey}</td>
                    <td>{op.shortText}</td>
                    <td><span style={{background:'#D4EDDA',color:'#155724',padding:'2px 7px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{op.inspScope}</span></td>
                    <td style={{textAlign:'center'}}>
                      <span style={{fontFamily:'DM Mono,monospace',fontSize:'13px',fontWeight:'700',color:'var(--odoo-blue)'}}>{op.chars?.length||0}</span>
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn-xs pri" onClick={()=>{setSelOp(idx);setTab('chars')}}>Chars</button>
                        <button className="btn-xs" onClick={()=>openEditOp(idx)}>Edit</button>
                        <button className="btn-xs" style={{color:'var(--odoo-red)'}} onClick={()=>deleteOp(idx)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CHARACTERISTICS ── */}
        {tab==='chars' && (
          <div>
            {/* Operation selector */}
            <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontSize:'12px',fontWeight:'700',color:'#6C757D',whiteSpace:'nowrap'}}>Operation:</span>
              {form.operations.length===0
                ? <span style={{fontSize:'12px',color:'#999'}}>No operations — add operations first (Operations tab)</span>
                : form.operations.map((op,idx)=>(
                  <div key={idx} onClick={()=>setSelOp(idx)}
                    style={{padding:'4px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'12px',fontWeight:'700',border:'1.5px solid',
                      borderColor:selOpIdx===idx?'var(--odoo-purple)':'var(--odoo-border)',
                      background:selOpIdx===idx?'var(--odoo-purple)':'#fff',
                      color:selOpIdx===idx?'#fff':'var(--odoo-purple)'}}>
                    {op.opNo} — {op.shortText||op.workCenter}
                    <span style={{marginLeft:6,background:selOpIdx===idx?'rgba(255,255,255,0.3)':'#EDE0EA',borderRadius:'10px',padding:'0 6px',fontSize:'10px'}}>{op.chars?.length||0}</span>
                  </div>
                ))
              }
              {selectedOp && (
                <button className="btn btn-p sd-bsm" style={{marginLeft:'auto'}} onClick={openAddChar}>
                  + Add Characteristic
                </button>
              )}
            </div>

            {!selectedOp
              ? <div style={{padding:60,textAlign:'center',color:'#999',fontSize:'13px'}}>
                  Select an operation above to view and manage its inspection characteristics
                </div>
              : (
              <>
                <div style={{background:'#FDF8FC',border:'1px solid var(--odoo-border)',borderRadius:6,padding:'8px 14px',marginBottom:10,fontSize:'12px',display:'flex',gap:16,flexWrap:'wrap'}}>
                  <span><strong style={{color:'var(--odoo-purple)'}}>Op {selectedOp.opNo}</strong></span>
                  <span>{selectedOp.workCenter}</span>
                  <span style={{color:'#6C757D'}}>{selectedOp.controlKey}</span>
                  <span>Scope: <strong>{selectedOp.inspScope}</strong></span>
                  <span style={{marginLeft:'auto',fontWeight:'700',color:'var(--odoo-blue)'}}>{selectedOp.chars?.length||0} characteristics</span>
                </div>
                <table className="fi-data-table">
                  <thead><tr>
                    <th style={{width:65}}>Char No.</th><th>Description</th><th>Category</th>
                    <th>Target</th><th>Lower</th><th>Upper</th><th>UoM</th>
                    <th>Sample Proc.</th><th>Method</th><th>Flags</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {(!selectedOp.chars||selectedOp.chars.length===0)
                      ? <tr><td colSpan={11} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No characteristics — click Add Characteristic</td></tr>
                      : selectedOp.chars.map((c,ci)=>(
                      <tr key={ci}>
                        <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)'}}>{c.charNo}</strong></td>
                        <td style={{fontWeight:'600',fontSize:'12px'}}>{c.shortText}</td>
                        <td>
                          <span style={{background:c.category==='Quantitative'?'#D4EDDA':'#FFF3CD',color:c.category==='Quantitative'?'#155724':'#856404',padding:'2px 7px',borderRadius:4,fontSize:'11px',fontWeight:'700'}}>{c.category}</span>
                        </td>
                        <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',textAlign:'center'}}>{c.targetVal||'—'}</td>
                        <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',textAlign:'center',color:'var(--odoo-red)'}}>{c.lowerLimit||'—'}</td>
                        <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',textAlign:'center',color:'var(--odoo-red)'}}>{c.upperLimit||'—'}</td>
                        <td style={{fontSize:'11px'}}>{c.uom||'—'}</td>
                        <td style={{fontSize:'11px'}}>{c.sampleProc}</td>
                        <td style={{fontSize:'11px',color:'#6C757D'}}>{c.method||'—'}</td>
                        <td>
                          <div style={{display:'flex',gap:3}}>
                            {c.resultReq && <Flag color='#714B67' bg='#EDE0EA' title='Result Required'   label='RR'/>}
                            {c.docReq    && <Flag color='#0056b3' bg='#CCE5FF' title='Doc Required'      label='DR'/>}
                            {c.destruct  && <Flag color='#721c24' bg='#F8D7DA' title='Destructive Test'  label='DT'/>}
                          </div>
                        </td>
                        <td>
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn-xs" onClick={()=>openEditChar(ci)}>Edit</button>
                            <button className="btn-xs" style={{color:'var(--odoo-red)'}} onClick={()=>deleteChar(ci)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── SAMPLING / AQL ── */}
        {tab==='sampling' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
            <div>
              <SectionTitle>AQL Configuration</SectionTitle>
              <FieldRow label="AQL Level">
                <select className="sd-inp" value={form.aql} onChange={e=>fSet('aql',e.target.value)}>
                  {AQL_VALS.map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Sample Procedure">
                <select className="sd-inp" value={form.sampleProc} onChange={e=>fSet('sampleProc',e.target.value)}>
                  {SAMPLE_PROCS.map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
              <FieldRow label="Inspection Scope">
                <select className="sd-inp" value={form.inspScope} onChange={e=>fSet('inspScope',e.target.value)}>
                  {INSP_SCOPES.map(o=><option key={o}>{o}</option>)}
                </select>
              </FieldRow>
              <SectionTitle style={{marginTop:16}}>Sampling Standard</SectionTitle>
              {[['Standard','ANSI/ASQ Z1.4 / IS 2500-1'],['Inspection Level','II (Normal)'],['Switching Rules','Normal → Tightened → Reduced'],['Acceptance','Based on AQL table c=0']].map(([l,v])=>(
                <FieldRow key={l} label={l}><span style={{fontSize:'12px'}}>{v}</span></FieldRow>
              ))}
            </div>
            <div>
              <SectionTitle>AQL Sampling Table (Level II, Single)</SectionTitle>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px',marginTop:4}}>
                <thead>
                  <tr style={{background:'var(--odoo-purple)',color:'#fff'}}>
                    <th style={{padding:'5px 8px',textAlign:'left'}}>Lot Size</th>
                    <th style={{padding:'5px 8px',textAlign:'center'}}>Sample n</th>
                    <th style={{padding:'5px 8px',textAlign:'center'}}>Ac (Accept)</th>
                    <th style={{padding:'5px 8px',textAlign:'center'}}>Re (Reject)</th>
                  </tr>
                </thead>
                <tbody>
                  {AQL_TABLE.map(([ls,n,ac,re])=>(
                    <tr key={ls} style={{borderBottom:'1px solid var(--odoo-border)'}}>
                      <td style={{padding:'4px 8px'}}>{ls}</td>
                      <td style={{padding:'4px 8px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:'700'}}>{n}</td>
                      <td style={{padding:'4px 8px',textAlign:'center',color:'var(--odoo-green)',fontWeight:'700'}}>{ac}</td>
                      <td style={{padding:'4px 8px',textAlign:'center',color:'var(--odoo-red)',fontWeight:'700'}}>{re}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ADMINISTRATIVE ── */}
        {tab==='admin' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
            <div>
              <SectionTitle>Administrative Data</SectionTitle>
              <FieldRow label="Created By"><span style={{fontSize:'12px'}}>ADMIN</span></FieldRow>
              <FieldRow label="Created On"><span style={{fontSize:'12px'}}>{form.validFrom||'—'}</span></FieldRow>
              <FieldRow label="Changed By"><span style={{fontSize:'12px'}}>ADMIN</span></FieldRow>
              <FieldRow label="Changed On"><span style={{fontSize:'12px'}}>{new Date().toLocaleDateString('en-IN')}</span></FieldRow>
              <FieldRow label="Change Doc"><span style={{fontSize:'12px'}}>{form.changeDoc?'Yes':'No'}</span></FieldRow>
            </div>
            <div>
              <SectionTitle>Plan Summary</SectionTitle>
              {[
                ['Plan No.',    form.planNo],
                ['Revision',    form.revision||'00'],
                ['Material',    form.material||'—'],
                ['Plant',       form.plant],
                ['Usage',       form.usage],
                ['Insp. Type',  form.inspType],
                ['AQL',         form.aql],
                ['Sample Proc.',form.sampleProc],
                ['Operations',  form.operations.length],
                ['Total Chars', totalChars],
                ['Lot Range',   `${form.lotSizeFrom} – ${form.lotSizeTo}`],
                ['Valid',       `${form.validFrom} → ${form.validTo}`],
                ['Status',      form.status],
              ].map(([l,v])=>(
                <FieldRow key={l} label={l}><span style={{fontSize:'12px',fontWeight:'600'}}>{String(v)}</span></FieldRow>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── OPERATION MODAL ── */}
      {opModal && (
        <Modal title={editOpIdx!==null?'Edit Operation':'Add Operation'} onClose={()=>setOpModal(false)}>
          <FieldRow label="Op No. *">
            <input className="sd-inp" style={{width:100}} value={opForm.opNo}
              onChange={e=>setOpForm(f=>({...f,opNo:e.target.value}))} placeholder="0010"/>
          </FieldRow>
          <FieldRow label="Work Center *">
            <input className="sd-inp" value={opForm.workCenter}
              onChange={e=>setOpForm(f=>({...f,workCenter:e.target.value}))} placeholder="QC-LAB, QC-LINE1"/>
          </FieldRow>
          <FieldRow label="Control Key">
            <select className="sd-inp" value={opForm.controlKey}
              onChange={e=>setOpForm(f=>({...f,controlKey:e.target.value}))}>
              {CTRL_KEYS.map(o=><option key={o}>{o}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Short Text">
            <input className="sd-inp" value={opForm.shortText}
              onChange={e=>setOpForm(f=>({...f,shortText:e.target.value}))} placeholder="e.g. Physical Inspection"/>
          </FieldRow>
          <FieldRow label="Insp. Scope">
            <select className="sd-inp" value={opForm.inspScope}
              onChange={e=>setOpForm(f=>({...f,inspScope:e.target.value}))}>
              {INSP_SCOPES.map(o=><option key={o}>{o}</option>)}
            </select>
          </FieldRow>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16,borderTop:'1px solid var(--odoo-border)',paddingTop:12}}>
            <button className="btn btn-s sd-bsm" onClick={()=>setOpModal(false)}>Cancel</button>
            <button className="btn btn-p sd-bsm" onClick={saveOp}>{editOpIdx!==null?'Update Operation':'Add Operation'}</button>
          </div>
        </Modal>
      )}

      {/* ── CHARACTERISTIC MODAL ── */}
      {charModal && (
        <Modal title={editCharIdx!==null?'Edit Characteristic':'Add Inspection Characteristic'} onClose={()=>setCharModal(false)} wide>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <FieldRow label="Char No.">
              <input className="sd-inp" style={{width:90}} value={charForm.charNo}
                onChange={e=>setCharForm(f=>({...f,charNo:e.target.value}))}/>
            </FieldRow>
            <FieldRow label="Category">
              <select className="sd-inp" value={charForm.category}
                onChange={e=>setCharForm(f=>({...f,category:e.target.value}))}>
                {CHAR_CATS.map(o=><option key={o}>{o}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Control Key">
              <select className="sd-inp" value={charForm.controlKey}
                onChange={e=>setCharForm(f=>({...f,controlKey:e.target.value}))}>
                {CTRL_KEYS.map(o=><option key={o}>{o}</option>)}
              </select>
            </FieldRow>
          </div>

          <FieldRow label="Short Text *">
            <input className="sd-inp" value={charForm.shortText}
              onChange={e=>setCharForm(f=>({...f,shortText:e.target.value}))} placeholder="e.g. Count (Ne), Tensile Strength, Surface Defects"/>
          </FieldRow>

          {charForm.category==='Quantitative' ? (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginTop:4}}>
                <FieldRow label="Target Value">
                  <input className="sd-inp" value={charForm.targetVal}
                    onChange={e=>setCharForm(f=>({...f,targetVal:e.target.value}))} placeholder="30"/>
                </FieldRow>
                <FieldRow label="Lower Limit">
                  <input className="sd-inp" value={charForm.lowerLimit}
                    onChange={e=>setCharForm(f=>({...f,lowerLimit:e.target.value}))} placeholder="29.5"/>
                </FieldRow>
                <FieldRow label="Upper Limit">
                  <input className="sd-inp" value={charForm.upperLimit}
                    onChange={e=>setCharForm(f=>({...f,upperLimit:e.target.value}))} placeholder="30.5"/>
                </FieldRow>
                <FieldRow label="UoM">
                  <select className="sd-inp" value={charForm.uom}
                    onChange={e=>setCharForm(f=>({...f,uom:e.target.value}))}>
                    {UOM_OPTS.map(o=><option key={o}>{o}</option>)}
                  </select>
                </FieldRow>
              </div>
            </>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
              <FieldRow label="Accept Code">
                <input className="sd-inp" value={charForm.qualAccept}
                  onChange={e=>setCharForm(f=>({...f,qualAccept:e.target.value}))} placeholder="PASS / OK / ACCEPT"/>
              </FieldRow>
              <FieldRow label="Reject Code">
                <input className="sd-inp" value={charForm.qualReject}
                  onChange={e=>setCharForm(f=>({...f,qualReject:e.target.value}))} placeholder="FAIL / NG / REJECT"/>
              </FieldRow>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:4}}>
            <FieldRow label="Sample Procedure">
              <select className="sd-inp" value={charForm.sampleProc}
                onChange={e=>setCharForm(f=>({...f,sampleProc:e.target.value}))}>
                {SAMPLE_PROCS.map(o=><option key={o}>{o}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Sample Size">
              <input className="sd-inp" value={charForm.sampleSize}
                onChange={e=>setCharForm(f=>({...f,sampleSize:e.target.value}))} placeholder="5 pcs / 3 bobbins"/>
            </FieldRow>
            <FieldRow label="Insp. Method">
              <input className="sd-inp" value={charForm.method}
                onChange={e=>setCharForm(f=>({...f,method:e.target.value}))} placeholder="Wrapreel, Tensometer, Visual..."/>
            </FieldRow>
          </div>

          {/* Flags */}
          <div style={{display:'flex',gap:28,marginTop:14,padding:'10px 0',borderTop:'1px solid var(--odoo-border)'}}>
            {[['resultReq','Result Required'],['docReq','Documentation Req.'],['destruct','Destructive Test']].map(([k,lbl])=>(
              <label key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:'13px',cursor:'pointer'}}>
                <input type="checkbox" checked={!!charForm[k]}
                  onChange={e=>setCharForm(f=>({...f,[k]:e.target.checked}))}/>
                {lbl}
              </label>
            ))}
          </div>

          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:10}}>
            <button className="btn btn-s sd-bsm" onClick={()=>setCharModal(false)}>Cancel</button>
            <button className="btn btn-p sd-bsm" onClick={saveChar}>{editCharIdx!==null?'Update Characteristic':'Add Characteristic'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
