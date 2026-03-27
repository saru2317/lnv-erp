import React from 'react'
import { useNavigate } from 'react-router-dom'
import { COMPANY, USERS, ROLES, NUMBER_SERIES, FISCAL_YEARS, TAX_RATES, BRANCHES } from './_configData'

const SECTIONS = [
  { icon:'▸', title:'Company Profile',    sub:'Legal name, GST, address, logo',       to:'/config/company',        color:'#714B67', status:'Configured' },
  { icon:'▸', title:'Branches',           sub:`${BRANCHES.length} branches configured`, to:'/config/branches',      color:'#1A5276', status:'Configured' },
  { icon:'▸', title:'Users & Access',     sub:`${USERS.length} users · ${ROLES.length} roles`, to:'/config/users', color:'#196F3D', status:'Configured' },
  { icon:'▸', title:'Roles & Permissions',sub:'RBAC — module-level access control',   to:'/config/roles',          color:'#C0392B', status:'Configured' },
  { icon:'▸', title:'Number Series',      sub:`${NUMBER_SERIES.length} document series`, to:'/config/number-series',color:'#784212', status:'Configured' },
  { icon:'▸', title:'Fiscal Years',       sub:`${FISCAL_YEARS.filter(f=>f.status==='Active').length} active FY`, to:'/config/fiscal-year', color:'#6C3483', status:'Configured' },
  { icon:'▸', title:'Tax & GST Config',   sub:`${TAX_RATES.length} tax rates configured`, to:'/config/tax',         color:'#117A65', status:'Configured' },
  { icon:'▸', title:'Currency',           sub:'INR base · 4 active currencies',       to:'/config/currency',       color:'#1F618D', status:'Configured' },
  { icon:'▸', title:'Email Settings',     sub:'SMTP · Templates · Triggers',          to:'/config/email',          color:'#E65100', status:'Connected'  },
  { icon:'▸', title:'Print Templates',   sub:'Invoice · PO · Pay slip · Labels',     to:'/config/print',          color:'#4D5656', status:'Configured' },
  { icon:'▸', title:'Session & Security', sub:'Active sessions · Password policy',    to:'/config/security',       color:'#B7950B', status:'Active'      },
  { icon:'▸', title:'Audit Log',          sub:'All system changes tracked',           to:'/config/audit',          color:'#717D7E', status:'Running'     },
]

export default function ConfigDashboard() {
  const nav = useNavigate()

  const activeUsers   = USERS.filter(u => u.status === 'Active').length
  const activeFY      = FISCAL_YEARS.find(f => f.status === 'Active')
  const activeSessions= 3

  return (
    <div>
      {/* Company banner */}
      <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'16px 20px',
        background:'linear-gradient(135deg, var(--odoo-purple), #875A7B)',
        borderRadius:'12px', marginBottom:'20px', color:'#fff' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'12px', background:'rgba(255,255,255,.2)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:'900', fontFamily:'Syne,sans-serif' }}>
          {COMPANY.shortName}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:'800', fontSize:'18px' }}>{COMPANY.name}</div>
          <div style={{ fontSize:'12px', opacity:.85, marginTop:'2px' }}>
            GSTIN: {COMPANY.gstin} &nbsp;·&nbsp; {COMPANY.city}, {COMPANY.state} &nbsp;·&nbsp; {COMPANY.industry}
          </div>
        </div>
        <div style={{ display:'flex', gap:'20px', textAlign:'center' }}>
          {[
            ['Active Users', activeUsers],
            ['Active FY', activeFY?.label.replace('FY ','') || '—'],
            ['Sessions Now', activeSessions],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontWeight:'900', fontSize:'20px' }}>{v}</div>
              <div style={{ fontSize:'10px', opacity:.8 }}>{l}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-s" onClick={() => nav('/config/company')}
          style={{ background:'rgba(255,255,255,.2)', color:'#fff', border:'1px solid rgba(255,255,255,.3)' }}>
           Edit Profile
        </button>
      </div>

      {/* Section grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'12px' }}>
        {SECTIONS.map(s => (
          <div key={s.to} onClick={() => nav(s.to)}
            style={{ padding:'16px', background:'#fff', borderRadius:'10px', cursor:'pointer',
              border:'1px solid var(--odoo-border)', transition:'all .15s',
              borderLeft:`4px solid ${s.color}` }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
              <span style={{ fontSize:'22px' }}>{s.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:'800', fontSize:'13px' }}>{s.title}</div>
                <div style={{ fontSize:'11px', color:'var(--odoo-gray)', marginTop:'1px' }}>{s.sub}</div>
              </div>
              <span style={{ fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'8px',
                background: s.status==='Configured'?'#E8F5E9':s.status==='Connected'?'#E3F2FD':s.status==='Active'?'#E3F2FD':'#FFF3E0',
                color: s.status==='Configured'?'#2E7D32':s.status==='Connected'?'#1565C0':s.status==='Active'?'#1565C0':'#E65100' }}>
                ● {s.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
