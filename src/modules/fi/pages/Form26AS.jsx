import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const STATUS_CFG = {
  matched:       { label:'\u2713 Matched',       bg:'#D4EDDA', color:'#155724', desc:'Deposited — will reflect in vendor 26AS' },
  short_deposit: { label:'\u26A0 Short Deposit', bg:'#FFF3CD', color:'#856404', desc:'TDS deducted > deposited — deposit balance now' },
  pan_missing:   { label:'\u2717 PAN Missing',   bg:'#F8D7DA', color:'#721C24', desc:'Vendor PAN unknown — TDS @ 20%, credit blocked' },
  no_tds:        { label:'\u2014 No TDS',        bg:'#E2E3E5', color:'#383D41', desc:'No TDS applicable' },
  over_deposit:  { label:'\u21A5 Over Deposited',bg:'#D1ECF1', color:'#0C5460', desc:'Excess deposited — claim refund or adjust' },
}

export default function Form26AS() {
  const now = new Date()
  const [fy,      setFY]      = useState(now.getMonth()>=3 ? now.getFullYear() : now.getFullYear()-1)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/tds/26as?fy=${fy}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load 26AS data') }
    finally { setLoading(false) }
  }, [fy])

  useEffect(() => { load() }, [load])

  const rows = (data?.data||[]).filter(r => {
    const ms = search.toLowerCase()
    return (!ms || r.pan?.toLowerCase().includes(ms) || r.name?.toLowerCase().includes(ms)) &&
           (filter==='all' || r.status===filter)
  })

  const counts = Object.fromEntries(
    Object.keys(STATUS_CFG).map(k=>[k,(data?.data||[]).filter(r=>r.status===k).length])
  )

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Form 26AS Reconciliation
          <small> Your TDS Deductions vs IT Dept Credit · FY {fy}–{fy+1}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={fy} onChange={e=>setFY(parseInt(e.target.value))} style={{width:100}}>
            {[2023,2024,2025,2026].map(y=><option key={y} value={y}>FY {y}-{y+1}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm" onClick={()=>toast.success('Download vendor 26AS from TRACES: https://www.tdscpc.gov.in')}>
            TRACES Portal
          </button>
        </div>
      </div>

      {/* What 26AS means */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
        <div style={{background:'#EDE0EA',borderRadius:8,padding:14}}>
          <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:8}}>What is Form 26AS?</div>
          <div style={{fontSize:12,color:'#333',lineHeight:1.6}}>
            26AS is the <strong>Annual Tax Credit Statement</strong> from Income Tax department.
            It shows TDS credited against each vendor/deductee PAN for the financial year.
            Vendors use this to claim TDS credit when filing their ITR.
          </div>
        </div>
        <div style={{background:'#FFF3CD',borderRadius:8,padding:14,border:'1px solid #FFEEBA'}}>
          <div style={{fontWeight:700,fontSize:13,color:'#856404',marginBottom:8}}>Why Reconcile?</div>
          <div style={{fontSize:12,color:'#333',lineHeight:1.6}}>
            If your TDS is <strong>not deposited</strong> or <strong>wrong PAN</strong> is used,
            the credit won&apos;t appear in vendor&apos;s 26AS. Vendor will face tax demand.
            They will dispute → your vendor relationship suffers + IT notice risk.
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'purple', label:'Total Deductees',        val: data?.data?.length||0,          sub:`FY ${fy}–${fy+1}` },
          { cls:'red',    label:'Total TDS Deducted',     val: INR(data?.totalDeducted||0),    sub:'From vendor payments' },
          { cls:'green',  label:'Total TDS Deposited',    val: INR(data?.totalDeposited||0),   sub:'Challan to IT dept' },
          { cls:'orange', label:'Issues Found',           val: (data?.panMissing||0)+(data?.shortDeposit||0), sub:'PAN missing + short deposit' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Overall status bar */}
      {(data?.totalDeducted||0) > 0 && (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'12px 16px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:12}}>
            <span style={{fontWeight:700,color:'#714B67'}}>Deducted vs Deposited</span>
            <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,
              color:(data.totalDeducted-data.totalDeposited)>0?'#856404':'#155724'}}>
              Gap: {INR(Math.max(0,(data.totalDeducted||0)-(data.totalDeposited||0)))}
            </span>
          </div>
          <div style={{background:'#F0EEEB',borderRadius:4,height:12,overflow:'hidden',display:'flex'}}>
            <div style={{
              height:'100%',
              width:`${Math.min(100,((data?.totalDeposited||0)/(data?.totalDeducted||1))*100)}%`,
              background:'#28A745',borderRadius:'4px 0 0 4px',transition:'width .4s'
            }}/>
            <div style={{
              flex:1,background:'#FFC107',borderRadius:'0 4px 4px 0'
            }}/>
          </div>
          <div style={{display:'flex',gap:16,marginTop:6,fontSize:11}}>
            <span style={{color:'#155724',fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:10,height:10,borderRadius:2,background:'#28A745',display:'inline-block'}}/>
              Deposited: {INR(data?.totalDeposited||0)}
            </span>
            <span style={{color:'#856404',fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:10,height:10,borderRadius:2,background:'#FFC107',display:'inline-block'}}/>
              Pending: {INR(Math.max(0,(data?.totalDeducted||0)-(data?.totalDeposited||0)))}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <input className="sd-search" placeholder="Search PAN / name..."
          value={search} onChange={e=>setSearch(e.target.value)} style={{width:200}}/>
        {[['all','All'],...Object.entries(STATUS_CFG).map(([k,c])=>[k,c.label])].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{
            padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',
            border:`1px solid ${k!=='all'&&filter===k?STATUS_CFG[k]?.color||'#714B67':'#E0D5E0'}`,
            background:filter===k?'#714B67':'#fff', color:filter===k?'#fff':'#6C757D'
          }}>
            {l} {k!=='all'?`(${counts[k]||0})`:`(${data?.data?.length||0})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading 26AS reconciliation...</div>
      : rows.length === 0 ? (
        <div style={{padding:50,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          {(data?.data||[]).length === 0
            ? 'No TDS transactions for this year. Make vendor payments with TDS to see 26AS reconciliation.'
            : 'No records match filter.'}
        </div>
      ) : (
        <table className="fi-data-table">
          <thead><tr>
            <th>#</th>
            <th>Vendor PAN</th>
            <th>Vendor Name</th>
            <th style={{textAlign:'center'}}>Sections</th>
            <th style={{textAlign:'right'}}>TDS Deducted</th>
            <th style={{textAlign:'right'}}>TDS Deposited</th>
            <th style={{textAlign:'right'}}>Not Deposited</th>
            <th>Challans</th>
            <th style={{textAlign:'center'}}>26AS Status</th>
            <th>Remarks</th>
          </tr></thead>
          <tbody>
            {rows.map((r,i)=>{
              const sc = STATUS_CFG[r.status] || STATUS_CFG.no_tds
              return (
                <tr key={i}>
                  <td style={{color:'#6C757D',fontSize:11}}>{i+1}</td>
                  <td>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,
                      color:r.status==='pan_missing'?'#DC3545':'#333'}}>
                      {r.pan}
                    </span>
                    {r.status==='pan_missing'&&(
                      <div style={{fontSize:9,color:'#DC3545',fontWeight:700}}>
                        Update in Vendor Master!
                      </div>
                    )}
                  </td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.name}</td>
                  <td style={{textAlign:'center',fontSize:11,color:'#714B67',fontWeight:600}}>
                    {r.sections||'194C'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#DC3545'}}>
                    {INR(r.deducted)}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724'}}>
                    {r.deposited>0?INR(r.deposited):'—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',
                    fontWeight:r.notDeposited>0?800:400,
                    color:r.notDeposited>0?'#856404':'#6C757D'}}>
                    {r.notDeposited>0?INR(r.notDeposited):'—'}
                  </td>
                  <td style={{fontSize:11,color:'#6C757D'}}>
                    {r.challanNos?.length>0
                      ? r.challanNos.slice(0,2).join(', ')+(r.challanNos.length>2?'...':'')
                      : '—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:sc.bg,color:sc.color,padding:'2px 8px',
                      borderRadius:10,fontSize:10,fontWeight:700}}>
                      {sc.label}
                    </span>
                  </td>
                  <td style={{fontSize:11,color:'#6C757D',maxWidth:180}}>{sc.desc}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
              <td colSpan={4} style={{padding:'9px 12px',color:'#714B67'}}>
                TOTAL — {rows.length} deductees
              </td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#DC3545',fontSize:14,fontWeight:800}}>
                {INR(rows.reduce((a,r)=>a+r.deducted,0))}
              </td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724',fontWeight:700}}>
                {INR(rows.reduce((a,r)=>a+r.deposited,0))}
              </td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#856404',fontWeight:700}}>
                {INR(rows.reduce((a,r)=>a+r.notDeposited,0))}
              </td>
              <td colSpan={3}/>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Reconciliation guide */}
      <div style={{marginTop:14,padding:14,background:'#EDE0EA',borderRadius:8,fontSize:12,color:'#714B67'}}>
        <strong>How to fix 26AS mismatches:</strong>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:8}}>
          {[
            ['PAN Missing',       'Go to Vendor Master → add PAN → re-run TDS for that vendor. Wrong PAN = vendor blocked from credit.', '#F8D7DA','#721C24'],
            ['Short Deposit',     'Go to TDS Register → Deposit TDS → enter challan ITNS 281. Deposit before month end to avoid interest.', '#FFF3CD','#856404'],
            ['Credit Not Showing','Vendor checks 26AS after 7-10 days of deposit. If still missing, check challan BSR code and date on TRACES.', '#D1ECF1','#0C5460'],
          ].map(([t,d,bg,c])=>(
            <div key={t} style={{background:bg,borderRadius:6,padding:'10px 12px',border:`1px solid ${c}22`}}>
              <div style={{fontWeight:700,color:c,marginBottom:4,fontSize:12}}>{t}</div>
              <div style={{fontSize:11,color:'#495057',lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
