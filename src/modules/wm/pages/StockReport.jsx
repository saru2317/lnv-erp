// ════════════════════════════════════════════════════════════
export function StockReport() {
  const [stock,   setStock]   = useState([])
  const [movements,setMovements]=useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('This Month')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rS, rM] = await Promise.all([
        fetch(`${BASE_URL}/wm/stock`,    { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/movement`, { headers: hdr2() }),
      ])
      const [dS, dM] = await Promise.all([rS.json(), rM.json()])
      setStock(dS.data    || [])
      setMovements(dM.data || [])
    } catch { toast.error('Failed to load stock report') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Total stock value
  const totalValue = stock.reduce((a, s) => a + (parseFloat(s.balanceQty) * parseFloat(s.stdCost||0)), 0)
  const totalItems  = stock.filter(s => parseFloat(s.balanceQty) > 0).length
  const zeroStock   = stock.filter(s => parseFloat(s.balanceQty) <= 0).length

  // Category summary (from itemCode prefix)
  const catMap = {}
  stock.forEach(s => {
    const cat = s.category || s.itemCode?.slice(0,2) || 'Other'
    if (!catMap[cat]) catMap[cat] = { cat, items:0, qty:0, value:0 }
    catMap[cat].items++
    catMap[cat].qty   += parseFloat(s.balanceQty || 0)
    catMap[cat].value += parseFloat(s.balanceQty) * parseFloat(s.stdCost || 0)
  })
  const catSummary = Object.values(catMap).sort((a, b) => b.value - a.value)

  // Top 10 by value
  const topByValue = [...stock]
    .sort((a, b) => (parseFloat(b.balanceQty)*parseFloat(b.stdCost||0)) - (parseFloat(a.balanceQty)*parseFloat(a.stdCost||0)))
    .slice(0, 10)

  const fmt = v => v.toLocaleString('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:0})

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Stock Report <small>Inventory Analytics &amp; Valuation</small></div>
        <div className="lv-acts">
          <select className="sd-search" value={period} onChange={e=>setPeriod(e.target.value)} style={{width:140}}>
            {['This Month','Last 3 Months','All Time'].map(p=><option key={p}>{p}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export Excel</button>
          <button className="btn btn-s sd-bsm">Print Report</button>
        </div>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading stock report...</div>
      ) : (
        <>
          {/* KPI strip */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
            {[
              ['Total Stock Value', fmt(totalValue), '#EDE0EA','#714B67'],
              ['Active SKUs',       totalItems,       '#D4EDDA','#155724'],
              ['Zero Stock SKUs',   zeroStock,         '#FFF3CD','#856404'],
              ['Total Movements',   movements.length,  '#D1ECF1','#0C5460'],
            ].map(([l,v,bg,c])=>(
              <div key={l} style={{background:bg,borderRadius:8,padding:'12px 16px',textAlign:'center'}}>
                <div style={{fontSize:l==='Total Stock Value'?16:22,fontWeight:800,color:c,fontFamily:'DM Mono,monospace'}}>{v}</div>
                <div style={{fontSize:11,fontWeight:700,color:c,opacity:.8}}>{l}</div>
              </div>
            ))}
          </div>

          {stock.length === 0 ? (
            <div style={{padding:60,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'1px solid #E0D5E0'}}>
              <div style={{fontSize:48,marginBottom:12}}>📦</div>
              <div style={{fontWeight:700,fontSize:16,color:'#333'}}>No stock data available</div>
              <div style={{fontSize:12,marginTop:6}}>Post GRN receipts in the Warehouse module to start tracking inventory.</div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>

              {/* Category summary */}
              <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 14px'}}>
                  <span style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'}}>Category-wise Stock Value</span>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                    <th style={{padding:'7px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6C757D'}}>Category</th>
                    <th style={{padding:'7px 12px',textAlign:'center',fontSize:10,fontWeight:700,color:'#6C757D'}}>Items</th>
                    <th style={{padding:'7px 12px',textAlign:'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>Stock Value</th>
                    <th style={{padding:'7px 12px',textAlign:'center',fontSize:10,fontWeight:700,color:'#6C757D'}}>%</th>
                  </tr></thead>
                  <tbody>
                    {catSummary.map((c, i) => (
                      <tr key={c.cat} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                        <td style={{padding:'8px 12px',fontWeight:700}}>{c.cat}</td>
                        <td style={{padding:'8px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}>{c.items}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{fmt(c.value)}</td>
                        <td style={{padding:'8px 12px',textAlign:'center',fontSize:11}}>
                          {totalValue > 0 ? ((c.value/totalValue)*100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top 10 by value */}
              <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 14px'}}>
                  <span style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'}}>Top 10 Items by Value</span>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                    <th style={{padding:'7px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6C757D'}}>Material</th>
                    <th style={{padding:'7px 12px',textAlign:'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>Qty</th>
                    <th style={{padding:'7px 12px',textAlign:'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>Value</th>
                  </tr></thead>
                  <tbody>
                    {topByValue.map((s, i) => (
                      <tr key={s.itemCode} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                        <td style={{padding:'7px 12px'}}>
                          <div style={{fontWeight:600,fontSize:12}}>{s.itemName}</div>
                          <div style={{fontSize:10,color:'#714B67',fontFamily:'DM Mono,monospace'}}>{s.itemCode}</div>
                        </td>
                        <td style={{padding:'7px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{parseFloat(s.balanceQty).toFixed(2)} {s.uom}</td>
                        <td style={{padding:'7px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{fmt(parseFloat(s.balanceQty)*parseFloat(s.stdCost||0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Default exports for lazy loading
export default StockReport
