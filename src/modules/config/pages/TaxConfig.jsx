import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

// ── GST Rates — Govt defined, stored in localStorage for customization ──
const DEFAULT_GST = [
  { id:'GST-00', name:'GST 0%',  rate:0,  type:'GST', cgst:0,   sgst:0,   igst:0,   cess:0, status:'Active', applicableTo:'Essential Goods & Services' },
  { id:'GST-05', name:'GST 5%',  rate:5,  type:'GST', cgst:2.5, sgst:2.5, igst:5,   cess:0, status:'Active', applicableTo:'Common Goods (Food, Medicines)' },
  { id:'GST-12', name:'GST 12%', rate:12, type:'GST', cgst:6,   sgst:6,   igst:12,  cess:0, status:'Active', applicableTo:'Standard Goods' },
  { id:'GST-18', name:'GST 18%', rate:18, type:'GST', cgst:9,   sgst:9,   igst:18,  cess:0, status:'Active', applicableTo:'Industrial Goods & Services' },
  { id:'GST-28', name:'GST 28%', rate:28, type:'GST', cgst:14,  sgst:14,  igst:28,  cess:0, status:'Active', applicableTo:'Luxury Goods & Demerit Goods' },
]
const DEFAULT_TDS = [
  { id:'TDS-01', name:'TDS 1%',  rate:1,  type:'TDS', cgst:0, sgst:0, igst:0, cess:0, status:'Active', applicableTo:'Contractors & Sub-contractors (194C)' },
  { id:'TDS-02', name:'TDS 2%',  rate:2,  type:'TDS', cgst:0, sgst:0, igst:0, cess:0, status:'Active', applicableTo:'Professional Services (194J)' },
  { id:'TDS-10', name:'TDS 10%', rate:10, type:'TDS', cgst:0, sgst:0, igst:0, cess:0, status:'Active', applicableTo:'Rent — Plant & Machinery (194I)' },
]

const inp = { padding:'7px 10px', fontSize:12, border:'1.5px solid var(--odoo-border)',
  borderRadius:6, outline:'none', fontFamily:'DM Sans,sans-serif', width:'100%', boxSizing:'border-box' }

