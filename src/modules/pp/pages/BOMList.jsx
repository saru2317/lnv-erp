import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR = v => '₹' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const calcCost = (lines=[]) => lines.reduce((s,l) => s+(parseFloat(l.stdCost||0)*parseFloat(l.qty||0)*(1+parseFloat(l.scrapPct||0)/100)),0)

const SEED = [
  { id:1, bomNo:'BOM-2026-0001', itemCode:'CAP-20ML',  itemName:'PP Cap 20ml',         revision:'A', baseQty:1000, uom:'Nos', status:'Active',
    lines:[
      { id:1,  seqNo:10, itemCode:'RM-PP-001',   itemName:'PP Resin (Natural)',       qty:1.05,  uom:'Kg',  scrapPct:2, stdCost:85  },
      { id:2,  seqNo:20, itemCode:'RM-MB-001',   itemName:'Masterbatch (White)',      qty:0.025, uom:'Kg',  scrapPct:0, stdCost:220 },
      { id:3,  seqNo:30, itemCode:'PKG-BAG-001', itemName:'Poly Bag (1000 pcs)',      qty:1,     uom:'Nos', scrapPct:0, stdCost:12  },
      { id:4,  seqNo:40, itemCode:'PKG-BOX-001', itemName:'Corrugated Box',           qty:0.05,  uom:'Nos', scrapPct:0, stdCost:35  },
    ]},
  { id:2, bomNo:'BOM-2026-0002', itemCode:'CTN-500ML', itemName:'HDPE Container 500ml', revision:'A', baseQty:500, uom:'Nos', status:'Active',
    lines:[
      { id:5,  seqNo:10, itemCode:'RM-HDPE-001', itemName:'HDPE Resin (Natural)',     qty:0.045, uom:'Kg',  scrapPct:3, stdCost:95  },
      { id:6,  seqNo:20, itemCode:'RM-MB-002',   itemName:'Masterbatch (Blue)',       qty:0.003, uom:'Kg',  scrapPct:0, stdCost:280 },
      { id:7,  seqNo:30, itemCode:'CAP-20ML',    itemName:'PP Cap 20ml',              qty:1,     uom:'Nos', scrapPct:1, stdCost:0.8 },
      { id:8,  seqNo:40, itemCode:'LBL-001',     itemName:'Printed Label',            qty:1,     uom:'Nos', scrapPct:0, stdCost:0.5 },
      { id:9,  seqNo:50, itemCode:'PKG-SHK-001', itemName:'Shrink Wrap',              qty:0.002, uom:'Kg',  scrapPct:0, stdCost:180 },
    ]},
  { id:3, bomNo:'BOM-2026-0003', itemCode:'HSG-ABS01', itemName:'ABS Housing Cover',   revision:'B', baseQty:100, uom:'Nos', status:'Active',
    lines:[
      { id:10, seqNo:10, itemCode:'RM-ABS-001',  itemName:'ABS Resin (Black)',        qty:0.12,  uom:'Kg',  scrapPct:2, stdCost:140 },
      { id:11, seqNo:20, itemCode:'RM-INS-001',  itemName:'Brass Insert M3',          qty:4,     uom:'Nos', scrapPct:0, stdCost:2.5 },
      { id:12, seqNo:30, itemCode:'PKG-FM-001',  itemName:'EPE Foam Sheet',           qty:0.005, uom:'Kg',  scrapPct:0, stdCost:120 },
      { id:13, seqNo:40, itemCode:'PKG-BOX-002', itemName:'Small Corrugated Box',     qty:0.1,   uom:'Nos', scrapPct:0, stdCost:18  },
    ]},
  { id:4, bomNo:'BOM-2026-0004', itemCode:'NGR-24T',   itemName:'Nylon Gear 24T',     revision:'A', baseQty:500, uom:'Nos', status:'Draft',
    lines:[
      { id:14, seqNo:10, itemCode:'RM-PA66-001', itemName:'Nylon PA66 (30% GF)',      qty:0.035, uom:'Kg',  scrapPct:3, stdCost:320 },
      { id:15, seqNo:20, itemCode:'RM-LUB-001',  itemName:'PTFE Lubricant',           qty:0.001, uom:'Kg',  scrapPct:0, stdCost:850 },
      { id:16, seqNo:30, itemCode:'PKG-ZIP-001', itemName:'Zip Lock Bag',             qty:0.02,  uom:'Nos', scrapPct:0, stdCost:8   },
    ]},
]

const STATUS_CFG = { Active:{bg:'#D4EDDA',c:'#155724'}, Draft:{bg:'#FFF3CD',c:'#856404'}, Obsolete:{bg:'#F8D7DA',c:'#721C24'} }

