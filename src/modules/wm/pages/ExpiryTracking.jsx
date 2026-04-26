// ════════════════════════════════════════════════════════════
export function ExpiryTracking() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/grn`, { headers: hdr2() })
      const data = await res.json()
      const grns = data.data || []

      // Extract all GRN lines with expiry dates
      const batches = []
      grns.forEach(g => {
        ;(g.lines || []).forEach(l => {
          if (!l.expiryDate) return
          const expDate = new Date(l.expiryDate)
          const today   = new Date()
          const diffMs  = expDate - today
          const days    = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          batches.push({
            id:       `${g.id}-${l.id}`,
            batchNo:  l.batchNo || g.grnNo,
            itemName: l.itemName || l.description,
            itemCode: l.itemCode,
            qty:      parseFloat(l.acceptedQty || l.receivedQty || 0),
            uom:      l.unit || 'Nos',
            bin:      l.storageLocation || '—',
            mfgDate:  l.mfgDate ? new Date(l.mfgDate).toLocaleDateString('en-IN') : '—',
            expDate:  expDate.toLocaleDateString('en-IN'),
            days,
            status:   days < 0 ? 'Expired' : days <= 7 ? 'Critical' : days <= 30 ? 'Expiring Soon' : 'OK',
          })
        })
      })

      // Sort by days ascending (most urgent first)
      batches.sort((a, b) => a.days - b.days)
      setBatches(batches)
    } catch { toast.error('Failed to load expiry data') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const STATUS_STYLE = {
    'Expired':      ['#F8D7DA','#721C24'],
    'Critical':     ['#F8D7DA','#721C24'],
    'Expiring Soon':['#FFF3CD','#856404'],
    'OK':           ['#D4EDDA','#155724'],
  }

  const shown = batches.filter(b => filter === 'All' || b.status === filter)
  const expiredCnt = batches.filter(b=>b.status==='Expired').length
  const critCnt    = batches.filter(b=>b.status==='Critical').length
  const soonCnt    = batches.filter(b=>b.status==='Expiring Soon').length

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Expiry Tracking <small>Batch Expiry Monitor (MB5M)</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {(expiredCnt + critCnt + soonCnt) > 0 && (
        <div className="wm-alert warn">
          ⚠ {expiredCnt > 0 ? `${expiredCnt} batch(es) EXPIRED — Dispose immediately.` : ''}{' '}
          {critCnt > 0 ? `${critCnt} batch(es) expiring within 7 days.` : ''}{' '}
          {soonCnt > 0 ? `${soonCnt} batch(es) expiring within 30 days.` : ''}
        </div>
      )}

      <div className="pp-chips">
        {['All','Expired','Critical','Expiring Soon','OK'].map(f=>(
          <div key={f} className={`pp-chip${filter===f?' on':''}`} onClick={()=>setFilter(f)}>
            {f} <span>{f==='All'?batches.length:batches.filter(b=>b.status===f).length}</span>
          </div>
        ))}
      </div>

      <table className="wm-data-table">
        <thead><tr>
          <th>Batch No.</th><th>Material</th><th>Qty</th><th>Bin</th>
          <th>Mfg Date</th><th>Expiry Date</th><th>Days Left</th><th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>
          {loading
            ? <tr><td colSpan={9} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
            : shown.length === 0
            ? <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                {batches.length === 0
                  ? 'No batches with expiry dates. Add expiry dates when receiving GRNs.'
                  : `No batches with status: ${filter}`
                }
              </td></tr>
            : shown.map((b, i) => {
              const [bg, tx] = STATUS_STYLE[b.status] || ['#EEE','#333']
              return (
                <tr key={b.id} style={{borderBottom:'1px solid #F0EEF0',background:b.status==='Expired'||b.status==='Critical'?'#FFF9F9':i%2===0?'#fff':'#FDFBFD'}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{b.batchNo}</td>
                  <td style={{fontWeight:600}}>{b.itemName}<br/><span style={{fontSize:10,color:'#714B67',fontFamily:'DM Mono,monospace'}}>{b.itemCode}</span></td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>{b.qty} {b.uom}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{b.bin}</td>
                  <td style={{fontSize:11}}>{b.mfgDate}</td>
                  <td style={{fontSize:11,fontWeight:600}}>{b.expDate}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:800,color:b.days<0?'#DC3545':b.days<=7?'#DC3545':b.days<=30?'#856404':'#155724'}}>
                    {b.days < 0 ? `${Math.abs(b.days)}d ago` : `${b.days}d`}
                  </td>
                  <td><span style={{background:bg,color:tx,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>{b.status}</span></td>
                  <td>
                    {(b.status==='Expired'||b.status==='Critical') && (
                      <button className="btn-xs" style={{background:'#DC3545',color:'#fff',border:'none'}}>Dispose</button>
                    )}
                    {b.status==='Expiring Soon' && (
                      <button className="btn-xs pri">Priority Use</button>
                    )}
                  </td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// StockReport.jsx — real aggregated stock analytics
// ════════════════════════════════════════════════════════════
export default ExpiryTracking