export default function TaxConfig() {
  const [tab,      setTab]      = useState('gst')
  const [taxes,    setTaxes]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('lnv_tax_rates') || 'null') || [...DEFAULT_GST, ...DEFAULT_TDS] }
    catch { return [...DEFAULT_GST, ...DEFAULT_TDS] }
  })
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ name:'', rate:'', type:'GST', cgst:'', sgst:'', igst:'', cess:'0', status:'Active', applicableTo:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // HSN live from MDM API
  const [hsn,      setHsn]      = useState([])
  const [hsnLoad,  setHsnLoad]  = useState(false)
  const [hsnSearch,setHsnSearch]= useState('')
  const [sac,      setSac]      = useState([])

  const loadHsn = useCallback(async (search='') => {
    setHsnLoad(true)
    try {
      const r = await fetch(`${BASE_URL}/mdm/hsn${search?`?search=${encodeURIComponent(search)}`:''}`, { headers:hdr2() })
      const d = await r.json()
      setHsn(d.data || [])
    } catch { toast.error('Failed to load HSN codes') }
    finally { setHsnLoad(false) }
  }, [])

  const loadSac = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/mdm/sac`, { headers:hdr2() })
      const d = await r.json()
      setSac(d.data || [])
    } catch {}
  }, [])

  useEffect(() => { if (tab==='hsn') loadHsn() }, [tab, loadHsn])
  useEffect(() => { if (tab==='sac') loadSac() }, [tab, loadSac])

  // Debounce HSN search
  useEffect(() => {
    if (tab !== 'hsn') return
    const t = setTimeout(() => loadHsn(hsnSearch), 300)
    return () => clearTimeout(t)
  }, [hsnSearch, tab, loadHsn])

  const handleRateChange = v => {
    const r = parseFloat(v) || 0
    set('rate', v)
    if (form.type === 'GST') setForm(f=>({...f, rate:v, cgst:r/2, sgst:r/2, igst:r, name:`GST ${v}%`}))
  }

  const handleSave = () => {
    if (!form.name || !form.rate) { toast.error('Name and rate are required'); return }
    const newTax = { id:`TAX-${Date.now()}`, ...form, rate:parseFloat(form.rate), cgst:parseFloat(form.cgst||0), sgst:parseFloat(form.sgst||0), igst:parseFloat(form.igst||0), cess:parseFloat(form.cess||0) }
    const updated = [...taxes, newTax]
    setTaxes(updated)
    localStorage.setItem('lnv_tax_rates', JSON.stringify(updated))
    toast.success(`${newTax.name} added`)
    setForm({ name:'', rate:'', type:'GST', cgst:'', sgst:'', igst:'', cess:'0', status:'Active', applicableTo:'' })
    setShowForm(false)
  }

  const toggleStatus = (id) => {
    const updated = taxes.map(t => t.id===id ? {...t, status:t.status==='Active'?'Inactive':'Active'} : t)
    setTaxes(updated)
    localStorage.setItem('lnv_tax_rates', JSON.stringify(updated))
  }

  const gstRates = taxes.filter(t=>t.type==='GST')
  const tdsRates = taxes.filter(t=>t.type==='TDS')

  const RATE_BG  = { 0:'#E8F5E9', 5:'#E3F2FD', 12:'#FFF8E1', 18:'#F3E5F5', 28:'#FCE4EC' }
  const RATE_CLR = { 0:'#2E7D32', 5:'#1565C0', 12:'#F57F17', 18:'#6A1B9A', 28:'#B71C1C' }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Tax & GST Configuration <small>GST rates · TDS · HSN/SAC codes</small></div>
        <div className="fi-lv-actions">
          {(tab==='gst'||tab==='tds') && (
            <button className="btn btn-p btn-s" onClick={()=>setShowForm(!showForm)}>+ Add Tax Rate</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:16,borderBottom:'2px solid var(--odoo-border)'}}>
        {[['gst','📊 GST Rates'],['tds','📋 TDS/TCS Rates'],['hsn','🔢 HSN Codes'],['sac','🔧 SAC Codes']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'8px 18px',cursor:'pointer',fontSize:12,fontWeight:700,
              borderBottom:tab===k?'2px solid var(--odoo-purple)':'2px solid transparent',
              color:tab===k?'var(--odoo-purple)':'var(--odoo-gray)',marginBottom:-2}}>{l}</div>
        ))}
      </div>

      {/* ── ADD FORM ── */}
      {showForm && (tab==='gst'||tab==='tds') && (
        <div style={{background:'#fff',border:'2px solid var(--odoo-purple)',borderRadius:8,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,marginBottom:14,color:'var(--odoo-purple)'}}>
            + New Tax Rate
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Tax Type</label>
              <select value={form.type} onChange={e=>set('type',e.target.value)} style={inp}>
                <option>GST</option><option>TDS</option><option>TCS</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Rate (%) *</label>
              <input type="number" value={form.rate} onChange={e=>handleRateChange(e.target.value)} placeholder="e.g. 18" style={inp} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Tax Name *</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. GST 18%" style={inp} />
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>CESS (%)</label>
              <input type="number" value={form.cess} onChange={e=>set('cess',e.target.value)} placeholder="0" style={inp} />
            </div>
          </div>
          {form.type==='GST' && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12}}>
              {[['CGST %','cgst'],['SGST %','sgst'],['IGST %','igst']].map(([l,k])=>(
                <div key={k}>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>{l}</label>
                  <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} style={{...inp,background:'#F8F9FA'}} />
                </div>
              ))}
            </div>
          )}
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4}}>Applicable To</label>
            <input value={form.applicableTo} onChange={e=>set('applicableTo',e.target.value)} placeholder="e.g. Industrial Goods & Services" style={inp} />
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn btn-s btn-s" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-p btn-s" onClick={handleSave}>✓ Save Tax Rate</button>
          </div>
        </div>
      )}

      {/* ── GST RATES ── */}
      {tab==='gst' && (
        <div>
          <div style={{background:'#FFF3CD',border:'1px solid #FFEAA7',borderRadius:6,padding:'10px 14px',fontSize:11,color:'#856404',marginBottom:14}}>
            ⚠️ GST rates are government-defined. Standard rates: 0%, 5%, 12%, 18%, 28%. Changes here update LNV ERP calculations only — ensure compliance with GST laws.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {gstRates.map(t=>(
              <div key={t.id} style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',
                overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
                <div style={{background:RATE_BG[t.rate]||'#F8F9FA',padding:'12px 16px',
                  borderBottom:'1px solid var(--odoo-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:RATE_CLR[t.rate]||'#714B67'}}>
                    {t.rate}%
                  </div>
                  <span style={{padding:'3px 10px',borderRadius:10,fontSize:11,fontWeight:700,
                    background:t.status==='Active'?'#D4EDDA':'#F8D7DA',
                    color:t.status==='Active'?'#155724':'#721C24',cursor:'pointer'}}
                    onClick={()=>toggleStatus(t.id)}>
                    {t.status}
                  </span>
                </div>
                <div style={{padding:'12px 16px'}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{t.name}</div>
                  <div style={{fontSize:11,color:'#6C757D',marginBottom:10}}>{t.applicableTo}</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                    {[['CGST',t.cgst],['SGST',t.sgst],['IGST',t.igst]].map(([l,v])=>(
                      <div key={l} style={{textAlign:'center',padding:'6px',background:'#F8F9FA',borderRadius:6}}>
                        <div style={{fontSize:10,color:'#6C757D',fontWeight:700}}>{l}</div>
                        <div style={{fontSize:14,fontWeight:800,color:RATE_CLR[t.rate]||'#714B67'}}>{v}%</div>
                      </div>
                    ))}
                  </div>
                  {t.cess > 0 && <div style={{marginTop:8,fontSize:11,color:'#856404'}}>+ CESS: {t.cess}%</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TDS RATES ── */}
      {tab==='tds' && (
        <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'var(--odoo-purple)'}}>
                {['Tax Name','Rate %','Type','Section','Applicable To','Status'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tdsRates.map((t,i)=>(
                <tr key={t.id} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                  <td style={{padding:'10px 14px',fontWeight:600,fontSize:12}}>{t.name}</td>
                  <td style={{padding:'10px 14px'}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#1A5276'}}>{t.rate}%</span>
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    <span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700}}>{t.type}</span>
                  </td>
                  <td style={{padding:'10px 14px',fontSize:11,color:'#6C757D',fontFamily:'DM Mono,monospace'}}>
                    {t.name.includes('1%')?'194C':t.name.includes('2%')?'194J':t.name.includes('10%')?'194I':'—'}
                  </td>
                  <td style={{padding:'10px 14px',fontSize:11,color:'#6C757D'}}>{t.applicableTo}</td>
                  <td style={{padding:'10px 14px'}}>
                    <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,cursor:'pointer',
                      background:t.status==='Active'?'#D4EDDA':'#F8D7DA',color:t.status==='Active'?'#155724':'#721C24'}}
                      onClick={()=>toggleStatus(t.id)}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── HSN CODES ── */}
      {tab==='hsn' && (
        <div>
          <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center'}}>
            <input value={hsnSearch} onChange={e=>setHsnSearch(e.target.value)}
              placeholder="Search HSN code or description…"
              style={{...inp,maxWidth:360,padding:'8px 12px'}} />
            <span style={{fontSize:11,color:'#6C757D'}}>
              {hsnLoad?'Searching…':`${hsn.length} codes — LNV Manufacturing specific`}
            </span>
          </div>
          <div style={{background:'#EDE0EA',border:'1px solid #D4B8CE',borderRadius:6,padding:'8px 14px',fontSize:11,color:'#714B67',marginBottom:12}}>
            📌 HSN codes below are relevant to <strong>Injection Moulding & Surface Treatment</strong> (LNV Manufacturing). Plastics, chemicals, machinery, and services.
          </div>
          {hsnLoad ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading HSN codes…</div>
          ) : (
            <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--odoo-purple)'}}>
                    {['HSN Code','Description','CGST %','SGST %','IGST %'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hsn.length===0?(
                    <tr><td colSpan={5} style={{padding:30,textAlign:'center',color:'#6C757D'}}>No HSN codes found</td></tr>
                  ):hsn.map((h,i)=>(
                    <tr key={h.code+i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                      <td style={{padding:'10px 14px'}}>
                        <code style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13,color:'var(--odoo-purple)',background:'#EDE0EA',padding:'2px 8px',borderRadius:4}}>{h.code}</code>
                      </td>
                      <td style={{padding:'10px 14px',fontSize:12}}>{h.description}</td>
                      <td style={{padding:'10px 14px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#1A5276'}}>{h.cgst}%</td>
                      <td style={{padding:'10px 14px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#1A5276'}}>{h.sgst}%</td>
                      <td style={{padding:'10px 14px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#196F3D'}}>{h.igst}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SAC CODES ── */}
      {tab==='sac' && (
        <div>
          <div style={{background:'#E8F4FD',border:'1px solid #B3D4F0',borderRadius:6,padding:'8px 14px',fontSize:11,color:'#1565C0',marginBottom:12}}>
            📌 SAC (Services Accounting Code) — used for service invoices. These are standard GST codes for services.
          </div>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'var(--odoo-purple)'}}>
                  {['SAC Code','Service Description'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#fff',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sac.length===0?(
                  <tr><td colSpan={2} style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading SAC codes…</td></tr>
                ):sac.map((s,i)=>(
                  <tr key={s.code+i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                    <td style={{padding:'10px 14px'}}>
                      <code style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13,color:'#1565C0',background:'#E3F2FD',padding:'2px 8px',borderRadius:4}}>{s.code}</code>
                    </td>
                    <td style={{padding:'10px 14px',fontSize:12}}>{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
