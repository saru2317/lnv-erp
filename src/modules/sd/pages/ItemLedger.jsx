import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Master Items ─────────────────────────────────────────
const ITEMS = [
  { code:'SV-PC-001', name:'Powder Coating — RAL 9005 Black',  cat:'Surface Treatment', uom:'Kg',  hsn:'9999 99 00' },
  { code:'SV-PC-002', name:'Powder Coating — RAL 9010 White',  cat:'Surface Treatment', uom:'Kg',  hsn:'9999 99 00' },
  { code:'SV-ST-001', name:'Surface Treatment — Phosphating',  cat:'Surface Treatment', uom:'Kg',  hsn:'9999 99 01' },
  { code:'PR-001',    name:'ARISER COMFACT SYSTEM',            cat:'Product',           uom:'Nos', hsn:'8448 59 90' },
  { code:'PR-002',    name:'COMPACT SPARES — SET',             cat:'Product',           uom:'Set', hsn:'8448 49 00' },
  { code:'PR-003',    name:'LATTICE APRONS C121',              cat:'Product',           uom:'Nos', hsn:'8448 49 10' },
  { code:'JW-001',    name:'Job Work — Labour Charge (Powder)',cat:'Job Work',          uom:'Kg',  hsn:'9988 10 00' },
  { code:'RM-001',    name:'Powder Coat Raw Material',         cat:'Raw Material',      uom:'Kg',  hsn:'3208 10 00' },
  { code:'RM-002',    name:'Phosphating Chemical',             cat:'Raw Material',      uom:'Ltr', hsn:'2812 10 00' },
]

// ── Item-wise data ───────────────────────────────────────
const ITEM_DATA = {
  'SV-PC-001': {
    stock: { current:1240, reserved:800, available:440, reorderLevel:500, unit:'Kg' },
    salesOrders: [
      { soNo:'SO-0124', date:'27 Jan 26', customer:'Sri Lakshmi Mills',  qty:500, rate:850, amount:425000, status:'confirmed' },
      { soNo:'SO-0123', date:'25 Jan 26', customer:'Coimbatore Spinners',qty:800, rate:850, amount:680000, status:'pending'   },
      { soNo:'SO-0121', date:'20 Jan 26', customer:'ARS Cotton Mills',   qty:300, rate:870, amount:261000, status:'overdue'   },
      { soNo:'SO-0119', date:'10 Jan 26', customer:'Vijay Fabrics',      qty:200, rate:850, amount:170000, status:'paid'      },
      { soNo:'SO-0118', date:'05 Jan 26', customer:'Rajesh Textiles',    qty:150, rate:840, amount:126000, status:'paid'      },
    ],
    purchaseOrders: [
      { poNo:'PO-0089', date:'15 Mar 26', vendor:'Lakshmi Textile Mills', qty:500, rate:1600, amount:800000, status:'grn_done'  },
      { poNo:'PO-0085', date:'01 Mar 26', vendor:'Coimbatore Spares Co.', qty:300, rate:1550, amount:465000, status:'pending'   },
      { poNo:'PO-0079', date:'10 Feb 26', vendor:'Sri Murugan Traders',   qty:400, rate:1620, amount:648000, status:'grn_done'  },
    ],
    production: [
      { woNo:'WO-0047', date:'18 Mar 26', product:'Powder Coated Brackets', qty:500, consumed:45, unit:'Kg', status:'in_progress' },
      { woNo:'WO-0045', date:'10 Mar 26', product:'Surface Treated Flanges', qty:300, consumed:28, unit:'Kg', status:'completed'  },
      { woNo:'WO-0043', date:'01 Mar 26', product:'OE Components — Batch',  qty:800, consumed:72, unit:'Kg', status:'completed'  },
    ],
  },
  'PR-001': {
    stock: { current:48, reserved:30, available:18, reorderLevel:20, unit:'Nos' },
    salesOrders: [
      { soNo:'SO-0124', date:'27 Jan 26', customer:'Sri Lakshmi Mills',  qty:200, rate:1200, amount:240000, status:'confirmed' },
      { soNo:'SO-0122', date:'22 Jan 26', customer:'Rajesh Textiles',    qty:100, rate:1200, amount:120000, status:'delivered' },
      { soNo:'SO-0120', date:'18 Jan 26', customer:'Vijay Fabrics',      qty:50,  rate:1200, amount:60000,  status:'paid'      },
    ],
    purchaseOrders: [
      { poNo:'PO-0082', date:'20 Feb 26', vendor:'Direct Import',        qty:200, rate:800,  amount:160000, status:'pending'   },
    ],
    production: [
      { woNo:'WO-0046', date:'15 Mar 26', product:'ARISER COMFACT SYSTEM Assembly', qty:200, consumed:200, unit:'Nos', status:'in_progress' },
    ],
  },
}

