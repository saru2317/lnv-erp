/**
 * POPrint — Purchase Order (A4)
 */
import React from 'react'
import PrintWrapper from './PrintWrapper'

const COMPANY = {
  name:'LNV Manufacturing Pvt. Ltd.',
  gstin:'33AABCL1234F1Z5', pan:'AABCL1234F',
  addr:'Plot No. 42, SIDCO Industrial Estate, Ranipet — 632401, Tamil Nadu',
  phone:'+91 99440 01234', email:'purchase@lnvmfg.com',
}

const SAMPLE_PO = {
  poNo:'PO-2026-0089', date:'17 Mar 2026', validTill:'31 Mar 2026',
  prRef:'PR-2026-042', payTerms:'Net 30 days', deliveryBy:'25 Mar 2026',
  deliveryTo:'Factory — Plot 42, SIDCO, Ranipet',
  vendor:{
    name:'Lakshmi Textile Mills', gstin:'33AAACL1234F1Z5',
    addr:'12, Industrial Estate, Coimbatore — 641021, Tamil Nadu',
    contact:'Mr. Rajan — +91 98765 43210',
  },
  lines:[
    {sl:1, code:'RM-001', desc:'Powder Coat — RAL 9005 Black', unit:'Kg', qty:500, rate:1600, gstPct:18, taxable:800000, gst:144000, total:944000},
    {sl:2, code:'RM-002', desc:'Powder Coat — RAL 9010 White', unit:'Kg', qty:300, rate:1600, gstPct:18, taxable:480000, gst:86400,  total:566400},
    {sl:3, code:'SP-001', desc:'Masking Tape 25mm x 50m',      unit:'Roll',qty:200,rate:85,   gstPct:12, taxable:17000,  gst:2040,   total:19040},
  ],
  remarks:'Please ensure quality certificate with each lot. Delivery in factory hours 9AM–5PM only.',
  approvedBy:'Saravana Kumar', designation:'Purchase Manager',
}

const fmt = n => n?.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})
const th = (align='center') => ({ padding:'7px 8px', border:'1px solid #bbb', background:'#1A5276', color:'#fff', fontSize:10, fontWeight:700, textAlign:align })
const td = (align='center') => ({ padding:'6px 8px', border:'1px solid #ddd', fontSize:10, textAlign:align, verticalAlign:'middle' })

