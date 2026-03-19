import React, { useState } from 'react'
import toast from 'react-hot-toast'

// ── Sample Items ──────────────────────────────────────
const ITEMS = [
  { code:'SV-PC-001', name:'Powder Coating — RAL 9005 Black', group:'Surface Treatment', uom:'Kg',  gst:18, stdRate:850,  status:'active', cat:'Service'      },
  { code:'SV-PC-002', name:'Powder Coating — RAL 9010 White', group:'Surface Treatment', uom:'Kg',  gst:18, stdRate:850,  status:'active', cat:'Service'      },
  { code:'PR-001',    name:'ARISER COMFACT SYSTEM',           group:'Finished Goods',    uom:'Nos', gst:18, stdRate:1200, status:'active', cat:'Finished Good'},
  { code:'RM-001',    name:'Powder Coat Raw Material',        group:'Raw Materials',      uom:'Kg',  gst:18, stdRate:1600, status:'active', cat:'Raw Material' },
  { code:'SP-001',    name:'Masking Tape 25mm x 50m',         group:'Consumables',        uom:'Roll',gst:12, stdRate:85,   status:'active', cat:'Consumable'   },
]

// ── BLANK item template with ALL fields ───────────────
const BLANK = {
  // Basic
  code:'', name:'', printName:'', group:'', cat:'Service',
  uom:'Kg', location:'', desc:'',
  stockMaintain:true, bomMaintain:false, billingItem:true,
  binType:'Bin', // Bin/Box/Tray/Trolley
  // Additional (AD1-AD9)
  ad1Colour:'', ad2Type:'', ad3Finish:'', ad4RalCode:'',
  ad5ProcessLeadTime:'', ad6CoatingSystem:'', ad7CoatingThickness:'',
  ad8Mask:'No', ad9PackingType:'',
  // Purchase
  purchaseRate:'', scrapRate:'', purchaseAllowancePct:'',
  maxPurchaseRate:'', purchaseLedger:'',
  // Sales
  sellingRate:'', itemCost:'', salesAllowancePct:'',
  minSellingRate:'', mrpRate:'',
  // Engineering
  drawingNo:'', revisionNo:'', revisionDate:'',
  batchExpiry:'', warrantyPeriod:'', itemPower:'',
  packSize:'', batchQty:'', inspectionReport:false,
  kanbanStockPolicy:'', rejectionAllowance:'', leadDays:'',
  netWeight:'', inwardOutwardAllowancePct:'', kanbanQty:'',
  issueAllowance:'', scrapAllowance:'', excessProductionPct:'',
  productionRmConsumptionPct:'',
  // Inventory
  inventoryCalculation:'FIFO', minimumStock:'', maximumStock:'',
  minimumOrderQty:'', rol:'', eoq:'', materialName:'',
  maximumOrderQty:'', rackName:'', binName:'', makeName:'',
  minRouteSheetQty:'', length:'', width:'', height:'',
  uomInventory:'Kg', volume:'',
  // Statutory
  hsnNo:'', igst:'', cgst:'', sgst:'',
  sacNo:'', sacIgst:'', sacCgst:'', sacSgst:'',
  // Extra
  inspectionRequired:false, includeInInventoryCost:true,
  // UOM Conversions (array)
  uomConversions: [],
  // Alternative Items (array)
  alternativeItems: [],
  // Customer Parts (array)
  customerParts: [],
  // Supplier Parts (array)
  supplierParts: [],
  // Division Locations (array)
  divisionLocations: [],
}

const TABS = [
  { id:'basic',     label:'Item Info'       },
  { id:'additional',label:'Additional (AD)' },
  { id:'purchase',  label:'Purchase'        },
  { id:'sales',     label:'Sales'           },
  { id:'engineering',label:'Engineering'   },
  { id:'inventory', label:'Inventory'       },
  { id:'statutory', label:'Statutory / GST' },
  { id:'uom',       label:'UOM Conversion'  },
  { id:'alternative',label:'Alternatives'  },
  { id:'custparts', label:'Customer Parts'  },
  { id:'suppparts', label:'Supplier Parts'  },
  { id:'extra',     label:'Extra / Division'},
]

const CAT_COLORS = {
  'Service':      {bg:'#EBF2F8',c:'#1A5276'},
  'Finished Good':{bg:'#EDE0EA',c:'#714B67'},
  'Raw Material': {bg:'#D4EDDA',c:'#155724'},
  'Consumable':   {bg:'#FFF3CD',c:'#856404'},
  'Asset/Spare':  {bg:'#F8D7DA',c:'#721C24'},
}

