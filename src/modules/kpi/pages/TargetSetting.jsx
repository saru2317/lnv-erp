import React, { useState } from 'react'
import { KPI_MASTER_DEFAULT, MONTHS_FY } from './_kpiData'

export default function TargetSetting({ kpiMaster }) {
  const master = kpiMaster || KPI_MASTER_DEFAULT
  const [targets, setTargets] = useState({})

  const getTgt = (code, month) => targets[`${code}_${month}`] ?? master.find(k=>k.code===code)?.tgt ?? ''
  const setTgt = (code, month, val) => setTargets(t=>({...t,[`${code}_${month}`]:parseFloat(val)||0}))

  const inp = {width:'100%',padding:'3px 5px',border:'1px solid var(--odoo-border)',borderRadius:3,
    fontFamily:'DM Mono,monospace',fontSize:10,textAlign:'right',outline:'none',background:'#FFFDE7',boxSizing:'border-box'}

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Annual Target Setting <small>Monthly targets per KPI — FY 2025-26</small></div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">💾 Save Targets</button></div>
      </div>
      <div style={{overflowX:'auto',background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:1200}}>
          <thead>
            <tr style={{background:'#714B67'}}>
              <th style={{padding:'9px 12px',color:'#fff',fontSize:10,fontWeight:700,textAlign:'left',border:'1px solid #5A3A56',minWidth:60}}>KPI</th>
              <th style={{padding:'9px 12px',color:'#fff',fontSize:10,fontWeight:700,textAlign:'left',border:'1px solid #5A3A56',minWidth:200}}>Description</th>
              <th style={{padding:'9px 12px',color:'#fff',fontSize:10,fontWeight:700,textAlign:'center',border:'1px solid #5A3A56',minWidth:40}}>UoM</th>
              <th style={{padding:'9px 12px',color:'#fff',fontSize:10,fontWeight:700,textAlign:'center',border:'1px solid #5A3A56',minWidth:35}}>Wt</th>
              {MONTHS_FY.map(m=><th key={m} style={{padding:'9px 10px',color:'#fff',fontSize:10,fontWeight:700,textAlign:'center',border:'1px solid #5A3A56',minWidth:65}}>{m}</th>)}
              <th style={{padding:'9px 12px',color:'#F5C518',fontSize:10,fontWeight:700,textAlign:'center',border:'1px solid #5A3A56',minWidth:80,background:'#4A3050'}}>Annual Tgt</th>
            </tr>
          </thead>
          <tbody>
            {master.map((k,i)=>(
              <tr key={k.code} style={{background:i%2===0?'#fff':'#FAFAFA',borderBottom:'1px solid var(--odoo-border)'}}>
                <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace',fontWeight:700,color:k.cat==='Major'?'var(--odoo-purple)':'#1A5276',fontSize:11}}>{k.code}</td>
                <td style={{padding:'6px 10px',fontSize:11,fontWeight:600}}>{k.desc}</td>
                <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace',textAlign:'center',fontSize:11}}>{k.uom}</td>
                <td style={{padding:'6px 10px',textAlign:'center',fontWeight:800,color:'var(--odoo-purple)'}}>{k.wt||'—'}</td>
                {MONTHS_FY.map(m=>(
                  <td key={m} style={{padding:'3px 5px'}}>
                    <input type="number" step="0.01" value={getTgt(k.code,m)} onChange={e=>setTgt(k.code,m,e.target.value)} style={inp}/>
                  </td>
                ))}
                <td style={{padding:'6px 10px',fontFamily:'DM Mono,monospace',textAlign:'center',fontWeight:700,color:'var(--odoo-purple)',background:'#EDE0EA'}}>{k.tgt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
