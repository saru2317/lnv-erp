import React, { useState } from 'react'

// ── SEC 17(5) BLOCKED CREDIT CATEGORIES ──────────────
const BLOCKED_CATEGORIES = [
  'Motor Vehicle (Personal)', 'Food & Beverages', 'Beauty/Health Services',
  'Club Membership', 'Rent-a-cab', 'Life Insurance/Health Insurance',
  'Works Contract (Immovable Property)', 'Construction Material',
  'Personal Consumption', 'Composition Dealer Purchase',
]

// ── DEMO INVOICES WITH ELIGIBILITY STATUS ────────────
const INVOICES = [
  { id:'GRN-2026-031', vendor:'Lakshmi Textile Mills',   gstin:'33AABLM9234B1Z6', date:'05 Mar', txbl:176271,  cgst:10576, sgst:10576, igst:0,    total:21152,  cat:'Raw Material',       eligible:'full',    recon:'matched',   suppFiled:true  },
  { id:'GRN-2026-032', vendor:'Coimbatore Spares Co.',   gstin:'33AABCC2341B1Z1', date:'08 Mar', txbl:75000,   cgst:6750,  sgst:6750,  igst:0,    total:13500,  cat:'Consumables',        eligible:'full',    recon:'matched',   suppFiled:true  },
  { id:'GRN-2026-033', vendor:'Aruna Industries',        gstin:'33AABCA5631B1Z2', date:'10 Mar', txbl:41102,   cgst:3699,  sgst:3699,  igst:0,    total:7398,   cat:'Packing Material',   eligible:'full',    recon:'unmatched', suppFiled:false },
  { id:'GRN-2026-034', vendor:'Chennai Logistics',       gstin:'33AABCL7892B1Z3', date:'12 Mar', txbl:18000,   cgst:1620,  sgst:1620,  igst:0,    total:3240,   cat:'Freight',            eligible:'full',    recon:'matched',   suppFiled:true  },
  { id:'GRN-2026-035', vendor:'Office Canteen Supplies', gstin:'33AABCO1234B1Z4', date:'14 Mar', txbl:12000,   cgst:1080,  sgst:1080,  igst:0,    total:2160,   cat:'Food & Beverages',   eligible:'blocked', recon:'blocked',   suppFiled:true  },
  { id:'GRN-2026-036', vendor:'Velocity Motors',         gstin:'33AABCV5678B1Z5', date:'15 Mar', txbl:850000,  cgst:76500, sgst:76500, igst:0,    total:153000, cat:'Motor Vehicle',      eligible:'blocked', recon:'blocked',   suppFiled:true  },
  { id:'GRN-2026-037', vendor:'Rajesh Chemicals',        gstin:'33AABCR3456B1Z6', date:'16 Mar', txbl:95000,   cgst:8550,  sgst:8550,  igst:0,    total:17100,  cat:'Chemicals',          eligible:'full',    recon:'missing',   suppFiled:false },
  { id:'GRN-2026-038', vendor:'Inter-State Vendor Ltd',  gstin:'27AABCI7890B1Z7', date:'17 Mar', txbl:220000,  cgst:0,     sgst:0,     igst:39600,total:39600,  cat:'Raw Material',       eligible:'full',    recon:'matched',   suppFiled:true  },
  { id:'GRN-2026-039', vendor:'Health Plus Gym',         gstin:'33AABCH2345B1Z8', date:'18 Mar', txbl:24000,   cgst:2160,  sgst:2160,  igst:0,    total:4320,   cat:'Health Services',    eligible:'blocked', recon:'blocked',   suppFiled:true  },
  { id:'GRN-2026-040', vendor:'Capital Machinery Co.',   gstin:'33AABCM6789B1Z9', date:'20 Mar', txbl:580000,  cgst:52200, sgst:52200, igst:0,    total:104400, cat:'Capital Goods',      eligible:'full',    recon:'matched',   suppFiled:true  },
]

const STATUS_CONFIG = {
  matched:   { label:' Matched',    bg:'#D4EDDA', color:'#155724', desc:'In books + GSTR-2B' },
  unmatched: { label:' Unmatched',  bg:'#FFF3CD', color:'#856404', desc:'Supplier not filed yet' },
  missing:   { label:' Missing',    bg:'#F8D7DA', color:'#721C24', desc:'In books, not in 2B' },
  blocked:   { label:' Blocked',    bg:'#E2E3E5', color:'#383D41', desc:'Sec 17(5) — ineligible' },
}

const ELIG_CONFIG = {
  full:    { label:' Full ITC',    bg:'#D4EDDA', color:'#155724' },
  partial: { label:' Partial',    bg:'#FFF3CD', color:'#856404' },
  blocked: { label:' Blocked',    bg:'#F8D7DA', color:'#721C24' },
}

