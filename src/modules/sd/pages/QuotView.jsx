import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

// ── Cancel Reasons Master ──────────────────────────────
const CANCEL_REASONS = [
  { id:'CR-001', reason:'Customer decided not to proceed',       category:'Customer Decision' },
  { id:'CR-002', reason:'Price too high — competitor offer',     category:'Price' },
  { id:'CR-003', reason:'Customer delayed / no response',        category:'No Response' },
  { id:'CR-004', reason:'Specification not matching requirement', category:'Technical' },
  { id:'CR-005', reason:'Customer budget not approved',          category:'Budget' },
  { id:'CR-006', reason:'Delivery timeline not acceptable',      category:'Logistics' },
  { id:'CR-007', reason:'Quality requirement mismatch',          category:'Quality' },
  { id:'CR-008', reason:'Customer went to competitor',           category:'Competition' },
  { id:'CR-009', reason:'Internal — duplicate quotation',        category:'Internal' },
  { id:'CR-010', reason:'Project cancelled by customer',         category:'Customer Decision' },
  { id:'CR-011', reason:'Payment terms not acceptable',          category:'Finance' },
  { id:'CR-012', reason:'Other reason (specify below)',          category:'Other' },
]

const PRODUCTS = [
  { hsn:'8448 59 90', name:'ARISER COMFACT SYSTEM',   rate:1200, gst:18 },
  { hsn:'8448 49 00', name:'COMPACT SPARES',           rate:2100, gst:12 },
  { hsn:'8448 49 10', name:'LATTICE APRONS C121',      rate:450,  gst:18 },
  { hsn:'8448 59 10', name:'Powder Coating — RAL 9005',rate:850,  gst:18 },
  { hsn:'8448 59 20', name:'Surface Treatment — ED',   rate:680,  gst:18 },
]

const SAMPLE_QUOT = {
  id:'QT-0031', date:'26 Jan 2026', validTill:'25 Feb 2026',
  customer:'ARS Cotton Mills', customerGstin:'33AABCA5631B1Z2',
  currency:'INR', salesExec:'Admin', remarks:'Please confirm by 20 Feb 2026.',
  status:'pending',
  lines:[
    { sl:1, hsn:'8448 59 90', product:'ARISER COMFACT SYSTEM',    qty:200, unit:'Nos', rate:1200, disc:5, gstPct:18, taxable:228000, gstAmt:41040, total:269040 },
    { sl:2, hsn:'8448 49 00', product:'COMPACT SPARES',           qty:50,  unit:'Set', rate:2100, disc:0, gstPct:12, taxable:105000, gstAmt:12600, total:117600 },
    { sl:3, hsn:'8448 49 10', product:'LATTICE APRONS C121',      qty:300, unit:'Nos', rate:450,  disc:5, gstPct:18, taxable:128250, gstAmt:23085, total:151335 },
  ],
}

const STATUS_FLOW = ['draft','pending','won','cancelled']

const calc = l => {
  const taxable = l.qty * l.rate * (1 - (l.disc||0)/100)
  const gstAmt  = taxable * l.gstPct / 100
  return { ...l, taxable, gstAmt, total: taxable + gstAmt }
}
const fmt = n => '₹' + Math.round(n||0).toLocaleString('en-IN')
const newLine = () => calc({ sl:1, hsn:'8448 59 90', product:'ARISER COMFACT SYSTEM', qty:1, unit:'Nos', rate:1200, disc:0, gstPct:18 })

