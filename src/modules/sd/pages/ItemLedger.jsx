import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => `₹${parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'

const STATUS_CLR = {
  confirmed:{ bg:'#D1ECF1', c:'#0C5460' }, pending:{ bg:'#FFF3CD', c:'#856404' },
  overdue:  { bg:'#F8D7DA', c:'#721C24' }, paid:   { bg:'#D4EDDA', c:'#155724' },
  POSTED:   { bg:'#D4EDDA', c:'#155724' }, DRAFT:  { bg:'#F5F5F5', c:'#6C757D' },
  PAID:     { bg:'#D4EDDA', c:'#155724' }, CANCELLED:{ bg:'#F8D7DA', c:'#721C24' },
  IN:       { bg:'#D4EDDA', c:'#155724' }, OUT:    { bg:'#F8D7DA', c:'#721C24' },
}
const sc = (s) => STATUS_CLR[s] || { bg:'#F5F5F5', c:'#6C757D' }

export default function ItemLedger() {
  const nav = useNavigate()
  const [items,      setItems]      = useState([])
  const [selItem,    setSelItem]    = useState(null)
  const [ledger,     setLedger]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [itemOpen,   setItemOpen]   = useState(false)
  const [activeTab,  setActiveTab]  = useState('sales')
  const itemRef = useRef(null)

  // Load item master
  useEffect(() => {
    fetch(`${BASE}/mdm/items?limit=500`, { headers:hdr2() })
      .then(r=>r.json())
      .then(d=>setItems((d.data||[]).filter(i=>['FG','SFG'].includes(i.itemType))))
      .catch(()=>{})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const fn = e => { if (itemRef.current && !itemRef.current.contains(e.target)) setItemOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const loadLedger = async (item) => {
    setSelItem(item)
    setItemOpen(false)
    setSearch(item.name)
    setLedger(null)
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/sd/item-ledger/${encodeURIComponent(item.code)}`, { headers:hdr2() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setLedger(d.data)
    } catch(e) { toast.error('Failed to load ledger') }
    finally { setLoading(false) }
  }

  const filteredItems = search
    ? items.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.code?.toLowerCase().includes(search.toLowerCase())
      ).slice(0,12)
    : items.slice(0,12)

  const salesOrders = ledger?.salesOrders || []
  const invoices    = ledger?.invoices    || []
  const stockLines  = ledger?.stockLines  || []
  const item        = ledger?.item        || selItem

  // Derived totals
  const totalSoQty  = salesOrders.reduce((s,l)=>s+parseFloat(l.qty||0),0)
  const totalSoAmt  = salesOrders.reduce((s,l)=>s+parseFloat(l.amount||l.totalAmt||0),0)
  const totalInvAmt = invoices.reduce((s,i)=>s+parseFloat(i.grandTotal||0),0)
  const stockIn     = stockLines.filter(l=>parseFloat(l.qtyIn||0)>0).reduce((s,l)=>s+parseFloat(l.qty||0),0)
  const stockOut    = stockLines.filter(l=>parseFloat(l.qtyOut||0)>0).reduce((s,l)=>s+parseFloat(l.qty||0),0)
  const currentStock= stockIn - stockOut

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Item Ledger
            <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>360° item view</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Sales Orders · Invoices · Stock movements · Pricing
          </div>
        </div>
      </div>

      {/* Item Search */}
      <div ref={itemRef} style={{position:'relative',marginBottom:16}}>
        <input value={search}
          onChange={e=>{ setSearch(e.target.value); setItemOpen(true) }}
          onFocus={()=>setItemOpen(true)}
          placeholder="Search item code or name..."
          style={{width:'100%',padding:'10px 14px',fontSize:13,border:'2px solid #714B67',
            borderRadius:8,outline:'none',boxSizing:'border-box',fontFamily:'DM Sans,sans-serif'}} />
        {search && <div style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
          fontSize:11,color:'#6C757D'}}>{filteredItems.length} items</div>}
        {itemOpen && filteredItems.length>0 && (
          <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:999,
            background:'#fff',border:'2px solid #714B67',borderTop:'none',borderRadius:'0 0 8px 8px',
            boxShadow:'0 6px 20px rgba(0,0,0,.12)',maxHeight:280,overflowY:'auto'}}>
            {filteredItems.map(i=>(
              <div key={i.id} onClick={()=>loadLedger(i)}
                style={{padding:'9px 14px',cursor:'pointer',borderBottom:'1px solid #F0EEEB',
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}
                onMouseEnter={e=>e.currentTarget.style.background='#F8F4F8'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <div>
                  <div style={{fontWeight:700,fontSize:12}}>{i.name}</div>
                  <div style={{fontSize:10,color:'#6C757D'}}>{i.itemGroup||i.itemType} · HSN: {i.hsnCode||'—'}</div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <code style={{fontSize:10,color:'#714B67',background:'#EDE0EA',padding:'2px 6px',borderRadius:3}}>{i.code}</code>
                  <span style={{fontSize:10,color:'#6C757D'}}>{i.uom}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{padding:60,textAlign:'center',color:'#6C757D'}}>
          <div style={{fontSize:24,marginBottom:8}}>⏳</div>
          <div>Loading item ledger…</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !ledger && (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:32,marginBottom:8}}>🔍</div>
          <div style={{fontWeight:700}}>Search and select an item above</div>
          <div style={{fontSize:12,marginTop:4}}>View sales orders, invoices, stock movements</div>
        </div>
      )}

      {/* Ledger content */}
      {!loading && ledger && (
        <div>
          {/* Item header card */}
          <div style={{background:'linear-gradient(135deg,#714B67,#8B5E7E)',borderRadius:10,
            padding:'16px 20px',marginBottom:14,color:'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:20}}>{item?.name||selItem?.name}</div>
                <div style={{fontSize:12,opacity:.8,marginTop:2}}>
                  <code style={{background:'rgba(255,255,255,.2)',padding:'2px 8px',borderRadius:4}}>
                    {item?.code||selItem?.code}
                  </code>
                  <span style={{marginLeft:8}}>{item?.itemType||item?.itemGroup||'—'}</span>
                  <span style={{marginLeft:8}}>HSN: {item?.hsnCode||'—'}</span>
                  <span style={{marginLeft:8}}>UOM: {item?.uom||selItem?.uom||'—'}</span>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,opacity:.7}}>Sale Price</div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22}}>
                  {INR(item?.salePrice||item?.mrp||0)}
                </div>
              </div>
            </div>
            {/* KPI strip */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:14}}>
              {[
                { l:'Open SO Qty',  v:`${totalSoQty.toLocaleString('en-IN')} ${item?.uom||''}`, c:'#FFF3CD' },
                { l:'SO Value',     v:INR(totalSoAmt),                                           c:'#D1ECF1' },
                { l:'Invoice Value',v:INR(totalInvAmt),                                          c:'#D4EDDA' },
                { l:'Current Stock',v:`${currentStock.toLocaleString('en-IN')} ${item?.uom||''}`,c:'#F8D7DA' },
              ].map(k=>(
                <div key={k.l} style={{background:'rgba(255,255,255,.15)',borderRadius:6,padding:'8px 12px',
                  border:'1px solid rgba(255,255,255,.2)'}}>
                  <div style={{fontSize:10,opacity:.7,marginBottom:2}}>{k.l}</div>
                  <div style={{fontWeight:800,fontSize:14,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex',gap:4,marginBottom:14,padding:'4px 6px',
            background:'#F0EEEB',borderRadius:8,width:'fit-content'}}>
            {[
              ['sales',   `📋 Sales Orders (${salesOrders.length})`],
              ['invoices',`🧾 Invoices (${invoices.length})`],
              ['stock',   `📦 Stock (${stockLines.length})`],
            ].map(([k,l])=>(
              <button key={k} onClick={()=>setActiveTab(k)}
                style={{padding:'6px 16px',borderRadius:6,fontSize:12,fontWeight:600,
                  cursor:'pointer',border:'none',
                  background:activeTab===k?'#714B67':'transparent',
                  color:activeTab===k?'#fff':'#6C757D'}}>
                {l}
              </button>
            ))}
          </div>

          {/* Sales Orders tab */}
          {activeTab==='sales' && (
            salesOrders.length===0 ? (
              <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
                No sales orders found for this item
              </div>
            ) : (
              <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'var(--odoo-purple)'}}>
                      {['SO No.','Customer','Date','Qty','Rate','Amount','Status',''].map(h=>(
                        <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:10,fontWeight:700,
                          color:'#fff',textTransform:'uppercase'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salesOrders.map((l,i)=>{
                      const s = sc(l.order?.status||l.status)
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #F0EEEB',
                          background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                          onClick={()=>nav(`/sd/orders/${l.orderId||l.soId||''}`)}
                          onMouseEnter={e=>e.currentTarget.style.background='#F8F4F8'}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                          <td style={{padding:'9px 12px'}}>
                            <code style={{color:'#714B67',fontWeight:700,fontSize:11}}>{l.order?.soNo||l.soNo}</code>
                          </td>
                          <td style={{padding:'9px 12px',fontWeight:600}}>{l.order?.customerName||l.customerName}</td>
                          <td style={{padding:'9px 12px',color:'#6C757D'}}>{fmtD(l.order?.createdAt||l.date)}</td>
                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                            {parseFloat(l.qty||0).toLocaleString('en-IN')} {item?.uom}
                          </td>
                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace'}}>
                            {INR(l.unitPrice||l.rate)}
                          </td>
                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#2E7D32'}}>
                            {INR(l.totalAmt||l.amount||parseFloat(l.qty||0)*parseFloat(l.unitPrice||l.rate||0))}
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                              background:s.bg,color:s.c}}>{l.order?.status||l.status}</span>
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <button style={{padding:'3px 8px',background:'#EDE0EA',color:'#714B67',
                              border:'none',borderRadius:4,fontSize:10,cursor:'pointer'}}>View</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#F0EEEB',fontWeight:700}}>
                      <td colSpan={3} style={{padding:'8px 12px',fontSize:11,color:'#6C757D',textAlign:'right'}}>Total</td>
                      <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace'}}>
                        {totalSoQty.toLocaleString('en-IN')} {item?.uom}
                      </td>
                      <td></td>
                      <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#2E7D32',fontSize:13}}>
                        {INR(totalSoAmt)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}

          {/* Invoices tab */}
          {activeTab==='invoices' && (
            invoices.length===0 ? (
              <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
                No invoices found for this item
              </div>
            ) : (
              <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'var(--odoo-purple)'}}>
                      {['Invoice No.','Customer','Date','Amount','Status',''].map(h=>(
                        <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:10,fontWeight:700,
                          color:'#fff',textTransform:'uppercase'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv,i)=>{
                      const s = sc(inv.status)
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #F0EEEB',
                          background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                          onClick={()=>nav(`/sd/invoices/${inv.id}`)}
                          onMouseEnter={e=>e.currentTarget.style.background='#F8F4F8'}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAFAFA'}>
                          <td style={{padding:'9px 12px'}}>
                            <code style={{color:'#714B67',fontWeight:700,fontSize:11}}>{inv.invNo}</code>
                          </td>
                          <td style={{padding:'9px 12px',fontWeight:600}}>{inv.customerName}</td>
                          <td style={{padding:'9px 12px',color:'#6C757D'}}>{fmtD(inv.date)}</td>
                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#2E7D32'}}>
                            {INR(inv.grandTotal)}
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                              background:s.bg,color:s.c}}>{inv.status}</span>
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <button style={{padding:'3px 8px',background:'#EDE0EA',color:'#714B67',
                              border:'none',borderRadius:4,fontSize:10,cursor:'pointer'}}>View</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Stock tab */}
          {activeTab==='stock' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
                {[
                  { l:'Stock In',     v:`${stockIn.toLocaleString('en-IN')} ${item?.uom}`,      c:'#155724', bg:'#D4EDDA' },
                  { l:'Stock Out',    v:`${stockOut.toLocaleString('en-IN')} ${item?.uom}`,     c:'#721C24', bg:'#F8D7DA' },
                  { l:'Balance',      v:`${currentStock.toLocaleString('en-IN')} ${item?.uom}`, c:'#714B67', bg:'#EDE0EA' },
                ].map(k=>(
                  <div key={k.l} style={{background:k.bg,borderRadius:8,padding:'12px 16px',border:`1px solid ${k.c}33`}}>
                    <div style={{fontSize:10,color:k.c,fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{k.l}</div>
                    <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:k.c}}>{k.v}</div>
                  </div>
                ))}
              </div>
              {stockLines.length===0 ? (
                <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
                  No stock movements found
                </div>
              ) : (
                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{background:'var(--odoo-purple)'}}>
                        {['Date','Type','Reference','Qty In','Qty Out','Balance','Location',''].map(h=>(
                          <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'#fff',textTransform:'uppercase'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stockLines.map((l,i)=>{
                        const isIn = parseFloat(l.qtyIn||0)>0
                        return (
                          <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                            <td style={{padding:'8px 12px',color:'#6C757D'}}>{fmtD(l.createdAt)}</td>
                            <td style={{padding:'8px 12px'}}>
                              <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,
                                background:isIn?'#D4EDDA':'#F8D7DA',color:isIn?'#155724':'#721C24'}}>
                                {l.movType}
                              </span>
                            </td>
                            <td style={{padding:'8px 12px',fontSize:11,color:'#6C757D'}}>{l.refNo||l.docNo||'—'}</td>
                            <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#155724',fontWeight:700}}>
                              {isIn ? parseFloat(l.qty||0).toLocaleString('en-IN') : '—'}
                            </td>
                            <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',color:'#721C24',fontWeight:700}}>
                              {!isIn ? parseFloat(l.qty||0).toLocaleString('en-IN') : '—'}
                            </td>
                            <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>
                              {parseFloat(l.balance||0).toLocaleString('en-IN')}
                            </td>
                            <td style={{padding:'8px 12px',fontSize:11,color:'#6C757D'}}>{l.location||l.storageLoc||'—'}</td>
                            <td style={{padding:'8px 12px',fontSize:11,color:'#6C757D'}}>{l.narration||'—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
