import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, fmt } from './_printUtils'
const SAMPLE={month:'March 2026',empCode:'EMP001',name:'Ramesh Kumar',dept:'Production',designation:'Senior Operator',doj:'01 Jun 2020',
  bankAc:'****5678',bankName:'SBI',pfNo:'TN/CBE/12345/001',esiNo:'',panNo:'ABCPR1234E',
  workDays:26,totalDays:31,lopDays:0,
  earnings:[
    {desc:'Basic Salary',       amt:28000},
    {desc:'HRA (40% of Basic)', amt:11200},
    {desc:'Transport Allowance',amt:3000},
    {desc:'Medical Allowance',  amt:1500},
    {desc:'Special Allowance',  amt:6300},
  ],
  deductions:[
    {desc:'Provident Fund (12%)',amt:3360},
    {desc:'Professional Tax',   amt:200},
    {desc:'Advance Deduction',  amt:0},
    {desc:'LOP Deduction',      amt:0},
  ],
}
export default function PaySlipPrint({payslip,onClose}){
  const d=payslip||SAMPLE
  const gross=d.earnings.reduce((a,e)=>a+e.amt,0)
  const totalDed=d.deductions.reduce((a,e)=>a+e.amt,0)
  const net=gross-totalDed
  const maxRows=Math.max(d.earnings.length,d.deductions.length)
  return(
    <PrintWrapper title={`Pay Slip — ${d.name} — ${d.month}`} onClose={onClose}>
      <div className="print-page">
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)',borderRadius:6,padding:'14px 20px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800,color:'#F5C518'}}>{CO.name}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.7)',marginTop:3}}>PAY SLIP — {d.month.toUpperCase()}</div>
          </div>
          <div style={{textAlign:'right',color:'rgba(255,255,255,.8)',fontSize:10}}>
            <div>GSTIN: {CO.gstin}</div>
            <div style={{marginTop:3}}>{CO.addr.split(',').slice(-2).join(',').trim()}</div>
          </div>
        </div>
        {/* Employee details */}
        <div style={{border:'1px solid #ddd',borderRadius:4,overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'6px 12px',background:'#F0EEEB',fontSize:9,fontWeight:700,color:'#714B67',textTransform:'uppercase',letterSpacing:.5}}>Employee Information</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',padding:'10px 12px',gap:10}}>
            {[['Employee Code',d.empCode],['Name',d.name],['Department',d.dept],['Designation',d.designation],
              ['Date of Joining',d.doj],['Bank A/C',d.bankAc],['Bank',d.bankName],['PAN',d.panNo],
              ['Working Days',d.workDays+' / '+d.totalDays],['LOP Days',d.lopDays],['PF No.',d.pfNo],['ESI No.',d.esiNo||'—']
            ].map(([k,v])=>(
              <div key={k}>
                <div style={{fontSize:8,color:'#888',textTransform:'uppercase',letterSpacing:.3}}>{k}</div>
                <div style={{fontSize:10,fontWeight:600,marginTop:1}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Earnings vs Deductions */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}>
          <thead>
            <tr>
              <th colSpan={2} style={{padding:'7px 12px',background:'#196F3D',color:'#fff',fontSize:10,fontWeight:700,textAlign:'center',border:'1px solid #155724'}}>EARNINGS</th>
              <th colSpan={2} style={{padding:'7px 12px',background:'#C0392B',color:'#fff',fontSize:10,fontWeight:700,textAlign:'center',border:'1px solid #922B21'}}>DEDUCTIONS</th>
            </tr>
            <tr>
              {['Description','Amount (₹)','Description','Amount (₹)'].map(h=>(
                <th key={h} style={{padding:'6px 10px',border:'1px solid #ddd',fontSize:9,fontWeight:700,color:'#555',background:'#F8F9FA',textAlign:h==='Amount (₹)'?'right':'left'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length:maxRows}).map((_,i)=>{
              const e=d.earnings[i]||null
              const ded=d.deductions[i]||null
              return(
                <tr key={i} style={{background:i%2===0?'#fff':'#FAFAFA'}}>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd',fontSize:10,fontWeight:e?500:400,color:e?'#1C1C1C':'#ccc'}}>{e?e.desc:'—'}</td>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd',fontSize:10,fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:e?600:400,color:e?'#196F3D':'#ccc'}}>{e?fmt(e.amt,0):'—'}</td>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd',fontSize:10,color:ded&&ded.amt>0?'#1C1C1C':'#ccc'}}>{ded?ded.desc:'—'}</td>
                  <td style={{padding:'6px 10px',border:'1px solid #ddd',fontSize:10,fontFamily:'DM Mono,monospace',textAlign:'right',color:ded&&ded.amt>0?'#C0392B':'#ccc'}}>{ded&&ded.amt>0?fmt(ded.amt,0):'—'}</td>
                </tr>
              )
            })}
            <tr style={{background:'#F8F9FA',fontWeight:800}}>
              <td style={{padding:'8px 10px',border:'1px solid #bbb',fontFamily:'Syne,sans-serif',fontSize:11}}>GROSS EARNINGS</td>
              <td style={{padding:'8px 10px',border:'1px solid #bbb',fontFamily:'DM Mono,monospace',textAlign:'right',fontSize:13,color:'#196F3D'}}>₹{fmt(gross,0)}</td>
              <td style={{padding:'8px 10px',border:'1px solid #bbb',fontFamily:'Syne,sans-serif',fontSize:11}}>TOTAL DEDUCTIONS</td>
              <td style={{padding:'8px 10px',border:'1px solid #bbb',fontFamily:'DM Mono,monospace',textAlign:'right',fontSize:13,color:'#C0392B'}}>₹{fmt(totalDed,0)}</td>
            </tr>
          </tbody>
        </table>
        {/* Net Pay */}
        <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)',borderRadius:7,padding:'14px 20px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'rgba(255,255,255,.7)',fontSize:12}}>NET PAY (Take Home)</div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:800,color:'#F5C518'}}>₹ {fmt(net,0)}</div>
        </div>
        <div style={{fontSize:9,color:'#888',textAlign:'center',marginBottom:12,fontStyle:'italic'}}>
          This is a computer generated pay slip. No signature required.
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,borderTop:'1px solid #ddd',paddingTop:12}}>
          <div style={{textAlign:'center'}}>
            <div style={{height:36,borderBottom:'1px solid #333',marginBottom:3}}/>
            <div style={{fontSize:9,fontWeight:700}}>Employee Signature</div>
            <div style={{fontSize:8,color:'#aaa'}}>Date: __________</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{height:36,borderBottom:'1px solid #333',marginBottom:3}}/>
            <div style={{fontSize:9,fontWeight:700}}>HR / Authorized Signatory</div>
            <div style={{fontSize:8,color:'#aaa'}}>{CO.name}</div>
          </div>
        </div>
      </div>
    </PrintWrapper>
  )
}
