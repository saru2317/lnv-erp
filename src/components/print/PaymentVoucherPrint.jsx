import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, fmt, toWords } from './_printUtils'
const SAMPLE={pvNo:'PV-2026-0312',date:'17 Mar 2026',payMode:'NEFT',bankRef:'SBIN26031700012',
  payTo:'Lakshmi Textile Mills',gstin:'33AAACL1234F1Z5',
  narration:'Being payment of Invoice LTM/2026/0124 for Raw Material supply',
  entries:[
    {ledger:'Lakshmi Textile Mills — Creditor',dr:0,cr:142000,narr:'Creditor settlement'},
    {ledger:'TDS Payable (1%)             ',dr:1420, cr:0,narr:'TDS deducted'},
    {ledger:'State Bank of India — Current',dr:140580,cr:0,narr:'Bank payment'},
  ],
  preparedBy:'Priya S.',approvedBy:'Saravana Kumar',
}
export default function PaymentVoucherPrint({pv,onClose}){
  const d=pv||SAMPLE
  const totalDr=d.entries.reduce((a,e)=>a+e.dr,0)
  const totalCr=d.entries.reduce((a,e)=>a+e.cr,0)
  const netAmt=totalCr
  return(
    <PrintWrapper title={`Payment Voucher — ${d.pvNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #196F3D',paddingBottom:12,marginBottom:14}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#196F3D'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr} · GSTIN: {CO.gstin}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#196F3D',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800}}>PAYMENT VOUCHER</div>
            <div style={{border:'1px solid #196F3D',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#196F3D'}}>{d.pvNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Mode: </span><b>{d.payMode}</b></div>
              {d.bankRef&&<div><span style={{fontSize:9,color:'#555'}}>Bank Ref: </span><b style={{fontFamily:'DM Mono,monospace',fontSize:9}}>{d.bankRef}</b></div>}
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#196F3D',textTransform:'uppercase',marginBottom:4}}>Pay To</div>
            <div style={{fontWeight:700,fontSize:13}}>{d.payTo}</div>
            {d.gstin&&<div style={{fontSize:9.5,color:'#555',marginTop:2}}>GSTIN: {d.gstin}</div>}
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#196F3D',textTransform:'uppercase',marginBottom:4}}>Narration</div>
            <div style={{fontSize:10,color:'#333',lineHeight:1.5}}>{d.narration}</div>
          </div>
        </div>
        {/* Journal entries */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
          <thead><tr>
            <th style={{padding:'8px 12px',border:'1px solid #bbb',background:'#196F3D',color:'#fff',fontSize:10,fontWeight:700,textAlign:'left',width:'60%'}}>Ledger / Account</th>
            <th style={{padding:'8px 12px',border:'1px solid #bbb',background:'#196F3D',color:'#fff',fontSize:10,fontWeight:700,textAlign:'right'}}>Dr (₹)</th>
            <th style={{padding:'8px 12px',border:'1px solid #bbb',background:'#196F3D',color:'#fff',fontSize:10,fontWeight:700,textAlign:'right'}}>Cr (₹)</th>
            <th style={{padding:'8px 12px',border:'1px solid #bbb',background:'#196F3D',color:'#fff',fontSize:10,fontWeight:700,textAlign:'left'}}>Narration</th>
          </tr></thead>
          <tbody>{d.entries.map((e,i)=>(
            <tr key={i} style={{background:i%2===0?'#fff':'#F0FFF4',borderBottom:'1px solid #ddd'}}>
              <td style={{padding:'8px 12px',fontWeight:600,fontSize:11}}>{e.ledger}</td>
              <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:e.dr>0?700:400,color:e.dr>0?'#1A5276':'#ccc'}}>{e.dr>0?fmt(e.dr):'—'}</td>
              <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:e.cr>0?700:400,color:e.cr>0?'#196F3D':'#ccc'}}>{e.cr>0?fmt(e.cr):'—'}</td>
              <td style={{padding:'8px 12px',fontSize:10,color:'#555'}}>{e.narr}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr style={{background:'#E8F8EE'}}>
            <td style={{padding:'8px 12px',fontWeight:800,fontFamily:'Syne,sans-serif',fontSize:11}}>TOTAL</td>
            <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',fontWeight:800,textAlign:'right',color:'#1A5276',fontSize:12}}>₹{fmt(totalDr)}</td>
            <td style={{padding:'8px 12px',fontFamily:'DM Mono,monospace',fontWeight:800,textAlign:'right',color:'#196F3D',fontSize:12}}>₹{fmt(totalCr)}</td>
            <td/>
          </tr></tfoot>
        </table>
        <div style={{background:'#E8F8EE',border:'1px solid #C3E6CB',borderRadius:6,padding:'10px 14px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:'#555',textTransform:'uppercase',letterSpacing:.5}}>Amount in Words</div>
            <div style={{fontSize:11,fontWeight:600,textTransform:'capitalize',marginTop:2}}>{toWords(Math.round(netAmt))} Rupees Only</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:10,color:'#555'}}>Net Amount Paid</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:'#196F3D'}}>₹{fmt(netAmt)}</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Prepared By',d.preparedBy],['Accounts Head',''],['Approved By',d.approvedBy]].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:40,borderBottom:'1px solid #333',marginBottom:4}}/>
              <div style={{fontSize:10,fontWeight:700}}>{n||'Signature'}</div>
              <div style={{fontSize:9,color:'#555'}}>{r}</div>
              <div style={{fontSize:8,color:'#aaa'}}>Date: __________</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
