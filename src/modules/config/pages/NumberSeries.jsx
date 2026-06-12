import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const YEAR_FORMATS = [
  { value:'YYYY',    label:'YYYY (2026)',        example:'SO-2026-0001'  },
  { value:'YY',      label:'YY (26)',             example:'SO-26-0001'    },
  { value:'YY-YY',   label:'YY-YY (26-27 Fiscal)',example:'INV/26-27/0001'},
  { value:'YYYY-YY', label:'YYYY-YY (2026-27)',   example:'INV/2026-27/0001'},
]

const RESET_TYPES = [
  { value:'YEARLY', label:'Yearly (Jan 1)' },
  { value:'FISCAL', label:'Fiscal Year (Apr 1)' },
  { value:'NEVER',  label:'Never reset — continuous' },
]

const inp = { padding:'6px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', fontFamily:'DM Sans,sans-serif' }

export default function NumberSeries() {
  const [series,   setSeries]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editRow,  setEditRow]  = useState(null) // docType being edited
  const [editForm, setEditForm] = useState({})
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/number-series`, { headers: hdr2() })
      const d = await r.json()
      setSeries(Array.isArray(d.data) ? d.data : [])
    } catch { setSeries([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const startEdit = s => {
    setEditRow(s.docType)
    setEditForm({ prefix:s.prefix, separator:s.separator, yearFormat:s.yearFormat,
      padding:s.padding, currentNo:s.currentNo, isActive:s.isActive })
  }

  const save = async docType => {
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/number-series/${docType}`, {
        method:'PATCH', headers: hdr(), body: JSON.stringify(editForm)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(`${docType} series updated`)
      setEditRow(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const reset = async docType => {
    if (!window.confirm(`Reset ${docType} series to 0? Next number will be 0001.`)) return
    try {
      await fetch(`${BASE_URL}/number-series/${docType}/reset`, { method:'POST', headers: hdr2() })
      toast.success(`${docType} reset to 0001`)
      load()
    } catch { toast.error('Reset failed') }
  }

  const seed = async () => {
    try {
      const r = await fetch(`${BASE_URL}/number-series/seed`, { method:'POST', headers: hdr2() })
      const d = await r.json()
      toast.success(d.message)
      load()
    } catch { toast.error('Seed failed') }
  }

  // Group by module — maps group label → docTypes
  const MODULE_GROUPS = {
    'SALES (SD)':      ['QUOTATION','SALES_ORDER','SALES_INVOICE','LABOUR_INVOICE','PAYMENT','SALES_RETURN','DELIVERY_CHALLAN'],
    'PURCHASE (MM)':   ['PURCHASE_REQ','COMP_STATEMENT','PURCHASE_ORDER','VENDOR_INVOICE','PURCHASE_RETURN','INWARD_CHALLAN'],
    'WAREHOUSE (WM)':  ['GRN','GOODS_ISSUE','GOODS_RECEIPT','STOCK_TRANSFER'],
    'PRODUCTION (PP)': ['WORK_ORDER','PROD_PLAN','MAT_ISSUE','JOB_CARD','PROD_BATCH'],
    'QUALITY (QM)':    ['INSPECTION','NCR','CAPA','COMPLAINT'],
    'FINANCE (FI)':    ['JOURNAL_ENTRY','PAYMENT_VOUCHER','RECEIPT_VOUCHER'],
    'CRM':             ['CRM_LEAD'],
  }
  // Build reverse map docType → group
  const docTypeToGroup = {}
  Object.entries(MODULE_GROUPS).forEach(([grp, types]) => types.forEach(t => docTypeToGroup[t] = grp))

  // Group series — known groups first, then custom
  const grouped = {}
  series.forEach(s => {
    const grp = docTypeToGroup[s.docType] || 'CUSTOM'
    if (!grouped[grp]) grouped[grp] = []
    grouped[grp].push(s)
  })
  // Order: known groups first, custom last
  const groupOrder = [...Object.keys(MODULE_GROUPS), 'CUSTOM']
  const groups = {}
  groupOrder.forEach(g => { if (grouped[g]?.length) groups[g] = grouped[g] })

  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ docType:'', docLabel:'', module:'CUSTOM', prefix:'', separator:'-', yearFormat:'YYYY', padding:4, resetType:'YEARLY' })
  const setNF = (k,v) => setNewForm(f=>({...f,[k]:v}))

  const createNew = async () => {
    if (!newForm.docType || !newForm.docLabel || !newForm.prefix) { toast.error('docType, label and prefix are required'); return }
    setSaving(true)
    try {
      const r = await fetch(`${BASE_URL}/number-series`, { method:'POST', headers: hdr(), body: JSON.stringify(newForm) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowNew(false)
      setNewForm({ docType:'', docLabel:'', module:'CUSTOM', prefix:'', separator:'-', yearFormat:'YYYY', padding:4, resetType:'YEARLY' })
      load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Number Series Configuration
            <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>SAP FBN1 / SNRO</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Configure document numbering format for all modules — prefix, year format, sequence
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={seed}
            style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>
            🔄 Seed Defaults
          </button>
          <button onClick={()=>setShowNew(true)}
            style={{padding:'7px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            + New Series
          </button>
        </div>
      </div>

      {/* Create New Series Modal */}
      {showNew && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:10,padding:24,width:520,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,marginBottom:18,color:'#714B67'}}>
              + Create New Number Series
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              {[
                {k:'docType',  l:'Doc Type Key *',   ph:'e.g. MY_DOCUMENT (UPPERCASE)',  full:true},
                {k:'docLabel', l:'Display Label *',  ph:'e.g. My Document',              full:true},
                {k:'prefix',   l:'Prefix *',         ph:'e.g. MD',                       full:false},
                {k:'separator',l:'Separator',         ph:'- or /',                         full:false},
              ].map(f=>(
                <div key={f.k} style={{gridColumn:f.full?'1/-1':'auto'}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>{f.l}</label>
                  <input value={newForm[f.k]} onChange={e=>setNF(f.k, f.k==='docType'?e.target.value.toUpperCase():e.target.value)}
                    placeholder={f.ph} style={{...inp, width:'100%', boxSizing:'border-box'}} />
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>Module Group</label>
                <select value={newForm.module} onChange={e=>setNF('module',e.target.value)} style={{...inp,width:'100%'}}>
                  {[
                    {v:'SD',     l:'SD · Sales'},
                    {v:'MM',     l:'MM · Purchase'},
                    {v:'WM',     l:'WM · Warehouse'},
                    {v:'FI',     l:'FI · Finance'},
                    {v:'PP',     l:'PP · Production'},
                    {v:'QM',     l:'QM · Quality'},
                    {v:'PM',     l:'PM · Maintenance'},
                    {v:'HCM',    l:'HCM · HR'},
                    {v:'CRM',    l:'CRM'},
                    {v:'TM',     l:'TM · Transport'},
                    {v:'AM',     l:'AM · Assets'},
                    {v:'CUSTOM', l:'Custom / Other'},
                  ].map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>Year Format</label>
                <select value={newForm.yearFormat} onChange={e=>setNF('yearFormat',e.target.value)} style={{...inp,width:'100%'}}>
                  {YEAR_FORMATS.map(y=><option key={y.value} value={y.value}>{y.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>Reset Type</label>
                <select value={newForm.resetType} onChange={e=>setNF('resetType',e.target.value)} style={{...inp,width:'100%'}}>
                  {RESET_TYPES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:4}}>Padding (digits)</label>
                <input type="number" min={3} max={8} value={newForm.padding} onChange={e=>setNF('padding',parseInt(e.target.value)||4)} style={{...inp,width:'100%'}} />
              </div>
              <div style={{display:'flex',alignItems:'flex-end'}}>
                <div style={{background:'#F0EEEB',padding:'8px 12px',borderRadius:6,fontSize:12,fontFamily:'monospace',width:'100%'}}>
                  Preview: <strong style={{color:'#714B67'}}>
                    {newForm.prefix||'PREFIX'}{newForm.separator||'-'}{new Date().getFullYear()}{newForm.separator||'-'}{'1'.padStart(newForm.padding||4,'0')}
                  </strong>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',borderTop:'1px solid #E0D5E0',paddingTop:14}}>
              <button onClick={()=>setShowNew(false)} style={{padding:'7px 16px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Cancel</button>
              <button onClick={createNew} disabled={saving}
                style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                {saving?'Creating…':'✓ Create Series'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{background:'#F8F4F8',border:'1px solid #E0D5E0',borderRadius:8,padding:'10px 16px',
        marginBottom:14,fontSize:11,color:'#714B67',display:'flex',gap:24,alignItems:'center'}}>
        <span><strong>Format:</strong> PREFIX + SEPARATOR + YEAR + SEPARATOR + SEQUENCE</span>
        <span><strong>Example:</strong> SO - 2026 - 0001 → <code style={{background:'#EDE0EA',padding:'1px 6px',borderRadius:4,fontFamily:'monospace'}}>SO-2026-0001</code></span>
        <span><strong>Fiscal:</strong> Apr 1 to Mar 31 (India)</span>
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading series...</div> : (
        <div>
          {Object.entries(groups).map(([groupName, groupSeries]) => {
            if (!groupSeries.length) return null
            const grpColor = {
              'SALES (SD)':'#714B67','PURCHASE (MM)':'#00A09D','WAREHOUSE (WM)':'#1F618D',
              'PRODUCTION (PP)':'#E06F39','QUALITY (QM)':'#117864','FINANCE (FI)':'#1A5276',
              'CRM':'#8E44AD','CUSTOM':'#6C757D'
            }[groupName] || '#714B67'
            return (
              <div key={groupName} style={{marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:12,color:grpColor,textTransform:'uppercase',
                  letterSpacing:'.05em',marginBottom:8,padding:'0 4px'}}>{groupName}</div>
                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                        {['Document','Prefix','Sep','Year Format','Padding','Current #','Next Preview','Reset Type','Status',''].map(h=>(
                          <th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,fontSize:10,
                            color:'#714B67',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupSeries.map((s,i) => {
                        const isEditing = editRow === s.docType
                        return (
                          <tr key={s.docType} style={{borderBottom:'1px solid #F0EEEB',
                            background:isEditing?'#FFF8FF':i%2===0?'#fff':'#FAFAFA'}}>

                            <td style={{padding:'9px 12px',fontWeight:600,fontSize:12}}>
                              {s.docLabel}
                              <div style={{fontSize:10,color:'#6C757D',fontFamily:'monospace'}}>{s.docType}</div>
                            </td>

                            {isEditing ? (
                              <>
                                <td style={{padding:'5px 8px'}}>
                                  <input style={{...inp,width:70}} value={editForm.prefix}
                                    onChange={e=>setEditForm(p=>({...p,prefix:e.target.value}))}/>
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  <select style={{...inp,width:55,cursor:'pointer'}} value={editForm.separator}
                                    onChange={e=>setEditForm(p=>({...p,separator:e.target.value}))}>
                                    {['-','/','_','.',''].map(s=><option key={s} value={s}>{s||'(none)'}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  <select style={{...inp,width:140,cursor:'pointer'}} value={editForm.yearFormat}
                                    onChange={e=>setEditForm(p=>({...p,yearFormat:e.target.value}))}>
                                    {YEAR_FORMATS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  <select style={{...inp,width:55,cursor:'pointer'}} value={editForm.padding}
                                    onChange={e=>setEditForm(p=>({...p,padding:parseInt(e.target.value)}))}>
                                    {[3,4,5,6].map(n=><option key={n}>{n}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  <input type="number" style={{...inp,width:70,fontFamily:'monospace'}}
                                    value={editForm.currentNo}
                                    onChange={e=>setEditForm(p=>({...p,currentNo:parseInt(e.target.value)||0}))}/>
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  {/* live preview */}
                                  {(() => {
                                    const now   = new Date()
                                    const year  = now.getFullYear()
                                    const fyS   = now.getMonth()>=3?year:year-1
                                    const fyE   = fyS+1
                                    const yMap  = {'YYYY':year,'YY':String(year).slice(-2),'YY-YY':`${String(fyS).slice(-2)}-${String(fyE).slice(-2)}`,'YYYY-YY':`${fyS}-${String(fyE).slice(-2)}`}
                                    const ys    = yMap[editForm.yearFormat]||year
                                    const next  = (editForm.currentNo||0)+1
                                    const pad   = String(next).padStart(editForm.padding||4,'0')
                                    const prev  = `${editForm.prefix}${editForm.separator}${ys}${editForm.separator}${pad}`
                                    return <span style={{fontFamily:'monospace',fontWeight:700,color:'#714B67',fontSize:11}}>{prev}</span>
                                  })()}
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  <select style={{...inp,width:130,cursor:'pointer'}} value={editForm.resetType||'YEARLY'}
                                    onChange={e=>setEditForm(p=>({...p,resetType:e.target.value}))}>
                                    {RESET_TYPES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                                  </select>
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  <select style={{...inp,cursor:'pointer'}} value={String(editForm.isActive)}
                                    onChange={e=>setEditForm(p=>({...p,isActive:e.target.value==='true'}))}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                  </select>
                                </td>
                                <td style={{padding:'5px 8px'}}>
                                  <div style={{display:'flex',gap:4}}>
                                    <button onClick={()=>save(s.docType)} disabled={saving}
                                      style={{padding:'4px 12px',background:'#714B67',color:'#fff',border:'none',
                                        borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:700}}>
                                      Save
                                    </button>
                                    <button onClick={()=>setEditRow(null)}
                                      style={{padding:'4px 8px',background:'#fff',border:'1px solid #E0D5E0',
                                        borderRadius:5,fontSize:11,cursor:'pointer'}}>
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{padding:'9px 12px',fontFamily:'monospace',fontWeight:700}}>{s.prefix}</td>
                                <td style={{padding:'9px 12px',fontFamily:'monospace',color:'#6C757D'}}>{s.separator||'—'}</td>
                                <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>{s.yearFormat}</td>
                                <td style={{padding:'9px 12px',fontFamily:'monospace',color:'#6C757D',textAlign:'center'}}>{s.padding}</td>
                                <td style={{padding:'9px 12px',fontFamily:'monospace',color:'#6C757D',textAlign:'center'}}>{s.currentNo||0}</td>
                                <td style={{padding:'9px 12px'}}>
                                  <span style={{fontFamily:'monospace',fontWeight:700,color:'#714B67',
                                    background:'#EDE0EA',padding:'2px 8px',borderRadius:5,fontSize:11}}>
                                    {s.preview}
                                  </span>
                                </td>
                                <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>{s.resetType}</td>
                                <td style={{padding:'9px 12px'}}>
                                  <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                                    background:s.isActive?'#D4EDDA':'#F8D7DA',
                                    color:s.isActive?'#155724':'#721C24'}}>
                                    {s.isActive?'Active':'Inactive'}
                                  </span>
                                </td>
                                <td style={{padding:'9px 12px'}}>
                                  <div style={{display:'flex',gap:4}}>
                                    <button onClick={()=>startEdit(s)}
                                      style={{padding:'3px 10px',background:'#EDE0EA',color:'#714B67',border:'none',
                                        borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>Edit</button>
                                    <button onClick={()=>reset(s.docType)}
                                      style={{padding:'3px 10px',background:'#FFF3CD',color:'#856404',border:'none',
                                        borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>Reset</button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
