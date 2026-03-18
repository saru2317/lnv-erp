/**
 * CSPrint — Purchase Comparative Statement (A4 Landscape)
 */
import React from 'react'
import PrintWrapper from './PrintWrapper'

const COMPANY = { name:'LNV Manufacturing Pvt. Ltd.', gstin:'33AABCL1234F1Z5' }

const SAMPLE_CS = {
  csNo:'CS-2026-022', date:'17 Mar 2026', prRef:'PR-2026-042',
  dept:'Production', preparedBy:'Purchase Team', approvedBy:'Saravana Kumar',
  suppliers:[
    { name:'Lakshmi Textile Mills',    gstin:'33AAACL1234F1Z5', supplyType:'Manufacturer', quoteRef:'LTM/Q/2026/041', quoteDate:'14 Mar 2026', payTerms:'Net 30', deliveryDays:7  },
    { name:'Coimbatore Spares Co.',    gstin:'33AAACS5678P1Z5', supplyType:'Distributor',  quoteRef:'CSC/Q/2026/112', quoteDate:'15 Mar 2026', payTerms:'Advance', deliveryDays:3 },
    { name:'Sri Murugan Traders',      gstin:'33AAASM9012Q1Z5', supplyType:'Trader',       quoteRef:'SMT/Q/2026/089', quoteDate:'15 Mar 2026', payTerms:'Net 15', deliveryDays:5  },
  ],
  items:[
    { sl:1, desc:'Powder Coat RAL 9005', unit:'Kg',   qty:500,
      s1:{rate:1600,disc:0,basic:800000,freight:8000,gstPct:18,gstAmt:144000,total:952000,landingCost:1904},
      s2:{rate:1550,disc:2,basic:759500,freight:5000,gstPct:18,gstAmt:136710,total:901210,landingCost:1802},
      s3:{rate:1620,disc:0,basic:810000,freight:10000,gstPct:18,gstAmt:145800,total:965800,landingCost:1932},
    },
    { sl:2, desc:'Powder Coat RAL 9010', unit:'Kg',   qty:300,
      s1:{rate:1600,disc:0,basic:480000,freight:4800,gstPct:18,gstAmt:86400, total:571200,landingCost:1904},
      s2:{rate:1550,disc:2,basic:455700,freight:3000,gstPct:18,gstAmt:82026, total:540726,landingCost:1802},
      s3:{rate:1620,disc:0,basic:486000,freight:6000,gstPct:18,gstAmt:87480, total:579480,landingCost:1932},
    },
    { sl:3, desc:'Masking Tape 25mm',    unit:'Roll', qty:200,
      s1:{rate:85, disc:0,basic:17000, freight:500, gstPct:12,gstAmt:2040,  total:19540, landingCost:97.7},
      s2:{rate:80, disc:5,basic:15200, freight:300, gstPct:12,gstAmt:1824,  total:17324, landingCost:86.6},
      s3:{rate:90, disc:0,basic:18000, freight:600, gstPct:12,gstAmt:2160,  total:20760, landingCost:103.8},
    },
  ],
  remarks:'Recommend Supplier 2 (Coimbatore Spares Co.) as L1 for all items.',
}

const fmt = n => n?.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

