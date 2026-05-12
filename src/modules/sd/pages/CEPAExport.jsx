import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { sdApi } from '../services/sdApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// CEPA Countries and their agreements with India
const CEPA_COUNTRIES = [
  { code:'AE', name:'UAE',          agreement:'India-UAE CEPA',          effectiveDate:'01-May-2022', dutyReduction:'Up to 100% for most goods' },
  { code:'AU', name:'Australia',    agreement:'India-Australia ECTA',     effectiveDate:'29-Dec-2022', dutyReduction:'85% lines to 0% over 5-10 yrs' },
  { code:'MU', name:'Mauritius',    agreement:'India-Mauritius CECPA',    effectiveDate:'01-Apr-2021', dutyReduction:'Preferential duty on select goods' },
  { code:'JP', name:'Japan',        agreement:'India-Japan CEPA (IJCEPA)',effectiveDate:'01-Aug-2011', dutyReduction:'94% lines covered' },
  { code:'KR', name:'South Korea',  agreement:'India-Korea CEPA',         effectiveDate:'01-Jan-2010', dutyReduction:'75% lines to 0% over 8 yrs' },
  { code:'MY', name:'Malaysia',     agreement:'India-Malaysia CECA',      effectiveDate:'01-Jul-2011', dutyReduction:'80%+ goods covered' },
  { code:'SG', name:'Singapore',    agreement:'India-Singapore CECA',     effectiveDate:'01-Aug-2005', dutyReduction:'Comprehensive coverage' },
  { code:'TH', name:'Thailand',     agreement:'India-ASEAN FTA',          effectiveDate:'01-Jan-2010', dutyReduction:'80% goods to 0% by 2022' },
  { code:'GB', name:'UK',           agreement:'India-UK FTA (ongoing)',   effectiveDate:'Negotiating', dutyReduction:'TBD' },
]

// CEPA Certificate of Origin types
const COO_TYPES = [
  { code:'FORM-I',   name:'Form I (UAE CEPA)',      country:'AE' },
  { code:'FORM-D',   name:'Form D (ASEAN)',          country:'TH' },
  { code:'FORM-E',   name:'Form E (India-Japan)',    country:'JP' },
  { code:'FORM-AIFTA',name:'AIFTA Certificate',     country:'MY' },
  { code:'COO-UAE',  name:'UAE CEPA Certificate',   country:'AE' },
  { code:'COO-AU',   name:'ECTA Certificate (AU)',   country:'AU' },
]

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK_CERT = {
  invoiceNo:'', invoiceDate:'', buyerName:'', buyerCountry:'AE',
  currency:'USD', cooType:'COO-UAE',
  originCriteria:'WO', remarks:'',
}

const BLANK_LINE = { goodsDescription:'', hsCode:'', quantity:'', unit:'KGS', fobValue:'' }

