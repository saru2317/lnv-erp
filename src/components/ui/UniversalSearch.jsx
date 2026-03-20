import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

// ── SEARCH INDEX — all searchable items across ERP ───────
const buildSearchIndex = (userModules = []) => {
  const has = (mod) => userModules.includes(mod)

  const index = [
    // ── MODULES (always shown) ────────────────────────
    { type:'module', icon:'', label:'Home Dashboard',         sub:'Overview',                 path:'/home',             mod:'home',    keywords:['home','dashboard','overview'] },
    { type:'module', icon:'', label:'Sales (SD)',              sub:'Orders · Invoices · CRM',  path:'/sd',               mod:'sd',      keywords:['sales','sd','orders','revenue','invoice','customer'] },
    { type:'module', icon:'', label:'Purchase (MM)',           sub:'POs · Vendors · GRN',      path:'/mm',               mod:'mm',      keywords:['purchase','mm','po','vendor','grn','material'] },
    { type:'module', icon:'', label:'Warehouse (WM)',          sub:'Stock · Bins · Transfers',  path:'/wm',               mod:'wm',      keywords:['warehouse','wm','stock','inventory','bins'] },
    { type:'module', icon:'', label:'Finance (FI)',            sub:'Ledger · GST · P&L',       path:'/fi',               mod:'fi',      keywords:['finance','fi','gst','ledger','accounting','tax','itc'] },
    { type:'module', icon:'', label:'Production (PP)',         sub:'Job Orders · Coating',     path:'/pp',               mod:'pp',      keywords:['production','pp','job','coating','manufacturing'] },
    { type:'module', icon:'', label:'Quality (QM)',            sub:'Inspection · NCR',         path:'/qm',               mod:'qm',      keywords:['quality','qm','inspection','ncr','rejection'] },
    { type:'module', icon:'', label:'Maintenance (PM)',        sub:'Breakdown · PM Schedule',  path:'/pm',               mod:'pm',      keywords:['maintenance','pm','breakdown','machine','spare'] },
    { type:'module', icon:'', label:'HR (HCM)',                sub:'Employees · Payroll',      path:'/hcm',              mod:'hcm',     keywords:['hr','hcm','employee','payroll','attendance','leave'] },
    { type:'module', icon:'', label:'CRM',                     sub:'Leads · Follow-ups',       path:'/crm',              mod:'crm',     keywords:['crm','lead','customer','followup','deal'] },
    { type:'module', icon:'', label:'Transport (TM)',          sub:'Vehicles · Trips · Fuel',  path:'/tm',               mod:'tm',      keywords:['transport','tm','vehicle','trip','fuel','driver'] },
    { type:'module', icon:'', label:'Assets (AM)',             sub:'Fixed Assets · Property',  path:'/am',               mod:'am',      keywords:['asset','am','fixed asset','depreciation','property'] },
    { type:'module', icon:'', label:'Civil',                  sub:'Projects · BOQ · Bills',   path:'/civil',            mod:'civil',   keywords:['civil','project','boq','contractor','construction'] },
    { type:'module', icon:'🪪', label:'Visitor (VM)',            sub:'Entry · Gate Pass',        path:'/vm',               mod:'vm',      keywords:['visitor','vm','gate','pass','entry'] },
    { type:'module', icon:'', label:'Canteen (CN)',           sub:'Meals · Coupons',          path:'/cn',               mod:'cn',      keywords:['canteen','cn','meal','coupon','food'] },
    { type:'module', icon:'', label:'Reports & Analytics',    sub:'Sales · Finance · HR',     path:'/reports',          mod:'reports', keywords:['report','analytics','dashboard','kpi','insight'] },
    { type:'module', icon:'', label:'Config',                 sub:'Settings · Users · RBAC',  path:'/config',           mod:'config',  keywords:['config','setting','user','role','permission','rbac'] },

    // ── QUICK ACTIONS ─────────────────────────────────
    { type:'action', icon:'', label:'New Sales Order',          sub:'SD → VA01',   path:'/sd/sales/new',          mod:'sd',      keywords:['new sales order','create order','va01','so'] },
    { type:'action', icon:'', label:'New Purchase Order',       sub:'MM → ME21N',  path:'/mm/po/new',             mod:'mm',      keywords:['new purchase order','create po','me21n'] },
    { type:'action', icon:'', label:'New Purchase Indent',      sub:'MM → PR',     path:'/mm/pr/new',             mod:'mm',      keywords:['purchase indent','material requisition','pr'] },
    { type:'action', icon:'', label:'Comparative Statement',   sub:'MM → CS',     path:'/mm/cs/new',             mod:'mm',      keywords:['comparative statement','cs','quotation','vendor comparison'] },
    { type:'action', icon:'', label:'New Invoice',              sub:'SD → VF01',   path:'/sd/invoices/new',       mod:'sd',      keywords:['new invoice','create invoice','vf01','billing'] },
    { type:'action', icon:'', label:'Record GRN',              sub:'MM → MIGO',   path:'/mm/grn/new',            mod:'mm',      keywords:['grn','goods receipt','migo','receive material'] },
    { type:'action', icon:'', label:'New Journal Entry',       sub:'FI → FB50',   path:'/fi/jv/new',             mod:'fi',      keywords:['journal entry','jv','voucher','fb50'] },
    { type:'action', icon:'', label:'New Trip Booking',        sub:'TM → Booking',path:'/tm/booking',            mod:'tm',      keywords:['trip booking','vehicle booking','transport request'] },
    { type:'action', icon:'', label:'ITC Reconciliation',      sub:'FI → IRS',    path:'/fi/itc-recon',          mod:'fi',      keywords:['itc','reconciliation','gst','input tax credit','irs'] },
    { type:'action', icon:'', label:'Run Depreciation',        sub:'AM → Depr.',  path:'/am/depreciation',       mod:'am',      keywords:['depreciation','fixed asset','run depr'] },

    // ── REPORTS ───────────────────────────────────────
    { type:'report', icon:'', label:'Sales Report',            sub:'Revenue trends · Customers',  path:'/reports/sales',      mod:'reports', keywords:['sales report','revenue report','customer report'] },
    { type:'report', icon:'', label:'Purchase Report',         sub:'Vendors · POs · GRN',         path:'/reports/purchase',   mod:'reports', keywords:['purchase report','vendor report','po report'] },
    { type:'report', icon:'', label:'Inventory Report',        sub:'Stock · Aging · Reorder',     path:'/reports/inventory',  mod:'reports', keywords:['inventory report','stock report','aging'] },
    { type:'report', icon:'', label:'Production Report',       sub:'Jobs · Efficiency · WIP',     path:'/reports/production', mod:'reports', keywords:['production report','job report','efficiency'] },
    { type:'report', icon:'', label:'Profit & Loss',           sub:'FI → P&L Statement',          path:'/fi/pl',              mod:'fi',      keywords:['profit loss','p&l','pnl','income statement'] },
    { type:'report', icon:'', label:'Balance Sheet',           sub:'FI → BS',                     path:'/fi/bs',              mod:'fi',      keywords:['balance sheet','bs','assets liabilities'] },
    { type:'report', icon:'', label:'Cash Flow',               sub:'FI → CFS',                    path:'/fi/cashflow',        mod:'fi',      keywords:['cash flow','cfs','liquidity'] },
    { type:'report', icon:'', label:'GSTR-3B',                 sub:'FI → GST Return',             path:'/fi/gstr3b',          mod:'fi',      keywords:['gstr','gstr3b','gst return','filing','tax return'] },
    { type:'report', icon:'', label:'Trial Balance',           sub:'FI → TB',                     path:'/fi/trial',           mod:'fi',      keywords:['trial balance','tb','ledger summary'] },
    { type:'report', icon:'', label:'Fuel Report',             sub:'TM → Fuel Log',               path:'/tm/fuel',            mod:'tm',      keywords:['fuel report','fuel log','mileage','vehicle cost'] },
    { type:'report', icon:'', label:'HSN / SAC Summary',       sub:'FI → GST',                   path:'/fi/hsn-summary',     mod:'fi',      keywords:['hsn','sac','hsn summary','gst hsn'] },

    // ── MASTER DATA ────────────────────────────────────
    { type:'master', icon:'', label:'Customer Master',          sub:'SD → Customers',  path:'/sd/customers',          mod:'sd',      keywords:['customer','customer master','client','buyer'] },
    { type:'master', icon:'', label:'Vendor Master',            sub:'MM → Vendors',    path:'/mm/vendors',            mod:'mm',      keywords:['vendor','vendor master','supplier','seller'] },
    { type:'master', icon:'', label:'Material Master',          sub:'MM → Materials',  path:'/mm/materials',          mod:'mm',      keywords:['material','item','product','sku','material master'] },
    { type:'master', icon:'', label:'Chart of Accounts',        sub:'FI → COA',        path:'/fi/coa',                mod:'fi',      keywords:['chart of accounts','coa','ledger','account'] },
    { type:'master', icon:'', label:'Employee Master',          sub:'HCM → Employees', path:'/hcm/employees',         mod:'hcm',     keywords:['employee','staff','worker','employee master'] },
    { type:'master', icon:'', label:'Vehicle Master',           sub:'TM → Fleet',      path:'/tm/vehicles',           mod:'tm',      keywords:['vehicle','fleet','truck','van','car','lorry'] },
    { type:'master', icon:'', label:'Asset Register',           sub:'AM → Fixed Assets',path:'/am/assets',            mod:'am',      keywords:['asset register','fixed asset','fa register'] },
    { type:'master', icon:'', label:'Property Register',        sub:'AM → Property',   path:'/am/property',           mod:'am',      keywords:['property','building','land','premises'] },
    { type:'master', icon:'', label:'User Management',          sub:'Config → Users',  path:'/config/users',          mod:'config',  keywords:['user','user management','user master','login user'] },
    { type:'master', icon:'', label:'Roles & Permissions',      sub:'Config → RBAC',   path:'/config/roles',          mod:'config',  keywords:['role','permission','rbac','access control'] },
  ]

  // Filter by user's accessible modules
  return index.filter(item => has(item.mod))
}