export default function QuotView() {
  const navigate   = useNavigate()
  const { id }     = useParams()

  const [quot,    setQuot]    = useState({ ...SAMPLE_QUOT, id: id || SAMPLE_QUOT.id })
  const [editMode,setEdit]    = useState(false)
  const [lines,   setLines]   = useState(SAMPLE_QUOT.lines)
  const [form,    setForm]    = useState({ ...SAMPLE_QUOT })

  // Cancel modal state
  const [showCancel,    setShowCancel]    = useState(false)
  const [cancelReason,  setCancelReason]  = useState('')
  const [cancelNote,    setCancelNote]    = useState('')
  const [cancelReasonId,setCancelReasonId]= useState('')

  const F = f => ({ value: form[f]||'', onChange: e => setForm(p=>({...p,[f]:e.target.value})) })

  const totals = lines.reduce((a,l)=>({
    taxable: a.taxable+(l.taxable||0),
    gstAmt:  a.gstAmt +(l.gstAmt||0),
    total:   a.total  +(l.total||0),
  }), {taxable:0,gstAmt:0,total:0})

  const setLine = (i,f,v) =>
    setLines(ls => ls.map((l,idx)=>idx===i ? calc({...l,[f]:['qty','rate','disc','gstPct'].includes(f)?Number(v):v}) : l))

  const saveEdit = () => {
    setQuot(q => ({...q, ...form}))
    toast.success(`Quotation ${quot.id} updated!`)
    setEdit(false)
  }

  const confirmCancel = () => {
    if (!cancelReasonId) return toast.error('Please select a cancellation reason')
    const reason = CANCEL_REASONS.find(r => r.id === cancelReasonId)
    setQuot(q => ({ ...q, status:'cancelled', cancelReason:reason?.reason, cancelNote }))
    toast.error(`Quotation ${quot.id} cancelled — ${reason?.reason}`)
    setShowCancel(false)
    setCancelReason('')
    setCancelNote('')
    setCancelReasonId('')
  }

  const statusColor = {
    draft:     {bg:'#F5F5F5',c:'#666'},
    pending:   {bg:'#FFF3CD',c:'#856404'},
    won:       {bg:'#D4EDDA',c:'#155724'},
    cancelled: {bg:'#F8D7DA',c:'#721C24'},
    overdue:   {bg:'#F8D7DA',c:'#721C24'},
  }[quot.status] || {bg:'#eee',c:'#555'}

  // ── CANCEL MODAL ──────────────────────────────────────
  const CancelModal = () => (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,
      display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:12,padding:24,width:520,
        boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800,color:'var(--odoo-red)'}}>
              Cancel Quotation
            </div>
            <div style={{fontSize:12,color:'var(--odoo-gray)',marginTop:2}}>
              {quot.id} — {quot.customer}
            </div>
          </div>
          <button onClick={() => setShowCancel(false)}
            style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--odoo-gray)'}}>
            ×
          </button>
        </div>

        {/* Reason dropdown */}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:600,color:'var(--odoo-dark)',display:'block',marginBottom:6}}>
            Cancellation Reason <span style={{color:'var(--odoo-red)'}}>*</span>
          </label>
          <select value={cancelReasonId}
            onChange={e => { setCancelReasonId(e.target.value); setCancelReason(CANCEL_REASONS.find(r=>r.id===e.target.value)?.reason||'') }}
            style={{width:'100%',padding:'9px 12px',border:'1px solid var(--odoo-border)',
              borderRadius:6,fontSize:12,outline:'none',background:'#fff',
              borderColor: cancelReasonId ? 'var(--odoo-green)' : 'var(--odoo-border)'}}>
            <option value="">-- Select reason --</option>
            {Object.entries(CANCEL_REASONS.reduce((g,r)=>({...g,[r.category]:[...(g[r.category]||[]),r]}),{})).map(([cat,reasons])=>(
              <optgroup key={cat} label={cat}>
                {reasons.map(r => <option key={r.id} value={r.id}>{r.reason}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Additional note */}
        <div style={{marginBottom:18}}>
          <label style={{fontSize:12,fontWeight:600,color:'var(--odoo-dark)',display:'block',marginBottom:6}}>
            Additional Notes {cancelReasonId==='CR-012'?<span style={{color:'var(--odoo-red)'}}>*</span>:'(optional)'}
          </label>
          <textarea value={cancelNote} onChange={e=>setCancelNote(e.target.value)}
            placeholder="Add any additional details about the cancellation..."
            style={{width:'100%',padding:'9px 12px',border:'1px solid var(--odoo-border)',
              borderRadius:6,fontSize:12,outline:'none',resize:'vertical',minHeight:80,
              fontFamily:'DM Sans,sans-serif'}}/>
        </div>

        {/* Warning */}
        <div style={{padding:'10px 12px',background:'#FFF5F5',border:'1px solid #F8D7DA',
          borderRadius:6,fontSize:12,color:'#721C24',marginBottom:16}}>
          This will cancel the quotation permanently. Customer will need a new quotation if they want to proceed.
        </div>

        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={() => setShowCancel(false)}
            style={{padding:'8px 20px',borderRadius:6,border:'1px solid var(--odoo-border)',
              background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Go Back
          </button>
          <button onClick={confirmCancel}
            style={{padding:'8px 20px',borderRadius:6,border:'none',
              background:'var(--odoo-red)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>
  )

  // ── EDIT MODE ──────────────────────────────────────────
  if (editMode) {
    return (
      <div>
        {showCancel && <CancelModal />}
        <div className="lv-hdr">
          <div className="lv-ttl">Edit Quotation <small>{quot.id}</small></div>
          <div className="lv-acts">
            <button className="btn btn-s" onClick={() => setEdit(false)}>Cancel Edit</button>
            <button className="btn btn-p" onClick={saveEdit}>Save Changes</button>
          </div>
        </div>
        <div className="sd-fc"><div className="sd-fb2">
          {/* Header fields */}
          <div className="sd-sec">
            <div className="sd-stt">Quotation Header</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px 16px'}}>
              <div className="sd-fg"><label>Quotation #</label><input className="sd-fi" value={quot.id} disabled/></div>
              <div className="sd-fg"><label>Date</label><input className="sd-fi" type="date" {...F('date')}/></div>
              <div className="sd-fg"><label>Valid Until <span className="req">*</span></label><input className="sd-fi" type="date" {...F('validTill')}/></div>
              <div className="sd-fg" style={{gridColumn:'1 / span 2'}}>
                <label>Customer <span className="req">*</span></label>
                <select className="sd-fis" {...F('customer')}>
                  {['Sri Lakshmi Mills','Coimbatore Spinners','Rajesh Textiles','ARS Cotton Mills','New Prospect Ltd'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="sd-fg"><label>Currency</label>
                <select className="sd-fis" {...F('currency')}><option>INR</option><option>USD</option></select>
              </div>
              <div className="sd-fg" style={{gridColumn:'1 / -1'}}>
                <label>Remarks / Terms</label>
                <input className="sd-fi" placeholder="e.g. Please confirm by..." {...F('remarks')}/>
              </div>
            </div>
          </div>
          {/* Line items */}
          <div className="sd-sec">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <div className="sd-stt" style={{marginBottom:0}}>Line Items</div>
              <button onClick={() => setLines(ls=>[...ls,{...newLine(),sl:ls.length+1}])}
                style={{padding:'4px 12px',fontSize:11,fontWeight:700,borderRadius:5,
                  border:'1px solid var(--odoo-purple)',background:'var(--odoo-purple-lt)',
                  color:'var(--odoo-purple)',cursor:'pointer'}}>
                + Add Line
              </button>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="sd-li">
                <thead><tr><th>#</th><th>HSN</th><th>Product</th><th>Qty</th><th>Unit</th><th>Rate (₹)</th><th>Disc%</th><th>GST%</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {lines.map((l,i)=>(
                    <tr key={i}>
                      <td>{l.sl}</td>
                      <td><input className="sd-li-inp" value={l.hsn} onChange={e=>setLine(i,'hsn',e.target.value)} style={{width:90,fontFamily:'DM Mono,monospace',fontSize:10}}/></td>
                      <td><select className="sd-li-inp" value={l.product} onChange={e=>{const p=PRODUCTS.find(x=>x.name===e.target.value);setLine(i,'product',e.target.value);if(p){setLine(i,'rate',p.rate);setLine(i,'gstPct',p.gst);setLine(i,'hsn',p.hsn)}}}>
                        {PRODUCTS.map(p=><option key={p.name}>{p.name}</option>)}
                      </select></td>
                      <td><input className="sd-li-inp" type="number" value={l.qty} onChange={e=>setLine(i,'qty',e.target.value)} style={{width:60}}/></td>
                      <td><select className="sd-li-inp" value={l.unit||'Nos'} onChange={e=>setLine(i,'unit',e.target.value)} style={{width:60}}>
                        <option>Nos</option><option>Kg</option><option>Set</option><option>Mtr</option>
                      </select></td>
                      <td><input className="sd-li-inp" type="number" value={l.rate} onChange={e=>setLine(i,'rate',e.target.value)} style={{width:80}}/></td>
                      <td><input className="sd-li-inp" type="number" value={l.disc||0} onChange={e=>setLine(i,'disc',e.target.value)} style={{width:50}}/></td>
                      <td><select className="sd-li-inp" value={l.gstPct} onChange={e=>setLine(i,'gstPct',e.target.value)} style={{width:60}}>
                        <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
                      </select></td>
                      <td style={{fontWeight:700,color:'var(--odoo-purple)',textAlign:'right'}}>{fmt(l.total)}</td>
                      <td><button onClick={()=>setLines(ls=>ls.filter((_,li)=>li!==i))}
                        style={{background:'none',border:'none',color:'var(--odoo-red)',cursor:'pointer',fontSize:16}}>×</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:'var(--odoo-purple-lt)'}}>
                    <td colSpan={8} style={{textAlign:'right',fontWeight:700,padding:'8px 10px'}}>Taxable: {fmt(totals.taxable)}  GST: {fmt(totals.gstAmt)}</td>
                    <td style={{fontWeight:800,fontSize:14,color:'var(--odoo-purple)',padding:'8px 10px',textAlign:'right'}}>{fmt(totals.total)}</td>
                    <td/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div style={{display:'flex',gap:10,padding:'12px 0',borderTop:'1px solid var(--odoo-border)'}}>
            <button className="btn btn-p" onClick={saveEdit}>Save Changes</button>
            <button className="btn btn-s" onClick={() => setEdit(false)}>Cancel</button>
          </div>
        </div></div>
      </div>
    )
  }

  // ── VIEW MODE ──────────────────────────────────────────
  return (
    <div>
      {showCancel && <CancelModal />}
      <div className="lv-hdr">
        <div className="lv-ttl">{quot.id} <small>Quotation · {quot.customer}</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => navigate('/sd/quotations')}>Back</button>
          {quot.status !== 'cancelled' && quot.status !== 'won' && (
            <>
              <button className="btn btn-s" onClick={() => setEdit(true)}
                style={{border:'1px solid #714B67',color:'#714B67',background:'#EDE0EA'}}>
                Edit
              </button>
              <button style={{padding:'6px 14px',fontSize:'12px',fontWeight:'700',
                borderRadius:'6px',border:'none',cursor:'pointer',
                background:'var(--odoo-red)',color:'#fff'}}
                onClick={() => setShowCancel(true)}>
                Cancel Quotation
              </button>
              <button className="btn btn-p" onClick={()=>navigate('/sd/orders/new')}>
                Convert to SO
              </button>
            </>
          )}
          <button className="btn btn-s" onClick={() => navigate('/print/quotation')}>Print</button>
        </div>
      </div>

      <div className="sd-fc">
        {/* Status flow */}
        <div className="sd-fsb">
          {['Draft','Pending','Won','Cancelled'].map((s,i)=>(
            <div key={s} className={`sd-ss ${quot.status===s.toLowerCase()?'act':''}`}>
              <div className="sd-sd"/>
              {s}
            </div>
          ))}
        </div>

        {/* Cancelled reason banner */}
        {quot.status === 'cancelled' && quot.cancelReason && (
          <div style={{padding:'12px 16px',background:'#FFF5F5',border:'1px solid #F8D7DA',
            borderRadius:6,marginBottom:12,display:'flex',gap:10,alignItems:'flex-start'}}>
            <span style={{fontSize:18}}></span>
            <div>
              <div style={{fontWeight:700,color:'var(--odoo-red)',fontSize:13}}>Quotation Cancelled</div>
              <div style={{fontSize:12,color:'#721C24',marginTop:2}}>
                <strong>Reason:</strong> {quot.cancelReason}
              </div>
              {quot.cancelNote && <div style={{fontSize:12,color:'#721C24',marginTop:2}}><strong>Note:</strong> {quot.cancelNote}</div>}
            </div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {/* Left: Quotation details */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="sd-sec">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div className="sd-stt" style={{marginBottom:0}}>Quotation Details</div>
                <span style={{padding:'3px 12px',borderRadius:10,fontSize:11,fontWeight:700,
                  background:statusColor.bg,color:statusColor.c}}>
                  {quot.status.toUpperCase()}
                </span>
              </div>
              <table style={{width:'100%',fontSize:12}}>
                <tbody>
                  {[
                    ['Quotation #',  quot.id],
                    ['Date',         quot.date],
                    ['Valid Till',   quot.validTill],
                    ['Customer',     quot.customer],
                    ['GSTIN',        quot.customerGstin],
                    ['Currency',     quot.currency],
                    ['Sales Exec',   quot.salesExec],
                  ].map(([k,v])=>(
                    <tr key={k} style={{borderBottom:'1px solid #F0EEEB'}}>
                      <td style={{padding:'6px 4px',color:'var(--odoo-gray)',width:'40%',fontWeight:500}}>{k}</td>
                      <td style={{padding:'6px 4px',fontWeight:600,
                        fontFamily:k==='GSTIN'?'DM Mono,monospace':'inherit',
                        color:k==='Quotation #'?'var(--odoo-purple)':'inherit'}}>{v}</td>
                    </tr>
                  ))}
                  {quot.remarks&&(
                    <tr style={{borderBottom:'1px solid #F0EEEB'}}>
                      <td style={{padding:'6px 4px',color:'var(--odoo-gray)',fontWeight:500}}>Remarks</td>
                      <td style={{padding:'6px 4px',fontSize:11,color:'var(--odoo-gray)'}}>{quot.remarks}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Amount summary */}
          <div className="sd-sec">
            <div className="sd-stt">Amount Summary</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                ['Total Lines',     SAMPLE_QUOT.lines.length+' items', false],
                ['Total Taxable',   fmt(totals.taxable),  false],
                ['Total GST',       fmt(totals.gstAmt),   false],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',
                  padding:'8px 12px',background:'var(--odoo-bg)',borderRadius:5,fontSize:12}}>
                  <span style={{color:'var(--odoo-gray)'}}>{k}</span>
                  <span style={{fontFamily:'DM Mono,monospace',fontWeight:600}}>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',
                padding:'12px 16px',background:'var(--odoo-purple)',borderRadius:8}}>
                <span style={{color:'#fff',fontWeight:700,fontSize:14}}>Grand Total</span>
                <span style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:'#F5C518'}}>
                  {fmt(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="sd-sec" style={{marginTop:8}}>
          <div className="sd-stt">Line Items</div>
          <div style={{overflowX:'auto'}}>
            <table className="sd-tbl">
              <thead>
                <tr>
                  <th>#</th><th>HSN</th><th>Product / Service</th><th>Qty</th>
                  <th>Unit</th><th>Rate</th><th>Disc%</th><th>Taxable</th>
                  <th>GST</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_QUOT.lines.map(l=>(
                  <tr key={l.sl}>
                    <td>{l.sl}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:10}}>{l.hsn}</td>
                    <td style={{fontWeight:600}}>{l.product}</td>
                    <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{l.qty}</td>
                    <td>{l.unit}</td>
                    <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{fmt(l.rate)}</td>
                    <td style={{textAlign:'center'}}>{l.disc>0?l.disc+'%':'—'}</td>
                    <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{fmt(l.taxable)}</td>
                    <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-orange)'}}>{fmt(l.gstAmt)}</td>
                    <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{fmt(l.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:'var(--odoo-purple-lt)'}}>
                  <td colSpan={7} style={{padding:'9px 10px',fontWeight:700,textAlign:'right',
                    fontFamily:'Syne,sans-serif'}}>TOTAL</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{fmt(totals.taxable)}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-orange)',fontWeight:700}}>{fmt(totals.gstAmt)}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'var(--odoo-purple)'}}>{fmt(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
