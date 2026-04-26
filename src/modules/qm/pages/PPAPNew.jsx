import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

// ── PPAP 18 Elements definition ───────────────────────────────────
const ELEMENTS = [
  { no:1,  key:'e1',  label:'Design Records',                    desc:'Drawings, specifications, tolerances',      required:[2,3,4,5], section:'Design' },
  { no:2,  key:'e2',  label:'Engineering Change Documents',       desc:'ECNs, change notices if applicable',        required:[3,4,5],   section:'Design' },
  { no:3,  key:'e3',  label:'Customer Engineering Approval',      desc:'Customer sign-off on design',               required:[3,4,5],   section:'Design' },
  { no:4,  key:'e4',  label:'Design FMEA (DFMEA)',               desc:'Design failure mode & effects analysis',     required:[3,4,5],   section:'FMEA' },
  { no:5,  key:'e5',  label:'Process Flow Diagram',               desc:'Step-by-step manufacturing process flow',   required:[2,3,4,5], section:'Process' },
  { no:6,  key:'e6',  label:'Process FMEA (PFMEA)',              desc:'Process failure mode & effects analysis',    required:[2,3,4,5], section:'FMEA' },
  { no:7,  key:'e7',  label:'Control Plan',                       desc:'Quality controls at each process step',     required:[2,3,4,5], section:'Process' },
  { no:8,  key:'e8',  label:'Measurement System Analysis (MSA)', desc:'Gauge R&R, bias, linearity study',          required:[3,4,5],   section:'Measurement' },
  { no:9,  key:'e9',  label:'Dimensional Results',               desc:'Actual measurements vs drawing tolerances', required:[2,3,4,5], section:'Measurement' },
  { no:10, key:'e10', label:'Material / Performance Test Results',desc:'Lab test reports, certificates',            required:[2,3,4,5], section:'Testing' },
  { no:11, key:'e11', label:'Initial Process Study (Cpk/Ppk)',   desc:'Statistical process capability analysis',   required:[3,4,5],   section:'Statistical' },
  { no:12, key:'e12', label:'Qualified Laboratory Documentation', desc:'Lab accreditation, certifications',        required:[3,4,5],   section:'Testing' },
  { no:13, key:'e13', label:'Appearance Approval Report (AAR)',  desc:'Color, texture, gloss, fit/finish check',   required:[3,4,5],   section:'Appearance' },
  { no:14, key:'e14', label:'Sample Production Parts',           desc:'Number of sample parts submitted',          required:[2,3,4,5], section:'Samples' },
  { no:15, key:'e15', label:'Master Sample',                     desc:'Reference sample retained at supplier',     required:[3,4,5],   section:'Samples' },
  { no:16, key:'e16', label:'Checking Aids',                     desc:'Gauges, fixtures, templates used',          required:[3,4,5],   section:'Samples' },
  { no:17, key:'e17', label:'Customer-Specific Requirements',    desc:'Any unique customer quality requirements',   required:[2,3,4,5], section:'Customer' },
  { no:18, key:'e18', label:'Part Submission Warrant (PSW)',     desc:'Final sign-off document — PPAP complete',   required:[1,2,3,4,5], section:'PSW', isPSW:true },
]

const SECTIONS = ['Design','FMEA','Process','Measurement','Testing','Statistical','Appearance','Samples','Customer','PSW']
const LEVELS   = ['Level 1','Level 2','Level 3','Level 4','Level 5']
const DISP     = ['Approved','Approved with Deviation','Rejected — Resubmit','Interim Approval']

const ELEM_STATUS = { 'Not Started':'#E0D5E0:#6C757D', 'In Progress':'#FFF3CD:#856404', 'Submitted':'#D1ECF1:#0C5460', 'Approved':'#D4EDDA:#155724', 'Not Required':'#F8F9FA:#999' }

const inp  = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl  = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

// ── Initial element state ─────────────────────────────────────────
const initElements = () => {
  const obj = {}
  ELEMENTS.forEach(e => {
    obj[e.key] = { status:'Not Started', docRef:'', docDate:'', remarks:'', cpk:'', ppk:'', sampleQty:'' }
  })
  return obj
}

