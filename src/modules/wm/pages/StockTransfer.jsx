import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const MOV_TYPES = [
  '311 — Bin to Bin (Same Location)',
  '312 — Location to Location',
  '313 — Warehouse to Warehouse',
  '321 — Transfer to Quality',
  '322 — Quality to Unrestricted',
]

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }

const SHdr = ({ title }) => (
  <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)', padding:'8px 16px' }}>
    <span style={{ color:'#fff', fontSize:13, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{title}</span>
  </div>
)

export default function StockTransfer() {
  const nav = useNavigate()
  const [stockItems, setStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [trNo,       setTrNo]       = useState('Auto-generated')
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({
    movType:   '311 — Bin to Bin (Same Location)',
    fromLoc:   '',
    toLoc:     '',
    transDate: new Date().toISOString().split('T')[0],
    remarks:   '',
    transferredBy: JSON.parse(localStorage.getItem('lnv_user') || '{}')?.name || 'Admin',
  })
  const [lines, setLines] = useState([
    { itemCode:'', itemName:'', availQty:0, qty:'', uom:'Nos', fromBin:'', toBin:'', batchNo:'', remarks:'' }
  ])

  const load = useCallback(async () => {
    try {
      const [rS, rW, rN] = await Promise.all([
        fetch(`${BASE_URL}/wm/stock`,            { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/warehouses`,        { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/transfer/next-no`,  { headers: hdr2() }),
      ])
      const [dS, dW, dN] = await Promise.all([rS.json(), rW.json(), rN.json()])
      setStockItems(dS.data || [])
      const whs = dW.data || []
      setWarehouses(whs)
      if (whs.length >= 2) setForm(f => ({ ...f, fromLoc: whs[0]?.name || '', toLoc: whs[1]?.name || '' }))
      setTrNo(dN.trNo || 'TR-AUTO')
    } catch (e) { toast.error('Failed to load data') }
  }, [])

  useEffect(() => { load() }, [load])

  const onItemChange = (idx, code) => {
    const item = stockItems.find(i => i.itemCode === code)
    setLines(prev => prev.map((l, i) => i !== idx ? l : {
      ...l,
      itemCode: code,
      itemName: item?.itemName || '',
      availQty: parseFloat(item?.balanceQty || 0),
      uom: item?.uom || 'Nos',
    }))
  }
  const addLine = () => setLines(p => [...p, { itemCode:'', itemName:'', availQty:0, qty:'', uom:'Nos', fromBin:'', toBin:'', batchNo:'', remarks:'' }])
  const delLine = i => setLines(p => p.filter((_, idx) => idx !== i))
  const updLine = (i, k, v) => setLines(p => p.map((l, idx) => idx !== i ? l : { ...l, [k]: v }))
  const fSet   = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const post = async () => {
    const validLines = lines.filter(l => l.itemCode && parseFloat(l.qty) > 0)
    if (!validLines.length) return toast.error('Add at least one item with qty')
    if (!form.fromLoc || !form.toLoc) return toast.error('From and To locations required')
    if (form.fromLoc === form.toLoc && !lines.some(l => l.fromBin !== l.toBin))
      return toast.error('From and To bins must differ for same-location transfer')
    for (const l of validLines) {
      if (parseFloat(l.qty) > parseFloat(l.availQty))
        return toast.error(`${l.itemName}: Transfer qty exceeds available stock (${l.availQty})`)
    }
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/transfer`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ ...form, trNo, lines: validLines })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Post failed')
      toast.success(`Stock Transfer ${data.trNo || trNo} posted!`)
      nav('/wm/movement')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* Sticky header */}
      <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:100, background:'#F8F4F8', borderBottom:'2px solid #E0D5E0', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Stock Transfer
            <small style={{ fontFamily:'DM Mono,monospace', color:'#714B67', marginLeft:8 }}>{trNo}</small>
            <small>MB1B · Bin to Bin / Location Transfer</small>
          </div>
          <div className="lv-acts">
            {/* Flow steps */}
            <div style={{ display:'flex', gap:0, marginRight:8 }}>
              {['Transfer Entry', 'Stock Moved', 'Log Created'].map((s, i) => (
                <div key={s} style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ padding:'3px 10px', fontSize:10, fontWeight:700,
                    background: i === 0 ? '#714B67' : '#D4EDDA',
                    color: i === 0 ? '#fff' : '#155724',
                    borderRadius: i === 0 ? '10px 0 0 10px' : i === 2 ? '0 10px 10px 0' : '0' }}>
                    {s}
                  </span>
                  {i < 2 && <span style={{ color:'#6C757D' }}>›</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>Cancel</button>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={post}>
              {saving ? 'Posting...' : 'Post Transfer'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 0', paddingBottom:40 }}>

        {/* Transfer Details */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
          <SHdr title="Transfer Details" />
          <div style={{ padding:16, background:'#fff' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={lbl}>Transfer Ref No.</label>
                <input style={{ ...inp, background:'#F8F4F8', color:'#714B67', fontWeight:700, fontFamily:'DM Mono,monospace' }} value={trNo} readOnly />
              </div>
              <div>
                <label style={lbl}>Transfer Date *</label>
                <input type="date" style={inp} value={form.transDate} onChange={fSet('transDate')} />
              </div>
              <div>
                <label style={lbl}>Movement Type</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.movType} onChange={fSet('movType')}>
                  {MOV_TYPES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>From Location *</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.fromLoc} onChange={fSet('fromLoc')}>
                  <option value="">-- Select --</option>
                  {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>To Location *</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.toLoc} onChange={fSet('toLoc')}>
                  <option value="">-- Select --</option>
                  {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Transferred By</label>
                <input style={{ ...inp, background:'#F8F9FA' }} value={form.transferredBy} readOnly />
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <label style={lbl}>Remarks</label>
              <input style={inp} value={form.remarks} onChange={fSet('remarks')} placeholder="Optional remarks..." />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <SHdr title="Items to Transfer" />
          <div style={{ padding:'10px 16px', background:'#fff', display:'flex', justifyContent:'flex-end' }}>
            <button onClick={addLine} style={{ padding:'4px 14px', background:'#714B67', color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>
              + Add Item
            </button>
          </div>
          <div style={{ overflowX:'auto', background:'#fff' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['#','Material','Available','Transfer Qty','UOM','From Bin','To Bin','Batch No.',''].map(h => (
                    <th key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700, color:'#6C757D', textAlign:'left', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                    <td style={{ padding:'6px 10px', color:'#6C757D', fontWeight:700, textAlign:'center' }}>{i + 1}</td>
                    <td style={{ padding:'4px 6px', minWidth:180 }}>
                      <select style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11 }}
                        value={l.itemCode} onChange={e => onItemChange(i, e.target.value)}>
                        <option value="">-- Select Item --</option>
                        {stockItems.filter(it => parseFloat(it.balanceQty) > 0).map(it => (
                          <option key={it.itemCode} value={it.itemCode}>{it.itemCode} — {it.itemName}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color: parseFloat(l.availQty) <= 0 ? '#DC3545' : '#155724', fontFamily:'DM Mono,monospace' }}>
                      {l.availQty} {l.uom}
                    </td>
                    <td style={{ padding:'4px 6px', width:80 }}>
                      <input type="number" min={0} max={l.availQty}
                        style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, textAlign:'right', fontFamily:'DM Mono,monospace', boxSizing:'border-box', background: parseFloat(l.qty) > parseFloat(l.availQty) ? '#FFF5F5' : '#fff' }}
                        value={l.qty} onChange={e => updLine(i, 'qty', e.target.value)} />
                    </td>
                    <td style={{ padding:'6px 10px', textAlign:'center' }}>{l.uom}</td>
                    <td style={{ padding:'4px 6px', width:90 }}>
                      <input style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, boxSizing:'border-box', fontFamily:'DM Mono,monospace' }}
                        value={l.fromBin} onChange={e => updLine(i, 'fromBin', e.target.value)} placeholder="BIN-A01" />
                    </td>
                    <td style={{ padding:'4px 6px', width:90 }}>
                      <input style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, boxSizing:'border-box', fontFamily:'DM Mono,monospace' }}
                        value={l.toBin} onChange={e => updLine(i, 'toBin', e.target.value)} placeholder="BIN-B01" />
                    </td>
                    <td style={{ padding:'4px 6px', width:110 }}>
                      <input style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, boxSizing:'border-box' }}
                        value={l.batchNo} onChange={e => updLine(i, 'batchNo', e.target.value)} placeholder="BTH-001" />
                    </td>
                    <td style={{ padding:'4px 6px', textAlign:'center' }}>
                      {lines.length > 1 && (
                        <button onClick={() => delLine(i)} style={{ background:'#DC3545', color:'#fff', border:'none', borderRadius:4, padding:'2px 7px', cursor:'pointer', fontSize:11 }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
