import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const inp = { padding:'6px 8px', border:'1px solid #E0D5E0', borderRadius:4, fontSize:11, outline:'none', width:'100%', boxSizing:'border-box' }

export default function PhysicalInventory() {
  const nav = useNavigate()
  const [stockItems, setStockItems] = useState([])
  const [piNo,       setPiNo]       = useState('Auto-generated')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('All')  // All | Match | Short | Surplus
  const [form, setForm] = useState({
    countDate:   new Date().toISOString().split('T')[0],
    countedBy:   JSON.parse(localStorage.getItem('lnv_user') || '{}')?.name || 'Admin',
    remarks:     '',
  })
  // rows: { itemCode, itemName, bin, uom, sysQty, countedQty, rate }
  const [rows, setRows] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rS, rN] = await Promise.all([
        fetch(`${BASE_URL}/wm/stock`,         { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/pi/next-no`,    { headers: hdr2() }),
      ])
      const [dS, dN] = await Promise.all([rS.json(), rN.json()])
      const stock = dS.data || []
      setPiNo(dN.piNo || 'PI-AUTO')
      // Build rows from stock
      setRows(stock.map(s => ({
        itemCode:   s.itemCode,
        itemName:   s.itemName,
        bin:        s.binLocation || s.bin || '—',
        uom:        s.uom || 'Nos',
        sysQty:     parseFloat(s.balanceQty || 0),
        countedQty: parseFloat(s.balanceQty || 0),  // default = system qty
        rate:       parseFloat(s.stdCost || s.rate || 0),
      })))
    } catch { toast.error('Failed to load stock data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const updateCount = (i, v) =>
    setRows(prev => prev.map((r, idx) => idx !== i ? r : { ...r, countedQty: v === '' ? '' : parseFloat(v) || 0 }))

  // Computed stats
  const stats = useMemo(() => {
    const matched = rows.filter(r => parseFloat(r.countedQty) === parseFloat(r.sysQty))
    const short   = rows.filter(r => parseFloat(r.countedQty) < parseFloat(r.sysQty))
    const surplus = rows.filter(r => parseFloat(r.countedQty) > parseFloat(r.sysQty))
    const netVal  = rows.reduce((a, r) => a + ((parseFloat(r.countedQty) - parseFloat(r.sysQty)) * parseFloat(r.rate || 0)), 0)
    const shortVal   = short.reduce((a, r) => a + ((parseFloat(r.sysQty) - parseFloat(r.countedQty)) * parseFloat(r.rate || 0)), 0)
    const surplusVal = surplus.reduce((a, r) => a + ((parseFloat(r.countedQty) - parseFloat(r.sysQty)) * parseFloat(r.rate || 0)), 0)
    return { total: rows.length, matched: matched.length, short: short.length, surplus: surplus.length, netVal, shortVal, surplusVal }
  }, [rows])

  // Filter rows
  const displayed = useMemo(() => {
    let r = rows
    if (search) r = r.filter(x => x.itemCode?.toLowerCase().includes(search.toLowerCase()) || x.itemName?.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'Match')   r = r.filter(x => parseFloat(x.countedQty) === parseFloat(x.sysQty))
    if (filter === 'Short')   r = r.filter(x => parseFloat(x.countedQty) < parseFloat(x.sysQty))
    if (filter === 'Surplus') r = r.filter(x => parseFloat(x.countedQty) > parseFloat(x.sysQty))
    return r
  }, [rows, search, filter])

  // Save count (draft, no stock change yet)
  const saveCount = async () => {
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/pi/save`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ piNo, ...form, rows })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      toast.success('Count saved as draft')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Post & adjust stock
  const postAndAdjust = async () => {
    const varRows = rows.filter(r => parseFloat(r.countedQty) !== parseFloat(r.sysQty))
    if (!varRows.length) return toast.error('No variances to post — all quantities match')
    const confirmed = window.confirm(`This will post ${varRows.length} stock adjustments. Continue?`)
    if (!confirmed) return
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/pi/post`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ piNo, ...form, rows })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Post failed')
      toast.success(`Physical Inventory ${piNo} posted! ${varRows.length} adjustments created.`)
      nav('/wm/movement')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const downloadSheet = () => {
    const csv = ['Material Code,Material Name,Bin,UOM,System Qty,Counted Qty,Variance,Value',
      ...rows.map(r => {
        const diff = parseFloat(r.countedQty) - parseFloat(r.sysQty)
        return `${r.itemCode},"${r.itemName}",${r.bin},${r.uom},${r.sysQty},${r.countedQty},${diff},${(diff * parseFloat(r.rate)).toFixed(2)}`
      })
    ].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `PI-Count-Sheet-${piNo}.csv`
    a.click()
    toast.success('Count sheet downloaded')
  }

  const fmtCur = v => (v >= 0 ? '+' : '') + '₹' + Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* Sticky header */}
      <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:100, background:'#F8F4F8', borderBottom:'2px solid #E0D5E0', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Physical Inventory
            <small style={{ fontFamily:'DM Mono,monospace', color:'#714B67', marginLeft:8 }}>{piNo}</small>
            <small>MI01 · Stock Count &amp; Variance</small>
          </div>
          <div className="lv-acts">
            <button className="btn btn-s sd-bsm" onClick={downloadSheet}>Download Sheet</button>
            <button className="btn btn-s sd-bsm" disabled={saving} onClick={saveCount}>
              {saving ? 'Saving...' : 'Save Count'}
            </button>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={postAndAdjust}>
              {saving ? 'Posting...' : 'Post & Adjust Stock'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 0', paddingBottom:40 }}>

        {/* Summary stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
          {[
            ['Total Items',  stats.total,   '#EDE0EA', '#714B67'],
            ['Matched',      stats.matched, '#D4EDDA', '#155724'],
            ['Short',        stats.short,   '#F8D7DA', '#721C24'],
            ['Surplus',      stats.surplus, '#FFF3CD', '#856404'],
            ['Net Variance', fmtCur(stats.netVal), stats.netVal < 0 ? '#F8D7DA' : stats.netVal > 0 ? '#D4EDDA' : '#EEE', stats.netVal < 0 ? '#721C24' : stats.netVal > 0 ? '#155724' : '#6C757D'],
          ].map(([l, v, bg, c]) => (
            <div key={l} style={{ background: bg, borderRadius:8, padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color: c, fontFamily:'DM Mono,monospace' }}>{v}</div>
              <div style={{ fontSize:11, fontWeight:700, color: c, opacity:.75 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* PI Document header */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
          <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)', padding:'8px 16px' }}>
            <span style={{ color:'#fff', fontSize:13, fontWeight:700, fontFamily:'Syne,sans-serif' }}>
              PI Document — {piNo}
            </span>
          </div>
          <div style={{ padding:'12px 16px', background:'#fff', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }}>Count Date</label>
              <input type="date" style={inp} value={form.countDate} onChange={e => setForm(f => ({ ...f, countDate: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }}>Counted By</label>
              <input style={{ ...inp, background:'#F8F9FA' }} value={form.countedBy} readOnly />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }}>Remarks</label>
              <input style={inp} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="e.g. Year-end count" />
            </div>
          </div>
        </div>

        {/* Search + filter chips */}
        <div style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center' }}>
          <input placeholder="Search material..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, width:220 }} />
          {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'#999', cursor:'pointer', fontSize:16 }}>&#x2715;</button>}
          <div style={{ display:'flex', gap:6, marginLeft:8 }}>
            {['All','Match','Short','Surplus'].map(f => (
              <span key={f} onClick={() => setFilter(f)}
                style={{ padding:'4px 12px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:700, border:'1.5px solid', userSelect:'none',
                  borderColor: filter === f ? '#714B67' : '#E0D5E0',
                  background:  filter === f ? '#714B67' : '#fff',
                  color:        filter === f ? '#fff'    : '#6C757D' }}>
                {f}
              </span>
            ))}
          </div>
          <span style={{ marginLeft:'auto', fontSize:12, color:'#6C757D' }}>{displayed.length} of {rows.length} items</span>
        </div>

        {/* Count table */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['#','Material','Bin','UOM','System Qty','Counted Qty','Variance','Variance Value','Status'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:'#6C757D', textAlign: h === 'Variance' || h === 'Variance Value' || h === 'System Qty' || h === 'Counted Qty' ? 'right' : 'left', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding:30, textAlign:'center', color:'#6C757D' }}>Loading stock data...</td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding:30, textAlign:'center', color:'#6C757D' }}>No items found</td></tr>
                ) : displayed.map((r, i) => {
                  const diff  = (parseFloat(r.countedQty) || 0) - parseFloat(r.sysQty)
                  const val   = diff * parseFloat(r.rate || 0)
                  const isMatch   = diff === 0
                  const isShort   = diff < 0
                  const isSurplus = diff > 0
                  const rowBg = isMatch ? '#fff' : isShort ? '#FFF5F5' : '#F6FFF8'
                  const diffColor = isMatch ? '#155724' : isShort ? '#DC3545' : '#198754'
                  return (
                    <tr key={r.itemCode} style={{ borderBottom:'1px solid #F0EEF0', background: rowBg }}>
                      <td style={{ padding:'6px 10px', color:'#6C757D', fontWeight:700, textAlign:'center' }}>{i + 1}</td>
                      <td style={{ padding:'6px 10px' }}>
                        <div style={{ fontWeight:600 }}>{r.itemName}</div>
                        <div style={{ fontSize:10, color:'#714B67', fontFamily:'DM Mono,monospace' }}>{r.itemCode}</div>
                      </td>
                      <td style={{ padding:'6px 10px', fontFamily:'DM Mono,monospace', fontSize:11, color:'#6C757D' }}>{r.bin}</td>
                      <td style={{ padding:'6px 10px', textAlign:'center' }}>{r.uom}</td>
                      <td style={{ padding:'6px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700 }}>{r.sysQty}</td>
                      <td style={{ padding:'4px 6px', width:90 }}>
                        <input type="number" min={0}
                          style={{ ...inp, textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700,
                            background: isMatch ? '#F0FFF4' : isShort ? '#FFF5F5' : '#F0FFF4',
                            borderColor: isMatch ? '#C3E6CB' : isShort ? '#F5C6CB' : '#C3E6CB' }}
                          value={r.countedQty === '' ? '' : r.countedQty}
                          onChange={e => {
                            const idx = rows.findIndex(x => x.itemCode === r.itemCode)
                            updateCount(idx, e.target.value)
                          }} />
                      </td>
                      <td style={{ padding:'6px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, color: diffColor }}>
                        {isMatch ? '—' : (diff > 0 ? `+${diff}` : diff)}
                      </td>
                      <td style={{ padding:'6px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, color: diffColor }}>
                        {isMatch ? '—' : fmtCur(val)}
                      </td>
                      <td style={{ padding:'6px 10px' }}>
                        <span style={{
                          padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                          background: isMatch ? '#D4EDDA' : isShort ? '#F8D7DA' : '#FFF3CD',
                          color: isMatch ? '#155724' : isShort ? '#721C24' : '#856404'
                        }}>
                          {isMatch ? 'Match' : isShort ? 'Short' : 'Surplus'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Variance summary card */}
        {rows.length > 0 && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:14 }}>
            <div style={{ background:'#F8F9FA', border:'1px solid #E0D5E0', borderRadius:8, padding:'14px 20px', minWidth:280 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'#714B67', marginBottom:10, textTransform:'uppercase' }}>Variance Summary</div>
              {[
                ['Total Items Counted', stats.total, 'inherit'],
                ['Matched (No Diff)', stats.matched, '#155724'],
                ['Short Items', `${stats.short} · ${fmtCur(-stats.shortVal)}`, '#DC3545'],
                ['Surplus Items', `${stats.surplus} · ${fmtCur(stats.surplusVal)}`, '#198754'],
              ].map(([l, v, c]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:'#6C757D' }}>{l}:</span>
                  <strong style={{ color: c }}>{v}</strong>
                </div>
              ))}
              <div style={{ borderTop:'2px solid #E0D5E0', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:700 }}>Net Variance Value:</span>
                <strong style={{ color: stats.netVal < 0 ? '#DC3545' : stats.netVal > 0 ? '#198754' : '#155724', fontFamily:'DM Mono,monospace', fontSize:14 }}>
                  {fmtCur(stats.netVal)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
