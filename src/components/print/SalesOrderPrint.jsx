import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, fmt, TH, TD } from './_printUtils'

const SAMPLE = {
  soNo:'SO-2026-0124', date:'17 Mar 2026', validTill:'31 Mar 2026',
  deliveryDate:'25 Mar 2026', payTerms:'Net 30 days',
  customer:{ name:'Ashok Leyland Ltd', gstin:'33AAACE5678M1Z2', addr:'No. 1, Hosur Rd, Chennai — 600032, Tamil Nadu', contact:'Mr. Rajesh — +91 98765 11111' },
  lines:[
    {sl:1,desc:'Powder Coated Brackets — Type A', hsn:'8708 99 00', unit:'Nos', qty:500, rate:780, disc:5, gstPct:18, taxable:370500, cgst:33345, sgst:33345, total:437190},
    {sl:2,desc:'Surface Treated Flanges — 50mm',  hsn:'8484 10 00', unit:'Nos', qty:300, rate:420, disc:0, gstPct:18, taxable:126000, cgst:11340, sgst:11340, total:148680},
  ],
  remarks:'Delivery in 2 lots. First lot by 22 Mar, balance by 25 Mar.',
  preparedBy:'Arjun Sharma', approvedBy:'Saravana Kumar',
}

export default function SalesOrderPrint({ so, onClose }) {
  const d = so || SAMPLE
  const totals = d.lines.reduce((a,l)=>({taxable:a.taxable+l.taxable,cgst:a.cgst+l.cgst,sgst:a.sgst+l.sgst,total:a.total+l.total}),{taxable:0,cgst:0,sgst:0,total:0})
  return (
    <PrintWrapper title={`Sales Order — ${d.soNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #714B67',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#714B67'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3,lineHeight:1.6}}>{CO.addr}<br/>GSTIN: <b>{CO.gstin}</b> · Ph: {CO.phone}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#714B67',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800}}>SALES ORDER</div>
            <div style={{border:'1px solid #714B67',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><span style={{fontSize:9,color:'#555'}}>SO No. </span><b style={{fontFamily:'DM Mono,monospace',color:'#714B67'}}>{d.soNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Delivery By: </span><b>{d.deliveryDate}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Pay Terms: </span><b>{d.payTerms}</b></div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#714B67',textTransform:'uppercase',marginBottom:4}}>Bill To / Customer</div>
            <div style={{fontWeight:700,fontSize:11}}>{d.customer.name}</div>
            <div style={{fontSize:9.5,color:'#555',lineHeight:1.6}}>{d.customer.addr}<br/>GSTIN: <b>{d.customer.gstin}</b><br/>{d.customer.contact}</div>
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#714B67',textTransform:'uppercase',marginBottom:4}}>Order Details</div>
            {[['Valid Till',d.validTill],['Delivery Date',d.deliveryDate],['Payment Terms',d.payTerms],['Place of Supply','Tamil Nadu (33)']].map(([k,v])=>(
              <div key={k} style={{display:'flex',gap:8,fontSize:10,marginBottom:3}}>
                <span style={{color:'#555',minWidth:100}}>{k}</span><b>{v}</b>
              </div>
            ))}
          </div>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
          <thead><tr>{['#','HSN','Description','Unit','Qty','Rate','Disc%','Taxable','CGST','SGST','Total'].map(h=><th key={h} style={TH()}>{h}</th>)}</tr></thead>
          <tbody>
            {d.lines.map((l,i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#FDF8FC'}}>
                <td style={TD()}>{l.sl}</td>
                <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{l.hsn}</td>
                <td style={{...TD('left'),fontWeight:600}}>{l.desc}</td>
                <td style={TD()}>{l.unit}</td>
                <td style={{...TD(),fontFamily:'DM Mono,monospace'}}>{l.qty}</td>
                <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.rate)}</td>
                <td style={TD()}>{l.disc>0?l.disc+'%':'—'}</td>
                <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.taxable)}</td>
                <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.cgst)}</td>
                <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.sgst)}</td>
                <td style={{...TD('right'),fontWeight:700,fontFamily:'DM Mono,monospace',color:'#714B67'}}>{fmt(l.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:'#EDE0EA'}}>
              <td colSpan={7} style={{...TD('right'),fontWeight:700}}>TOTAL</td>
              <td style={{...TD('right'),fontWeight:700,fontFamily:'DM Mono,monospace'}}>{fmt(totals.taxable)}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(totals.cgst)}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>{fmt(totals.sgst)}</td>
              <td style={{...TD('right'),fontWeight:800,fontFamily:'DM Mono,monospace',color:'#714B67',fontSize:12}}>₹{fmt(totals.total)}</td>
            </tr>
          </tfoot>
        </table>
        {d.remarks && <div style={{border:'1px solid #ddd',borderRadius:4,padding:'7px 10px',fontSize:10,marginBottom:12}}><b style={{color:'#714B67'}}>Remarks: </b>{d.remarks}</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Prepared By',d.preparedBy],['Checked By','Sales Manager'],['Authorized By',d.approvedBy]].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:40,borderBottom:'1px solid #333',marginBottom:4}}/>
              <div style={{fontSize:10,fontWeight:700}}>{n}</div>
              <div style={{fontSize:9,color:'#555'}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
