import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, fmt, TH, TD } from './_printUtils'
const SAMPLE={grnNo:'GRN-2026-031',date:'17 Mar 2026',poRef:'PO-2026-0089',invoiceNo:'LTM/2026/0441',invoiceDate:'15 Mar 2026',
  vendor:{name:'Lakshmi Textile Mills',gstin:'33AAACL1234F1Z5',addr:'12, Industrial Estate, Coimbatore — 641021'},
  vehicleNo:'TN38 CD 5678',receivedBy:'Store Keeper',inspectedBy:'QC Inspector',
  lines:[
    {sl:1,code:'RM-001',desc:'Powder Coat — RAL 9005 Black',uom:'Kg', poQty:500,recQty:500,rejQty:0, rate:1600,amount:800000,condition:'Good'},
    {sl:2,code:'RM-002',desc:'Powder Coat — RAL 9010 White',uom:'Kg', poQty:300,recQty:298,rejQty:2,  rate:1600,amount:476800,condition:'2 bags damaged'},
    {sl:3,code:'SP-001',desc:'Masking Tape 25mm',           uom:'Roll',poQty:200,recQty:200,rejQty:0, rate:85,  amount:17000, condition:'Good'},
  ],
  remarks:'2 bags of RM-002 received damaged — returned to supplier.',
  qcRemarks:'Approved for use after sampling.',
}
export default function GRNPrint({grn,onClose}){
  const d=grn||SAMPLE
  const totAmt=d.lines.reduce((a,l)=>a+l.amount,0)
  return(
    <PrintWrapper title={`GRN — ${d.grnNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #E06F39',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#E06F39'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#E06F39',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:800}}>GOODS RECEIPT NOTE</div>
            <div style={{border:'1px solid #E06F39',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#E06F39'}}>{d.grnNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>GRN Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>PO Ref: </span><b style={{fontFamily:'DM Mono,monospace'}}>{d.poRef}</b></div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#E06F39',textTransform:'uppercase',marginBottom:4}}>Supplier</div>
            <div style={{fontWeight:700,fontSize:11}}>{d.vendor.name}</div>
            <div style={{fontSize:9.5,color:'#555',lineHeight:1.5}}>{d.vendor.addr}<br/>GSTIN: <b>{d.vendor.gstin}</b></div>
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#E06F39',textTransform:'uppercase',marginBottom:4}}>Receipt Details</div>
            {[['Supplier Invoice',d.invoiceNo],['Invoice Date',d.invoiceDate],['Vehicle No.',d.vehicleNo],['Received By',d.receivedBy]].map(([k,v])=>(
              <div key={k} style={{display:'flex',gap:8,fontSize:10,marginBottom:2}}>
                <span style={{color:'#555',minWidth:100}}>{k}</span><b>{v}</b>
              </div>
            ))}
          </div>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
          <thead><tr>{['#','Code','Description','UOM','PO Qty','Recd Qty','Rejected','Rate','Amount','Condition'].map(h=><th key={h} style={TH('#E06F39')}>{h}</th>)}</tr></thead>
          <tbody>{d.lines.map((l,i)=>(
            <tr key={i} style={{background:i%2===0?'#fff':'#FFF8F4'}}>
              <td style={TD()}>{l.sl}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{l.code}</td>
              <td style={{...TD('left'),fontWeight:600}}>{l.desc}</td>
              <td style={TD()}>{l.uom}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace'}}>{l.poQty}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{l.recQty}</td>
              <td style={{...TD(),fontFamily:'DM Mono,monospace',color:l.rejQty>0?'#721C24':'#155724',fontWeight:l.rejQty>0?700:400}}>{l.rejQty||'—'}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace'}}>₹{fmt(l.rate)}</td>
              <td style={{...TD('right'),fontFamily:'DM Mono,monospace',fontWeight:700,color:'#E06F39'}}>₹{fmt(l.amount)}</td>
              <td style={{...TD('left'),fontSize:9,color:l.condition==='Good'?'#155724':'#721C24'}}>{l.condition}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr style={{background:'#FFF0E8'}}>
            <td colSpan={8} style={{...TD('right'),fontWeight:700}}>TOTAL VALUE</td>
            <td style={{...TD('right'),fontWeight:800,fontFamily:'DM Mono,monospace',color:'#E06F39',fontSize:12}}>₹{fmt(totAmt)}</td>
            <td/>
          </tr></tfoot>
        </table>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'7px 10px',fontSize:10}}><b style={{color:'#E06F39'}}>Store Remarks: </b>{d.remarks}</div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'7px 10px',fontSize:10}}><b style={{color:'#E06F39'}}>QC Remarks: </b>{d.qcRemarks}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Received By',d.receivedBy],['Inspected By (QC)',d.inspectedBy],['Store In-Charge',''],['Accounts','']].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:38,borderBottom:'1px solid #333',marginBottom:3}}/>
              <div style={{fontSize:9,fontWeight:700}}>{n||'Signature'}</div>
              <div style={{fontSize:8,color:'#555'}}>{r}</div>
              <div style={{fontSize:8,color:'#aaa'}}>Date: _______</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