export default function POPrint({ po, onClose }) {
  const data = po || SAMPLE_PO
  const totals = data.lines.reduce((a,l)=>({
    taxable:a.taxable+l.taxable, gst:a.gst+l.gst, total:a.total+l.total
  }),{taxable:0,gst:0,total:0})

  return (
    <PrintWrapper title={`Purchase Order — ${data.poNo}`} onClose={onClose}>
      <div className="print-page">

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',
          alignItems:'flex-start',borderBottom:'3px solid #1A5276',paddingBottom:12,marginBottom:12}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:900,color:'#1A5276',letterSpacing:-1}}>
              {COMPANY.name}
            </div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3,lineHeight:1.6}}>
              {COMPANY.addr}<br/>
              Ph: {COMPANY.phone} · GSTIN: <strong>{COMPANY.gstin}</strong>
            </div>
          </div>
          <div style={{textAlign:'right',minWidth:170}}>
            <div style={{background:'#1A5276',color:'#fff',padding:'6px 16px',
              borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800,letterSpacing:1}}>
              PURCHASE ORDER
            </div>
            <div style={{border:'1px solid #1A5276',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.7}}>
              <div><span style={{color:'#555',fontSize:9}}>PO No. </span>
                <strong style={{fontSize:12,fontFamily:'DM Mono,monospace',color:'#1A5276'}}>{data.poNo}</strong></div>
              <div><span style={{color:'#555',fontSize:9}}>Date: </span><strong>{data.date}</strong></div>
              <div><span style={{color:'#555',fontSize:9}}>Valid Till: </span><strong>{data.validTill}</strong></div>
              <div><span style={{color:'#555',fontSize:9}}>PR Ref: </span>
                <strong style={{fontFamily:'DM Mono,monospace'}}>{data.prRef}</strong></div>
            </div>
          </div>
        </div>

        {/* Vendor + Delivery Info */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#1A5276',textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>
              Vendor / Supplier
            </div>
            <div style={{fontWeight:700,fontSize:11}}>{data.vendor.name}</div>
            <div style={{fontSize:9.5,color:'#555',lineHeight:1.6,marginTop:2}}>
              {data.vendor.addr}<br/>
              Contact: {data.vendor.contact}<br/>
              GSTIN: <strong>{data.vendor.gstin}</strong>
            </div>
          </div>
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#1A5276',textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>
              Delivery Details
            </div>
            <table style={{fontSize:10,width:'100%',borderCollapse:'collapse'}}>
              {[
                ['Deliver By', data.deliveryBy],
                ['Deliver To', data.deliveryTo],
                ['Payment Terms', data.payTerms],
              ].map(([k,v])=>(
                <tr key={k}>
                  <td style={{color:'#555',paddingBottom:4,paddingRight:10,fontWeight:600}}>{k}</td>
                  <td style={{fontWeight:600}}>{v}</td>
                </tr>
              ))}
            </table>
          </div>
        </div>

        {/* Line Items */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:0}}>
          <thead>
            <tr>
              {['#','Item Code','Description','Unit','Qty','Rate (₹)','Taxable (₹)','GST%','GST (₹)','Total (₹)'].map(h=>(
                <th key={h} style={th()}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l,i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#F0F5FA'}}>
                <td style={td()}>{l.sl}</td>
                <td style={{...td(),fontFamily:'DM Mono,monospace',fontSize:9}}>{l.code}</td>
                <td style={{...td('left'),fontWeight:600}}>{l.desc}</td>
                <td style={td()}>{l.unit}</td>
                <td style={{...td(),fontFamily:'DM Mono,monospace'}}>{l.qty}</td>
                <td style={{...td('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.rate)}</td>
                <td style={{...td('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.taxable)}</td>
                <td style={td()}>{l.gstPct}%</td>
                <td style={{...td('right'),fontFamily:'DM Mono,monospace'}}>{fmt(l.gst)}</td>
                <td style={{...td('right'),fontWeight:700,fontFamily:'DM Mono,monospace',color:'#1A5276'}}>{fmt(l.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:'#EBF2F8'}}>
              <td colSpan={6} style={{...td('right'),fontWeight:700,fontSize:11}}>TOTAL</td>
              <td style={{...td('right'),fontWeight:700,fontFamily:'DM Mono,monospace'}}>{fmt(totals.taxable)}</td>
              <td style={td()}></td>
              <td style={{...td('right'),fontWeight:700,fontFamily:'DM Mono,monospace'}}>{fmt(totals.gst)}</td>
              <td style={{...td('right'),fontWeight:800,fontFamily:'DM Mono,monospace',color:'#1A5276',fontSize:12}}>
                {fmt(totals.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Total Box */}
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:8,marginBottom:14}}>
          <div style={{border:'1px solid #1A5276',borderRadius:4,overflow:'hidden',minWidth:220}}>
            {[['Taxable Amount',totals.taxable],['GST',totals.gst]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',
                padding:'5px 12px',borderBottom:'1px solid #eee',fontSize:10}}>
                <span style={{color:'#555'}}>{k}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontWeight:600}}>₹{fmt(v)}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',
              padding:'8px 12px',background:'#1A5276',color:'#fff'}}>
              <span style={{fontWeight:700,fontSize:12}}>PO TOTAL</span>
              <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13}}>₹{fmt(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        {data.remarks && (
          <div style={{border:'1px solid #ddd',borderRadius:4,padding:'8px 10px',marginBottom:14,fontSize:10}}>
            <div style={{fontWeight:700,color:'#1A5276',marginBottom:4,fontSize:9,textTransform:'uppercase'}}>Remarks / Special Instructions</div>
            {data.remarks}
          </div>
        )}

        {/* Signature */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,
          borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Prepared By','Purchase Dept.'],['Checked By','Store / QC'],['Approved By',data.approvedBy]].map(([role,name])=>(
            <div key={role} style={{textAlign:'center'}}>
              <div style={{height:40,borderBottom:'1px solid #333',marginBottom:4}}/>
              <div style={{fontSize:10,fontWeight:700}}>{name}</div>
              <div style={{fontSize:9,color:'#555'}}>{role}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:'center',marginTop:12,paddingTop:8,
          borderTop:'1px solid #eee',fontSize:8,color:'#aaa'}}>
          {COMPANY.name} · GSTIN: {COMPANY.gstin} · {COMPANY.addr}
        </div>
      </div>
    </PrintWrapper>
  )
}
