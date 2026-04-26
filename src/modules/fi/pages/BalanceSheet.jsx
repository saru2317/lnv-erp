import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })

export default function BalanceSheet() {
  const [bs,      setBS]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [asOf,    setAsOf]    = useState(new Date().toISOString().split('T')[0])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/bs?asOf=${asOf}`, { headers: hdr2() })
      const data = await res.json()
      setBS(data.data)
    } catch { toast.error('Failed to load Balance Sheet') }
    finally { setLoading(false) }
  }, [asOf])
  useEffect(() => { load() }, [load])

  const [open, setOpen] = useState({ ca:true, fa:true, cl:true, lt:true, eq:true })
  const tog = k => setOpen(p=>({...p,[k]:!p[k]}))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Balance Sheet <small>Financial Position</small></div>
        <div className="fi-lv-actions">
          <span style={{fontSize:12,color:'#6C757D'}}>As of:</span>
          <input type="date" className="sd-search" value={asOf} onChange={e=>setAsOf(e.target.value)} style={{width:160}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-s sd-bsm">Print</button>
        </div>
      </div>

      {loading ? <div style={{padding:30,textAlign:'center'}}>Loading Balance Sheet...</div>
      : bs && (
        <div>
          <div style={{background:bs.balanced?'#D4EDDA':'#F8D7DA',border:`1px solid ${bs.balanced?'#C3E6CB':'#F5C6CB'}`,borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:13,fontWeight:700,color:bs.balanced?'#155724':'#721C24',display:'flex',justifyContent:'space-between'}}>
            <span>{bs.balanced?'✓ Balance Sheet BALANCED — Assets = Liabilities + Equity':'⚠ NOT BALANCED'}</span>
            <span>Total: {INR(bs.totalAssets)}</span>
          </div>

          <div className="fi-panel-eq">
            {/* ASSETS */}
            <div className="fin-report">
              <div className="fin-report-hdr"><h2>ASSETS</h2><span>As on {asOf}</span></div>
              <div className="fin-section">
                <div className="fin-sec-title" onClick={()=>tog('ca')}>{open.ca?'▾':'►'} CURRENT ASSETS</div>
                {open.ca && bs.assets.filter(a=>a.subType==='Current Asset').map(a=>(
                  <div key={a.code} className="fin-row"><span className="fn">{a.name}</span><span className="fv">{INR(a.balance)}</span></div>
                ))}
              </div>
              <div className="fin-section">
                <div className="fin-sec-title" onClick={()=>tog('fa')}>{open.fa?'▾':'►'} FIXED ASSETS</div>
                {open.fa && bs.assets.filter(a=>a.subType==='Fixed Asset').map(a=>(
                  <div key={a.code} className="fin-row"><span className="fn">{a.name}</span><span className="fv">{INR(a.balance)}</span></div>
                ))}
              </div>
              <div className="fin-row total"><span className="fn">TOTAL ASSETS</span><span className="fv pos">{INR(bs.totalAssets)}</span></div>
            </div>

            {/* LIABILITIES + EQUITY */}
            <div className="fin-report">
              <div className="fin-report-hdr"><h2>LIABILITIES &amp; EQUITY</h2><span>As on {asOf}</span></div>
              <div className="fin-section">
                <div className="fin-sec-title" onClick={()=>tog('cl')}>{open.cl?'▾':'►'} CURRENT LIABILITIES</div>
                {open.cl && bs.liabilities.filter(a=>a.subType==='Current Liability').map(a=>(
                  <div key={a.code} className="fin-row"><span className="fn">{a.name}</span><span className="fv">{INR(a.balance)}</span></div>
                ))}
              </div>
              <div className="fin-section">
                <div className="fin-sec-title" onClick={()=>tog('lt')}>{open.lt?'▾':'►'} LONG TERM LIABILITIES</div>
                {open.lt && bs.liabilities.filter(a=>a.subType==='Long Term').map(a=>(
                  <div key={a.code} className="fin-row"><span className="fn">{a.name}</span><span className="fv">{INR(a.balance)}</span></div>
                ))}
              </div>
              <div className="fin-section">
                <div className="fin-sec-title" onClick={()=>tog('eq')}>{open.eq?'▾':'►'} EQUITY</div>
                {open.eq && bs.equity.map(a=>(
                  <div key={a.code} className="fin-row"><span className="fn">{a.name}</span><span className="fv">{INR(a.balance)}</span></div>
                ))}
                <div className="fin-row"><span className="fn">Current Year Profit / (Loss)</span><span className={`fv ${bs.retainedProfit>=0?'pos':'neg'}`}>{INR(bs.retainedProfit)}</span></div>
              </div>
              <div className="fin-row total"><span className="fn">TOTAL LIABILITIES + EQUITY</span><span className="fv pos">{INR(bs.totalLiabilities + bs.totalEquity)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

