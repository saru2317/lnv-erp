import React, { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { TEMPLATES, downloadTemplate, parseImportFile, importSummary } from '@utils/importExport'

// ═══════════════════════════════════════════════════════════
// ImportModal — Shared across all masters
// Usage:
//   <ImportModal
//     templateKey="item"         // item | vendor | customer | coa | hsn | bank_statement
//     onImport={async (rows) => { ... POST to backend ... }}
//     onClose={() => setShowImport(false)}
//   />
// ═══════════════════════════════════════════════════════════

export default function ImportModal({ templateKey, onImport, onClose }) {
  const fileRef  = useRef()
  const tmpl     = TEMPLATES[templateKey]
  const [step,   setStep]   = useState('upload')   // upload | preview | done
  const [rows,   setRows]   = useState([])
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)        // { imported, failed }
  const [filter, setFilter] = useState('all')       // all | valid | error

  if (!tmpl) return null

  const summary = importSummary(rows)

  const onFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const { rows: parsed, errors: errs } = parseImportFile(ev.target.result, templateKey)
      if (!parsed.length) return toast.error('No data found — check file format')
      setRows(parsed)
      setErrors(errs)
      setStep('preview')
      toast.success(`${parsed.length} rows parsed`)
    }
    reader.readAsText(file)
  }

  const doImport = async () => {
    const validRows = rows.filter(r => !r._hasError)
    if (!validRows.length) return toast.error('No valid rows to import')
    setSaving(true)
    try {
      const res = await onImport(validRows)
      setResult(res || { imported: validRows.length, failed: 0 })
      setStep('done')
      toast.success(`${validRows.length} records imported`)
    } catch (e) { toast.error(e.message || 'Import failed') }
    finally { setSaving(false) }
  }

  const filtered = rows.filter(r =>
    filter === 'all'   ? true :
    filter === 'valid' ? !r._hasError :
    filter === 'error' ? r._hasError : true
  )

  const inp = { padding:'6px 10px', fontSize:12, border:'1px solid #E0D5E0', borderRadius:5,
    outline:'none', fontFamily:'DM Sans,sans-serif', background:'#fff' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000,
      display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:40, overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:12, width:900, maxWidth:'95vw',
        boxShadow:'0 8px 40px rgba(0,0,0,.25)', marginBottom:40 }}>

        {/* Modal Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#714B67' }}>
              Import {tmpl.name}
            </div>
            <div style={{ fontSize:12, color:'#6C757D', marginTop:2 }}>
              {step === 'upload'  && 'Download template → fill data → upload here'}
              {step === 'preview' && `${summary.total} rows parsed · ${summary.valid} valid · ${summary.errors} errors`}
              {step === 'done'    && 'Import complete!'}
            </div>
          </div>
          <span onClick={onClose} style={{ cursor:'pointer', fontSize:22, color:'#6C757D', padding:'0 4px' }}>&times;</span>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', borderBottom:'1px solid #E0D5E0' }}>
          {[['upload','1. Upload'],['preview','2. Preview & Validate'],['done','3. Done']].map(([k,l])=>(
            <div key={k} style={{
              padding:'8px 20px', fontSize:12, fontWeight:600,
              color: step===k?'#714B67':'#6C757D',
              borderBottom: step===k?'2px solid #714B67':'2px solid transparent',
              marginBottom:-1
            }}>{l}</div>
          ))}
        </div>

        <div style={{ padding:20 }}>

          {/* ── STEP 1: UPLOAD ── */}
          {step === 'upload' && (
            <div>
              {/* Template download */}
              <div style={{ background:'#EDE0EA', borderRadius:8, padding:16, marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:8 }}>
                  Step 1: Download the Template
                </div>
                <div style={{ fontSize:12, color:'#495057', marginBottom:10 }}>
                  The template contains all required columns with examples and hints. Fill it in Excel or Google Sheets, then save as CSV.
                </div>
                <button onClick={() => downloadTemplate(templateKey)}
                  style={{ padding:'8px 20px', background:'#714B67', color:'#fff', border:'none',
                    borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer',
                    display:'flex', alignItems:'center', gap:8 }}>
                  ⬇ Download {tmpl.filename}
                </button>
              </div>

              {/* Column reference */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#714B67', marginBottom:8 }}>
                  Column Reference:
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                  {tmpl.columns.map(c => (
                    <div key={c.key} style={{ padding:'6px 10px', borderRadius:5,
                      background: c.required?'#FFF3CD':'#F8F9FA',
                      border:`1px solid ${c.required?'#FFEEBA':'#E0D5E0'}` }}>
                      <div style={{ fontSize:11, fontWeight:700, color: c.required?'#856404':'#495057' }}>
                        {c.label}{c.required&&' *'}
                      </div>
                      <div style={{ fontSize:10, color:'#6C757D', marginTop:1 }}>
                        e.g. {c.example}
                      </div>
                      {c.hint && <div style={{ fontSize:9, color:'#6C757D' }}>{c.hint}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {tmpl.notes && (
                <div style={{ background:'#D1ECF1', borderRadius:6, padding:'10px 14px', marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:11, color:'#0C5460', marginBottom:4 }}>Important Notes:</div>
                  {tmpl.notes.map((n,i) => (
                    <div key={i} style={{ fontSize:11, color:'#0C5460', marginBottom:2 }}>• {n}</div>
                  ))}
                </div>
              )}

              {/* Upload area */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:8 }}>
                  Step 2: Upload your filled CSV
                </div>
                <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx" style={{display:'none'}} onChange={onFile}/>
                <div onClick={()=>fileRef.current.click()}
                  style={{ border:'2px dashed #714B67', borderRadius:8, padding:'32px 20px',
                    textAlign:'center', cursor:'pointer', background:'#FAF8FA', transition:'background .15s' }}
                  onMouseOver={e=>e.currentTarget.style.background='#EDE0EA'}
                  onMouseOut={e=>e.currentTarget.style.background='#FAF8FA'}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#714B67', marginBottom:4 }}>
                    Click to choose file or drag & drop
                  </div>
                  <div style={{ fontSize:12, color:'#6C757D' }}>CSV files accepted (.csv, .txt)</div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: PREVIEW ── */}
          {step === 'preview' && (
            <div>
              {/* Summary bar */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                {[
                  { label:'Total Rows',  val:summary.total,  cls:'purple' },
                  { label:'Valid',       val:summary.valid,  cls:'green'  },
                  { label:'Errors',      val:summary.errors, cls:'red'    },
                  { label:'Will Import', val:summary.valid,  cls:'blue'   },
                ].map(k=>(
                  <div key={k.label} style={{ padding:'10px 14px', borderRadius:8, textAlign:'center',
                    background:k.cls==='green'?'#D4EDDA':k.cls==='red'?'#F8D7DA':k.cls==='blue'?'#CCE5FF':'#EDE0EA',
                    border:`1px solid ${k.cls==='green'?'#C3E6CB':k.cls==='red'?'#F5C6CB':k.cls==='blue'?'#BEE5EB':'#C8B8C8'}` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#495057', textTransform:'uppercase', marginBottom:2 }}>{k.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:k.cls==='green'?'#155724':k.cls==='red'?'#721C24':k.cls==='blue'?'#004085':'#714B67' }}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* Error list */}
              {errors.length > 0 && (
                <div style={{ background:'#FFF3CD', border:'1px solid #FFEEBA', borderRadius:6,
                  padding:'10px 14px', marginBottom:12, maxHeight:100, overflowY:'auto' }}>
                  <div style={{ fontWeight:700, fontSize:11, color:'#856404', marginBottom:4 }}>
                    {errors.length} validation errors found:
                  </div>
                  {errors.map((e,i)=>(
                    <div key={i} style={{ fontSize:11, color:'#856404' }}>• {e}</div>
                  ))}
                </div>
              )}

              {/* Filter chips */}
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                {[['all','All'],['valid','Valid Only'],['error','Errors Only']].map(([k,l])=>(
                  <button key={k} onClick={()=>setFilter(k)} style={{
                    padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer',
                    border:'1px solid #E0D5E0',
                    background:filter===k?'#714B67':'#fff',
                    color:filter===k?'#fff':'#6C757D'
                  }}>{l} ({k==='all'?rows.length:k==='valid'?summary.valid:summary.errors})</button>
                ))}
                <button onClick={() => { setStep('upload'); setRows([]); setErrors([]); if(fileRef.current) fileRef.current.value='' }}
                  style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                    cursor:'pointer', border:'1px solid #E0D5E0', background:'#fff', color:'#6C757D' }}>
                  Re-upload
                </button>
              </div>

              {/* Preview table */}
              <div style={{ maxHeight:320, overflowY:'auto', overflowX:'auto', border:'1px solid #E0D5E0', borderRadius:8 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ background:'#F8F4F8', position:'sticky', top:0 }}>
                      <th style={{ padding:'6px 8px', textAlign:'left', fontWeight:700, color:'#714B67', minWidth:40 }}>#</th>
                      <th style={{ padding:'6px 8px', textAlign:'center', fontWeight:700, minWidth:60 }}>Status</th>
                      {tmpl.columns.map(c=>(
                        <th key={c.key} style={{ padding:'6px 8px', textAlign:'left', fontWeight:700,
                          color: c.required?'#856404':'#495057', minWidth:100, whiteSpace:'nowrap' }}>
                          {c.label}{c.required&&' *'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row,i)=>(
                      <tr key={i} style={{
                        borderTop:'1px solid #F0EEEB',
                        background: row._hasError?'#FFF5F5':i%2===0?'#fff':'#FAFAFA'
                      }}>
                        <td style={{ padding:'5px 8px', color:'#6C757D', fontFamily:'DM Mono,monospace' }}>{row._rowNum}</td>
                        <td style={{ padding:'5px 8px', textAlign:'center' }}>
                          {row._hasError
                            ? <span style={{ background:'#F8D7DA', color:'#721C24', padding:'1px 6px', borderRadius:8, fontSize:10, fontWeight:700 }}>Error</span>
                            : <span style={{ background:'#D4EDDA', color:'#155724', padding:'1px 6px', borderRadius:8, fontSize:10, fontWeight:700 }}>Valid</span>}
                        </td>
                        {tmpl.columns.map(c=>(
                          <td key={c.key} style={{ padding:'5px 8px', maxWidth:160,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                            color: !row[c.key]&&c.required?'#DC3545':'#333',
                            fontWeight: !row[c.key]&&c.required?700:400 }}>
                            {row[c.key] || (c.required?'MISSING':'—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, marginTop:14, alignItems:'center' }}>
                <button onClick={doImport} disabled={saving || summary.valid === 0}
                  className="btn btn-p sd-bsm">
                  {saving ? 'Importing...' : `Import ${summary.valid} Valid Rows`}
                </button>
                {summary.errors > 0 && (
                  <div style={{ fontSize:12, color:'#856404', fontWeight:600 }}>
                    {summary.errors} rows with errors will be skipped
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: DONE ── */}
          {step === 'done' && result && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>{result.failed>0?'⚠':'✅'}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:20,
                color:result.failed>0?'#856404':'#155724', marginBottom:8 }}>
                Import Complete!
              </div>
              <div style={{ fontSize:14, color:'#6C757D', marginBottom:20 }}>
                {result.imported} records imported successfully
                {result.failed > 0 && ` · ${result.failed} failed`}
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button className="btn btn-p sd-bsm" onClick={onClose}>Close & Refresh</button>
                <button className="btn btn-s sd-bsm" onClick={()=>{ setStep('upload'); setRows([]); setErrors([]); setResult(null) }}>
                  Import More
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
