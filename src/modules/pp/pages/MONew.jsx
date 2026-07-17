import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function MONew() {
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [selItem, setSelItem] = useState(null)
  const [bom, setBom] = useState(null)
  const [bomLoading, setBomLoading] = useState(false)

  const [sos, setSos] = useState([])
  const [selSO, setSelSO] = useState('')

  const [form, setForm] = useState({
    plannedQty:'', scheduledStart:'', scheduledEnd:'', dueDate:'', priority:'Normal',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (search.trim().length < 2) { setItems([]); return }
    fetch(`${BASE_URL}/mdm/items?search=${encodeURIComponent(search)}`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setItems((d.data||[]).filter(i=>i.itemType==='FG' || i.bomMaintain).slice(0,10)))
      .catch(()=>{})
  }, [search])

  useEffect(() => {
    fetch(`${BASE_URL}/sd/orders?status=CONFIRMED`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setSos(d.data||[]))
      .catch(()=>{})
  }, [])

  const pickItem = async (item) => {
    setSelItem(item); setSearch(item.name); setItems([]); setBom(null)
    setBomLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/pp/bom?itemCode=${encodeURIComponent(item.code)}`, { headers:hdr2() })
      const d = await r.json()
      const activeBom = (d.data||[]).find(b => b.status==='Active') || d.data?.[0]
      setBom(activeBom || null)
      if (!activeBom) toast(`No BOM found for ${item.name} — MO can still be created, just without auto-exploded materials`, {icon:'⚠️'})
    } catch { toast.error('Could not load BOM') }
    finally { setBomLoading(false) }
  }

  const qtyNum = parseFloat(form.plannedQty || 0)
  const explodedLines = bom && qtyNum > 0
    ? bom.lines.map(l => {
        const ratio = qtyNum / Number(bom.baseQty || 1)
        const reqQty = Math.round(Number(l.qty) * ratio * 1000) / 1000
        return { itemCode:l.itemCode, itemName:l.itemName, reqQty, uom:l.uom, stdCost:Number(l.stdCost||0), lineCost: reqQty * Number(l.stdCost||0) }
      })
    : []
  const totalMaterialCost = explodedLines.reduce((s,l)=>s+l.lineCost, 0)

  const save = async () => {
    if (!selItem) return toast.error('Select an item to manufacture')
    if (!qtyNum || qtyNum <= 0) return toast.error('Enter a valid planned quantity')
    setSaving(true)
    try {
      const so = sos.find(s => String(s.id)===String(selSO))
      const payload = {
        itemCode: selItem.code, itemName: selItem.name,
        plannedQty: qtyNum, uom: selItem.uom || 'Nos',
        bomId: bom?.id, bomNo: bom?.bomNo,
        soId: so?.id, soNo: so?.soNo, customerId: so?.customerId, customerName: so?.customerName,
        scheduledStart: form.scheduledStart || null, scheduledEnd: form.scheduledEnd || null,
        dueDate: form.dueDate || null, priority: form.priority,
        bomComponents: explodedLines,
        status: 'DRAFT',
      }
      const r = await fetch(`${BASE_URL}/pp/mo`, { method:'POST', headers:hdr(), body:JSON.stringify(payload) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ ${d.data.moNo} created`)
      nav('/pp/mo')
    } catch { toast.error('Failed to create MO') }
    finally { setSaving(false) }
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',maxWidth:900}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'14px 20px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#714B67'}}>+ New Manufacturing Order</div>
          <div style={{fontSize:12,color:'#888',marginTop:2}}>SO (optional) → MO → BOM explodes → confirm to auto-create Work Orders from Routing</div>
        </div>
        <button onClick={()=>nav('/pp/mo')} style={{padding:'7px 14px',background:'#fff',border:'1px solid #ddd',borderRadius:6,cursor:'pointer',fontWeight:600,color:'#555'}}>← Back to MO Register</button>
      </div>

      <div style={{padding:'0 20px 20px',display:'flex',flexDirection:'column',gap:16}}>
        {/* Item selection */}
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
          <label style={{fontSize:11,fontWeight:700,color:'#714B67'}}>ITEM TO MANUFACTURE *</label>
          <div style={{position:'relative',marginTop:6}}>
            <input value={search} onChange={e=>{setSearch(e.target.value); setSelItem(null)}}
              placeholder='Search finished/semi-finished item...'
              style={{width:'100%',boxSizing:'border-box',padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}} />
            {items.length>0 && !selItem && (
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #E0D5E0',
                borderRadius:6,zIndex:10,maxHeight:220,overflow:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                {items.map(i => (
                  <div key={i.code} onClick={()=>pickItem(i)}
                    style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #F0F0F0',fontSize:12}}>
                    <b>{i.name}</b> — {i.code} <span style={{color:'#888'}}>({i.uom})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selItem && (
            <div style={{marginTop:8,fontSize:12,color:'#1E8449',fontWeight:600}}>
              ✓ {selItem.name} ({selItem.code}) — {selItem.uom}
              {bomLoading && <span style={{color:'#888',fontWeight:400}}> · loading BOM...</span>}
              {!bomLoading && bom && <span style={{color:'#1A5276',fontWeight:400}}> · BOM {bom.bomNo} found ({bom.lines.length} components)</span>}
              {!bomLoading && selItem && !bom && <span style={{color:'#B8860B',fontWeight:400}}> · no BOM found</span>}
            </div>
          )}
        </div>

        {/* Quantity + Schedule */}
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#714B67'}}>PLANNED QUANTITY *</label>
            <input type='number' value={form.plannedQty} onChange={e=>setForm({...form,plannedQty:e.target.value})}
              placeholder='0' style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}} />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#714B67'}}>PRIORITY</label>
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}
              style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}}>
              {['Low','Normal','High','Urgent'].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#714B67'}}>LINK TO SALES ORDER (optional)</label>
            <select value={selSO} onChange={e=>setSelSO(e.target.value)}
              style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}}>
              <option value=''>— Not linked to an SO —</option>
              {sos.map(s=><option key={s.id} value={s.id}>{s.soNo} — {s.customerName}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#714B67'}}>SCHEDULED START</label>
            <input type='date' value={form.scheduledStart} onChange={e=>setForm({...form,scheduledStart:e.target.value})}
              style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}} />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#714B67'}}>SCHEDULED END</label>
            <input type='date' value={form.scheduledEnd} onChange={e=>setForm({...form,scheduledEnd:e.target.value})}
              style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}} />
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:'#714B67'}}>DUE DATE</label>
            <input type='date' value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}
              style={{width:'100%',boxSizing:'border-box',marginTop:6,padding:'9px 12px',border:'1.5px solid #DDD',borderRadius:6,fontSize:13}} />
          </div>
        </div>

        {/* BOM explosion preview */}
        {explodedLines.length > 0 && (
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
            <div style={{padding:'10px 16px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:13}}>
              📐 BOM Exploded — Materials Required for {qtyNum} {selItem?.uom}
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#FAF8FA'}}>
                <th style={{padding:'8px 12px',textAlign:'left'}}>Material</th>
                <th style={{padding:'8px 12px',textAlign:'right'}}>Qty Required</th>
                <th style={{padding:'8px 12px',textAlign:'right'}}>Std Cost</th>
                <th style={{padding:'8px 12px',textAlign:'right'}}>Line Cost</th>
              </tr></thead>
              <tbody>
                {explodedLines.map((l,i)=>(
                  <tr key={i} style={{borderTop:'1px solid #F0EBF0'}}>
                    <td style={{padding:'8px 12px'}}>{l.itemName} <span style={{color:'#888',fontSize:10}}>({l.itemCode})</span></td>
                    <td style={{padding:'8px 12px',textAlign:'right'}}>{l.reqQty} {l.uom}</td>
                    <td style={{padding:'8px 12px',textAlign:'right',color:'#888'}}>{fmtC(l.stdCost)}</td>
                    <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#1E8449'}}>{fmtC(l.lineCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr style={{background:'#FAF8FA',fontWeight:800}}>
                <td colSpan={3} style={{padding:'10px 12px'}}>Total Material Cost</td>
                <td style={{padding:'10px 12px',textAlign:'right',color:'#1E8449'}}>{fmtC(totalMaterialCost)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}

        <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
          <button onClick={()=>nav('/pp/mo')} style={{padding:'10px 20px',background:'#fff',border:'1px solid #ddd',borderRadius:6,cursor:'pointer',fontWeight:600,color:'#555'}}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{padding:'10px 24px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,cursor:saving?'default':'pointer',fontWeight:700}}>
            {saving ? 'Creating...' : '+ Create MO (Draft)'}
          </button>
        </div>
      </div>
    </div>
  )
}