export default function BOMList() {
  const navigate   = useNavigate()
  const [boms,     setBoms]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [search,   setSearch]   = useState('')
  const [statFilt, setStatFilt] = useState('All')
  const [deleting, setDeleting] = useState(null)

  const fetchBOMs = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/pp/bom`, { headers: authHdrs() })
      const data = await res.json()
      setBoms(data.data?.length ? data.data : SEED)
    } catch { setBoms(SEED) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBOMs() }, [])

  const deleteBOM = async (bom) => {
    if (!confirm(`Delete BOM ${bom.bomNo} — ${bom.itemName}?`)) return
    setDeleting(bom.id)
    try {
      await fetch(`${BASE_URL}/pp/bom/${bom.id}`, { method:'DELETE', headers: authHdrs() })
      toast.success(`BOM ${bom.bomNo} deleted`)
      fetchBOMs()
    } catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  const filtered = boms.filter(b =>
    (statFilt==='All' || b.status===statFilt) &&
    (!search || b.bomNo?.toLowerCase().includes(search.toLowerCase()) ||
      b.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      b.itemName?.toLowerCase().includes(search.toLowerCase()))
  )

  const kpis = [
    { label:'Total BOMs',   value:boms.length,                                    bg:'#EBF5FB',c:'#1A5276' },
    { label:'Active',       value:boms.filter(b=>b.status==='Active').length,     bg:'#D4EDDA',c:'#155724' },
    { label:'Draft',        value:boms.filter(b=>b.status==='Draft').length,      bg:'#FFF3CD',c:'#856404' },
    { label:'Obsolete',     value:boms.filter(b=>b.status==='Obsolete').length,   bg:'#F8D7DA',c:'#721C24' },
    { label:'Total Components', value:boms.reduce((s,b)=>s+(b.lines?.length||0),0), bg:'#F4ECF7',c:'#6C3483' },
  ]

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:13}}>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Bill of Materials<small>SAP: CS01/CS03 · PP Master Data · {filtered.length} BOMs</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={fetchBOMs}>🔄 Refresh</button>
          <button className="btn btn-s sd-bsm">📤 Export</button>
          <button className="btn btn-p" onClick={()=>navigate('/pp/bom/new')}>+ Create BOM</button>
        </div>
      </div>

      <div style={{padding:'8px 12px',background:'#EBF5FB',border:'1px solid #AED6F1',borderRadius:6,marginBottom:14,fontSize:12,color:'#1A5276'}}>
        <strong>BOM is PP Master Data</strong> — Maintained by Process/Production Engineer · Referenced by Work Orders, MRP & Job Costing
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:k.bg,border:`1px solid ${k.c}22`,borderRadius:8,padding:'10px 14px'}}>
            <div style={{fontSize:10,fontWeight:700,color:k.c,textTransform:'uppercase',letterSpacing:.4}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        <input placeholder="Search BOM No / Item Code / Name..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{padding:'7px 12px',border:'1.5px solid #D0D7DE',borderRadius:6,fontSize:12,outline:'none',width:300}} />
        {['All','Active','Draft','Obsolete'].map(s=>(
          <button key={s} onClick={()=>setStatFilt(s)}
            style={{padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',border:'none',
              background:statFilt===s?'#1A5276':'#F0F0F0', color:statFilt===s?'#fff':'#6C757D'}}>
            {s}
          </button>
        ))}
        <span style={{fontSize:11,color:'#6C757D',marginLeft:'auto'}}>{filtered.length} BOMs</span>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>⏳ Loading BOMs...</div>
      ) : filtered.length===0 ? (
        <div style={{padding:60,textAlign:'center',border:'2px dashed #E0D5E0',borderRadius:8,background:'#fff'}}>
          <div style={{fontSize:36,marginBottom:10}}>📐</div>
          <div style={{fontWeight:700,fontSize:15}}>No BOMs found</div>
          <div style={{fontSize:12,color:'#6C757D',marginTop:6}}>Create a BOM for each finished product you manufacture</div>
          <button onClick={()=>navigate('/pp/bom/new')}
            style={{marginTop:14,padding:'9px 24px',background:'#1A5276',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            + Create First BOM
          </button>
        </div>
      ) : (
        <div style={{border:'1.5px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
          <table className="fi-data-table" style={{width:'100%'}}>
            <thead style={{position:'sticky',top:0,background:'#F8F9FA',zIndex:5}}>
              <tr>
                <th style={{width:30}}></th>
                <th>BOM No.</th><th>Item Code</th><th>Finished Product</th>
                <th>Rev</th><th>Base Qty</th><th>Components</th>
                <th>BOM Cost</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b,i)=>{
                const isOpen = expanded===b.id
                const cost   = calcCost(b.lines||[])
                const sc     = STATUS_CFG[b.status]||STATUS_CFG.Draft
                return (
                  <React.Fragment key={b.id}>
                    <tr style={{background:isOpen?'#EBF5FB':i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                      onClick={()=>setExpanded(isOpen?null:b.id)}>
                      <td style={{textAlign:'center',fontSize:13,color:'#1A5276',fontWeight:700}}>{isOpen?'▼':'▶'}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontWeight:800,color:'#1A5276',fontSize:12}}>{b.bomNo}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{b.itemCode}</td>
                      <td style={{fontWeight:700}}>{b.itemName}</td>
                      <td><span style={{background:'#EDE0EA',color:'#714B67',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>Rev {b.revision}</span></td>
                      <td style={{fontFamily:'DM Mono,monospace',fontWeight:600}}>{parseFloat(b.baseQty||1).toLocaleString()} {b.uom}</td>
                      <td style={{fontWeight:700,color:'#1A5276'}}>{b.lines?.length||0} items</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{cost>0?INR(cost):'—'}</td>
                      <td><span style={{padding:'3px 10px',borderRadius:8,fontSize:10,fontWeight:700,background:sc.bg,color:sc.c}}>{b.status}</span></td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={()=>navigate(`/pp/bom/${b.id}`)}
                            style={{padding:'3px 8px',fontSize:10,fontWeight:700,borderRadius:4,border:'1px solid #1A5276',background:'#EBF5FB',color:'#1A5276',cursor:'pointer'}}>Edit</button>
                          <button onClick={()=>navigate(`/pp/bom/new?copy=${b.id}`)}
                            style={{padding:'3px 8px',fontSize:10,fontWeight:700,borderRadius:4,border:'1px solid #6C757D',background:'#F8F9FA',color:'#6C757D',cursor:'pointer'}}>Copy</button>
                          <button onClick={()=>deleteBOM(b)} disabled={deleting===b.id}
                            style={{padding:'3px 8px',fontSize:10,fontWeight:700,borderRadius:4,border:'1px solid #DC3545',background:'#F8D7DA',color:'#721C24',cursor:'pointer'}}>
                            {deleting===b.id?'...':'Del'}</button>
                        </div>
                      </td>
                    </tr>

                    {isOpen&&(
                      <tr>
                        <td colSpan={10} style={{padding:0,background:'#F0F8FF'}}>
                          <div style={{padding:16}}>
                            <div style={{fontWeight:800,fontSize:12,color:'#1A5276',marginBottom:10}}>
                              📋 Components — {b.bomNo} | {b.itemName}
                            </div>
                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                              <thead>
                                <tr style={{background:'#1A5276',color:'#fff'}}>
                                  <th style={{padding:'6px 12px',textAlign:'center',width:60}}>Seq</th>
                                  <th style={{padding:'6px 12px',textAlign:'left',width:110}}>Item Code</th>
                                  <th style={{padding:'6px 12px',textAlign:'left'}}>Component / Material</th>
                                  <th style={{padding:'6px 12px',textAlign:'center',width:70}}>Qty</th>
                                  <th style={{padding:'6px 12px',textAlign:'center',width:60}}>UOM</th>
                                  <th style={{padding:'6px 12px',textAlign:'center',width:70}}>Scrap %</th>
                                  <th style={{padding:'6px 12px',textAlign:'right',width:100}}>Std Cost</th>
                                  <th style={{padding:'6px 12px',textAlign:'right',width:110}}>Line Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(b.lines||[]).map((l,li)=>{
                                  const lc = parseFloat(l.stdCost||0)*parseFloat(l.qty||0)*(1+parseFloat(l.scrapPct||0)/100)
                                  return (
                                    <tr key={l.id||li} style={{background:li%2===0?'#fff':'#F0F8FF',borderBottom:'1px solid #E0EDF8'}}>
                                      <td style={{padding:'6px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#1A5276',fontSize:11}}>{l.seqNo||(li+1)*10}</td>
                                      <td style={{padding:'6px 12px',fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{l.itemCode||'—'}</td>
                                      <td style={{padding:'6px 12px',fontWeight:600}}>{l.itemName}</td>
                                      <td style={{padding:'6px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}>{parseFloat(l.qty||0)}</td>
                                      <td style={{padding:'6px 12px',textAlign:'center',fontSize:11,color:'#6C757D'}}>{l.uom}</td>
                                      <td style={{padding:'6px 12px',textAlign:'center',color:parseFloat(l.scrapPct)>0?'#856404':'#6C757D'}}>{parseFloat(l.scrapPct||0)}%</td>
                                      <td style={{padding:'6px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{l.stdCost>0?INR(l.stdCost):'—'}</td>
                                      <td style={{padding:'6px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{lc>0?INR(lc):'—'}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                              <tfoot style={{background:'#1A5276',color:'#fff'}}>
                                <tr>
                                  <td colSpan={6} style={{padding:'8px 12px',fontWeight:700}}>Total BOM Cost (per {parseFloat(b.baseQty||1).toLocaleString()} {b.uom})</td>
                                  <td colSpan={2} style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#A9DFBF'}}>{INR(cost)}</td>
                                </tr>
                              </tfoot>
                            </table>
                            <div style={{display:'flex',gap:8,marginTop:10}}>
                              <button onClick={()=>navigate(`/pp/bom/${b.id}`)}
                                style={{padding:'6px 16px',background:'#1A5276',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                                ✏️ Edit BOM
                              </button>
                              <button onClick={()=>navigate(`/pp/wo/new?itemCode=${b.itemCode}&itemName=${encodeURIComponent(b.itemName)}`)}
                                style={{padding:'6px 16px',background:'#155724',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                                🏭 Create Work Order
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
