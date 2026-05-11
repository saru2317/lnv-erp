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

  // Group by module
  const groups = {
    'Sales (SD)':      ['QUOTATION','SALES_ORDER','SALES_INVOICE','LABOUR_INVOICE','PAYMENT','SALES_RETURN'],
    'Purchase (MM)':   ['PURCHASE_REQ','PURCHASE_ORDER','PURCHASE_INVOICE','PURCHASE_RETURN','PAYMENT_VOUCHER'],
    'Operations':      ['WORK_ORDER','DELIVERY_CHALLAN','INWARD_CHALLAN'],
    'Finance (FI)':    ['JOURNAL_ENTRY'],
    'CRM':             ['CRM_LEAD'],
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
        <button onClick={seed}
          style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>
          Seed Defaults
        </button>
      </div>

      {/* Legend */}
      <div style={{background:'#F8F4F8',border:'1px solid #E0D5E0',borderRadius:8,padding:'10px 16px',
        marginBottom:14,fontSize:11,color:'#714B67',display:'flex',gap:24,alignItems:'center'}}>
        <span><strong>Format:</strong> PREFIX + SEPARATOR + YEAR + SEPARATOR + SEQUENCE</span>
        <span><strong>Example:</strong> SO - 2026 - 0001 → <code style={{background:'#EDE0EA',padding:'1px 6px',borderRadius:4,fontFamily:'monospace'}}>SO-2026-0001</code></span>
        <span><strong>Fiscal:</strong> Apr 1 to Mar 31 (India)</span>
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading series...</div> : (
        <div>
          {Object.entries(groups).map(([groupName, docTypes]) => {
            const groupSeries = series.filter(s => docTypes.includes(s.docType))
            if (!groupSeries.length) return null
            return (
              <div key={groupName} style={{marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:12,color:'#714B67',textTransform:'uppercase',
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
