import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const MOV_TYPES = ['101 — GR for PO', '501 — Receipt w/o PO', '551 — Subcontracting GR', '561 — Opening Stock']
const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }

const SHdr = ({ title }) => (
  <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)', padding:'8px 16px' }}>
    <span style={{ color:'#fff', fontSize:13, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{title}</span>
  </div>
)

export default function GoodsReceipt() {
  const nav = useNavigate()
  const [grns,       setGrns]       = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [grNo,       setGrNo]       = useState('Auto-generated')
  const [saving,     setSaving]     = useState(false)
  const [selectedGrn,setSelectedGrn]= useState(null)
  const [form, setForm] = useState({
    grnId:       '',
    grnNo:       '',
    movType:     '101 — GR for PO',
    recLocation: '',
    postDate:    new Date().toISOString().split('T')[0],
    receivedBy:  JSON.parse(localStorage.getItem('lnv_user') || '{}')?.name || 'Admin',
    remarks:     '',
  })
  const [lines, setLines] = useState([])

  const load = useCallback(async () => {
    try {
      const [rG, rW, rN] = await Promise.all([
        fetch(`${BASE_URL}/wm/grn?status=APPROVED`,  { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/warehouses`,             { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/goods-receipt/next-no`, { headers: hdr2() }),
      ])
      const [dG, dW, dN] = await Promise.all([rG.json(), rW.json(), rN.json()])
      setGrns(dG.data || [])
      const whs = dW.data || []
      setWarehouses(whs)
      if (whs.length) setForm(f => ({ ...f, recLocation: whs[0]?.name || '' }))
      setGrNo(dN.grNo || 'GR-AUTO')
    } catch { toast.error('Failed to load data') }
  }, [])

  useEffect(() => { load() }, [load])

  // When GRN selected — load its lines
  const onGrnSelect = async (grnId) => {
    if (!grnId) { setSelectedGrn(null); setLines([]); setForm(f => ({ ...f, grnId:'', grnNo:'' })); return }
    try {
      const res  = await fetch(`${BASE_URL}/wm/grn/${grnId}`, { headers: hdr2() })
      const data = await res.json()
      const grn  = data.data
      setSelectedGrn(grn)
      setForm(f => ({ ...f, grnId: grn.id, grnNo: grn.grnNo, vendorName: grn.vendorName }))
      setLines((grn.lines || []).map(l => ({
        itemCode:   l.itemCode || '',
        itemName:   l.itemName || l.description || '',
        grnQty:     parseFloat(l.acceptedQty || l.receivedQty || 0),
        recQty:     parseFloat(l.acceptedQty || l.receivedQty || 0),
        uom:        l.uom || 'Nos',
        batchNo:    '',
        bin:        '',
        expiryDate: '',
        remarks:    '',
      })))
    } catch { toast.error('Failed to load GRN details') }
  }

  const updLine = (i, k, v) => setLines(p => p.map((l, idx) => idx !== i ? l : { ...l, [k]: v }))
  const fSet   = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const post = async () => {
    if (!form.grnId) return toast.error('Select a GRN first')
    const validLines = lines.filter(l => parseFloat(l.recQty) > 0)
    if (!validLines.length) return toast.error('At least one line must have received qty')
    if (!form.recLocation) return toast.error('Receiving location required')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/goods-receipt`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ ...form, grNo, lines: validLines })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Post failed')
      toast.success(`Goods Receipt ${data.grNo || grNo} posted! Stock updated.`)
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
            Goods Receipt
            <small style={{ fontFamily:'DM Mono,monospace', color:'#714B67', marginLeft:8 }}>{grNo}</small>
            <small>MIGO · GR from GRN → Stock Update</small>
          </div>
          <div className="lv-acts">
            <div style={{ display:'flex', gap:0, marginRight:8 }}>
              {['GRN Posted', 'GR to Stock', 'Vendor Invoice'].map((s, i) => (
                <div key={s} style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ padding:'3px 10px', fontSize:10, fontWeight:700,
                    background: i === 0 ? '#D4EDDA' : i === 1 ? '#714B67' : '#E0D5E0',
                    color: i === 0 ? '#155724' : i === 1 ? '#fff' : '#6C757D',
                    borderRadius: i === 0 ? '10px 0 0 10px' : i === 2 ? '0 10px 10px 0' : '0' }}>
                    {i === 0 ? '✓ ' : ''}{s}
                  </span>
                  {i < 2 && <span style={{ color:'#6C757D' }}>›</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>Cancel</button>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={post}>
              {saving ? 'Posting...' : 'Post GR & Update Stock'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 0', paddingBottom:40 }}>

        {/* Info strip */}
        <div style={{ background:'#D1ECF1', border:'1px solid #BEE5EB', borderRadius:6, padding:'8px 14px', marginBottom:14, fontSize:12, color:'#0C5460' }}>
          Goods Receipt auto-updates stock ledger. Select an approved GRN from MM module to proceed.
        </div>

        {/* Receipt Details */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
          <SHdr title="Receipt Details" />
          <div style={{ padding:16, background:'#fff' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={lbl}>GR Number</label>
                <input style={{ ...inp, background:'#F8F4F8', color:'#714B67', fontWeight:700, fontFamily:'DM Mono,monospace' }} value={grNo} readOnly />
              </div>
              <div>
                <label style={lbl}>Reference GRN *</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.grnId} onChange={e => onGrnSelect(e.target.value)}>
                  <option value="">-- Select GRN --</option>
                  {grns.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.grnNo} · {g.vendorName} · {new Date(g.grnDate || g.createdAt).toLocaleDateString('en-IN')}
                    </option>
                  ))}
                </select>
                {grns.length === 0 && <div style={{ fontSize:10, color:'#856404', marginTop:3 }}>No approved GRNs available</div>}
              </div>
              <div>
                <label style={lbl}>Posting Date</label>
                <input type="date" style={inp} value={form.postDate} onChange={fSet('postDate')} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Receiving Location *</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.recLocation} onChange={fSet('recLocation')}>
                  <option value="">-- Select Location --</option>
                  {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Movement Type</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.movType} onChange={fSet('movType')}>
                  {MOV_TYPES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Received By</label>
                <input style={{ ...inp, background:'#F8F9FA' }} value={form.receivedBy} readOnly />
              </div>
            </div>

            {/* GRN summary strip */}
            {selectedGrn && (
              <div style={{ marginTop:12, background:'#F8F4F8', borderRadius:6, padding:'10px 14px', display:'flex', gap:24, fontSize:12 }}>
                <span><strong>Vendor:</strong> {selectedGrn.vendorName}</span>
                <span><strong>PO Ref:</strong> {selectedGrn.poNo || '—'}</span>
                <span><strong>GRN Date:</strong> {new Date(selectedGrn.grnDate || selectedGrn.createdAt).toLocaleDateString('en-IN')}</span>
                <span><strong>Lines:</strong> {(selectedGrn.lines || []).length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <SHdr title="Items to Stock" />
          {lines.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#999', background:'#fff', fontSize:13 }}>
              Select a GRN above to load items
            </div>
          ) : (
            <div style={{ overflowX:'auto', background:'#fff' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead style={{ background:'#F8F4F8' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['#','Material','GRN Qty','Received Qty','UOM','Batch No.','Bin / Location','Expiry Date','Remarks'].map(h => (
                      <th key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700, color:'#6C757D', textAlign:'left', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                      <td style={{ padding:'6px 10px', color:'#6C757D', fontWeight:700, textAlign:'center' }}>{i + 1}</td>
                      <td style={{ padding:'6px 10px', fontWeight:600 }}>
                        <div style={{ fontSize:12 }}>{l.itemName}</div>
                        <div style={{ fontSize:10, color:'#714B67', fontFamily:'DM Mono,monospace' }}>{l.itemCode}</div>
                      </td>
                      <td style={{ padding:'6px 10px', fontWeight:700, textAlign:'right', fontFamily:'DM Mono,monospace', color:'#714B67' }}>{l.grnQty}</td>
                      <td style={{ padding:'4px 6px', width:85 }}>
                        <input type="number" min={0} max={l.grnQty}
                          style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, textAlign:'right', fontFamily:'DM Mono,monospace', boxSizing:'border-box', background: parseFloat(l.recQty) > parseFloat(l.grnQty) ? '#FFF5F5' : '#fff' }}
                          value={l.recQty} onChange={e => updLine(i, 'recQty', e.target.value)} />
                      </td>
                      <td style={{ padding:'6px 10px', textAlign:'center' }}>{l.uom}</td>
                      <td style={{ padding:'4px 6px', width:110 }}>
                        <input style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, boxSizing:'border-box' }}
                          value={l.batchNo} onChange={e => updLine(i, 'batchNo', e.target.value)} placeholder="BTH-001" />
                      </td>
                      <td style={{ padding:'4px 6px', width:100 }}>
                        <input style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, boxSizing:'border-box', fontFamily:'DM Mono,monospace' }}
                          value={l.bin} onChange={e => updLine(i, 'bin', e.target.value)} placeholder="BIN-A01" />
                      </td>
                      <td style={{ padding:'4px 6px', width:120 }}>
                        <input type="date" style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, boxSizing:'border-box' }}
                          value={l.expiryDate} onChange={e => updLine(i, 'expiryDate', e.target.value)} />
                      </td>
                      <td style={{ padding:'4px 6px', minWidth:100 }}>
                        <input style={{ width:'100%', padding:'5px 6px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, boxSizing:'border-box' }}
                          value={l.remarks} onChange={e => updLine(i, 'remarks', e.target.value)} placeholder="Notes..." />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