// Default data for items without specific data
const DEFAULT_DATA = {
  stock: { current:0, reserved:0, available:0, reorderLevel:0, unit:'Nos' },
  salesOrders: [], purchaseOrders: [], production: [],
}

const STATUS_COLORS = {
  confirmed:   {bg:'#D4EDDA',c:'#155724'},
  pending:     {bg:'#FFF3CD',c:'#856404'},
  delivered:   {bg:'#D1ECF1',c:'#0C5460'},
  overdue:     {bg:'#F8D7DA',c:'#721C24'},
  paid:        {bg:'#D4EDDA',c:'#155724'},
  grn_done:    {bg:'#D4EDDA',c:'#155724'},
  in_progress: {bg:'#FFF3CD',c:'#856404'},
  completed:   {bg:'#D1ECF1',c:'#0C5460'},
}

const fmt = n => '₹'+Number(n||0).toLocaleString('en-IN')
const CAT_COLORS = {
  'Surface Treatment':{bg:'#EBF2F8',c:'#1A5276'},
  'Product':          {bg:'#EDE0EA',c:'#714B67'},
  'Job Work':         {bg:'#FFF3CD',c:'#856404'},
  'Raw Material':     {bg:'#D4EDDA',c:'#155724'},
}

export default function ItemLedger() {
  const navigate  = useNavigate()
  const [selItem, setSelItem] = useState(ITEMS[0].code)
  const [tab,     setTab]     = useState('so')
  const [search,  setSearch]  = useState('')
  const [catFilter, setCat]   = useState('All')

  const item  = ITEMS.find(i => i.code === selItem)
  const data  = ITEM_DATA[selItem] || DEFAULT_DATA
  const cats  = ['All', ...new Set(ITEMS.map(i => i.cat))]

  const filteredItems = ITEMS.filter(i =>
    (catFilter === 'All' || i.cat === catFilter) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) ||
     i.code.toLowerCase().includes(search.toLowerCase()))
  )

  const totalSO  = data.salesOrders.reduce((s,r) => s+r.amount, 0)
  const totalPO  = data.purchaseOrders.reduce((s,r) => s+r.amount, 0)
  const totalProd= data.production.reduce((s,r) => s+r.consumed, 0)

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Item Ledger <small>Item-wise SO · PO · Stock · Production</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => navigate('/sd/orders')}>
            Back to SO List
          </button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:16, alignItems:'start'}}>

        {/* ── LEFT: Item selector ── */}
        <div style={{background:'#fff', border:'1px solid var(--odoo-border)',
          borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'10px 14px', background:'var(--odoo-purple)',
            color:'#fff', fontSize:12, fontWeight:700}}>
            Items ({filteredItems.length})
          </div>

          {/* Search + Category filter */}
          <div style={{padding:'8px 10px', borderBottom:'1px solid var(--odoo-border)'}}>
            <input placeholder="Search item code or name..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{width:'100%', padding:'6px 10px', border:'1px solid var(--odoo-border)',
                borderRadius:5, fontSize:11, outline:'none', marginBottom:6}}/>
            <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
              {cats.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  style={{padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600,
                    cursor:'pointer', border:'1px solid var(--odoo-border)',
                    background: catFilter===c ? 'var(--odoo-dark)' : '#fff',
                    color: catFilter===c ? '#fff' : 'var(--odoo-gray)'}}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Item list */}
          {filteredItems.map(i => {
            const cc = CAT_COLORS[i.cat] || {bg:'#eee',c:'#555'}
            const d  = ITEM_DATA[i.code]
            return (
              <div key={i.code} onClick={() => { setSelItem(i.code); setTab('so') }}
                style={{padding:'10px 14px', cursor:'pointer',
                  background: selItem===i.code ? 'var(--odoo-purple-lt)' : '#fff',
                  borderLeft: selItem===i.code ? '3px solid var(--odoo-purple)' : '3px solid transparent',
                  borderBottom:'1px solid var(--odoo-border)', transition:'all .15s'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12, fontWeight:700,
                      color: selItem===i.code ? 'var(--odoo-purple)' : 'var(--odoo-dark)',
                      marginBottom:3, lineHeight:1.3}}>
                      {i.name}
                    </div>
                    <div style={{display:'flex', gap:5, alignItems:'center'}}>
                      <span style={{fontFamily:'DM Mono,monospace', fontSize:10,
                        color:'var(--odoo-gray)'}}>{i.code}</span>
                      <span style={{padding:'1px 5px', borderRadius:5, fontSize:9,
                        fontWeight:700, background:cc.bg, color:cc.c}}>{i.cat}</span>
                    </div>
                  </div>
                  {/* Mini stock indicator */}
                  {d && (
                    <div style={{textAlign:'right', fontSize:10}}>
                      <div style={{fontWeight:700, color: d.stock.available < d.stock.reorderLevel ?
                        'var(--odoo-red)' : 'var(--odoo-green)'}}>
                        {d.stock.available}
                      </div>
                      <div style={{color:'var(--odoo-gray)'}}>{i.uom}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── RIGHT: Item details ── */}
        <div>
          {/* Item header */}
          <div style={{background:'var(--odoo-purple)', borderRadius:8, padding:'14px 18px',
            marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800,
                color:'#fff'}}>{item?.name}</div>
              <div style={{fontSize:11, color:'rgba(255,255,255,.65)', marginTop:3}}>
                {item?.code} &nbsp;·&nbsp; HSN: {item?.hsn} &nbsp;·&nbsp; UOM: {item?.uom}
              </div>
            </div>
            <div style={{display:'flex', gap:12}}>
              {[
                ['SO Orders',   data.salesOrders.length,  '#F5C518'],
                ['PO Orders',   data.purchaseOrders.length,'#00A09D'],
                ['Work Orders', data.production.length,   '#E06F39'],
              ].map(([l,v,c]) => (
                <div key={l} style={{textAlign:'center', background:'rgba(255,255,255,.12)',
                  borderRadius:8, padding:'8px 14px'}}>
                  <div style={{fontFamily:'Syne,sans-serif', fontSize:22,
                    fontWeight:800, color:c}}>{v}</div>
                  <div style={{fontSize:10, color:'rgba(255,255,255,.65)'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock KPIs */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14}}>
            {[
              {l:'Current Stock',   v:data.stock.current+' '+data.stock.unit,  cls:'blue'  },
              {l:'Reserved (Open Orders)', v:data.stock.reserved+' '+data.stock.unit, cls:'orange'},
              {l:'Available Stock', v:data.stock.available+' '+data.stock.unit,
                cls: data.stock.available < data.stock.reorderLevel ? 'red' : 'green' },
              {l:'Reorder Level',   v:data.stock.reorderLevel+' '+data.stock.unit, cls:'purple'},
            ].map(k => (
              <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
                <div className="fi-kpi-label">{k.l}</div>
                <div className="fi-kpi-value">{k.v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:'flex', gap:0, borderBottom:'2px solid var(--odoo-border)',
            marginBottom:14, background:'#fff', borderRadius:'8px 8px 0 0',
            border:'1px solid var(--odoo-border)', borderBottomWidth:0}}>
            {[
              ['so',   `Sales Orders (${data.salesOrders.length})`,    fmt(totalSO)  ],
              ['po',   `Purchase Orders (${data.purchaseOrders.length})`, fmt(totalPO)],
              ['prod', `Production (${data.production.length})`,        totalProd+' '+data.stock.unit+' consumed'],
            ].map(([k,l,sub]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{padding:'10px 20px', fontSize:12, fontWeight:600, cursor:'pointer',
                  border:'none', background:'transparent',
                  borderBottom: tab===k ? '2px solid var(--odoo-purple)' : '2px solid transparent',
                  color: tab===k ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                  marginBottom:-1, display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
                <span>{l}</span>
                <span style={{fontSize:10, fontWeight:400, color:'var(--odoo-gray)', marginTop:1}}>{sub}</span>
              </button>
            ))}
          </div>

          {/* ── SALES ORDERS TAB ── */}
          {tab === 'so' && (
            <div style={{background:'#fff', border:'1px solid var(--odoo-border)',
              borderRadius:'0 0 8px 8px', overflow:'hidden'}}>
              {data.salesOrders.length === 0 ? (
                <div style={{padding:30, textAlign:'center', color:'var(--odoo-gray)', fontSize:13}}>
                  No sales orders found for this item.
                </div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'var(--odoo-purple)'}}>
                      {['SO Number','Date','Customer','Qty Ordered','Rate','Amount','Status','Action'].map(h=>(
                        <th key={h} style={{padding:'9px 12px', color:'#fff', fontSize:11,
                          fontWeight:700, textAlign:'left', borderRight:'1px solid rgba(255,255,255,.1)'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.salesOrders.map((r,i) => {
                      const sc = STATUS_COLORS[r.status] || {bg:'#eee',c:'#555'}
                      return (
                        <tr key={r.soNo} style={{background:i%2===0?'#fff':'#FAFAFA',
                          borderBottom:'1px solid var(--odoo-border)'}}>
                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',
                            fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.soNo}</td>
                          <td style={{padding:'9px 12px',fontSize:12}}>{r.date}</td>
                          <td style={{padding:'9px 12px',fontWeight:600,fontSize:12}}>{r.customer}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                            fontWeight:700,fontSize:13}}>{r.qty} <span style={{fontSize:10,color:'var(--odoo-gray)'}}>{item?.uom}</span></td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{fmt(r.rate)}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                            fontWeight:700,color:'var(--odoo-purple)',fontSize:13}}>{fmt(r.amount)}</td>
                          <td style={{padding:'9px 12px'}}>
                            <span style={{padding:'3px 9px',borderRadius:10,fontSize:11,
                              fontWeight:700,background:sc.bg,color:sc.c}}>{r.status.toUpperCase()}</span>
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <button onClick={() => navigate(`/sd/orders/${r.soNo}`)}
                              style={{padding:'3px 10px',fontSize:11,fontWeight:600,
                                borderRadius:5,border:'1px solid var(--odoo-purple)',
                                background:'var(--odoo-purple-lt)',color:'var(--odoo-purple)',
                                cursor:'pointer'}}>View SO</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'var(--odoo-purple-lt)'}}>
                      <td colSpan={3} style={{padding:'10px 12px',fontWeight:700,
                        color:'var(--odoo-purple)',fontFamily:'Syne,sans-serif'}}>
                        TOTAL — {data.salesOrders.length} Orders
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:13,color:'var(--odoo-purple)'}}>
                        {data.salesOrders.reduce((s,r)=>s+r.qty,0)} {item?.uom}
                      </td>
                      <td/>
                      <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:14,color:'var(--odoo-purple)'}}>
                        {fmt(totalSO)}
                      </td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {/* ── PURCHASE ORDERS TAB ── */}
          {tab === 'po' && (
            <div style={{background:'#fff', border:'1px solid var(--odoo-border)',
              borderRadius:'0 0 8px 8px', overflow:'hidden'}}>
              {data.purchaseOrders.length === 0 ? (
                <div style={{padding:30, textAlign:'center', color:'var(--odoo-gray)', fontSize:13}}>
                  No purchase orders found for this item.
                </div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#1A5276'}}>
                      {['PO Number','Date','Vendor','Qty Ordered','Rate','Amount','Status','Action'].map(h=>(
                        <th key={h} style={{padding:'9px 12px',color:'#fff',fontSize:11,
                          fontWeight:700,textAlign:'left',borderRight:'1px solid rgba(255,255,255,.1)'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchaseOrders.map((r,i) => {
                      const sc = STATUS_COLORS[r.status] || {bg:'#eee',c:'#555'}
                      return (
                        <tr key={r.poNo} style={{background:i%2===0?'#fff':'#F0F5FB',
                          borderBottom:'1px solid var(--odoo-border)'}}>
                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',
                            fontWeight:700,color:'#1A5276',fontSize:12}}>{r.poNo}</td>
                          <td style={{padding:'9px 12px',fontSize:12}}>{r.date}</td>
                          <td style={{padding:'9px 12px',fontWeight:600,fontSize:12}}>{r.vendor}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                            fontWeight:700,fontSize:13}}>{r.qty} <span style={{fontSize:10,color:'var(--odoo-gray)'}}>{item?.uom}</span></td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{fmt(r.rate)}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                            fontWeight:700,color:'#1A5276',fontSize:13}}>{fmt(r.amount)}</td>
                          <td style={{padding:'9px 12px'}}>
                            <span style={{padding:'3px 9px',borderRadius:10,fontSize:11,
                              fontWeight:700,background:sc.bg,color:sc.c}}>{r.status.toUpperCase().replace('_',' ')}</span>
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <button onClick={() => navigate('/mm/po')}
                              style={{padding:'3px 10px',fontSize:11,fontWeight:600,
                                borderRadius:5,border:'1px solid #1A5276',
                                background:'#EBF2F8',color:'#1A5276',cursor:'pointer'}}>View PO</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#EBF2F8'}}>
                      <td colSpan={3} style={{padding:'10px 12px',fontWeight:700,
                        color:'#1A5276',fontFamily:'Syne,sans-serif'}}>
                        TOTAL — {data.purchaseOrders.length} Orders
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:13,color:'#1A5276'}}>
                        {data.purchaseOrders.reduce((s,r)=>s+r.qty,0)} {item?.uom}
                      </td>
                      <td/>
                      <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:14,color:'#1A5276'}}>
                        {fmt(totalPO)}
                      </td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {/* ── PRODUCTION TAB ── */}
          {tab === 'prod' && (
            <div style={{background:'#fff', border:'1px solid var(--odoo-border)',
              borderRadius:'0 0 8px 8px', overflow:'hidden'}}>
              {data.production.length === 0 ? (
                <div style={{padding:30, textAlign:'center', color:'var(--odoo-gray)', fontSize:13}}>
                  No production work orders found for this item.
                </div>
              ) : (
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#784212'}}>
                      {['WO Number','Date','Product / Job','Planned Qty','Consumed','Unit','Status','Action'].map(h=>(
                        <th key={h} style={{padding:'9px 12px',color:'#fff',fontSize:11,
                          fontWeight:700,textAlign:'left',borderRight:'1px solid rgba(255,255,255,.1)'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.production.map((r,i) => {
                      const sc = STATUS_COLORS[r.status] || {bg:'#eee',c:'#555'}
                      return (
                        <tr key={r.woNo} style={{background:i%2===0?'#fff':'#FBF5EE',
                          borderBottom:'1px solid var(--odoo-border)'}}>
                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',
                            fontWeight:700,color:'#784212',fontSize:12}}>{r.woNo}</td>
                          <td style={{padding:'9px 12px',fontSize:12}}>{r.date}</td>
                          <td style={{padding:'9px 12px',fontWeight:600,fontSize:12}}>{r.product}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                            fontWeight:600}}>{r.qty}</td>
                          <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                            fontWeight:800,fontSize:13,color:'#784212'}}>{r.consumed}</td>
                          <td style={{padding:'9px 12px',fontSize:11,color:'var(--odoo-gray)'}}>{r.unit}</td>
                          <td style={{padding:'9px 12px'}}>
                            <span style={{padding:'3px 9px',borderRadius:10,fontSize:11,
                              fontWeight:700,background:sc.bg,color:sc.c}}>
                              {r.status.toUpperCase().replace('_',' ')}
                            </span>
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <button onClick={() => navigate('/pp/wo')}
                              style={{padding:'3px 10px',fontSize:11,fontWeight:600,
                                borderRadius:5,border:'1px solid #784212',
                                background:'#FBF5EE',color:'#784212',cursor:'pointer'}}>View WO</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#FBF5EE'}}>
                      <td colSpan={4} style={{padding:'10px 12px',fontWeight:700,
                        color:'#784212',fontFamily:'Syne,sans-serif'}}>
                        TOTAL — {data.production.length} Work Orders
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:14,color:'#784212'}}>
                        {totalProd} {data.stock.unit}
                      </td>
                      <td colSpan={3}/>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
