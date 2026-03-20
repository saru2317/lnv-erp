import React from 'react'
import { useNavigate } from 'react-router-dom'

const MASTERS = [
  { group:'Item & BOM', color:'#714B67', items:[
    { to:'/mdm/items',     icon:'', label:'Item Master',         count:47,  sub:'All items, services, raw materials', sap:'MM60/MM01' },
    { to:'/mdm/bom',       icon:'', label:'Bill of Materials',   count:18,  sub:'Product structure & components',    sap:'CS01/CS03' },
    { to:'/mdm/routing',   icon:'', label:'Routing / Process',   count:12,  sub:'Operations, machines, time std.',   sap:'CA01/CA03' },
    { to:'/mdm/uom',       icon:'', label:'Unit of Measure',     count:22,  sub:'Kg, Nos, Ltr, Mtr, Set...',         sap:'CUNI'       },
    { to:'/mdm/hsn',       icon:'', label:'HSN / SAC Codes',    count:156, sub:'GST classification codes',           sap:'VK11'       },
  ]},
  { group:'Business Partners', color:'#1A5276', items:[
    { to:'/mdm/customers', icon:'', label:'Customer Master',     count:42,  sub:'All customers, Bill To, Ship To',   sap:'XD01/XD03' },
    { to:'/mdm/vendors',   icon:'', label:'Vendor Master',       count:28,  sub:'All suppliers, payment terms',      sap:'XK01/XK03' },
  ]},
  { group:'Finance Masters', color:'#196F3D', items:[
    { to:'/mdm/accounts',  icon:'', label:'Chart of Accounts',   count:84,  sub:'GL accounts, account groups',       sap:'FS00'       },
    { to:'/mdm/cost-centers',icon:'',label:'Cost Centers',       count:12,  sub:'Dept-wise cost allocation',          sap:'KS01'       },
  ]},
  { group:'Operations', color:'#784212', items:[
    { to:'/mdm/warehouse', icon:'', label:'Warehouse / Locations',count:8,  sub:'Plants, warehouses, bins',           sap:'MMBE/WM'    },
    { to:'/mdm/quality',   icon:'', label:'Quality Masters',     count:24,  sub:'Inspection plans, defect codes',    sap:'QP01'       },
    { to:'/mdm/maintenance',icon:'',label:'Maintenance Masters', count:18,  sub:'Equipment, maintenance plans',      sap:'IE01'       },
    { to:'/mdm/hr',        icon:'', label:'HR Masters',          count:32,  sub:'Pay components, grades, leave types',sap:'PA20'      },
  ]},
]

export default function MDMDashboard() {
  const navigate = useNavigate()
  const totalMasters = MASTERS.reduce((s,g)=>s+g.items.reduce((s2,i)=>s2+i.count,0),0)
  const totalTypes   = MASTERS.reduce((s,g)=>s+g.items.length,0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Master Data Management <small>MDM · Central Master Repository</small></div>
      </div>

      {/* Hero banner */}
      <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)',
        borderRadius:10,padding:'20px 24px',marginBottom:20,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:'#F5C518',marginBottom:4}}>
            LNV ERP — Master Data Management
          </div>
          <div style={{fontSize:12,color:'rgba(255,255,255,.7)'}}>
            Single source of truth for all master data · SAP-style MDM · All modules draw from here
          </div>
        </div>
        <div style={{display:'flex',gap:20}}>
          {[['Total Records',totalMasters],['Master Types',totalTypes],['Modules',6]].map(([l,v])=>(
            <div key={l} style={{textAlign:'center',background:'rgba(255,255,255,.12)',
              borderRadius:8,padding:'10px 16px'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:800,color:'#F5C518'}}>{v}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.65)'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Master groups */}
      {MASTERS.map(group => (
        <div key={group.group} style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{height:3,width:4,borderRadius:2,background:group.color}}/>
            <span style={{fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,
              color:group.color}}>{group.group}</span>
            <div style={{flex:1,height:1,background:'var(--odoo-border)'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
            {group.items.map(item => (
              <div key={item.to} onClick={() => navigate(item.to)}
                style={{background:'#fff',border:'1px solid var(--odoo-border)',
                  borderRadius:8,padding:16,cursor:'pointer',
                  borderLeft:`4px solid ${group.color}`,
                  boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                  transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,.12)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:24}}>{item.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:'var(--odoo-dark)'}}>{item.label}</div>
                      <div style={{fontSize:10,color:'var(--odoo-gray)',marginTop:1}}>{item.sub}</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:800,color:group.color}}>{item.count}</div>
                    <div style={{fontSize:9,color:'var(--odoo-gray)'}}>records</div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  paddingTop:8,borderTop:'1px solid var(--odoo-border)'}}>
                  <span style={{fontSize:10,fontFamily:'DM Mono,monospace',
                    color:'var(--odoo-gray)',background:'var(--odoo-bg)',
                    padding:'2px 6px',borderRadius:4}}>SAP: {item.sap}</span>
                  <span style={{fontSize:11,fontWeight:600,color:group.color}}>Open →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
