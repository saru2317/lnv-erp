import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const SEC_COLOR = {
  '192B':'#714B67','194C':'#E06F39','194J':'#0C5460',
  '194H':'#856404','194I':'#004085','194IA':'#155724','194A':'#383D41','194Q':'#4B2E83',
}
const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function TDSRegister() {
  const now = new Date()
  const [month,        setMonth]        = useState(now.getMonth()+1)
  const [year,         setYear]         = useState(now.getFullYear())
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [secFilter,    setSecFilter]    = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [depositModal, setDepositModal] = useState(false)
  const [challanNo,    setChallanNo]    = useState('')
  const [bsrCode,      setBsrCode]      = useState('')
  const [depositDate,  setDepositDate]  = useState(new Date().toISOString().split('T')[0])
  const [depositing,   setDepositing]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/tds/register?month=${month}&year=${year}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const rows     = data?.data || []
  const filtered = rows.filter(r =>
    (secFilter==='all'    || r.section===secFilter) &&
    (statusFilter==='all' || r.status===statusFilter)
  )

  const dueDate  = new Date(year, month, 7)
  const isOverdue = new Date() > dueDate && (data?.toDeposit||0) > 0

  const deposit = async () => {
    if (!challanNo || !bsrCode) return toast.error('Challan No and BSR code required')
    setDepositing(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/tds/deposit`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          jeNos:      rows.filter(r=>r.status==='to_deposit').map(r=>r.jeNo).filter(Boolean),
          challanNo, bsrCode, depositDate, amount: data.toDeposit,
        })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      setDepositModal(false); setChallanNo(''); setBsrCode(''); load()
    } catch (e) { toast.error(e.message) }
    finally { setDepositing(false) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">TDS Register
          <small> Tax Deducted at Source · {MONTHS[month]} {year}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm" onClick={()=>window.open('/fi/tds/26q','_self')}>Form 26Q</button>
          <button className="btn btn-p sd-bsm" disabled={!data?.toDeposit} onClick={()=>setDepositModal(true)}>
            Deposit TDS
          </button>
        </div>
      </div>

      {data?.toDeposit > 0 && (
        <div className={`fi-alert ${isOverdue?'err':'warn'}`} style={{marginBottom:14}}>
          {isOverdue
            ? `OVERDUE: TDS ${INR(data.toDeposit)} was due by 7th. Interest @ 1.5%/month applicable.`
            : `TDS ${INR(data.toDeposit)} must be deposited by 7 ${MONTHS[month===12?1:month+1]}. Late = 1.5%/month interest.`}
        </div>
      )}

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'red',    label:'TDS to Deposit',    val:INR(data?.toDeposit||0),  sub:`${rows.filter(r=>r.status==='to_deposit').length} entries` },
          { cls:'green',  label:'TDS Deposited',     val:INR(data?.deposited||0),  sub:`${rows.filter(r=>r.status==='deposited').length} challans` },
          { cls:'purple', label:'Total TDS (Month)', val:INR(data?.totalTDS||0),   sub:'All sections' },
          { cls:'orange', label:'Active Sections',   val:data?.bySection?.length||0, sub:'This month' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Section chips */}
      {(data?.bySection||[]).length > 0 && (
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
          <div onClick={()=>setSecFilter('all')} style={{
            padding:'7px 12px',borderRadius:8,cursor:'pointer',
            border:`2px solid ${secFilter==='all'?'#714B67':'#E0D5E0'}`,
            background:secFilter==='all'?'#EDE0EA':'#fff',fontSize:12,fontWeight:700,color:'#714B67'
          }}>All Sections</div>
          {data.bySection.map(s=>(
            <div key={s.section} onClick={()=>setSecFilter(secFilter===s.section?'all':s.section)}
              style={{padding:'7px 12px',borderRadius:8,cursor:'pointer',transition:'all .15s',
                border:`2px solid ${secFilter===s.section?SEC_COLOR[s.section]||'#714B67':'#E0D5E0'}`,
                background:secFilter===s.section?(SEC_COLOR[s.section]||'#714B67')+'22':'#fff'}}>
              <div style={{fontSize:11,fontWeight:800,color:SEC_COLOR[s.section]||'#714B67'}}>{s.section}</div>
              <div style={{fontSize:12,fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(s.tds)}</div>
              <div style={{fontSize:10,color:'#6C757D'}}>{s.name} · {s.count}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',gap:6,marginBottom:12}}>
        {[['all','All'],['to_deposit','To Deposit'],['deposited','Deposited']].map(([k,l])=>(
          <button key={k} onClick={()=>setStatusFilter(k)} style={{
            padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:'1px solid #E0D5E0',background:statusFilter===k?'#714B67':'#fff',
            color:statusFilter===k?'#fff':'#6C757D'
          }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading TDS Register...</div>
      : filtered.length === 0 ? (
        <div style={{padding:50,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          {rows.length===0
            ? 'No TDS this month. TDS auto-posts when vendor payments include TDS deduction.'
            : 'No entries match filter.'}
        </div>
      ) : (
        <table className="fi-data-table">
          <thead><tr>
            <th>JV / Ref</th><th>Date</th><th>Party Name</th>
            <th>PAN</th><th style={{textAlign:'center'}}>Section</th><th style={{textAlign:'center'}}>Rate</th>
            <th style={{textAlign:'right'}}>Gross</th>
            <th style={{textAlign:'right'}}>TDS</th>
            <th style={{textAlign:'right'}}>Net Paid</th>
            <th style={{textAlign:'center'}}>Status</th>
          </tr></thead>
          <tbody>
            {filtered.map((r,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:700}}>{r.jeNo||'—'}</td>
                <td style={{fontSize:11}}>{r.date?new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                <td style={{fontWeight:600,fontSize:12}}>{r.party}</td>
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:11,
                    color:(!r.pan||r.pan==='—'||r.pan==='PANNOTAVBL')?'#DC3545':'#333',
                    fontWeight:(!r.pan||r.pan==='—'||r.pan==='PANNOTAVBL')?700:400}}>
                    {r.pan||'MISSING'}
                  </span>
                  {(!r.pan||r.pan==='—'||r.pan==='PANNOTAVBL')&&(
                    <div style={{fontSize:9,color:'#DC3545',fontWeight:700}}>TDS @ 20% applies!</div>
                  )}
                </td>
                <td style={{textAlign:'center'}}>
                  <span style={{background:(SEC_COLOR[r.section]||'#714B67')+'22',
                    color:SEC_COLOR[r.section]||'#714B67',
                    padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                    {r.section}
                  </span>
                </td>
                <td style={{textAlign:'center',fontSize:11,color:'#6C757D'}}>{r.rate}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{INR(r.grossAmt)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13,color:'#DC3545'}}>{INR(r.tdsAmt)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{INR(r.netAmt)}</td>
                <td style={{textAlign:'center'}}>
                  {r.status==='deposited'
                    ? <div>
                        <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>Deposited</span>
                        {r.challanNo&&<div style={{fontSize:9,color:'#155724',marginTop:1}}>{r.challanNo}</div>}
                      </div>
                    : <span style={{background:'#FFF3CD',color:'#856404',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>To Deposit</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
              <td colSpan={6} style={{padding:'9px 12px',color:'#714B67'}}>TOTAL — {filtered.length} entries</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(filtered.reduce((a,r)=>a+r.grossAmt,0))}</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14,color:'#DC3545',fontWeight:800}}>{INR(filtered.reduce((a,r)=>a+r.tdsAmt,0))}</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(filtered.reduce((a,r)=>a+r.netAmt,0))}</td>
              <td/>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Deposit Modal */}
      {depositModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:460,boxShadow:'0 8px 32px rgba(0,0,0,.2)'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67',marginBottom:4}}>Deposit TDS to Income Tax</div>
            <div style={{fontSize:13,color:'#6C757D',marginBottom:14}}>
              Amount: <strong style={{color:'#DC3545',fontSize:16}}>{INR(data?.toDeposit||0)}</strong>
            </div>
            <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,padding:'8px 12px',marginBottom:14,fontSize:11,color:'#856404'}}>
              JV posted: Dr 2300 TDS Payable → Cr 1200 Bank
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={lbl}>Challan No (ITNS 281) *</label>
                <input style={inp} value={challanNo} onChange={e=>setChallanNo(e.target.value)} placeholder="00123456"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
              <div>
                <label style={lbl}>BSR Code *</label>
                <input style={inp} value={bsrCode} onChange={e=>setBsrCode(e.target.value)} placeholder="0000001"
                  onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={lbl}>Deposit Date</label>
                <input type="date" style={inp} value={depositDate} onChange={e=>setDepositDate(e.target.value)}/>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-p sd-bsm" disabled={depositing} onClick={deposit}>
                {depositing?'Posting...':`Deposit ${INR(data?.toDeposit||0)}`}
              </button>
              <button className="btn btn-s sd-bsm" onClick={()=>setDepositModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
