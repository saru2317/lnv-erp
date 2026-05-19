import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import ImportModal from '@components/ImportModal'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHeaders = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

// ── HSN/SAC data from master file (821 HSN + 28 SAC codes) ──

// ── Sample Items ──────────────────────────────────────
// Items loaded from backend API

// ── BLANK item template with ALL fields ───────────────
const BLANK = {
  // Basic
  itemType:'', // Item Type code: FG, RM, SFG, CN, MI etc.
  groupCode:'', // Short code of selected Item Group (from ItemGroup.code)
  catCode:'',   // Short code of selected Category (sub-group code)
  code:'', name:'', printName:'', group:'', cat:'',
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
  gstCategory:'taxable', itcEligibility:'full',
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
  { id:'basic',      label:'Item Info',       icon:'\uD83D\uDCCB', color:'#714B67' },
  { id:'additional', label:'Additional (AD)', icon:'\u2795',        color:'#495057' },
  { id:'purchase',   label:'Purchase',        icon:'\uD83D\uDED2', color:'#0C5460' },
  { id:'sales',      label:'Sales',           icon:'\uD83D\uDCB0', color:'#155724' },
  { id:'engineering',label:'Engineering',     icon:'\u2699\uFE0F', color:'#856404' },
  { id:'inventory',  label:'Inventory',       icon:'\uD83D\uDCE6', color:'#004085' },
  { id:'statutory',  label:'Statutory / GST', icon:'\uD83C\uDFDB\uFE0F', color:'#4B2E83' },
  { id:'uom',        label:'UOM Conversion',  icon:'\u2194\uFE0F', color:'#383D41' },
  { id:'alternative',label:'Alternatives',    icon:'\uD83D\uDD04', color:'#6C3483' },
  { id:'custparts',  label:'Customer Parts',  icon:'\uD83E\uDD1D', color:'#1A5276' },
  { id:'suppparts',  label:'Supplier Parts',  icon:'\uD83C\uDFED', color:'#7D6608' },
  { id:'extra',      label:'Extra / Division',icon:'\uD83D\uDCCA', color:'#922B21' },
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
  const [items,    setItems]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [saving,   setSaving]  = useState(false)
  const [showForm, setShowForm]= useState(false)
  const [editCode, setEditCode]= useState(null)
  const [form,     setForm]    = useState(BLANK)
  const [tab,      setTab]     = useState('basic')
  const [search,   setSearch]  = useState('')
  const [catFilter,setCat]     = useState('All')
  const [statusF,  setStatusF] = useState('active')
  // Master dropdowns from DB
  const [uomList,   setUomList]   = useState([])
  const [groupList,     setGroupList]     = useState([])
  const [groupListFull, setGroupListFull] = useState([]) // full {code,name,parentCode}
  const [typeList,  setTypeList]  = useState([])
  const [hsnList,   setHsnList]   = useState([])
  const [sacList,   setSacList]   = useState([])


  // ── Fetch items from backend ────────────────────────
  const fetchItems = async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/items`, { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Map backend fields to frontend format
      const mapped = (data.data || []).map(i => ({
        ...i,
        // Display + form field name mapping
        cat:          i.itemCatCode   || i.category   || '',
        group:        i.itemGroup     || i.category   || '',
        groupCode:    i.itemGroupCode || '',
        catCode:      i.itemCatCode   || '',
        desc:         i.description   || '',
        hsnNo:        i.hsnCode       || '',
        stdRate:      i.stdCost       != null ? String(i.stdCost)    : '',
        mrpRate:      i.mrp           != null ? String(i.mrp)        : '',
        minimumStock: i.minStock      != null ? String(i.minStock)   : '',
        minimumOrderQty: i.reorderQty != null ? String(i.reorderQty): '',
        gst:          18,
        status:       i.isActive ? 'active' : 'inactive',
        // Booleans safe defaults for old items
        stockMaintain: i.stockMaintain !== false,
        bomMaintain:   i.bomMaintain   === true,
        billingItem:   i.billingItem   !== false,
      }))
      setItems(mapped)
    } catch(err) {
      toast.error('Failed to load items: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch master dropdowns ──────────────────────────
  const [itemTypesFull, setItemTypesFull] = useState([]) // [{code:'FG',name:'Finished Good'}]

  const fetchMasters = async () => {
    try {
      const [uomRes, grpRes, typRes] = await Promise.all([
        fetch(`${BASE_URL}/mdm/uom`,        { headers: authHeaders() }),
        fetch(`${BASE_URL}/mdm/item-group`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/mdm/item-type`,  { headers: authHeaders() }),
      ])
      const [uomData, grpData, typData] = await Promise.all([
        uomRes.json(), grpRes.json(), typRes.json()
      ])
      setUomList(  (uomData.data  || []).filter(u => u.active).map(u => u.code))
      const activeGroups = (grpData.data || []).filter(g => g.active !== false)
      setGroupListFull(activeGroups)
      setGroupList(activeGroups.map(g => g.name))
      setTypeList( (typData.data  || []).filter(t => t.active).map(t => t.name))
      // Store full objects with code+name for Item Type dropdown
      setItemTypesFull((typData.data || []).filter(t => t.active).map(t => ({
        code: t.code || t.itemTypeCode || '',
        name: t.name || t.typeName     || '',
      })))
    } catch(err) {
      console.log('Masters load error:', err.message)
    }
  }

  useEffect(() => { fetchItems(); fetchMasters() }, [])


  // ── Fetch HSN/SAC from backend master (NOT hardcoded) ───
  const fetchHsnSac = async () => {
    try {
      const [hsnRes, sacRes] = await Promise.all([
        fetch(`${BASE_URL}/mdm/hsn`, { headers: authHeaders() }),
        fetch(`${BASE_URL}/mdm/sac`, { headers: authHeaders() }),
      ])
      const [hsnData, sacData] = await Promise.all([hsnRes.json(), sacRes.json()])
      const hsnRows = hsnData.data || hsnData.items || hsnData || []
      const sacRows = sacData.data || sacData.items || sacData || []
      if (hsnRows.length > 0) {
        setHsnList(hsnRows.map(h => ({
          code: String(h.code || h.hsnCode || ''),
          desc: h.description || h.desc || h.name || '',
          igst: h.igst ?? 0, cgst: h.cgst ?? 0, sgst: h.sgst ?? 0,
        })))
      }
      if (sacRows.length > 0) {
        setSacList(sacRows.map(s => ({
          code: String(s.code || s.sacCode || ''),
          desc: s.description || s.desc || s.name || '',
          igst: s.igst ?? 0, cgst: s.cgst ?? 0, sgst: s.sgst ?? 0,
        })))
      }
    } catch (err) {
      console.log('HSN/SAC load error:', err.message)
    }
  }

  useEffect(() => { fetchItems(); fetchMasters(); fetchHsnSac() }, [])

  const F = f => ({
    value: form[f] ?? '',
    onChange: e => setForm(p => ({ ...p, [f]: e.target.value }))
  })
  const CHK = f => ({
    checked: !!form[f],
    onChange: e => setForm(p => ({ ...p, [f]: e.target.checked }))
  })

  // All categories = from typeList (DB) + any in items not in typeList
  const cats = ['All', ...new Set([
    ...typeList,
    'Raw Material', 'Finished Goods', 'Work In Progress',
    'Service Item', 'Consumable', 'Service',
    ...items.map(i => i.cat)
  ].filter(Boolean))]
  const filtered = items.filter(i =>
    (catFilter === 'All' || i.cat === catFilter) &&
    (statusF === 'all' || i.status === statusF) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) ||
     i.code.toLowerCase().includes(search.toLowerCase()))
  )

  // ── Group change: filter categories, rebuild code ──────────────────
  const onGroupChange = (selectedName) => {
    const grp     = groupListFull.find(g => g.name === selectedName)
    const grpCode = grp?.code || ''
    setForm(f => ({ ...f, group: selectedName, groupCode: grpCode, cat: '', catCode: '' }))
    if (form.itemType && grpCode) generateItemCode(form.itemType, grpCode, '')
  }

  // ── Category change: sub-group of selected group, rebuild code ──────────
  const onCatChange = (selectedName) => {
    // Try sub-group match first (parentCode = groupCode), then any group match
    const sub     = groupListFull.find(g => g.name === selectedName && g.parentCode === form.groupCode)
              || groupListFull.find(g => g.name === selectedName)
    const catCode = sub?.code || ''
    setForm(f => ({ ...f, cat: selectedName, catCode }))
    // Rebuild code: Type + Group + Category → running number
    if (form.itemType && form.groupCode && catCode) {
      generateItemCode(form.itemType, form.groupCode, catCode)
    } else if (form.itemType && form.groupCode) {
      generateItemCode(form.itemType, form.groupCode, '')
    }
  }

  const openNew  = () => { setForm(BLANK); setEditCode(null); setShowForm(true); setTab('basic') }
  const openEdit = item => {
    // Auto-detect itemType from item code if not saved (e.g. FG-ML-0001 → FG)
    const detectedType = item.itemType || (() => {
      const code = (item.code || '').toUpperCase()
      const knownTypes = ['FG','SFG','RM','CN','MI','WIP','PKG','SP']
      return knownTypes.find(t => code.startsWith(t + '-') || code.startsWith(t + ' ')) || ''
    })()

    setForm({
      ...BLANK,
      ...item,
      // explicit mapping — DB field → form field
      itemType:      detectedType      || '',
      group:         item.itemGroup     || item.group    || '',
      groupCode:     item.itemGroupCode || item.groupCode|| '',
      catCode:       item.itemCatCode   || item.catCode  || '',
      printName:     item.printName     || '',
      location:      item.location      || '',
      binBox:        item.binBox        || '',
      desc:          item.description   || item.desc     || '',
      hsnNo:         item.hsnCode       || item.hsnNo    || '',
      stdRate:       item.stdCost       != null ? String(item.stdCost)  : '',
      mrpRate:       item.mrp           != null ? String(item.mrp)      : '',
      minimumStock:  item.minStock      != null ? String(item.minStock)  : '',
      minimumOrderQty: item.reorderQty  != null ? String(item.reorderQty): '',
      stockMaintain: item.stockMaintain !== false,
      bomMaintain:   item.bomMaintain   === true,
      billingItem:   item.billingItem   !== false,
    })
    setEditCode(item.code)
    setShowForm(true)
    setTab('basic')
  }

  // ── Auto-generate Item Code from Item Type prefix ───
  // ── Build item code from hierarchy: Type → Group → Category → Running ──
  const generateItemCode = async (typeCode, groupCode = '', catCode = '') => {
    if (!typeCode || editCode) return
    try {
      let url = `${BASE_URL}/mdm/item/next-code?type=${typeCode}`
      if (groupCode) url += `&groupCode=${encodeURIComponent(groupCode)}`
      if (catCode)   url += `&catCode=${encodeURIComponent(catCode)}`
      const res  = await fetch(url, { headers: authHeaders() })
      const data = await res.json()
      if (data.code) return setForm(f => ({ ...f, code: data.code, itemType: typeCode }))
    } catch {}
    // Fallback: build prefix from codes and count
    try {
      const parts  = [typeCode, groupCode, catCode].filter(Boolean)
      const prefix = parts.join('-')
      const res    = await fetch(`${BASE_URL}/mdm/item`, { headers: authHeaders() })
      const data   = await res.json()
      const count  = (data.data || []).filter(i =>
        (i.code || '').toUpperCase().startsWith(prefix.toUpperCase())
      ).length
      const seq = String(count + 1).padStart(4, '0')
      setForm(f => ({ ...f, code: `${prefix}-${seq}`, itemType: typeCode }))
    } catch {
      const parts  = [typeCode, groupCode, catCode].filter(Boolean)
      const prefix = parts.join('-')
      setForm(f => ({ ...f, code: `${prefix}-0001`, itemType: typeCode }))
    }
  }

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Item Code and Name required')
    setSaving(true)
    try {
      const payload = {
        code:          form.code,
        name:          form.name,
        printName:     form.printName     || null,
        itemType:      form.itemType      || null,
        itemGroup:     form.group         || null,
        itemGroupCode: form.groupCode     || null,
        itemCatCode:   form.catCode       || null,
        category:      form.cat || form.group || 'Service',
        uom:           form.uom           || 'Nos',
        location:      form.location      || null,
        binBox:        form.binBox        || null,
        stockMaintain: form.stockMaintain !== false,
        bomMaintain:   form.bomMaintain   === true,
        billingItem:   form.billingItem   !== false,
        hsnCode:       form.hsnNo         || null,
        description:   form.desc          || null,
        stdCost:       form.stdRate       ? +form.stdRate       : null,
        mrp:           form.mrpRate       ? +form.mrpRate       : null,
        minStock:      form.minimumStock  ? +form.minimumStock  : null,
        reorderQty:    form.minimumOrderQty ? +form.minimumOrderQty : null,
      }
      let res, data
      if (editCode) {
        // find item id first
        const item = items.find(i => i.code === editCode)
        res  = await fetch(`${BASE_URL}/items/${item.id}`, {
          method: 'PATCH', headers: authHeaders(), body: JSON.stringify(payload)
        })
      } else {
        res  = await fetch(`${BASE_URL}/items`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(payload)
        })
      }
      data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(`Item ${form.code} ${editCode ? 'updated' : 'created'}!`)
      await fetchItems()
      setShowForm(false); setForm(BLANK); setEditCode(null)
    } catch(err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async code => {
    const item = items.find(i => i.code === code)
    if (!item) return
    try {
      const res = await fetch(`${BASE_URL}/items/${item.id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ isActive: item.status !== 'active' })
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Item status updated!')
      await fetchItems()
    } catch(err) {
      toast.error('Error: ' + err.message)
    }
  }

  // ── Delete Item ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!editCode) return
    const item = items.find(i => i.code === editCode)
    if (!item) return toast.error('Item not found')
    const confirmed = window.confirm(
      `Delete item "${item.code} — ${item.name}"?\n\nThis cannot be undone.`
    )
    if (!confirmed) return
    try {
      const res = await fetch(`${BASE_URL}/items/${item.id}`, {
        method: 'DELETE', headers: authHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      toast.success(`Item ${item.code} deleted!`)
      setShowForm(false)
      await fetchItems()
    } catch(err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  // Array field helpers
  const addRow  = (field, blank) => setForm(p => ({ ...p, [field]: [...(p[field]||[]), blank] }))
  const setRow  = (field, idx, key, val) => setForm(p => ({
    ...p, [field]: p[field].map((r, i) => i === idx ? { ...r, [key]: val } : r)
  }))
  const delRow  = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }))


  // ── HSN selected → auto fill IGST/CGST/SGST ──────────
  const onHsnChange = (val) => {
    const found = hsnList.find(h => h.code === String(val))
    if (found && found.igst > 0) {
      setForm(p => ({ ...p, hsnNo: val, igst: found.igst, cgst: found.cgst, sgst: found.sgst }))
    } else {
      setForm(p => ({ ...p, hsnNo: val }))
    }
  }

  // ── SAC selected → auto fill IGST/CGST/SGST ──────────
  const onSacChange = (val) => {
    const found = sacList.find(s => s.code === String(val))
    if (found && found.igst > 0) {
      setForm(p => ({ ...p, sacNo: val, sacIgst: found.igst, sacCgst: found.cgst, sacSgst: found.sgst }))
    } else {
      setForm(p => ({ ...p, sacNo: val }))
    }
  }

  // ── IGST typed → auto divide CGST/SGST ────────────────
  const onIgstChange = (val) => {
    const igst = parseFloat(val) || 0
    setForm(p => ({ ...p, igst: val, cgst: +(igst/2).toFixed(2), sgst: +(igst/2).toFixed(2) }))
  }

  const onSacIgstChange = (val) => {
    const igst = parseFloat(val) || 0
    setForm(p => ({ ...p, sacIgst: val, sacCgst: +(igst/2).toFixed(2), sacSgst: +(igst/2).toFixed(2) }))
  }

  const grid = (cols = 4) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '10px 16px',
  })

  // ── FULL FORM ─────────────────────────────────────────
  // ── LIST VIEW ─────────────────────────────────────────
  if (loading) return (
    <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
      ⏳ Loading items from database...
    </div>
  )

  if (showForm) return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          {editCode ? `Edit Item — ${editCode}` : 'New Item'}
          <small>Item Master · MDM</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-p" onClick={save} disabled={saving}>
            {saving ? '⏳ Saving...' : (editCode ? 'Update Item' : 'Create Item')}
          </button>
        </div>
      </div>

      {/* Tab bar — pill style with icons */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', marginBottom:16,
        padding:'6px 8px', background:'#F0EEEB', borderRadius:10,
        border:'1px solid #E0D5E0', scrollbarWidth:'none' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding:'6px 13px', fontSize:11, fontWeight:700, cursor:'pointer',
              borderRadius:7, whiteSpace:'nowrap', transition:'all .15s',
              border:'none', flexShrink:0,
              background: tab===t.id ? t.color : 'transparent',
              color:      tab===t.id ? '#fff'  : '#6C757D',
              boxShadow:  tab===t.id ? `0 2px 8px ${t.color}55` : 'none',
              transform:  tab===t.id ? 'translateY(-1px)' : 'none',
              display:'flex', alignItems:'center', gap:5,
            }}>
            <span style={{ fontSize:13 }}>{t.icon}</span>
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
              {/* Item Type — FIRST field, drives auto-code generation */}
              <FG label="Item Type *">
                <select style={{
                  ...sel,
                  background: form.itemType ? '#F0F8F0' : '#FFF9F0',
                  fontWeight: form.itemType ? 700 : 400,
                  color:      form.itemType ? '#155724' : '#856404',
                  border:     form.itemType ? '1.5px solid #155724' : '1.5px solid #FFC107',
                }}
                  value={form.itemType}
                  onChange={e => {
                    const code = e.target.value
                    setForm(f => ({ ...f, itemType: code }))
                    if (code && !editCode) generateItemCode(code)
                  }}
                  disabled={!!editCode}>
                  <option value=''>-- Select Item Type --</option>
                  {itemTypesFull.length > 0
                    ? itemTypesFull.map(t => (
                        <option key={t.code} value={t.code}>
                          {t.code} — {t.name}
                        </option>
                      ))
                    : [
                        {code:'FG',  name:'Finished Good'},
                        {code:'SFG', name:'Semi-Finished'},
                        {code:'RM',  name:'Raw Material'},
                        {code:'CN',  name:'Consumable'},
                        {code:'MI',  name:'Misc / Other'},
                      ].map(t => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)
                  }
                </select>
                {!form.itemType && !editCode && (
                  <div style={{fontSize:10,color:'#856404',marginTop:2}}>
                    Select Item Type to auto-generate Item Code
                  </div>
                )}
              </FG>
              <FG label="Item Code" req>
                <div style={{display:'flex',gap:4}}>
                  <input style={{ ...inp, fontFamily:'DM Mono,monospace', fontWeight:700, flex:1 }}
                    {...F('code')} placeholder="Auto-generated from Type"
                    disabled={!!editCode}/>
                  {!editCode && form.itemType && (
                    <button type="button"
                      onClick={() => generateItemCode(form.itemType)}
                      style={{padding:'4px 8px',background:'#1A5276',color:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontWeight:700,whiteSpace:'nowrap'}}>
                      ↻ New
                    </button>
                  )}
                </div>
              </FG>
              <FG label="Item Name" req span={2}><input style={inp} {...F('name')} placeholder="Powder Coating — RAL 9005"/></FG>
              <FG label="Print Name"><input style={inp} {...F('printName')} placeholder="Short print name"/></FG>
              <FG label="Item Group">
                <select style={{
                  ...sel,
                  border: form.groupCode ? '1.5px solid #155724' : '1.5px solid #E0D5E0',
                  background: form.groupCode ? '#F0F8F0' : undefined,
                }}
                  value={form.group}
                  onChange={e => onGroupChange(e.target.value)}>
                  <option value=''>-- Select Group --</option>
                  {(() => {
                    const all     = groupListFull.filter(g => g.active !== false)
                    const matched = form.itemType
                      ? all.filter(g => g.parentCode === form.itemType)
                      : all
                    // fallback: show all if no parentCode matches (setup not done yet)
                    const list = matched.length > 0 ? matched : all
                    return list.map(g => (
                      <option key={g.code} value={g.name}>{g.code} — {g.name}</option>
                    ))
                  })()}
                </select>
                {form.groupCode && (
                  <div style={{fontSize:10,color:'#155724',marginTop:2,fontFamily:'DM Mono,monospace',fontWeight:700}}>
                    Code: {form.groupCode}
                  </div>
                )}
              </FG>
              <FG label="Category">
                <select style={{
                  ...sel,
                  border: form.catCode ? '1.5px solid #0C5460' : '1.5px solid #E0D5E0',
                  background: form.catCode ? '#EAF8FB' : undefined,
                }}
                  value={form.cat}
                  onChange={e => onCatChange(e.target.value)}>
                  <option value=''>-- Select Category (Optional) --</option>
                  {(() => {
                    // Sub-groups of selected group (L3 level)
                    const subGroups = form.groupCode
                      ? groupListFull.filter(g => g.active !== false && g.parentCode === form.groupCode)
                      : []
                    // If sub-groups exist → show them; else show ALL groups as category options
                    const opts = subGroups.length > 0
                      ? subGroups
                      : groupListFull.filter(g => g.active !== false)
                    return opts.map(g => (
                      <option key={g.code} value={g.name}>{g.code} — {g.name}</option>
                    ))
                  })()}
                </select>
                {form.catCode && (
                  <div style={{fontSize:10,color:'#0C5460',marginTop:2,fontFamily:'DM Mono,monospace',fontWeight:700}}>
                    Code: {form.catCode}
                  </div>
                )}
                {form.groupCode && groupListFull.filter(g => g.parentCode === form.groupCode).length === 0 && (
                  <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>
                    No sub-categories for this group — category is optional
                  </div>
                )}
                {!form.groupCode && (
                  <div style={{fontSize:10,color:'#856404',marginTop:2}}>Select Item Group first</div>
                )}
              </FG>
              <FG label="Stock UOM"><select style={sel} {...F('uom')}>
                {uomList.length > 0
                  ? uomList.map(u => <option key={u}>{u}</option>)
                  : ['Kg','Nos','Ltr','Mtr','Set','Roll','Box'].map(u => <option key={u}>{u}</option>)
                }
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
                    <input
                      style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                      value={form.hsnNo ?? ''}
                      onChange={e => onHsnChange(e.target.value)}
                      list="hsnDatalist"
                      placeholder="Type HSN code or description..."
                    />
                    <datalist id="hsnDatalist">
                      {hsnList.map(h => (
                        <option key={h.code} value={h.code}>{h.code} — {h.desc}</option>
                      ))}
                    </datalist>
                  </FG>
                  <FG label="IGST %">
                    <input style={inp} type="number"
                      value={form.igst ?? ''}
                      onChange={e => onIgstChange(e.target.value)}
                      placeholder="18"/>
                  </FG>
                  <FG label="CGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.cgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                  <FG label="SGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.sgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                </div>
              </div>
              {/* Services */}
              <div style={{ border:'1px solid var(--odoo-border)', borderRadius:6, padding:14 }}>
                <div style={{ fontWeight:700, fontSize:12, color:'#196F3D', marginBottom:10 }}>SAC (Services)</div>
                <div style={grid(2)}>
                  <FG label="SAC No" span={2}>
                    <input
                      style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                      value={form.sacNo ?? ''}
                      onChange={e => onSacChange(e.target.value)}
                      list="sacDatalist"
                      placeholder="Type SAC code or description..."
                    />
                    <datalist id="sacDatalist">
                      {sacList.map(s => (
                        <option key={s.code} value={s.code}>{s.code} — {s.desc}</option>
                      ))}
                    </datalist>
                  </FG>
                  <FG label="IGST %">
                    <input style={inp} type="number"
                      value={form.sacIgst ?? ''}
                      onChange={e => onSacIgstChange(e.target.value)}
                      placeholder="18"/>
                  </FG>
                  <FG label="CGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.sacCgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                  <FG label="SGST % (auto)">
                    <input style={{...inp, background:'#F8F7FA', color:'#6C757D'}}
                      type="number" value={form.sacSgst ?? ''} readOnly placeholder="9"/>
                  </FG>
                </div>
              </div>
            </div>

            {/* ── GST Category + ITC Eligibility ── */}
            <div style={{ marginTop:16, border:'1px solid var(--odoo-border)', borderRadius:6, padding:14, background:'#FAFAFA' }}>
              <div style={{ fontWeight:700, fontSize:12, color:'#714B67', marginBottom:12 }}>
                GST Classification &amp; ITC Eligibility
                <span style={{ marginLeft:8, fontSize:10, fontWeight:400, color:'#6C757D' }}>
                  Controls auto-journal posting and ITC reconciliation
                </span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

                {/* GST Category */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }}>
                    GST Category (Output Tax)
                  </label>
                  <select style={{ ...inp, cursor:'pointer' }}
                    value={form.gstCategory ?? 'taxable'}
                    onChange={e => setForm(p => ({ ...p, gstCategory: e.target.value }))}>
                    <option value="taxable">Taxable — Standard GST applies</option>
                    <option value="exempt">Exempt — No GST (Schedule 1)</option>
                    <option value="nil_rated">Nil Rated — 0% GST</option>
                    <option value="zero_rated">Zero Rated — Export / SEZ</option>
                    <option value="non_gst">Non-GST Supply — Outside GST scope</option>
                  </select>
                  <div style={{ marginTop:6, fontSize:11, color:'#6C757D' }}>
                    {form.gstCategory === 'taxable'   && 'CGST/SGST or IGST will be charged on sales invoices'}
                    {form.gstCategory === 'exempt'     && 'No output GST on sales. ITC reversal may apply.'}
                    {form.gstCategory === 'nil_rated'  && '0% GST. Reported in GSTR-1 but no tax charged.'}
                    {form.gstCategory === 'zero_rated' && 'Exports / SEZ supply. Refund of ITC available.'}
                    {form.gstCategory === 'non_gst'    && 'Petroleum, alcohol etc. GST not applicable.'}
                  </div>
                </div>

                {/* ITC Eligibility */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }}>
                    ITC Eligibility (Input Tax Credit)
                  </label>
                  <select style={{ ...inp, cursor:'pointer',
                    background: form.itcEligibility === 'blocked' ? '#FFF3F3' :
                                form.itcEligibility === 'full'    ? '#F0FFF4' : '#FFFEF0',
                    borderColor: form.itcEligibility === 'blocked' ? '#DC3545' :
                                 form.itcEligibility === 'full'    ? '#28A745' : '#FFC107',
                  }}
                    value={form.itcEligibility ?? 'full'}
                    onChange={e => setForm(p => ({ ...p, itcEligibility: e.target.value }))}>
                    <option value="full">Full ITC — 100% claimable</option>
                    <option value="partial">Partial ITC — 50% (motor vehicle / mixed use)</option>
                    <option value="blocked">Blocked — Sec 17(5) — NEVER claim</option>
                    <option value="na">N/A — Sales item (no ITC applicable)</option>
                    <option value="capital">Capital Goods — ITC over 60 months</option>
                  </select>
                  {form.itcEligibility === 'blocked' && (
                    <div style={{ marginTop:6, padding:'6px 10px', background:'#FFF3F3', border:'1px solid #FFCDD2',
                      borderRadius:4, fontSize:11, color:'#C62828', fontWeight:600 }}>
                      Sec 17(5): Food, personal vehicle, club membership, beauty services, construction — ITC blocked. Claiming this will attract GST notice + 18% interest.
                    </div>
                  )}
                  {form.itcEligibility === 'full' && (
                    <div style={{ marginTop:6, fontSize:11, color:'#155724' }}>
                      Full ITC claimed on purchase. Posted to Dr 1610/1620/1630 (CGST/SGST/IGST Input).
                    </div>
                  )}
                  {form.itcEligibility === 'partial' && (
                    <div style={{ marginTop:6, fontSize:11, color:'#856404' }}>
                      50% ITC only. Remaining 50% added to item cost.
                    </div>
                  )}
                  {form.itcEligibility === 'capital' && (
                    <div style={{ marginTop:6, fontSize:11, color:'#0C5460' }}>
                      Capital goods: 1/60th ITC per month. Track in Fixed Asset Register.
                    </div>
                  )}
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
          {editCode && (
            <button onClick={handleDelete}
              style={{ marginLeft:'auto', padding:'7px 16px', background:'#DC3545', color:'#fff',
                border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              Delete Item
            </button>
          )}
          {!editCode && (
            <span style={{ fontSize:11, color:'var(--odoo-gray)', marginLeft:'auto', alignSelf:'center' }}>
              Tab: {TABS.find(t=>t.id===tab)?.label}
            </span>
          )}
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
          <button className="btn btn-s sd-bsm" onClick={()=>setShowImport(true)}>⬆ Import</button>
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

      {/* Search + Status */}
      <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
        <input placeholder="Search code or name..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...inp, width:260 }}/>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          style={{ ...sel, width:120 }}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
        <span style={{ fontSize:12, color:'var(--odoo-gray)', marginLeft:'auto' }}>
          {filtered.length} item{filtered.length!==1?'s':''}
        </span>
      </div>

      {/* Category filter chips — attractive with count badges */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {cats.map(c => {
          const count   = c === 'All' ? items.length : items.filter(i=>i.cat===c).length
          const isActive = catFilter === c
          // Color per category
          const COLOR = {
            'All':              { bg:'#714B67', light:'#EDE0EA', border:'#714B67' },
            'Raw Material':     { bg:'#0C5460', light:'#D1ECF1', border:'#17A2B8' },
            'Finished Goods':   { bg:'#155724', light:'#D4EDDA', border:'#28A745' },
            'Work In Progress': { bg:'#856404', light:'#FFF3CD', border:'#FFC107' },
            'Service Item':     { bg:'#004085', light:'#CCE5FF', border:'#007BFF' },
            'Service':          { bg:'#004085', light:'#CCE5FF', border:'#007BFF' },
            'Consumable':       { bg:'#E06F39', light:'#FDECEA', border:'#E06F39' },
            'Bought Out':       { bg:'#383D41', light:'#E2E3E5', border:'#6C757D' },
            'Capital Goods':    { bg:'#4B2E83', light:'#EDE0EA', border:'#6F42C1' },
            'Scrap':            { bg:'#721C24', light:'#F8D7DA', border:'#DC3545' },
          }
          const cc = COLOR[c] || { bg:'#495057', light:'#F8F9FA', border:'#6C757D' }
          return (
            <button key={c} onClick={() => setCat(c)} style={{
              padding:'5px 12px 5px 10px',
              borderRadius:20,
              fontSize:11,
              fontWeight:700,
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:5,
              transition:'all .15s',
              border:`1.5px solid ${isActive ? cc.bg : cc.border}`,
              background: isActive ? cc.bg : cc.light,
              color: isActive ? '#fff' : cc.bg,
              boxShadow: isActive ? `0 2px 8px ${cc.bg}44` : 'none',
              transform: isActive ? 'translateY(-1px)' : 'none',
            }}>
              <span>{c}</span>
              <span style={{
                background: isActive ? 'rgba(255,255,255,0.25)' : cc.bg,
                color: '#fff',
                borderRadius:10,
                padding:'1px 6px',
                fontSize:10,
                fontWeight:800,
                minWidth:18,
                textAlign:'center',
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      <div style={{
        maxHeight: 'calc(100vh - 320px)',
        overflowY: 'auto',
        overflowX: 'auto',
        border: '1px solid var(--odoo-border)',
        borderRadius: 6,
      }}>
      <table className="fi-data-table" style={{ width:'100%', minWidth:900 }}>
        <thead style={{ position:'sticky', top:0, zIndex:10, background:'#F8F4F8' }}>
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
                  <button onClick={async () => {
                      if (!window.confirm(`Delete "${item.code} — ${item.name}"?\nThis cannot be undone.`)) return
                      try {
                        const res = await fetch(`${BASE_URL}/items/${item.id}`, { method:'DELETE', headers: authHeaders() })
                        const d   = await res.json()
                        if (!res.ok) throw new Error(d.error || 'Delete failed')
                        toast.success(`${item.code} deleted!`)
                        fetchItems()
                      } catch(e) { toast.error(e.message) }
                    }}
                    style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                      border:'none', cursor:'pointer', background:'#DC3545', color:'#fff' }}>
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )

  {showImport && (
    <ImportModal templateKey="item"
      onImport={async rows => {
        const res = await fetch(`${BASE_URL}/mdm/items/bulk`, { method:'POST', headers: hdr(), body: JSON.stringify({ items: rows }) })
        const d = await res.json()
        return { imported: d.count||rows.length, failed: 0 }
      }}
      onClose={()=>{ setShowImport(false); load() }}
    />
  )}
}