import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '₹' + Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function ReturnNew() {
  const nav = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [invSearch, setInvSearch] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [selectedInv, setSelectedInv] = useState(null)
  const [returnType, setReturnType] = useState('Partial Return')
  const [reason, setReason] = useState('')
  const [lines, setLines] = useState([]) // { itemCode, itemName, qty, unit, unitPrice, maxQty, selected, reason }
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    fetch(`${BASE_URL}/sd/invoices`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setInvoices(d.data||[])).catch(()=>{})
  },[])

  const pickInvoice = inv => {
    setSelectedInv(inv)
    setInvSearch(inv.invoiceNo)
    setShowDrop(false)
    const invLines = Array.isArray(inv.lines) ? inv.lines : []
    setLines(invLines.map(l => ({
      itemCode: l.itemCode||'', itemName: l.itemName||l.description||'',
      qty: '', unit: l.unit||'NOS', unitPrice: parseFloat(l.rate||l.unitPrice||0),
      maxQty: parseFloat(l.qty||0), selected: false, reason: '',
    })))
    if (invLines.length===0) toast('Invoice has no line items on file — you can still add a manual return line below.')
  }

  const toggleLine = i => setLines(ls => ls.map((l,j)=> j===i ? {...l, selected:!l.selected, qty: !l.selected ? l.maxQty : ''} : l))
  const updateLine  = (i,k,v) => setLines(ls => ls.map((l,j)=> j===i ? {...l,[k]:v} : l))
  const addManualLine = () => setLines(ls => [...ls, { itemCode:'', itemName:'', qty:'', unit:'NOS', unitPrice:0, maxQty:null, selected:true, reason:'' }])
  const removeLine = i => setLines(ls => ls.filter((_,j)=>j!==i))

  const filtInv = invoices.filter(i =>
    i.invoiceNo?.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.customerName?.toLowerCase().includes(invSearch.toLowerCase())
  ).slice(0,8)

  const activeLines = lines.filter(l=>l.selected && parseFloat(l.qty||0)>0)
  const totalAmt = activeLines.reduce((s,l)=>s+parseFloat(l.qty||0)*parseFloat(l.unitPrice||0),0)

  const save = async () => {
    if (!selectedInv && !invSearch) return toast.error('Select an invoice, or search a customer name for a return without one')
    if (activeLines.length===0) return toast.error('Select at least one line with a return quantity')
    for (const l of activeLines) {
      if (l.maxQty!=null && parseFloat(l.qty) > l.maxQty) return toast.error(`${l.itemName}: max returnable is ${l.maxQty}`)
    }
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/sd/returns`, {
        method:'POST', headers:hdr(),
        body: JSON.stringify({
          customerId: selectedInv?.customerId||null,
          customerName: selectedInv?.customerName || invSearch,
          invoiceId: selectedInv?.id||null, invoiceNo: selectedInv?.invoiceNo||null,
          returnType, reason,
          lines: activeLines.map(l=>({ itemCode:l.itemCode, itemName:l.itemName, qty:l.qty, unit:l.unit, unitPrice:l.unitPrice, reason:l.reason||reason })),
        })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      nav('/sd/returns')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>New Sales Return</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>nav('/sd/returns')} style={{padding:'7px 14px',background:'#fff',color:'#6C757D',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Cancel</button>
          <button disabled={saving} onClick={save} style={{padding:'7px 18px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {saving?'⏳ Saving...':'Post Return'}
          </button>
        </div>
      </div>

      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Invoice</div>
        <div style={{position:'relative',maxWidth:420}}>
          <label style={lbl}>Search Invoice No / Customer</label>
          <input style={inp} value={invSearch}
            onChange={e=>{ setInvSearch(e.target.value); setShowDrop(true); if(!e.target.value) setSelectedInv(null) }}
            onFocus={()=>setShowDrop(true)} onBlur={()=>setTimeout(()=>setShowDrop(false),200)}
            placeholder="Type invoice number or customer name..." />
          {showDrop && filtInv.length>0 && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:100,background:'#fff',
              border:'1px solid #E0D5E0',borderRadius:6,boxShadow:'0 4px 16px rgba(0,0,0,.12)',maxHeight:200,overflowY:'auto'}}>
              {filtInv.map(inv=>(
                <div key={inv.id} onClick={()=>pickInvoice(inv)}
                  style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                  <strong>{inv.invoiceNo}</strong> — {inv.customerName} <span style={{color:'#6C757D'}}>· {INR(inv.grandTotal)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {!selectedInv && invSearch && (
          <div style={{fontSize:11,color:'#856404',marginTop:6}}>No invoice matched — this will be recorded as a return without an invoice reference, using "{invSearch}" as the customer name.</div>
        )}
      </div>

      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Return Details</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12}}>
          <div><label style={lbl}>Return Type</label>
            <select style={inp} value={returnType} onChange={e=>setReturnType(e.target.value)}>
              <option>Partial Return</option>
              <option>Full Return</option>
            </select>
          </div>
          <div><label style={lbl}>Reason</label>
            <input style={inp} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Damaged, wrong item, quality issue..." />
          </div>
        </div>
      </div>

      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:13,color:'#714B67'}}>Return Lines</div>
          <button onClick={addManualLine} style={{padding:'5px 12px',background:'#F0EEEB',color:'#714B67',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>+ Manual Line</button>
        </div>
        {lines.length===0 ? (
          <div style={{fontSize:12,color:'#6C757D',textAlign:'center',padding:20}}>Select an invoice above, or add a manual line.</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'1px solid #E0D5E0'}}>
                {['','Item','Max Qty','Return Qty','Unit Price','Line Reason',''].map(h=>(
                  <th key={h} style={{padding:'6px 8px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                  <td style={{padding:'6px 8px'}}>
                    <input type="checkbox" checked={l.selected} onChange={()=>toggleLine(i)} />
                  </td>
                  <td style={{padding:'6px 8px'}}>
                    {l.maxQty!=null ? (
                      <span style={{fontWeight:600}}>{l.itemCode?`${l.itemCode} — `:''}{l.itemName}</span>
                    ) : (
                      <>
                        <input style={{...inp,marginBottom:4}} placeholder="Item code" value={l.itemCode} onChange={e=>updateLine(i,'itemCode',e.target.value)} />
                        <input style={inp} placeholder="Item name" value={l.itemName} onChange={e=>updateLine(i,'itemName',e.target.value)} />
                      </>
                    )}
                  </td>
                  <td style={{padding:'6px 8px',fontFamily:'DM Mono,monospace'}}>{l.maxQty ?? '—'}</td>
                  <td style={{padding:'6px 8px',width:90}}>
                    <input type="number" style={inp} value={l.qty} onChange={e=>updateLine(i,'qty',e.target.value)} disabled={!l.selected} />
                  </td>
                  <td style={{padding:'6px 8px',width:100}}>
                    <input type="number" style={inp} value={l.unitPrice} onChange={e=>updateLine(i,'unitPrice',e.target.value)} />
                  </td>
                  <td style={{padding:'6px 8px'}}>
                    <input style={inp} value={l.reason} onChange={e=>updateLine(i,'reason',e.target.value)} placeholder={reason||'Same as above'} />
                  </td>
                  <td style={{padding:'6px 8px'}}>
                    {l.maxQty==null && <button onClick={()=>removeLine(i)} style={{background:'none',border:'none',color:'#DC3545',cursor:'pointer',fontSize:14}}>✕</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeLines.length>0 && (
          <div style={{textAlign:'right',marginTop:12,fontSize:14,fontWeight:700,color:'#DC3545'}}>
            Credit Note Value: {INR(totalAmt)}
          </div>
        )}
      </div>

      <div style={{background:'#D1ECF1',borderRadius:8,padding:'10px 14px',fontSize:11,color:'#0C5460'}}>
        Posting this creates a Credit Note journal entry automatically (Dr Revenue / Cr Accounts Receivable) — no separate accounting step needed.
      </div>
    </div>
  )
}
