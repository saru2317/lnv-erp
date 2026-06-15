import React, { useState, useRef } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const SHEETS = [
  { key:'Chart_of_Accounts', label:'Chart of Accounts', icon:'📒', color:'#714B67', endpoint:'chart-of-accounts', tally:'Display → List of Accounts → Export' },
  { key:'Customers',         label:'Customers',          icon:'👥', color:'#2E7D32', endpoint:'customers',         tally:'Accounts Info → Ledgers → Sundry Debtors → Export' },
  { key:'Vendors',           label:'Vendors/Suppliers',  icon:'🏭', color:'#1565C0', endpoint:'vendors',           tally:'Accounts Info → Ledgers → Sundry Creditors → Export' },
  { key:'Items',             label:'Stock Items',         icon:'📦', color:'#856404', endpoint:'items',             tally:'Inventory Info → Stock Items → Export' },
  { key:'Opening_Balances',  label:'Opening Balances',    icon:'💰', color:'#117A65', endpoint:'opening-balances',  tally:'Display → Trial Balance → as of 01-Apr-2025 → Export' },
  { key:'Sales_Invoices',    label:'Sales Invoices',      icon:'🧾', color:'#7D3C98', endpoint:'sales-invoices',    tally:'Display → Account Books → Sales Register → Export' },
  { key:'Purchase_Invoices', label:'Purchase Invoices',   icon:'📋', color:'#1A5276', endpoint:'purchase-invoices', tally:'Display → Account Books → Purchase Register → Export' },
  { key:'Journal_Entries',   label:'Journal Entries',     icon:'📝', color:'#784212', endpoint:'journal-entries',   tally:'Display → Account Books → Journal Register → Export' },
]

const STEPS = [
  { n:1, label:'Download Template' },
  { n:2, label:'Fill Tally Data' },
  { n:3, label:'Upload & Preview' },
  { n:4, label:'Import' },
]

function UploadZone({ onFile, loading, file }) {
  const ref = useRef()
  return (
    <div onClick={()=>ref.current?.click()}
      style={{border:`2px dashed ${file?'#714B67':'#E0D5E0'}`,borderRadius:8,padding:32,
        textAlign:'center',cursor:'pointer',background:file?'#F8F4F8':'#fff',transition:'all .2s'}}>
      <input type="file" ref={ref} accept=".xlsx,.xls" onChange={onFile} style={{display:'none'}} />
      <div style={{fontSize:32,marginBottom:8}}>📤</div>
      {loading ? <div style={{fontSize:13,color:'#714B67',fontWeight:700}}>Parsing file…</div>
      : file ? (
        <>
          <div style={{fontWeight:700,color:'#714B67',fontSize:13}}>{file.name}</div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>{(file.size/1024).toFixed(1)} KB · Click to change</div>
        </>
      ) : (
        <>
          <div style={{fontWeight:700,color:'#714B67',fontSize:13}}>Click to upload filled Excel template</div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:4}}>.xlsx files only · max 10MB</div>
        </>
      )}
    </div>
  )
}