export default function CEPAExport() {
  const now = new Date()
  const [tab,       setTab]       = useState('register')
  const [certs,     setCerts]     = useState([])
  const [invoices,  setInvoices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [month,     setMonth]     = useState(now.getMonth()+1)
  const [year,      setYear]      = useState(now.getFullYear())
  const [showForm,      setShowForm]      = useState(false)
  const [form,          setForm]          = useState(BLANK_CERT)
  const [lines,         setLines]         = useState([{ ...BLANK_LINE }])
  const [saving,        setSaving]        = useState(false)
  const [countryF,      setCountryF]      = useState('all')
  const [certNo,        setCertNo]        = useState(null)
  const [invLoading,    setInvLoading]    = useState(false)
  const [selInvoice,    setSelInvoice]    = useState(null)

  // Proforma Invoice state
  const [pfInv,         setPfInv]         = useState(null) // selected invoice for proforma
  const [pfExtra,       setPfExtra]       = useState({ validity:'30 days', payTerms:'100% Advance', delivTerms:'FOB Chennai', bankDetails:'HDFC Bank — A/c: 50100123456 — IFSC: HDFC0001234' })

  // Packing List state
  const [plInv,         setPlInv]         = useState(null)
  const [plLines,       setPlLines]       = useState([])
  const [plMeta,        setPlMeta]        = useState({ totalGrossWt:'', totalNetWt:'', totalCartons:'', marksNos:'LNV/EXP/2026', containerNo:'', vesselName:'', portLoading:'Chennai Sea Port', portDischarge:'' })

  // Non-Preferential COO state
  const [npInv,         setNpInv]         = useState(null)
  const [npForm,        setNpForm]        = useState({ exporterName:'LNV Manufacturing Pvt. Ltd.', exporterAddress:'Ranipet, Tamil Nadu — 632 401', consigneeName:'', consigneeCountry:'US', declarationText:'The undersigned hereby declares that the above details and statements are correct, that all goods were produced in India.', authorisedBy:'', designation:'Director / Authorised Signatory' })
  const [npCerts,       setNpCerts]       = useState([])


  // Auto-load invoice data when invoice number is selected
  const selectInvoice = async (invoiceNo) => {
    setForm(p => ({ ...p, invoiceNo }))
    setSelInvoice(null)
    if (!invoiceNo) return
    setInvLoading(true)
    try {
      // Try to find in already loaded invoices first
      const found = invoices.find(inv => inv.invoiceNo === invoiceNo)
      if (found) {
        populateFromInvoice(found)
        return
      }
      // Else fetch from API
      const r = await fetch(`${BASE_URL}/sd/invoices/${invoiceNo}`, { headers: hdr2() })
      const d = await r.json()
      const inv = d.data || d
      if (inv?.invoiceNo) populateFromInvoice(inv)
    } catch {}
    finally { setInvLoading(false) }
  }

  const populateFromInvoice = (inv) => {
    setSelInvoice(inv)
    setForm(p => ({
      ...p,
      invoiceNo:   inv.invoiceNo,
      invoiceDate: inv.invoiceDate?.split('T')[0] || '',
      buyerName:   inv.customerName || inv.buyer || '',
      buyerCountry: detectCountry(inv.customerName || ''),
      currency:    inv.currency || 'USD',
    }))
    // Populate line items from invoice lines
    const invLines = inv.lines || inv.items || []
    if (invLines.length > 0) {
      setLines(invLines.map(l => ({
        goodsDescription: l.description || l.itemName || l.name || l.desc || '',
        hsCode:           l.hsn || l.hsnCode || l.hsCode || '',
        quantity:         l.qty || l.quantity || '',
        unit:             l.unit || l.uom || 'NOS',
        fobValue:         l.taxable || l.amount || l.total || '',
        originCriteria:   'WO',
      })))
    } else {
      // No line items in invoice — keep one blank line
      setLines([{ ...BLANK_LINE,
        fobValue: inv.taxableAmt || inv.grandTotal || inv.totalAmt || ''
      }])
    }
    toast.success(`Invoice ${inv.invoiceNo} loaded — verify items and issue certificate`)
  }

  // Auto-detect country from customer name
  const detectCountry = (name) => {
    const n = name.toLowerCase()
    if (n.includes('dubai') || n.includes('uae') || n.includes('abu dhabi') || n.includes('sharjah')) return 'AE'
    if (n.includes('australia') || n.includes('sydney') || n.includes('melbourne')) return 'AU'
    if (n.includes('japan') || n.includes('tokyo') || n.includes('osaka')) return 'JP'
    if (n.includes('korea') || n.includes('seoul')) return 'KR'
    if (n.includes('singapore') || n.includes('sgp')) return 'SG'
    if (n.includes('malaysia') || n.includes('kuala')) return 'MY'
    if (n.includes('uk') || n.includes('london') || n.includes('britain')) return 'GB'
    return 'AE' // default
  }

  // Load export invoices from SD
  const load = useCallback(async () => {
    setLoading(true)
    // Always load certs first
    const saved = JSON.parse(localStorage.getItem('lnv_cepa_certs') || '[]')
    setCerts(Array.isArray(saved) ? saved : [])
    try {
      const r = await fetch(`${BASE_URL}/sd/invoices?month=${month}&year=${year}`, { headers: hdr2() })
      if (!r.ok) { setInvoices([]); setLoading(false); return }
      const d   = await r.json()
      const all = Array.isArray(d.data?.data) ? d.data.data
                : Array.isArray(d.data)       ? d.data
                : Array.isArray(d)            ? d
                : []
      setInvoices(all)
    } catch {
      setInvoices([])
    }
    setLoading(false)
  }, [month, year])

  useEffect(() => { load() }, [load])

  const F = k => ({ value:form[k]??'', onChange:e=>setForm(p=>({...p,[k]:e.target.value})) })

  const generateCertNo = () => {
    const d = new Date()
    return `LNV/CEPA/${d.getFullYear()}/${String(certs.length+1).padStart(4,'0')}`
  }

  const saveCert = () => {
    if (!form.invoiceNo || !form.buyerName)
      return toast.error('Invoice No and Buyer Name required')
    if (!lines.some(l => l.goodsDescription && l.fobValue))
      return toast.error('Add at least one item with description and FOB value')

    const totalFOBLines = lines.reduce((a,l) => a + parseFloat(l.fobValue||0), 0)
    const no   = generateCertNo()
    const cert = { ...form, lines, totalFOB: totalFOBLines, certNo:no, issuedDate:new Date().toISOString(), status:'issued' }
    const updated = [cert, ...certs]
    localStorage.setItem('lnv_cepa_certs', JSON.stringify(updated))
    setCerts(updated)
    setCertNo(no)
    setShowForm(false)
    setForm(BLANK_CERT)
    setLines([{ ...BLANK_LINE }])
    toast.success(`CEPA Certificate ${no} issued!`)
  }

  const exportCSV = () => {
    const rows = [
      ['Cert No','Invoice No','Invoice Date','Buyer Name','Country','Goods Description',
       'HS Code','Qty','Unit','FOB Value','Currency','COO Type','Origin Criteria','Status'],
      ...certs.map(c=>[c.certNo,c.invoiceNo,c.invoiceDate,c.buyerName,c.buyerCountry,
        c.goodsDescription,c.hsCode,c.quantity,c.unit,c.fobValue,c.currency,c.cooType,c.originCriteria,c.status])
    ]
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')
    const a   = document.createElement('a')
    a.href    = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv)
    a.download= `CEPA_Export_Register_${year}-${String(month).padStart(2,'0')}.csv`
    a.click()
  }

  const filteredCerts = certs.filter(c => countryF==='all' || c.buyerCountry===countryF)
  const totalFOB = filteredCerts.reduce((a,c) =>
    a + (c.totalFOB || parseFloat(c.fobValue||0)), 0)

  const TABS = [
    { key:'register',  label:'\uD83D\uDCCB CEPA Register'       },
    { key:'proforma',  label:'\uD83D\uDCC4 Proforma Invoice'    },
    { key:'packing',   label:'\uD83D\uDCE6 Packing List'        },
    { key:'npcoo',     label:'\uD83C\uDF10 Non-Preferential COO'},
    { key:'invoices',  label:'\uD83E\uDDFE Export Invoices'     },
    { key:'countries', label:'\uD83C\uDF0D CEPA Countries'      },
    { key:'guide',     label:'\u2139\uFE0F How to Use'           },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">CEPA Export Register
          <small> Certificate of Origin · Preferential Duty · Free Trade Agreements</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-p sd-bsm" onClick={()=>{ setShowForm(true); setForm(BLANK_CERT); setLines([{...BLANK_LINE}]); setCertNo(null) }}>
            + Issue CEPA Certificate
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{background:'linear-gradient(135deg,#0C5460,#155724)',borderRadius:10,
        padding:'14px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>
            CEPA — Comprehensive Economic Partnership Agreement
          </div>
          <div style={{fontSize:12,opacity:.85}}>
            India has active CEPAs with UAE, Australia, Japan, Korea, Singapore and ASEAN nations.
            CEPA Certificate of Origin (COO) gives your buyer preferential / zero import duty in their country.
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0,marginLeft:20}}>
          <div style={{fontSize:11,opacity:.7}}>Certs issued</div>
          <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:28}}>{certs.length}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'green',  label:'CEPA Certs Issued',  val:certs.length,           sub:'This period' },
          { cls:'blue',   label:'Total FOB Value',    val:`$${totalFOB.toLocaleString('en-IN')}`, sub:'USD export value' },
          { cls:'purple', label:'Export Invoices',    val:invoices.length,         sub:'Zero-rated supply' },
          { cls:'orange', label:'CEPA Countries',     val:CEPA_COUNTRIES.length,   sub:'Active agreements' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,padding:'6px 8px',
        background:'#F0EEEB',borderRadius:10,border:'1px solid #E0D5E0'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            padding:'6px 16px',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer',
            border:'none',transition:'all .15s',
            background:tab===t.key?'#0C5460':'transparent',
            color:tab===t.key?'#fff':'#6C757D',
            boxShadow:tab===t.key?'0 2px 8px #0C546055':'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Issue Certificate Form */}
      {showForm && (
        <div style={{background:'#fff',border:'2px solid #0C5460',borderRadius:10,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'#0C5460',marginBottom:16}}>
            Issue CEPA Certificate of Origin
          </div>

          {/* Step 1 — Select Invoice */}
          <div style={{background:'#D1ECF1',borderRadius:8,padding:14,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:12,color:'#0C5460',marginBottom:10}}>
              Step 1 — Select Export Invoice (data auto-loads)
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <div style={{gridColumn:'1/2'}}>
                <label style={lbl}>Select Invoice *</label>
                <select style={{...inp,cursor:'pointer',fontFamily:'DM Mono,monospace'}}
                  value={form.invoiceNo}
                  onChange={e=>selectInvoice(e.target.value)}>
                  <option value="">-- Select export invoice --</option>
                  {invoices.map(inv=>(
                    <option key={inv.invoiceNo} value={inv.invoiceNo}>
                      {inv.invoiceNo} · {inv.customerName} · {inv.grandTotal||inv.totalAmt||0}
                    </option>
                  ))}
                  {/* Manual entry option */}
                  <option value="MANUAL">-- Enter manually --</option>
                </select>
              </div>
              {form.invoiceNo === 'MANUAL' && (
                <div>
                  <label style={lbl}>Invoice No. (Manual)</label>
                  <input style={inp} value={form.invoiceNo === 'MANUAL' ? '' : form.invoiceNo}
                    onChange={e=>setForm(p=>({...p,invoiceNo:e.target.value}))}
                    placeholder="INV-2026-001"
                    onFocus={e=>e.target.style.borderColor='#0C5460'}
                    onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
              )}
              {invLoading && (
                <div style={{display:'flex',alignItems:'center',color:'#0C5460',fontSize:12,fontWeight:600}}>
                  Loading invoice data...
                </div>
              )}
            </div>

            {/* Auto-loaded invoice preview */}
            {selInvoice && (
              <div style={{marginTop:12,background:'#fff',borderRadius:6,padding:12,
                border:'1px solid #0C5460',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:2}}>Invoice Date</div>
                  <div style={{fontSize:12,fontWeight:700}}>{selInvoice.invoiceDate?new Date(selInvoice.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):form.invoiceDate}</div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:2}}>Buyer</div>
                  <div style={{fontSize:12,fontWeight:700}}>{selInvoice.customerName}</div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:2}}>Invoice Value</div>
                  <div style={{fontSize:12,fontWeight:700,color:'#0C5460'}}>₹{(selInvoice.grandTotal||selInvoice.totalAmt||0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:2}}>Line Items</div>
                  <div style={{fontSize:12,fontWeight:700,color:'#155724'}}>{(selInvoice.lines||selInvoice.items||[]).length || 1} item(s) loaded</div>
                </div>
                <div style={{gridColumn:'1/-1',background:'#D4EDDA',borderRadius:4,padding:'5px 10px',fontSize:11,color:'#155724',fontWeight:600}}>
                  ✓ Invoice data auto-populated below — verify HS codes, quantities and FOB values before issuing certificate
                </div>
              </div>
            )}
          </div>

          {/* Step 2 — Buyer + COO details */}
          <div style={{fontWeight:700,fontSize:12,color:'#0C5460',marginBottom:10}}>
            Step 2 — Verify / Edit Buyer Details
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Invoice Date</label>
              <input type="date" style={inp} value={form.invoiceDate}
                onChange={e=>setForm(p=>({...p,invoiceDate:e.target.value}))}/>
            </div>
            <div>
              <label style={lbl}>COO Certificate Type *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.cooType} onChange={e=>setForm(p=>({...p,cooType:e.target.value}))}>
                {COO_TYPES.map(c=><option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Currency</label>
              <select style={{...inp,cursor:'pointer'}} value={form.currency} onChange={e=>setForm(p=>({...p,currency:e.target.value}))}>
                {['USD','EUR','GBP','AED','JPY','SGD'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/3'}}>
              <label style={lbl}>Buyer / Importer Name *</label>
              <input style={inp} value={form.buyerName} onChange={e=>setForm(p=>({...p,buyerName:e.target.value}))}
                placeholder="ABC Trading LLC, Dubai"
                onFocus={e=>e.target.style.borderColor='#0C5460'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Destination Country *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.buyerCountry} onChange={e=>setForm(p=>({...p,buyerCountry:e.target.value}))}>
                {CEPA_COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Step 3 — Item lines */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:12,color:'#0C5460'}}>
              Step 3 — Verify Item Lines &amp; HS Codes
            </div>
            <button onClick={()=>setLines(l=>[...l,{...BLANK_LINE}])}
              style={{padding:'5px 14px',background:'#0C5460',color:'#fff',border:'none',
                borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              + Add Item
            </button>
          </div>
          <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{background:'#D1ECF1'}}>
                      <th style={{padding:'7px 10px',textAlign:'left',fontWeight:700,color:'#0C5460',width:'30%'}}>Goods Description *</th>
                      <th style={{padding:'7px 10px',textAlign:'left',fontWeight:700,color:'#0C5460',width:'15%'}}>HS Code</th>
                      <th style={{padding:'7px 10px',textAlign:'right',fontWeight:700,color:'#0C5460',width:'10%'}}>Qty</th>
                      <th style={{padding:'7px 10px',textAlign:'left',fontWeight:700,color:'#0C5460',width:'8%'}}>Unit</th>
                      <th style={{padding:'7px 10px',textAlign:'right',fontWeight:700,color:'#0C5460',width:'15%'}}>FOB Value *</th>
                      <th style={{padding:'7px 10px',textAlign:'center',fontWeight:700,color:'#0C5460',width:'10%'}}>Origin</th>
                      <th style={{width:36}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i} style={{borderTop:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                        <td style={{padding:'5px 6px'}}>
                          <input style={{...inp,fontSize:11}} value={line.goodsDescription}
                            onChange={e=>setLines(ls=>ls.map((l,idx)=>idx===i?{...l,goodsDescription:e.target.value}:l))}
                            placeholder="Surface treated steel parts"
                            onFocus={e=>e.target.style.borderColor='#0C5460'}
                            onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                        </td>
                        <td style={{padding:'5px 6px'}}>
                          <input style={{...inp,fontSize:11,fontFamily:'DM Mono,monospace'}} value={line.hsCode}
                            onChange={e=>setLines(ls=>ls.map((l,idx)=>idx===i?{...l,hsCode:e.target.value}:l))}
                            placeholder="7326.90.99"
                            onFocus={e=>e.target.style.borderColor='#0C5460'}
                            onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                        </td>
                        <td style={{padding:'5px 6px'}}>
                          <input type="number" style={{...inp,fontSize:11,textAlign:'right'}} value={line.quantity}
                            onChange={e=>setLines(ls=>ls.map((l,idx)=>idx===i?{...l,quantity:e.target.value}:l))}
                            placeholder="100"
                            onFocus={e=>e.target.style.borderColor='#0C5460'}
                            onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                        </td>
                        <td style={{padding:'5px 6px'}}>
                          <select style={{...inp,fontSize:11,cursor:'pointer'}} value={line.unit}
                            onChange={e=>setLines(ls=>ls.map((l,idx)=>idx===i?{...l,unit:e.target.value}:l))}>
                            {['KGS','NOS','MTR','LTR','SET','PCS','BOX','TON'].map(u=><option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{padding:'5px 6px'}}>
                          <input type="number" style={{...inp,fontSize:11,textAlign:'right',fontFamily:'DM Mono,monospace'}} value={line.fobValue}
                            onChange={e=>setLines(ls=>ls.map((l,idx)=>idx===i?{...l,fobValue:e.target.value}:l))}
                            placeholder="50000"
                            onFocus={e=>e.target.style.borderColor='#0C5460'}
                            onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                        </td>
                        <td style={{padding:'5px 6px'}}>
                          <select style={{...inp,fontSize:10,cursor:'pointer'}} value={line.originCriteria||form.originCriteria}
                            onChange={e=>setLines(ls=>ls.map((l,idx)=>idx===i?{...l,originCriteria:e.target.value}:l))}>
                            {['WO','PE','PSR','RVC40','CTH'].map(o=><option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{padding:'5px 6px',textAlign:'center'}}>
                          {lines.length > 1 && (
                            <button onClick={()=>setLines(ls=>ls.filter((_,idx)=>idx!==i))}
                              style={{background:'#F8D7DA',border:'none',borderRadius:4,
                                color:'#721C24',cursor:'pointer',padding:'3px 7px',fontSize:13,fontWeight:700}}>
                              &times;
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{background:'#EDE0EA',borderTop:'2px solid #0C5460'}}>
                      <td colSpan={4} style={{padding:'7px 10px',fontWeight:700,fontSize:12,color:'#0C5460'}}>
                        Total — {lines.length} item{lines.length!==1?'s':''}
                      </td>
                      <td style={{padding:'7px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13,color:'#0C5460'}}>
                        {form.currency} {lines.reduce((a,l)=>a+parseFloat(l.fobValue||0),0).toLocaleString('en-IN',{minimumFractionDigits:2})}
                      </td>
                      <td colSpan={2}/>
                    </tr>
                  </tbody>
                </table>
              </div>

            <div style={{marginTop:12}}>
              <label style={lbl}>Remarks / Additional Notes</label>
              <input style={inp} {...F('remarks')} placeholder="Additional notes for customs..."
                onFocus={e=>e.target.style.borderColor='#0C5460'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>

          {/* Origin Criteria explanation */}
          <div style={{background:'#D1ECF1',borderRadius:6,padding:'8px 12px',marginBottom:12,fontSize:11,color:'#0C5460'}}>
            <strong>Origin Criteria:</strong> WO = Goods produced entirely in India · PSR = Meets product-specific rule of origin ·
            RVC40 = Minimum 40% regional value content · CTH = 4-digit HS code change from inputs to final product
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={saveCert} disabled={saving}
              style={{padding:'9px 24px',background:'#0C5460',color:'#fff',border:'none',
                borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {saving?'Issuing...':'\uD83C\uDF0D Issue CEPA Certificate'}
            </button>
            <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {certNo && (
        <div style={{background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:8,
          padding:'12px 16px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:700,color:'#155724',fontSize:14}}>
            \u2714 Certificate Issued: <span style={{fontFamily:'DM Mono,monospace'}}>{certNo}</span>
          </div>
          <button onClick={()=>setCertNo(null)}
            style={{background:'none',border:'none',cursor:'pointer',color:'#6C757D',fontSize:18}}>&times;</button>
        </div>
      )}

      {/* ── TAB: PROFORMA INVOICE ── */}
      {tab==='proforma' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <label style={lbl}>Select Invoice *</label>
              <select style={{...inp,cursor:'pointer',fontFamily:'DM Mono,monospace'}}
                value={pfInv?.invoiceNo||''}
                onChange={e=>{
                  const inv = invoices.find(i=>i.invoiceNo===e.target.value)
                  setPfInv(inv||null)
                  if(inv?.lines) setPlLines(inv.lines.map(l=>({...l,grossWt:'',netWt:'',cartons:'',marksNos:''})))
                }}>
                <option value="">-- Select invoice --</option>
                {invoices.map(inv=><option key={inv.invoiceNo} value={inv.invoiceNo}>{inv.invoiceNo} · {inv.customerName}</option>)}
              </select>
            </div>
            {pfInv && (
              <div style={{background:'#D4EDDA',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#155724'}}>
                <div style={{fontWeight:700,marginBottom:4}}>{pfInv.invoiceNo} loaded</div>
                <div>Buyer: {pfInv.customerName}</div>
                <div>Value: ₹{(pfInv.grandTotal||pfInv.totalAmt||0).toLocaleString('en-IN')}</div>
              </div>
            )}
          </div>

          {pfInv && (
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:20}}>
              {/* Proforma Header */}
              <div style={{textAlign:'center',borderBottom:'2px solid #0C5460',paddingBottom:14,marginBottom:16}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#0C5460'}}>PROFORMA INVOICE</div>
                <div style={{fontSize:12,color:'#6C757D',marginTop:4}}>LNV Manufacturing Pvt. Ltd. · Ranipet, Tamil Nadu · GSTIN: 33AABCL1234A1Z5</div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:'#0C5460',marginBottom:8}}>Exporter</div>
                  <div style={{fontSize:12,lineHeight:1.7}}>LNV Manufacturing Pvt. Ltd.<br/>Industrial Area, Ranipet<br/>Tamil Nadu — 632 401<br/>GSTIN: 33AABCL1234A1Z5<br/>IEC: AABCL1234</div>
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:'#0C5460',marginBottom:8}}>Consignee / Buyer</div>
                  <div style={{fontSize:12,lineHeight:1.7,fontWeight:600}}>{pfInv.customerName}</div>
                  <div style={{fontSize:11,color:'#6C757D'}}>Invoice No: {pfInv.invoiceNo}</div>
                  <div style={{fontSize:11,color:'#6C757D'}}>Date: {pfInv.invoiceDate?new Date(pfInv.invoiceDate).toLocaleDateString('en-IN'):''}</div>
                </div>
              </div>

              {/* Terms */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14,padding:12,background:'#F8F4F8',borderRadius:8}}>
                {[
                  ['Validity',      pfExtra.validity,    'validity'],
                  ['Payment Terms', pfExtra.payTerms,    'payTerms'],
                  ['Delivery Terms',pfExtra.delivTerms,  'delivTerms'],
                ].map(([l,v,k])=>(
                  <div key={k}>
                    <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:3}}>{l}</div>
                    <input style={{...inp,fontSize:11}} value={v}
                      onChange={e=>setPfExtra(p=>({...p,[k]:e.target.value}))}
                      onFocus={e=>e.target.style.borderColor='#0C5460'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                  </div>
                ))}
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'#6C757D',textTransform:'uppercase',marginBottom:3}}>Currency</div>
                  <select style={{...inp,fontSize:11,cursor:'pointer'}}>
                    {['USD','EUR','GBP','AED'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Line items */}
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:14}}>
                <thead>
                  <tr style={{background:'#0C5460',color:'#fff'}}>
                    <th style={{padding:'7px 10px',textAlign:'left'}}>Description of Goods</th>
                    <th style={{padding:'7px 10px',textAlign:'left'}}>HS Code</th>
                    <th style={{padding:'7px 10px',textAlign:'right'}}>Qty</th>
                    <th style={{padding:'7px 10px',textAlign:'left'}}>Unit</th>
                    <th style={{padding:'7px 10px',textAlign:'right'}}>Unit Price (USD)</th>
                    <th style={{padding:'7px 10px',textAlign:'right'}}>Amount (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {(pfInv.lines||pfInv.items||[{description:pfInv.customerName+' — as per order',qty:1,unit:'LOT',rate:pfInv.grandTotal||0,total:pfInv.grandTotal||0}]).map((l,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'6px 10px'}}>{l.description||l.itemName||l.name||'—'}</td>
                      <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace'}}>{l.hsn||l.hsnCode||'—'}</td>
                      <td style={{padding:'6px 10px',textAlign:'right'}}>{l.qty||l.quantity||1}</td>
                      <td style={{padding:'6px 10px'}}>{l.unit||l.uom||'NOS'}</td>
                      <td style={{padding:'6px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{parseFloat(l.rate||l.unitPrice||0).toFixed(2)}</td>
                      <td style={{padding:'6px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{parseFloat(l.total||l.taxable||l.amount||0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:'#EDE0EA',fontWeight:700,borderTop:'2px solid #0C5460'}}>
                    <td colSpan={5} style={{padding:'8px 10px',color:'#0C5460'}}>TOTAL FOB VALUE</td>
                    <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14,color:'#0C5460'}}>
                      USD {parseFloat(pfInv.grandTotal||pfInv.totalAmt||0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Bank details */}
              <div style={{background:'#F8F4F8',borderRadius:8,padding:12,marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:12,color:'#714B67',marginBottom:6}}>Bank Details for Payment</div>
                <textarea style={{...inp,height:60,resize:'none',fontSize:11}} value={pfExtra.bankDetails}
                  onChange={e=>setPfExtra(p=>({...p,bankDetails:e.target.value}))}/>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
                <div style={{fontSize:11,color:'#6C757D'}}>
                  This is a Proforma Invoice only — not a tax invoice.<br/>Subject to realization of payment.
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{borderTop:'1px solid #333',width:180,marginBottom:4}}></div>
                  <div style={{fontSize:11,fontWeight:700}}>For LNV Manufacturing Pvt. Ltd.</div>
                  <div style={{fontSize:10,color:'#6C757D'}}>Authorised Signatory</div>
                </div>
              </div>

              <div style={{marginTop:14,display:'flex',gap:8}}>
                <button onClick={()=>window.print()}
                  style={{padding:'8px 20px',background:'#0C5460',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Print / PDF
                </button>
              </div>
            </div>
          )}
          {!pfInv && (
            <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              Select an invoice above to generate Proforma Invoice
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PACKING LIST ── */}
      {tab==='packing' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <label style={lbl}>Select Invoice *</label>
              <select style={{...inp,cursor:'pointer',fontFamily:'DM Mono,monospace'}}
                value={plInv?.invoiceNo||''}
                onChange={e=>{
                  const inv = invoices.find(i=>i.invoiceNo===e.target.value)
                  setPlInv(inv||null)
                  if(inv?.lines) setPlLines(inv.lines.map(l=>({...l,grossWt:'',netWt:'',cartons:'1',marksNos:'LNV'})))
                  else if(inv) setPlLines([{description:'As per invoice',qty:1,unit:'LOT',grossWt:'',netWt:'',cartons:'1',marksNos:'LNV'}])
                }}>
                <option value="">-- Select invoice --</option>
                {invoices.map(inv=><option key={inv.invoiceNo} value={inv.invoiceNo}>{inv.invoiceNo} · {inv.customerName}</option>)}
              </select>
            </div>
            {plInv && (
              <div style={{background:'#D4EDDA',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#155724'}}>
                <div style={{fontWeight:700}}>{plInv.invoiceNo} — {plInv.customerName}</div>
                <div style={{fontSize:11,marginTop:4}}>Add gross/net weights and carton details below</div>
              </div>
            )}
          </div>

          {plInv && (
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:20}}>
              <div style={{textAlign:'center',borderBottom:'2px solid #0C5460',paddingBottom:14,marginBottom:16}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#0C5460'}}>PACKING LIST</div>
                <div style={{fontSize:12,color:'#6C757D',marginTop:4}}>LNV Manufacturing Pvt. Ltd. · Ranipet, Tamil Nadu</div>
                <div style={{fontSize:12,color:'#333',marginTop:4}}>
                  Invoice No: <strong>{plInv.invoiceNo}</strong> &nbsp;|&nbsp;
                  Date: <strong>{plInv.invoiceDate?new Date(plInv.invoiceDate).toLocaleDateString('en-IN'):''}</strong>
                </div>
              </div>

              {/* Shipment details */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14,padding:12,background:'#F8F4F8',borderRadius:8}}>
                {Object.entries({
                  containerNo:'Container No', vesselName:'Vessel / Flight No',
                  portLoading:'Port of Loading', portDischarge:'Port of Discharge'
                }).map(([k,l])=>(
                  <div key={k}>
                    <label style={lbl}>{l}</label>
                    <input style={{...inp,fontSize:11}} value={plMeta[k]||''}
                      onChange={e=>setPlMeta(p=>({...p,[k]:e.target.value}))}
                      onFocus={e=>e.target.style.borderColor='#0C5460'}
                      onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                  </div>
                ))}
              </div>

              {/* Packing line items */}
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:14}}>
                <thead>
                  <tr style={{background:'#0C5460',color:'#fff'}}>
                    <th style={{padding:'7px 10px',textAlign:'left',width:'30%'}}>Description</th>
                    <th style={{padding:'7px 10px',textAlign:'right',width:'8%'}}>Qty</th>
                    <th style={{padding:'7px 10px',textAlign:'left',width:'8%'}}>Unit</th>
                    <th style={{padding:'7px 10px',textAlign:'center',width:'10%'}}>No. of Cartons</th>
                    <th style={{padding:'7px 10px',textAlign:'right',width:'12%'}}>Gross Wt (KG)</th>
                    <th style={{padding:'7px 10px',textAlign:'right',width:'12%'}}>Net Wt (KG)</th>
                    <th style={{padding:'7px 10px',textAlign:'left',width:'20%'}}>Marks &amp; Nos</th>
                  </tr>
                </thead>
                <tbody>
                  {plLines.map((l,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'5px 8px'}}>{l.description||l.itemName||l.name||'Item '+(i+1)}</td>
                      <td style={{padding:'5px 8px',textAlign:'right'}}>{l.qty||l.quantity||1}</td>
                      <td style={{padding:'5px 8px'}}>{l.unit||l.uom||'NOS'}</td>
                      <td style={{padding:'5px 4px',textAlign:'center'}}>
                        <input type="number" style={{...inp,width:60,textAlign:'center',fontSize:11}} value={l.cartons||''}
                          onChange={e=>setPlLines(ls=>ls.map((x,idx)=>idx===i?{...x,cartons:e.target.value}:x))}/>
                      </td>
                      <td style={{padding:'5px 4px'}}>
                        <input type="number" style={{...inp,textAlign:'right',fontSize:11}} value={l.grossWt||''}
                          onChange={e=>setPlLines(ls=>ls.map((x,idx)=>idx===i?{...x,grossWt:e.target.value}:x))} placeholder="0.00"/>
                      </td>
                      <td style={{padding:'5px 4px'}}>
                        <input type="number" style={{...inp,textAlign:'right',fontSize:11}} value={l.netWt||''}
                          onChange={e=>setPlLines(ls=>ls.map((x,idx)=>idx===i?{...x,netWt:e.target.value}:x))} placeholder="0.00"/>
                      </td>
                      <td style={{padding:'5px 4px'}}>
                        <input style={{...inp,fontSize:10}} value={l.marksNos||''} placeholder="LNV/2026/001"
                          onChange={e=>setPlLines(ls=>ls.map((x,idx)=>idx===i?{...x,marksNos:e.target.value}:x))}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:'#EDE0EA',fontWeight:700,borderTop:'2px solid #0C5460'}}>
                    <td style={{padding:'7px 10px',color:'#0C5460'}}>TOTALS</td>
                    <td style={{padding:'7px 10px',textAlign:'right'}}>{plLines.reduce((a,l)=>a+parseFloat(l.qty||l.quantity||1),0)}</td>
                    <td/>
                    <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace'}}>
                      {plLines.reduce((a,l)=>a+parseInt(l.cartons||0),0)} cartons
                    </td>
                    <td style={{padding:'7px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>
                      {plLines.reduce((a,l)=>a+parseFloat(l.grossWt||0),0).toFixed(2)} KG
                    </td>
                    <td style={{padding:'7px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>
                      {plLines.reduce((a,l)=>a+parseFloat(l.netWt||0),0).toFixed(2)} KG
                    </td>
                    <td/>
                  </tr>
                </tfoot>
              </table>

              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <button onClick={()=>window.print()}
                  style={{padding:'8px 20px',background:'#0C5460',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Print / PDF
                </button>
              </div>
            </div>
          )}
          {!plInv && (
            <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              Select an invoice above to generate Packing List
            </div>
          )}
        </div>
      )}

      {/* ── TAB: NON-PREFERENTIAL COO ── */}
      {tab==='npcoo' && (
        <div>
          <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:8,padding:12,marginBottom:14,fontSize:12,color:'#856404'}}>
            <strong>Non-Preferential COO</strong> — For exports to countries WITHOUT a CEPA/FTA with India (USA, EU, Middle East non-CEPA, Africa).
            Issued by FIEO / Chamber of Commerce. Proves goods are of Indian origin but no duty concession.
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <label style={lbl}>Select Invoice *</label>
              <select style={{...inp,cursor:'pointer',fontFamily:'DM Mono,monospace'}}
                value={npInv?.invoiceNo||''}
                onChange={e=>{ const inv=invoices.find(i=>i.invoiceNo===e.target.value); setNpInv(inv||null); if(inv) setNpForm(p=>({...p,consigneeName:inv.customerName})) }}>
                <option value="">-- Select invoice --</option>
                {invoices.map(inv=><option key={inv.invoiceNo} value={inv.invoiceNo}>{inv.invoiceNo} · {inv.customerName}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Destination Country</label>
              <select style={{...inp,cursor:'pointer'}} value={npForm.consigneeCountry}
                onChange={e=>setNpForm(p=>({...p,consigneeCountry:e.target.value}))}>
                {['US','DE','FR','IT','NL','SA','QA','KW','EG','ZA','NG','BR','CA','MX'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {npInv && (
            <div style={{background:'#fff',border:'2px solid #856404',borderRadius:10,padding:24}}>
              {/* NP COO Header */}
              <div style={{textAlign:'center',borderBottom:'2px solid #856404',paddingBottom:16,marginBottom:20}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#856404'}}>
                  CERTIFICATE OF ORIGIN
                </div>
                <div style={{fontSize:13,color:'#333',marginTop:4}}>NON-PREFERENTIAL</div>
                <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
                  Issued under the authority of Government of India
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
                {/* Box 1 - Exporter */}
                <div style={{border:'1px solid #856404',borderRadius:6,padding:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#856404',textTransform:'uppercase',marginBottom:6}}>1. Exporter (Name, Address, Country)</div>
                  <input style={{...inp,marginBottom:4}} value={npForm.exporterName}
                    onChange={e=>setNpForm(p=>({...p,exporterName:e.target.value}))}/>
                  <input style={inp} value={npForm.exporterAddress}
                    onChange={e=>setNpForm(p=>({...p,exporterAddress:e.target.value}))}/>
                  <div style={{fontSize:11,marginTop:6,color:'#333'}}>
                    <strong>IEC:</strong> AABCL1234 &nbsp;|&nbsp; <strong>GSTIN:</strong> 33AABCL1234A1Z5
                  </div>
                </div>
                {/* Box 2 - Consignee */}
                <div style={{border:'1px solid #856404',borderRadius:6,padding:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#856404',textTransform:'uppercase',marginBottom:6}}>2. Consignee (Name, Address, Country)</div>
                  <input style={{...inp,marginBottom:4}} value={npForm.consigneeName}
                    onChange={e=>setNpForm(p=>({...p,consigneeName:e.target.value}))} placeholder="Buyer name"/>
                  <input style={inp} value={npForm.consigneeCountry}
                    onChange={e=>setNpForm(p=>({...p,consigneeCountry:e.target.value}))} placeholder="Country"/>
                </div>
              </div>

              {/* Goods table */}
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:20,border:'1px solid #856404'}}>
                <thead>
                  <tr style={{background:'#856404',color:'#fff'}}>
                    <th style={{padding:'7px 10px',textAlign:'left'}}>Description of Goods</th>
                    <th style={{padding:'7px 10px',textAlign:'left'}}>HS Code</th>
                    <th style={{padding:'7px 10px',textAlign:'right'}}>Quantity</th>
                    <th style={{padding:'7px 10px',textAlign:'right'}}>FOB Value</th>
                    <th style={{padding:'7px 10px',textAlign:'center'}}>Country of Origin</th>
                  </tr>
                </thead>
                <tbody>
                  {(npInv.lines||npInv.items||[{description:'Goods as per invoice '+npInv.invoiceNo,qty:1,unit:'LOT',total:npInv.grandTotal||0}]).map((l,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                      <td style={{padding:'6px 10px'}}>{l.description||l.itemName||'—'}</td>
                      <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace'}}>{l.hsn||l.hsnCode||'—'}</td>
                      <td style={{padding:'6px 10px',textAlign:'right'}}>{l.qty||l.quantity||1} {l.unit||'NOS'}</td>
                      <td style={{padding:'6px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>₹{parseFloat(l.total||l.taxable||0).toLocaleString('en-IN')}</td>
                      <td style={{padding:'6px 10px',textAlign:'center',fontWeight:700,color:'#856404'}}>INDIA</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Declaration */}
              <div style={{border:'1px solid #856404',borderRadius:6,padding:14,marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:'#856404',textTransform:'uppercase',marginBottom:8}}>Declaration by Exporter</div>
                <textarea style={{...inp,height:80,resize:'none',fontSize:11}} value={npForm.declarationText}
                  onChange={e=>setNpForm(p=>({...p,declarationText:e.target.value}))}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div>
                  <label style={lbl}>Authorised Signatory Name</label>
                  <input style={inp} value={npForm.authorisedBy}
                    onChange={e=>setNpForm(p=>({...p,authorisedBy:e.target.value}))} placeholder="Full name"
                    onFocus={e=>e.target.style.borderColor='#856404'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div>
                  <label style={lbl}>Designation</label>
                  <input style={inp} value={npForm.designation}
                    onChange={e=>setNpForm(p=>({...p,designation:e.target.value}))}
                    onFocus={e=>e.target.style.borderColor='#856404'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
              </div>

              {/* Certifying authority box */}
              <div style={{background:'#FFF3CD',border:'1px solid #856404',borderRadius:8,padding:14,marginBottom:16,fontSize:11,color:'#856404'}}>
                <div style={{fontWeight:700,marginBottom:4}}>CERTIFYING AUTHORITY (to be filled by FIEO / Chamber of Commerce):</div>
                <div>It is hereby certified that the goods described herein are of <strong>INDIAN ORIGIN</strong> and satisfy the origin criteria as per the importing country requirements.</div>
                <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                  {['COO Certificate No','Seal & Signature','Date of Issue'].map(l=>(
                    <div key={l} style={{borderBottom:'1px solid #856404',paddingBottom:20}}>
                      <div style={{fontSize:10,marginTop:4}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{ const saved=JSON.parse(localStorage.getItem('lnv_npcoo')||'[]'); const c={...npForm,invoiceNo:npInv.invoiceNo,issuedDate:new Date().toISOString(),certNo:`LNV/NP/${new Date().getFullYear()}/${String(saved.length+1).padStart(3,'0')}`}; const u=[c,...saved]; localStorage.setItem('lnv_npcoo',JSON.stringify(u)); setNpCerts(u); toast.success(`NP COO ${c.certNo} saved`) }}
                  style={{padding:'8px 20px',background:'#856404',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Save NP COO Record
                </button>
                <button onClick={()=>window.print()}
                  style={{padding:'8px 20px',background:'#fff',color:'#856404',border:'1.5px solid #856404',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
                  Print / PDF
                </button>
              </div>
            </div>
          )}
          {!npInv && (
            <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              Select an invoice above to generate Non-Preferential Certificate of Origin
            </div>
          )}
        </div>
      )}


      {tab==='register' && (
        <div>
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
            <button onClick={()=>setCountryF('all')} style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:'1px solid #E0D5E0',background:countryF==='all'?'#0C5460':'#fff',color:countryF==='all'?'#fff':'#6C757D'}}>
              All Countries ({certs.length})
            </button>
            {CEPA_COUNTRIES.filter(c=>certs.some(cert=>cert.buyerCountry===c.code)).map(c=>(
              <button key={c.code} onClick={()=>setCountryF(countryF===c.code?'all':c.code)} style={{
                padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                border:'1px solid #0C5460',
                background:countryF===c.code?'#0C5460':'#fff',
                color:countryF===c.code?'#fff':'#0C5460'
              }}>{c.name} ({certs.filter(cert=>cert.buyerCountry===c.code).length})</button>
            ))}
            {filteredCerts.length>0&&(
              <span style={{marginLeft:'auto',fontSize:12,color:'#6C757D'}}>
                Total FOB: <strong>${totalFOB.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </div>

          {filteredCerts.length===0 ? (
            <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:32,marginBottom:10}}>\uD83C\uDF0D</div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>No CEPA Certificates yet</div>
              <div style={{fontSize:12}}>Click &quot;+ Issue CEPA Certificate&quot; to generate your first Certificate of Origin</div>
            </div>
          ) : (
            <table className="fi-data-table">
              <thead><tr>
                <th>Cert No.</th><th>Invoice No.</th><th>Buyer</th><th>Country</th>
                <th>HS Code</th><th>COO Type</th>
                <th style={{textAlign:'right'}}>FOB Value</th>
                <th style={{textAlign:'center'}}>Origin</th>
                <th>Issued Date</th>
                <th style={{textAlign:'center'}}>Status</th>
              </tr></thead>
              <tbody>
                {filteredCerts.map((c,i)=>{
                  const country = CEPA_COUNTRIES.find(cc=>cc.code===c.buyerCountry)
                  return (
                    <tr key={i}>
                      <td style={{fontFamily:'DM Mono,monospace',fontWeight:800,color:'#0C5460',fontSize:12}}>{c.certNo}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)'}}>{c.invoiceNo}</td>
                      <td style={{fontWeight:600,fontSize:12}}>{c.buyerName}</td>
                      <td>
                        <span style={{background:'#D1ECF1',color:'#0C5460',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                          {c.buyerCountry} — {country?.name||c.buyerCountry}
                        </span>
                      </td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{c.lines?.length > 1 ? `${c.lines.length} items` : c.lines?.[0]?.hsCode || '—'}</td>
                      <td style={{fontSize:11,color:'#6C757D'}}>{c.cooType}</td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                        {c.currency} {(c.totalFOB||parseFloat(c.fobValue||0)).toLocaleString('en-IN',{minimumFractionDigits:2})}
                      </td>
                      <td style={{textAlign:'center'}}>
                        <span style={{background:'#EDE0EA',color:'#714B67',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                          {c.originCriteria}
                        </span>
                      </td>
                      <td style={{fontSize:11,color:'#6C757D'}}>
                        {c.issuedDate?new Date(c.issuedDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}
                      </td>
                      <td style={{textAlign:'center'}}>
                        <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>
                          Issued
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {filteredCerts.length>0&&(
                <tfoot>
                  <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #0C5460'}}>
                    <td colSpan={6} style={{padding:'9px 12px',color:'#0C5460'}}>
                      TOTAL — {filteredCerts.length} certificates
                    </td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14,color:'#0C5460'}}>
                      USD {totalFOB.toLocaleString('en-IN',{minimumFractionDigits:2})}
                    </td>
                    <td colSpan={3}/>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      )}

      {/* ── TAB 2: EXPORT INVOICES ── */}
      {tab==='invoices' && (
        <div>
          <div className="fi-alert info" style={{marginBottom:14}}>
            Export invoices are zero-rated (GST = 0%). These are eligible for CEPA Certificate of Origin.
            Domestic invoices with IGST are NOT eligible for CEPA COO.
          </div>
          {invoices.length===0 ? (
            <div style={{padding:50,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              No export invoices found for {MONTHS[month]} {year}.
              Export invoices have zero IGST / supply type = Export.
            </div>
          ) : (
            <table className="fi-data-table">
              <thead><tr>
                <th>Invoice No.</th><th>Date</th><th>Customer</th>
                <th style={{textAlign:'right'}}>FOB Value</th>
                <th>Currency</th><th>CEPA Status</th><th></th>
              </tr></thead>
              <tbody>
                {invoices.map((inv,i)=>{
                  const hasCert = certs.some(c=>c.invoiceNo===inv.invoiceNo)
                  return (
                    <tr key={i}>
                      <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{inv.invoiceNo}</td>
                      <td style={{fontSize:11}}>{inv.invoiceDate?new Date(inv.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                      <td style={{fontWeight:600}}>{inv.customerName}</td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{inv.grandTotal||inv.totalAmt||0}</td>
                      <td style={{fontSize:12}}>INR</td>
                      <td>
                        {hasCert
                          ? <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>COO Issued</span>
                          : <span style={{background:'#FFF3CD',color:'#856404',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>COO Pending</span>
                        }
                      </td>
                      <td>
                        {!hasCert&&(
                          <button className="btn-xs" style={{background:'#D1ECF1',color:'#0C5460',border:'1px solid #BEE5EB'}}
                            onClick={()=>{ setForm({...BLANK_CERT,invoiceNo:inv.invoiceNo,invoiceDate:inv.invoiceDate?.split('T')[0]||'',buyerName:inv.customerName}); setLines([{...BLANK_LINE}]); setShowForm(true); setTab('register') }}>
                            Issue COO
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 3: CEPA COUNTRIES ── */}
      {tab==='countries' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {CEPA_COUNTRIES.map(c=>{
              const certCount = certs.filter(cert=>cert.buyerCountry===c.code).length
              return (
                <div key={c.code} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:15,color:'#0C5460'}}>{c.name}</div>
                      <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>{c.code}</div>
                    </div>
                    {certCount>0&&(
                      <span style={{background:'#D1ECF1',color:'#0C5460',padding:'2px 10px',borderRadius:10,fontSize:12,fontWeight:800}}>
                        {certCount} COO
                      </span>
                    )}
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:'#155724',marginBottom:4}}>{c.agreement}</div>
                  <div style={{fontSize:11,color:'#6C757D',marginBottom:6}}>Effective: {c.effectiveDate}</div>
                  <div style={{fontSize:11,color:'#495057',background:'#F8F9FA',borderRadius:6,padding:'6px 8px'}}>
                    {c.dutyReduction}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: GUIDE ── */}
      {tab==='guide' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:18}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'#0C5460',marginBottom:14}}>
              CEPA Export Process
            </div>
            {[
              { step:'1', title:'Create Export Invoice',    desc:'Invoice with zero GST (LUT/Bond). Customer is overseas.',    color:'#0C5460' },
              { step:'2', title:'Verify HS Code',          desc:'Confirm 8-digit HS code of goods. Required for COO.',         color:'#155724' },
              { step:'3', title:'Check Origin Criteria',   desc:'WO (Wholly Obtained) or PSR or RVC40 based on product.',      color:'#856404' },
              { step:'4', title:'Issue CEPA Certificate',  desc:'Fill LNV ERP form → generate cert no → print + sign.',       color:'#714B67' },
              { step:'5', title:'Submit to DGFT/EPC',      desc:'Get COO countersigned by Export Promotion Council or DGFT.',  color:'#E06F39' },
              { step:'6', title:'Send to Buyer',           desc:'Buyer submits COO at import port → gets reduced duty.',       color:'#004085' },
            ].map(s=>(
              <div key={s.step} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid #F0EEEB'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:s.color,color:'#fff',
                  display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0}}>
                  {s.step}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:s.color}}>{s.title}</div>
                  <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:18,marginBottom:12}}>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#0C5460',marginBottom:12}}>
                Origin Criteria Explained
              </div>
              {[
                ['WO', 'Wholly Obtained', 'Goods produced entirely within India using only Indian raw materials. E.g., agricultural goods, mined materials.','#155724'],
                ['PSR','Product Specific Rule','Satisfies specific rule defined in the FTA annexure for that HS code.','#856404'],
                ['RVC40','Regional Value Content 40%','Minimum 40% of FOB value is from India. Non-originating inputs \u2264 60%.','#0C5460'],
                ['CTH','Change in Tariff Heading','Final product HS code at 4-digit level differs from all non-originating inputs.','#714B67'],
              ].map(([code,name,desc,color])=>(
                <div key={code} style={{background:`${color}11`,borderRadius:6,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${color}`}}>
                  <div style={{fontWeight:800,color,marginBottom:2,fontSize:12}}>{code} — {name}</div>
                  <div style={{fontSize:11,color:'#495057'}}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:10,padding:16}}>
              <div style={{fontWeight:700,color:'#856404',marginBottom:8,fontSize:13}}>Important Notes</div>
              {[
                'CEPA COO must be issued BEFORE or AT TIME of export — not retrospectively',
                'For UAE CEPA: minimum 10% value addition mandatory for manufactured goods',
                'COO must be countersigned by FIEO / EPC / Chamber of Commerce',
                'Keep all supporting documents (BOM, production records) for 5 years',
                'Wrong origin declaration = penalty + goods may be seized at port',
              ].map((n,i)=>(
                <div key={i} style={{fontSize:11,color:'#856404',marginBottom:4,display:'flex',gap:6}}>
                  <span style={{flexShrink:0}}>\u26A0</span>{n}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