const FG = ({ label, req, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : 'span 1' }}>
    <label style={{ fontSize:11, fontWeight:600, color:'var(--odoo-gray)',
      display:'block', marginBottom:4 }}>
      {label}{req && <span style={{ color:'var(--odoo-red)' }}> *</span>}
    </label>
    {children}
  </div>
)

const inp = { padding:'7px 10px', border:'1px solid var(--odoo-border)',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  fontFamily:'DM Sans,sans-serif' }

const sel = { ...inp }

export default function ItemMaster() {
  const [items,    setItems]   = useState(ITEMS)
  const [showForm, setShowForm]= useState(false)
  const [editCode, setEditCode]= useState(null)
  const [form,     setForm]    = useState(BLANK)
  const [tab,      setTab]     = useState('basic')
  const [search,   setSearch]  = useState('')
  const [catFilter,setCat]     = useState('All')
  const [statusF,  setStatusF] = useState('active')

  const F = f => ({
    value: form[f] ?? '',
    onChange: e => setForm(p => ({ ...p, [f]: e.target.value }))
  })
  const CHK = f => ({
    checked: !!form[f],
    onChange: e => setForm(p => ({ ...p, [f]: e.target.checked }))
  })

  const cats    = ['All', ...new Set(ITEMS.map(i => i.cat))]
  const filtered = items.filter(i =>
    (catFilter === 'All' || i.cat === catFilter) &&
    (statusF === 'all' || i.status === statusF) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) ||
     i.code.toLowerCase().includes(search.toLowerCase()))
  )

  const openNew  = () => { setForm(BLANK); setEditCode(null); setShowForm(true); setTab('basic') }
  const openEdit = item => { setForm({ ...BLANK, ...item }); setEditCode(item.code); setShowForm(true); setTab('basic') }

  const save = () => {
    if (!form.code || !form.name) return toast.error('Item Code and Name required')
    if (!editCode && items.find(i => i.code === form.code))
      return toast.error('Item code already exists!')
    if (editCode) {
      setItems(is => is.map(i => i.code === editCode ? { ...i, ...form } : i))
      toast.success(`Item ${form.code} updated!`)
    } else {
      setItems(is => [...is, { ...form, status:'active' }])
      toast.success(`Item ${form.code} created!`)
    }
    setShowForm(false); setForm(BLANK); setEditCode(null)
  }

  const toggleStatus = code => {
    setItems(is => is.map(i => i.code === code
      ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i))
    toast.success('Item status updated!')
  }

  // Array field helpers
  const addRow  = (field, blank) => setForm(p => ({ ...p, [field]: [...(p[field]||[]), blank] }))
  const setRow  = (field, idx, key, val) => setForm(p => ({
    ...p, [field]: p[field].map((r, i) => i === idx ? { ...r, [key]: val } : r)
  }))
  const delRow  = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }))

  const grid = (cols = 4) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '10px 16px',
  })

  // ── FULL FORM ─────────────────────────────────────────
  if (showForm) return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          {editCode ? `Edit Item — ${editCode}` : 'New Item'}
          <small>Item Master · MDM</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-p" onClick={save}>
            {editCode ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:0, overflowX:'auto',
        borderBottom:'2px solid var(--odoo-border)', marginBottom:16,
        background:'#fff', borderRadius:'8px 8px 0 0',
        border:'1px solid var(--odoo-border)', borderBottomWidth:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'8px 16px', fontSize:11, fontWeight:600, cursor:'pointer',
              border:'none', background:'transparent', whiteSpace:'nowrap',
              borderBottom: tab===t.id ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              color: tab===t.id ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
              marginBottom:-1 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background:'#fff', border:'1px solid var(--odoo-border)',
        borderRadius:'0 0 8px 8px', padding:20 }}>

        {/* ── BASIC INFO ── */}
        {tab === 'basic' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Item Information</div>
            <div style={grid(4)}>
              <FG label="Item Code" req><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('code')} placeholder="SV-PC-001" disabled={!!editCode}/></FG>
              <FG label="Item Name" req span={2}><input style={inp} {...F('name')} placeholder="Powder Coating — RAL 9005"/></FG>
              <FG label="Print Name"><input style={inp} {...F('printName')} placeholder="Short print name"/></FG>
              <FG label="Item Group"><select style={sel} {...F('group')}>
                <option>Surface Treatment</option><option>Finished Goods</option>
                <option>Raw Materials</option><option>Consumables</option>
                <option>Spare Parts</option><option>Assets</option>
              </select></FG>
              <FG label="Category"><select style={sel} {...F('cat')}>
                <option>Service</option><option>Finished Good</option>
                <option>Raw Material</option><option>Consumable</option><option>Asset/Spare</option>
              </select></FG>
              <FG label="Stock UOM"><select style={sel} {...F('uom')}>
                <option>Kg</option><option>Nos</option><option>Ltr</option>
                <option>Mtr</option><option>Set</option><option>Roll</option><option>Box</option>
              </select></FG>
              <FG label="Location"><input style={inp} {...F('location')} placeholder="WH-01 / Store"/></FG>
              <FG label="Bin / Box / Tray / Trolley"><select style={sel} {...F('binType')}>
                <option>Bin</option><option>Box</option><option>Tray</option><option>Trolley</option>
              </select></FG>
              <FG label="Description" span={4}>
                <textarea style={{ ...inp, minHeight:60, resize:'vertical' }} {...F('desc')} placeholder="Item description..."/>
              </FG>
            </div>
            {/* Checkboxes */}
            <div style={{ display:'flex', gap:24, marginTop:14, padding:'12px 14px',
              background:'var(--odoo-bg)', borderRadius:6 }}>
              {[
                ['stockMaintain',  'Stock Maintain'],
                ['bomMaintain',    'BOM Maintain'],
                ['billingItem',    'Billing Item'],
              ].map(([f, l]) => (
                <label key={f} style={{ display:'flex', alignItems:'center', gap:8,
                  fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  <input type="checkbox" {...CHK(f)}
                    style={{ width:14, height:14, accentColor:'var(--odoo-purple)' }}/>
                  {l}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── ADDITIONAL AD1-AD9 ── */}
        {tab === 'additional' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Additional Item Information (Configurable)</div>
            <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
              borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
              AD fields are configurable per customer/industry. For surface treatment, these capture coating specifications.
            </div>
            <div style={grid(3)}>
              <FG label="AD1 — Colour"><input style={inp} {...F('ad1Colour')} placeholder="e.g. Black, White, Silver"/></FG>
              <FG label="AD2 — Type"><input style={inp} {...F('ad2Type')} placeholder="e.g. Powder, Liquid, E-Coat"/></FG>
              <FG label="AD3 — Finish"><input style={inp} {...F('ad3Finish')} placeholder="e.g. Matt, Gloss, Satin"/></FG>
              <FG label="AD4 — RAL Code"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('ad4RalCode')} placeholder="e.g. RAL 9005"/></FG>
              <FG label="AD5 — Process Lead Time"><input style={inp} {...F('ad5ProcessLeadTime')} placeholder="e.g. 2 days"/></FG>
              <FG label="AD6 — Coating System"><input style={inp} {...F('ad6CoatingSystem')} placeholder="e.g. Single Coat, Double Coat"/></FG>
              <FG label="AD7 — Coating Thickness"><input style={inp} {...F('ad7CoatingThickness')} placeholder="e.g. 60-80 micron"/></FG>
              <FG label="AD8 — Mask Required"><select style={sel} {...F('ad8Mask')}>
                <option>No</option><option>Yes — Full</option><option>Yes — Partial</option>
              </select></FG>
              <FG label="AD9 — Packing Type"><input style={inp} {...F('ad9PackingType')} placeholder="e.g. Carton, Pallet"/></FG>
            </div>
          </div>
        )}

        {/* ── PURCHASE ── */}
        {tab === 'purchase' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Customer Purchase Information</div>
            <div style={grid(3)}>
              <FG label="Purchase Rate (₹)"><input style={inp} type="number" {...F('purchaseRate')} placeholder="0.00"/></FG>
              <FG label="Scrap Rate (₹)"><input style={inp} type="number" {...F('scrapRate')} placeholder="0.00"/></FG>
              <FG label="Purchase Allowance (%)"><input style={inp} type="number" {...F('purchaseAllowancePct')} placeholder="0"/></FG>
              <FG label="Maximum Purchase Rate (₹)"><input style={inp} type="number" {...F('maxPurchaseRate')} placeholder="0.00"/></FG>
              <FG label="Purchase Ledger"><select style={sel} {...F('purchaseLedger')}>
                <option>Purchase Account</option><option>RM Purchase Account</option>
                <option>Service Purchase Account</option><option>Capital Purchase</option>
              </select></FG>
            </div>
          </div>
        )}

        {/* ── SALES ── */}
        {tab === 'sales' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Sale Information</div>
            <div style={grid(3)}>
              <FG label="Selling Rate (₹)"><input style={inp} type="number" {...F('sellingRate')} placeholder="0.00"/></FG>
              <FG label="Item Cost (₹)"><input style={inp} type="number" {...F('itemCost')} placeholder="0.00"/></FG>
              <FG label="Sales Allowance (%)"><input style={inp} type="number" {...F('salesAllowancePct')} placeholder="0"/></FG>
              <FG label="Minimum Selling Rate (₹)"><input style={inp} type="number" {...F('minSellingRate')} placeholder="0.00"/></FG>
              <FG label="MRP Rate (₹)"><input style={inp} type="number" {...F('mrpRate')} placeholder="0.00"/></FG>
            </div>
          </div>
        )}

        {/* ── ENGINEERING ── */}
        {tab === 'engineering' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Engineering Information</div>
            <div style={grid(4)}>
              <FG label="Drawing No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('drawingNo')}/></FG>
              <FG label="Revision No"><input style={inp} {...F('revisionNo')}/></FG>
              <FG label="Revision Date"><input style={inp} type="date" {...F('revisionDate')}/></FG>
              <FG label="Batch Expiry (days)"><input style={inp} type="number" {...F('batchExpiry')}/></FG>
              <FG label="Warranty Period"><input style={inp} {...F('warrantyPeriod')} placeholder="e.g. 12 months"/></FG>
              <FG label="Item Power"><input style={inp} {...F('itemPower')} placeholder="e.g. 230V 50Hz"/></FG>
              <FG label="Pack Size"><input style={inp} {...F('packSize')}/></FG>
              <FG label="Batch Qty"><input style={inp} type="number" {...F('batchQty')}/></FG>
              <FG label="Lead Days"><input style={inp} type="number" {...F('leadDays')}/></FG>
              <FG label="Net Weight (Kg)"><input style={inp} type="number" {...F('netWeight')}/></FG>
              <FG label="Kanban Qty"><input style={inp} type="number" {...F('kanbanQty')}/></FG>
              <FG label="Kanban Stock Policy"><select style={sel} {...F('kanbanStockPolicy')}>
                <option>None</option><option>Make to Order</option>
                <option>Make to Stock</option><option>Kanban Replenish</option>
              </select></FG>
              <FG label="Rejection Allowance (%)"><input style={inp} type="number" {...F('rejectionAllowance')}/></FG>
              <FG label="Inward/Outward Allow (%)"><input style={inp} type="number" {...F('inwardOutwardAllowancePct')}/></FG>
              <FG label="Issue Allowance (%)"><input style={inp} type="number" {...F('issueAllowance')}/></FG>
              <FG label="Scrap Allowance (%)"><input style={inp} type="number" {...F('scrapAllowance')}/></FG>
              <FG label="Excess Production % (+/-)"><input style={inp} type="number" {...F('excessProductionPct')}/></FG>
              <FG label="Prod RM Consumption (%)"><input style={inp} type="number" {...F('productionRmConsumptionPct')}/></FG>
              <FG label="Inspection Report Required">
                <select style={sel} value={form.inspectionReport?'Yes':'No'}
                  onChange={e=>setForm(p=>({...p,inspectionReport:e.target.value==='Yes'}))}>
                  <option>No</option><option>Yes</option>
                </select>
              </FG>
            </div>
          </div>
        )}

        {/* ── INVENTORY ── */}
        {tab === 'inventory' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Inventory Information</div>
            <div style={grid(4)}>
              <FG label="Inventory Calculation"><select style={sel} {...F('inventoryCalculation')}>
                <option>FIFO</option><option>LIFO</option><option>Weighted Average</option><option>Standard Cost</option>
              </select></FG>
              <FG label="Minimum Stock"><input style={inp} type="number" {...F('minimumStock')}/></FG>
              <FG label="Maximum Stock"><input style={inp} type="number" {...F('maximumStock')}/></FG>
              <FG label="Minimum Order Qty"><input style={inp} type="number" {...F('minimumOrderQty')}/></FG>
              <FG label="ROL (Reorder Level)"><input style={inp} type="number" {...F('rol')}/></FG>
              <FG label="EOQ"><input style={inp} type="number" {...F('eoq')}/></FG>
              <FG label="Maximum Order Qty"><input style={inp} type="number" {...F('maximumOrderQty')}/></FG>
              <FG label="Min Route Sheet Qty"><input style={inp} type="number" {...F('minRouteSheetQty')}/></FG>
              <FG label="Material Name"><input style={inp} {...F('materialName')}/></FG>
              <FG label="Rack Name"><input style={inp} {...F('rackName')}/></FG>
              <FG label="Bin Name"><input style={inp} {...F('binName')}/></FG>
              <FG label="Make Name"><input style={inp} {...F('makeName')}/></FG>
              <FG label="Length"><input style={inp} type="number" {...F('length')}/></FG>
              <FG label="Width"><input style={inp} type="number" {...F('width')}/></FG>
              <FG label="Height"><input style={inp} type="number" {...F('height')}/></FG>
              <FG label="Volume UOM"><select style={sel} {...F('uomInventory')}>
                <option>Kg</option><option>Nos</option><option>Ltr</option><option>Mtr</option><option>CBM</option>
              </select></FG>
            </div>
          </div>
        )}

        {/* ── STATUTORY ── */}
        {tab === 'statutory' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Statutory Information — GST</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {/* Goods */}
              <div style={{ border:'1px solid var(--odoo-border)', borderRadius:6, padding:14 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#1A5276', marginBottom:10 }}>HSN (Goods)</div>
                <div style={grid(2)}>
                  <FG label="HSN No" span={2}>
                    <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('hsnNo')} placeholder="8448 59 90"/>
                  </FG>
                  <FG label="IGST %"><input style={inp} type="number" {...F('igst')} placeholder="18"/></FG>
                  <FG label="CGST %"><input style={inp} type="number" {...F('cgst')} placeholder="9"/></FG>
                  <FG label="SGST %"><input style={inp} type="number" {...F('sgst')} placeholder="9"/></FG>
                </div>
              </div>
              {/* Services */}
              <div style={{ border:'1px solid var(--odoo-border)', borderRadius:6, padding:14 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#196F3D', marginBottom:10 }}>SAC (Services)</div>
                <div style={grid(2)}>
                  <FG label="SAC No" span={2}>
                    <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} {...F('sacNo')} placeholder="9999 99 00"/>
                  </FG>
                  <FG label="IGST %"><input style={inp} type="number" {...F('sacIgst')} placeholder="18"/></FG>
                  <FG label="CGST %"><input style={inp} type="number" {...F('sacCgst')} placeholder="9"/></FG>
                  <FG label="SGST %"><input style={inp} type="number" {...F('sacSgst')} placeholder="9"/></FG>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UOM CONVERSION ── */}
        {tab === 'uom' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>UOM Conversion</div>
              <button onClick={() => addRow('uomConversions', { uomName:'', ratio:'', decimalPoint:'2', mrp:'', rate:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                  color:'var(--odoo-purple)', cursor:'pointer' }}>
                + Add UOM
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--odoo-purple)' }}>
                  {['UOM Name','Conversion Ratio','Decimal Point','MRP','Rate',''].map(h => (
                    <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.uomConversions||[]).map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--odoo-border)' }}>
                    <td style={{ padding:'6px 8px' }}><select style={{ ...sel, width:100 }} value={r.uomName} onChange={e=>setRow('uomConversions',i,'uomName',e.target.value)}>
                      <option>Kg</option><option>Nos</option><option>Ltr</option><option>Mtr</option><option>Set</option><option>Box</option>
                    </select></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:80 }} type="number" value={r.ratio} onChange={e=>setRow('uomConversions',i,'ratio',e.target.value)} placeholder="1.00"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:60 }} type="number" value={r.decimalPoint} onChange={e=>setRow('uomConversions',i,'decimalPoint',e.target.value)} placeholder="2"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:90 }} type="number" value={r.mrp} onChange={e=>setRow('uomConversions',i,'mrp',e.target.value)} placeholder="0.00"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:90 }} type="number" value={r.rate} onChange={e=>setRow('uomConversions',i,'rate',e.target.value)} placeholder="0.00"/></td>
                    <td style={{ padding:'6px 8px' }}><button onClick={() => delRow('uomConversions',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:16 }}>×</button></td>
                  </tr>
                ))}
                {!(form.uomConversions||[]).length && (
                  <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'var(--odoo-gray)', fontSize:12 }}>No UOM conversions. Click + Add UOM.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ALTERNATIVE ITEMS ── */}
        {tab === 'alternative' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Alternative Item Information</div>
              <button onClick={() => addRow('alternativeItems', { altItem:'', altCode:'', altName:'', action:'Allow' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                  color:'var(--odoo-purple)', cursor:'pointer' }}>
                + Add Alternative
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--odoo-purple)' }}>
                  {['Alternative Item','Alt Item Code','Alt Item Name','Action',''].map(h => (
                    <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.alternativeItems||[]).map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--odoo-border)' }}>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.altItem} onChange={e=>setRow('alternativeItems',i,'altItem',e.target.value)} placeholder="Alternative item"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.altCode} onChange={e=>setRow('alternativeItems',i,'altCode',e.target.value)} placeholder="ITEM-CODE"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.altName} onChange={e=>setRow('alternativeItems',i,'altName',e.target.value)} placeholder="Item name"/></td>
                    <td style={{ padding:'6px 8px' }}><select style={{ ...sel, width:120 }} value={r.action} onChange={e=>setRow('alternativeItems',i,'action',e.target.value)}>
                      <option>Allow</option><option>Substitute</option><option>Replace</option>
                    </select></td>
                    <td style={{ padding:'6px 8px' }}><button onClick={() => delRow('alternativeItems',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:16 }}>×</button></td>
                  </tr>
                ))}
                {!(form.alternativeItems||[]).length && (
                  <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'var(--odoo-gray)' }}>No alternatives added.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CUSTOMER PARTS ── */}
        {tab === 'custparts' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Customer Part Information</div>
              <button onClick={() => addRow('customerParts', { customer:'', partNo:'', desc:'', hsnNo:'', igst:'', cgst:'', sgst:'', sacNo:'', sacIgst:'', sacCgst:'', sacSgst:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid #1A5276', background:'#EBF2F8',
                  color:'#1A5276', cursor:'pointer' }}>
                + Add Customer Part
              </button>
            </div>
            {(form.customerParts||[]).map((r, i) => (
              <div key={i} style={{ border:'1px solid var(--odoo-border)', borderRadius:6,
                padding:14, marginBottom:10, background:'#F8F9FA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:'#1A5276' }}>Customer Part #{i+1}</span>
                  <button onClick={() => delRow('customerParts',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:14 }}>× Remove</button>
                </div>
                <div style={grid(4)}>
                  <FG label="Customer"><input style={inp} value={r.customer} onChange={e=>setRow('customerParts',i,'customer',e.target.value)} placeholder="Customer name"/></FG>
                  <FG label="Customer Part No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.partNo} onChange={e=>setRow('customerParts',i,'partNo',e.target.value)}/></FG>
                  <FG label="Customer Description" span={2}><input style={inp} value={r.desc} onChange={e=>setRow('customerParts',i,'desc',e.target.value)}/></FG>
                  <FG label="HSN No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.hsnNo} onChange={e=>setRow('customerParts',i,'hsnNo',e.target.value)}/></FG>
                  <FG label="IGST %"><input style={inp} type="number" value={r.igst} onChange={e=>setRow('customerParts',i,'igst',e.target.value)}/></FG>
                  <FG label="CGST %"><input style={inp} type="number" value={r.cgst} onChange={e=>setRow('customerParts',i,'cgst',e.target.value)}/></FG>
                  <FG label="SGST %"><input style={inp} type="number" value={r.sgst} onChange={e=>setRow('customerParts',i,'sgst',e.target.value)}/></FG>
                  <FG label="SAC No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.sacNo} onChange={e=>setRow('customerParts',i,'sacNo',e.target.value)}/></FG>
                  <FG label="SAC IGST %"><input style={inp} type="number" value={r.sacIgst} onChange={e=>setRow('customerParts',i,'sacIgst',e.target.value)}/></FG>
                  <FG label="SAC CGST %"><input style={inp} type="number" value={r.sacCgst} onChange={e=>setRow('customerParts',i,'sacCgst',e.target.value)}/></FG>
                  <FG label="SAC SGST %"><input style={inp} type="number" value={r.sacSgst} onChange={e=>setRow('customerParts',i,'sacSgst',e.target.value)}/></FG>
                </div>
              </div>
            ))}
            {!(form.customerParts||[]).length && (
              <div style={{ padding:24, textAlign:'center', color:'var(--odoo-gray)', fontSize:12, border:'1px dashed var(--odoo-border)', borderRadius:6 }}>
                No customer parts. Click + Add Customer Part.
              </div>
            )}
          </div>
        )}

        {/* ── SUPPLIER PARTS ── */}
        {tab === 'suppparts' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Supplier Part Information</div>
              <button onClick={() => addRow('supplierParts', { supplier:'', partNo:'', desc:'', hsnNo:'', igst:'', cgst:'', sgst:'', sacNo:'', sacIgst:'', sacCgst:'', sacSgst:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid #196F3D', background:'#D4EDDA',
                  color:'#196F3D', cursor:'pointer' }}>
                + Add Supplier Part
              </button>
            </div>
            {(form.supplierParts||[]).map((r, i) => (
              <div key={i} style={{ border:'1px solid var(--odoo-border)', borderRadius:6,
                padding:14, marginBottom:10, background:'#F8F9FA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontWeight:700, fontSize:12, color:'#196F3D' }}>Supplier Part #{i+1}</span>
                  <button onClick={() => delRow('supplierParts',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:14 }}>× Remove</button>
                </div>
                <div style={grid(4)}>
                  <FG label="Supplier"><input style={inp} value={r.supplier} onChange={e=>setRow('supplierParts',i,'supplier',e.target.value)} placeholder="Supplier name"/></FG>
                  <FG label="Supplier Part No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.partNo} onChange={e=>setRow('supplierParts',i,'partNo',e.target.value)}/></FG>
                  <FG label="Supplier Description" span={2}><input style={inp} value={r.desc} onChange={e=>setRow('supplierParts',i,'desc',e.target.value)}/></FG>
                  <FG label="HSN No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.hsnNo} onChange={e=>setRow('supplierParts',i,'hsnNo',e.target.value)}/></FG>
                  <FG label="IGST %"><input style={inp} type="number" value={r.igst} onChange={e=>setRow('supplierParts',i,'igst',e.target.value)}/></FG>
                  <FG label="CGST %"><input style={inp} type="number" value={r.cgst} onChange={e=>setRow('supplierParts',i,'cgst',e.target.value)}/></FG>
                  <FG label="SGST %"><input style={inp} type="number" value={r.sgst} onChange={e=>setRow('supplierParts',i,'sgst',e.target.value)}/></FG>
                  <FG label="SAC No"><input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={r.sacNo} onChange={e=>setRow('supplierParts',i,'sacNo',e.target.value)}/></FG>
                  <FG label="SAC IGST %"><input style={inp} type="number" value={r.sacIgst} onChange={e=>setRow('supplierParts',i,'sacIgst',e.target.value)}/></FG>
                  <FG label="SAC CGST %"><input style={inp} type="number" value={r.sacCgst} onChange={e=>setRow('supplierParts',i,'sacCgst',e.target.value)}/></FG>
                  <FG label="SAC SGST %"><input style={inp} type="number" value={r.sacSgst} onChange={e=>setRow('supplierParts',i,'sacSgst',e.target.value)}/></FG>
                </div>
              </div>
            ))}
            {!(form.supplierParts||[]).length && (
              <div style={{ padding:24, textAlign:'center', color:'var(--odoo-gray)', fontSize:12, border:'1px dashed var(--odoo-border)', borderRadius:6 }}>
                No supplier parts. Click + Add Supplier Part.
              </div>
            )}
          </div>
        )}

        {/* ── EXTRA / DIVISION ── */}
        {tab === 'extra' && (
          <div>
            <div className="sd-stt" style={{ marginBottom:12 }}>Extra Information</div>
            <div style={{ display:'flex', gap:24, padding:'12px 14px', background:'var(--odoo-bg)',
              borderRadius:6, marginBottom:16 }}>
              {[
                ['inspectionRequired',      'Inspection Required'],
                ['includeInInventoryCost',   'Include in Inventory Cost'],
              ].map(([f, l]) => (
                <label key={f} style={{ display:'flex', alignItems:'center', gap:8,
                  fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  <input type="checkbox" {...CHK(f)}
                    style={{ width:14, height:14, accentColor:'var(--odoo-purple)' }}/>
                  {l}
                </label>
              ))}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="sd-stt" style={{ marginBottom:0 }}>Division-wise Location</div>
              <button onClick={() => addRow('divisionLocations', { division:'', rack:'', bin:'', minimumStock:'', rol:'' })}
                style={{ padding:'5px 14px', fontSize:11, fontWeight:700, borderRadius:5,
                  border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                  color:'var(--odoo-purple)', cursor:'pointer' }}>
                + Add Division
              </button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--odoo-purple)' }}>
                  {['Division','Rack','Bin','Minimum Stock','ROL',''].map(h => (
                    <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontSize:11, fontWeight:700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.divisionLocations||[]).map((r, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--odoo-border)' }}>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.division} onChange={e=>setRow('divisionLocations',i,'division',e.target.value)} placeholder="Division name"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.rack} onChange={e=>setRow('divisionLocations',i,'rack',e.target.value)} placeholder="Rack"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={inp} value={r.bin} onChange={e=>setRow('divisionLocations',i,'bin',e.target.value)} placeholder="Bin"/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:80 }} type="number" value={r.minimumStock} onChange={e=>setRow('divisionLocations',i,'minimumStock',e.target.value)}/></td>
                    <td style={{ padding:'6px 8px' }}><input style={{ ...inp, width:80 }} type="number" value={r.rol} onChange={e=>setRow('divisionLocations',i,'rol',e.target.value)}/></td>
                    <td style={{ padding:'6px 8px' }}><button onClick={() => delRow('divisionLocations',i)} style={{ background:'none', border:'none', color:'var(--odoo-red)', cursor:'pointer', fontSize:16 }}>×</button></td>
                  </tr>
                ))}
                {!(form.divisionLocations||[]).length && (
                  <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'var(--odoo-gray)' }}>No division locations. Click + Add Division.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom save */}
        <div style={{ display:'flex', gap:10, marginTop:20, paddingTop:14,
          borderTop:'1px solid var(--odoo-border)' }}>
          <button className="btn btn-p" onClick={save}>{editCode ? 'Update Item' : 'Create Item'}</button>
          <button className="btn btn-s" onClick={() => setShowForm(false)}>Cancel</button>
          <span style={{ fontSize:11, color:'var(--odoo-gray)', marginLeft:'auto', alignSelf:'center' }}>
            Tab: {TABS.find(t=>t.id===tab)?.label}
          </span>
        </div>
      </div>
    </div>
  )

  // ── LIST VIEW ─────────────────────────────────────────
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Item Master <small>MM60 · {filtered.length} items</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={openNew}>+ New Item</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(5,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Total Items',    v:items.length },
          { cls:'green',  l:'Active',         v:items.filter(i=>i.status==='active').length },
          { cls:'blue',   l:'Services',       v:items.filter(i=>i.cat==='Service').length },
          { cls:'orange', l:'Raw Materials',  v:items.filter(i=>i.cat==='Raw Material').length },
          { cls:'red',    l:'Inactive',       v:items.filter(i=>i.status==='inactive').length },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search code or name..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...inp, width:260 }}/>
        <div style={{ display:'flex', gap:4 }}>
          {['All',...new Set(items.map(i=>i.cat))].map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                cursor:'pointer', border:'1px solid var(--odoo-border)',
                background: catFilter===c ? 'var(--odoo-purple)' : '#fff',
                color: catFilter===c ? '#fff' : 'var(--odoo-gray)' }}>
              {c}
            </button>
          ))}
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          style={{ ...sel, width:120 }}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      <table className="fi-data-table">
        <thead>
          <tr><th>Code</th><th>Item Name</th><th>Group</th><th>Cat</th><th>UOM</th><th>Std Rate</th><th>GST</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map((item, i) => {
            const cc = CAT_COLORS[item.cat] || { bg:'#eee', c:'#555' }
            return (
              <tr key={item.code} style={{ background:i%2===0?'#fff':'#FAFAFA', opacity:item.status==='inactive'?.6:1 }}>
                <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)', fontSize:12 }}>{item.code}</td>
                <td style={{ fontWeight:600 }}>{item.name}</td>
                <td style={{ fontSize:11 }}>{item.group||'—'}</td>
                <td><span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600, background:cc.bg, color:cc.c }}>{item.cat}</span></td>
                <td style={{ textAlign:'center', fontSize:11 }}>{item.uom}</td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:600, color:'var(--odoo-purple)' }}>
                  {item.stdRate ? '₹'+Number(item.stdRate).toLocaleString('en-IN') : '—'}
                </td>
                <td style={{ textAlign:'center', fontSize:11 }}>{item.gst}%</td>
                <td><span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:600,
                  background:item.status==='active'?'#D4EDDA':'#F5F5F5',
                  color:item.status==='active'?'#155724':'#666' }}>
                  {item.status?.toUpperCase()}
                </span></td>
                <td style={{ display:'flex', gap:4 }}>
                  <button onClick={() => openEdit(item)}
                    style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                      border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                      color:'var(--odoo-purple)', cursor:'pointer' }}>Edit</button>
                  <button onClick={() => toggleStatus(item.code)}
                    style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                      border:'none', cursor:'pointer',
                      background:item.status==='active'?'#6C757D':'#00A09D', color:'#fff' }}>
                    {item.status==='active'?'Deactivate':'Activate'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
