// ═══════════════════════════════════════════════════════════════════
// LNV ERP — MM / VendorInvNew.jsx  (MIRO — Vendor Invoice Verification)
// SAP-style: PO → GRN → Vendor Invoice with GL + Cost Center per line
// Auto-posts JV: Dr 5101 Purchase + ITC / Cr 2102 Vendor Payable
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const inp  = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12,
  outline:'none', width:'100%', boxSizing:'border-box' }
const lbl  = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase' }
const sec  = { background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, marginBottom:14, overflow:'hidden' }
const secH = { background:'linear-gradient(135deg,#1F618D,#2E86C1)', color:'#fff',
  padding:'9px 16px', fontSize:12, fontWeight:700 }
const secB = { padding:'16px' }

// SAP GL account mapping for vendor invoice lines
const GL_ACCOUNTS = [
  { code:'5101', name:'Purchase — Raw Materials',     type:'EXPENSE' },
  { code:'5102', name:'Purchase — Packing Materials', type:'EXPENSE' },
  { code:'5103', name:'Purchase — Consumables',       type:'EXPENSE' },
  { code:'5200', name:'Purchase — Capital Goods',     type:'ASSET'   },
  { code:'5300', name:'Purchase — Services',          type:'EXPENSE' },
  { code:'5400', name:'Freight & Transport',          type:'EXPENSE' },
  { code:'5500', name:'Other Procurement',            type:'EXPENSE' },
]

const COST_CENTERS = [
  { code:'CC-PROD', name:'Production'   },
  { code:'CC-MAINT',name:'Maintenance'  },
  { code:'CC-ADMIN',name:'Admin'        },
  { code:'CC-SALES',name:'Sales'        },
  { code:'CC-QC',   name:'Quality'      },
  { code:'CC-STORE',name:'Store / WH'   },
]

const GST_RATES = [0, 5, 12, 18, 28]

const calcLine = (l) => {
  const qty     = parseFloat(l.qty     || 0)
  const rate    = parseFloat(l.rate    || 0)
  const disc    = parseFloat(l.discPct || 0)
  const gstRate = parseFloat(l.gstRate || 18)
  const taxable = qty * rate * (1 - disc/100)
  const gst     = taxable * gstRate / 100
  const isIGST  = l.supplyType === 'interstate'
  return {
    ...l, qty, rate, discPct:disc, gstRate, taxable,
    cgst: isIGST ? 0 : gst/2,
    sgst: isIGST ? 0 : gst/2,
    igst: isIGST ? gst : 0,
    totalAmt: taxable + gst,
  }
}

const BLANK_LINE = {
  itemName:'', hsnCode:'', qty:0, unit:'Nos', rate:0, discPct:0,
  gstRate:18, glCode:'5101', costCenter:'CC-PROD',
  supplyType:'intrastate', taxable:0, cgst:0, sgst:0, igst:0, totalAmt:0,
}

