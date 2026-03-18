import React from 'react'
import PrintWrapper from './PrintWrapper'
import { CO, TH, TD } from './_printUtils'
const SAMPLE={woNo:'WO-2026-088',date:'17 Mar 2026',type:'Preventive',priority:'High',
  machine:'Powder Coat Conveyor — Line 2',machineCode:'MCH-PC-002',location:'Production Floor',
  dueDate:'20 Mar 2026',startDate:'',endDate:'',technician:'Maintenance Team',
  desc:'Quarterly preventive maintenance — conveyor chain lubrication and tension adjustment',
  tasks:[
    {sl:1,task:'Check and lubricate conveyor chain',  tools:'Grease gun, Chain lubricant',spares:'—',         duration:'45 min',status:''},
    {sl:2,task:'Inspect and adjust chain tension',    tools:'Tension gauge, Spanners',  spares:'—',         duration:'30 min',status:''},
    {sl:3,task:'Check drive motor current',           tools:'Clamp meter',              spares:'—',         duration:'15 min',status:''},
    {sl:4,task:'Replace drive chain (if worn)',        tools:'Chain breaker',            spares:'Drive chain — 1 no',duration:'60 min',status:''},
    {sl:5,task:'Clean and inspect oven burners',      tools:'Wire brush, Inspection kit',spares:'Nozzle set',duration:'45 min',status:''},
  ],
  sparesReq:[
    {code:'SP-MC-001',desc:'Drive Chain',uom:'No.',reqQty:1,issuedQty:''},
    {code:'SP-MC-002',desc:'Bearing 6205-2RS',uom:'No.',reqQty:2,issuedQty:''},
  ],
  remarks:'Machine should not run during maintenance. Lock-out tag-out (LOTO) to be followed.',
  preparedBy:'Maintenance Engineer',approvedBy:'PM Manager',
}
export default function MaintenanceWOPrint({wo,onClose}){
  const d=wo||SAMPLE
  return(
    <PrintWrapper title={`Work Order — ${d.woNo}`} onClose={onClose}>
      <div className="print-page">
        <div style={{display:'flex',justifyContent:'space-between',borderBottom:'3px solid #117A65',paddingBottom:12,marginBottom:12}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:900,color:'#117A65'}}>{CO.name}</div>
            <div style={{fontSize:9.5,color:'#555',marginTop:3}}>{CO.addr}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{background:'#117A65',color:'#fff',padding:'6px 16px',borderRadius:'6px 6px 0 0',fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:800}}>MAINTENANCE WORK ORDER</div>
            <div style={{border:'1px solid #117A65',borderTop:'none',padding:'8px 12px',borderRadius:'0 0 6px 6px',lineHeight:1.8}}>
              <div><b style={{fontFamily:'DM Mono,monospace',color:'#117A65'}}>{d.woNo}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Date: </span><b>{d.date}</b></div>
              <div><span style={{fontSize:9,color:'#555'}}>Type: </span>
                <span style={{padding:'1px 7px',borderRadius:8,fontSize:9,fontWeight:700,background:'#D4EDDA',color:'#155724'}}>{d.type}</span></div>
              <div><span style={{fontSize:9,color:'#555'}}>Priority: </span>
                <span style={{padding:'1px 7px',borderRadius:8,fontSize:9,fontWeight:700,background:d.priority==='High'?'#F8D7DA':'#FFF3CD',color:d.priority==='High'?'#721C24':'#856404'}}>{d.priority}</span></div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
          {[['Machine',d.machine],['Machine Code',d.machineCode],['Location',d.location],['Due Date',d.dueDate],['Technician',d.technician],['Description',d.desc]].map(([k,v])=>(
            <div key={k} style={{border:'1px solid #ddd',borderRadius:3,padding:'6px 8px',gridColumn:k==='Description'?'1/-1':'auto'}}>
              <div style={{fontSize:8,color:'#888',textTransform:'uppercase'}}>{k}</div>
              <div style={{fontWeight:600,fontSize:10,marginTop:1}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Tasks */}
        <div style={{marginBottom:12}}>
          <div style={{padding:'6px 10px',background:'#117A65',color:'#fff',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,borderRadius:'4px 4px 0 0'}}>Maintenance Tasks</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['#','Task Description','Tools Required','Spare Parts','Est. Time','Done','Sign'].map(h=><th key={h} style={TH('#117A65')}>{h}</th>)}</tr></thead>
            <tbody>{d.tasks.map((t,i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#F0FFF8'}}>
                <td style={TD()}>{t.sl}</td>
                <td style={{...TD('left'),fontWeight:600}}>{t.task}</td>
                <td style={{...TD('left'),fontSize:9}}>{t.tools}</td>
                <td style={{...TD('left'),fontSize:9,color:t.spares==='—'?'#ccc':'#333'}}>{t.spares}</td>
                <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9,whiteSpace:'nowrap'}}>{t.duration}</td>
                <td style={{...TD(),minWidth:50}}><div style={{width:16,height:16,border:'1.5px solid #333',borderRadius:3,margin:'0 auto'}}/></td>
                <td style={{...TD(),minWidth:60}}></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {/* Spares */}
        {d.sparesReq.length>0&&(
          <div style={{marginBottom:12}}>
            <div style={{padding:'6px 10px',background:'#1A5276',color:'#fff',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,borderRadius:'4px 4px 0 0'}}>Spare Parts Required</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Code','Description','UOM','Required Qty','Issued Qty','Store Sign'].map(h=><th key={h} style={TH('#1A5276')}>{h}</th>)}</tr></thead>
              <tbody>{d.sparesReq.map((s,i)=>(
                <tr key={i} style={{background:i%2===0?'#fff':'#EBF2F8'}}>
                  <td style={{...TD(),fontFamily:'DM Mono,monospace',fontSize:9}}>{s.code}</td>
                  <td style={{...TD('left'),fontWeight:600}}>{s.desc}</td>
                  <td style={TD()}>{s.uom}</td>
                  <td style={{...TD(),fontFamily:'DM Mono,monospace',fontWeight:700}}>{s.reqQty}</td>
                  <td style={{...TD(),background:'#FFFDE7',minWidth:80}}></td>
                  <td style={{...TD(),minWidth:80}}></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <div style={{border:'1px solid #ddd',borderRadius:4,padding:'7px 10px',fontSize:10,marginBottom:12}}><b style={{color:'#117A65'}}>Remarks / Safety Instructions: </b>{d.remarks}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,borderTop:'1px solid #ddd',paddingTop:12}}>
          {[['Prepared By',d.preparedBy],['Approved By',d.approvedBy],['Technician',''],['HOD — Maintenance','']].map(([r,n])=>(
            <div key={r} style={{textAlign:'center'}}>
              <div style={{height:38,borderBottom:'1px solid #333',marginBottom:3}}/>
              <div style={{fontSize:9,fontWeight:700}}>{n||'Signature'}</div>
              <div style={{fontSize:8,color:'#555'}}>{r}</div>
            </div>
          ))}
        </div>
      </div>
    </PrintWrapper>
  )
}
