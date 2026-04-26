import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Loss reason config ──────────────────────────────────────
const LOSS_REASONS = {
  blocked_17_5:    { label:'Sec 17(5) Blocked',       color:'#721C24', bg:'#F8D7DA', desc:'Food, vehicle, club, health — never claimable' },
  composition:     { label:'Composition Dealer',       color:'#0C5460', bg:'#D1ECF1', desc:'Supplier is composition dealer — no ITC available' },
  unmatched_2b:    { label:'Unmatched in GSTR-2B',     color:'#856404', bg:'#FFF3CD', desc:'Supplier not filed GSTR-1 — on hold until matched' },
  exempt_reversal: { label:'Exempt Supply Reversal',   color:'#4B2E83', bg:'#EDE0EA', desc:'ITC reversed for exempt/nil-rated outward supplies' },
  non_gst:         { label:'Non-GST Supply',           color:'#383d41', bg:'#E2E3E5', desc:'Petroleum, alcohol — outside GST scope entirely' },
  rcm_ineligible:  { label:'RCM — Item Ineligible',    color:'#721C24', bg:'#FDECEA', desc:'Paid RCM on unregistered vendor but item is blocked' },
}

export default function ITCLossRegister() {
  const nav = useNavigate()
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Load GRNs for the month
      const [rGRN, r2B] = await Promise.all([
        fetch(`${BASE_URL}/fi/gst/itc?month=${month}&year=${year}`, { headers: hdr2() }),
        fetch(`${BASE_URL}/fi/gst/gstr2b?month=${month}&year=${year}`, { headers: hdr2() }),
      ])
      const dGRN = await rGRN.json()
      const d2B  = await r2B.json()
      const g2b  = d2B.data || []

      const lossRows = []

      ;(dGRN.data || []).forEach(l => {
        const cgst = parseFloat(l.cgst||0)
        const sgst = parseFloat(l.sgst||0)
        const igst = parseFloat(l.igst||0)
        const totalTax = cgst + sgst + igst
        if (totalTax <= 0) return

        const cat  = l.itemCategory || l.description || ''
        const inG2B = g2b.some(g => g.grnNo === l.grn?.grnNo)
        const regType = l.grn?.vendorGstRegType || 'registered'

        // Sec 17(5) blocked
        if (l.itcEligibility === 'blocked' || isBlocked(cat)) {
          lossRows.push({
            id:     l.grn?.grnNo || l.id,
            date:   l.grn?.grnDate,
            vendor: l.grn?.vendorName || '—',
            gstin:  l.grn?.vendorGstin || '—',
            item:   l.itemName || cat || '—',
            cgst, sgst, igst,
            lossAmt:  totalTax,
            reason:   'blocked_17_5',
            action:   'Reverse from ITC claim — absorb as expense',
          })
          return
        }

        // Composition dealer
        if (regType === 'composition') {
          lossRows.push({
            id:     l.grn?.grnNo || l.id,
            date:   l.grn?.grnDate,
            vendor: l.grn?.vendorName || '—',
            gstin:  l.grn?.vendorGstin || 'COMPOSITION',
            item:   l.itemName || '—',
            cgst: 0, sgst: 0, igst: 0,
            lossAmt:  parseFloat(l.taxableAmt||l.amount||0) * 0.01,
            reason:   'composition',
            action:   'No ITC. Supplier cannot charge GST. Verify invoice.',
          })
          return
        }

        // Non-GST supply
        if (regType === 'non_gst') {
          lossRows.push({
            id:     l.grn?.grnNo || l.id,
            date:   l.grn?.grnDate,
            vendor: l.grn?.vendorName || '—',
            gstin:  'NON-GST',
            item:   l.itemName || '—',
            cgst: 0, sgst: 0, igst: 0,
            lossAmt:  0,
            reason:   'non_gst',
            action:   'Outside GST scope. No ITC. Full cost to expense.',
          })
          return
        }

        // Unmatched in GSTR-2B (eligible item but supplier not filed)
        if (!inG2B && l.itcEligibility !== 'blocked') {
          lossRows.push({
            id:     l.grn?.grnNo || l.id,
            date:   l.grn?.grnDate,
            vendor: l.grn?.vendorName || '—',
            gstin:  l.grn?.vendorGstin || '—',
            item:   l.itemName || '—',
            cgst, sgst, igst,
            lossAmt:  totalTax,
            reason:   'unmatched_2b',
            action:   'Follow up with supplier. Claim next month once matched.',
          })
        }
      })

      setRows(lossRows)
    } catch (e) { toast.error('Failed to load ITC Loss Register') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const shown = filter === 'all' ? rows : rows.filter(r => r.reason === filter)

  const totalLoss = rows.reduce((a,r) => a + r.lossAmt, 0)
  const byReason  = Object.fromEntries(
    Object.keys(LOSS_REASONS).map(k => [k, rows.filter(r=>r.reason===k).reduce((a,r)=>a+r.lossAmt,0)])
  )

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          ITC Loss Register
          <small> Ineligible &amp; Blocked Input Tax Credit — {MONTHS[month]} {year}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {/* Alert */}
      <div className="fi-alert warn" style={{marginBottom:14}}>
        ITC in this register is <strong>NOT claimable</strong> in GSTR-3B. These amounts are either blocked by law, supplier not filed, or outside GST scope.
        Total ITC loss this month: <strong>{INR(totalLoss)}</strong>
      </div>

      {/* KPI strip by reason */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
        {Object.entries(LOSS_REASONS).map(([key,rc]) => (
          <div key={key}
            onClick={() => setFilter(filter===key?'all':key)}
            style={{
              background: filter===key ? rc.bg : '#fff',
              border: `1.5px solid ${filter===key ? rc.color : '#E0D5E0'}`,
              borderRadius:8, padding:'10px 14px', cursor:'pointer',
              transition:'all .15s',
            }}>
            <div style={{fontSize:11,fontWeight:700,color:rc.color,marginBottom:2}}>{rc.label}</div>
            <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:16,color:rc.color}}>
              {INR(byReason[key]||0)}
            </div>
            <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{rc.desc}</div>
          </div>
        ))}
      </div>

      {/* How non-GST supplier/customer is handled */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>

        {/* Non-GST / Unregistered Supplier */}
        <div style={{background:'#FFF9F0',border:'1px solid #FFEEBA',borderRadius:8,padding:14}}>
          <div style={{fontWeight:700,color:'#856404',fontSize:12,marginBottom:10}}>
            Non-GST / Unregistered Supplier — How GST is collected
          </div>
          {[
            { type:'Unregistered Vendor', rule:'RCM (Reverse Charge Mechanism)',
              gst:'You pay GST to govt on his behalf', itc:'ITC claimable if item eligible',
              where:'RCM Register + ITC Register', color:'#856404', bg:'#FFF3CD' },
            { type:'Composition Dealer', rule:'No GST on invoice',
              gst:'They cannot charge GST (turnover < 1.5Cr)', itc:'NO ITC — full cost absorbed',
              where:'ITC Loss Register', color:'#0C5460', bg:'#D1ECF1' },
            { type:'Non-GST Supply', rule:'Outside GST scope',
              gst:'Petroleum, alcohol, electricity — no GST', itc:'NO ITC — expense directly',
              where:'ITC Loss Register', color:'#721C24', bg:'#F8D7DA' },
          ].map(r => (
            <div key={r.type} style={{background:r.bg,borderRadius:5,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${r.color}`}}>
              <div style={{fontWeight:700,fontSize:11,color:r.color}}>{r.type}</div>
              <div style={{fontSize:10,color:'#495057',marginTop:2}}>
                Rule: {r.rule}<br/>
                GST: {r.gst}<br/>
                ITC: <strong style={{color:r.color}}>{r.itc}</strong><br/>
                Shown in: <em>{r.where}</em>
              </div>
            </div>
          ))}
        </div>

        {/* Non-GST Customer */}
        <div style={{background:'#F0F7FF',border:'1px solid #B8DAFF',borderRadius:8,padding:14}}>
          <div style={{fontWeight:700,color:'#004085',fontSize:12,marginBottom:10}}>
            Non-GST / Unregistered Customer — How GST is handled
          </div>
          {[
            { type:'Unregistered B2C Customer', rule:'You still charge GST',
              gst:'GST added to invoice, paid by customer', itc:'Customer has NO ITC (individual/end consumer)',
              where:'GSTR-1 — B2C Large (> 2.5L) / B2C Others', color:'#004085', bg:'#CCE5FF' },
            { type:'Composition Dealer Customer', rule:'Charge GST normally',
              gst:'GST on invoice as usual', itc:'They cannot claim ITC (their restriction)',
              where:'GSTR-1 B2B', color:'#0C5460', bg:'#D1ECF1' },
            { type:'SEZ / Export Customer', rule:'Zero-rated — no GST',
              gst:'No GST on invoice (LUT/Bond)', itc:'YOU can claim ITC refund on inputs',
              where:'GSTR-1 Export + ITC Refund', color:'#155724', bg:'#D4EDDA' },
          ].map(r => (
            <div key={r.type} style={{background:r.bg,borderRadius:5,padding:'8px 10px',marginBottom:6,borderLeft:`3px solid ${r.color}`}}>
              <div style={{fontWeight:700,fontSize:11,color:r.color}}>{r.type}</div>
              <div style={{fontSize:10,color:'#495057',marginTop:2}}>
                Rule: {r.rule}<br/>
                GST: {r.gst}<br/>
                ITC: <strong style={{color:r.color}}>{r.itc}</strong><br/>
                Shown in: <em>{r.where}</em>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="pp-chips">
        <div className={`pp-chip${filter==='all'?' on':''}`} onClick={()=>setFilter('all')}>
          All Loss <span>{rows.length}</span>
        </div>
        {Object.entries(LOSS_REASONS).map(([key,rc]) => (
          <div key={key} className={`pp-chip${filter===key?' on':''}`} onClick={()=>setFilter(filter===key?'all':key)}
            style={filter===key?{background:rc.bg,color:rc.color,borderColor:rc.color}:{}}>
            {rc.label} <span>{rows.filter(r=>r.reason===key).length}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading ITC Loss data...</div>
      ) : shown.length === 0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8,background:'#fff'}}>
          <div style={{fontSize:32,marginBottom:10}}>✅</div>
          <div style={{fontWeight:700,fontSize:15}}>
            {filter==='all' ? 'No ITC loss this month!' : `No ${LOSS_REASONS[filter]?.label} entries`}
          </div>
          <div style={{fontSize:12,marginTop:4,color:'#6C757D'}}>
            All purchases have eligible ITC and are matched in GSTR-2B
          </div>
        </div>
      ) : (
        <table className="fi-data-table">
          <thead><tr>
            <th>GRN / Bill No.</th>
            <th>Date</th>
            <th>Vendor</th>
            <th>GSTIN</th>
            <th>Item / Description</th>
            <th style={{textAlign:'right'}}>CGST</th>
            <th style={{textAlign:'right'}}>SGST</th>
            <th style={{textAlign:'right'}}>IGST</th>
            <th style={{textAlign:'right'}}>ITC Lost</th>
            <th>Reason</th>
            <th>Action Required</th>
          </tr></thead>
          <tbody>
            {shown.map((r,i) => {
              const rc = LOSS_REASONS[r.reason]
              return (
                <tr key={i} style={{opacity: r.reason==='unmatched_2b' ? 0.85 : 1}}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,color:'var(--odoo-purple)'}}>{r.id}</td>
                  <td style={{fontSize:11}}>
                    {r.date ? new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'}
                  </td>
                  <td style={{fontWeight:600,fontSize:12}}>{r.vendor}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'#6C757D'}}>{r.gstin}</td>
                  <td style={{fontSize:12,maxWidth:160}}>{r.item}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,
                    color:r.cgst>0?'var(--odoo-red)':'#CCC'}}>
                    {r.cgst>0?INR(r.cgst):'—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,
                    color:r.sgst>0?'var(--odoo-red)':'#CCC'}}>
                    {r.sgst>0?INR(r.sgst):'—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,
                    color:r.igst>0?'var(--odoo-red)':'#CCC'}}>
                    {r.igst>0?INR(r.igst):'—'}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,
                    fontSize:13,color:rc.color}}>
                    {r.lossAmt>0?INR(r.lossAmt):'—'}
                  </td>
                  <td>
                    <span style={{background:rc.bg,color:rc.color,padding:'2px 8px',
                      borderRadius:10,fontSize:10,fontWeight:700}}>
                      {rc.label}
                    </span>
                  </td>
                  <td style={{fontSize:11,color:'#6C757D',maxWidth:180}}>{r.action}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
              <td colSpan={8} style={{padding:'9px 12px',color:'#714B67'}}>
                TOTAL ITC LOSS — {shown.length} entries
              </td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',
                fontSize:15,color:'var(--odoo-red)',fontWeight:800}}>
                {INR(shown.reduce((a,r)=>a+r.lossAmt,0))}
              </td>
              <td colSpan={2}/>
            </tr>
          </tfoot>
        </table>
      )}

      {/* RCM guidance */}
      <div style={{marginTop:16,padding:14,background:'#EDE0EA',borderRadius:8,fontSize:12,color:'#714B67'}}>
        <strong>Where each scenario appears in LNV ERP:</strong>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:8}}>
          {[
            ['Unregistered Vendor (RCM)', 'RCM Register + ITC Register (if eligible item)', '/fi/rcm'],
            ['Composition Dealer', 'ITC Loss Register — Composition Dealer section', '/fi/itc-loss'],
            ['Non-GST Supply', 'ITC Loss Register — Non-GST section', '/fi/itc-loss'],
            ['Blocked Sec 17(5)', 'ITC Loss Register + ITC Reconciliation Tab 1', '/fi/itc-recon'],
            ['Unmatched GSTR-2B', 'ITC Loss Register (On Hold) + ITC Reconciliation', '/fi/itc-recon'],
            ['Unregistered Customer (B2C)', 'GSTR-1 B2C section — you pay GST on their behalf', '/fi/gstr1'],
          ].map(([title,desc,link])=>(
            <div key={title} style={{background:'#fff',borderRadius:5,padding:'8px 10px',border:'1px solid #E0D5E0'}}>
              <div style={{fontWeight:700,fontSize:11,color:'#714B67',marginBottom:2}}>{title}</div>
              <div style={{fontSize:10,color:'#6C757D'}}>{desc}</div>
              <button className="btn-xs" style={{marginTop:5}} onClick={()=>nav(link)}>View →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Helper
function isBlocked(cat='') {
  const c = cat.toLowerCase()
  return c.includes('food') || c.includes('vehicle') || c.includes('motor') ||
    c.includes('personal') || c.includes('club') || c.includes('gym') ||
    c.includes('health') || c.includes('beauty') || c.includes('insurance')
}
