import React, { useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

export default function CompetitorAnalysis() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState('winloss') // winloss | price | reasons

  useEffect(() => {
    fetch(`${BASE_URL}/crm/competitors/analysis`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setData(d.data||d)).catch(()=>{})
      .finally(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading analysis...</div>
  if (!data)   return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>No competitor data yet</div>

  const comps    = data.competitors || []
  const dealComps= data.dealCompetitors || []

  // Group by competitor for analysis
  const byComp = {}
  dealComps.forEach(dc => {
    if (!byComp[dc.competitorName]) byComp[dc.competitorName] = { name:dc.competitorName, won:0, lost:0, total:0, priceDiffs:[], loseReasons:{}, winReasons:{} }
    const c = byComp[dc.competitorName]
    c.total++
    if (dc.result==='WON')  c.won++
    if (dc.result==='LOST') c.lost++
    if (dc.ourPrice&&dc.theirPrice) c.priceDiffs.push(parseFloat(dc.ourPrice)-parseFloat(dc.theirPrice))
    if (dc.loseReason) c.loseReasons[dc.loseReason] = (c.loseReasons[dc.loseReason]||0)+1
    if (dc.winReason)  c.winReasons[dc.winReason]   = (c.winReasons[dc.winReason]||0)+1
  })

  const analysis = Object.values(byComp).map(c=>({
    ...c,
    winRate:    c.total>0 ? Math.round(c.won/c.total*100) : 0,
    avgPriceDiff: c.priceDiffs.length>0 ? c.priceDiffs.reduce((a,v)=>a+v,0)/c.priceDiffs.length : null,
    topLoseReason: Object.entries(c.loseReasons).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—',
    topWinReason:  Object.entries(c.winReasons).sort((a,b)=>b[1]-a[1])[0]?.[0]  || '—',
  })).sort((a,b)=>b.total-a.total)

  // Overall lose reasons
  const allLoseReasons = {}
  dealComps.filter(d=>d.result==='LOST').forEach(d=>{ if(d.loseReason) allLoseReasons[d.loseReason]=(allLoseReasons[d.loseReason]||0)+1 })
  const loseReasonRows = Object.entries(allLoseReasons).sort((a,b)=>b[1]-a[1])

  const winColor = r => r>=60?'#155724':r>=40?'#856404':'#721C24'
  const winBg    = r => r>=60?'#D4EDDA':r>=40?'#FFF3CD':'#F8D7DA'

  return (
    <div>
      <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67',marginBottom:14}}>
        Competitor Analysis
        <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>
          {dealComps.length} competitive deals tracked
        </small>
      </div>

      {/* View tabs */}
      <div style={{display:'flex',gap:4,marginBottom:16,padding:'5px 8px',background:'#F0EEEB',borderRadius:8}}>
        {[['winloss','Win/Loss'],['price','Price Gap'],['reasons','Why We Lose']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{
            padding:'6px 16px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
            background:view===k?'#714B67':'transparent',color:view===k?'#fff':'#6C757D'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Win/Loss view */}
      {view==='winloss'&&(
        analysis.length===0 ? (
          <div style={{padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
            <div style={{fontSize:28,marginBottom:8}}>🎯</div>
            <div style={{fontWeight:700}}>No competitive deal data yet</div>
            <div style={{fontSize:12,marginTop:4}}>Add competitors to leads to see win/loss analysis here</div>
          </div>
        ) : (
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
                  {['Competitor','Total','Won','Lost','Win Rate','Avg Price Gap','Top Win Reason','Top Lose Reason'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:'#714B67'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.map((a,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                    <td style={{padding:'10px 12px',fontWeight:700,fontSize:13}}>{a.name}</td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontWeight:700}}>{a.total}</td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{a.won}</td>
                    <td style={{padding:'10px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#721C24'}}>{a.lost}</td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:80,background:'#F8D7DA',borderRadius:4,height:8,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${a.winRate}%`,background:'#155724',borderRadius:4}}/>
                        </div>
                        <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,
                          color:winColor(a.winRate),minWidth:36}}>{a.winRate}%</span>
                      </div>
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      {a.avgPriceDiff!==null?(
                        <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,
                          color:a.avgPriceDiff>0?'#721C24':'#155724'}}>
                          {a.avgPriceDiff>0?'+':''}{INR(a.avgPriceDiff)}
                          <span style={{fontSize:10,marginLeft:4}}>{a.avgPriceDiff>0?'(We\'re higher)':'(We\'re lower)'}</span>
                        </span>
                      ):'—'}
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#155724',fontWeight:600}}>{a.topWinReason}</td>
                    <td style={{padding:'10px 12px',fontSize:11,color:'#721C24',fontWeight:600}}>{a.topLoseReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Price gap view */}
      {view==='price'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {analysis.filter(a=>a.avgPriceDiff!==null).map((a,i)=>{
            const diff = a.avgPriceDiff
            const isExpensive = diff > 0
            return (
              <div key={i} style={{background:'#fff',border:`2px solid ${isExpensive?'#F5C6CB':'#C3E6CB'}`,
                borderRadius:10,padding:16}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{a.name}</div>
                <div style={{fontSize:11,color:'#6C757D',marginBottom:12}}>{a.total} deals compared</div>

                <div style={{textAlign:'center',padding:16,background:isExpensive?'#F8D7DA':'#D4EDDA',borderRadius:8,marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:isExpensive?'#721C24':'#155724',textTransform:'uppercase',marginBottom:4}}>
                    On average we are
                  </div>
                  <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:24,
                    color:isExpensive?'#721C24':'#155724'}}>
                    {isExpensive?'+':''}{INR(Math.abs(diff))}
                  </div>
                  <div style={{fontSize:12,color:isExpensive?'#721C24':'#155724',fontWeight:600}}>
                    {isExpensive?'MORE expensive':'CHEAPER'} than {a.name}
                  </div>
                </div>

                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'#6C757D'}}>Win rate vs them:</span>
                  <span style={{fontWeight:800,color:winColor(a.winRate)}}>{a.winRate}%</span>
                </div>
              </div>
            )
          })}
          {analysis.filter(a=>a.avgPriceDiff!==null).length===0&&(
            <div style={{gridColumn:'1/-1',padding:40,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
              Add price data when tracking competitors on deals to see price gap analysis
            </div>
          )}
        </div>
      )}

      {/* Why we lose view */}
      {view==='reasons'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,color:'#721C24',marginBottom:14}}>
              Top Reasons We LOSE Deals
            </div>
            {loseReasonRows.length===0 ? (
              <div style={{color:'#6C757D',fontSize:12,textAlign:'center',padding:20}}>No lose data yet</div>
            ) : loseReasonRows.map(([reason, count],i)=>{
              const max = loseReasonRows[0][1]
              const pct = Math.round(count/max*100)
              return (
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                    <span style={{fontWeight:600,color:'#333'}}>{reason}</span>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#721C24'}}>{count}x</span>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:4,height:8,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:'#721C24',borderRadius:4}}/>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:10,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,color:'#155724',marginBottom:14}}>
              Top Reasons We WIN Deals
            </div>
            {(() => {
              const allWin = {}
              dealComps.filter(d=>d.result==='WON').forEach(d=>{ if(d.winReason) allWin[d.winReason]=(allWin[d.winReason]||0)+1 })
              const rows = Object.entries(allWin).sort((a,b)=>b[1]-a[1])
              const max  = rows[0]?.[1] || 1
              return rows.length===0 ? (
                <div style={{color:'#6C757D',fontSize:12,textAlign:'center',padding:20}}>No win data yet</div>
              ) : rows.map(([reason,count],i)=>(
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                    <span style={{fontWeight:600,color:'#333'}}>{reason}</span>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{count}x</span>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:4,height:8,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.round(count/max*100)}%`,background:'#155724',borderRadius:4}}/>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
