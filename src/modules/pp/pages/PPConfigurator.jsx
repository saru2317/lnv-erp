import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { INDUSTRY_SUBTYPES, CHARGE_BASES } from './_ppConfig'

const BUSINESS_TYPES = [
  { key:'jobwork',  label:'Job Work / Processing Service', model:'Labour / Processing Charges',  desc:'Customer sends material. You process and charge for service only. Most common for surface treatment, heat treatment, CNC, textile processing.', emoji:'' },
  { key:'mfg',      label:'Own Product Manufacturing',     model:'Own Inventory + Sales',color:'var(--odoo-orange)',desc:'You buy raw material, manufacture finished goods, and sell. BOM-based production with inventory costing.',  emoji:'' },
  { key:'hybrid',   label:'Hybrid (Both)',                 model:'Job Work + Own Manufacturing',   desc:'You do both job work for customers AND manufacture your own products. Separate tracking for each.', emoji:'' },
]

export default function PPConfigurator() {
  const nav = useNavigate()
  const [step,        setStep]        = useState(1)
  const [bizType,     setBizType]     = useState('')
  const [subType,     setSubType]     = useState('')
  const [selProcesses,setSelProcesses]= useState([])
  const [chargeBy,    setChargeBy]    = useState('')
  const [saved,       setSaved]       = useState(false)

  const sub = INDUSTRY_SUBTYPES.find(s => s.key === subType)

  const toggleProcess = p => {
    setSelProcesses(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev, p])
  }

  const loadDefaults = () => {
    if(sub) { setSelProcesses(sub.defaultSequence); setChargeBy(sub.chargeBy[0]) }
  }

  const handleSave = () => {
    if(!bizType || !subType || selProcesses.length === 0) { alert('Complete all steps first'); return }
    setSaved(true)
  }

  if(saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
      <div style={{fontSize:'56px',marginBottom:'16px'}}></div>
      <h2 style={{fontFamily:'Syne,sans-serif',color:'var(--odoo-purple)',fontSize:'24px',marginBottom:'8px'}}>PP Module Configured!</h2>
      <div style={{marginBottom:'6px',fontSize:'14px'}}>{sub?.name} · {selProcesses.length} processes · Charge by {chargeBy}</div>
      <div style={{background:'#EDE0EA',borderRadius:'8px',padding:'12px 20px',marginBottom:'24px',fontSize:'12px',color:'var(--odoo-purple)',fontWeight:'600'}}>
        Your entire PP module — Work Centers, Job Cards, Scheduler, Rate Cards — now adapts to this configuration!
      </div>
      <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center'}}>
        <button className="btn btn-p btn-s" onClick={()=>nav('/pp/work-centers')}> Setup Work Centers →</button>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/process-master')}>Define Processes →</button>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/customer-master')}> Setup Customers →</button>
      </div>
    </div>
  )

  const STEPS = ['Business Type','Sub-type & Processes','Review & Save']

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PP Configurator <small>One-time setup — configures your entire PP module</small></div>
        <div className="fi-lv-actions">
          {step > 1 && <button className="btn btn-s sd-bsm" onClick={()=>setStep(s=>s-1)}>← Back</button>}
          {step < 3 && <button className="btn btn-p btn-s" onClick={()=>{
            if(step===1&&!bizType){alert('Select business type');return}
            if(step===2&&(!subType||selProcesses.length===0)){alert('Select sub-type and at least one process');return}
            setStep(s=>s+1)
          }}>Next →</button>}
          {step === 3 && <button className="btn btn-p btn-s" onClick={handleSave}>Save Configuration</button>}
        </div>
      </div>

      {/* Step Progress */}
      <div style={{display:'flex',gap:'0',marginBottom:'24px',borderRadius:'8px',border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
        {STEPS.map((s,i)=>(
          <div key={s} style={{flex:1,display:'flex',alignItems:'center',gap:'10px',
            background:step===i+1?'var(--odoo-purple)':step>i+1?'#EDE0EA':'#F8F9FA',
            borderRight:i<2?'1px solid var(--odoo-border)':'none',cursor:step>i+1?'pointer':'default'}}
            onClick={()=>step>i+1&&setStep(i+1)}>
            <div style={{width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
              background:step===i+1?'rgba(255,255,255,.3)':step>i+1?'var(--odoo-purple)':'var(--odoo-border)',
              color:step>i?'#fff':'var(--odoo-gray)',fontSize:'11px',fontWeight:'700',flexShrink:0}}>
              {step>i+1?'':i+1}
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:'700',color:step===i+1?'#fff':step>i+1?'var(--odoo-purple)':'var(--odoo-gray)'}}>{s}</div>
            </div>
          </div>
        ))}
      </div>

      {/* STEP 1 — Business Type */}
      {step===1&&(
        <div>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:'16px',marginBottom:'4px'}}>What type of business are you?</h3>
            <p style={{fontSize:'12px',color:'var(--odoo-gray)'}}>This defines how your ERP captures materials, production, and invoices.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px'}}>
            {BUSINESS_TYPES.map(b=>(
              <div key={b.key} onClick={()=>setBizType(b.key)}
                style={{borderRadius:'12px',padding:'20px',cursor:'pointer',transition:'all .2s',
                  border:`2px solid ${bizType===b.key?b.color:'var(--odoo-border)'}`,
                  boxShadow:bizType===b.key?`0 0 0 3px ${b.color}22`:'none',
                  position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:'4px',background:b.color,borderRadius:'12px 12px 0 0'}}></div>
                {bizType===b.key&&<div style={{position:'absolute',top:'10px',right:'10px',width:'22px',height:'22px',borderRadius:'50%',background:b.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}></div>}
                <div style={{fontSize:'28px',marginBottom:'10px'}}>{b.emoji}</div>
                <div style={{fontSize:'11px',fontWeight:'700',borderRadius:'12px',display:'inline-block',marginBottom:'8px',
                  background:b.color+'22',color:b.color}}>{b.model}</div>
                <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'6px'}}>{b.label}</div>
                <div style={{fontSize:'12px',lineHeight:'1.6'}}>{b.desc}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'16px',padding:'12px 14px',background:'#FFF3CD',borderRadius:'8px',fontSize:'12px',color:'#856404'}}>
             <strong>Most Tamil Nadu job work companies</strong> are <strong>Job Work / Processing Service</strong> — you receive customer's material, process it, and invoice for labour only.
          </div>
        </div>
      )}

      {/* STEP 2 — Sub-type & Processes */}
      {step===2&&(
        <div>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:'16px',marginBottom:'4px'}}>Select your industry sub-type & processes</h3>
            <p style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Select all processes your company performs. You can add/remove later.</p>
          </div>

          {/* Sub-type grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'20px'}}>
            {INDUSTRY_SUBTYPES.map(s=>(
              <div key={s.key} onClick={()=>{setSubType(s.key);setSelProcesses([]);setChargeBy('')}}
                style={{borderRadius:'8px',textAlign:'center',cursor:'pointer',transition:'all .18s',
                  border:`2px solid ${subType===s.key?'var(--odoo-purple)':'var(--odoo-border)'}`,
                  background:subType===s.key?'#EDE0EA':'#fff'}}>
                <div style={{fontSize:'22px',marginBottom:'6px'}}>{s.emoji}</div>
                <div style={{fontSize:'11px',fontWeight:'700',color:subType===s.key?'var(--odoo-purple)':'var(--odoo-text)',marginBottom:'3px'}}>{s.name}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Processes */}
          {sub&&(
            <div className="fi-panel" style={{marginBottom:'14px'}}>
              <div className="fi-panel-hdr">
                <h3> Processes Performed <span style={{fontSize:'10px',fontWeight:'400',marginLeft:'6px'}}>Select all that apply</span></h3>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="btn btn-s sd-bsm" onClick={loadDefaults}>Load Defaults</button>
                  <button className="btn btn-s sd-bsm" onClick={()=>setSelProcesses([])}>Clear All</button>
                  <button className="btn btn-s sd-bsm" onClick={()=>setSelProcesses(sub.processes)}>Select All</button>
                </div>
              </div>
              <div className="fi-panel-body">
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'14px'}}>
                  {sub.processes.map(p=>(
                    <div key={p} onClick={()=>toggleProcess(p)}
                      style={{padding:'6px 14px',borderRadius:'20px',border:'1px solid',cursor:'pointer',fontSize:'12px',fontWeight:'600',transition:'all .15s',display:'flex',alignItems:'center',gap:'6px',
                        borderColor:selProcesses.includes(p)?'var(--odoo-purple)':'var(--odoo-border)',
                        background:selProcesses.includes(p)?'var(--odoo-purple)':'#fff',color:selProcesses.includes(p)?'#fff':'var(--odoo-text)'}}>
                      {selProcesses.includes(p)&&<span style={{fontSize:'10px'}}></span>}
                      {p}
                    </div>
                  ))}
                </div>

                {/* Charge basis */}
                <div style={{borderTop:'1px solid var(--odoo-border)',paddingTop:'14px'}}>
                  <div style={{fontSize:'11px',fontWeight:'700',marginBottom:'8px',textTransform:'uppercase'}}>Charge Basis — How do you invoice the customer?</div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    {sub.chargeBy.map(c=>(
                      <div key={c} onClick={()=>setChargeBy(c)}
                        style={{padding:'6px 16px',borderRadius:'7px',border:'1.5px solid',cursor:'pointer',fontSize:'12px',fontWeight:'500',
                          borderColor:chargeBy===c?'var(--odoo-purple)':'var(--odoo-border)',
                          background:chargeBy===c?'var(--odoo-purple)':'#fff',color:chargeBy===c?'#fff':'var(--odoo-text)'}}>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selProcesses.length>0&&(
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3>Selected Process Sequence Preview</h3></div>
              <div className="fi-panel-body">
                <div style={{display:'flex',flexWrap:'wrap',gap:'0',alignItems:'center'}}>
                  {selProcesses.map((p,i)=>(
                    <React.Fragment key={p}>
                      <div style={{padding:'6px 12px',background:'var(--odoo-purple)',borderRadius:'4px',fontSize:'12px',fontWeight:'600'}}>{i+1}. {p}</div>
                      {i<selProcesses.length-1&&<div style={{fontSize:'16px',padding:'0 4px'}}>→</div>}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{marginTop:'10px',fontSize:'11px',color:'var(--odoo-gray)'}}> This is the default sequence. You can define custom routing per customer in the Routing Template.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Review */}
      {step===3&&(
        <div>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:'16px',marginBottom:'4px'}}>Review & Save Configuration</h3>
            <p style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Your entire PP module will be configured based on these settings.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3>Configuration Summary</h3></div>
              <div className="fi-panel-body">
                {[
                  ['Business Type', BUSINESS_TYPES.find(b=>b.key===bizType)?.label||'—'],
                  ['Industry Sub-type', sub?.name||'—'],
                  ['Total Processes', selProcesses.length+' processes configured'],
                  ['Charge Basis', chargeBy||'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                    <span style={{fontWeight:'600'}}>{k}</span>
                    <strong style={{color:'var(--odoo-purple)'}}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3> Process Flow</h3></div>
              <div className="fi-panel-body">
                {selProcesses.map((p,i)=>(
                  <div key={p} style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                    <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'var(--odoo-purple)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:'12px',fontWeight:'600'}}>{p}</span>
                    {i===0&&<span style={{marginLeft:'auto',fontSize:'10px',background:'#D1ECF1',color:'#0C5460',borderRadius:'8px',fontWeight:'700'}}>START</span>}
                    {i===selProcesses.length-1&&<span style={{marginLeft:'auto',fontSize:'10px',background:'#D4EDDA',padding:'2px 7px',borderRadius:'8px',fontWeight:'700'}}>END</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{marginTop:'14px',padding:'14px',background:'linear-gradient(135deg,var(--odoo-purple),#875A7B)',borderRadius:'10px',color:'#fff',fontSize:'12px',lineHeight:'1.8'}}>
            <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'8px'}}> What happens after Save:</div>
            <div>Work Center Master — pre-loaded with your process list</div>
            <div>Job Card form — adapts to your process sequence</div>
            <div>Smart Scheduler — routes jobs through YOUR work centers</div>
            <div>Rate Card — configured per customer × per process</div>
            <div>AI Insights — loaded with your industry knowledge</div>
          </div>
        </div>
      )}
    </div>
  )
}