function fmt(n) { return '₹' + n.toLocaleString('en-IN') }

export default function ITCReconciliation() {
  const [activeTab, setActiveTab]   = useState('reconciliation')
  const [filterRecon, setFilterRecon] = useState('all')
  const [showPrefiling, setShowPrefiling] = useState(false)

  const filtered = INVOICES.filter(i => filterRecon === 'all' || i.recon === filterRecon)

  // Aggregates
  const eligibleInvoices  = INVOICES.filter(i => i.eligible === 'full' && i.recon === 'matched')
  const blockedInvoices   = INVOICES.filter(i => i.eligible === 'blocked')
  const unmatchedInvoices = INVOICES.filter(i => i.recon === 'unmatched' || i.recon === 'missing')

  const totalITC     = INVOICES.filter(i=>i.eligible==='full').reduce((s,i)=>s+i.total,0)
  const eligibleITC  = eligibleInvoices.reduce((s,i)=>s+i.total,0)
  const blockedITC   = blockedInvoices.reduce((s,i)=>s+i.total,0)
  const heldITC      = unmatchedInvoices.filter(i=>i.eligible==='full').reduce((s,i)=>s+i.total,0)

  const prefilingChecks = [
    { ok: true,  label:'GSTIN validated for all vendors' },
    { ok: true,  label:'GSTR-2B downloaded and matched' },
    { ok: false, label:`${unmatchedInvoices.length} invoices unmatched — follow up with suppliers` },
    { ok: true,  label:'Blocked credits (Sec 17(5)) identified and excluded' },
    { ok: false, label:'GRN-2026-037 missing in GSTR-2B — do not claim' },
    { ok: true,  label:'Capital goods ITC spread correctly (if applicable)' },
    { ok: true,  label:'RCM liability computed and paid' },
    { ok: true,  label:'Credit notes reconciled' },
    { ok: false, label:'2 supplier invoices GSTIN mismatch — verify before claiming' },
    { ok: true,  label:'Opening ITC balance from last period verified' },
  ]

  const tabs = [
    { key:'reconciliation', label:' ITC Reconciliation' },
    { key:'eligibility',    label:' Eligibility Rules' },
    { key:'prefiling',      label:' Pre-Filing Checklist' },
    { key:'summary',        label:' Filing Summary' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          ITC Reconciliation System
          <small>Invoice Reconciliation · GST Compliance · Mar 2026</small>
        </div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select">
            <option>Mar 2026</option><option>Feb 2026</option><option>Jan 2026</option>
          </select>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => setShowPrefiling(true)}>Pre-Filing Check</button>
        </div>
      </div>

      {/* Alert */}
      <div className="fi-alert warn" style={{marginBottom:16}}>
         <strong>Important:</strong> Only invoices that are <strong>Eligible + Matched in GSTR-2B</strong> should be claimed as ITC in GSTR-3B. Blocked credits (Sec 17(5)) must never be claimed.
      </div>

      {/* KPI Cards */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        {[
          { cls:'green',  label:'Eligible ITC (Claimable)',  val:fmt(eligibleITC),  sub:`${eligibleInvoices.length} matched invoices` },
          { cls:'orange', label:'ITC on Hold',               val:fmt(heldITC),      sub:`${unmatchedInvoices.length} unmatched — wait` },
          { cls:'red',    label:'Blocked Credits (Sec 17(5))',val:fmt(blockedITC),  sub:`${blockedInvoices.length} invoices — never claim` },
          { cls:'purple', label:'Total ITC Available',       val:fmt(totalITC),     sub:'Before blocked & unmatched' },
        ].map(k => (
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', borderBottom:'2px solid var(--odoo-border)', marginBottom:20, gap:0}}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
              color: activeTab===t.key ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
              borderBottom: activeTab===t.key ? '2px solid var(--odoo-purple)' : '2px solid transparent',
              marginBottom:-2, transition:'all .15s' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── TAB: RECONCILIATION ── */}
      {activeTab === 'reconciliation' && (
        <div>
          {/* Filter */}
          <div style={{display:'flex', gap:8, marginBottom:14, flexWrap:'wrap'}}>
            {[['all','All'],['matched',' Matched'],['unmatched',' Unmatched'],['missing',' Missing'],['blocked',' Blocked']].map(([k,l]) => (
              <button key={k} onClick={() => setFilterRecon(k)}
                style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                  cursor:'pointer', transition:'all .15s', border:'1px solid var(--odoo-border)',
                  background: filterRecon===k ? 'var(--odoo-purple)' : '#fff',
                  color: filterRecon===k ? '#fff' : 'var(--odoo-gray)' }}>
                {l} {k!=='all' ? `(${INVOICES.filter(i=>i.recon===k).length})` : `(${INVOICES.length})`}
              </button>
            ))}
          </div>

          <table className="fi-data-table">
            <thead>
              <tr>
                <th>GRN / Inv No.</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Taxable</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Total ITC</th>
                <th>ITC Eligibility</th>
                <th>Supp. Filed?</th>
                <th>Recon Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const ec = ELIG_CONFIG[inv.eligible]
                const rc = STATUS_CONFIG[inv.recon]
                return (
                  <tr key={inv.id} style={{ opacity: inv.recon==='blocked' ? 0.7 : 1 }}>
                    <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{inv.id}</strong></td>
                    <td>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--odoo-dark)'}}>{inv.vendor}</div>
                      <div style={{fontSize:10,color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace'}}>{inv.gstin}</div>
                    </td>
                    <td style={{fontSize:12}}>{inv.cat}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{fmt(inv.txbl)}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-green)'}}>{inv.cgst>0?fmt(inv.cgst):'—'}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-green)'}}>{inv.sgst>0?fmt(inv.sgst):'—'}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-blue)'}}>{inv.igst>0?fmt(inv.igst):'—'}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:13,fontWeight:700,
                      color: inv.eligible==='blocked' ? 'var(--odoo-red)' : 'var(--odoo-dark)',
                      textDecoration: inv.eligible==='blocked' ? 'line-through' : 'none'
                    }}>{fmt(inv.total)}</td>
                    <td>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                        background:ec.bg,color:ec.color}}>{ec.label}</span>
                    </td>
                    <td style={{textAlign:'center'}}>
                      {inv.suppFiled
                        ? <span style={{color:'var(--odoo-green)',fontWeight:700,fontSize:13}}></span>
                        : <span style={{color:'var(--odoo-red)',fontWeight:700,fontSize:13}}></span>}
                    </td>
                    <td>
                      <div>
                        <span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                          background:rc.bg,color:rc.color}}>{rc.label}</span>
                        <div style={{fontSize:10,color:'var(--odoo-gray)',marginTop:2}}>{rc.desc}</div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: ELIGIBILITY RULES ── */}
      {activeTab === 'eligibility' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Eligible */}
            <div style={{background:'#fff',borderRadius:8,border:'2px solid #00A09D',padding:18}}>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,color:'#00A09D',marginBottom:14}}>
                 ELIGIBLE for ITC
              </h3>
              {[
                ['Raw Materials','Used directly in manufacturing'],
                ['Capital Goods','Machinery, equipment for business'],
                ['Input Services','Consulting, legal, IT services for business'],
                ['Freight / Logistics','For business goods movement'],
                ['Office Supplies','Stationery, printing for business'],
                ['Professional Services','CA, legal, audit fees'],
                ['Repair & Maintenance','Plant & machinery maintenance'],
                ['Software / IT Tools','For business operations'],
              ].map(([t,d]) => (
                <div key={t} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'7px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                  <span style={{color:'#00A09D',fontWeight:700,fontSize:14,marginTop:1}}></span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--odoo-dark)'}}>{t}</div>
                    <div style={{fontSize:11,color:'var(--odoo-gray)'}}>{d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Blocked */}
            <div style={{background:'#fff',borderRadius:8,border:'2px solid #D9534F',padding:18}}>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,color:'#D9534F',marginBottom:6}}>
                 BLOCKED Credits — Section 17(5)
              </h3>
              <div style={{fontSize:11,background:'#FDF0EA',padding:'6px 10px',borderRadius:4,marginBottom:12,color:'#C0392B'}}>
                 Claiming these = GST notice + penalty + interest
              </div>
              {BLOCKED_CATEGORIES.map(cat => (
                <div key={cat} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                  <span style={{color:'#D9534F',fontWeight:700,fontSize:14}}></span>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--odoo-dark)'}}>{cat}</div>
                </div>
              ))}
            </div>

            {/* Partial */}
            <div style={{background:'#fff',borderRadius:8,border:'2px solid #E06F39',padding:18,gridColumn:'1/-1'}}>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,color:'#E06F39',marginBottom:14}}>
                 PARTIAL ITC — Only eligible portion claimable
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[
                  ['Motor Vehicle (Business Use)','50% ITC allowed if used for both personal & business'],
                  ['Works Contract Service','ITC allowed if used for further supply of works contract'],
                  ['Input Service Distribution','ISD credit distributed proportionally to branches'],
                ].map(([t,d]) => (
                  <div key={t} style={{padding:12,background:'#FEF8E6',borderRadius:6,border:'1px solid #FAD7A0'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#856404',marginBottom:4}}>{t}</div>
                    <div style={{fontSize:11,color:'var(--odoo-gray)'}}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PRE-FILING CHECKLIST ── */}
      {activeTab === 'prefiling' && (
        <div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:20,marginBottom:16}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:15,marginBottom:16}}>
               Pre-Filing Validation Checklist — Mar 2026
            </h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {prefilingChecks.map((c,i) => (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:12,
                  borderRadius:6, background: c.ok ? '#F0FFF4' : '#FFF3CD',
                  border: `1px solid ${c.ok ? '#C3E6CB' : '#FAD7A0'}`}}>
                  <span style={{fontSize:18,flexShrink:0}}>{c.ok ? '' : ''}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color: c.ok ? '#155724' : '#856404'}}>{c.label}</div>
                    {!c.ok && <div style={{fontSize:11,color:'#856404',marginTop:3}}>Action required before filing</div>}
                  </div>
                  <div style={{marginLeft:'auto',fontSize:11,fontWeight:700,
                    color: c.ok ? '#155724' : '#E06F39',
                    padding:'2px 10px',borderRadius:10,
                    background: c.ok ? '#D4EDDA' : '#FEF8E6',
                    border:`1px solid ${c.ok?'#C3E6CB':'#FAD7A0'}`,
                    flexShrink:0}}>
                    {c.ok ? 'PASS' : 'ACTION NEEDED'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:14,background:'#EDE0EA',borderRadius:8}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:13,fontWeight:700,color:'var(--odoo-purple)',marginBottom:4}}>
                 Checklist Summary
              </div>
              <div style={{display:'flex',gap:20,fontSize:13}}>
                <span style={{color:'#155724',fontWeight:600}}>Pass: {prefilingChecks.filter(c=>c.ok).length}</span>
                <span style={{color:'#856404',fontWeight:600}}> Actions: {prefilingChecks.filter(c=>!c.ok).length}</span>
                <span style={{color:'var(--odoo-purple)',fontWeight:700}}>
                  {prefilingChecks.filter(c=>!c.ok).length === 0 ? '🟢 READY TO FILE' : ' NOT READY — Resolve pending items'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: FILING SUMMARY ── */}
      {activeTab === 'summary' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* ITC breakdown */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:18}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,marginBottom:16}}>ITC Filing Summary</h3>
            {[
              ['Total ITC in Books',         fmt(totalITC+blockedITC),  'var(--odoo-dark)'],
              ['Less: Blocked (Sec 17(5))',  `(${fmt(blockedITC)})`,    'var(--odoo-red)'],
              ['Less: Unmatched / On Hold',  `(${fmt(heldITC)})`,       '#856404'],
              ['Net ITC Claimable in GSTR-3B', fmt(eligibleITC),        'var(--odoo-green)'],
            ].map(([l,v,c],i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',
                borderBottom:'1px solid var(--odoo-border)',
                fontWeight: i===3 ? 700 : 400,
                borderTop: i===3 ? '2px solid var(--odoo-border)' : 'none'}}>
                <span style={{fontSize:13,color:'var(--odoo-dark)'}}>{l}</span>
                <span style={{fontFamily:'DM Mono,monospace',fontSize:13,color:c}}>{v}</span>
              </div>
            ))}
          </div>

          {/* What to do next */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:18}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:14,marginBottom:16}}> Next Steps</h3>
            {[
              { step:1, icon:'▸', action:'Follow up with 2 suppliers who haven\'t filed GSTR-1', urgent:true },
              { step:2, icon:'▸', action:'Remove blocked invoices from ITC claim', urgent:true },
              { step:3, icon:'▸', action:'Verify GSTIN for all new vendors', urgent:false },
              { step:4, icon:'▸', action:'File GSTR-1 (outward supplies) by 11th', urgent:false },
              { step:5, icon:'▸', action:'Compute GSTR-3B with eligible ITC only', urgent:false },
              { step:6, icon:'▸', action:'Pay net GST liability after ITC offset', urgent:false },
            ].map(s => (
              <div key={s.step} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <span style={{width:22,height:22,borderRadius:'50%',background:s.urgent?'var(--odoo-red)':'var(--odoo-purple)',
                  color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:10,fontWeight:700,flexShrink:0}}>{s.step}</span>
                <div style={{fontSize:12,color:'var(--odoo-dark)',paddingTop:2}}>
                  {s.icon} {s.action}
                  {s.urgent && <span style={{marginLeft:6,fontSize:10,color:'var(--odoo-red)',fontWeight:700}}>URGENT</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
