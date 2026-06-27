import React,{useState,useEffect}from 'react'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN')
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'

export default function FeeReport(){
  const [tab,setTab]=useState(0)
  const [transactions,setTransactions]=useState([])
  const [demands,setDemands]=useState([])
  const [loading,setLoading]=useState(true)
  const [dateFrom,setDateFrom]=useState(()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })
  const [dateTo,setDateTo]=useState(new Date().toISOString().slice(0,10))

  useEffect(()=>{
    setLoading(true)
    Promise.all([
      fetch(`${BASE}/edu/fee/transactions?from=${dateFrom}&to=${dateTo}`,{headers:hdr2()}).then(r=>r.json()),
      fetch(`${BASE}/edu/fee/demands?status=PENDING`,{headers:hdr2()}).then(r=>r.json()),
    ]).then(([tD,dD])=>{
      setTransactions(tD.data||[])
      setDemands(dD.data||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
  },[dateFrom,dateTo])

  const totalCollected=transactions.reduce((s,t)=>s+Number(t.totalPaid||0),0)
  const totalPending=demands.reduce((s,d)=>s+Number(d.balanceAmount||0),0)
  const byMode=transactions.reduce((acc,t)=>{acc[t.paymentMode]=(acc[t.paymentMode]||0)+Number(t.totalPaid||0);return acc},{})
  const inp={padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none'}

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📊 Fee Reports</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input type='date' value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inp}/>
          <span style={{color:'#888'}}>to</span>
          <input type='date' value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inp}/>
        </div>
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}}>
        {[
          ['💰 Total Collected',fmtC(totalCollected),'#1E8449'],
          ['⚠️ Total Pending',fmtC(totalPending),'#C0392B'],
          ['📋 Transactions',transactions.length,'#1A5276'],
          ['👨‍🎓 Defaulters',demands.filter(d=>d.status==='PENDING').length,'#B8860B'],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',border:`1px solid ${c}22`,borderRadius:8,padding:'12px 16px',borderLeft:`4px solid ${c}`}}>
            <div style={{fontSize:11,color:'#888'}}>{l}</div>
            <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Payment Mode Summary */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12}}>💳 Collection by Payment Mode</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {['CASH','UPI','CHEQUE','ONLINE'].map(mode=>{
            const amt=byMode[mode]||0
            const pct=totalCollected>0?(amt/totalCollected*100).toFixed(0):0
            return(
              <div key={mode} style={{textAlign:'center',background:'#F8F5F8',borderRadius:8,padding:'12px 8px'}}>
                <div style={{fontSize:20,marginBottom:4}}>{mode==='CASH'?'💵':mode==='UPI'?'📱':mode==='CHEQUE'?'📝':'🌐'}</div>
                <div style={{fontSize:11,color:'#888',marginBottom:4}}>{mode}</div>
                <div style={{fontSize:16,fontWeight:700,color:'#6E2C00'}}>{fmtC(amt)}</div>
                <div style={{fontSize:10,color:'#aaa'}}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,
        padding:4,marginBottom:12,width:'fit-content'}}>
        {['💰 Collections','⚠️ Defaulters'].map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            style={{padding:'7px 16px',border:'none',borderRadius:6,cursor:'pointer',
              fontWeight:700,fontSize:12,background:tab===i?'#6E2C00':'transparent',color:tab===i?'#fff':'#888'}}>
            {t}
          </button>
        ))}
      </div>

      {/* Collections Table */}
      {tab===0&&(
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
          {loading?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>:
          transactions.length===0?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>No transactions in this period</div>:
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{background:'#6E2C00',color:'#fff'}}>
              {['Receipt No','Student','Amount','Mode','Date'].map(h=>(
                <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:600}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {transactions.map((t,i)=>(
                <tr key={t.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                  <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:10,color:'#6E2C00',fontWeight:700}}>{t.receiptNo}</td>
                  <td style={{padding:'8px 12px',fontWeight:600}}>{t.student?.name||'—'}</td>
                  <td style={{padding:'8px 12px',fontWeight:700,color:'#1E8449'}}>{fmtC(t.totalPaid)}</td>
                  <td style={{padding:'8px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:'#EBF5FB',color:'#1A5276'}}>{t.paymentMode}</span></td>
                  <td style={{padding:'8px 12px',fontSize:11,color:'#888'}}>{fmtD(t.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr style={{background:'#6E2C00',color:'#fff'}}>
              <td colSpan={2} style={{padding:'9px 12px',fontWeight:700}}>TOTAL ({transactions.length} receipts)</td>
              <td style={{padding:'9px 12px',fontWeight:800,fontSize:14}}>{fmtC(totalCollected)}</td>
              <td colSpan={2}/>
            </tr></tfoot>
          </table>}
        </div>
      )}

      {/* Defaulters */}
      {tab===1&&(
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
          {loading?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>:
          demands.length===0?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>No pending fees! 🎉</div>:
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{background:'#C0392B',color:'#fff'}}>
              {['Student','Fee Type','Due Date','Amount','Balance','Days Overdue'].map(h=>(
                <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:600}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {demands.map((d,i)=>{
                const daysOverdue=Math.max(0,Math.floor((new Date()-new Date(d.dueDate))/86400000))
                return(
                  <tr key={d.id} style={{background:daysOverdue>30?'#FFF0F0':i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                    <td style={{padding:'8px 12px',fontWeight:700}}>{d.student?.name||'—'}</td>
                    <td style={{padding:'8px 12px',fontSize:11,color:'#555'}}>{d.feeType?.feeName||'—'}</td>
                    <td style={{padding:'8px 12px',fontSize:11,color:'#C0392B'}}>{fmtD(d.dueDate)}</td>
                    <td style={{padding:'8px 12px'}}>{fmtC(d.amount)}</td>
                    <td style={{padding:'8px 12px',fontWeight:700,color:'#C0392B'}}>{fmtC(d.balanceAmount)}</td>
                    <td style={{padding:'8px 12px',textAlign:'center'}}>
                      <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:daysOverdue>30?'#FDEDEC':daysOverdue>7?'#FEF9E7':'#F5F5F5',
                        color:daysOverdue>30?'#C0392B':daysOverdue>7?'#B8860B':'#666'}}>
                        {daysOverdue>0?`${daysOverdue} days`:'Due today'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>}
        </div>
      )}
    </div>
  )
}