export default function CSPrint({ cs, onClose }) {
  const data = cs || SAMPLE_CS
  const S = data.suppliers

  // Find L1 for each item
  const getL1 = (item) => {
    const costs = [item.s1.landingCost, item.s2.landingCost, item.s3.landingCost]
    return costs.indexOf(Math.min(...costs))
  }

  const thS = { padding:'6px 6px', border:'1px solid #bbb', background:'#714B67',
    color:'#fff', fontSize:9, fontWeight:700, textAlign:'center' }
  const tdS = (align='center',bg='#fff') => ({ padding:'5px 6px', border:'1px solid #ddd',
    fontSize:9, textAlign:align, background:bg, verticalAlign:'middle' })

  return (
    <PrintWrapper title={`Comparative Statement — ${data.csNo}`} onClose={onClose}>
      <div className="print-page" style={{ width:'277mm', minHeight:'190mm', padding:'10mm' }}>
        <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } }`}</style>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',
          borderBottom:'3px solid #714B67',paddingBottom:10,marginBottom:10}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:900,color:'#714B67'}}>
              {COMPANY.name}
            </div>
            <div style={{fontSize:9,color:'#555'}}>GSTIN: {COMPANY.gstin}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:800,
              color:'#714B67',letterSpacing:.5}}>PURCHASE COMPARATIVE STATEMENT</div>
            <div style={{fontSize:9,color:'#555',marginTop:3}}>
              CS No: <strong>{data.csNo}</strong> &nbsp;|&nbsp;
              Date: <strong>{data.date}</strong> &nbsp;|&nbsp;
              PR Ref: <strong>{data.prRef}</strong> &nbsp;|&nbsp;
              Dept: <strong>{data.dept}</strong>
            </div>
          </div>
          <div style={{textAlign:'right',fontSize:9,color:'#555'}}>
            <div>Prepared By: <strong>{data.preparedBy}</strong></div>
            <div>Approved By: <strong>{data.approvedBy}</strong></div>
          </div>
        </div>

        {/* Supplier info row */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}>
          <thead>
            <tr>
              <th style={{...thS,width:'18%',textAlign:'left'}}>Detail</th>
              {S.map((s,i)=>(
                <th key={i} colSpan={1} style={{...thS,background: i===1?'#196F3D':'#714B67'}}>
                  Supplier {i+1}: {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Supply Type',    S.map(s=>s.supplyType)],
              ['Quote Ref',      S.map(s=>s.quoteRef)],
              ['Quote Date',     S.map(s=>s.quoteDate)],
              ['Payment Terms',  S.map(s=>s.payTerms)],
              ['Delivery Days',  S.map(s=>s.deliveryDays+' days')],
            ].map(([label,vals])=>(
              <tr key={label}>
                <td style={{...tdS('left','#F8F9FA'),fontWeight:700,fontSize:9}}>{label}</td>
                {vals.map((v,i)=>(
                  <td key={i} style={{...tdS('center',i===1?'#F0FFF4':'#fff'),fontFamily:'DM Mono,monospace'}}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Main comparison table */}
        <table style={{width:'100%',borderCollapse:'collapse',marginBottom:10}}>
          <thead>
            <tr>
              <th style={{...thS,textAlign:'left'}} rowSpan={2}>#</th>
              <th style={{...thS,textAlign:'left'}} rowSpan={2}>Item Description</th>
              <th style={thS} rowSpan={2}>Unit</th>
              <th style={thS} rowSpan={2}>Qty</th>
              {/* Per supplier headers */}
              {S.map((s,i)=>(
                <th key={i} colSpan={6}
                  style={{...thS, background:i===1?'#196F3D':'#714B67'}}>
                  {s.name}
                </th>
              ))}
            </tr>
            <tr>
              {S.map((_,i)=>[
                'Rate','Disc%','Basic','GST','Total','L/C'
              ].map(h=>(
                <th key={i+h} style={{...thS,fontSize:8,
                  background:i===1?'#236F3D':'#5A3A56'}}>{h}</th>
              )))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item,idx)=>{
              const l1Idx = getL1(item)
              return (
                <tr key={idx} style={{background:idx%2===0?'#fff':'#FAFAFA'}}>
                  <td style={tdS()}>{item.sl}</td>
                  <td style={{...tdS('left'),fontWeight:600}}>{item.desc}</td>
                  <td style={tdS()}>{item.unit}</td>
                  <td style={{...tdS(),fontFamily:'DM Mono,monospace'}}>{item.qty}</td>
                  {[item.s1,item.s2,item.s3].map((s,si)=>{
                    const isL1 = si === l1Idx
                    const bg = isL1 ? '#E8FFF0' : (idx%2===0?'#fff':'#FAFAFA')
                    return [s.rate,s.disc>0?s.disc+'%':'—',fmt(s.basic),fmt(s.gstAmt),fmt(s.total),fmt(s.landingCost)].map((v,vi)=>(
                      <td key={si+'-'+vi} style={{...tdS('right',bg),
                        fontFamily:'DM Mono,monospace',fontSize:9,
                        fontWeight: (vi===5&&isL1)?800:400,
                        color: (vi===5&&isL1)?'#155724':'inherit',
                        border:isL1?'1px solid #C3E6CB':'1px solid #ddd'}}>
                        {vi===5&&isL1 ? <span>🏆{v}</span> : v}
                      </td>
                    ))
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Recommendation */}
        <div style={{background:'#E8FFF0',border:'1px solid #C3E6CB',
          borderRadius:4,padding:'8px 12px',marginBottom:12,fontSize:10}}>
          <strong style={{color:'#155724'}}>Recommendation:</strong> {data.remarks}
        </div>

        {/* Signatures */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',
          gap:10,borderTop:'1px solid #ddd',paddingTop:10}}>
          {['Purchase Exec','HOD — Purchase','GM / Director','Accounts','GM — Final'].map(r=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:35,borderBottom:'1px solid #333',marginBottom:3}}/>
              <div style={{fontSize:8,fontWeight:700}}>{r}</div>
              <div style={{fontSize:8,color:'#aaa'}}>Date: ________</div>
            </div>
          ))}
        </div>

      </div>
    </PrintWrapper>
  )
}
