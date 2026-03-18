import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Test parameters per product
const TEST_PARAMS = {
  'Ring Yarn (30s Count)': [
    {param:'Count (Ne)',spec:'30s ± 0.3',unit:'Ne',result:'',limit_lo:29.7,limit_hi:30.3},
    {param:'Tensile Strength (CSP)',spec:'≥ 2200',unit:'gf·tex',result:'',limit_lo:2200,limit_hi:9999},
    {param:'Twist per Inch (TPI)',spec:'20.5 ± 0.5',unit:'TPI',result:'',limit_lo:20,limit_hi:21},
    {param:'Unevenness (U%)',spec:'≤ 9.5',unit:'%',result:'',limit_lo:0,limit_hi:9.5},
    {param:'Imperfections (IPI)',spec:'≤ 80',unit:'per 1km',result:'',limit_lo:0,limit_hi:80},
    {param:'Elongation at Break',spec:'≥ 4.5',unit:'%',result:'',limit_lo:4.5,limit_hi:99},
  ],
  'Open End Yarn (12s)': [
    {param:'Count (Ne)',spec:'12s ± 0.3',unit:'Ne',result:'',limit_lo:11.7,limit_hi:12.3},
    {param:'Tensile Strength',spec:'≥ 1800 gf·tex',unit:'gf·tex',result:'',limit_lo:1800,limit_hi:9999},
    {param:'Nep Count',spec:'≤ 200/km',unit:'nep/km',result:'',limit_lo:0,limit_hi:200},
    {param:'Unevenness (U%)',spec:'≤ 12',unit:'%',result:'',limit_lo:0,limit_hi:12},
    {param:'Moisture Content',spec:'8% ± 1',unit:'%',result:'',limit_lo:7,limit_hi:9},
  ],
  'Compact Cotton Sliver': [
    {param:'Weight (Hank)',spec:'0.12 ± 0.003',unit:'g/m',result:'',limit_lo:0.117,limit_hi:0.123},
    {param:'Nep Count',spec:'≤ 50/g',unit:'nep/g',result:'',limit_lo:0,limit_hi:50},
    {param:'Trash Content',spec:'≤ 0.5%',unit:'%',result:'',limit_lo:0,limit_hi:0.5},
    {param:'Moisture Content',spec:'8% ± 1',unit:'%',result:'',limit_lo:7,limit_hi:9},
  ],
}

const SOURCES = ['PP — Production WO','MM — Incoming GRN','SD — Pre-shipment']

