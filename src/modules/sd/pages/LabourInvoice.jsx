import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

// HSN 9988 — Manufacturing services on physical goods owned by others
const HSN_CODE    = '9988'
const MATERIAL_TYPES = [
  { key:'without', label:'Without Material', gst:18, desc:'Customer supplies material — we do job work' },
  { key:'with',    label:'With Material',    gst:18, desc:'We supply material + do job work' },
]
const UOM_TYPES = ['SQFT','KGS','NOS','MTR','SQM','BATCH','LOT']

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }
const BLANK_LINE = { processName:'', description:'', qty:'', unit:'SQFT', rate:'', dcRef:'' }

const STATIC = []

export default function LabourInvoice() {
  const navigate  = useNavigate()
  const [tab,       setTab]       = useState('list')
  const [invoices,  setInvoices]  = useState(STATIC)
  const [processes,       setProcesses]      = useState([])
  const [priceBook,       setPriceBook]       = useState([])
  const [enabledProcs,    setEnabledProcs]    = useState([])
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')
  const [statusF,   setStatusF]   = useState('')
  const [matF,      setMatF]      = useState('')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [matType,   setMatType]   = useState('without')
  const [custSearch,setCustSearch]= useState('')
  const [showDrop,  setShowDrop]  = useState(false)

  const [form, setForm] = useState({
    customerName:'', customerGstin:'', customerState:'',
    invoiceDate: new Date().toISOString().split('T')[0],
    dcRef:'', dueDate:'', paymentTerms:'NET30', notes:'',
    lines:[{ ...BLANK_LINE }]
  })

  useEffect(() => {
    // Load processes from ProcessMaster
    fetch(`${BASE_URL}/process`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setProcesses(d.data||d||[])).catch(()=>{})
    // Load labour price book
    fetch(`${BASE_URL}/sd/labour-pricebook`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setPriceBook(d.data||[])).catch(()=>{})
    // Load enabled processes from company config
    fetch(`${BASE_URL}/sd/labour-my-processes`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setEnabledProcs(d.data||[]))
      .catch(()=>{
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('lnv_labour_processes')||'null')
          setEnabledProcs(saved?.enabled || ['PC','CED','LP','IM','LW','SC','WS','OT'])
        } catch { setEnabledProcs(['PC','CED','LP','IM','LW','SC','WS','OT']) }
      })
    // Load customers
    fetch(`${BASE_URL}/sd/customers`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setCustomers(d.data||d||[])).catch(()=>{})
    // Load labour invoices
    fetch(`${BASE_URL}/sd/labour-invoice`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setInvoices(d.data||[]))
      .catch(()=>{})
  }, [])

  const addLine    = () => setForm(p=>({...p,lines:[...p.lines,{...BLANK_LINE}]}))
  const removeLine = i => setForm(p=>({...p,lines:p.lines.filter((_,j)=>j!==i)}))
  const updateLine = (i,k,v) => {
    setForm(p=>({...p,lines:p.lines.map((l,j)=>{
      if(j!==i) return l
      const updated = {...l,[k]:v}
      // Auto-fill rate from process if process selected
      if(k==='processName') {
        const proc = processes.find(pr=>pr.name===v||pr.processName===v)
        if(proc?.defaultRate) updated.rate = proc.defaultRate
      }
      return updated
    })}))
  }

  // Totals calculation
  const isIntra = form.customerState?.toLowerCase().includes('tamil')
  const totals = form.lines.reduce((acc,l) => {
    const taxable = parseFloat(l.qty||0) * parseFloat(l.rate||0)
    const gst     = taxable * (MATERIAL_TYPES.find(m=>m.key===matType)?.gst||18) / 100
    return {
      taxable: acc.taxable + taxable,
      cgst:    acc.cgst + (isIntra ? gst/2 : 0),
      sgst:    acc.sgst + (isIntra ? gst/2 : 0),
      igst:    acc.igst + (isIntra ? 0 : gst),
      grand:   acc.grand + taxable + gst,
    }
  }, {taxable:0, cgst:0, sgst:0, igst:0, grand:0})

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      (inv.invNo||inv.invoiceNo||'').toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerName||inv.customer||'').toLowerCase().includes(search.toLowerCase()) ||
      (inv.dcRef||'').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusF || inv.status === statusF
    const matchMat    = !matF    || inv.materialType === matF
    const invDate     = inv.date||inv.invoiceDate ? new Date(inv.date||inv.invoiceDate) : null
    const matchFrom   = !dateFrom || (invDate && invDate >= new Date(dateFrom))
    const matchTo     = !dateTo   || (invDate && invDate <= new Date(dateTo+'T23:59:59'))
    return matchSearch && matchStatus && matchMat && matchFrom && matchTo
  })

  const save = async () => {
    if (!form.customerName) return toast.error('Customer name required')
    if (!form.lines.some(l=>l.processName&&l.qty&&l.rate)) return toast.error('Add at least one process line with qty and rate')
    setSaving(true)
    try {
      const payload = { ...form, materialType:matType, hsnCode:HSN_CODE, ...totals }
      const res = await fetch(`${BASE_URL}/sd/labour-invoice`, {
        method:'POST', headers: hdr(), body: JSON.stringify(payload)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error||'Failed')
      toast.success(`Labour Invoice ${d.data?.invNo} posted!`)
      setTab('list')
      setForm({customerName:'',customerGstin:'',customerState:'',
        invoiceDate:new Date().toISOString().split('T')[0],
        dcRef:'',dueDate:'',paymentTerms:'NET30',notes:'',
        lines:[{...BLANK_LINE}]})
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const filtCust = customers.filter(c=>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(custSearch.toLowerCase())
  ).slice(0,8)

  const SC = {
    POSTED:{ bg:'#D1ECF1', c:'#0C5460' },
    PAID:  { bg:'#D4EDDA', c:'#155724' },
    DRAFT: { bg:'#F5F5F5', c:'#666'    },
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Labour / Job Work Invoice
            <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>HSN {HSN_CODE} · Manufacturing Services</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Bill customers for coating / processing services — per Sq.Ft, KG, or Piece
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setTab('list')}
            style={{padding:'7px 14px',background:tab==='list'?'#714B67':'#fff',
              color:tab==='list'?'#fff':'#6C757D',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>
            List
          </button>
          <button onClick={()=>setTab('new')}
            style={{padding:'7px 16px',background:tab==='new'?'#714B67':'#fff',
              color:tab==='new'?'#fff':'#714B67',border:'1px solid #714B67',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            + New Labour Invoice
          </button>
        </div>
      </div>

      {/* LIST TAB */}
      {tab==='list'&&(
        <div>
          {/* KPI Strip */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
            {[
              { l:'Total Invoices', v:invoices.length,                                               c:'#714B67', bg:'#EDE0EA' },
              { l:'Total Value',    v:INR(invoices.reduce((s,i)=>s+parseFloat(i.grandTotal||0),0)),  c:'#1565C0', bg:'#E3F2FD' },
              { l:'Posted',         v:invoices.filter(i=>i.status==='POSTED').length,                c:'#0C5460', bg:'#D1ECF1' },
              { l:'Paid',           v:invoices.filter(i=>i.status==='PAID').length,                  c:'#155724', bg:'#D4EDDA' },
            ].map(k=>(
              <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'10px 14px',
                border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
                <div style={{fontSize:15,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search invoice, customer, DC ref..."
              style={{padding:'7px 12px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none',width:220}} />
            <select value={statusF} onChange={e=>setStatusF(e.target.value)}
              style={{padding:'7px 10px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none'}}>
              <option value="">All Status</option>
              <option value="POSTED">Posted</option>
              <option value="PAID">Paid</option>
              <option value="DRAFT">Draft</option>
            </select>
            <select value={matF} onChange={e=>setMatF(e.target.value)}
              style={{padding:'7px 10px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none'}}>
              <option value="">All Types</option>
              <option value="without">Without Material</option>
              <option value="with">With Material</option>
            </select>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              style={{padding:'7px 8px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none'}} />
            <span style={{fontSize:11,color:'#6C757D'}}>to</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              style={{padding:'7px 8px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none'}} />
            {(search||statusF||matF||dateFrom||dateTo) && (
              <button onClick={()=>{setSearch('');setStatusF('');setMatF('');setDateFrom('');setDateTo('')}}
                style={{padding:'6px 12px',background:'#F8D7DA',color:'#721C24',border:'none',
                  borderRadius:6,fontSize:11,cursor:'pointer',fontWeight:700}}>
                X Clear
              </button>
            )}
            <span style={{marginLeft:'auto',fontSize:11,color:'#6C757D'}}>
              {filtered.length} of {invoices.length} records
            </span>
          </div>

          {filtered.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              <div style={{fontSize:24,marginBottom:8}}>No records</div>
              <div style={{fontWeight:700}}>{invoices.length===0?'No labour invoices yet':'No records match filter'}</div>
              {invoices.length===0 && <div style={{fontSize:12,marginTop:4}}>Create job work invoices for coating services</div>}
            </div>
          ) : (
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                  {['Invoice #','Customer','Type','DC Ref','Date','Taxable','GST','Total','Status',''].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:['Taxable','GST','Total'].includes(h)?'right':'left',fontWeight:700,fontSize:11,color:'#714B67'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map((inv,i)=>{
                    const sc  = SC[inv.status||'POSTED']||SC.POSTED
                    const gst = parseFloat(inv.cgst||0)+parseFloat(inv.sgst||0)+parseFloat(inv.igst||0)
                    return (
                      <tr key={inv.id||i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#F8F4F8'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                        <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67',fontSize:11}}>{inv.invNo}</td>
                        <td style={{padding:'9px 12px',fontWeight:600}}>{inv.customerName}</td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700,
                            background:inv.materialType==='with'?'#FFF3CD':'#E3F2FD',
                            color:inv.materialType==='with'?'#856404':'#1565C0'}}>
                            {inv.materialType==='with'?'W/ Mat':'W/O Mat'}
                          </span>
                        </td>
                        <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>{inv.dcRef||'—'}</td>
                        <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>
                          {inv.date ? new Date(inv.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{INR(inv.taxableAmt||0)}</td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'#1565C0'}}>{INR(gst)}</td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13,color:'#2E7D32'}}>{INR(inv.grandTotal||0)}</td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:sc.bg,color:sc.c}}>{inv.status||'POSTED'}</span>
                        </td>
                        <td style={{padding:'9px 12px'}}>
                          <button style={{padding:'3px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>View</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:'#F0EEEB',fontWeight:700}}>
                    <td colSpan={5} style={{padding:'8px 12px',fontSize:11,color:'#6C757D',textAlign:'right'}}>Totals ({filtered.length})</td>
                    <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>
                      {INR(filtered.reduce((s,i)=>s+parseFloat(i.taxableAmt||0),0))}
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'#1565C0'}}>
                      {INR(filtered.reduce((s,i)=>s+parseFloat(i.cgst||0)+parseFloat(i.sgst||0)+parseFloat(i.igst||0),0))}
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:13,color:'#2E7D32',fontWeight:800}}>
                      {INR(filtered.reduce((s,i)=>s+parseFloat(i.grandTotal||0),0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* NEW INVOICE TAB */}
      {tab==='new'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14}}>

          {/* Main form */}
          <div>
            {/* Material type */}
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Job Work Type</div>
              <div style={{display:'flex',gap:10}}>
                {MATERIAL_TYPES.map(m=>(
                  <div key={m.key} onClick={()=>setMatType(m.key)}
                    style={{flex:1,padding:'12px 16px',borderRadius:8,cursor:'pointer',textAlign:'center',
                      border:`2px solid ${matType===m.key?'#714B67':'#E0D5E0'}`,
                      background:matType===m.key?'#EDE0EA':'#fff'}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:4}}>{m.label}</div>
                    <div style={{fontSize:11,color:'#6C757D'}}>{m.desc}</div>
                    <div style={{marginTop:6,fontSize:11,fontWeight:700,color:'#0C5460'}}>GST: {m.gst}%</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,background:'#FFF3CD',borderRadius:6,padding:'6px 12px',fontSize:11,color:'#856404'}}>
                <strong>HSN {HSN_CODE}</strong> — Manufacturing/processing services on physical goods owned by others (GST: 18%)
              </div>
            </div>

            {/* Customer */}
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Customer Details</div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:10}}>
                <div style={{position:'relative'}}>
                  <label style={lbl}>Customer Name *</label>
                  <input style={inp} value={custSearch||form.customerName}
                    onChange={e=>{ setCustSearch(e.target.value); setForm(p=>({...p,customerName:e.target.value})); setShowDrop(true) }}
                    onFocus={()=>setShowDrop(true)} onBlur={()=>setTimeout(()=>setShowDrop(false),200)}
                    placeholder="Type to search..."
                    onMouseOver={e=>e.target.style.borderColor='#714B67'} onMouseOut={e=>e.target.style.borderColor='#E0D5E0'}/>
                  {showDrop&&filtCust.length>0&&(
                    <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:100,background:'#fff',
                      border:'1px solid #E0D5E0',borderRadius:6,boxShadow:'0 4px 16px rgba(0,0,0,.12)',maxHeight:180,overflowY:'auto'}}>
                      {filtCust.map(c=>(
                        <div key={c.id} onClick={()=>{ setForm(p=>({...p,customerName:c.name,customerGstin:c.gstin||'',customerState:c.state||''})); setCustSearch(c.name); setShowDrop(false) }}
                          style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #F0EEEB',fontSize:12}}
                          onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                          onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                          <div style={{fontWeight:600}}>{c.name}</div>
                          <div style={{fontSize:10,color:'#6C757D'}}>{c.code} · {c.gstin||'No GSTIN'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={lbl}>GSTIN</label>
                  <input style={inp} value={form.customerGstin} onChange={e=>setForm(p=>({...p,customerGstin:e.target.value}))}
                    placeholder="33AABCA1234A1Z5"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div>
                  <label style={lbl}>State (for GST)</label>
                  <input style={inp} value={form.customerState} onChange={e=>setForm(p=>({...p,customerState:e.target.value}))}
                    placeholder="Tamil Nadu"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                  <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>
                    {isIntra?'CGST + SGST applies':'IGST applies'}
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div>
                  <label style={lbl}>Invoice Date</label>
                  <input type="date" style={inp} value={form.invoiceDate} onChange={e=>setForm(p=>({...p,invoiceDate:e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>DC Reference</label>
                  <input style={inp} value={form.dcRef} onChange={e=>setForm(p=>({...p,dcRef:e.target.value}))}
                    placeholder="DC-2026-0034"
                    onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
                </div>
                <div>
                  <label style={lbl}>Payment Terms</label>
                  <select style={{...inp,cursor:'pointer'}} value={form.paymentTerms} onChange={e=>setForm(p=>({...p,paymentTerms:e.target.value}))}>
                    {['NET7','NET15','NET30','NET45','NET60','Advance'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Process lines */}
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:13,color:'#714B67'}}>Process / Service Lines</div>
                <button onClick={addLine} style={{padding:'5px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add Line</button>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead><tr style={{background:'#F8F4F8'}}>
                  {['Process / Service','Customer Part / DC Ref','Qty','UOM','Rate (₹)','Amount',''].map(h=>(
                    <th key={h} style={{padding:'6px 8px',textAlign:h==='Amount'?'right':'left',fontWeight:700,fontSize:10,color:'#714B67'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {form.lines.map((l,i)=>{
                    const amt = parseFloat(l.qty||0) * parseFloat(l.rate||0)
                    return (
                      <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                        <td style={{padding:'4px 6px'}}>
                          <select style={{...inp,fontSize:11,cursor:'pointer'}} value={l.processName}
                            onChange={e=>updateLine(i,'processName',e.target.value)}>
                            <option value="">-- Select process --</option>
                            {processes.map(p=><option key={p.id} value={p.name||p.processName}>{p.name||p.processName}</option>)}
                            <option value="__manual__">Enter manually</option>
                          </select>
                          {(l.processName==='__manual__'||(!processes.length&&l.processName))&&(
                            <input style={{...inp,marginTop:4,fontSize:11}} placeholder="Process name" value={l.processName==='__manual__'?'':l.processName}
                              onChange={e=>updateLine(i,'processName',e.target.value)}/>
                          )}
                        </td>
                        <td style={{padding:'4px 6px'}}><input style={{...inp,fontSize:11}} value={l.dcRef} onChange={e=>updateLine(i,'dcRef',e.target.value)} placeholder="Part/DC ref"/></td>
                        <td style={{padding:'4px 6px'}}><input type="number" style={{...inp,width:70,fontSize:11}} value={l.qty} onChange={e=>updateLine(i,'qty',e.target.value)} placeholder="0" min="0" step="0.01"/></td>
                        <td style={{padding:'4px 6px'}}>
                          <select style={{...inp,width:80,cursor:'pointer',fontSize:11}} value={l.unit} onChange={e=>updateLine(i,'unit',e.target.value)}>
                            {UOM_TYPES.map(u=><option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{padding:'4px 6px'}}><input type="number" style={{...inp,width:80,fontSize:11,fontFamily:'DM Mono,monospace'}} value={l.rate} onChange={e=>updateLine(i,'rate',e.target.value)} placeholder="0.00" min="0" step="0.01"/></td>
                        <td style={{padding:'4px 8px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,color:'#155724'}}>{amt>0?INR(amt):'—'}</td>
                        <td style={{padding:'4px 6px'}}>
                          {form.lines.length>1&&<button onClick={()=>removeLine(i)} style={{background:'#F8D7DA',border:'none',borderRadius:4,color:'#721C24',cursor:'pointer',padding:'3px 8px',fontSize:12,fontWeight:700}}>&times;</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{marginBottom:14}}>
              <label style={lbl}>Notes</label>
              <textarea style={{...inp,height:55,resize:'none'}} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Additional notes..."/>
            </div>
          </div>

          {/* Right panel */}
          <div>
            <div style={{background:'#F8F4F8',border:'1.5px solid #714B67',borderRadius:8,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:10}}>Invoice Summary</div>
              {[
                ['HSN Code',     HSN_CODE],
                ['Service Type', MATERIAL_TYPES.find(m=>m.key===matType)?.label],
                ['GST Rate',     `${MATERIAL_TYPES.find(m=>m.key===matType)?.gst||18}%`],
                ['GST Type',     isIntra?'CGST + SGST':'IGST'],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #E0D5E0',fontSize:11}}>
                  <span style={{color:'#6C757D'}}>{k}</span>
                  <span style={{fontWeight:600,color:'#333'}}>{v}</span>
                </div>
              ))}

              <div style={{marginTop:10}}>
                {[
                  ['Taxable Amount', INR(totals.taxable), false],
                  ...(totals.cgst>0?[['CGST',INR(totals.cgst),false],['SGST',INR(totals.sgst),false]]:[]),
                  ...(totals.igst>0?[['IGST',INR(totals.igst),false]]:[]),
                  ['Grand Total', INR(totals.grand), true],
                ].map(([k,v,bold])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',
                    borderBottom:'1px solid #E0D5E0',fontWeight:bold?800:400,
                    fontSize:bold?15:12,color:bold?'#714B67':'#333'}}>
                    <span>{k}</span>
                    <span style={{fontFamily:'DM Mono,monospace'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={saving}
              style={{width:'100%',padding:'12px',background:'#714B67',color:'#fff',border:'none',
                borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',marginBottom:8}}>
              {saving?'Posting...':'\uD83D\uDCCB Post Labour Invoice'}
            </button>
            <button onClick={()=>setTab('list')}
              style={{width:'100%',padding:'10px',background:'#fff',color:'#6C757D',
                border:'1px solid #E0D5E0',borderRadius:8,fontSize:12,cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