const TYPE_CONFIG = {
  module: { label:'Modules',       color:'#714B67', bg:'#EDE0EA' },
  action: { label:'Quick Actions', color:'#00A09D', bg:'#E6F7F7' },
  report: { label:'Reports',       color:'#017E84', bg:'#D1ECF1' },
  master: { label:'Master Data',   color:'#856404', bg:'#FFF3CD' },
}

// ── RECENT SEARCHES — localStorage ──────────────────
const STORAGE_KEY = 'lnv_recent_searches'
const getRecent = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
const addRecent = (item) => {
  const recent = getRecent().filter(r => r.path !== item.path).slice(0, 4)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...recent]))
}

export default function UniversalSearch() {
  const { userModules } = useAuth()
  const navigate        = useNavigate()
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [cursor,  setCursor]  = useState(0)
  const [recent,  setRecent]  = useState(getRecent)

  const inputRef    = useRef(null)
  const dropRef     = useRef(null)
  const searchIndex = useRef(buildSearchIndex(userModules || []))

  // Re-build index when user modules change
  useEffect(() => {
    searchIndex.current = buildSearchIndex(userModules || [])
  }, [userModules])

  // Search logic
  const results = query.trim().length < 1 ? [] : (() => {
    const q = query.toLowerCase().trim()
    const scored = searchIndex.current
      .map(item => {
        const labelMatch   = item.label.toLowerCase().includes(q) ? 10 : 0
        const subMatch     = item.sub.toLowerCase().includes(q)   ? 5  : 0
        const kwMatch      = item.keywords.some(k => k.includes(q)) ? 8 : 0
        const exactLabel   = item.label.toLowerCase() === q       ? 20 : 0
        const score = labelMatch + subMatch + kwMatch + exactLabel
        return { ...item, score }
      })
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
    return scored
  })()

  // Group results
  const grouped = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  // Flat list for keyboard nav
  const flatList = results

  const handleSelect = useCallback((item) => {
    addRecent(item)
    setRecent(getRecent())
    setQuery('')
    setOpen(false)
    navigate(item.path)
  }, [navigate])

  // Keyboard navigation
  const handleKey = (e) => {
    if (!open) return
    const items = query ? flatList : recent
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(c + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const sel = items[cursor]
      if (sel) handleSelect(sel)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Global shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Reset cursor on query change
  useEffect(() => { setCursor(0) }, [query])

  const highlight = (text, q) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background:'#F5C518', color:'#000', borderRadius:2, padding:'0 2px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  let flatIdx = 0

  return (
    <div style={{ flex:1, maxWidth:440, margin:'0 8px', position:'relative' }}>
      {/* Input */}
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
          color:'rgba(255,255,255,.55)', fontSize:13, pointerEvents:'none' }}></span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Search modules, actions, reports…  Ctrl+K"
          style={{
            width:'100%', padding:'7px 36px 7px 34px',
            background: open ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.12)',
            border:`1px solid ${open ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.18)'}`,
            borderRadius:5, color:'#fff', fontFamily:'DM Sans,sans-serif',
            fontSize:12, outline:'none', transition:'all .2s', boxSizing:'border-box',
          }}
        />
        {query && (
          <span onClick={() => { setQuery(''); inputRef.current?.focus() }}
            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
              cursor:'pointer', color:'rgba(255,255,255,.6)', fontSize:14, userSelect:'none' }}>
            
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div ref={dropRef}
          style={{
            position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:9999,
            background:'#fff', borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,.22)',
            border:'1px solid var(--odoo-border)', overflow:'hidden', maxHeight:480, overflowY:'auto',
          }}>

          {/* No query — show recent + shortcuts */}
          {!query && (
            <>
              {recent.length > 0 && (
                <>
                  <div style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:700,
                    color:'var(--odoo-gray)', textTransform:'uppercase', letterSpacing:1,
                    borderBottom:'1px solid var(--odoo-border)', background:'#F8F9FA' }}>
                     Recent
                  </div>
                  {recent.map((item, i) => (
                    <div key={item.path}
                      onClick={() => handleSelect(item)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                        cursor:'pointer', borderBottom:'1px solid var(--odoo-border)',
                        background: cursor === i ? '#EDE0EA' : '#fff', transition:'background .1s' }}
                      onMouseEnter={() => setCursor(i)}>
                      <span style={{ fontSize:18, width:22, textAlign:'center' }}>{item.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--odoo-dark)' }}>{item.label}</div>
                        <div style={{ fontSize:10, color:'var(--odoo-gray)' }}>{item.sub}</div>
                      </div>
                      <span style={{ fontSize:9, padding:'2px 6px', borderRadius:8,
                        background: TYPE_CONFIG[item.type]?.bg, color: TYPE_CONFIG[item.type]?.color,
                        fontWeight:700, textTransform:'uppercase' }}>
                        {item.type}
                      </span>
                    </div>
                  ))}
                </>
              )}
              <div style={{ padding:'10px 14px', background:'#F8F9FA',
                borderTop:'1px solid var(--odoo-border)' }}>
                <div style={{ fontSize:10, color:'var(--odoo-gray)', marginBottom:6, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:1 }}>Keyboard shortcuts</div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  {[['↑↓','Navigate'],['↵','Open'],['Esc','Close'],['Ctrl+K','Focus']].map(([k,l]) => (
                    <span key={k} style={{ fontSize:11, color:'var(--odoo-gray)' }}>
                      <kbd style={{ background:'#E9ECEF', border:'1px solid #CED4DA',
                        borderRadius:3, padding:'1px 5px', fontSize:10, fontFamily:'monospace' }}>{k}</kbd>
                      &nbsp;{l}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Results */}
          {query && results.length === 0 && (
            <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--odoo-gray)' }}>
              <div style={{ fontSize:32, marginBottom:8 }}></div>
              <div style={{ fontSize:13, fontWeight:600 }}>No results for "{query}"</div>
              <div style={{ fontSize:11, marginTop:4 }}>Try searching module names, actions, or report names</div>
            </div>
          )}

          {query && results.length > 0 && (
            <>
              {Object.entries(grouped).map(([type, items]) => {
                const tc = TYPE_CONFIG[type]
                return (
                  <React.Fragment key={type}>
                    {/* Group header */}
                    <div style={{ padding:'7px 14px 4px', fontSize:10, fontWeight:700,
                      color: tc.color, textTransform:'uppercase', letterSpacing:1,
                      background:'#F8F9FA', borderBottom:'1px solid var(--odoo-border)',
                      display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:6, height:6, borderRadius:2, background:tc.color }} />
                      {tc.label}
                      <span style={{ fontSize:9, padding:'1px 5px', borderRadius:8,
                        background:tc.bg, color:tc.color, fontWeight:700 }}>
                        {items.length}
                      </span>
                    </div>
                    {/* Items */}
                    {items.map(item => {
                      const idx = flatIdx++
                      return (
                        <div key={item.path}
                          onClick={() => handleSelect(item)}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                            cursor:'pointer', borderBottom:'1px solid var(--odoo-border)',
                            background: cursor === idx ? tc.bg : '#fff', transition:'background .1s' }}
                          onMouseEnter={() => setCursor(idx)}>
                          <div style={{ width:32, height:32, borderRadius:7, background:tc.bg,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:16, flexShrink:0 }}>
                            {item.icon}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:600, color:'var(--odoo-dark)' }}>
                              {highlight(item.label, query)}
                            </div>
                            <div style={{ fontSize:10, color:'var(--odoo-gray)' }}>{item.sub}</div>
                          </div>
                          <div style={{ flexShrink:0, textAlign:'right' }}>
                            <div style={{ fontSize:9, fontFamily:'DM Mono,monospace',
                              color:'var(--odoo-gray)', padding:'2px 6px', borderRadius:4,
                              background:'#F0F0F0', border:'1px solid #E0E0E0' }}>
                              {item.path}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </React.Fragment>
                )
              })}
              <div style={{ padding:'8px 14px', background:'#F8F9FA',
                borderTop:'1px solid var(--odoo-border)', fontSize:10, color:'var(--odoo-gray)',
                textAlign:'center' }}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
