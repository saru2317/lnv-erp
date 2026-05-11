import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

// ── Complete FTA Country → Agreement mapping ──────────────────────
const FTA_MAP = {
  // CEPA / CEPA-type
  'UAE':          { agreement:'CEPA',   full:'India-UAE CEPA',                   type:'preferential', docLabel:'CEPA Certificate of Origin'  },
  'Mauritius':    { agreement:'CECPA',  full:'India-Mauritius CECPA',            type:'preferential', docLabel:'CECPA Certificate of Origin'  },
  'Australia':    { agreement:'ECTA',   full:'India-Australia ECTA',             type:'preferential', docLabel:'ECTA Certificate of Origin'   },
  'Japan':        { agreement:'IJCEPA', full:'India-Japan CEPA',                 type:'preferential', docLabel:'IJCEPA Certificate of Origin' },
  'South Korea':  { agreement:'IKCEPA', full:'India-Korea CEPA',                 type:'preferential', docLabel:'IKCEPA Certificate of Origin' },
  'Singapore':    { agreement:'CECA',   full:'India-Singapore CECA',             type:'preferential', docLabel:'CECA Certificate of Origin'   },
  'Malaysia':     { agreement:'IMCECA', full:'India-Malaysia CECA',              type:'preferential', docLabel:'IMCECA Certificate of Origin' },
  'New Zealand':  { agreement:'FTA',    full:'India-New Zealand FTA',            type:'preferential', docLabel:'FTA Certificate of Origin'    },
  'Georgia':      { agreement:'CEPA',   full:'India-Georgia CEPA',               type:'preferential', docLabel:'CEPA Certificate of Origin'   },
  'Israel':       { agreement:'FTA',    full:'India-Israel FTA',                 type:'preferential', docLabel:'FTA Certificate of Origin'    },
  // ASEAN
  'Thailand':     { agreement:'ASEAN',  full:'India-ASEAN FTA',                  type:'preferential', docLabel:'ASEAN Certificate of Origin'  },
  'Vietnam':      { agreement:'ASEAN',  full:'India-ASEAN FTA',                  type:'preferential', docLabel:'ASEAN Certificate of Origin'  },
  'Indonesia':    { agreement:'ASEAN',  full:'India-ASEAN FTA',                  type:'preferential', docLabel:'ASEAN Certificate of Origin'  },
  'Philippines':  { agreement:'ASEAN',  full:'India-ASEAN FTA',                  type:'preferential', docLabel:'ASEAN Certificate of Origin'  },
  // SAARC / Bilateral
  'Sri Lanka':    { agreement:'ISFTA',  full:'India-Sri Lanka FTA',              type:'preferential', docLabel:'ISFTA Certificate of Origin'  },
  'Bangladesh':   { agreement:'SAFTA',  full:'SAARC Free Trade Agreement',       type:'preferential', docLabel:'SAFTA Certificate of Origin'  },
  'Nepal':        { agreement:'SAFTA',  full:'SAARC Free Trade Agreement',       type:'preferential', docLabel:'SAFTA Certificate of Origin'  },
  // Non-FTA
  'USA':          { agreement:null, full:'No FTA with India',                    type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'UK':           { agreement:null, full:'FTA under negotiation',                type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'Germany':      { agreement:null, full:'EU-India FTA under negotiation',       type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'France':       { agreement:null, full:'EU-India FTA under negotiation',       type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'Netherlands':  { agreement:null, full:'EU-India FTA under negotiation',       type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'China':        { agreement:null, full:'No FTA with India',                    type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'Saudi Arabia': { agreement:null, full:'GCC-India FTA under negotiation',      type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'Qatar':        { agreement:null, full:'GCC-India FTA under negotiation',      type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
  'Other':        { agreement:null, full:'Check DGFT for applicable FTA',        type:'non-preferential', docLabel:'Non-Preferential Certificate of Origin' },
}

const ALL_COUNTRIES = Object.keys(FTA_MAP)
const PORTS_LOADING = ['Chennai','Tuticorin','Mumbai','Nhava Sheva','Mundra','Cochin','Vishakhapatnam']

const DOC_TYPES = [
  { key:'coo',      label:'Certificate of Origin', icon:'\uD83C\uDF93', desc:'Auto-selects FTA/non-preferential based on country' },
  { key:'proforma', label:'Proforma Invoice',       icon:'\uD83D\uDCCB', desc:'Pre-shipment invoice for buyer'                     },
  { key:'packing',  label:'Packing List',           icon:'\uD83D\uDCE6', desc:'Carton-wise item and weight details'                },
]

const STATUS_CFG = {
  ISSUED:    { bg:'#D4EDDA', c:'#155724' },
  DRAFT:     { bg:'#F5F5F5', c:'#666'    },
  CANCELLED: { bg:'#F8D7DA', c:'#721C24' },
}

const STATIC_INV = [
  { id:1, invoiceNo:'INV-2026-0021', customerName:'ABC Exports LLC',  grandTotal:485000, invoiceDate:'2026-04-10' },
  { id:2, invoiceNo:'INV-2026-0019', customerName:'Gulf Trading Co.', grandTotal:620000, invoiceDate:'2026-04-05' },
  { id:3, invoiceNo:'INV-2026-0015', customerName:'Lanka Industries', grandTotal:290000, invoiceDate:'2026-03-28' },
]

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function FTADocuments() {
  const [tab,       setTab]       = useState('issue')
  const [docType,   setDocType]   = useState('coo')
  const [invoices,  setInvoices]  = useState(STATIC_INV)
  const [records,   setRecords]   = useState([])
  const [selInv,    setSelInv]    = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [packLines, setPackLines] = useState([])
  const [form,      setForm]      = useState({
    country:'UAE', portOfLoading:'Chennai', destinationPort:'',
    vesselFlight:'', blNo:'', blDate:'', remarks:''
  })

  // Auto-detect FTA info based on selected country
  const ftaInfo = FTA_MAP[form.country] || FTA_MAP['Other']
  const isPref  = ftaInfo.type === 'preferential'

  useEffect(() => {
    fetch(`${BASE_URL}/sd/invoices?supplyType=export`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>{ const a=d.data||d; if(Array.isArray(a)&&a.length) setInvoices(a) })
      .catch(()=>{})
    fetch(`${BASE_URL}/sd/fta-documents`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setRecords(Array.isArray(d.data)?d.data:[]))
      .catch(()=>{})
  }, [])

  const selectInv = inv => {
    setSelInv(inv)
    const lines = inv.lines||[{itemName:'Processed Parts',qty:100,unit:'NOS'}]
    setPackLines(lines.map((l,i)=>({...l,grossWeight:'',netWeight:'',cartons:1,pkgNo:i+1})))
  }

  const generate = async () => {
    if (!selInv) return toast.error('Select an invoice first')
    setSaving(true)
    try {
      const payload = {
        ...form, docType,
        ftaAgreement: ftaInfo.agreement,
        ftaFull:      ftaInfo.full,
        docLabel:     ftaInfo.docLabel,
        isPreferential: isPref,
        invoiceId:    selInv.id,
        invoiceNo:    selInv.invoiceNo,
        customerName: selInv.customerName,
        packLines:    docType==='packing' ? packLines : undefined,
      }
      const res = await fetch(`${BASE_URL}/sd/fta-documents`, {
        method:'POST', headers: hdr(), body: JSON.stringify(payload)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error||'Failed')
      toast.success(`${ftaInfo.docLabel} generated for ${selInv.invoiceNo}!`)
      setRecords(r=>[d.data||{...payload,id:Date.now(),status:'ISSUED',createdAt:new Date().toISOString()},...r])
      setSelInv(null)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            FTA / COO Export Documents
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Free Trade Agreement Certificate of Origin · Proforma Invoice · Packing List
          </div>
        </div>
        {/* FTA country count badge */}
        <div style={{display:'flex',gap:8}}>
          <span style={{padding:'4px 12px',background:'#D4EDDA',color:'#155724',borderRadius:20,fontSize:11,fontWeight:700}}>
            FTA Countries: {Object.values(FTA_MAP).filter(v=>v.type==='preferential').length}
          </span>
          <span style={{padding:'4px 12px',background:'#FFF3CD',color:'#856404',borderRadius:20,fontSize:11,fontWeight:700}}>
            Non-FTA: {Object.values(FTA_MAP).filter(v=>v.type==='non-preferential').length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:14,background:'#F0EEEB',borderRadius:8,padding:'5px 8px',width:'fit-content'}}>
        {[['issue','\uD83D\uDCCB Issue Document'],['records','\uD83D\uDCC1 FTA Register'],['guide','\uD83C\uDF0D FTA Guide']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:'6px 16px',borderRadius:6,fontSize:12,
            fontWeight:600,cursor:'pointer',border:'none',
            background:tab===k?'#714B67':'transparent',color:tab===k?'#fff':'#6C757D'}}>{l}</button>
        ))}
      </div>

      {/* ISSUE DOCUMENT TAB */}
      {tab==='issue'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

          {/* LEFT */}
          <div>
            {/* Step 1 — Invoice */}
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Step 1 — Select Export Invoice</div>
              {invoices.map(inv=>(
                <div key={inv.id} onClick={()=>selectInv(inv)}
                  style={{padding:'10px 14px',borderRadius:8,marginBottom:8,cursor:'pointer',
                    border:`2px solid ${selInv?.id===inv.id?'#714B67':'#E0D5E0'}`,
                    background:selInv?.id===inv.id?'#F8F4F8':'#fff'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:700,fontFamily:'DM Mono,monospace',color:'#714B67',fontSize:12}}>{inv.invoiceNo}</div>
                      <div style={{fontSize:12,color:'#495057',marginTop:2}}>{inv.customerName}</div>
                      <div style={{fontSize:11,color:'#6C757D'}}>
                        {inv.invoiceDate?new Date(inv.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):''}
                      </div>
                    </div>
                    <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#155724'}}>
                      {INR(inv.grandTotal||0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Step 2 — Document Type */}
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
              <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Step 2 — Document Type</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {DOC_TYPES.map(t=>(
                  <div key={t.key} onClick={()=>setDocType(t.key)}
                    style={{padding:'10px 14px',borderRadius:8,cursor:'pointer',
                      border:`2px solid ${docType===t.key?'#714B67':'#E0D5E0'}`,
                      background:docType===t.key?'#EDE0EA':'#fff',
                      display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:22}}>{t.icon}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:'#714B67'}}>
                        {t.key==='coo' ? (selInv ? ftaInfo.docLabel : t.label) : t.label}
                      </div>
                      <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            {/* Country + FTA detection */}
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Step 3 — Destination & Shipment</div>

              {/* Country selector with FTA auto-detect */}
              <div style={{marginBottom:12}}>
                <label style={lbl}>Destination Country</label>
                <select style={{...inp,cursor:'pointer'}} value={form.country}
                  onChange={e=>setForm(p=>({...p,country:e.target.value}))}>
                  <optgroup label="--- FTA Countries (Preferential Rate) ---">
                    {ALL_COUNTRIES.filter(c=>FTA_MAP[c].type==='preferential').map(c=>(
                      <option key={c} value={c}>{c} — {FTA_MAP[c].agreement}</option>
                    ))}
                  </optgroup>
                  <optgroup label="--- Non-FTA Countries (Standard Rate) ---">
                    {ALL_COUNTRIES.filter(c=>FTA_MAP[c].type==='non-preferential').map(c=>(
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                </select>

                {/* FTA Info banner — auto-updates */}
                <div style={{marginTop:8,padding:'10px 14px',borderRadius:8,
                  background:isPref?'#D4EDDA':'#FFF3CD',
                  border:`1px solid ${isPref?'#C3E6CB':'#FFEEBA'}`}}>
                  <div style={{fontWeight:700,fontSize:12,color:isPref?'#155724':'#856404',marginBottom:4}}>
                    {isPref ? '\u2713 FTA Available' : '\u26a0 No FTA — Non-Preferential COO'}
                  </div>
                  <div style={{fontSize:11,color:isPref?'#155724':'#856404'}}>
                    <strong>Agreement:</strong> {ftaInfo.agreement||'None'}<br/>
                    <strong>Full Name:</strong> {ftaInfo.full}<br/>
                    <strong>Document:</strong> {ftaInfo.docLabel}
                  </div>
                  {isPref&&(
                    <div style={{fontSize:10,color:'#155724',marginTop:6,fontStyle:'italic'}}>
                      Preferential rate applicable → buyer saves customs duty
                    </div>
                  )}
                </div>
              </div>

              {/* Shipment details */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div>
                  <label style={lbl}>Port of Loading</label>
                  <select style={{...inp,cursor:'pointer'}} value={form.portOfLoading}
                    onChange={e=>setForm(p=>({...p,portOfLoading:e.target.value}))}>
                    {PORTS_LOADING.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Destination Port</label>
                  <input style={inp} value={form.destinationPort}
                    onChange={e=>setForm(p=>({...p,destinationPort:e.target.value}))}
                    placeholder="Dubai / Jebel Ali / Sydney"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div>
                  <label style={lbl}>Vessel / Flight No.</label>
                  <input style={inp} value={form.vesselFlight}
                    onChange={e=>setForm(p=>({...p,vesselFlight:e.target.value}))}
                    placeholder="MSC Vessel / EK-522"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div>
                  <label style={lbl}>BL / AWB No.</label>
                  <input style={inp} value={form.blNo}
                    onChange={e=>setForm(p=>({...p,blNo:e.target.value}))}
                    placeholder="MSCUCHN123456"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div>
                  <label style={lbl}>BL Date</label>
                  <input type="date" style={inp} value={form.blDate}
                    onChange={e=>setForm(p=>({...p,blDate:e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>Remarks</label>
                  <input style={inp} value={form.remarks}
                    onChange={e=>setForm(p=>({...p,remarks:e.target.value}))}
                    placeholder="Special instructions..."
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
              </div>

              {/* Packing lines for packing list */}
              {docType==='packing'&&packLines.length>0&&(
                <div style={{marginTop:10}}>
                  <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:8}}>Packing Details</div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                    <thead><tr style={{background:'#F8F4F8'}}>
                      {['Item','Qty','Gross Wt','Net Wt','Cartons'].map(h=>(
                        <th key={h} style={{padding:'5px 6px',textAlign:'left',fontWeight:700,fontSize:10,color:'#714B67'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {packLines.map((l,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                          <td style={{padding:'4px 6px',fontWeight:600,fontSize:11}}>{l.itemName}</td>
                          <td style={{padding:'4px 6px',fontSize:11}}>{l.qty} {l.unit}</td>
                          <td style={{padding:'3px 4px'}}><input type="number" style={{...inp,width:60,padding:'3px 5px',fontSize:11}} value={l.grossWeight} placeholder="kg" onChange={e=>setPackLines(pl=>pl.map((x,j)=>j===i?{...x,grossWeight:e.target.value}:x))}/></td>
                          <td style={{padding:'3px 4px'}}><input type="number" style={{...inp,width:60,padding:'3px 5px',fontSize:11}} value={l.netWeight}   placeholder="kg" onChange={e=>setPackLines(pl=>pl.map((x,j)=>j===i?{...x,netWeight:e.target.value}:x))}/></td>
                          <td style={{padding:'3px 4px'}}><input type="number" style={{...inp,width:50,padding:'3px 5px',fontSize:11}} value={l.cartons}     min="1"  onChange={e=>setPackLines(pl=>pl.map((x,j)=>j===i?{...x,cartons:e.target.value}:x))}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Selected invoice summary */}
            {selInv&&(
              <div style={{background:'#EDE0EA',borderRadius:8,padding:12,marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <div>
                    <div style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{selInv.invoiceNo}</div>
                    <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>{selInv.customerName}</div>
                  </div>
                  <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#155724'}}>{INR(selInv.grandTotal||0)}</div>
                </div>
                <div style={{marginTop:8,fontSize:11,fontWeight:700,color:'#714B67'}}>
                  Will generate: {ftaInfo.docLabel}
                </div>
              </div>
            )}

            <button onClick={generate} disabled={saving||!selInv}
              style={{width:'100%',padding:'12px',fontWeight:700,fontSize:13,cursor:selInv?'pointer':'not-allowed',
                border:'none',borderRadius:8,color:'#fff',background:selInv?'#714B67':'#CCC'}}>
              {saving?'Generating...':`Generate ${selInv ? ftaInfo.docLabel : 'Document'}`}
            </button>
          </div>
        </div>
      )}

      {/* FTA REGISTER TAB */}
      {tab==='records'&&(
        records.length===0 ? (
          <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
            <div style={{fontSize:28,marginBottom:8}}>\uD83D\uDCDC</div>
            <div style={{fontWeight:700}}>No FTA documents issued yet</div>
            <div style={{fontSize:12,marginTop:4}}>Issue documents from the "Issue Document" tab</div>
          </div>
        ) : (
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                {['Document Type','Agreement','Invoice','Customer','Country','BL No','Date','Status'].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:'#714B67'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {records.map((r,i)=>{
                  const sc = STATUS_CFG[r.status]||STATUS_CFG.ISSUED
                  const fta= FTA_MAP[r.country]||FTA_MAP['Other']
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'9px 12px',fontSize:11,fontWeight:600}}>{r.docLabel||r.docType}</td>
                      <td style={{padding:'9px 12px'}}>
                        {fta.agreement
                          ? <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:'#D4EDDA',color:'#155724'}}>{fta.agreement}</span>
                          : <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:'#FFF3CD',color:'#856404'}}>Non-Preferential</span>
                        }
                      </td>
                      <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67',fontSize:11}}>{r.invoiceNo}</td>
                      <td style={{padding:'9px 12px',fontWeight:600}}>{r.customerName}</td>
                      <td style={{padding:'9px 12px',fontSize:11}}>{r.country}</td>
                      <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{r.blNo||'—'}</td>
                      <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>
                        {r.createdAt?new Date(r.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}):'—'}
                      </td>
                      <td style={{padding:'9px 12px'}}>
                        <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:sc.bg,color:sc.c}}>{r.status||'ISSUED'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* FTA GUIDE TAB */}
      {tab==='guide'&&(
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',background:'#F8F4F8',borderBottom:'1px solid #E0D5E0',fontWeight:700,fontSize:13,color:'#714B67'}}>
            India FTA Country Guide — Agreement Reference
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
              {['Country','Agreement','Full Name','COO Document','Type'].map(h=>(
                <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:'#714B67'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {Object.entries(FTA_MAP).map(([country, info], i)=>(
                <tr key={country} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                  <td style={{padding:'8px 12px',fontWeight:600}}>{country}</td>
                  <td style={{padding:'8px 12px'}}>
                    {info.agreement
                      ? <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:'#D4EDDA',color:'#155724'}}>{info.agreement}</span>
                      : <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:'#F5F5F5',color:'#666'}}>None</span>
                    }
                  </td>
                  <td style={{padding:'8px 12px',fontSize:11,color:'#495057'}}>{info.full}</td>
                  <td style={{padding:'8px 12px',fontSize:11,fontWeight:600,color:'#714B67'}}>{info.docLabel}</td>
                  <td style={{padding:'8px 12px'}}>
                    <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                      background:info.type==='preferential'?'#CCE5FF':'#FFF3CD',
                      color:info.type==='preferential'?'#004085':'#856404'}}>
                      {info.type==='preferential'?'Preferential':'Non-Preferential'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
