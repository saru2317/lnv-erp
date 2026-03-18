import React, { useState } from 'react'

const CALIBRATIONS = [
  {id:'CAL-001',inst:'Vernier Caliper — 150mm',id_no:'VC-001',dept:'QC Lab',last:'01 Dec 2024',next:'01 Jun 2025',agency:'NABL Lab — Chennai',cert:'CAL-CERT-244',overdue:-92,sb:'badge-pass',sl:'Valid'},
  {id:'CAL-002',inst:'Micrometer — 0-25mm',id_no:'MC-001',dept:'QC Lab',last:'01 Dec 2024',next:'01 Jun 2025',agency:'NABL Lab — Chennai',cert:'CAL-CERT-245',overdue:-92,sb:'badge-pass',sl:'Valid'},
  {id:'CAL-003',inst:'Weighing Scale — 20Kg',id_no:'WS-001',dept:'Production',last:'01 Jan 2025',next:'01 Apr 2025',agency:'Govt. Weights & Measures',cert:'CAL-CERT-248',overdue:-31,sb:'badge-pass',sl:'Valid'},
  {id:'CAL-004',inst:'Temperature Gauge',id_no:'TG-001',dept:'Maintenance',last:'15 Jan 2025',next:'15 Mar 2025',agency:'In-house',cert:'—',overdue:14,sb:'badge-fail',sl:'Overdue'},
  {id:'CAL-005',inst:'Pressure Gauge — 10 bar',id_no:'PG-001',dept:'Boiler Room',last:'01 Feb 2025',next:'01 Mar 2025',agency:'IBR Certified',cert:'CAL-CERT-251',overdue:0,sb:'badge-hold',sl:'Due Today'},
  {id:'CAL-006',inst:'Clamp Meter — 600A',id_no:'CM-001',dept:'Electrical',last:'01 Oct 2024',next:'01 Apr 2025',agency:'NABL Lab — Chennai',cert:'CAL-CERT-238',overdue:-31,sb:'badge-pass',sl:'Valid'},
  {id:'CAL-007',inst:'Tachometer',id_no:'TC-001',dept:'Production',last:'01 Dec 2024',next:'01 Jun 2025',agency:'In-house',cert:'—',overdue:-92,sb:'badge-pass',sl:'Valid'},
  {id:'CAL-008',inst:'Moisture Meter',id_no:'MM-002',dept:'QC Lab',last:'01 Feb 2025',next:'01 Aug 2025',agency:'NABL Lab — Chennai',cert:'CAL-CERT-252',overdue:-153,sb:'badge-pass',sl:'Valid'},
]

export default function CalibrationList() {
  const [chip, setChip] = useState('All')
  const filtered = chip==='All' ? CALIBRATIONS :
    chip==='Overdue' ? CALIBRATIONS.filter(c=>c.overdue>0) :
    chip==='Due Today' ? CALIBRATIONS.filter(c=>c.overdue===0) :
    CALIBRATIONS.filter(c=>c.sl==='Valid')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Calibration Register <small>Instrument Calibration Tracking</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm">➕ Add Instrument</button>
        </div>
      </div>

      {CALIBRATIONS.some(c=>c.overdue>0) && (
        <div className="pp-alert warn">⚠️ <strong>1 instrument overdue for calibration</strong> — Temperature Gauge (TG-001) is 14 days overdue. Schedule immediately.</div>
      )}

      <div className="pp-chips">
        {['All','Overdue','Due Today','Valid'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}
            <span>{c==='All'?CALIBRATIONS.length:c==='Overdue'?CALIBRATIONS.filter(x=>x.overdue>0).length:c==='Due Today'?CALIBRATIONS.filter(x=>x.overdue===0).length:CALIBRATIONS.filter(x=>x.sl==='Valid').length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Cal. ID</th><th>Instrument</th><th>ID No.</th><th>Department</th>
          <th>Last Calibrated</th><th>Next Due</th><th>Agency</th><th>Certificate</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(c=>(
            <tr key={c.id} style={{background:c.overdue>0?'#FFF5F5':c.overdue===0?'#FFFBF0':'inherit'}}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{c.id}</strong></td>
              <td><strong>{c.inst}</strong></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{c.id_no}</td>
              <td>{c.dept}</td>
              <td>{c.last}</td>
              <td style={{fontWeight:'600',color:c.overdue>0?'var(--odoo-red)':c.overdue===0?'var(--odoo-orange)':'inherit'}}>{c.next}</td>
              <td style={{fontSize:'12px'}}>{c.agency}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:c.cert==='—'?'var(--odoo-gray)':'var(--odoo-blue)'}}>{c.cert}</td>
              <td><span className={`badge ${c.sb}`}>
                {c.overdue>0?`⚠️ ${c.overdue}d Overdue`:c.overdue===0?'⏰ Due Today':'✅ Valid'}
              </span></td>
              <td>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs">View</button>
                  <button className="btn-xs" onClick={() => nav('/print/wo')}>Print</button>
                  {c.overdue>=0 && <button className="btn-xs pri">Schedule</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