const INIT = {
  ppapNo:'', revision:'A', level:'Level 3',
  partName:'', partNo:'', partDesc:'', drawingNo:'', drawingRev:'',
  customer:'', customerContact:'', customerPartNo:'',
  plant:'LNVM01 - Ranipet', submittedBy: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name||'Admin',
  submissionDate: new Date().toISOString().split('T')[0],
  annualVolume:'', lotSize:'', sampleQty:'',
  changeReason:'New Part', toolingNew:true, toolingChange:false,
  weightKg:'', material:'', color:'', surface:'',
  // PSW fields
  psw_partWeight:'', psw_moldCavities:'', psw_toolingNo:'',
  psw_declaration:false, psw_supplierSign:'', psw_signDate:'',
  psw_customerDisp:'', psw_customerSign:'', psw_customerDate:'',
  psw_remarks:'',
  status:'In Progress',
  elements: initElements(),
}

export default function PPAPNew() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form,    setForm]    = useState(INIT)
  const [ppapNo,  setPpapNo]  = useState('Auto-generated')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab,     setTab]     = useState('header')    // 'header' | section name | 'psw'
  const [customers,setCustomers]= useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rN, rC] = await Promise.all([
        fetch(`${BASE_URL}/qm/ppap/next-no`, { headers:hdr2() }),
        fetch(`${BASE_URL}/mdm/customer`,     { headers:hdr2() }),
      ])
      const [dN, dC] = await Promise.all([rN.json(), rC.json()])
      setPpapNo(dN.ppapNo || 'PPAP-AUTO')
      setCustomers(dC.data || [])
      if (id) {
        const rE = await fetch(`${BASE_URL}/qm/ppap/${id}`, { headers:hdr2() })
        const dE = await rE.json()
        if (dE.data) { setForm({...INIT,...dE.data,elements:{...initElements(),...dE.data.elements}}); setPpapNo(dE.data.ppapNo) }
      }
    } catch {}
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { load() }, [load])

  const fSet = k => e => setForm(f=>({...f,[k]:typeof e==='object'?e.target.value:e}))
  const fBool= k => e => setForm(f=>({...f,[k]:e.target.checked}))
  const eSet = (key, field, val) => setForm(f=>({...f,elements:{...f.elements,[key]:{...f.elements[key],[field]:val}}}))

  // Determine required elements for selected level
  const levelNum = parseInt(form.level?.split(' ')[1]) || 3
  const requiredKeys = new Set(ELEMENTS.filter(e=>e.required.includes(levelNum)).map(e=>e.key))

  // Completion stats
  const stats = useMemo(() => {
    const required = ELEMENTS.filter(e => requiredKeys.has(e.key) && !e.isPSW)
    const done     = required.filter(e => ['Submitted','Approved'].includes(form.elements[e.key]?.status))
    const pct      = required.length ? Math.round((done.length / required.length) * 100) : 0
    return { total:required.length, done:done.length, pct }
  }, [form.elements, form.level])

  // Section completion
  const sectionStats = useMemo(() => {
    const ss = {}
    SECTIONS.forEach(sec => {
      const elems = ELEMENTS.filter(e=>e.section===sec && requiredKeys.has(e.key) && !e.isPSW)
      const done  = elems.filter(e=>['Submitted','Approved'].includes(form.elements[e.key]?.status))
      ss[sec] = { total:elems.length, done:done.length, pct: elems.length ? Math.round(done.length/elems.length*100) : 100 }
    })
    return ss
  }, [form.elements, form.level])

  const save = async () => {
    if (!form.partName) return toast.error('Part Name is required')
    if (!form.customer) return toast.error('Customer is required')
    setSaving(true)
    try {
      const url    = id ? `${BASE_URL}/qm/ppap/${id}` : `${BASE_URL}/qm/ppap`
      const method = id ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers:hdr(), body:JSON.stringify({...form,ppapNo,completionPct:stats.pct}) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error||'Save failed')
      toast.success(id?'PPAP updated':`${data.data?.ppapNo||ppapNo} created!`)
      nav('/qm/ppap')
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const F = ({label,k,rows,ph,type='text',readOnly}) => (
    <div>
      <label style={lbl}>{label}</label>
      {rows ? <textarea style={{...inp,resize:'vertical'}} rows={rows} value={form[k]||''} onChange={fSet(k)} placeholder={ph}/>
            : <input type={type} style={{...inp,background:readOnly?'#F8F9FA':'#fff'}} value={form[k]||''} onChange={fSet(k)} placeholder={ph} readOnly={readOnly}/>}
    </div>
  )

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>

  // Tab navigation including sections
  const allTabs = ['header', ...SECTIONS.filter(s=>s!=='PSW'), 'psw']
  const tabLabels = { header:'Header', Design:'Design Docs', FMEA:'FMEA', Process:'Process', Measurement:'Measurement', Testing:'Testing', Statistical:'Cpk/SPC', Appearance:'Appearance', Samples:'Samples', Customer:'Customer Req.', psw:'PSW Sign-off' }

  return (
    <div>
      {/* Main header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          PPAP — {form.partName||'New Part'}
          <small style={{fontFamily:'DM Mono,monospace',color:'#714B67',marginLeft:8}}>{ppapNo}</small>
          <small>{form.level}</small>
        </div>
        <div className="fi-lv-actions">
          <div style={{display:'flex',alignItems:'center',gap:8,marginRight:8}}>
            <div style={{width:120,height:8,background:'#E0D5E0',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${stats.pct}%`,background:stats.pct===100?'#28A745':stats.pct>=50?'#FFC107':'#DC3545',borderRadius:4,transition:'width .3s'}}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:stats.pct===100?'#155724':'#6C757D'}}>{stats.pct}% ({stats.done}/{stats.total})</span>
          </div>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/qm/ppap')}>Back</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving?'Saving...':id?'Update PPAP':'Save PPAP'}
          </button>
        </div>
      </div>

      {/* Status strip */}
      <div style={{background:'#FDF8FC',border:'1px solid #E0D5E0',borderRadius:6,padding:'8px 16px',marginBottom:12,display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
        {[
          ['PPAP No.', <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{ppapNo}</span>],
          ['Part', <strong>{form.partName||'—'}</strong>],
          ['Customer', form.customer||'—'],
          ['Level', <span style={{background:'#EDE0EA',color:'#714B67',padding:'1px 8px',borderRadius:4,fontSize:11,fontWeight:700}}>{form.level}</span>],
          ['Revision', `Rev ${form.revision||'A'}`],
          ['Elements', `${stats.done}/${stats.total} complete`],
        ].map(([l,v])=>(
          <div key={l} style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:10,fontWeight:800,color:'#6C757D'}}>{l}:</span>
            <span style={{fontSize:12}}>{v}</span>
          </div>
        ))}
        <div style={{marginLeft:'auto'}}>
          <select style={{border:'none',background:'transparent',fontSize:12,fontWeight:700,color:'#714B67',cursor:'pointer'}} value={form.status} onChange={fSet('status')}>
            {['In Progress','Submitted','Approved','Rejected','On Hold'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:0,overflowX:'auto',borderBottom:'2px solid #E0D5E0',marginBottom:0}}>
        {allTabs.map(t=>{
          const isActive = tab===t
          const sec      = SECTIONS.includes(t) ? t : null
          const ss       = sec ? sectionStats[sec] : null
          return (
            <div key={t} onClick={()=>setTab(t)} style={{
              padding:'7px 12px',cursor:'pointer',whiteSpace:'nowrap',fontSize:11,fontWeight:700,
              color:      isActive?'#714B67':'#6C757D',
              borderBottom:isActive?'3px solid #714B67':'3px solid transparent',
              marginBottom:'-2px',background:isActive?'#FDF8FC':'transparent',
              display:'flex',alignItems:'center',gap:4
            }}>
              {tabLabels[t]||t}
              {ss && ss.total > 0 && (
                <span style={{background:ss.pct===100?'#D4EDDA':ss.pct>0?'#FFF3CD':'#F0F0F0',color:ss.pct===100?'#155724':ss.pct>0?'#856404':'#999',padding:'1px 5px',borderRadius:8,fontSize:9,fontWeight:700}}>
                  {ss.done}/{ss.total}
                </span>
              )}
              {t==='psw' && form.psw_declaration && <span style={{color:'#28A745',fontSize:12}}>✓</span>}
            </div>
          )
        })}
      </div>

      <div style={{border:'1px solid #E0D5E0',borderTop:'none',borderRadius:'0 0 8px 8px',background:'#fff',marginBottom:14,padding:20}}>

        {/* ── HEADER TAB ── */}
        {tab==='header' && (
          <div>
            <div style={{fontSize:12,fontWeight:800,color:'#714B67',textTransform:'uppercase',borderBottom:'2px solid #714B67',paddingBottom:4,marginBottom:14}}>
              Part &amp; Customer Information
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
              <F label="Part Name *"       k="partName"    ph="Ring Yarn 30s" />
              <F label="Part Number"       k="partNo"      ph="PY-BH-6001-T028-001" />
              <F label="Drawing Number"    k="drawingNo"   ph="DRG-2026-001" />
              <F label="Drawing Revision"  k="drawingRev"  ph="Rev A" />
              <F label="Part Description"  k="partDesc"    ph="Short description" />
              <div>
                <label style={lbl}>PPAP Level *</label>
                <select style={{...inp,cursor:'pointer'}} value={form.level} onChange={fSet('level')}>
                  {LEVELS.map(l=><option key={l}>{l}</option>)}
                </select>
                <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>
                  {form.level==='Level 1'?'PSW only':form.level==='Level 2'?'PSW + limited data':form.level==='Level 3'?'PSW + complete package (most common)':form.level==='Level 4'?'Customer-defined requirements':'On-site review at supplier'}
                </div>
              </div>
            </div>

            <div style={{fontSize:12,fontWeight:800,color:'#714B67',textTransform:'uppercase',borderBottom:'2px solid #714B67',paddingBottom:4,marginBottom:14,marginTop:20}}>
              Customer Information
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label style={lbl}>Customer *</label>
                <select style={{...inp,cursor:'pointer'}} value={form.customer} onChange={fSet('customer')}>
                  <option value="">-- Select --</option>
                  {customers.map(c=><option key={c.id} value={c.name||c.code}>{c.name}</option>)}
                  <option value="ABC Textiles">ABC Textiles</option>
                  <option value="DEF Exports">DEF Exports</option>
                </select>
              </div>
              <F label="Customer Contact"    k="customerContact" ph="John Smith" />
              <F label="Customer Part No."   k="customerPartNo"  ph="Customer's part number" />
              <F label="Plant / Location"    k="plant" ph="LNVM01" />
            </div>

            <div style={{fontSize:12,fontWeight:800,color:'#714B67',textTransform:'uppercase',borderBottom:'2px solid #714B67',paddingBottom:4,marginBottom:14,marginTop:20}}>
              Submission Details
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:12,marginBottom:14}}>
              <F label="Annual Volume"    k="annualVolume"    ph="50000" type="number" />
              <F label="Lot Size"         k="lotSize"         ph="500"   type="number" />
              <F label="Sample Qty"       k="sampleQty"       ph="5"     type="number" />
              <F label="Submission Date"  k="submissionDate"  type="date" />
              <F label="Submitted By"     k="submittedBy"     readOnly />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>Reason for Submission</label>
                <select style={{...inp,cursor:'pointer'}} value={form.changeReason} onChange={fSet('changeReason')}>
                  {['New Part','Engineering Change','Tooling Change','Material Change','Process Change','Sub-Supplier Change','Correction of Discrepancy'].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <F label="Weight (Kg)" k="weightKg" ph="0.045" type="number" />
              <F label="Material"    k="material"  ph="Polypropylene / Cotton" />
            </div>
          </div>
        )}

        {/* ── ELEMENT SECTIONS ── */}
        {SECTIONS.filter(s=>s!=='PSW').includes(tab) && (
          <div>
            <div style={{fontSize:12,fontWeight:800,color:'#714B67',textTransform:'uppercase',borderBottom:'2px solid #714B67',paddingBottom:4,marginBottom:14}}>
              {tab} — Documents &amp; Evidence
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                  <th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',width:30}}>#</th>
                  <th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Element</th>
                  <th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'center',width:140}}>Status</th>
                  <th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',width:160}}>Doc Reference</th>
                  <th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'center',width:110}}>Doc Date</th>
                  {tab==='Statistical' && <><th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'center',width:80}}>Cpk</th><th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'center',width:80}}>Ppk</th></>}
                  {tab==='Samples'    && <th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'center',width:90}}>Qty</th>}
                  <th style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left'}}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {ELEMENTS.filter(e=>e.section===tab && !e.isPSW).map(e=>{
                  const isReq = requiredKeys.has(e.key)
                  const elem  = form.elements[e.key]
                  const statusParts = (ELEM_STATUS[elem.status]||'#EEE:#333').split(':')
                  const sBg   = statusParts[0], sTx = statusParts[1]
                  return (
                    <tr key={e.key} style={{borderBottom:'1px solid #F0EEF0',opacity:isReq?1:.5}}>
                      <td style={{padding:'8px 10px',textAlign:'center'}}>
                        <strong style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#714B67'}}>{e.no}</strong>
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        <div style={{fontWeight:600,fontSize:12}}>{e.label}</div>
                        <div style={{fontSize:10,color:'#6C757D',marginTop:1}}>{e.desc}</div>
                        {!isReq && <div style={{fontSize:10,color:'#999',fontStyle:'italic'}}>Not required for {form.level}</div>}
                      </td>
                      <td style={{padding:'6px 8px',textAlign:'center'}}>
                        <select
                          value={elem.status}
                          onChange={e2=>eSet(e.key,'status',e2.target.value)}
                          disabled={!isReq}
                          style={{background:sBg,color:sTx,border:`1px solid ${sBg}`,padding:'3px 6px',borderRadius:4,fontSize:11,fontWeight:700,cursor:isReq?'pointer':'default',width:'100%'}}>
                          {Object.keys(ELEM_STATUS).map(s=><option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <input style={{...inp,fontSize:11}} value={elem.docRef} onChange={e2=>eSet(e.key,'docRef',e2.target.value)} placeholder="Doc no. / file ref..." disabled={!isReq}/>
                      </td>
                      <td style={{padding:'4px 6px'}}>
                        <input type="date" style={{...inp,fontSize:11}} value={elem.docDate} onChange={e2=>eSet(e.key,'docDate',e2.target.value)} disabled={!isReq}/>
                      </td>
                      {tab==='Statistical' && <>
                        <td style={{padding:'4px 6px'}}>
                          <input type="number" step="0.01" style={{...inp,fontSize:11,textAlign:'center'}} value={elem.cpk} onChange={e2=>eSet(e.key,'cpk',e2.target.value)} placeholder="≥1.67" disabled={!isReq}/>
                        </td>
                        <td style={{padding:'4px 6px'}}>
                          <input type="number" step="0.01" style={{...inp,fontSize:11,textAlign:'center'}} value={elem.ppk} onChange={e2=>eSet(e.key,'ppk',e2.target.value)} placeholder="≥1.67" disabled={!isReq}/>
                        </td>
                      </>}
                      {tab==='Samples' && (
                        <td style={{padding:'4px 6px'}}>
                          <input type="number" style={{...inp,fontSize:11,textAlign:'center'}} value={elem.sampleQty} onChange={e2=>eSet(e.key,'sampleQty',e2.target.value)} placeholder="5" disabled={!isReq}/>
                        </td>
                      )}
                      <td style={{padding:'4px 6px'}}>
                        <input style={{...inp,fontSize:11}} value={elem.remarks} onChange={e2=>eSet(e.key,'remarks',e2.target.value)} placeholder="Notes..." disabled={!isReq}/>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PSW TAB — Part Submission Warrant ── */}
        {tab==='psw' && (
          <div>
            <div style={{background:'#CCE5FF',border:'2px solid #B8DAFF',borderRadius:8,padding:'12px 16px',marginBottom:16,fontSize:12,color:'#004085'}}>
              <strong>Part Submission Warrant (PSW)</strong> — This is the final PPAP sign-off document.
              Submit only after all required elements ({stats.done}/{stats.total}) are complete.
              {stats.pct < 100 && <span style={{color:'#856404',fontWeight:700,marginLeft:8}}>⚠ {stats.total-stats.done} elements still pending</span>}
            </div>

            {/* Part details for PSW */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
              <F label="Part Weight (Kg)"    k="psw_partWeight"   ph="0.045" type="number" />
              <F label="No. of Mold Cavities" k="psw_moldCavities" ph="1" type="number" />
              <F label="Tooling Number"       k="psw_toolingNo"    ph="TOOL-2026-001" />
            </div>

            {/* Dimensional / CPK summary */}
            <div style={{background:'#F8F4F8',borderRadius:6,padding:'12px 16px',marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:800,color:'#714B67',marginBottom:10,textTransform:'uppercase'}}>Element Checklist Summary</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {ELEMENTS.filter(e=>requiredKeys.has(e.key)).map(e=>{
                  const elem = form.elements[e.key]
                  const statusParts = (ELEM_STATUS[elem.status]||'#EEE:#333').split(':')
                  return (
                    <div key={e.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 8px',background:'#fff',borderRadius:4,border:'1px solid #E0D5E0',fontSize:11}}>
                      <span style={{color:'#333'}}>{e.no}. {e.label.split(' ').slice(0,3).join(' ')}...</span>
                      <span style={{background:statusParts[0],color:statusParts[1],padding:'1px 6px',borderRadius:4,fontSize:10,fontWeight:700,flexShrink:0,marginLeft:4}}>{elem.status}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Supplier declaration */}
            <div style={{border:'2px solid #714B67',borderRadius:8,padding:16,marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:800,color:'#714B67',marginBottom:12}}>SUPPLIER DECLARATION</div>
              <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',marginBottom:14}}>
                <input type="checkbox" checked={!!form.psw_declaration} onChange={fBool('psw_declaration')} style={{accentColor:'#714B67',width:16,height:16,marginTop:2,flexShrink:0}}/>
                <span style={{fontSize:12,lineHeight:1.6}}>
                  I affirm that the samples represented by this warrant are representative of our parts, which were made by a process that meets all specified requirements. I further certify that documented evidence of such compliance is on file and available for review. I have noted any deviations from this declaration below.
                </span>
              </label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <F label="Supplier Representative Name" k="psw_supplierSign" ph="Your name" />
                <F label="Date"                         k="psw_signDate"     type="date" />
              </div>
              <div style={{marginTop:12}}>
                <F label="Deviations / Comments" k="psw_remarks" rows={2} ph="Any deviations from full compliance..." />
              </div>
            </div>

            {/* Customer disposition */}
            <div style={{border:'2px solid #28A745',borderRadius:8,padding:16}}>
              <div style={{fontSize:12,fontWeight:800,color:'#155724',marginBottom:12}}>CUSTOMER DISPOSITION (to be filled by customer)</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div>
                  <label style={lbl}>Customer Disposition</label>
                  <select style={{...inp,cursor:'pointer'}} value={form.psw_customerDisp} onChange={fSet('psw_customerDisp')}>
                    <option value="">-- Pending Customer --</option>
                    {DISP.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <F label="Customer Representative" k="psw_customerSign" ph="Customer name" />
                <F label="Customer Sign Date"      k="psw_customerDate" type="date" />
              </div>
              {form.psw_customerDisp==='Approved' && (
                <div style={{marginTop:14,background:'#D4EDDA',border:'2px solid #C3E6CB',borderRadius:8,padding:'14px',textAlign:'center'}}>
                  <div style={{fontSize:36}}>🏆</div>
                  <div style={{fontSize:18,fontWeight:800,color:'#155724',fontFamily:'Syne,sans-serif'}}>PPAP APPROVED!</div>
                  <div style={{fontSize:13,color:'#155724',marginTop:4}}>Part Submission Warrant approved by customer. Ready for mass production.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0 20px'}}>
        <div style={{display:'flex',gap:4}}>
          {allTabs.map(t=>{
            const sec = SECTIONS.includes(t)?t:null
            const ss  = sec?sectionStats[sec]:null
            const pct = ss?.total>0?ss.pct:(t==='psw'&&form.psw_declaration?100:t==='header'?(form.partName&&form.customer?100:0):0)
            return <div key={t} onClick={()=>setTab(t)} title={tabLabels[t]||t}
              style={{width:28,height:6,borderRadius:3,cursor:'pointer',background:tab===t?'#714B67':pct===100?'#28A745':pct>0?'#FFC107':'#E0D5E0',border:'1px solid rgba(0,0,0,.05)'}}/>
          })}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-s sd-bsm" onClick={()=>{ const i=allTabs.indexOf(tab); if(i>0) setTab(allTabs[i-1]) }} disabled={tab===allTabs[0]}>← Prev</button>
          <button className="btn btn-s sd-bsm" onClick={()=>{ const i=allTabs.indexOf(tab); if(i<allTabs.length-1) setTab(allTabs[i+1]) }} disabled={tab===allTabs[allTabs.length-1]}>Next →</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>{saving?'Saving...':id?'Update PPAP':'Save PPAP'}</button>
        </div>
      </div>
    </div>
  )
}
