import React,{useState,useEffect,useCallback}from 'react'
import {useNavigate}from 'react-router-dom'

const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})
const fmtC0=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const fmtT=d=>d?new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'

const MONTHS=[['','All Months'],['01','January'],['02','February'],['03','March'],
  ['04','April'],['05','May'],['06','June'],['07','July'],['08','August'],
  ['09','September'],['10','October'],['11','November'],['12','December']]
const YEARS=Array.from({length:3},(_,i)=>String(new Date().getFullYear()-i))

export default function POSSales(){
  const nav=useNavigate()
  const [sales,    setSales]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [month,    setMonth]    = useState(()=>String(new Date().getMonth()+1).padStart(2,'0'))
  const [year,     setYear]     = useState(()=>String(new Date().getFullYear()))
  const [payMode,  setPayMode]  = useState('')

  const company = JSON.parse(localStorage.getItem('lnv_company')||'{}')

  const load=useCallback(async()=>{
    setLoading(true)
    try{
      const params=new URLSearchParams()
      params.set('soRef','COUNTER-SALE')
      if(month)params.set('month',month)
      if(year) params.set('year',year)
      if(search)params.set('search',search)
      const r=await fetch(`${BASE}/sd/invoices?${params}`,{headers:hdr2()})
      const d=await r.json()
      setSales(d.data||[])
    }catch{}finally{setLoading(false)}
  },[month,year,search])

  useEffect(()=>{load()},[load])

  // Filter by payment mode client-side
  const filtered=sales.filter(s=>
    !payMode || (s.paymentMode||'CASH')===payMode
  )

  // KPIs
  const totalSales   = filtered.reduce((s,i)=>s+Number(i.grandTotal||0),0)
  const totalTax     = filtered.reduce((s,i)=>s+Number(i.taxAmt||0),0)
  const totalDiscount= filtered.reduce((s,i)=>s+Number(i.discAmt||0),0)
  const cashSales    = filtered.filter(s=>(s.paymentMode||'CASH')==='CASH').reduce((s,i)=>s+Number(i.grandTotal||0),0)
  const upiSales     = filtered.filter(s=>s.paymentMode==='UPI').reduce((s,i)=>s+Number(i.grandTotal||0),0)
  const cardSales    = filtered.filter(s=>s.paymentMode==='CARD').reduce((s,i)=>s+Number(i.grandTotal||0),0)
  const creditSales  = filtered.filter(s=>s.paymentMode==='CREDIT').reduce((s,i)=>s+Number(i.grandTotal||0),0)
  const avgBill      = filtered.length>0?totalSales/filtered.length:0

  // Print receipt
  const printReceipt=(inv)=>{
    const lines=Array.isArray(inv.lines)?inv.lines:
      (()=>{try{return JSON.parse(inv.lines||'[]')}catch{return []}})()
    const html=`<!DOCTYPE html><html><head><title>Receipt ${inv.invoiceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:11px;width:80mm;padding:8px}
  .center{text-align:center}.bold{font-weight:700}
  .line{border-top:1px dashed #000;margin:6px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0}
  .big{font-size:14px;font-weight:900}
  .item-row{margin:3px 0;padding:2px 0;border-bottom:1px dotted #ddd}
  .grand{font-size:13px;font-weight:900;border-top:2px solid #000;padding-top:4px;margin-top:4px}
  @media print{body{width:80mm}.no-print{display:none}}
</style></head><body>
<div class="no-print" style="margin-bottom:10px">
  <button onclick="window.print()" style="padding:6px 14px;background:#1A5276;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700">🖨️ Print</button>
  <button onclick="window.close()" style="padding:6px 14px;background:#f0f0f0;border:none;border-radius:4px;cursor:pointer;margin-left:8px">✕</button>
</div>
<div class="center">
  <div class="big">${company?.name||'Counter Sale'}</div>
  <div>${company?.address||''}</div>
  ${company?.phone?`<div>📞 ${company.phone}</div>`:''}
</div>
<div class="line"></div>
<div class="center bold">CASH BILL / RECEIPT</div>
<div class="row"><span>Bill: <b>${inv.invoiceNo}</b></span><span>${fmtD(inv.date||inv.createdAt)}</span></div>
<div class="row"><span>Time: ${fmtT(inv.date||inv.createdAt)}</span><span>${inv.paymentMode||'CASH'}</span></div>
${inv.customerName&&inv.customerName!=='Walk-in Customer'?`<div>Customer: <b>${inv.customerName}</b></div>`:''}
<div class="line"></div>
${lines.map(l=>`<div class="item-row">
  <div>${l.itemName}</div>
  <div class="row"><span>${l.qty} x ₹${Number(l.unitPrice||l.rate||0).toFixed(2)}</span><span>₹${Number(l.totalAmt||l.amount||0).toFixed(2)}</span></div>
</div>`).join('')}
<div class="line"></div>
${Number(inv.discAmt||0)>0?`<div class="row"><span>Discount</span><span>-₹${Number(inv.discAmt).toFixed(2)}</span></div>`:''}
${Number(inv.taxAmt||0)>0?`<div class="row"><span>GST</span><span>₹${Number(inv.taxAmt).toFixed(2)}</span></div>`:''}
<div class="grand row"><span>TOTAL</span><span>₹${Number(inv.grandTotal).toFixed(2)}</span></div>
<div class="line"></div>
<div class="center">Thank you! Visit again 😊</div>
</body></html>`
    const w=window.open('','_blank','width=320,height:600')
    w.document.write(html); w.document.close()
    setTimeout(()=>w.print(),400)
  }

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%'}}>

      {/* Sticky Header */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#1A5276'}}>📋 POS Sales History</div>
            <div style={{fontSize:11,color:'#888'}}>Counter Sale bills · Walk-in customers</div>
          </div>
          <button onClick={()=>nav('/sd/counter-sale')}
            style={{padding:'8px 18px',background:'#1A5276',color:'#fff',border:'none',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            🛒 New Counter Sale
          </button>
        </div>

        {/* KPI Strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:0,
          borderTop:'1px solid #F0EDE8'}}>
          {[
            ['🧾 Bills',      filtered.length,     '#1A5276','#EBF5FB'],
            ['💰 Total',      fmtC0(totalSales),   '#1E8449','#E8F5E9'],
            ['📊 Avg Bill',   fmtC0(avgBill),      '#6E2C00','#FDF2E9'],
            ['💵 Cash',       fmtC0(cashSales),    '#117A65','#E8F5F0'],
            ['📱 UPI',        fmtC0(upiSales),     '#8E44AD','#F4F0FF'],
            ['💳 Card',       fmtC0(cardSales),    '#1A5276','#EBF5FB'],
            ['🏷️ Discount',   fmtC0(totalDiscount),'#C0392B','#FDEDEC'],
          ].map(([l,v,c,bg])=>(
            <div key={l} style={{background:bg,padding:'8px 10px',
              borderRight:'1px solid rgba(0,0,0,.05)',textAlign:'center'}}>
              <div style={{fontSize:10,color:'#888'}}>{l}</div>
              <div style={{fontSize:13,fontWeight:800,color:c}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{padding:'8px 16px',background:'#FAFAFA',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder='🔍 Search invoice / customer...'
            style={{padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,
              fontSize:12,outline:'none',width:220}}/>
          <select value={month} onChange={e=>setMonth(e.target.value)}
            style={{padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none'}}>
            {MONTHS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(e.target.value)}
            style={{padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none'}}>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
          {/* Payment mode filter pills */}
          {['','CASH','UPI','CARD','CREDIT'].map(m=>(
            <button key={m} onClick={()=>setPayMode(m)}
              style={{padding:'5px 12px',border:`1.5px solid ${payMode===m?'#1A5276':'#ddd'}`,
                borderRadius:16,cursor:'pointer',fontSize:11,fontWeight:700,
                background:payMode===m?'#1A5276':'#fff',
                color:payMode===m?'#fff':'#888'}}>
              {m||'All'}
            </button>
          ))}
          <button onClick={load}
            style={{padding:'7px 14px',background:'#FDF2E9',border:'1px solid #6E2C00',
              borderRadius:5,cursor:'pointer',fontWeight:600,color:'#6E2C00',fontSize:12}}>
            🔄
          </button>
          <div style={{marginLeft:'auto',fontSize:11,color:'#888'}}>
            {filtered.length} bills · {fmtC0(totalSales)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
        {loading?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>Loading...
          </div>
        ):filtered.length===0?(
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>🧾</div>
            <div style={{fontSize:15,fontWeight:600,color:'#1A5276',marginBottom:8}}>No Counter Sales Found</div>
            <div style={{fontSize:12,color:'#888',marginBottom:20}}>
              {month?`No sales in ${MONTHS.find(m=>m[0]===month)?.[1]} ${year}`:'No sales yet'}
            </div>
            <button onClick={()=>nav('/sd/counter-sale')}
              style={{padding:'9px 22px',background:'#1A5276',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>
              🛒 Start Counter Sale
            </button>
          </div>
        ):(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#1A5276',color:'#fff',position:'sticky',top:0,zIndex:10}}>
                {['#','Invoice No','Date & Time','Customer','Items','Subtotal','Discount','GST','Total','Payment','Actions'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,
                    fontWeight:600,whiteSpace:'nowrap',background:'#1A5276'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv,i)=>{
                const lines=Array.isArray(inv.lines)?inv.lines:
                  (()=>{try{return JSON.parse(inv.lines||'[]')}catch{return []}})()
                const payClr={
                  CASH:'#1E8449',UPI:'#8E44AD',CARD:'#1A5276',CREDIT:'#C0392B'
                }[inv.paymentMode||'CASH']||'#1E8449'
                return(
                  <tr key={inv.id}
                    style={{background:i%2===0?'#fff':'#F8FBFF',borderBottom:'1px solid #EEF2F7'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#EBF5FB'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#F8FBFF'}>
                    <td style={{padding:'8px 12px',color:'#aaa',fontSize:11}}>{i+1}</td>
                    <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:11,
                      color:'#1A5276',fontWeight:700}}>{inv.invoiceNo}</td>
                    <td style={{padding:'8px 12px',whiteSpace:'nowrap'}}>
                      <div style={{fontWeight:600,fontSize:11}}>{fmtD(inv.date||inv.createdAt)}</div>
                      <div style={{fontSize:10,color:'#aaa'}}>{fmtT(inv.date||inv.createdAt)}</div>
                    </td>
                    <td style={{padding:'8px 12px'}}>
                      <div style={{fontWeight:600}}>{inv.customerName||'Walk-in'}</div>
                      {inv.customerPhone&&<div style={{fontSize:10,color:'#aaa'}}>{inv.customerPhone}</div>}
                    </td>
                    <td style={{padding:'8px 12px'}}>
                      <div style={{fontWeight:600,color:'#333'}}>{lines.length} item(s)</div>
                      <div style={{fontSize:10,color:'#888',maxWidth:160,overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {lines.map(l=>l.itemName).join(', ')}
                      </div>
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'right',color:'#555'}}>
                      {fmtC(inv.taxableAmt)}
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'right',color:'#C0392B'}}>
                      {Number(inv.discAmt||0)>0?`-${fmtC(inv.discAmt)}`:'—'}
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'right',color:'#B8860B'}}>
                      {Number(inv.taxAmt||0)>0?fmtC(inv.taxAmt):'—'}
                    </td>
                    <td style={{padding:'8px 12px',textAlign:'right',fontWeight:800,
                      color:'#1E8449',fontSize:13}}>{fmtC(inv.grandTotal)}</td>
                    <td style={{padding:'8px 12px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:`${payClr}22`,color:payClr}}>
                        {inv.paymentMode||'CASH'}
                      </span>
                    </td>
                    <td style={{padding:'8px 12px'}}>
                      <button onClick={()=>printReceipt(inv)}
                        style={{padding:'4px 10px',background:'#1A5276',color:'#fff',border:'none',
                          borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>
                        🖨️ Reprint
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#EBF5FB',fontWeight:700,position:'sticky',bottom:0}}>
                <td colSpan={5} style={{padding:'10px 12px',color:'#1A5276',fontSize:13}}>
                  TOTAL — {filtered.length} bills
                </td>
                <td style={{padding:'10px 12px',textAlign:'right',color:'#555'}}>
                  {fmtC(filtered.reduce((s,i)=>s+Number(i.taxableAmt||0),0))}
                </td>
                <td style={{padding:'10px 12px',textAlign:'right',color:'#C0392B'}}>
                  -{fmtC(totalDiscount)}
                </td>
                <td style={{padding:'10px 12px',textAlign:'right',color:'#B8860B'}}>
                  {fmtC(totalTax)}
                </td>
                <td style={{padding:'10px 12px',textAlign:'right',color:'#1E8449',fontSize:14}}>
                  {fmtC(totalSales)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
