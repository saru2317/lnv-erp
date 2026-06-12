import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const ALL_PROCESSES = [
  { code:'PC',  name:'Powder Coating',                    icon:'🎨', desc:'Casting / Sheet Metal / Aluminium — KG or SQFT basis', category:'Coating' },
  { code:'CED', name:'CED (Cathodic Electro Deposition)', icon:'⚡', desc:'Casting / Sheet Metal / Aluminium — KG or SQFT basis', category:'Coating' },
  { code:'LP',  name:'Liquid Painting',                   icon:'🖌️', desc:'Casting / Sheet Metal / Aluminium — KG or SQFT basis', category:'Coating' },
  { code:'IM',  name:'Injection Moulding',                icon:'🏭', desc:'Plastic / Polymer — KG or Shot basis',               category:'Moulding' },
  { code:'LW',  name:'Late Works / Overtime',             icon:'🕐', desc:'Labour — Hour basis',                                category:'Labour' },
  { code:'SC',  name:'Sheet Cutting Job',                 icon:'✂️', desc:'Sheet Metal — SQFT basis',                           category:'Fabrication' },
  { code:'WS',  name:'Welding Shop',                      icon:'🔧', desc:'General welding / Sheet Metal — Hour or Piece',      category:'Fabrication' },
  { code:'OT',  name:'Other Job Works',                   icon:'📦', desc:'Any other job work — configurable basis',            category:'General' },
]

const CATEGORIES = ['Coating','Moulding','Labour','Fabrication','General']

export default function LabourProcessConfig() {
  const [enabled,  setEnabled]  = useState([])   // enabled process codes
  const [notes,    setNotes]    = useState({})    // {PC:'note'}
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [company,  setCompany]  = useState('')

  // Load current config from localStorage (same as module config)
  useEffect(() => {
    try {
      const co = JSON.parse(localStorage.getItem('lnv_company')||'{}')
      setCompany(co?.name || 'This Company')
      const saved = JSON.parse(localStorage.getItem('lnv_labour_processes')||'null')
      if (saved) {
        setEnabled(saved.enabled || ALL_PROCESSES.map(p=>p.code))
        setNotes(saved.notes || {})
      } else {
        // Default — all enabled
        setEnabled(ALL_PROCESSES.map(p=>p.code))
      }
    } catch { setEnabled(ALL_PROCESSES.map(p=>p.code)) }
    setLoading(false)
  }, [])

  const toggleProcess = (code) => {
    setEnabled(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code])
  }

  const selectAll = () => setEnabled(ALL_PROCESSES.map(p=>p.code))
  const clearAll  = () => setEnabled([])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage (frontend-only like modules config)
      const config = { enabled, notes }
      localStorage.setItem('lnv_labour_processes', JSON.stringify(config))
      // Also save to backend CompanySettings for persistence
      await fetch(`${BASE}/config/company-settings`, {
        method:'PATCH', headers:hdr(),
        body:JSON.stringify({ labourProcesses: config })
      }).catch(()=>{})
      toast.success(`Labour process config saved for ${company}`)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading…</div>

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Labour Process Access
          </div>
          <div style={{fontSize:12,color:'#6C757D',marginTop:3}}>
            Enable or disable job work processes for <strong>{company}</strong>.
            Disabled processes will be hidden from Labour Invoice.
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={selectAll}
            style={{padding:'7px 14px',background:'#D4EDDA',color:'#155724',border:'1px solid #C3E6CB',
              borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            ✓ Enable All
          </button>
          <button onClick={clearAll}
            style={{padding:'7px 14px',background:'#F8D7DA',color:'#721C24',border:'1px solid #F5C6CB',
              borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            ✕ Clear All
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{padding:'7px 18px',background:'#714B67',color:'#fff',border:'none',
              borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {saving?'Saving…':'💾 Save Config'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{background:'#FFF3CD',border:'1px solid #FFEAA7',borderRadius:6,
        padding:'8px 14px',marginBottom:16,fontSize:11,color:'#856404'}}>
        ⚡ <strong>Default:</strong> All processes enabled. Once you save a config, only selected processes
        show in Labour Invoice. When a <strong>new process is added in future</strong>, it will NOT auto-enable —
        you must explicitly add it here. This is controlled by Super Admin only.
      </div>

      {/* Process grid by category */}
      {CATEGORIES.map(cat => {
        const catProcs = ALL_PROCESSES.filter(p=>p.category===cat)
        return (
          <div key={cat} style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'#6C757D',textTransform:'uppercase',
              letterSpacing:.5,marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
              <div style={{flex:1,height:1,background:'#E0D5E0'}}/>
              {cat}
              <div style={{flex:1,height:1,background:'#E0D5E0'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {catProcs.map(proc => {
                const isOn = enabled.includes(proc.code)
                return (
                  <div key={proc.code} style={{
                    background:'#fff',
                    border:`2px solid ${isOn?'#714B67':'#E0D5E0'}`,
                    borderRadius:8, padding:'14px 16px',
                    background:isOn?'#F8F4F8':'#fff',
                    transition:'all .15s',
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:isOn?8:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:24}}>{proc.icon}</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:'#1C1C1C'}}>{proc.name}</div>
                          <div style={{fontSize:10,color:'#6C757D',marginTop:1}}>{proc.desc}</div>
                        </div>
                      </div>
                      {/* Toggle switch */}
                      <div onClick={()=>toggleProcess(proc.code)}
                        style={{width:48,height:26,borderRadius:13,cursor:'pointer',position:'relative',flexShrink:0,
                          background:isOn?'#714B67':'#CCC',transition:'background .2s'}}>
                        <div style={{
                          position:'absolute',top:3,width:20,height:20,borderRadius:'50%',
                          background:'#fff',transition:'left .2s',
                          left:isOn?25:3,boxShadow:'0 1px 4px rgba(0,0,0,.3)'
                        }}/>
                      </div>
                    </div>
                    {/* Note input when enabled */}
                    {isOn && (
                      <input value={notes[proc.code]||''} 
                        onChange={e=>setNotes(n=>({...n,[proc.code]:e.target.value}))}
                        placeholder="Optional note (e.g. Casting only, no Aluminium)..."
                        style={{width:'100%',padding:'5px 8px',fontSize:11,
                          border:'1px solid #D4B8CE',borderRadius:4,outline:'none',
                          background:'#fff',boxSizing:'border-box'}} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Summary */}
      <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,
        padding:'12px 16px',marginTop:8}}>
        <div style={{fontSize:12,fontWeight:700,color:'#714B67',marginBottom:8}}>
          Summary — {enabled.length} of {ALL_PROCESSES.length} processes enabled
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {ALL_PROCESSES.map(p=>(
            <span key={p.code} style={{
              padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:700,
              background:enabled.includes(p.code)?'#714B67':'#F5F5F5',
              color:enabled.includes(p.code)?'#fff':'#6C757D',
            }}>
              {p.icon} {p.name}
              {enabled.includes(p.code)&&notes[p.code]&&
                <span style={{fontSize:9,opacity:.8,marginLeft:4}}>({notes[p.code].slice(0,15)}…)</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