export default function InspectionNew() {
  const nav = useNavigate()
  const [product, setProduct] = useState('Ring Yarn (30s Count)')
  const [source, setSource] = useState('PP — Production WO')
  const [tests, setTests] = useState(TEST_PARAMS['Ring Yarn (30s Count)'].map((t,i)=>({...t,id:i})))
  const [qty, setQty] = useState('400')
  const [saved, setSaved] = useState(false)

  const switchProduct = (p) => {
    setProduct(p)
    setTests((TEST_PARAMS[p] || TEST_PARAMS['Ring Yarn (30s Count)']).map((t,i)=>({...t,id:i})))
  }
  const updateResult = (id, val) => setTests(tests.map(t => t.id===id ? {...t, result:val} : t))

  const getStatus = (t) => {
    const v = parseFloat(t.result)
    if (!t.result || isNaN(v)) return null
    return v >= t.limit_lo && v <= t.limit_hi ? 'pass' : 'fail'
  }

  const allTested = tests.every(t => t.result !== '')
  const failCount = tests.filter(t => getStatus(t) === 'fail').length
  const overallResult = allTested ? (failCount === 0 ? 'Pass' : failCount <= 1 ? 'Review' : 'Fail') : null

  if (saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>{overallResult==='Pass'?'✅':overallResult==='Review'?'⚠️':'❌'}</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',
        color:overallResult==='Pass'?'var(--odoo-green)':overallResult==='Review'?'var(--odoo-orange)':'var(--odoo-red)'}}>
        QIL-049 — {overallResult || 'Saved'}!
      </div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>
        {qty} Kg inspected · {failCount} tests failed · Result: <strong>{overallResult}</strong>
      </div>
      {(overallResult==='Fail'||overallResult==='Review') && (
        <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/ncr/new')}>❌ Raise NCR</button>
      )}
      {overallResult==='Pass' && (
        <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/certificates')}>🏅 Issue Certificate</button>
      )}
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/inspection')}>← Inspection List</button>
        <button className="btn btn-s sd-bsm" onClick={() => { setSaved(false); setTests(TEST_PARAMS[product].map((t,i)=>({...t,id:i,result:''}))) }}>New Inspection</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Inspection Lot <small>QA01 · Inspection Recording</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/inspection')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save & Result</button>
        </div>
      </div>

      {/* Header */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">🔬 Inspection Header</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Lot No.</label><input className="fi-form-ctrl" defaultValue="QIL-049" readOnly/></div>
            <div className="fi-form-grp"><label>Inspection Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/></div>
            <div className="fi-form-grp"><label>Inspector</label>
              <select className="fi-form-ctrl"><option>Rajesh Q. — QC Inspector</option><option>Kavitha M. — QC Lead</option><option>Suresh P. — Lab Tech</option></select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Source <span>*</span></label>
              <select className="fi-form-ctrl" value={source} onChange={e=>setSource(e.target.value)}>
                {SOURCES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="fi-form-grp"><label>Reference (WO / GRN)</label>
              <select className="fi-form-ctrl">
                <option>WO-2025-019 · Ring Yarn (30s)</option>
                <option>WO-2025-020 · Compact Sliver</option>
                <option>GRN-2025-019 · Cotton Bale</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Product / Material <span>*</span></label>
              <select className="fi-form-ctrl" value={product} onChange={e=>switchProduct(e.target.value)}>
                {Object.keys(TEST_PARAMS).map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Lot Qty <span>*</span></label>
              <div style={{display:'flex',gap:'8px'}}>
                <input type="number" className="fi-form-ctrl" value={qty} onChange={e=>setQty(e.target.value)} style={{flex:1}}/>
                <span style={{padding:'8px 12px',background:'#F8F9FA',border:'1px solid var(--odoo-border)',borderRadius:'5px',fontSize:'13px'}}>Kg</span>
              </div>
            </div>
            <div className="fi-form-grp"><label>Sample Size (AQL)</label>
              <input className="fi-form-ctrl" value={Math.ceil(parseFloat(qty||0)*0.05)+' Kg (5%)'} readOnly style={{background:'#F8F9FA'}}/>
            </div>
            <div className="fi-form-grp"><label>Quality Plan</label>
              <select className="fi-form-ctrl"><option>QP-001 · Ring Yarn Standard</option><option>QP-002 · OE Yarn Standard</option></select>
            </div>
          </div>
        </div>
      </div>

      {/* Test Parameters */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">🧪 Test Parameters — {product}</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr>
              <th>#</th><th>Test Parameter</th><th>Specification</th><th>Unit</th>
              <th>Test Result</th><th>Status</th>
            </tr></thead>
            <tbody>
              {tests.map((t,i)=>{
                const status = getStatus(t)
                return (
                  <tr key={t.id} className={status==='pass'?'test-row-pass':status==='fail'?'test-row-fail':''}>
                    <td style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)'}}>{i+1}</td>
                    <td><strong>{t.param}</strong></td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-blue)'}}>{t.spec}</td>
                    <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{t.unit}</td>
                    <td>
                      <input type="number" placeholder="Enter result..."
                        value={t.result}
                        onChange={e => updateResult(t.id, e.target.value)}
                        style={{
                          width:'120px',
                          border:`2px solid ${status==='pass'?'var(--odoo-green)':status==='fail'?'var(--odoo-red)':'var(--odoo-border)'}`,
                          borderRadius:'5px',padding:'5px 8px',fontSize:'13px',fontWeight:'600',
                          background: status==='pass'?'#F0FFF8':status==='fail'?'#FFF5F5':'#fff',
                          fontFamily:'DM Mono,monospace'
                        }}
                      />
                    </td>
                    <td>
                      {status==='pass' && <span className="badge badge-pass">Pass</span>}
                      {status==='fail' && <span className="badge badge-fail">❌ Fail</span>}
                      {!status && <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>— Pending</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Live result banner */}
          {allTested && (
            <div style={{
              margin:'14px',padding:'12px 16px',borderRadius:'6px',display:'flex',alignItems:'center',gap:'12px',
              background:overallResult==='Pass'?'#EAF9F6':overallResult==='Review'?'#FEF5E7':'#FDEDEC',
              border:`1px solid ${overallResult==='Pass'?'#A2DED0':overallResult==='Review'?'#FAD7A0':'#F5B7B1'}`
            }}>
              <span style={{fontSize:'24px'}}>{overallResult==='Pass'?'✅':overallResult==='Review'?'⚠️':'❌'}</span>
              <div>
                <div style={{fontWeight:'700',fontSize:'14px',color:overallResult==='Pass'?'var(--odoo-green)':overallResult==='Review'?'var(--odoo-orange)':'var(--odoo-red)'}}>
                  Overall Result: {overallResult}
                </div>
                <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginTop:'2px'}}>
                  {tests.length - failCount} tests passed · {failCount} failed
                  {failCount > 0 && ' — NCR recommended'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📝 Remarks</div>
        <div className="fi-form-sec-body">
          <textarea className="fi-form-ctrl" rows={3} placeholder="Inspection remarks, visual observations, deviation notes..."></textarea>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/inspection')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save & Result</button>
        <div className="fi-status-flow">
          <span className="fi-sf-step act">🔬 Inspect</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">Result</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">🏅 Certificate</span>
        </div>
      </div>
    </div>
  )
}