export default function VendorInvNew() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const poIdParam = sp.get('poId')

  const [pos,     setPOs]    = useState([])
  const [invNo,   setInvNo]  = useState('Auto-generated')
  const [lines,   setLines]  = useState([{ ...BLANK_LINE }])
  const [saving,  setSaving] = useState(false)
  const [selPO,   setSelPO]  = useState(null)

  const [form, setForm] = useState({
    vendorInvNo: '', invDate: new Date().toISOString().split('T')[0],
    dueDate: '', poId:'', poNo:'',
    vendorCode:'', vendorName:'', vendorGstin:'',
    placeOfSupply:'33 - Tamil Nadu', supplyType:'intrastate',
    grnNo:'', paymentTerms:'Net 30',
    tdsRate:0, tdsSection:'', remarks:'',
  })
  const sf = (k,v) => setForm(f=>({...f,[k]:v}))

  const isIGST = form.supplyType === 'interstate'

  useEffect(() => {
    fetch(`${BASE}/mm/po?status=APPROVED,GRN_DONE,PARTIAL_GRN`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setPOs(d.data||[])).catch(()=>{})
    fetch(`${BASE}/mm/invoices/next-no`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setInvNo(d.invNo||'VINV-AUTO')).catch(()=>{})
    if (poIdParam) loadFromPO(poIdParam)
  }, [])

  const loadFromPO = async (id) => {
    try {
      const r  = await fetch(`${BASE}/mm/po/${id}`, { headers:hdr2() })
      const d  = await r.json()
      const po = d.data || d
      if (!po) return
      setSelPO(po)
      const igst = !(po.vendorGstin||'').startsWith('33')
      setForm(f=>({...f,
        poId:po.id, poNo:po.poNo,
        vendorCode:po.vendorCode||'', vendorName:po.vendorName||'',
        vendorGstin:po.vendorGstin||'',
        supplyType: igst ? 'interstate' : 'intrastate',
      }))
      if (po.lines?.length) {
        // Build lines first, then enrich HSN from item master where missing
        const mappedLines = po.lines.map(l => calcLine({
          itemCode:   l.itemCode  || '',
          itemName:   l.itemName  || '',
          hsnCode:    l.hsnCode   || '',
          qty:        parseFloat(l.receivedQty || l.qty || 0),
          unit:       l.unit      || 'Nos',
          rate:       parseFloat(l.rate        || 0),
          discPct:    parseFloat(l.discPct || l.discount || 0),
          gstRate:    parseFloat(l.gstRate     || 18),
          glCode:     '5101',
          costCenter: 'CC-PROD',
          supplyType: igst ? 'interstate' : 'intrastate',
        }))
        setLines(mappedLines)
        toast.success(`PO ${po.poNo} loaded — ${po.lines.length} items`)

        // Enrich HSN from item master for lines missing HSN
        const missingHSN = mappedLines.filter(l => !l.hsnCode && l.itemCode)
        if (missingHSN.length > 0) {
          fetch(`${BASE}/mdm/items`, { headers:hdr2() })
            .then(r => r.json())
            .then(d => {
              const items = d.data || []
              setLines(prev => prev.map(l => {
                if (l.hsnCode || !l.itemCode) return l
                const item = items.find(it => (it.code||it.itemCode) === l.itemCode)
                return item?.hsnCode ? { ...l, hsnCode: item.hsnCode } : l
              }))
            }).catch(() => {})
        }
      }
    } catch(e) { toast.error('Failed to load PO: ' + e.message) }
  }

  const onPOChange = async (id) => { sf('poId', id); if(id) await loadFromPO(id) }

  const updLine = (i, changes) => setLines(p => p.map((l,idx) =>
    idx!==i ? l : calcLine({...l, ...changes, supplyType:form.supplyType })))

  const addLine = () => setLines(p => [...p, calcLine({ ...BLANK_LINE, supplyType:form.supplyType })])
  const delLine = (i) => setLines(p => p.filter((_,idx)=>idx!==i))

  // Totals
  const tot = lines.reduce((a,l)=>({
    taxable: a.taxable+(l.taxable||0),
    cgst:    a.cgst+(l.cgst||0),
    sgst:    a.sgst+(l.sgst||0),
    igst:    a.igst+(l.igst||0),
    total:   a.total+(l.totalAmt||0),
  }),{ taxable:0, cgst:0, sgst:0, igst:0, total:0 })

  const tdsAmt = tot.taxable * parseFloat(form.tdsRate||0) / 100
  const netPayable = tot.total - tdsAmt

  // GL summary by account
  const glSummary = lines.reduce((acc, l) => {
    const key = l.glCode || '5101'
    const gl  = GL_ACCOUNTS.find(g=>g.code===key)
    if (!acc[key]) acc[key] = { name:gl?.name||key, taxable:0, gst:0 }
    acc[key].taxable += l.taxable||0
    acc[key].gst     += (l.cgst||0)+(l.sgst||0)+(l.igst||0)
    return acc
  }, {})

  // Cost center summary
  const ccSummary = lines.reduce((acc, l) => {
    const key = l.costCenter || 'CC-PROD'
    const cc  = COST_CENTERS.find(c=>c.code===key)
    if (!acc[key]) acc[key] = { name:cc?.name||key, amt:0 }
    acc[key].amt += l.taxable||0
    return acc
  }, {})

  const save = async () => {
    if (!form.vendorName) return toast.error('Vendor name required')
    if (!form.vendorInvNo) return toast.error('Vendor\'s invoice number required')
    if (!lines.some(l=>l.itemName&&l.qty>0)) return toast.error('Add at least one item')
    setSaving(true)
    try {
      const payload = {
        vendorInvNo: form.vendorInvNo,
        poId:       form.poId     || null,
        poNo:       form.poNo     || null,
        grnNo:      form.grnNo    || null,
        vendorCode: form.vendorCode,
        vendorName: form.vendorName,
        vendorGstin:form.vendorGstin || null,
        invDate:    form.invDate,
        dueDate:    form.dueDate  || null,
        subTotal:   tot.taxable,
        cgst:       tot.cgst,
        sgst:       tot.sgst,
        igst:       tot.igst,
        totalGST:   tot.cgst+tot.sgst+tot.igst,
        totalAmount:tot.total,
        tdsRate:    parseFloat(form.tdsRate||0),
        tdsAmt,
        netPayable,
        remarks:    form.remarks  || null,
        lines: lines.filter(l=>l.itemName&&l.qty>0).map(l=>({
          itemCode:   l.itemCode   || null,
          itemName:   l.itemName,
          hsnCode:    l.hsnCode    || null,
          qty:        l.qty,
          unit:       l.unit,
          rate:       l.rate,
          discPct:    l.discPct,
          gstRate:    l.gstRate,
          taxable:    l.taxable,
          cgst:       l.cgst,
          sgst:       l.sgst,
          igst:       l.igst,
          totalAmt:   l.totalAmt,
          glCode:     l.glCode     || '5101',
          costCenter: l.costCenter || 'CC-PROD',
        })),
      }
      const res  = await fetch(`${BASE}/mm/invoices`, { method:'POST', headers:hdr(), body:JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.data?.invNo||invNo} posted! JV auto-created.`)
      nav('/mm/vendor-invoices')
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const thS = { padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:700,
    color:'#fff', whiteSpace:'nowrap' }
  const tdS = { padding:'6px 8px', fontSize:12, verticalAlign:'middle' }

  return (
    <div style={{ maxWidth:1400 }}>
      {/* Header */}
      <div className="lv-hdr">
        <div className="lv-ttl">
          Vendor Invoice (MIRO)
          <small style={{ fontFamily:'DM Mono,monospace', fontSize:10 }}>MIRO · {invNo}</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={()=>nav('/mm/vendor-invoices')}>← Cancel</button>
          <button className="btn btn-p" disabled={saving} onClick={save}>
            {saving ? '⏳ Posting...' : '📤 Post Invoice + JV'}
          </button>
        </div>
      </div>

      {/* ── Header Info ── */}
      <div style={sec}>
        <div style={secH}>📄 Invoice Header</div>
        <div style={secB}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Vendor *</label>
              <select style={inp} value={form.poId} onChange={e=>onPOChange(e.target.value)}>
                <option value="">-- Select from PO (or enter manually) --</option>
                {pos.map(p=><option key={p.id} value={p.id}>{p.poNo} — {p.vendorName}</option>)}
              </select>
              {!form.poId && (
                <input style={{ ...inp, marginTop:4 }} value={form.vendorName}
                  onChange={e=>sf('vendorName',e.target.value)} placeholder="Vendor name (manual)" />
              )}
            </div>
            <div>
              <label style={lbl}>Vendor Invoice No. *</label>
              <input style={inp} value={form.vendorInvNo}
                onChange={e=>sf('vendorInvNo',e.target.value)} placeholder="Vendor's inv #" />
            </div>
            <div>
              <label style={lbl}>Invoice Date *</label>
              <input type="date" style={inp} value={form.invDate} onChange={e=>sf('invDate',e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Due Date</label>
              <input type="date" style={inp} value={form.dueDate} onChange={e=>sf('dueDate',e.target.value)} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Vendor GSTIN</label>
              <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.vendorGstin}
                onChange={e=>sf('vendorGstin',e.target.value)} placeholder="29XXXXX..." />
            </div>
            <div>
              <label style={lbl}>Supply Type</label>
              <select style={inp} value={form.supplyType}
                onChange={e=>{
                  sf('supplyType',e.target.value)
                  setLines(p=>p.map(l=>calcLine({...l,supplyType:e.target.value})))
                }}>
                <option value="intrastate">Intrastate (CGST+SGST)</option>
                <option value="interstate">Interstate (IGST)</option>
              </select>
            </div>
            <div>
              <label style={lbl}>GRN Reference</label>
              <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.grnNo}
                onChange={e=>sf('grnNo',e.target.value)} placeholder="GRN-2026-0001" />
            </div>
            <div>
              <label style={lbl}>Payment Terms</label>
              <select style={inp} value={form.paymentTerms} onChange={e=>sf('paymentTerms',e.target.value)}>
                {['Net 30','Net 45','Net 60','Immediate','Advance'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Line Items with GL + CC ── */}
      <div style={sec}>
        <div style={{ ...secH, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>📦 Line Items — GL Account & Cost Center Assignment</span>
          <button onClick={addLine}
            style={{ padding:'3px 14px', background:'rgba(255,255,255,0.2)',
              border:'1px solid rgba(255,255,255,0.4)', borderRadius:4,
              color:'#fff', fontSize:11, fontWeight:600, cursor:'pointer' }}>
            + Add Row
          </button>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, minWidth:1300 }}>
            <thead>
              <tr style={{ background:'#1F618D', color:'#fff' }}>
                {['#','Item / Description','HSN','Qty','Unit','Rate','Disc%',
                  'Taxable', isIGST?'IGST%':'GST%', isIGST?'IGST':'CGST', isIGST?'—':'SGST',
                  'Total','🏦 GL Account','🏢 Cost Center',''].map((h,i)=>(
                  <th key={i} style={{ ...thS, textAlign:i>=7?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l,i)=>(
                <tr key={i} style={{ background:i%2===0?'#fff':'#F8FCFF', borderBottom:'1px solid #EEE' }}>
                  <td style={{ ...tdS, color:'#999', fontWeight:700, width:28 }}>{i+1}</td>
                  <td style={{ ...tdS, minWidth:160 }}>
                    <input style={inp} value={l.itemName}
                      onChange={e=>updLine(i,{itemName:e.target.value})} placeholder="Item description" />
                  </td>
                  <td style={{ ...tdS, width:80 }}>
                    <input style={{ ...inp, fontFamily:'DM Mono,monospace', fontSize:10 }}
                      value={l.hsnCode} onChange={e=>updLine(i,{hsnCode:e.target.value})} placeholder="HSN" />
                  </td>
                  <td style={{ ...tdS, width:70 }}>
                    <input type="number" style={{ ...inp, textAlign:'right' }}
                      value={l.qty} min={0} step="0.001"
                      onChange={e=>updLine(i,{qty:parseFloat(e.target.value)||0})} />
                  </td>
                  <td style={{ ...tdS, width:65 }}>
                    <select style={inp} value={l.unit} onChange={e=>updLine(i,{unit:e.target.value})}>
                      {['Nos','Kg','Mtr','Ltr','Box','Set','MT','Gms'].map(u=><option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{ ...tdS, width:90 }}>
                    <input type="number" style={{ ...inp, textAlign:'right' }}
                      value={l.rate} min={0} step="0.01"
                      onChange={e=>updLine(i,{rate:parseFloat(e.target.value)||0})} />
                  </td>
                  <td style={{ ...tdS, width:55 }}>
                    <input type="number" style={{ ...inp, textAlign:'right' }}
                      value={l.discPct} min={0} max={100} step="0.01"
                      onChange={e=>updLine(i,{discPct:parseFloat(e.target.value)||0})} />
                  </td>
                  <td style={{ ...tdS, textAlign:'right', fontFamily:'DM Mono,monospace',
                    background:'#EBF5FB', fontWeight:600, width:100 }}>{fmtC(l.taxable)}</td>
                  <td style={{ ...tdS, width:60 }}>
                    <select style={{ ...inp, fontSize:10 }} value={l.gstRate}
                      onChange={e=>updLine(i,{gstRate:parseFloat(e.target.value)})}>
                      {GST_RATES.map(g=><option key={g} value={g}>{g}%</option>)}
                    </select>
                  </td>
                  <td style={{ ...tdS, textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404', width:85 }}>
                    {isIGST ? fmtC(l.igst) : fmtC(l.cgst)}
                  </td>
                  <td style={{ ...tdS, textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404', width:85 }}>
                    {isIGST ? '—' : fmtC(l.sgst)}
                  </td>
                  <td style={{ ...tdS, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, width:100 }}>
                    {fmtC(l.totalAmt)}
                  </td>
                  {/* GL Account */}
                  <td style={{ ...tdS, width:180 }}>
                    <select style={{ ...inp, fontSize:10, borderColor:'#1F618D' }}
                      value={l.glCode}
                      onChange={e=>updLine(i,{glCode:e.target.value})}>
                      {GL_ACCOUNTS.map(g=>(
                        <option key={g.code} value={g.code}>{g.code} — {g.name}</option>
                      ))}
                    </select>
                  </td>
                  {/* Cost Center */}
                  <td style={{ ...tdS, width:140 }}>
                    <select style={{ ...inp, fontSize:10, borderColor:'#117864' }}
                      value={l.costCenter}
                      onChange={e=>updLine(i,{costCenter:e.target.value})}>
                      {COST_CENTERS.map(cc=>(
                        <option key={cc.code} value={cc.code}>{cc.code} — {cc.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...tdS, textAlign:'center', width:36 }}>
                    <button onClick={()=>delLine(i)}
                      style={{ background:'#F8D7DA', color:'#721C24', border:'none',
                        borderRadius:3, padding:'3px 7px', cursor:'pointer' }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:'#D6EAF8', fontWeight:700 }}>
                <td colSpan={7} style={{ padding:'8px 12px', color:'#1F618D' }}>
                  Totals ({lines.length} line{lines.length!==1?'s':''})
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace' }}>{fmtC(tot.taxable)}</td>
                <td />
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>
                  {isIGST ? fmtC(tot.igst) : fmtC(tot.cgst)}
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>
                  {isIGST ? '—' : fmtC(tot.sgst)}
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontSize:14, color:'#1F618D' }}>
                  {fmtC(tot.total)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Bottom: GL Summary + CC Summary + TDS + Total ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>

        {/* GL Account Summary */}
        <div style={sec}>
          <div style={{ ...secH, background:'linear-gradient(135deg,#1F618D,#2471A3)' }}>
            🏦 GL Account Summary
          </div>
          <div style={secB}>
            {Object.entries(glSummary).map(([code, g])=>(
              <div key={code} style={{ display:'flex', justifyContent:'space-between',
                padding:'6px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                <div>
                  <span style={{ fontFamily:'DM Mono,monospace', color:'#1F618D', fontWeight:700 }}>{code}</span>
                  <span style={{ fontSize:10, color:'#6C757D', marginLeft:6 }}>{g.name}</span>
                </div>
                <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700 }}>{fmtC(g.taxable)}</span>
              </div>
            ))}
            {Object.keys(glSummary).length === 0 && (
              <div style={{ fontSize:11, color:'#CCC' }}>Add line items above</div>
            )}
          </div>
        </div>

        {/* Cost Center Summary */}
        <div style={sec}>
          <div style={{ ...secH, background:'linear-gradient(135deg,#117864,#148F77)' }}>
            🏢 Cost Center Summary
          </div>
          <div style={secB}>
            {Object.entries(ccSummary).map(([code, cc])=>(
              <div key={code} style={{ display:'flex', justifyContent:'space-between',
                padding:'6px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                <div>
                  <span style={{ fontFamily:'DM Mono,monospace', color:'#117864', fontWeight:700 }}>{code}</span>
                  <span style={{ fontSize:10, color:'#6C757D', marginLeft:6 }}>{cc.name}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'DM Mono,monospace', fontWeight:700 }}>{fmtC(cc.amt)}</div>
                  <div style={{ fontSize:9, color:'#6C757D' }}>
                    {tot.taxable > 0 ? ((cc.amt/tot.taxable)*100).toFixed(1)+'%' : '—'}
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(ccSummary).length === 0 && (
              <div style={{ fontSize:11, color:'#CCC' }}>Add line items above</div>
            )}
          </div>
        </div>

        {/* Invoice Total + TDS */}
        <div style={sec}>
          <div style={{ ...secH, background:'linear-gradient(135deg,#784212,#935116)' }}>
            💰 Invoice Summary & TDS
          </div>
          <div style={secB}>
            {[
              ['Taxable Amount',  fmtC(tot.taxable),              '#2D3748'],
              isIGST
                ? ['IGST',        fmtC(tot.igst),                '#856404']
                : ['CGST',        fmtC(tot.cgst),                '#856404'],
              !isIGST
                ? ['SGST',        fmtC(tot.sgst),                '#856404']
                : null,
              ['Gross Total',     fmtC(tot.total),               '#1F618D'],
            ].filter(Boolean).map(([k,v,c])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between',
                padding:'5px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                <span style={{ color:'#6C757D' }}>{k}</span>
                <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:c }}>{v}</span>
              </div>
            ))}

            {/* TDS */}
            <div style={{ marginTop:10, padding:'10px 0', borderTop:'1px solid #E0D5E0' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>TDS Section</label>
                  <input style={inp} value={form.tdsSection}
                    onChange={e=>sf('tdsSection',e.target.value)} placeholder="194C, 194Q..." />
                </div>
                <div style={{ width:80 }}>
                  <label style={lbl}>TDS %</label>
                  <input type="number" style={{ ...inp, textAlign:'right' }}
                    value={form.tdsRate} min={0} max={30} step="0.01"
                    onChange={e=>sf('tdsRate',parseFloat(e.target.value)||0)} />
                </div>
              </div>
              {tdsAmt > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12,
                  color:'#721C24', fontWeight:700, padding:'4px 0' }}>
                  <span>TDS Deduction ({form.tdsRate}%)</span>
                  <span style={{ fontFamily:'DM Mono,monospace' }}>- {fmtC(tdsAmt)}</span>
                </div>
              )}
            </div>

            {/* Net Payable */}
            <div style={{ display:'flex', justifyContent:'space-between',
              padding:'10px 0 4px', borderTop:'2px solid #784212', marginTop:6 }}>
              <span style={{ fontSize:14, fontWeight:800, color:'#784212' }}>NET PAYABLE</span>
              <span style={{ fontSize:18, fontWeight:800, fontFamily:'DM Mono,monospace', color:'#784212' }}>
                {fmtC(netPayable)}
              </span>
            </div>

            {/* JV Preview */}
            <div style={{ marginTop:10, background:'#FFF8E1', border:'1px solid #F5C518',
              borderRadius:5, padding:'8px 10px', fontSize:10, color:'#856404' }}>
              <div style={{ fontWeight:700, marginBottom:4 }}>📒 Auto JV on Post:</div>
              {Object.entries(glSummary).map(([code,g])=>(
                <div key={code}>Dr {code} {g.name.slice(0,20)} {fmtC(g.taxable)}</div>
              ))}
              {(tot.cgst>0) && <div>Dr 1131 CGST ITC {fmtC(tot.cgst)}</div>}
              {(tot.sgst>0) && <div>Dr 1132 SGST ITC {fmtC(tot.sgst)}</div>}
              {(tot.igst>0) && <div>Dr 1133 IGST ITC {fmtC(tot.igst)}</div>}
              <div>Cr 2102 Vendor Payable {fmtC(netPayable)}</div>
              {tdsAmt>0 && <div>Cr 2300 TDS Payable {fmtC(tdsAmt)}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div style={sec}>
        <div style={secH}>📝 Remarks</div>
        <div style={secB}>
          <textarea style={{ ...inp, resize:'vertical' }} rows={2}
            value={form.remarks} onChange={e=>sf('remarks',e.target.value)}
            placeholder="Payment instructions, delivery notes..." />
        </div>
      </div>

      {/* Footer */}
      <div style={{ position:'sticky', bottom:0, background:'#fff', borderTop:'2px solid #E8E0E8',
        padding:'12px 16px', display:'flex', justifyContent:'space-between',
        alignItems:'center', boxShadow:'0 -4px 12px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize:12, color:'#6C757D' }}>
          Net Payable: <strong style={{ color:'#784212', fontFamily:'DM Mono,monospace', fontSize:15 }}>
            {fmtC(netPayable)}
          </strong>
          {tdsAmt>0 && <span style={{ marginLeft:12, color:'#721C24' }}>TDS: {fmtC(tdsAmt)}</span>}
          {form.vendorName && <span style={{ marginLeft:12 }}>— {form.vendorName}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-s" onClick={()=>nav('/mm/vendor-invoices')}>Cancel</button>
          <button className="btn btn-p" disabled={saving} onClick={save}>
            {saving ? '⏳ Posting...' : '📤 Post Invoice + JV'}
          </button>
        </div>
      </div>
    </div>
  )
}