export default function TallyImport() {
  const [mode,      setMode]      = useState('all')
  const [step,      setStep]      = useState(1)
  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [results,   setResults]   = useState(null)
  const [selSheets, setSelSheets] = useState(SHEETS.map(s=>s.key))
  // One by one
  const [selSheet,  setSelSheet]  = useState(SHEETS[1])
  const [singleFile,setSingleFile]= useState(null)
  const [singleRes, setSingleRes] = useState({})
  const [singleLoad,setSingleLoad]= useState(false)
  const singleRef = useRef()

  const handleAllFile = async (e) => {
    const f = e.target.files[0]; if (!f) return
    setFile(f); setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', f)
      const r = await fetch(`${BASE}/tally-import/preview`, { method:'POST', headers:hdr2(), body:fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setPreview(d.data); setStep(3)
      toast.success('File parsed — select sheets to import')
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const handleImportAll = async () => {
    setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch(`${BASE}/tally-import/import-all`, { method:'POST', headers:hdr2(), body:fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setResults(d.data); setStep(4)
      toast.success('Import completed!')
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const handleSingleImport = async () => {
    if (!singleFile||!selSheet) return
    setSingleLoad(true)
    try {
      const fd = new FormData(); fd.append('file', singleFile)
      const r = await fetch(`${BASE}/tally-import/${selSheet.endpoint}`, { method:'POST', headers:hdr2(), body:fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSingleRes(p=>({...p,[selSheet.key]:d.data}))
      toast.success(d.message); setSingleFile(null)
    } catch(e) { toast.error(e.message) }
    finally { setSingleLoad(false) }
  }

  const totalCreated = results ? Object.values(results).reduce((s,r)=>s+(r.created||0),0) : 0

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
          Tally Data Import
          <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>Migrate your Tally data to LNV ERP</small>
        </div>
      </div>

      {/* Download strip */}
      <div style={{background:'#EDE0EA',borderRadius:8,padding:'10px 16px',marginBottom:14,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:12,color:'#714B67',fontWeight:600}}>
          Download the LNV ERP Tally Import Template (.xlsx) — fill your Tally data and upload
        </div>
        <a href={`${BASE}/tally-import/template`}
          style={{padding:'6px 16px',background:'#714B67',color:'#fff',borderRadius:5,
            fontSize:12,fontWeight:700,textDecoration:'none'}}>
          ⬇ Download Template
        </a>
      </div>

      {/* Mode tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,padding:'4px 6px',
        background:'#F0EEEB',borderRadius:8,width:'fit-content'}}>
        {[
          {k:'all',    l:'📦 All at Once'},
          {k:'single', l:'📄 One by One'},
        ].map(m=>(
          <button key={m.k} onClick={()=>{setMode(m.k);setStep(1);setFile(null);setPreview(null);setResults(null)}}
            style={{padding:'7px 18px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
              background:mode===m.k?'#714B67':'transparent',color:mode===m.k?'#fff':'#6C757D'}}>
            {m.l}
          </button>
        ))}
      </div>

      {/* ══ ALL AT ONCE ══ */}
      {mode==='all' && (
        <div>
          {/* Step indicator */}
          <div style={{display:'flex',alignItems:'center',marginBottom:20,background:'#fff',
            padding:'12px 20px',borderRadius:8,border:'1px solid #E0D5E0'}}>
            {STEPS.map((s,i)=>(
              <React.Fragment key={s.n}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:28,height:28,borderRadius:'50%',display:'flex',
                    alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,
                    background:step>=s.n?'#714B67':'#E0D5E0',color:step>=s.n?'#fff':'#6C757D'}}>
                    {step>s.n?'✓':s.n}
                  </div>
                  <span style={{fontSize:12,fontWeight:step===s.n?700:400,
                    color:step===s.n?'#714B67':'#6C757D'}}>{s.label}</span>
                </div>
                {i<STEPS.length-1&&<div style={{flex:1,height:2,background:step>s.n?'#714B67':'#E0D5E0',margin:'0 10px'}}/>}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1 — Download + Sheet overview */}
          {step===1 && (
            <div style={{background:'#fff',borderRadius:8,border:'1px solid #E0D5E0',padding:24}}>
              <div style={{fontWeight:700,fontSize:14,color:'#714B67',marginBottom:12}}>
                What data will be imported from Tally?
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
                {SHEETS.map(s=>(
                  <div key={s.key} style={{padding:'12px 14px',borderRadius:8,
                    border:`1px solid ${s.color}33`,background:`${s.color}08`}}>
                    <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                    <div style={{fontWeight:700,fontSize:12,color:s.color}}>{s.label}</div>
                    <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>{s.tally}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#FFF3CD',borderRadius:6,padding:'10px 14px',marginBottom:16,fontSize:11,color:'#856404'}}>
                <strong>How to export from Tally:</strong> Gateway of Tally → Display / Accounts Info / Inventory Info →
                Press <strong>Alt+E</strong> → Export → Excel format → Save the file
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(2)}
                  style={{padding:'10px 24px',background:'#714B67',color:'#fff',border:'none',
                    borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Next — Fill Template →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Fill Instructions */}
          {step===2 && (
            <div style={{background:'#fff',borderRadius:8,border:'1px solid #E0D5E0',padding:24}}>
              <div style={{fontWeight:700,fontSize:14,color:'#714B67',marginBottom:12}}>
                Fill your Tally data in the template
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                {SHEETS.map(s=>(
                  <div key={s.key} style={{padding:'10px 14px',background:'#F8F4F8',borderRadius:6,
                    display:'flex',alignItems:'flex-start',gap:10}}>
                    <span style={{fontSize:20,flexShrink:0}}>{s.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:12,color:s.color}}>{s.label}</div>
                      <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>Tally: {s.tally}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:'#F8D7DA',borderRadius:6,padding:'8px 14px',marginBottom:16,fontSize:11,color:'#721C24'}}>
                Do NOT change column headers · Date format: DD-MM-YYYY · Numbers only in amount fields · Red columns are mandatory
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setStep(1)}
                  style={{padding:'10px 18px',background:'#fff',color:'#714B67',border:'1.5px solid #714B67',
                    borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>← Back</button>
                <button onClick={()=>setStep(3)}
                  style={{padding:'10px 24px',background:'#714B67',color:'#fff',border:'none',
                    borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Ready to Upload →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Upload & Preview */}
          {step===3 && (
            <div>
              <UploadZone onFile={handleAllFile} loading={loading} file={file} />
              {preview && (
                <div style={{marginTop:14}}>
                  <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:10}}>
                    Preview — Select sheets to import:
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                    {SHEETS.map(s=>{
                      const count = preview.preview?.[s.key]?.count||0
                      const sel   = selSheets.includes(s.key)
                      return (
                        <div key={s.key}
                          onClick={()=>count>0&&setSelSheets(p=>p.includes(s.key)?p.filter(k=>k!==s.key):[...p,s.key])}
                          style={{padding:'12px',borderRadius:8,cursor:count>0?'pointer':'default',
                            border:`2px solid ${sel&&count>0?s.color:'#E0D5E0'}`,
                            background:sel&&count>0?`${s.color}11`:'#fff',opacity:count>0?1:0.5,
                            transition:'all .15s'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                            <span style={{fontSize:22}}>{s.icon}</span>
                            <span style={{fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:10,
                              background:count>0?s.color:'#E0D5E0',color:'#fff'}}>{count} rows</span>
                          </div>
                          <div style={{fontWeight:700,fontSize:12,color:s.color}}>{s.label}</div>
                          <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>
                            {count>0?(sel?'✓ Selected':'Click to select'):'No data found'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <button onClick={handleImportAll} disabled={loading||selSheets.length===0}
                      style={{padding:'10px 28px',background:'#714B67',color:'#fff',border:'none',
                        borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                      {loading?'Importing…':'🚀 Import Selected Sheets'}
                    </button>
                    <button onClick={()=>setSelSheets(SHEETS.map(s=>s.key))}
                      style={{padding:'7px 12px',background:'#D4EDDA',color:'#155724',border:'none',borderRadius:5,fontSize:11,cursor:'pointer'}}>Select All</button>
                    <button onClick={()=>setSelSheets([])}
                      style={{padding:'7px 12px',background:'#F8D7DA',color:'#721C24',border:'none',borderRadius:5,fontSize:11,cursor:'pointer'}}>Clear All</button>
                    <span style={{fontSize:12,color:'#6C757D'}}>{selSheets.length} sheets selected</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Results */}
          {step===4 && results && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
                {[
                  {l:'Total Imported', v:totalCreated, c:'#155724', bg:'#D4EDDA'},
                  {l:'Already Existed', v:Object.values(results).reduce((s,r)=>s+(r.skipped||0),0), c:'#856404', bg:'#FFF3CD'},
                  {l:'Errors', v:Object.values(results).reduce((s,r)=>s+(r.errors?.length||0),0), c:'#721C24', bg:'#F8D7DA'},
                ].map(k=>(
                  <div key={k.l} style={{borderRadius:8,padding:'14px 18px',border:'1px solid #E0D5E0',
                    borderLeft:`4px solid ${k.c}`,background:'#fff'}}>
                    <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:28,color:k.c}}>{k.v}</div>
                    <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#714B67'}}>
                    {['Sheet','Created','Skipped','Errors'].map(h=>(
                      <th key={h} style={{padding:'8px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {Object.entries(results).map(([sheet,r],i)=>(
                      <tr key={sheet} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                        <td style={{padding:'8px 14px',fontWeight:600}}>
                          {SHEETS.find(s=>s.key===sheet)?.icon} {SHEETS.find(s=>s.key===sheet)?.label||sheet}
                        </td>
                        <td style={{padding:'8px 14px',color:'#155724',fontWeight:700}}>{r.created||0}</td>
                        <td style={{padding:'8px 14px',color:'#856404'}}>{r.skipped||0}</td>
                        <td style={{padding:'8px 14px'}}>
                          {r.errors?.length>0?(
                            <details><summary style={{cursor:'pointer',color:'#721C24'}}>{r.errors.length} errors</summary>
                              {r.errors.map((e,i)=><div key={i} style={{fontSize:10}}>{e}</div>)}
                            </details>
                          ):'—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{setStep(1);setFile(null);setPreview(null);setResults(null)}}
                  style={{padding:'8px 16px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Import Another File
                </button>
                <button onClick={()=>window.location.href='/'}
                  style={{padding:'8px 18px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  Go to Dashboard →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ ONE BY ONE ══ */}
      {mode==='single' && (
        <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:14}}>
          {/* Left panel */}
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
            <div style={{padding:'8px 12px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:11}}>
              Select Sheet to Import
            </div>
            {SHEETS.map(s=>{
              const done = singleRes[s.key]
              return (
                <div key={s.key} onClick={()=>{setSelSheet(s);setSingleFile(null)}}
                  style={{padding:'10px 12px',borderBottom:'1px solid #F0EEEB',cursor:'pointer',
                    background:selSheet?.key===s.key?'#EDE0EA':'#fff',
                    borderLeft:`3px solid ${selSheet?.key===s.key?s.color:'transparent'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:16}}>{s.icon}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:11,color:s.color}}>{s.label}</div>
                        <div style={{fontSize:9,color:'#6C757D'}}>{done?`✓ ${done.created} imported`:'Not imported yet'}</div>
                      </div>
                    </div>
                    {done&&<span style={{fontSize:10,background:'#D4EDDA',color:'#155724',padding:'1px 6px',borderRadius:3,fontWeight:700}}>✓</span>}
                  </div>
                </div>
              )
            })}
            {/* Progress */}
            {Object.keys(singleRes).length>0&&(
              <div style={{padding:'8px 12px',background:'#F8F4F8',borderTop:'2px solid #E0D5E0'}}>
                <div style={{fontSize:10,color:'#6C757D',marginBottom:4}}>Progress</div>
                <div style={{background:'#E0D5E0',borderRadius:4,height:6,overflow:'hidden'}}>
                  <div style={{background:'#714B67',height:'100%',
                    width:`${Math.round(Object.keys(singleRes).length/SHEETS.length*100)}%`,
                    transition:'width .3s'}}/>
                </div>
                <div style={{fontSize:10,color:'#714B67',marginTop:3,fontWeight:700}}>
                  {Object.keys(singleRes).length} / {SHEETS.length} sheets done
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div>
            {selSheet&&(
              <div style={{background:'#fff',border:`2px solid ${selSheet.color}33`,borderRadius:8,padding:20}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <span style={{fontSize:32}}>{selSheet.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:selSheet.color}}>{selSheet.label}</div>
                    <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>Tally: {selSheet.tally}</div>
                  </div>
                  {singleRes[selSheet.key]&&(
                    <div style={{marginLeft:'auto',padding:'5px 14px',background:'#D4EDDA',
                      color:'#155724',borderRadius:6,fontSize:12,fontWeight:700}}>
                      ✓ Imported — {singleRes[selSheet.key].created} records
                    </div>
                  )}
                </div>
                <div style={{background:'#FFF3CD',borderRadius:6,padding:'8px 12px',marginBottom:14,fontSize:11,color:'#856404'}}>
                  <strong>How to export:</strong> Tally → {selSheet.tally}. Then paste data into the <strong>{selSheet.label}</strong> sheet of the template.
                </div>
                <div onClick={()=>singleRef.current?.click()}
                  style={{border:`2px dashed ${singleFile?selSheet.color:'#E0D5E0'}`,borderRadius:8,
                    padding:28,textAlign:'center',cursor:'pointer',
                    background:singleFile?`${selSheet.color}08`:'#fff',marginBottom:12}}>
                  <input ref={singleRef} type="file" accept=".xlsx,.xls"
                    onChange={e=>{setSingleFile(e.target.files[0])}} style={{display:'none'}} />
                  <div style={{fontSize:28,marginBottom:6}}>📤</div>
                  {singleFile?(
                    <>
                      <div style={{fontWeight:700,color:selSheet.color,fontSize:12}}>{singleFile.name}</div>
                      <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>{(singleFile.size/1024).toFixed(1)} KB · Click to change</div>
                    </>
                  ):(
                    <>
                      <div style={{fontWeight:700,color:'#714B67',fontSize:12}}>Upload {selSheet.label} sheet</div>
                      <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>.xlsx files only</div>
                    </>
                  )}
                </div>
                {singleFile&&(
                  <button onClick={handleSingleImport} disabled={singleLoad}
                    style={{width:'100%',padding:'11px',background:selSheet.color,color:'#fff',
                      border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                    {singleLoad?'Importing…':`🚀 Import ${selSheet.label}`}
                  </button>
                )}
                {singleRes[selSheet.key]&&(
                  <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
                    {[
                      {l:'Created',v:singleRes[selSheet.key].created||0,c:'#155724',bg:'#D4EDDA'},
                      {l:'Skipped',v:singleRes[selSheet.key].skipped||0,c:'#856404',bg:'#FFF3CD'},
                      {l:'Errors', v:singleRes[selSheet.key].errors?.length||0,c:'#721C24',bg:'#F8D7DA'},
                    ].map(x=>(
                      <span key={x.l} style={{padding:'4px 12px',borderRadius:20,fontSize:11,
                        fontWeight:700,background:x.bg,color:x.c}}>{x.l}: {x.v}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
