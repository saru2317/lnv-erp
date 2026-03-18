import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO } from './_printUtils'
export default function FuelLogReportPrint({ data, onClose }) {
  return (
    <PrintWrapper title="Fuel Log Report" onClose={onClose}>
      <div className="print-page">
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #E06F39',paddingBottom:12,marginBottom:16}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#E06F39'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr} · GSTIN: {CO.gstin}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#E06F39',color:'#fff',padding:'8px 20px',borderRadius:6,fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800,letterSpacing:.5}}>
              Fuel Log Report
            </div>
            <div style={{fontSize:11,marginTop:8,color:'#555'}}>
              Date: <strong>{new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</strong>
            </div>
          </div>
        </div>
        {/* Content placeholder - will be populated with real data */}
        <div style={{background:'#F8F9FA',border:'2px dashed #DDD',borderRadius:8,padding:32,textAlign:'center',color:'#999',marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>
          <div style={{fontSize:13,fontWeight:600,color:'#714B67'}}>Fuel Log Report</div>
          <div style={{fontSize:11,marginTop:4}}>Document content renders from module data</div>
        </div>
        {/* Signatures */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,borderTop:'1px solid #ddd',paddingTop:12,marginTop:'auto'}}>
          {['Prepared By','Checked By','Authorized By'].map(r=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:40,borderBottom:'1px solid #333',marginBottom:4}}/>
              <div style={{fontSize:9,fontWeight:700,color:'#555'}}>{r}</div>
              <div style={{fontSize:8,color:'#aaa'}}>Date: __________</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
