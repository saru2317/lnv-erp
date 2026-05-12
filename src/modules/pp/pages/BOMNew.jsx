import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR = v => '₹' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1.5px solid #D0D7DE', borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const sel = { ...inp, cursor:'pointer' }
const lbl = { fontSize:10, fontWeight:700, color:'#444', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:.5 }
const UOM_LIST = ['Nos','Kg','Gram','Litre','ML','Metre','Set','Box','Roll','Sheet']

const BLANK_LINE = { seqNo:'', itemGroupId:'', itemCode:'', itemName:'', qty:'', uom:'Kg', scrapPct:'0', stdCost:'', remarks:'' }
const BLANK_HDR  = { itemCode:'', itemName:'', revision:'A', baseQty:'1', uom:'Nos', plant:'MAIN', status:'Active', remarks:'', bomType:'moulding' }

// ── Searchable Dropdown ───────────────────────────────────────────────────────
function SearchSelect({ value, onChange, options, placeholder, style={} }) {
  const [open,    setOpen]    = useState(false)
  const [search,  setSearch]  = useState('')
  const ref = useRef()

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o =>
    !search || o.label?.toLowerCase().includes(search.toLowerCase()) ||
    o.code?.toLowerCase().includes(search.toLowerCase())
  )
  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position:'relative', ...style }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ ...inp, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center',
          background: value ? '#fff' : '#FAFAFA',
          borderColor: value ? '#1A5276' : '#D0D7DE' }}>
        <span style={{ fontSize:12, color: value ? '#1A5276' : '#6C757D', fontWeight: value?700:400,
          fontFamily: value?'DM Mono,monospace':'DM Sans,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {selected ? `${selected.code ? selected.code+' — ' : ''}${selected.label}` : placeholder}
        </span>
        <span style={{ fontSize:10, color:'#6C757D', marginLeft:4 }}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff',
          border:'1.5px solid #1A5276', borderRadius:'0 0 6px 6px', zIndex:999, boxShadow:'0 4px 12px rgba(0,0,0,.15)' }}>
          <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Type to search..."
            style={{ width:'100%', padding:'7px 10px', border:'none', borderBottom:'1px solid #E0D5E0',
              fontSize:12, outline:'none', boxSizing:'border-box' }} />
          <div style={{ maxHeight:200, overflowY:'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding:'10px 12px', fontSize:11, color:'#6C757D' }}>No items found</div>
            )}
            {filtered.map(o => (
              <div key={o.value} onClick={() => { onChange(o); setOpen(false); setSearch('') }}
                style={{ padding:'8px 12px', cursor:'pointer', fontSize:12,
                  background: o.value===value?'#EBF5FB':'#fff',
                  color: o.value===value?'#1A5276':'#333',
                  borderBottom:'1px solid #F5F5F5' }}
                onMouseEnter={e=>e.currentTarget.style.background='#F0F8FF'}
                onMouseLeave={e=>e.currentTarget.style.background=o.value===value?'#EBF5FB':'#fff'}>
                {o.code && <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:11, color:'#1A5276', marginRight:6 }}>{o.code}</span>}
                <span>{o.label}</span>
                {o.uom && <span style={{ fontSize:10, color:'#6C757D', marginLeft:6 }}>({o.uom})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function BOMNew() {
  const navigate   = useNavigate()
  const { id }     = useParams()
  const [params]   = useSearchParams()
  const copyId     = params.get('copy')
  const isEdit     = !!id && id !== 'new'

  const [hdr,        setHdr]        = useState({ ...BLANK_HDR })
  const [lines,      setLines]      = useState([{ ...BLANK_LINE, seqNo:'10' }])
  const [byProducts, setByProducts] = useState([])
  const [activeTab,  setActiveTab]  = useState('components') // components | byproducts
  const [saving,     setSaving]     = useState(false)

  // Master data
  const [allItems,   setAllItems]   = useState([])   // all items from API
  const [itemGroups, setItemGroups] = useState([])   // item groups

  // Derived lists
  const [fgItems,    setFgItems]    = useState([])   // FG + Billing = true items

  const setH = (k,v) => setHdr(h=>({...h,[k]:v}))
  const setL  = (i,k,v) => setLines(ls=>{ const u=[...ls]; u[i]={...u[i],[k]:v}; return u })
  const addLine = () => setLines(ls=>[...ls,{...BLANK_LINE,seqNo:String((ls.length+1)*10)}])
  const delLine = i => setLines(ls=>ls.filter((_,idx)=>idx!==i))

  // Byproduct helpers
  const BLANK_BP = { seqNo:'', itemCode:'', itemName:'', qty:'', uom:'Kg', byProductValue:'', remarks:'' }
  const setBP  = (i,k,v) => setByProducts(bp=>{ const u=[...bp]; u[i]={...u[i],[k]:v}; return u })
  const addBP  = () => setByProducts(bp=>[...bp, {...BLANK_BP, seqNo:String((bp.length+1)*10)}])
  const delBP  = i => setByProducts(bp=>bp.filter((_,idx)=>idx!==i))

  // Auto-calc byproduct qty from scrap% of components
  const autoCalcByProducts = () => {
    const totalInputKg = lines.reduce((s,l) =>
      s + (l.uom==='Kg'||l.uom==='Gram') ? parseFloat(l.qty||0) * (parseFloat(l.scrapPct||0)/100) : 0, 0)
    if (totalInputKg > 0 && byProducts.length > 0) {
      setBP(0, 'qty', totalInputKg.toFixed(3))
      toast('Auto-calculated scrap byproduct qty from component scrap %', { icon:'♻️' })
    }
  }

  // ── Load master data ────────────────────────────────────────────────────────
  useEffect(() => {
    // Try multiple common item API endpoint patterns
    const tryEndpoints = async () => {
      const endpoints = [
        `${BASE_URL}/mdm/items`,   // plural — most common
        `${BASE_URL}/mdm/item`,    // singular
        `${BASE_URL}/items`,       // no module prefix plural
        `${BASE_URL}/item`,        // no module prefix singular
        `${BASE_URL}/mdm/item-master`, // alternate name
      ]
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers: authHdrs() })
          if (!res.ok) continue
          const d   = await res.json()
          const items = Array.isArray(d) ? d : (d.data || d.items || d.result || [])
          if (items.length > 0) {
            setAllItems(items)
            // Exclude obvious RM/Packing/Spare/Chemical items from FG header dropdown
            // Based on code prefix (RM-001, SP-001, PKG-001 etc.) and category name
            const RM_CODE_PREFIXES = ['RM','SP','PKG','PK','CHM','OIL','CON','RAW','MAT']
            const RM_CATEGORIES    = ['raw','consumable','packing','spare','chemical','paint','oil','gas']
            const isNotRM = it => {
              const code = (it.code || '').toUpperCase()
              const cat  = (it.category || '').toLowerCase()
              // Exclude if code starts with RM prefix pattern
              const rmByCode = RM_CODE_PREFIXES.some(p => code.startsWith(p+'-') || code.startsWith(p+'_') || code === p)
              // Exclude if category name contains RM keywords
              const rmByCat  = RM_CATEGORIES.some(c => cat.includes(c))
              return !rmByCode && !rmByCat
            }
            const headerItems = items.filter(isNotRM)
            // If nothing matches (unknown prefix pattern) → show all items
            setFgItems(headerItems.length > 0 ? headerItems : items)
            return // success — stop trying
          }
        } catch { continue }
      }
      toast.error('Item Master API not reachable — check backend routes')
    }
    tryEndpoints()

    // Item Groups — try both singular and plural
    const tryGroups = async () => {
      const endpoints = [
        `${BASE_URL}/mdm/item-group`,
        `${BASE_URL}/mdm/item-groups`,
        `${BASE_URL}/mdm/itemgroup`,
        `${BASE_URL}/item-group`,
      ]
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers: authHdrs() })
          if (!res.ok) continue
          const d = await res.json()
          const groups = Array.isArray(d) ? d : (d.data || d.items || [])
          if (groups.length >= 0) { setItemGroups(groups); return }
        } catch { continue }
      }
    }
    tryGroups()

    // Edit / Copy
    if (isEdit || copyId) {
      const loadId = isEdit ? id : copyId
      fetch(`${BASE_URL}/pp/bom/${loadId}`, { headers: authHdrs() })
        .then(r=>r.json()).then(d=>{
          if(!d.data) return
          const b = d.data
          setHdr({
            itemCode:  b.itemCode||'', itemName: b.itemName||'',
            revision:  isEdit?b.revision:String.fromCharCode((b.revision||'A').charCodeAt(0)+1),
            baseQty:   b.baseQty||'1', uom: b.uom||'Nos',
            plant:     b.plant||'MAIN',
            status:    isEdit?b.status:'Draft',
            remarks:   isEdit?(b.remarks||''):`Copied from ${b.bomNo}`,
          })
          setLines(b.lines?.filter(l=>!l.isByProduct).map((l,i)=>({
            seqNo:       String(l.seqNo||(i+1)*10),
            itemGroupId: l.itemGroupId||'',
            itemCode:    l.itemCode||'',
            itemName:    l.itemName||'',
            qty:         String(l.qty||''),
            uom:         l.uom||'Kg',
            scrapPct:    String(l.scrapPct||'0'),
            stdCost:     String(l.stdCost||''),
            remarks:     l.remarks||'',
          }))||[{...BLANK_LINE,seqNo:'10'}])
          setByProducts(b.lines?.filter(l=>l.isByProduct).map((l,i)=>({
            seqNo:         String(l.seqNo||(i+1)*10),
            itemCode:      l.itemCode||'',
            itemName:      l.itemName||'',
            qty:           String(l.qty||''),
            uom:           l.uom||'Kg',
            byProductValue:String(l.byProductValue||''),
            remarks:       l.remarks||'',
          }))||[])
        }).catch(()=>{})
    }
  }, [id, copyId])

  // ── FG item selected in header ──────────────────────────────────────────────
  const onFGSelect = (opt) => {
    setH('itemCode', opt.code||opt.value)
    setH('itemName', opt.label||opt.name)
    setH('uom',      opt.uom||hdr.uom)
  }

  // ── Component item selected ─────────────────────────────────────────────────
  const onCompSelect = (i, opt) => {
    setL(i, 'itemCode', opt.code||opt.value)
    setL(i, 'itemName', opt.label||opt.name)
    setL(i, 'uom',      opt.uom||'Kg')
    setL(i, 'stdCost',  String(opt.stdCost||opt.mrp||''))
  }

  // ── Get items for a group — match by ID or category name ───────────────────
  const getGroupItems = (groupId) => {
    if (!groupId) return allItems
    // Find the group to get its name
    const grp = itemGroups.find(g => String(g.id||g.code) === String(groupId))
    const grpName = (grp?.name || grp?.groupName || grp?.label || '').toLowerCase()
    return allItems.filter(it => {
      // Match by FK id
      const byId = String(it.groupId||it.itemGroupId||'') === String(groupId)
      // Match by category name (Item.category stores the group name)
      const byCat = grpName && (it.category||'').toLowerCase().includes(grpName)
      // Match by code prefix (RM-001 → group "Raw Material")
      const byPrefix = grpName && (it.code||'').toUpperCase().startsWith(grpName.slice(0,2).toUpperCase())
      return byId || byCat || byPrefix
    })
  }

  // ── Cost calculation ────────────────────────────────────────────────────────
  const totalCost = lines.reduce((s,l)=>
    s+parseFloat(l.stdCost||0)*parseFloat(l.qty||0)*(1+parseFloat(l.scrapPct||0)/100),0)

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = async () => {
    if(!hdr.itemCode) return toast.error('Select Finished Item')
    if(!hdr.itemName) return toast.error('Item Name required')
    if(lines.some(l=>!l.itemName||!l.qty)) return toast.error('All lines need Item and Qty')
    setSaving(true)
    try {
      const payload = {
        ...hdr, baseQty:parseFloat(hdr.baseQty||1),
        lines: lines.map((l,i)=>({
          seqNo:parseInt(l.seqNo||(i+1)*10), itemCode:l.itemCode, itemName:l.itemName,
          qty:parseFloat(l.qty||0), uom:l.uom,
          scrapPct:parseFloat(l.scrapPct||0), stdCost:parseFloat(l.stdCost||0), remarks:l.remarks||'',
        })),
        byProducts: byProducts.filter(b=>b.itemName&&b.qty).map((b,i)=>({
          seqNo:parseInt(b.seqNo||(i+1)*10), itemCode:b.itemCode||'', itemName:b.itemName,
          qty:parseFloat(b.qty||0), uom:b.uom||'Kg',
          byProductValue:parseFloat(b.byProductValue||0), remarks:b.remarks||'',
        })),
      }
      const url    = isEdit?`${BASE_URL}/pp/bom/${id}`:`${BASE_URL}/pp/bom`
      const method = isEdit?'PATCH':'POST'
      const res    = await fetch(url,{method,headers:authHdrs(),body:JSON.stringify(payload)})
      const data   = await res.json()
      if(!res.ok) throw new Error(data.error||'Save failed')
      toast.success(`BOM ${data.data?.bomNo} ${isEdit?'updated':'created'}!`)
      navigate('/pp/bom')
    } catch(e){ toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── FG options — FG + SFG items ────────────────────────────────────────────
  const fgOptions = fgItems.map(it=>({
    value: it.id||it.code, code: it.code, label: it.name,
    uom: it.uom, stdCost: it.stdCost,
    tag: it.category||it.itemType||it.type||'',
  }))

  // ── Component item label based on BOM type ──────────────────────────────────
  const compTypeLabel = hdr.bomType==='assembly'
    ? 'SFG / RM / Packing (for Assembly)'
    : 'Raw Material / Packing (for Moulding)'

  // ── Group options — store both id and name for matching ────────────────────
  const groupOptions = [
    { value:'', label:'— All Items (no filter) —' },
    ...itemGroups.map(g=>({
      value: String(g.id||g.code||g.name),
      label: g.name||g.groupName||g.label||'',
      name:  g.name||g.groupName||g.label||'',
    }))
  ]

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:13}}>

      {/* Header */}
      <div className="fi-lv-hdr" style={{marginBottom:14}}>
        <div className="fi-lv-title">
          {isEdit?'Edit BOM':copyId?'Copy BOM':'Create BOM'}
          <small>SAP: CS01 — Bill of Materials</small>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>navigate('/pp/bom')}
            style={{padding:'7px 16px',background:'#fff',border:'1.5px solid #DEE2E6',borderRadius:6,fontSize:12,cursor:'pointer',color:'#6C757D'}}>
            ← Back
          </button>
          <button onClick={save} disabled={saving}
            style={{padding:'7px 24px',background:saving?'#6C757D':'#1A5276',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            {saving?'⏳ Saving...':'💾 Save BOM'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14}}>

        {/* LEFT */}
        <div>

          {/* BOM Header */}
          <div style={{background:'#fff',border:'1.5px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:'#1A5276',textTransform:'uppercase',letterSpacing:.6,marginBottom:12,paddingBottom:8,borderBottom:'2px solid #EBF5FB'}}>
              📐 BOM Header
            </div>

            {/* FG Item Selection */}
            <div style={{background:'#EBF5FB',border:'1px solid #AED6F1',borderRadius:7,padding:12,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'#1A5276',marginBottom:10}}>
                🏭 Product Being Manufactured
              </div>

              {/* BOM Type Selector */}
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <span style={{fontSize:11,fontWeight:700,color:'#444',alignSelf:'center'}}>BOM Type:</span>
                {[
                  {key:'moulding', label:'⚙️ Moulding BOM', desc:'SFG header → RM components'},
                  {key:'assembly', label:'🔩 Assembly BOM', desc:'FG header → SFG + RM components'},
                ].map(t=>(
                  <div key={t.key} onClick={()=>setH('bomType',t.key)}
                    style={{padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700,
                      border:`1.5px solid ${hdr.bomType===t.key?'#1A5276':'#D0D7DE'}`,
                      background:hdr.bomType===t.key?'#1A5276':'#fff',
                      color:hdr.bomType===t.key?'#fff':'#6C757D'}}>
                    {t.label}
                    <div style={{fontSize:9,fontWeight:400,opacity:.8,marginTop:1}}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={lbl}>
                    Select {hdr.bomType==='assembly'?'FG':'FG / SFG'} Item *
                    <span style={{fontWeight:400,color:'#6C757D',marginLeft:6}}>
                      ({fgItems.length} items loaded)
                    </span>
                  </label>
                  {fgItems.length===0?(
                    <div style={{padding:'8px 10px',background:'#F8D7DA',border:'1px solid #F5C6CB',borderRadius:5,fontSize:11,color:'#721C24'}}>
                      ⚠️ No items loaded — check if backend is running at {BASE_URL}/mdm/item
                    </div>
                  ):(
                    <SearchSelect
                      value={fgItems.find(it=>it.code===hdr.itemCode)?.id||''}
                      onChange={onFGSelect}
                      options={fgOptions}
                      placeholder={`Search ${hdr.bomType==='assembly'?'FG':'FG/SFG'} item...`}
                    />
                  )}
                  {allItems.length>0&&fgItems.length===0&&(
                    <div style={{fontSize:10,color:'#856404',marginTop:4}}>
                      ⚠️ {allItems.length} items exist but none matched FG/SFG category.
                      Categories found: {[...new Set(allItems.map(it=>it.category||it.itemType||'?'))].join(', ')}
                    </div>
                  )}
                </div>
                <div>
                  <label style={lbl}>Item Name</label>
                  <input style={{...inp,background:'#F8F9FA',fontWeight:600}}
                    value={hdr.itemName} readOnly placeholder="Auto-filled from selection"/>
                </div>
              </div>
              {hdr.itemCode&&(
                <div style={{marginTop:8,display:'flex',gap:16,fontSize:11,color:'#1A5276'}}>
                  <span>Code: <strong style={{fontFamily:'DM Mono,monospace'}}>{hdr.itemCode}</strong></span>
                  <span>UOM: <strong>{hdr.uom}</strong></span>
                  <span style={{color:'#6C3483',fontWeight:700}}>
                    {hdr.bomType==='assembly'?'🔩 Assembly BOM':'⚙️ Moulding BOM'}
                  </span>
                </div>
              )}
            </div>

            {/* Other header fields */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px 14px'}}>
              <div>
                <label style={lbl}>Revision</label>
                <input style={inp} value={hdr.revision} onChange={e=>setH('revision',e.target.value)} placeholder="A" maxLength={5} />
              </div>
              <div>
                <label style={lbl}>Base Qty *</label>
                <input style={{...inp,fontWeight:700}} type="number" value={hdr.baseQty} onChange={e=>setH('baseQty',e.target.value)} placeholder="1000" min="1" />
              </div>
              <div>
                <label style={lbl}>UOM</label>
                <select style={sel} value={hdr.uom} onChange={e=>setH('uom',e.target.value)}>
                  {UOM_LIST.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select style={{...sel,
                  background:hdr.status==='Active'?'#D4EDDA':hdr.status==='Draft'?'#FFF3CD':'#F8D7DA',
                  color:hdr.status==='Active'?'#155724':hdr.status==='Draft'?'#856404':'#721C24',
                  fontWeight:700}} value={hdr.status} onChange={e=>setH('status',e.target.value)}>
                  {['Active','Draft','Obsolete'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'span 4'}}>
                <label style={lbl}>Remarks</label>
                <input style={inp} value={hdr.remarks} onChange={e=>setH('remarks',e.target.value)} placeholder="BOM notes..." />
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{display:'flex',borderBottom:'2px solid #E0D5E0',marginBottom:0,background:'#F8F9FA',borderRadius:'8px 8px 0 0'}}>
            {[
              {key:'components',label:`📋 Components (${lines.length})`},
              {key:'byproducts',label:`♻️ Byproducts (${byProducts.length})`,warn:byProducts.length===0},
            ].map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                style={{padding:'10px 20px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:700,
                  color:activeTab===t.key?'#1A5276':'#6C757D',
                  borderBottom:activeTab===t.key?'2px solid #1A5276':'2px solid transparent',
                  marginBottom:-2}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Components Tab */}
          {activeTab==='components'&&(
          <div style={{background:'#fff',border:'1.5px solid #E0D5E0',borderTop:'none',borderRadius:'0 0 8px 8px',padding:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontSize:11,color:'#6C757D'}}>
                {hdr.bomType==='assembly'?'Add SFG, RM and Packing components':'Add Raw Materials and Packing components'}
              </span>
              <div style={{display:'flex',gap:6}}>
                {lines.length > 0 && (
                  <button onClick={()=>setLines([])}
                    style={{padding:'5px 12px',background:'#F8D7DA',color:'#721C24',border:'1px solid #F5C6CB',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    🗑️ Clear All
                  </button>
                )}
                <button onClick={addLine}
                  style={{padding:'6px 14px',background:'#1A5276',color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                  + Add Component
                </button>
              </div>
            </div>

            {/* Component rows */}
            {lines.map((l,i)=>{
              const groupItems = getGroupItems(l.itemGroupId)
              const compOptions = groupItems.map(it=>({
                value:it.id||it.code, code:it.code, label:it.name, uom:it.uom, stdCost:it.stdCost
              }))
              const lc = parseFloat(l.stdCost||0)*parseFloat(l.qty||0)*(1+parseFloat(l.scrapPct||0)/100)
              return (
                <div key={i} style={{border:'1.5px solid #E0D5E0',borderRadius:7,padding:12,marginBottom:10,background:i%2===0?'#fff':'#FAFAFA'}}>

                  {/* Row 1 — Seq + Group + Item selection */}
                  <div style={{display:'grid',gridTemplateColumns:'60px 1fr 1.5fr auto',gap:8,marginBottom:8,alignItems:'flex-end'}}>
                    <div>
                      <label style={lbl}>Seq</label>
                      <input style={{...inp,textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}
                        value={l.seqNo} onChange={e=>setL(i,'seqNo',e.target.value)} placeholder="10" />
                    </div>
                    <div>
                      <label style={lbl}>Item Group <span style={{color:'#6C757D',fontWeight:400}}>(filter by group)</span></label>
                      <select style={sel} value={l.itemGroupId} onChange={e=>{
                        setL(i,'itemGroupId',e.target.value)
                        setL(i,'itemCode','')
                        setL(i,'itemName','')
                      }}>
                        {groupOptions.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>
                        Component — {compTypeLabel} *
                        {l.itemGroupId&&<span style={{color:'#1A5276',marginLeft:4}}>({getGroupItems(l.itemGroupId).length} items in group)</span>}
                      </label>
                      <SearchSelect
                        value={compOptions.find(o=>o.code===l.itemCode)?.value||''}
                        onChange={opt=>onCompSelect(i,opt)}
                        options={compOptions}
                        placeholder={l.itemGroupId?'Search in selected group...':'Select group first or search all...'}
                      />
                    </div>
                    <div style={{display:'flex',alignItems:'flex-end',paddingBottom:1}}>
                      <button onClick={()=>delLine(i)}
                        style={{padding:'7px 10px',background:'#F8D7DA',
                          color:'#721C24',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:13}}>
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Row 2 — Qty, UOM, Scrap, Cost */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 80px 80px 120px 120px',gap:8,alignItems:'flex-end'}}>
                    <div style={{fontSize:11,color:'#6C757D',paddingTop:4,alignSelf:'center'}}>
                      {l.itemCode&&<span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#1A5276'}}>{l.itemCode}</span>}
                      {l.itemName&&!l.itemCode&&<span style={{fontStyle:'italic'}}>{l.itemName}</span>}
                      {!l.itemCode&&!l.itemName&&<span style={{color:'#DC3545'}}>⚠️ No item selected</span>}
                    </div>
                    <div>
                      <label style={lbl}>Qty *</label>
                      <input style={{...inp,textAlign:'center',fontWeight:700}} type="number"
                        value={l.qty} onChange={e=>setL(i,'qty',e.target.value)} placeholder="0" min="0" step="0.001" />
                    </div>
                    <div>
                      <label style={lbl}>UOM</label>
                      <select style={sel} value={l.uom} onChange={e=>setL(i,'uom',e.target.value)}>
                        {UOM_LIST.map(u=><option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Scrap %</label>
                      <input style={{...inp,textAlign:'center'}} type="number"
                        value={l.scrapPct} onChange={e=>setL(i,'scrapPct',e.target.value)} placeholder="0" min="0" max="100" step="0.1" />
                    </div>
                    <div>
                      <label style={lbl}>Std Cost (₹) → {lc>0&&<span style={{color:'#155724',fontWeight:700}}>{INR(lc)}</span>}</label>
                      <input style={{...inp,textAlign:'right'}} type="number"
                        value={l.stdCost} onChange={e=>setL(i,'stdCost',e.target.value)} placeholder="0.00" min="0" step="0.01" />
                    </div>
                  </div>
                </div>
              )
            })}

            <button onClick={addLine}
              style={{width:'100%',padding:'8px',background:'#F8F9FA',border:'1.5px dashed #D0D7DE',borderRadius:6,fontSize:12,color:'#6C757D',cursor:'pointer',fontWeight:600,marginTop:4}}>
              + Add Another Component
            </button>
          </div>
          )}

          {/* Byproducts Tab */}
          {activeTab==='byproducts'&&(
          <div style={{background:'#fff',border:'1.5px solid #E0D5E0',borderTop:'none',borderRadius:'0 0 8px 8px',padding:16}}>
            <div style={{background:'#FFF8E1',border:'1px solid #F9E79F',borderRadius:7,padding:12,marginBottom:14,fontSize:12,color:'#856404'}}>
              <strong>♻️ Byproducts</strong> — Secondary outputs from the production process (Sprue, Runner, Flash, Regrind). 
              These reduce the effective material cost. Set a recovery value per unit.
              <br/>
              <button onClick={autoCalcByProducts} style={{marginTop:6,padding:'4px 10px',background:'#856404',color:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontWeight:700}}>
                ⚡ Auto-calc Qty from Scrap %
              </button>
            </div>

            {byProducts.length===0?(
              <div style={{textAlign:'center',padding:30,border:'2px dashed #F9E79F',borderRadius:8,color:'#856404'}}>
                <div style={{fontSize:28,marginBottom:6}}>♻️</div>
                <div style={{fontWeight:700}}>No byproducts defined</div>
                <div style={{fontSize:11,marginTop:4,color:'#6C757D'}}>
                  Common injection moulding byproducts: Sprue/Runner (regrind), Flash waste, Rejected parts
                </div>
                <button onClick={addBP}
                  style={{marginTop:10,padding:'7px 18px',background:'#856404',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  + Add Byproduct
                </button>
              </div>
            ):(
              <>
                <div style={{marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:11,color:'#6C757D'}}>{byProducts.length} byproduct{byProducts.length>1?'s':''} defined</span>
                  <button onClick={addBP}
                    style={{padding:'5px 12px',background:'#856404',color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                    + Add Byproduct
                  </button>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'#856404',color:'#fff'}}>
                      <th style={{padding:'6px 10px',textAlign:'center',width:55}}>Seq</th>
                      <th style={{padding:'6px 10px',textAlign:'left',width:110}}>Item Code</th>
                      <th style={{padding:'6px 10px',textAlign:'left'}}>Byproduct Name</th>
                      <th style={{padding:'6px 10px',textAlign:'center',width:80}}>Qty (output)</th>
                      <th style={{padding:'6px 10px',textAlign:'center',width:65}}>UOM</th>
                      <th style={{padding:'6px 10px',textAlign:'right',width:110}}>Recovery Value (₹/unit)</th>
                      <th style={{padding:'6px 10px',textAlign:'right',width:110}}>Total Recovery</th>
                      <th style={{padding:'6px 10px',textAlign:'left'}}>Remarks</th>
                      <th style={{padding:'6px 10px',width:35}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProducts.map((b,i)=>{
                      const totalRec = parseFloat(b.byProductValue||0)*parseFloat(b.qty||0)
                      // All items available for byproduct (scrap, regrind — any type)
                      const bpOptions = allItems.map(it=>({
                        value: it.id||it.code, code: it.code,
                        label: it.name, uom: it.uom, stdCost: it.mrp||it.stdCost||0
                      }))
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #FEF9C3',background:i%2===0?'#fff':'#FFFDF0'}}>
                          <td style={{padding:'5px 8px'}}>
                            <input style={{...inp,textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700,padding:'4px 6px'}}
                              value={b.seqNo} onChange={e=>setBP(i,'seqNo',e.target.value)} placeholder="10"/>
                          </td>
                          {/* Item selection — spans code + name columns */}
                          <td colSpan={2} style={{padding:'5px 8px'}}>
                            <SearchSelect
                              value={bpOptions.find(o=>o.code===b.itemCode)?.value||''}
                              onChange={opt=>{
                                setBP(i,'itemCode', opt.code||opt.value)
                                setBP(i,'itemName', opt.label||opt.name)
                                setBP(i,'uom',      opt.uom||'Kg')
                                // Auto set recovery value from MRP if available
                                if(parseFloat(opt.stdCost)>0) setBP(i,'byProductValue',String(opt.stdCost))
                              }}
                              options={bpOptions}
                              placeholder={allItems.length>0?'Search scrap / regrind item...':'Loading items...'}
                              style={{width:'100%'}}
                            />
                            {b.itemCode&&(
                              <div style={{fontSize:10,color:'#856404',marginTop:2,fontFamily:'DM Mono,monospace'}}>
                                {b.itemCode}
                              </div>
                            )}
                          </td>
                          <td style={{padding:'5px 8px'}}>
                            <input style={{...inp,textAlign:'center',fontWeight:700,padding:'4px 6px'}}
                              type="number" value={b.qty} onChange={e=>setBP(i,'qty',e.target.value)} placeholder="0" min="0" step="0.001"/>
                          </td>
                          <td style={{padding:'5px 8px'}}>
                            <select style={{...sel,padding:'4px 6px'}} value={b.uom} onChange={e=>setBP(i,'uom',e.target.value)}>
                              {['Kg','Gram','Nos','Litre'].map(u=><option key={u}>{u}</option>)}
                            </select>
                          </td>
                          <td style={{padding:'5px 8px'}}>
                            <input style={{...inp,textAlign:'right',padding:'4px 6px'}}
                              type="number" value={b.byProductValue} onChange={e=>setBP(i,'byProductValue',e.target.value)} placeholder="0.00" min="0" step="0.01"/>
                          </td>
                          <td style={{padding:'5px 8px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724',fontSize:11}}>
                            {totalRec>0?INR(totalRec):'—'}
                          </td>
                          <td style={{padding:'5px 8px'}}>
                            <input style={{...inp,padding:'4px 6px'}} value={b.remarks}
                              onChange={e=>setBP(i,'remarks',e.target.value)} placeholder="Notes..."/>
                          </td>
                          <td style={{padding:'5px 8px',textAlign:'center'}}>
                            <button onClick={()=>delBP(i)}
                              style={{padding:'4px 7px',background:'#F8D7DA',color:'#721C24',border:'none',borderRadius:4,cursor:'pointer',fontWeight:700}}>✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot style={{background:'#856404',color:'#fff'}}>
                    <tr>
                      <td colSpan={6} style={{padding:'7px 10px',fontWeight:700}}>Total Scrap Recovery Value</td>
                      <td style={{padding:'7px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#F9E79F'}}>
                        {INR(byProducts.reduce((s,b)=>s+parseFloat(b.byProductValue||0)*parseFloat(b.qty||0),0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </div>
          )}
        </div>

        {/* RIGHT — Summary */}
        <div style={{position:'sticky',top:80,alignSelf:'start'}}>
          <div style={{background:'#1A5276',borderRadius:10,padding:18,color:'#fff',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,opacity:.7,textTransform:'uppercase',letterSpacing:.5,marginBottom:12}}>BOM Summary</div>
            <div style={{fontSize:11,opacity:.7,marginBottom:2}}>Finished Product</div>
            <div style={{fontSize:14,fontWeight:800,marginBottom:10}}>{hdr.itemName||'—'}</div>
            {[
              ['Base Qty',   `${hdr.baseQty||1} ${hdr.uom}`],
              ['Components', `${lines.length} items`],
              ['Revision',   `Rev ${hdr.revision}`],
              ['Status',      hdr.status],
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,.1)',fontSize:12}}>
                <span style={{opacity:.7}}>{l}</span>
                <span style={{fontWeight:700}}>{v}</span>
              </div>
            ))}
            <div style={{background:'rgba(255,255,255,.1)',borderRadius:8,padding:14,marginTop:14,textAlign:'center'}}>
              <div style={{fontSize:11,opacity:.7,marginBottom:4}}>TOTAL BOM COST</div>
              <div style={{fontSize:26,fontWeight:900,fontFamily:'DM Mono,monospace',color:'#A9DFBF',lineHeight:1}}>
                {INR(totalCost)}
              </div>
              <div style={{fontSize:11,opacity:.5,marginTop:4}}>per {hdr.baseQty||1} {hdr.uom}</div>
            </div>
            {parseFloat(hdr.baseQty||1)>1&&totalCost>0&&(
              <div style={{textAlign:'center',marginTop:6,fontSize:12,color:'#F9E79F',fontWeight:700}}>
                Per unit: {INR(totalCost/parseFloat(hdr.baseQty||1))}
              </div>
            )}
            {byProducts.length>0&&(()=>{
              const totalRecovery = byProducts.reduce((s,b)=>s+parseFloat(b.byProductValue||0)*parseFloat(b.qty||0),0)
              const netCost = totalCost - totalRecovery
              return (
                <div style={{marginTop:10,padding:'10px',background:'rgba(255,255,255,.08)',borderRadius:6}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                    <span style={{opacity:.7}}>♻️ Scrap Recovery</span>
                    <span style={{color:'#F9E79F',fontWeight:700,fontFamily:'DM Mono,monospace'}}>- {INR(totalRecovery)}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,borderTop:'1px solid rgba(255,255,255,.2)',paddingTop:6}}>
                    <span style={{fontWeight:700}}>Net BOM Cost</span>
                    <span style={{color:'#A9DFBF',fontWeight:800,fontFamily:'DM Mono,monospace'}}>{INR(netCost)}</span>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Cost % bars */}
          <div style={{background:'#fff',border:'1.5px solid #E0D5E0',borderRadius:8,padding:14,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'#1A5276',marginBottom:10}}>📊 Cost Breakdown</div>
            {lines.filter(l=>l.itemName&&parseFloat(l.qty)>0).map((l,i)=>{
              const lc  = parseFloat(l.stdCost||0)*parseFloat(l.qty||0)*(1+parseFloat(l.scrapPct||0)/100)
              const pct = totalCost>0?(lc/totalCost*100).toFixed(1):0
              return (
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                    <span style={{color:'#495057',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>{l.itemName}</span>
                    <span style={{fontWeight:700,color:'#155724',marginLeft:4}}>{pct}%</span>
                  </div>
                  <div style={{background:'#E0D5E0',borderRadius:4,height:5,overflow:'hidden'}}>
                    <div style={{background:'#1A5276',height:'100%',width:`${pct}%`,borderRadius:4,transition:'width .3s'}}/>
                  </div>
                </div>
              )
            })}
            {!lines.some(l=>l.itemName&&parseFloat(l.qty)>0)&&(
              <div style={{fontSize:11,color:'#6C757D'}}>Add components with cost to see breakdown</div>
            )}
          </div>

          <button onClick={save} disabled={saving}
            style={{width:'100%',padding:'10px',background:saving?'#6C757D':'#155724',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:800,cursor:'pointer'}}>
            {saving?'⏳ Saving...':'💾 Save BOM'}
          </button>
        </div>
      </div>
    </div>
  )
}
