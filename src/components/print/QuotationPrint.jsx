import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, fmt, TH, TD, toWords } from './_printUtils'

const SAMPLE = {
  quotNo:'QT-2026-0042', date:'17 Mar 2026', validTill:'31 Mar 2026',
  customer:{name:'Coimbatore Spinners Ltd',gstin:'33AAACS9876P1Z1',addr:'45, Avinashi Rd, Coimbatore — 641014',contact:'Mr. Karthik — +91 98765 22222'},
  lines:[
    {sl:1,desc:'Powder Coating — RAL 9005 Black',unit:'Kg',qty:1000,rate:850,disc:5,gstPct:18,taxable:807500,cgst:72675,sgst:72675,total:952850},
    {sl:2,desc:'Surface Treatment — ED Coat',   unit:'Kg',qty:500, rate:420,disc:0,gstPct:18,taxable:210000,cgst:18900,sgst:18900,total:247800},
  ],
  terms:['Prices valid till '+new Date(Date.now()+15*86400000).toLocaleDateString('en-IN'),'Delivery: 7-10 working days from PO date','Payment: 50% advance, balance against delivery','GST extra as applicable'],
  preparedBy:'Sales Team', approvedBy:'Sales Manager',
}

export default function QuotationPrint({ quot, onClose }) {
  const d = quot || SAMPLE
  const totals = d.lines.reduce((a,l)=>({taxable:a.taxable+l.taxable,cgst:a.cgst+l.cgst,sgst:a.sgst+l.sgst,total:a.total+l.total}),{taxable:0,cgst:0,sgst:0,total:0})
  return (
    <PrintWrapper title={`Quotation — ${d.quotNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #117A65',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#117A65'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3,lineHeight:1.6}}>{CO.addr}<br/>GSTIN: <b>{CO.gstin}</b> · Ph: {CO.phone} · {CO.email}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#117A65',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800}}>QUOTATION</div>
            <div style={{border:'1px solid #117A65',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#117A65',fontSize:12}}>{d.quotNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Valid Till: </span><b>{d.validTill}</b></div>
            </div>
          </div>
        </div>
        <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px',marginBottom:12}}>
          <div style={{fontSize:9,fontWeight:700,color:'#117A65',textTransform:'uppercase',marginBottom:4}}>Quotation To</div>
          <div style={{fontWeight:700,fontSize:11}}>{d.customer.name}</div>
          <div style={{fontSize:9.5,color:'#555',lineHeight:1.6}}>{d.customer.addr}<br/>GSTIN: <b>{d.customer.gstin}</b> · {d.customer.contact}</div>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
          <thead><tr>{['#','Description','Unit','Qty','Rate (₹)','Disc%','Taxable','CGST','SGST','Total (₹)'].map(h=><th key={h} style={TH('#117A65')}>{h}</th>)}</tr></thead>
          <tbody>{d.lines.map((l,i)=>(
            <tr key={i} style={{background:i%2===0?'#fff':'#F0FFF8'}}>
              <td style={TD()}>{l.sl}</td>
              <td style={{...TD('left'),fontWeight:600}}>{l.desc}</td>
              <td style={TD()}>{l.unit}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace'}}>{l.qty}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.rate)}</td>
              <td style={TD()}>{l.disc>0?l.disc+'%':'—'}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.taxable)}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.cgst)}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.sgst)}</td>
              <td style={{...TD('right'),fontWeight:700,fontFamily:'DM Mono,monospace',color:'#117A65'}}>{fmt(l.total)}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr style={{background:'#E8F8F0'}}>
            <td colSpan={6} style={{...TD('right'),fontWeight:700}}>TOTAL</td>
            <td style={{...TD('right'),fontFamily:'DM Mono,monospace',fontWeight:700}}>{fmt(totals.taxable)}</td>
            <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(totals.cgst)}</td>
            <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(totals.sgst)}</td>
            <td style={{...TD('right'),fontWeight:800,fontFamily:'DM Mono,monospace',color:'#117A65',fontSize:12}}>₹{fmt(totals.total)}</td>
          </tr></tfoot>
        </table>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#117A65',textTransform:'uppercase',marginBottom:5}}>Terms & Conditions</div>
            {d.terms.map((t,i)=><div key={i} style={{fontSize:10,color:'#555',marginBottom:3}}>• {t}</div>)}
          </div>
          <div style={{border:'1px solid #117A65',borderRadius:4,overflow:'hidden',alignSelf:'start'}}>
            {[['Taxable',totals.taxable],['CGST',totals.cgst],['SGST',totals.sgst]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 10px',borderBottom:'1px solid #eee',fontSize:10}}>
                <span style={{color:'#555'}}>{k}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontWeight:600}}>₹{fmt(v)}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:'#117A65',color:'#fff'}}>
              <span style={{fontWeight:700,fontSize:12}}>GRAND TOTAL</span>
              <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13}}>₹{fmt(totals.total)}</span>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Prepared By',d.preparedBy],['Approved By',d.approvedBy],['Customer Acceptance','']].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:40,borderBottom:'1px solid #333',marginBottom:4}}/>
              <div style={{fontSize:10,fontWeight:700}}>{n||'Signature'}</div>
              <div style={{fontSize:9,color:'#555'}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
