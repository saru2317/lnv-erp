import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})

export default function FeeCollection() {
  const [admNo,    setAdmNo]    = useState('')
  const [student,  setStudent]  = useState(null)
  const [demands,  setDemands]  = useState([])
  const [selected, setSelected] = useState([])
  const [payMode,  setPayMode]  = useState('CASH')
  const [payRef,   setPayRef]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [receipt,  setReceipt]  = useState(null)
  const [todayTotal, setTodayTotal] = useState(0)

  useEffect(()=>{
    fetch(`${BASE}/edu/fee/today-total`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setTodayTotal(d.data?.total||0)).catch(()=>{})
  },[])

  const searchStudent = async () => {
    if (!admNo.trim()) return toast.error('Enter admission number')
    try {
      const r = await fetch(`${BASE}/edu/students?admissionNo=${admNo}`,{headers:hdr2()})
      const d = await r.json()
      if (!d.data?.[0]) return toast.error('Student not found')
      const s = d.data[0]
      setStudent(s)
      // Load pending demands
      const r2 = await fetch(`${BASE}/edu/fee/demands?studentId=${s.id}&status=PENDING`,{headers:hdr2()})
      const d2 = await r2.json()
      setDemands(d2.data||[])
      setSelected((d2.data||[]).map(d=>d.id))
    } catch { toast.error('Search failed') }
  }

  const totalSelected = demands.filter(d=>selected.includes(d.id)).reduce((s,d)=>s+Number(d.netAmount||0),0)

  const collect = async () => {
    if (!student) return toast.error('Search student first')
    if (selected.length === 0) return toast.error('Select at least one fee')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/edu/fee/collect`,{method:'POST',headers:hdr(),
        body:JSON.stringify({ studentId:student.id, demandIds:selected, paymentMode:payMode, transactionRef:payRef })})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Receipt ${d.data.receiptNo} generated!`)
      setReceipt(d.data)
      setTodayTotal(prev=>prev+totalSelected)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const inp = { padding:'8px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:13, outline:'none' }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>💵 Fee Collection</div>
        <div style={{background:'#E8F5E9',borderRadius:8,padding:'8px 16px',textAlign:'center'}}>
          <div style={{fontSize:11,color:'#888'}}>Today's Collection</div>
          <div style={{fontSize:18,fontWeight:800,color:'#1E8449'}}>{fmtC(todayTotal)}</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Left: Search */}
        <div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12}}>🔍 Find Student</div>
            <div style={{display:'flex',gap:8}}>
              <input value={admNo} onChange={e=>setAdmNo(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&searchStudent()}
                placeholder='Admission Number...'
                style={{...inp,flex:1}} />
              <button onClick={searchStudent}
                style={{padding:'8px 18px',background:'#6E2C00',color:'#fff',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:700}}>Search</button>
            </div>
          </div>

          {student && (
            <div style={{background:'#FDF2E9',border:'1px solid #6E2C00',borderRadius:8,padding:16,marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:800,color:'#6E2C00',marginBottom:10}}>👨‍🎓 {student.name}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12}}>
                {[
                  ['Adm. No', student.admissionNo],
                  ['Class',   `${student.section?.class?.className} — ${student.section?.sectionName}`],
                  ['Father',  student.fatherName||'—'],
                  ['Phone',   student.fatherPhone||student.motherPhone||'—'],
                ].map(([l,v])=>(
                  <div key={l}>
                    <span style={{color:'#888'}}>{l}: </span>
                    <span style={{fontWeight:700,color:'#333'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Mode */}
          {student && demands.length > 0 && (
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
              <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12}}>💳 Payment Mode</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                {['CASH','CHEQUE','UPI','ONLINE'].map(m=>(
                  <button key={m} onClick={()=>setPayMode(m)}
                    style={{padding:'10px',border:`2px solid ${payMode===m?'#6E2C00':'#ddd'}`,
                      borderRadius:7,cursor:'pointer',fontWeight:700,fontSize:13,
                      background:payMode===m?'#FDF2E9':'#fff',color:payMode===m?'#6E2C00':'#555'}}>
                    {m==='CASH'?'💵':m==='CHEQUE'?'📝':m==='UPI'?'📱':'🌐'} {m}
                  </button>
                ))}
              </div>
              {payMode !== 'CASH' && (
                <input value={payRef} onChange={e=>setPayRef(e.target.value)}
                  placeholder={payMode==='CHEQUE'?'Cheque Number':payMode==='UPI'?'UPI Reference':'Transaction ID'}
                  style={{...inp,width:'100%',boxSizing:'border-box'}} />
              )}
            </div>
          )}
        </div>

        {/* Right: Fee Demands */}
        <div>
          {demands.length > 0 ? (
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'#6E2C00',padding:'10px 16px',color:'#fff',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:700}}>📋 Pending Fees</div>
                <div style={{fontSize:12}}>Total: {fmtC(demands.reduce((s,d)=>s+Number(d.netAmount||0),0))}</div>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#FDF2E9'}}>
                  {['✓','Fee Type','Period','Amount','Concession','Net'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {demands.map((d,i)=>(
                    <tr key={d.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                      <td style={{padding:'8px 10px',textAlign:'center'}}>
                        <input type='checkbox' checked={selected.includes(d.id)}
                          onChange={e=>setSelected(prev=>e.target.checked?[...prev,d.id]:prev.filter(x=>x!==d.id))}
                          style={{width:14,height:14,accentColor:'#6E2C00'}} />
                      </td>
                      <td style={{padding:'8px 10px',fontWeight:600}}>{d.feeType?.feeName||'Fee'}</td>
                      <td style={{padding:'8px 10px',color:'#888',fontSize:11}}>
                        {d.month ? new Date(2026,d.month-1).toLocaleString('default',{month:'short'}) : 'Annual'}
                      </td>
                      <td style={{padding:'8px 10px'}}>{fmtC(d.amount)}</td>
                      <td style={{padding:'8px 10px',color:'#1E8449'}}>
                        {Number(d.concessionAmt)>0?`- ${fmtC(d.concessionAmt)}`:'—'}
                      </td>
                      <td style={{padding:'8px 10px',fontWeight:700,color:'#6E2C00'}}>{fmtC(d.netAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{padding:'12px 16px',background:'#F5F5F5',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:14,fontWeight:700,color:'#6E2C00'}}>
                  Selected: {fmtC(totalSelected)}
                </div>
                <button onClick={collect} disabled={saving||selected.length===0}
                  style={{padding:'10px 24px',background:'#1E8449',color:'#fff',border:'none',
                    borderRadius:6,cursor:'pointer',fontWeight:800,fontSize:14}}>
                  {saving?'⏳...':'💵 Collect & Print Receipt'}
                </button>
              </div>
            </div>
          ) : student ? (
            <div style={{padding:40,textAlign:'center',background:'#E8F5E9',borderRadius:8}}>
              <div style={{fontSize:40,marginBottom:12}}>✅</div>
              <div style={{fontSize:15,fontWeight:700,color:'#1E8449'}}>No Pending Fees!</div>
              <div style={{fontSize:12,color:'#888',marginTop:6}}>All fees cleared for this student</div>
            </div>
          ) : (
            <div style={{padding:60,textAlign:'center',background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
              <div style={{fontSize:48,marginBottom:12}}>💰</div>
              <div style={{fontSize:14,color:'#888'}}>Search student by admission number to collect fee</div>
            </div>
          )}

          {/* Receipt */}
          {receipt && (
            <div style={{marginTop:14,background:'#E8F5E9',border:'2px solid #1E8449',borderRadius:8,padding:16}}>
              <div style={{fontSize:15,fontWeight:800,color:'#1E8449',marginBottom:10}}>
                ✅ Receipt Generated — {receipt.receiptNo}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12}}>
                <div>Amount: <strong>{fmtC(receipt.totalPaid)}</strong></div>
                <div>Mode: <strong>{receipt.paymentMode}</strong></div>
                <div>Date: <strong>{new Date(receipt.paymentDate).toLocaleDateString('en-IN')}</strong></div>
                <div>Status: <strong style={{color:'#1E8449'}}>PAID ✅</strong></div>
              </div>
              <button onClick={()=>window.print()}
                style={{marginTop:10,padding:'7px 18px',background:'#6E2C00',color:'#fff',
                  border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
                🖨️ Print Receipt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
